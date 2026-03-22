/**
 * Clinical History Parser
 *
 * Converts free-text clinical/family history narratives into a
 * structured PedigreeCase that the renderer can display.
 *
 * Architecture:
 *   1. Sentence tokenisation
 *   2. Entity recognition (relatives, affected status, deceased, etc.)
 *   3. Relationship graph construction
 *   4. PedigreeCase assembly
 *
 * Designed to be replaced or augmented by an LLM parser later.
 * All logic is pure/deterministic — no side effects.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  PedigreeCase,
  Individual,
  Union,
  Sex,
  AffectedStatus,
  DeceasedStatus,
  PregnancyStatus,
} from '../domain/types';
import {
  createIndividual,
  createUnion,
  createPedigreeMetadata,
} from '../domain/factories';

// ─────────────────────────────────────────────────────────────────────────────
// Public output types
// ─────────────────────────────────────────────────────────────────────────────

export interface ParseWarning {
  code: string;
  message: string;
}

export interface ParseResult {
  pedigreeCase: PedigreeCase;
  warnings: ParseWarning[];
  /** Confidence 0–1. Low = many ambiguous terms. */
  confidence: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal entity types
// ─────────────────────────────────────────────────────────────────────────────

type RelativeRole =
  | 'proband'
  | 'mother' | 'father'
  | 'brother' | 'sister' | 'sibling'
  | 'maternal_grandmother' | 'maternal_grandfather'
  | 'paternal_grandmother' | 'paternal_grandfather'
  | 'maternal_aunt' | 'maternal_uncle'
  | 'paternal_aunt' | 'paternal_uncle'
  | 'son' | 'daughter' | 'child'
  | 'husband' | 'wife' | 'partner'
  | 'cousin'
  | 'half_brother' | 'half_sister'
  | 'unknown';

