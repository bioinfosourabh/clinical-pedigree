/**
 * Individual Symbol Renderer
 *
 * Each function returns an SVG <g> element (as JSX) representing a single
 * pedigree symbol with all clinical overlays applied.
 *
 * Symbol types (Bennett 2008):
 *   Male     → square
 *   Female   → circle
 *   Unknown  → rotated square (diamond / rhombus)
 *
 * Overlays (stacked in order):
 *   1. Selection ring
 *   2. Adoption brackets
 *   3. Base shape (fill encodes affected status)
 *   4. X-linked carrier half-fill
 *   5. Mitochondrial halo
 *   6. Carrier central dot (AR) or quadrant fill (XL)
 *   7. Unknown-status question mark
 *   8. Deceased diagonal slash
 *   9. Proband / consultand arrow
 *  10. Twin bracket line hook (rendered at union level)
 *  11. Label (pedigree ID) below node
 */

import React from 'react';
import type { Individual, LayoutNode } from '../domain/types';
import {
  NODE_HALF,
  NODE_R,
  COLORS,
  STROKE,
  LABEL_FONT,
  LABEL_SIZE,
  LABEL_OFFSET,
} from './constants';

// ─────────────────────────────────────────────────────────────────────────────
// Public entry point
// ─────────────────────────────────────────────────────────────────────────────

export interface SymbolProps {
  node: LayoutNode;
  individual: Individual;
  selected: boolean;
  onSelect: (id: string) => void;
  /** Inheritance pattern of the case — affects some symbol fills */
  inheritancePattern?: string | null;
}

