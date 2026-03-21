/**
 * PedigreeLegend
 *
 * Renders a compact clinical symbol key as part of the SVG canvas.
 * Positioned at the bottom-left of the pedigree.
 * This appears in exported SVG/PNG output.
 */

import React from 'react';
import { COLORS, STROKE } from './constants';

const R = 10; // legend symbol radius/half-size

interface LegendItem {
  label: string;
  symbol: React.ReactNode;
}

function LegendSymbols(): LegendItem[] {
  return [
    {
      label: 'Unaffected male',
      symbol: (
        <rect
          x={-R} y={-R} width={R * 2} height={R * 2}
          fill={COLORS.unaffected} stroke={COLORS.stroke} strokeWidth={STROKE.node} rx={1}
        />
      ),
    },
    {
      label: 'Unaffected female',
      symbol: (
        <circle cx={0} cy={0} r={R} fill={COLORS.unaffected} stroke={COLORS.stroke} strokeWidth={STROKE.node} />
      ),
    },
    {
      label: 'Affected individual',
      symbol: (
        <rect
          x={-R} y={-R} width={R * 2} height={R * 2}
          fill={COLORS.affected} stroke={COLORS.stroke} strokeWidth={STROKE.node} rx={1}
        />
      ),
    },
    {
      label: 'Carrier (AR)',
      symbol: (
        <>
          <circle cx={0} cy={0} r={R} fill={COLORS.unaffected} stroke={COLORS.stroke} strokeWidth={STROKE.node} />
          <circle cx={0} cy={0} r={R * 0.35} fill={COLORS.carrier} />
        </>
      ),
    },
    {
      label: 'X-linked carrier ♀',
      symbol: (
        <>
          <circle cx={0} cy={0} r={R} fill={COLORS.unaffected} stroke={COLORS.stroke} strokeWidth={STROKE.node} />
          <path d={`M 0 ${-R} A ${R} ${R} 0 0 0 0 ${R} Z`} fill={COLORS.carrier} />
        </>
      ),
    },
    {
      label: 'Deceased',
      symbol: (
        <>
          <circle cx={0} cy={0} r={R} fill={COLORS.unaffected} stroke={COLORS.stroke} strokeWidth={STROKE.node} />
          <line x1={-(R + 3)} y1={R + 3} x2={R + 3} y2={-(R + 3)} stroke={COLORS.deceased} strokeWidth={STROKE.deceased} />
        </>
      ),
    },
    {
      label: 'Unknown status',
      symbol: (
        <>
          <circle cx={0} cy={0} r={R} fill={COLORS.unknown} stroke={COLORS.stroke} strokeWidth={STROKE.node} />
          <text x={0} y={4} textAnchor="middle" fontSize={11} fontFamily="monospace" fill="#94a3b8">?</text>
        </>
      ),
    },
    {
      label: 'Proband',
      symbol: (
        <>
          <rect x={-R} y={-R} width={R * 2} height={R * 2} fill={COLORS.affected} stroke={COLORS.stroke} strokeWidth={STROKE.node} rx={1} />
          <line x1={-(R + 14)} y1={R + 14} x2={-(R + 2)} y2={R + 2} stroke={COLORS.proband} strokeWidth={STROKE.proband} markerEnd="url(#leg-arrow)" />
        </>
      ),
    },
    {
      label: 'Consanguineous',
      symbol: (
        <>
          <line x1={-R * 1.5} y1={-3} x2={R * 1.5} y2={-3} stroke={COLORS.line} strokeWidth={STROKE.line} />
          <line x1={-R * 1.5} y1={3} x2={R * 1.5} y2={3} stroke={COLORS.line} strokeWidth={STROKE.line} />
        </>
      ),
    },
    {
      label: 'Miscarriage (SAB)',
      symbol: (
        <polygon
          points={`0,${R * 0.8} ${-R * 0.8},${-R * 0.5} ${R * 0.8},${-R * 0.5}`}
          fill={COLORS.unknown} stroke={COLORS.stroke} strokeWidth={STROKE.node}
        />
      ),
    },
    {
      label: 'MZ twins',
      symbol: (
        <>
          <line x1={-R} y1={-R} x2={0} y2={0} stroke={COLORS.line} strokeWidth={STROKE.twin} />
          <line x1={R} y1={-R} x2={0} y2={0} stroke={COLORS.line} strokeWidth={STROKE.twin} />
          <line x1={-3} y1={0} x2={3} y2={0} stroke={COLORS.line} strokeWidth={STROKE.twin + 0.5} />
        </>
      ),
    },
    {
      label: 'DZ twins',
      symbol: (
        <>
          <line x1={-R} y1={-R} x2={-R} y2={R} stroke={COLORS.line} strokeWidth={STROKE.twin} />
          <line x1={R} y1={-R} x2={R} y2={R} stroke={COLORS.line} strokeWidth={STROKE.twin} />
          <line x1={-R} y1={0} x2={R} y2={0} stroke={COLORS.line} strokeWidth={STROKE.twin} strokeDasharray="3 2" />
        </>
      ),
    },
    {
      label: 'Adopted in',
      symbol: (
        <>
          <rect x={-R} y={-R} width={R * 2} height={R * 2} fill={COLORS.unaffected} stroke={COLORS.stroke} strokeWidth={STROKE.node} rx={1} />
          <path d={`M ${-R - 7} ${-R + 4} L ${-R - 7} ${R - 4}`} stroke={COLORS.adoption} strokeWidth={STROKE.adoption} fill="none" strokeLinecap="square" />
          <path d={`M ${R + 7} ${-R + 4} L ${R + 7} ${R - 4}`} stroke={COLORS.adoption} strokeWidth={STROKE.adoption} fill="none" strokeLinecap="square" />
        </>
      ),
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────

export function PedigreeLegend({
  x,
  y,
}: {
  x: number;
  y: number;
}) {
  const items = LegendSymbols();
  const colWidth = 130;
  const rowHeight = 28;
  const cols = 3;
  const rows = Math.ceil(items.length / cols);

  const boxW = colWidth * cols + 20;
  const boxH = rows * rowHeight + 36;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Background */}
      <rect
        x={0}
        y={0}
        width={boxW}
        height={boxH}
        rx={4}
        fill="rgba(255,255,255,0.92)"
        stroke="#cbd5e1"
        strokeWidth={1}
      />

      {/* Title */}
      <text
        x={10}
        y={18}
        fontSize={9}
        fontFamily="'IBM Plex Sans Condensed', system-ui, sans-serif"
        fontWeight="600"
        fill="#64748b"
        letterSpacing="0.08em"
        style={{ textTransform: 'uppercase' }}
      >
        PEDIGREE LEGEND
      </text>

      {/* Arrow marker for legend proband */}
      <defs>
        <marker id="leg-arrow" markerWidth={6} markerHeight={6} refX={5} refY={2.5} orient="auto">
          <path d="M0,0 L0,5 L6,2.5 Z" fill={COLORS.proband} />
        </marker>
      </defs>

      {/* Items */}
      {items.map((item, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const ix = col * colWidth + 22;
        const iy = row * rowHeight + 36;

        return (
          <g key={item.label} transform={`translate(${ix}, ${iy})`}>
            {/* Symbol */}
            <g transform="translate(0, 0)">{item.symbol}</g>
            {/* Label */}
            <text
              x={R + 8}
              y={4}
              fontSize={8.5}
              fontFamily="'IBM Plex Sans', system-ui, sans-serif"
              fill="#475569"
            >
              {item.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}
