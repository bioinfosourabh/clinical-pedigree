/**
 * Clinical Pedigree Domain Model
 * Based on standard human genetics pedigree conventions (Bennett et al. 2008,
 * ACMG/NSGC pedigree standards).
 *
 * Core concepts:
 *   Individual — a person in the pedigree
 *   Union      — a parental/partner relationship between individuals
 *   PedigreeCase — the top-level clinical record
 */

// ─────────────────────────────────────────────────────────────────────────────
// Enumerations
// ─────────────────────────────────────────────────────────────────────────────

export type Sex = 'male' | 'female' | 'unknown';

/** Affected status per standard pedigree conventions */
export type AffectedStatus =
  | 'unaffected'   // open symbol
  | 'affected'     // filled symbol
  | 'carrier'      // dot (AR) or half-filled (AD) — see CarrierType
  | 'unknown';     // question mark inside symbol

/** Carrier symbol type — clinically distinct meanings */
export type CarrierType =
  | 'autosomal_recessive' // dot in center of symbol
  | 'x_linked'            // single filled quadrant
  | 'obligate'            // deduced carrier, not tested
  | 'tested_positive';    // molecular confirmation

export type DeceasedStatus = 'alive' | 'deceased' | 'unknown';

export type PregnancyStatus =
  | 'liveborn'
  | 'miscarriage'       // spontaneous abortion <20wks
  | 'stillbirth'        // fetal demise ≥20wks
  | 'terminated'        // elective termination
  | 'ectopic'
  | 'current_pregnancy' // ongoing, sex may be unknown
  | null;

export type TwinType = 'monozygotic' | 'dizygotic' | null;

export type AdoptionStatus =
  | 'not_adopted'
  | 'adopted_in'    // adopted INTO this family (bracket notation)
  | 'adopted_out'   // given up for adoption (bracket notation)
  | null;

export type RelationshipType =
  | 'biological'
  | 'consanguineous' // double line
  | 'separated'
  | 'divorced'
  | 'extramarital'; // dashed line

export type InheritancePattern =
  | 'autosomal_dominant'
  | 'autosomal_recessive'
  | 'x_linked_dominant'
  | 'x_linked_recessive'
  | 'mitochondrial'
  | 'de_novo'
  | 'digenic'
  | 'multifactorial'
  | 'unknown'
  | null;

// ─────────────────────────────────────────────────────────────────────────────
// HPO / OMIM annotation (extensible stubs for Phase 5+)
// ─────────────────────────────────────────────────────────────────────────────

export interface HPOTerm {
  id: string;      // e.g. "HP:0001250"
  label: string;   // e.g. "Seizure"
}

export interface OMIMEntry {
  mimNumber: string;  // e.g. "143100"
  title: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Individual — primary node in the pedigree graph
// ─────────────────────────────────────────────────────────────────────────────

export interface Individual {
  /** Unique stable ID (uuid) */
  id: string;

  /** Display label — typically "I-1", "II-3" etc. Auto-assigned but editable */
  label: string;

  /** Clinical/personal identifiers */
  firstName?: string;
  lastName?: string;

  sex: Sex;

  /** Year of birth (preferred over age for longitudinal records) */
  birthYear?: number;
  /** If deceased */
  deathYear?: number;
  /** Age at last exam or age at death — used when exact years unavailable */
  ageAtLastExam?: number;
  ageAtDeath?: number;

  deceasedStatus: DeceasedStatus;

  affectedStatus: AffectedStatus;
  carrierType?: CarrierType;

  /** True = proband (index case). Only one per pedigree. */
  isProband: boolean;

  /** True = consultand (individual seeking counseling, may not be proband) */
  isConsultand: boolean;

  pregnancyStatus: PregnancyStatus;

  twinType: TwinType;
  /** ID of twin sibling(s) — used to draw twin lines */
  twinWith?: string[];

  adoptionStatus: AdoptionStatus;

  /** Free-text clinical notes for this individual */
  notes?: string;

