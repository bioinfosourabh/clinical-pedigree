/**
 * Factory functions for domain entities.
 * All defaults are clinically appropriate for a new, unknown individual.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  Individual,
  Union,
  PedigreeCase,
  PedigreeMetadata,
} from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Individual factory
// ─────────────────────────────────────────────────────────────────────────────

export function createIndividual(
  overrides: Partial<Individual> = {}
): Individual {
  return {
    id: uuidv4(),
    label: '',
    sex: 'unknown',
    deceasedStatus: 'unknown',
    affectedStatus: 'unknown',
    isProband: false,
    isConsultand: false,
    pregnancyStatus: null,
    twinType: null,
    adoptionStatus: 'not_adopted',
    hpoTerms: [],
    omimEntries: [],
    sexUnconfirmed: false,
    paternalLineUnknown: false,
    maternalLineUnknown: false,
    ...overrides,
  };
}

/**
 * Create a sentinel "unknown parent" individual.
 * These are used when one parent is not in the pedigree
 * but we need a union node for the known parent's children.
 */
export function createUnknownParent(sex: 'male' | 'female'): Individual {
  return createIndividual({
    id: `unknown_${sex}_${uuidv4()}`,
    label: '?',
    sex,
    deceasedStatus: 'unknown',
    affectedStatus: 'unknown',
    paternalLineUnknown: true,
    maternalLineUnknown: true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Union factory
// ─────────────────────────────────────────────────────────────────────────────

export function createUnion(
  partner1Id: string,
  partner2Id: string,
  overrides: Partial<Union> = {}
): Union {
  return {
    id: uuidv4(),
    partner1Id,
    partner2Id,
    relationshipType: 'biological',
    childrenIds: [],
    consanguineous: false,
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PedigreeCase factory
// ─────────────────────────────────────────────────────────────────────────────

export function createPedigreeMetadata(
  overrides: Partial<PedigreeMetadata> = {}
): PedigreeMetadata {
  const now = new Date().toISOString();
  return {
    caseId: uuidv4(),
    createdAt: now,
    updatedAt: now,
    inheritancePattern: null,
    schemaVersion: '1.0.0',
    ...overrides,
  };
}

export function createEmptyCase(): PedigreeCase {
  return {
    metadata: createPedigreeMetadata(),
    individuals: {},
    unions: {},
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Auto-label generation
// ─────────────────────────────────────────────────────────────────────────────

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

/**
 * Generate standard pedigree labels (I-1, I-2, II-1 …) based on
 * the generation index and position within that generation.
 */
export function generateLabel(
  generationIndex: number,
  positionInGeneration: number
): string {
  const gen = ROMAN[generationIndex] ?? `G${generationIndex + 1}`;
  return `${gen}-${positionInGeneration + 1}`;
}

/**
 * Re-label all individuals in a case using standard pedigree notation.
 * Called after layout computation.
 */
export function relabelCase(
  pedigreeCase: PedigreeCase,
  generationOrder: string[][]
): PedigreeCase {
  const updated = { ...pedigreeCase };
  const updatedIndividuals = { ...pedigreeCase.individuals };

  generationOrder.forEach((genGroup, genIndex) => {
    genGroup.forEach((id, pos) => {
      if (updatedIndividuals[id]) {
        updatedIndividuals[id] = {
          ...updatedIndividuals[id],
          label: generateLabel(genIndex, pos),
          generationIndex: genIndex,
        };
      }
    });
  });

  updated.individuals = updatedIndividuals;
  updated.generationOrder = generationOrder;
  return updated;
}