export function IndividualSymbol({
  node,
  individual,
  selected,
  onSelect,
  inheritancePattern,
}: SymbolProps) {
  const { x, y } = node;
  const isXLinked =
    inheritancePattern === 'x_linked_recessive' ||
    inheritancePattern === 'x_linked_dominant';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(individual.id);
  };

  return (
    <g
      id={`node-${individual.id}`}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
      role="button"
      aria-label={`Individual ${individual.label}`}
    >
      {/* Defs for this node's clip/pattern */}
      <NodeDefs individual={individual} x={x} y={y} isXLinked={isXLinked} />

      {/* Layer 1 — Selection ring */}
      {selected && <SelectionRing x={x} y={y} sex={individual.sex} />}

      {/* Layer 2 — Adoption brackets (behind the node) */}
      {individual.adoptionStatus && individual.adoptionStatus !== 'not_adopted' && (
        <AdoptionBrackets x={x} y={y} type={individual.adoptionStatus} />
      )}

      {/* Layer 3+4+5 — Base shape */}
      <BaseShape
        x={x}
        y={y}
        individual={individual}
        isXLinked={isXLinked}
        selected={selected}
      />

      {/* Layer 6 — Carrier overlays */}
      {individual.affectedStatus === 'carrier' && (
        <CarrierOverlay
          x={x}
          y={y}
          sex={individual.sex}
          carrierType={individual.carrierType}
          isXLinked={isXLinked}
        />
      )}

      {/* Layer 7 — Unknown ? */}
      {individual.affectedStatus === 'unknown' && (
        <UnknownMark x={x} y={y} />
      )}

      {/* Layer 8 — Deceased slash */}
      {individual.deceasedStatus === 'deceased' && (
        <DeceasedSlash x={x} y={y} sex={individual.sex} />
      )}

      {/* Layer 9 — Proband / consultand arrow */}
      {individual.isProband && <ProbandArrow x={x} y={y} />}
      {individual.isConsultand && !individual.isProband && (
        <ConsultandArrow x={x} y={y} />
      )}

      {/* Layer 10 — Pregnancy event label */}
      {individual.pregnancyStatus &&
        individual.pregnancyStatus !== 'liveborn' && (
          <PregnancyLabel x={x} y={y} status={individual.pregnancyStatus} />
        )}

      {/* Layer 11 — Pedigree ID label */}
      <NodeLabel x={x} y={y} label={individual.label} individual={individual} />
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG defs (clip paths, gradients) for this node
// ─────────────────────────────────────────────────────────────────────────────

function NodeDefs({
  individual,
  x,
  y,
  isXLinked,
}: {
  individual: Individual;
  x: number;
  y: number;
  isXLinked: boolean;
}) {
  if (!isXLinked || individual.affectedStatus !== 'carrier') return null;

  // Half-fill clip for X-linked carrier females (left half filled)
  return (
    <defs>
      <clipPath id={`xl-clip-${individual.id}`}>
        <rect x={x - NODE_R} y={y - NODE_R} width={NODE_R} height={NODE_R * 2} />
      </clipPath>
    </defs>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Selection ring
// ─────────────────────────────────────────────────────────────────────────────

function SelectionRing({
  x,
  y,
  sex,
}: {
  x: number;
  y: number;
  sex: string;
}) {
  const pad = 9;
  if (sex === 'female') {
    return (
      <circle
        cx={x}
        cy={y}
        r={NODE_R + pad}
        fill="none"
        stroke={COLORS.selected}
        strokeWidth={1.5}
        strokeDasharray="5 3"
        opacity={0.8}
      />
    );
  }
  return (
    <rect
      x={x - NODE_HALF - pad}
      y={y - NODE_HALF - pad}
      width={(NODE_HALF + pad) * 2}
      height={(NODE_HALF + pad) * 2}
      fill="none"
      stroke={COLORS.selected}
      strokeWidth={1.5}
      strokeDasharray="5 3"
      rx={3}
      opacity={0.8}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Adoption brackets
// ─────────────────────────────────────────────────────────────────────────────

function AdoptionBrackets({
  x,
  y,
  type,
}: {
  x: number;
  y: number;
  type: string;
}) {
  const h = NODE_HALF;
  const bx = h + 10; // bracket x offset from centre
  const by = h - 5;  // bracket vertical reach
  const dash = type === 'adopted_out' ? '4 3' : undefined;

  const bracketProps = {
    stroke: COLORS.adoption,
    strokeWidth: STROKE.adoption,
    fill: 'none' as const,
    strokeDasharray: dash,
    strokeLinecap: 'square' as const,
  };

  return (
    <g>
      {/* Left bracket */}
      <path
        d={`M ${x - bx + 5} ${y - by} L ${x - bx} ${y - by} L ${x - bx} ${y + by} L ${x - bx + 5} ${y + by}`}
        {...bracketProps}
      />
      {/* Right bracket */}
      <path
        d={`M ${x + bx - 5} ${y - by} L ${x + bx} ${y - by} L ${x + bx} ${y + by} L ${x + bx - 5} ${y + by}`}
        {...bracketProps}
      />
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Base shape — encodes affected status via fill
// ─────────────────────────────────────────────────────────────────────────────

function BaseShape({
  x,
  y,
  individual,
  isXLinked,
  selected,
}: {
  x: number;
  y: number;
  individual: Individual;
  isXLinked: boolean;
  selected: boolean;
}) {
  const { sex, affectedStatus, pregnancyStatus } = individual;

  const strokeColor = selected ? COLORS.selected : COLORS.stroke;
  const strokeWidth = selected ? STROKE.nodeSelected : STROKE.node;

  // ── Fill logic ────────────────────────────────────────────────
  let fill: string;
  if (affectedStatus === 'affected') {
    fill = COLORS.affected;
  } else if (affectedStatus === 'carrier' && isXLinked && sex === 'female') {
    fill = COLORS.unaffected; // X-linked carrier: white base, half-fill applied as overlay
  } else if (affectedStatus === 'carrier') {
    fill = COLORS.unaffected; // AR carrier: white base, central dot applied as overlay
  } else if (affectedStatus === 'unaffected') {
    fill = COLORS.unaffected;
  } else {
    fill = COLORS.unknown;
  }

  // ── Pregnancy loss symbols ─────────────────────────────────────
  if (
    pregnancyStatus === 'miscarriage' ||
    pregnancyStatus === 'terminated' ||
    pregnancyStatus === 'ectopic'
  ) {
    // Small downward-pointing triangle (miscarriage)
    const size = NODE_HALF * 0.75;
    const terminated = pregnancyStatus === 'terminated';
    return (
      <g>
        <polygon
          points={`${x},${y + size} ${x - size},${y - size * 0.6} ${x + size},${y - size * 0.6}`}
          fill={terminated ? COLORS.carrier : COLORS.unknown}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
        {terminated && (
          <line
            x1={x - size - 4}
            y1={y - size * 0.6 - 5}
            x2={x + size + 4}
            y2={y - size * 0.6 - 5}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        )}
      </g>
    );
  }

  if (pregnancyStatus === 'stillbirth') {
    // Filled diamond — larger than miscarriage, filled
    const d = NODE_HALF * 0.85;
    return (
      <polygon
        points={`${x},${y - d} ${x + d},${y} ${x},${y + d} ${x - d},${y}`}
        fill={COLORS.carrier}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
    );
  }

  if (pregnancyStatus === 'current_pregnancy') {
    // Diamond outline — dashed
    const d = NODE_HALF * 0.9;
    return (
      <polygon
        points={`${x},${y - d} ${x + d},${y} ${x},${y + d} ${x - d},${y}`}
        fill="#eff6ff"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray="4 2"
      />
    );
  }

  // ── Standard sex-based shapes ─────────────────────────────────
  if (sex === 'male') {
    return (
      <rect
        x={x - NODE_HALF}
        y={y - NODE_HALF}
        width={NODE_HALF * 2}
        height={NODE_HALF * 2}
        fill={fill}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        rx={2}
      />
    );
  }

  if (sex === 'female') {
    return (
      <circle
        cx={x}
        cy={y}
        r={NODE_R}
        fill={fill}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
    );
  }

  // Unknown sex — diamond (rotated square)
  const d = NODE_HALF * 0.9;
  return (
    <polygon
      points={`${x},${y - d} ${x + d},${y} ${x},${y + d} ${x - d},${y}`}
      fill={fill}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Carrier overlays
// ─────────────────────────────────────────────────────────────────────────────

function CarrierOverlay({
  x,
  y,
  sex,
  carrierType,
  isXLinked,
}: {
  x: number;
  y: number;
  sex: string;
  carrierType: string | undefined;
  isXLinked: boolean;
}) {
  // X-linked carrier female → left half of circle filled
  if (isXLinked && sex === 'female') {
    return (
      <path
        d={`M ${x} ${y - NODE_R} A ${NODE_R} ${NODE_R} 0 0 0 ${x} ${y + NODE_R} Z`}
        fill={COLORS.carrier}
        pointerEvents="none"
      />
    );
  }

  // X-linked carrier male (affected, not carrier in strict sense — but handle gracefully)
  if (isXLinked && sex === 'male') {
    return (
      <rect
        x={x - NODE_HALF}
        y={y - NODE_HALF}
        width={NODE_HALF}
        height={NODE_HALF * 2}
        fill={COLORS.carrier}
        pointerEvents="none"
      />
    );
  }

  // Autosomal recessive / default carrier → central filled dot
  const dotR = NODE_R * 0.32;
  return (
    <circle
      cx={x}
      cy={y}
      r={dotR}
      fill={COLORS.carrier}
      pointerEvents="none"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Unknown status mark
// ─────────────────────────────────────────────────────────────────────────────

function UnknownMark({ x, y }: { x: number; y: number }) {
  return (
    <text
      x={x}
      y={y + 4}
      textAnchor="middle"
      fontSize={14}
      fontFamily={LABEL_FONT}
      fontWeight="600"
      fill="#94a3b8"
      pointerEvents="none"
    >
      ?
    </text>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Deceased diagonal slash
// ─────────────────────────────────────────────────────────────────────────────

function DeceasedSlash({
  x,
  y,
  sex,
}: {
  x: number;
  y: number;
  sex: string;
}) {
  const extend = 8; // how far the slash extends beyond the node boundary
  const h = NODE_HALF + extend;

  return (
    <line
      x1={x - h}
      y1={y + h}
      x2={x + h}
      y2={y - h}
      stroke={COLORS.deceased}
      strokeWidth={STROKE.deceased}
      strokeLinecap="round"
      pointerEvents="none"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Proband arrow
// ─────────────────────────────────────────────────────────────────────────────

function ProbandArrow({ x, y }: { x: number; y: number }) {
  // Arrow points toward the bottom-left corner of the node
  const arrowLen = 32;
  const ex = x - NODE_HALF - arrowLen * 0.7;
  const ey = y + NODE_HALF + arrowLen * 0.7;
  const tx = x - NODE_HALF - 3;
  const ty = y + NODE_HALF + 3;

  return (
    <g pointerEvents="none">
      <defs>
        <marker
          id="proband-arrowhead"
          markerWidth={8}
          markerHeight={8}
          refX={6}
          refY={3}
          orient="auto"
        >
          <path d="M0,0 L0,6 L8,3 Z" fill={COLORS.proband} />
        </marker>
      </defs>
      <line
        x1={ex}
        y1={ey}
        x2={tx}
        y2={ty}
        stroke={COLORS.proband}
        strokeWidth={STROKE.proband}
        markerEnd="url(#proband-arrowhead)"
      />
      <text
        x={ex - 2}
        y={ey + 12}
        textAnchor="middle"
        fontSize={8.5}
        fontFamily={LABEL_FONT}
        fill={COLORS.proband}
        fontWeight="600"
      >
        P
      </text>
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Consultand arrow (double arrow)
// ─────────────────────────────────────────────────────────────────────────────

function ConsultandArrow({ x, y }: { x: number; y: number }) {
  const arrowLen = 28;
  const ex = x - NODE_HALF - arrowLen * 0.7;
  const ey = y + NODE_HALF + arrowLen * 0.7;
  const tx = x - NODE_HALF - 3;
  const ty = y + NODE_HALF + 3;

  return (
    <g pointerEvents="none">
      <defs>
        <marker
          id="consultand-arrowhead"
          markerWidth={8}
          markerHeight={8}
          refX={6}
          refY={3}
          orient="auto"
        >
          <path d="M0,0 L0,6 L8,3 Z" fill={COLORS.consultand} />
        </marker>
      </defs>
      <line
        x1={ex}
        y1={ey}
        x2={tx}
        y2={ty}
        stroke={COLORS.consultand}
        strokeWidth={STROKE.proband}
        markerEnd="url(#consultand-arrowhead)"
      />
      <line
        x1={ex + 3}
        y1={ey + 3}
        x2={tx + 3}
        y2={ty + 3}
        stroke={COLORS.consultand}
        strokeWidth={STROKE.proband}
        markerEnd="url(#consultand-arrowhead)"
      />
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pregnancy event label (small text below symbol)
// ─────────────────────────────────────────────────────────────────────────────

function PregnancyLabel({
  x,
  y,
  status,
}: {
  x: number;
  y: number;
  status: NonNullable<Individual['pregnancyStatus']>;
}) {
  const LABELS: Partial<Record<NonNullable<Individual['pregnancyStatus']>, string>> = {
    miscarriage:      'SAB',
    stillbirth:       'SB',
    terminated:       'TOP',
    ectopic:          'EC',
    current_pregnancy:'P?',
  };
  const text = LABELS[status];
  if (!text) return null;

  return (
    <text
      x={x}
      y={y + NODE_HALF + 26}
      textAnchor="middle"
      fontSize={8}
      fontFamily={LABEL_FONT}
      fill="#64748b"
      pointerEvents="none"
    >
      {text}
    </text>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Node label (pedigree ID below symbol)
// ─────────────────────────────────────────────────────────────────────────────

function NodeLabel({
  x,
  y,
  label,
  individual,
}: {
  x: number;
  y: number;
  label: string;
  individual: Individual;
}) {
  const hasPregnancyLabel =
    individual.pregnancyStatus &&
    individual.pregnancyStatus !== 'liveborn' &&
    individual.pregnancyStatus !== 'current_pregnancy';

  const labelY = y + LABEL_OFFSET + (hasPregnancyLabel ? 10 : 0);

  return (
    <>
      <text
        x={x}
        y={labelY}
        textAnchor="middle"
        fontSize={LABEL_SIZE}
        fontFamily={LABEL_FONT}
        fill="#475569"
        pointerEvents="none"
      >
        {label}
      </text>
      {/* First name (if set) — smaller, below ID */}
      {individual.firstName && (
        <text
          x={x}
          y={labelY + 12}
          textAnchor="middle"
          fontSize={8.5}
          fontFamily="'IBM Plex Sans', system-ui, sans-serif"
          fill="#94a3b8"
          pointerEvents="none"
        >
          {individual.firstName}
        </text>
      )}
    </>
  );
}
