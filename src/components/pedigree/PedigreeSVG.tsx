/**
 * PedigreeSVG — full clinical pedigree renderer.
 *
 * Replaces the Phase 2 stub with a complete SVG rendering pass:
 *   1. Canvas background + grid
 *   2. Generation stripe labels (I, II, III…)
 *   3. All union / relationship lines (via UnionLines)
 *   4. All individual symbols (via IndividualSymbol)
 *   5. Clinical legend (optional, enabled by prop)
 *   6. Case metadata watermark (institution + date)
 *
 * The SVG has id="pedigree-svg" for export targeting.
 */

import React, { useMemo } from 'react';
import type { PedigreeLayout, PedigreeCase, LayoutNode } from '../../domain/types';
import { IndividualSymbol } from '../../rendering/IndividualSymbol';
import { UnionLines } from '../../rendering/UnionLines';
import { PedigreeLegend } from '../../rendering/PedigreeLegend';
import { CANVAS_PADDING, COLORS, NODE_HALF, V_SPACING } from '../../rendering/constants';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

// ─────────────────────────────────────────────────────────────────────────────

export interface PedigreeSVGProps {
  layout: PedigreeLayout;
  pedigreeCase: PedigreeCase;
  selectedId: string | null;
  onSelectIndividual: (id: string | null) => void;
  showLegend?: boolean;
}

