/**
 * Pedigree Symbol Rendering Constants
 *
 * All symbol sizes, colours, and geometry follow:
 *   Bennett RL et al. (2008) "Standardized Human Pedigree Nomenclature"
 *   J Genet Couns 17:424–433
 *
 * Where the standard is silent on a detail, we follow the most common
 * practice seen in clinical genetics software (Progeny, GenoPro, GRAMPS).
 */

// ── Node geometry ─────────────────────────────────────────────────────────────

/** Half-size of a square male node */
export const NODE_HALF = 22;

/** Radius of a female circle node */
export const NODE_R = 22;

/** Horizontal spacing between sibling nodes (centre to centre) */
export const H_SPACING = 120;

/** Vertical spacing between generations (centre to centre) */
export const V_SPACING = 160;

/** Padding around the entire pedigree SVG canvas */
export const CANVAS_PADDING = 80;

// ── Colours ───────────────────────────────────────────────────────────────────

export const COLORS = {
  /** Affected fill — solid black per convention */
  affected:        '#1a1a1a',
  /** Unaffected fill — white */
  unaffected:      '#ffffff',
  /** Unknown affected status fill — light grey */
  unknown:         '#f0f4f8',
  /** Carrier dot / half-fill */
  carrier:         '#4a5568',
  /** Deceased line colour */
  deceased:        '#64748b',
  /** Proband arrow colour */
  proband:         '#0055a1',
  /** Consultand double arrow colour */
  consultand:      '#0369a1',
  /** Default node stroke */
  stroke:          '#1a1a1a',
  /** Selected node stroke */
  selected:        '#0055a1',
  /** Relationship line colour */
  line:            '#1a1a1a',
  /** Dashed line (extramarital, separated) */
  lineDash:        '#64748b',
  /** Adoption bracket colour */
  adoption:        '#1d4ed8',
  /** X-linked carrier fill */
  xlCarrier:       '#94a3b8',
  /** Mitochondrial halo */
  mito:            '#7c3aed',
  /** Background grid */
  grid:            '#e8eef4',
  /** Canvas background */
  canvas:          '#f8fafc',
} as const;

// ── Stroke widths ─────────────────────────────────────────────────────────────

export const STROKE = {
  node:        1.8,
  nodeSelected: 3,
  line:        1.8,
  deceased:    1.8,
  proband:     2,
  adoption:    1.8,
  twin:        1.8,
  mito:        2.5,
} as const;

// ── Font ──────────────────────────────────────────────────────────────────────

export const LABEL_FONT   = "'IBM Plex Mono', 'Courier New', monospace";
export const LABEL_SIZE   = 10;
export const LABEL_OFFSET = NODE_HALF + 14; // px below centre

// ── Derived geometry helpers ──────────────────────────────────────────────────

/** The vertical y of the sibship bar above children, relative to child centres */
export const SIBSHIP_DROP = V_SPACING * 0.42;

/** Y of union horizontal line relative to parent node centres */
export const UNION_Y_OFFSET = 0; // same row as parents

/** Minimum gap between partners in a union */
export const MIN_PARTNER_GAP = NODE_HALF * 2 + 20;