interface ParsedEntity {
  role: RelativeRole;
  sex: Sex;
  affectedStatus: AffectedStatus;
  deceasedStatus: DeceasedStatus;
  pregnancyStatus: PregnancyStatus;
  ageAtDeath?: number;
  age?: number;
  notes: string;
  /** Original text segment this entity was extracted from */
  sourceText: string;
  isConsanguineous?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Vocabulary tables
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_PATTERNS: Array<{ pattern: RegExp; role: RelativeRole; sex?: Sex }> = [
  // Proband / index case
  { pattern: /\b(proband|index\s+case|patient|propositus|proposita)\b/i, role: 'proband' },

  // Parents
  { pattern: /\b(mother|mum|mom|maternal\s+parent)\b/i, role: 'mother', sex: 'female' },
  { pattern: /\b(father|dad|paternal\s+parent)\b/i, role: 'father', sex: 'male' },

  // Siblings
  { pattern: /\b(older\s+)?brother\b/i, role: 'brother', sex: 'male' },
  { pattern: /\b(older\s+)?sister\b/i, role: 'sister', sex: 'female' },
  { pattern: /\b(sibling|sib)\b/i, role: 'sibling' },
  { pattern: /\bhalf[- ]brother\b/i, role: 'half_brother', sex: 'male' },
  { pattern: /\bhalf[- ]sister\b/i, role: 'half_sister', sex: 'female' },

  // Grandparents
  { pattern: /\bmaternal\s+grand\s*mother\b/i, role: 'maternal_grandmother', sex: 'female' },
  { pattern: /\bmaternal\s+grand\s*father\b/i, role: 'maternal_grandfather', sex: 'male' },
  { pattern: /\bpaternal\s+grand\s*mother\b/i, role: 'paternal_grandmother', sex: 'female' },
  { pattern: /\bpaternal\s+grand\s*father\b/i, role: 'paternal_grandfather', sex: 'male' },
  { pattern: /\bgrand\s*mother\b/i, role: 'maternal_grandmother', sex: 'female' },
  { pattern: /\bgrand\s*father\b/i, role: 'paternal_grandfather', sex: 'male' },

  // Aunts / uncles
  { pattern: /\bmaternal\s+aunt\b/i, role: 'maternal_aunt', sex: 'female' },
  { pattern: /\bmaternal\s+uncle\b/i, role: 'maternal_uncle', sex: 'male' },
  { pattern: /\bpaternal\s+aunt\b/i, role: 'paternal_aunt', sex: 'female' },
  { pattern: /\bpaternal\s+uncle\b/i, role: 'paternal_uncle', sex: 'male' },
  { pattern: /\baunt\b/i, role: 'maternal_aunt', sex: 'female' },
  { pattern: /\buncle\b/i, role: 'maternal_uncle', sex: 'male' },

  // Children
  { pattern: /\bson\b/i, role: 'son', sex: 'male' },
  { pattern: /\bdaughter\b/i, role: 'daughter', sex: 'female' },
  { pattern: /\bchild(ren)?\b/i, role: 'child' },

  // Partners
  { pattern: /\b(husband|spouse)\b/i, role: 'husband', sex: 'male' },
  { pattern: /\b(wife)\b/i, role: 'wife', sex: 'female' },
  { pattern: /\b(partner)\b/i, role: 'partner' },

  // Cousins
  { pattern: /\b(first\s+)?cousin\b/i, role: 'cousin' },
];

const AFFECTED_POSITIVE = /\b(affected|diagnosed|has|have|presents?\s+with|suffers?\s+from|positive\s+for|confirmed|known\s+case\s+of|carries?\s+the|carrier\s+of|carrier)\b/i;
const AFFECTED_NEGATIVE = /\b(unaffected|healthy|normal|not\s+affected|no\s+symptoms|well|asymptomatic|negative\s+for|tested\s+negative)\b/i;
const DECEASED_TERMS    = /\b(died|deceased|death|passed\s+away|dead|RIP|postmortem|autopsy)\b/i;
const AGE_AT_DEATH      = /\b(?:died|death|passed)\s+(?:at\s+)?(?:age\s+)?(\d{1,3})\b/i;
const CURRENT_AGE       = /\b(?:aged?|age)\s+(\d{1,3})\b/i;
const MISCARRIAGE_TERMS = /\b(miscarriage|spontaneous\s+abortion|SAB|pregnancy\s+loss)\b/i;
const STILLBIRTH_TERMS  = /\b(stillbirth|stillborn|fetal\s+demise|intrauterine\s+death)\b/i;
const TERMINATION_TERMS = /\b(termination|TOP|TFMR|elective\s+termination|abortion)\b/i;
const CONSANGUINITY     = /\b(consangu|related|cousin\s+marriage|first\s+cousin|second\s+cousin|family\s+marriage|close\s+relative)\b/i;

// ─────────────────────────────────────────────────────────────────────────────
// Main parse function
// ─────────────────────────────────────────────────────────────────────────────

export function parseClinicaHistory(text: string): ParseResult {
  const warnings: ParseWarning[] = [];
  const sentences = tokeniseSentences(text);

  // ── Extract entities ───────────────────────────────────────────────────────
  const entities: ParsedEntity[] = [];
  const isConsanguineous = CONSANGUINITY.test(text);

  sentences.forEach((sentence) => {
    const found = extractEntities(sentence, warnings);
    entities.push(...found);
  });

  if (entities.length === 0) {
    warnings.push({
      code: 'NO_ENTITIES',
      message: 'No recognisable family members found. Try mentioning "proband", "mother", "father", "brother", "sister", etc.',
    });
    return {
      pedigreeCase: buildEmptyCase(text),
      warnings,
      confidence: 0,
    };
  }

  // ── Deduplicate roles (keep first occurrence per role) ─────────────────────
  const seen = new Set<string>();
  const deduped = entities.filter((e) => {
    const key = e.role;
    if (seen.has(key) && !['brother','sister','sibling','son','daughter','child','cousin'].includes(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  // ── Build pedigree graph ───────────────────────────────────────────────────
  const result = buildPedigreeCase(deduped, text, isConsanguineous, warnings);

  // ── Confidence scoring ─────────────────────────────────────────────────────
  const hasProband = deduped.some((e) => e.role === 'proband');
  const hasParents = deduped.some((e) => e.role === 'mother' || e.role === 'father');
  const entityScore = Math.min(deduped.length / 5, 1);
  const confidence = (hasProband ? 0.4 : 0.1) + (hasParents ? 0.3 : 0) + entityScore * 0.3;

  if (!hasProband) {
    warnings.push({
      code: 'NO_PROBAND',
      message: 'No proband / index case identified. The most likely affected individual has been marked as proband.',
    });
  }

  return { pedigreeCase: result, warnings, confidence: Math.min(confidence, 1) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sentence tokeniser
// ─────────────────────────────────────────────────────────────────────────────

function tokeniseSentences(text: string): string[] {
  // Split on sentence boundaries and semicolons, preserve clause context
  return text
    .split(/[.;]\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
}

// ─────────────────────────────────────────────────────────────────────────────
// Entity extractor — processes one sentence
// ─────────────────────────────────────────────────────────────────────────────

function extractEntities(sentence: string, warnings: ParseWarning[]): ParsedEntity[] {
  const found: ParsedEntity[] = [];

  for (const { pattern, role, sex: roleSex } of ROLE_PATTERNS) {
    if (!pattern.test(sentence)) continue;

    // Determine affected status
    let affectedStatus: AffectedStatus = 'unknown';
    if (AFFECTED_POSITIVE.test(sentence)) affectedStatus = 'affected';
    if (AFFECTED_NEGATIVE.test(sentence)) affectedStatus = 'unaffected';

    // Carrier detection (overrides affected if "carrier" is mentioned without other affected terms)
    if (/\bcarrier\b/i.test(sentence) && !/\baffected\s+carrier\b/i.test(sentence)) {
      affectedStatus = 'carrier';
    }

    // Deceased
    let deceasedStatus: DeceasedStatus = 'unknown';
    if (DECEASED_TERMS.test(sentence)) deceasedStatus = 'deceased';

    // Age at death
    let ageAtDeath: number | undefined;
    const ageDeathMatch = sentence.match(AGE_AT_DEATH);
    if (ageDeathMatch) ageAtDeath = parseInt(ageDeathMatch[1]);

    // Current age
    let age: number | undefined;
    const ageMatch = sentence.match(CURRENT_AGE);
    if (ageMatch && !ageDeathMatch) age = parseInt(ageMatch[1]);

    // Pregnancy loss events
    let pregnancyStatus: PregnancyStatus = null;
    if (MISCARRIAGE_TERMS.test(sentence)) pregnancyStatus = 'miscarriage';
    if (STILLBIRTH_TERMS.test(sentence))  pregnancyStatus = 'stillbirth';
    if (TERMINATION_TERMS.test(sentence)) pregnancyStatus = 'terminated';

    // Sex inference
    let sex: Sex = roleSex ?? inferSex(sentence);

    found.push({
      role,
      sex,
      affectedStatus,
      deceasedStatus,
      pregnancyStatus,
      ageAtDeath,
      age,
      notes: sentence,
      sourceText: sentence,
    });

    // Only match first role pattern per sentence to avoid double-counting
    break;
  }

  return found;
}

function inferSex(sentence: string): Sex {
  if (/\b(he|him|his|male|boy|man|son)\b/i.test(sentence)) return 'male';
  if (/\b(she|her|hers|female|girl|woman|daughter)\b/i.test(sentence)) return 'female';
  return 'unknown';
}

// ─────────────────────────────────────────────────────────────────────────────
// Pedigree graph builder
// ─────────────────────────────────────────────────────────────────────────────

function buildPedigreeCase(
  entities: ParsedEntity[],
  rawText: string,
  isConsanguineous: boolean,
  warnings: ParseWarning[]
): PedigreeCase {
  const individuals: Record<string, Individual> = {};
  const unions: Record<string, Union> = {};

  // ── Helper: create and register an individual ───────────────────────────
  const makeIndividual = (
    overrides: Partial<Individual>
  ): Individual => {
    const ind = createIndividual(overrides);
    individuals[ind.id] = ind;
    return ind;
  };

  // ── Helper: create and register a union ────────────────────────────────
  const makeUnion = (
    p1Id: string,
    p2Id: string,
    childIds: string[] = [],
    options: Partial<Union> = {}
  ): Union => {
    const u = createUnion(p1Id, p2Id, { childrenIds: childIds, ...options });
    unions[u.id] = u;
    return u;
  };

  // ── Find or create key family members ─────────────────────────────────

  const findEntity = (roles: RelativeRole[]) =>
    entities.find((e) => roles.includes(e.role));

  const probandEntity = findEntity(['proband']) ??
    entities.find((e) => e.affectedStatus === 'affected') ??
    entities[0];

  // Determine proband sex
  const probandSex: Sex = probandEntity?.sex ?? 'unknown';

  // Create core individuals
  const proband = makeIndividual({
    label: '',
    sex: probandSex,
    affectedStatus: probandEntity?.affectedStatus ?? 'affected',
    deceasedStatus: probandEntity?.deceasedStatus ?? 'alive',
    isProband: true,
    notes: probandEntity?.notes,
    generationIndex: 1,
  });

  const motherEntity = findEntity(['mother']);
  const fatherEntity = findEntity(['father']);

  // Always create both parents to anchor the pedigree
  const mother = makeIndividual({
    label: '',
    sex: 'female',
    affectedStatus: motherEntity?.affectedStatus ?? 'unknown',
    deceasedStatus: motherEntity?.deceasedStatus ?? 'unknown',
    notes: motherEntity?.notes,
    generationIndex: 0,
  });

  const father = makeIndividual({
    label: '',
    sex: 'male',
    affectedStatus: fatherEntity?.affectedStatus ?? 'unknown',
    deceasedStatus: fatherEntity?.deceasedStatus ?? 'unknown',
    notes: fatherEntity?.notes,
    generationIndex: 0,
  });

  // Parental union
  const parentalUnion = makeUnion(father.id, mother.id, [proband.id], {
    consanguineous: isConsanguineous,
  });

  // ── Siblings ────────────────────────────────────────────────────────────
  const siblingEntities = entities.filter((e) =>
    ['brother', 'sister', 'sibling', 'half_brother', 'half_sister'].includes(e.role)
  );

  siblingEntities.forEach((se, idx) => {
    const sib = makeIndividual({
      label: '',
      sex: se.sex,
      affectedStatus: se.affectedStatus,
      deceasedStatus: se.deceasedStatus,
      pregnancyStatus: se.pregnancyStatus,
      notes: se.notes,
      generationIndex: 1,
    });
    parentalUnion.childrenIds.push(sib.id);
  });

  // ── Grandparents ────────────────────────────────────────────────────────
  const mgmEntity = findEntity(['maternal_grandmother']);
  const mgfEntity = findEntity(['maternal_grandfather']);
  const pgmEntity = findEntity(['paternal_grandmother']);
  const pgfEntity = findEntity(['paternal_grandfather']);

  if (mgmEntity || mgfEntity) {
    const mgm = makeIndividual({
      label: '', sex: 'female',
      affectedStatus: mgmEntity?.affectedStatus ?? 'unknown',
      deceasedStatus: mgmEntity?.deceasedStatus ?? 'unknown',
      notes: mgmEntity?.notes,
      generationIndex: -1,
    });
    const mgf = makeIndividual({
      label: '', sex: 'male',
      affectedStatus: mgfEntity?.affectedStatus ?? 'unknown',
      deceasedStatus: mgfEntity?.deceasedStatus ?? 'unknown',
      notes: mgfEntity?.notes,
      generationIndex: -1,
    });
    makeUnion(mgf.id, mgm.id, [mother.id]);
  }

  if (pgmEntity || pgfEntity) {
    const pgm = makeIndividual({
      label: '', sex: 'female',
      affectedStatus: pgmEntity?.affectedStatus ?? 'unknown',
      deceasedStatus: pgmEntity?.deceasedStatus ?? 'unknown',
      notes: pgmEntity?.notes,
      generationIndex: -1,
    });
    const pgf = makeIndividual({
      label: '', sex: 'male',
      affectedStatus: pgfEntity?.affectedStatus ?? 'unknown',
      deceasedStatus: pgfEntity?.deceasedStatus ?? 'unknown',
      notes: pgfEntity?.notes,
      generationIndex: -1,
    });
    makeUnion(pgf.id, pgm.id, [father.id]);
  }

  // ── Aunts / uncles ──────────────────────────────────────────────────────
  const auEntities = entities.filter((e) =>
    ['maternal_aunt', 'maternal_uncle', 'paternal_aunt', 'paternal_uncle'].includes(e.role)
  );

  // Group maternal vs paternal to share grandparent unions
  const maternalAU = auEntities.filter((e) => e.role.startsWith('maternal'));
  const paternalAU = auEntities.filter((e) => e.role.startsWith('paternal'));

  if (maternalAU.length > 0) {
    // Find or create maternal grandparent union
    let mGrandUnion = Object.values(unions).find((u) =>
      individuals[u.partner1Id]?.sex === 'male' &&
      individuals[u.partner2Id]?.sex === 'female' &&
      u.childrenIds.includes(mother.id)
    );

    if (!mGrandUnion) {
      const mgm2 = makeIndividual({ label: '', sex: 'female', affectedStatus: 'unknown', deceasedStatus: 'unknown', generationIndex: -1 });
      const mgf2 = makeIndividual({ label: '', sex: 'male', affectedStatus: 'unknown', deceasedStatus: 'unknown', generationIndex: -1 });
      mGrandUnion = makeUnion(mgf2.id, mgm2.id, [mother.id]);
    }

    maternalAU.forEach((au) => {
      const auperson = makeIndividual({
        label: '', sex: au.sex,
        affectedStatus: au.affectedStatus,
        deceasedStatus: au.deceasedStatus,
        notes: au.notes,
        generationIndex: 0,
      });
      mGrandUnion!.childrenIds.push(auperson.id);
    });
  }

  if (paternalAU.length > 0) {
    let pGrandUnion = Object.values(unions).find((u) =>
      individuals[u.partner1Id]?.sex === 'male' &&
      individuals[u.partner2Id]?.sex === 'female' &&
      u.childrenIds.includes(father.id)
    );

    if (!pGrandUnion) {
      const pgm2 = makeIndividual({ label: '', sex: 'female', affectedStatus: 'unknown', deceasedStatus: 'unknown', generationIndex: -1 });
      const pgf2 = makeIndividual({ label: '', sex: 'male', affectedStatus: 'unknown', deceasedStatus: 'unknown', generationIndex: -1 });
      pGrandUnion = makeUnion(pgf2.id, pgm2.id, [father.id]);
    }

    paternalAU.forEach((au) => {
      const auperson = makeIndividual({
        label: '', sex: au.sex,
        affectedStatus: au.affectedStatus,
        deceasedStatus: au.deceasedStatus,
        notes: au.notes,
        generationIndex: 0,
      });
      pGrandUnion!.childrenIds.push(auperson.id);
    });
  }

  // ── Children of proband ─────────────────────────────────────────────────
  const childEntities = entities.filter((e) =>
    ['son', 'daughter', 'child'].includes(e.role)
  );

  if (childEntities.length > 0) {
    // Create an unknown partner for the proband
    const probandPartner = makeIndividual({
      label: '', sex: probandSex === 'male' ? 'female' : 'male',
      affectedStatus: 'unknown', deceasedStatus: 'unknown', generationIndex: 2,
    });
    const probandUnion = makeUnion(proband.id, probandPartner.id, []);

    childEntities.forEach((ce) => {
      const child = makeIndividual({
        label: '', sex: ce.sex,
        affectedStatus: ce.affectedStatus,
        deceasedStatus: ce.deceasedStatus,
        notes: ce.notes,
        generationIndex: 2,
      });
      probandUnion.childrenIds.push(child.id);
    });
  }

  // ── Auto-label all individuals ──────────────────────────────────────────
  autoLabel(individuals, unions);

  // ── Build metadata from raw text ───────────────────────────────────────
  const inheritanceGuess = guessInheritance(entities);

  return {
    metadata: createPedigreeMetadata({
      clinicalIndication: rawText.slice(0, 300),
      inheritancePattern: inheritanceGuess,
      familyHistorySummary: rawText,
    }),
    individuals,
    unions,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Auto-label individuals by generation
// ─────────────────────────────────────────────────────────────────────────────

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

function autoLabel(
  individuals: Record<string, Individual>,
  unions: Record<string, Union>
): void {
  // Group by generationIndex
  const byGen: Record<number, Individual[]> = {};
  Object.values(individuals).forEach((ind) => {
    const g = ind.generationIndex ?? 1;
    if (!byGen[g]) byGen[g] = [];
    byGen[g].push(ind);
  });

  // Remap generation indices to 0-based roman
  const sortedGens = Object.keys(byGen)
    .map(Number)
    .sort((a, b) => a - b);

  sortedGens.forEach((gen, romanIdx) => {
    byGen[gen].forEach((ind, pos) => {
      const label = `${ROMAN[romanIdx] ?? `G${romanIdx + 1}`}-${pos + 1}`;
      individuals[ind.id] = { ...ind, label };
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Heuristic inheritance pattern guesser
// ─────────────────────────────────────────────────────────────────────────────

function guessInheritance(
  entities: ParsedEntity[]
): import('../domain/types').InheritancePattern {
  const rawText = entities.map((e) => e.notes).join(' ');
  if (/\b(X-linked|x\s+linked|XLR|XLD)\b/i.test(rawText)) {
    return /recessive/i.test(rawText) ? 'x_linked_recessive' : 'x_linked_dominant';
  }
  if (/\b(mitochondrial|mtDNA|maternal\s+lineage)\b/i.test(rawText)) return 'mitochondrial';
  if (/\bde\s+novo\b/i.test(rawText)) return 'de_novo';
  if (/\b(consangu|cousin\s+marriage)\b/i.test(rawText)) return 'autosomal_recessive';
  if (/\b(autosomal\s+recessive|AR)\b/i.test(rawText)) return 'autosomal_recessive';
  if (/\b(autosomal\s+dominant|AD)\b/i.test(rawText)) return 'autosomal_dominant';

  // Heuristic: if both parents unaffected but child affected → likely AR or de novo
  const motherAff = entities.find((e) => e.role === 'mother')?.affectedStatus;
  const fatherAff = entities.find((e) => e.role === 'father')?.affectedStatus;
  const probandAff = entities.find((e) => e.role === 'proband')?.affectedStatus;
  if (
    probandAff === 'affected' &&
    motherAff === 'unaffected' &&
    fatherAff === 'unaffected'
  ) {
    return 'autosomal_recessive';
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty case for zero-entity result
// ─────────────────────────────────────────────────────────────────────────────

function buildEmptyCase(rawText: string): PedigreeCase {
  return {
    metadata: createPedigreeMetadata({
      clinicalIndication: rawText.slice(0, 200),
      familyHistorySummary: rawText,
      inheritancePattern: null,
    }),
    individuals: {},
    unions: {},
  };
}