  /** Phenotype summary string (or structured HPO terms) */
  phenotypeSummary?: string;
  hpoTerms: HPOTerm[];
  omimEntries: OMIMEntry[];

  /**
   * Genotype / molecular result (free text for MVP;
   * structured in future phases)
   */
  genotypeNotes?: string;

  /**
   * Whether the sex of this individual is uncertain / unconfirmed.
   * Distinct from sex='unknown' which means sex was not recorded.
   */
  sexUnconfirmed: boolean;

  /** Generation index (0 = oldest). Computed by layout engine; stored for reference. */
  generationIndex?: number;

  /** Whether this individual's parents are unknown/not in pedigree */
  paternalLineUnknown: boolean;
  maternalLineUnknown: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Union — a partner/parental relationship
// ─────────────────────────────────────────────────────────────────────────────

export interface Union {
  /** Unique stable ID */
  id: string;

  /** IDs of the two partners. May include a sentinel "unknown_*" ID. */
  partner1Id: string;
  partner2Id: string;

  relationshipType: RelationshipType;

  /** IDs of children produced by this union */
  childrenIds: string[];

  /** Whether this union is consanguineous (double horizontal line in pedigree) */
  consanguineous: boolean;

  /** Notes specific to this union (e.g. "met 1985, separated 2002") */
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pedigree metadata
// ─────────────────────────────────────────────────────────────────────────────

export interface PedigreeMetadata {
  caseId: string;
  /** Date pedigree was first created */
  createdAt: string;
  /** Last modification */
  updatedAt: string;
  /** Genetic counselor / clinician who recorded this */
  recordedBy?: string;
  institution?: string;
  /** Clinical indication (e.g. "Developmental delay and seizures, WES requested") */
  clinicalIndication?: string;
  /** Disease / syndrome under investigation */
  suspectedDiagnosis?: string;
  inheritancePattern: InheritancePattern;
  /** Free-text family history summary */
  familyHistorySummary?: string;
  /** Notes on consanguinity background */
  consanguinityBackground?: string;
  /** Ethnicity for risk assessment */
  ethnicBackground?: string;
  /** Version for future schema migrations */
  schemaVersion: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Top-level pedigree case
// ─────────────────────────────────────────────────────────────────────────────

export interface PedigreeCase {
  metadata: PedigreeMetadata;
  individuals: Record<string, Individual>;
  unions: Record<string, Union>;
  /** Ordered list of individual IDs by generation — computed by layout engine */
  generationOrder?: string[][];
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation types
// ─────────────────────────────────────────────────────────────────────────────

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  code: string;
  severity: ValidationSeverity;
  message: string;
  /** ID of individual or union this issue relates to, if applicable */
  entityId?: string;
  entityType?: 'individual' | 'union' | 'pedigree';
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout types (used by rendering engine)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A positioned individual node ready for SVG rendering.
 * x/y are in logical pedigree units; renderer scales to pixel space.
 */
export interface LayoutNode {
  individualId: string;
  x: number;
  y: number;
  /** generation row index */
  generation: number;
  /** horizontal position within generation */
  siblingIndex: number;
}

export interface LayoutUnion {
  unionId: string;
  /** Midpoint x between the two partners */
  midX: number;
  /** y coordinate of the union line */
  y: number;
  partner1Node: LayoutNode;
  partner2Node: LayoutNode;
  childNodes: LayoutNode[];
}

export interface PedigreeLayout {
  nodes: LayoutNode[];
  unionLines: LayoutUnion[];
  /** Total canvas size in logical units */
  width: number;
  height: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// App-level UI state (not persisted in pedigree case)
// ─────────────────────────────────────────────────────────────────────────────

export interface AppUIState {
  selectedIndividualId: string | null;
  selectedUnionId: string | null;
  /** Pedigree canvas zoom level (1.0 = 100%) */
  zoom: number;
  /** Canvas pan offset in pixels */
  panX: number;
  panY: number;
  /** Whether the family member editor drawer is open */
  editorOpen: boolean;
  /** Active main panel tab */
  activePanel: 'input' | 'pedigree' | 'summary';
}