export function PedigreeSVG({
  layout,
  pedigreeCase,
  selectedId,
  onSelectIndividual,
  showLegend = true,
}: PedigreeSVGProps) {
  const { individuals, unions, metadata } = pedigreeCase;
  const inheritancePattern = metadata.inheritancePattern;

  // Build fast lookup maps
  const nodeById = useMemo(
    () => new Map(layout.nodes.map((n) => [n.individualId, n])),
    [layout.nodes]
  );

  // Build twin lookup: id → { twinType, twinWith }
  const twinMap = useMemo(() => {
    const m = new Map<string, { twinType: string; twinWith: string[] }>();
    Object.values(individuals).forEach((ind) => {
      if (ind.twinType && ind.twinWith && ind.twinWith.length > 0) {
        m.set(ind.id, {
          twinType: ind.twinType,
          twinWith: ind.twinWith,
        });
      }
    });
    return m;
  }, [individuals]);

  // Collect unique generations for stripe rendering
  const generationYs = useMemo(() => {
    const gens = new Map<number, number>();
    layout.nodes.forEach((n) => {
      if (!gens.has(n.generation)) gens.set(n.generation, n.y);
    });
    return Array.from(gens.entries()).sort((a, b) => a[0] - b[0]);
  }, [layout.nodes]);

  // Legend positioning — below pedigree content
  const legendY = layout.height + CANVAS_PADDING + 20;

  // Compute total SVG dimensions
  const svgW = layout.width + CANVAS_PADDING * 2 + 40;
  const legendH = showLegend ? 130 : 0;
  const watermarkH = 32;
  const svgH = layout.height + CANVAS_PADDING * 2 + legendH + watermarkH;

  // Canvas click — deselect
  const handleCanvasClick = () => onSelectIndividual(null);

  return (
    <svg
      id="pedigree-svg"
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}
      onClick={handleCanvasClick}
    >
      {/* ── Global defs ──────────────────────────────────────────── */}
      <defs>
        <pattern
          id="pedigree-grid"
          width={40}
          height={40}
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke={COLORS.grid}
            strokeWidth={0.5}
          />
        </pattern>

        {/* Proband arrowhead — defined once at SVG level */}
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

        {/* Drop shadow for hover — future enhancement */}
        <filter id="node-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx={0} dy={1} stdDeviation={2} floodOpacity={0.08} />
        </filter>
      </defs>

      {/* ── Background ───────────────────────────────────────────── */}
      <rect width={svgW} height={svgH} fill={COLORS.canvas} />
      <rect width={svgW} height={layout.height + CANVAS_PADDING * 2} fill="url(#pedigree-grid)" />

      {/* ── Generation stripe labels ─────────────────────────────── */}
      <GenerationStripes
        generationYs={generationYs}
        svgW={svgW}
        paddingTop={CANVAS_PADDING}
      />

      {/* ── Main pedigree content group ──────────────────────────── */}
      <g transform={`translate(${CANVAS_PADDING}, ${CANVAS_PADDING})`}>

        {/* Layer 1: All union / relationship lines (behind nodes) */}
        {layout.unionLines.map((lu) => {
          const union = unions[lu.unionId];
          if (!union) return null;

          // Filter child nodes to only those that exist in layout
          const childNodes = lu.childNodes.filter(
            (cn) => !cn.individualId.startsWith('virtual_')
          );

          // Build twin map restricted to this union's children
          const localTwinMap = new Map<string, { twinType: string; twinWith: string[] }>();
          childNodes.forEach((cn) => {
            const ind = individuals[cn.individualId];
            if (ind?.twinType && ind.twinWith?.length) {
              localTwinMap.set(cn.individualId, {
                twinType: ind.twinType,
                twinWith: ind.twinWith,
              });
            }
          });

          return (
            <UnionLines
              key={lu.unionId}
              layoutUnion={{ ...lu, childNodes }}
              union={union}
              twinMap={localTwinMap}
              nodeById={nodeById}
            />
          );
        })}

        {/* Layer 2: Individual symbols (on top of lines) */}
        {layout.nodes.map((node) => {
          const individual = individuals[node.individualId];
          // Skip rendering unknown/virtual sentinel nodes
          if (!individual) return null;
          if (node.individualId.startsWith('unknown_')) return null;
          if (node.individualId.startsWith('virtual_')) return null;

          return (
            <IndividualSymbol
              key={node.individualId}
              node={node}
              individual={individual}
              selected={selectedId === node.individualId}
              onSelect={onSelectIndividual}
              inheritancePattern={inheritancePattern}
            />
          );
        })}
      </g>

      {/* ── Legend ──────────────────────────────────────────────── */}
      {showLegend && (
        <PedigreeLegend x={CANVAS_PADDING} y={legendY} />
      )}

      {/* ── Watermark / metadata footer ──────────────────────────── */}
      <CaseWatermark
        pedigreeCase={pedigreeCase}
        y={svgH - watermarkH + 8}
        svgW={svgW}
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Generation stripe labels
// ─────────────────────────────────────────────────────────────────────────────

function GenerationStripes({
  generationYs,
  svgW,
  paddingTop,
}: {
  generationYs: [number, number][];
  svgW: number;
  paddingTop: number;
}) {
  return (
    <g>
      {generationYs.map(([genIndex, logicalY]) => {
        const pixelY = logicalY + paddingTop;
        const label = ROMAN[genIndex] ?? `G${genIndex + 1}`;

        return (
          <g key={genIndex}>
            {/* Subtle horizontal generation guideline */}
            <line
              x1={0}
              y1={pixelY}
              x2={svgW}
              y2={pixelY}
              stroke="#dde4ed"
              strokeWidth={0.5}
              strokeDasharray="6 4"
            />
            {/* Generation roman numeral */}
            <text
              x={12}
              y={pixelY + 4}
              fontSize={10}
              fontFamily="'IBM Plex Mono', monospace"
              fontWeight="600"
              fill="#b0bec5"
              letterSpacing="0.02em"
            >
              {label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Case metadata watermark footer
// ─────────────────────────────────────────────────────────────────────────────

function CaseWatermark({
  pedigreeCase,
  y,
  svgW,
}: {
  pedigreeCase: PedigreeCase;
  y: number;
  svgW: number;
}) {
  const { metadata } = pedigreeCase;
  const date = new Date(metadata.updatedAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const leftText = [
    metadata.institution,
    metadata.recordedBy,
  ]
    .filter(Boolean)
    .join(' · ');

  const centerText = metadata.suspectedDiagnosis ?? metadata.clinicalIndication ?? '';

  const rightText = `Case: ${metadata.caseId.slice(0, 8).toUpperCase()} · ${date}`;

  const textProps = {
    fontSize: 7.5,
    fontFamily: "'IBM Plex Mono', monospace",
    fill: '#94a3b8',
  };

  return (
    <g>
      <line x1={0} y1={y - 6} x2={svgW} y2={y - 6} stroke="#e2e8f0" strokeWidth={0.75} />
      {leftText && (
        <text x={12} y={y + 8} {...textProps}>{leftText}</text>
      )}
      {centerText && (
        <text x={svgW / 2} y={y + 8} textAnchor="middle" {...textProps}>
          {centerText.length > 60 ? centerText.slice(0, 57) + '…' : centerText}
        </text>
      )}
      <text x={svgW - 12} y={y + 8} textAnchor="end" {...textProps}>
        {rightText}
      </text>
    </g>
  );
}
