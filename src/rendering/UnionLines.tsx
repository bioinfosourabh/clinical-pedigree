/**
 * Relationship Line Renderer
 *
 * Draws all connector lines in the pedigree:
 *   - Horizontal union bar between partners
 *   - Vertical drop from union midpoint
 *   - Horizontal sibship bar above children
 *   - Vertical lines from sibship bar to each child
 *   - Twin bracket (MZ: triangle apex / DZ: forked lines from shared point)
 *   - Consanguineous double line
 *   - Separated / divorced diagonal bar
 *   - Extramarital dashed line
 *
 * All coordinates are in the same logical-unit space as LayoutNode x/y.
 * The SVG renderer applies a single translate() transform.
 */

import React from 'react';
import type { LayoutUnion, LayoutNode } from '../domain/types';
import type { Union } from '../domain/types';
import { COLORS, STROKE, NODE_HALF, NODE_R, SIBSHIP_DROP } from './constants';

// ─────────────────────────────────────────────────────────────────────────────
// Public component
// ─────────────────────────────────────────────────────────────────────────────

export interface UnionLinesProps {
  layoutUnion: LayoutUnion;
  union: Union;
  /** Map of individualId → twinType for the children */
  twinMap: Map<string, { twinType: string; twinWith: string[] }>;
  /** Map of individualId → LayoutNode */
  nodeById: Map<string, LayoutNode>;
}

export function UnionLines({
  layoutUnion,
  union,
  twinMap,
  nodeById,
}: UnionLinesProps) {
  const { partner1Node, partner2Node, childNodes, midX } = layoutUnion;
  const parentY = partner1Node.y; // both partners are on same generation row

  // ── Determine line style ────────────────────────────────────────
  const isDashed =
    union.relationshipType === 'extramarital' ||
    union.relationshipType === 'separated' ||
    union.relationshipType === 'divorced';

  const unionLineProps = {
    stroke: COLORS.line,
    strokeWidth: STROKE.line,
    strokeDasharray: isDashed ? '7 4' : undefined,
    strokeLinecap: 'round' as const,
  };

  // ── Edge x values — start/end at the symbol boundary, not centre ──
  const p1EdgeX =
    partner1Node.x < partner2Node.x
      ? partner1Node.x + NODE_HALF
      : partner1Node.x - NODE_HALF;
  const p2EdgeX =
    partner2Node.x < partner1Node.x
      ? partner2Node.x + NODE_HALF
      : partner2Node.x - NODE_HALF;

  const leftEdge = Math.min(p1EdgeX, p2EdgeX);
  const rightEdge = Math.max(p1EdgeX, p2EdgeX);

  // ── Sibship Y ────────────────────────────────────────────────────
  const sibshipY =
    childNodes.length > 0
      ? childNodes[0].y - SIBSHIP_DROP
      : parentY + 60;

  // ── Twin groups: cluster children into pairs/groups ───────────────
  const twinGroups = buildTwinGroups(childNodes, twinMap);

  return (
    <g>
      {/* 1. Partner union bar */}
      <line
        x1={leftEdge}
        y1={parentY}
        x2={rightEdge}
        y2={parentY}
        {...unionLineProps}
      />

      {/* 2. Consanguinity double bar (offset second line) */}
      {union.consanguineous && (
        <line
          x1={leftEdge}
          y1={parentY + 5}
          x2={rightEdge}
          y2={parentY + 5}
          {...unionLineProps}
        />
      )}

      {/* 3. Separated / divorced diagonal mark */}
      {(union.relationshipType === 'separated' ||
        union.relationshipType === 'divorced') && (
        <SeparationMark
          midX={midX}
          y={parentY}
          double={union.relationshipType === 'divorced'}
        />
      )}

      {/* 4. Vertical drop from midpoint to sibship bar */}
      {childNodes.length > 0 && (
        <line
          x1={midX}
          y1={parentY + NODE_HALF}
          x2={midX}
          y2={sibshipY}
          stroke={COLORS.line}
          strokeWidth={STROKE.line}
          strokeLinecap="round"
        />
      )}

      {/* 5. Horizontal sibship bar */}
      {childNodes.length > 1 && (
        <line
          x1={childNodes[0].x}
          y1={sibshipY}
          x2={childNodes[childNodes.length - 1].x}
          y2={sibshipY}
          stroke={COLORS.line}
          strokeWidth={STROKE.line}
          strokeLinecap="round"
        />
      )}

      {/* 6. Vertical lines from sibship bar to each child (non-twin) */}
      {childNodes.map((child) => {
        const isTwin = twinMap.has(child.individualId);
        if (isTwin) return null; // handled by TwinLines
        return (
          <line
            key={`drop-${child.individualId}`}
            x1={child.x}
            y1={sibshipY}
            x2={child.x}
            y2={child.y - NODE_HALF}
            stroke={COLORS.line}
            strokeWidth={STROKE.line}
            strokeLinecap="round"
          />
        );
      })}

      {/* 7. Twin bracket lines */}
      {twinGroups.map((group, idx) => (
        <TwinLines
          key={`twin-${idx}`}
          group={group}
          sibshipY={sibshipY}
          nodeById={nodeById}
          twinMap={twinMap}
        />
      ))}
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Separation / divorce mark
// ─────────────────────────────────────────────────────────────────────────────

function SeparationMark({
  midX,
  y,
  double,
}: {
  midX: number;
  y: number;
  double: boolean;
}) {
  const len = 8;
  const markProps = {
    stroke: COLORS.line,
    strokeWidth: STROKE.line,
    strokeLinecap: 'round' as const,
  };

  return (
    <g>
      <line
        x1={midX - len * 0.4}
        y1={y - len}
        x2={midX + len * 0.4}
        y2={y + len}
        {...markProps}
      />
      {double && (
        <line
          x1={midX + len * 0.4}
          y1={y - len}
          x2={midX + len * 1.2}
          y2={y + len}
          {...markProps}
        />
      )}
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Twin line rendering
// ─────────────────────────────────────────────────────────────────────────────

interface TwinGroup {
  nodes: LayoutNode[];
  type: 'monozygotic' | 'dizygotic';
}

function TwinLines({
  group,
  sibshipY,
  nodeById,
  twinMap,
}: {
  group: TwinGroup;
  sibshipY: number;
  nodeById: Map<string, LayoutNode>;
  twinMap: Map<string, { twinType: string; twinWith: string[] }>;
}) {
  if (group.nodes.length < 2) return null;

  const [a, b] = group.nodes;
  const apexX = (a.x + b.x) / 2;

  if (group.type === 'monozygotic') {
    /**
     * MZ twins: lines converge to a single apex point on the sibship bar,
     * then a single vertical drop to the sibship bar.
     * Visual: inverted V from apex to each child
     */
    const apexY = sibshipY + 18; // apex slightly below sibship bar

    return (
      <g>
        {/* Apex point on sibship bar */}
        <line
          x1={apexX}
          y1={sibshipY}
          x2={apexX}
          y2={apexY}
          stroke={COLORS.line}
          strokeWidth={STROKE.twin}
          strokeLinecap="round"
        />
        {/* Legs from apex to each child */}
        {group.nodes.map((node) => (
          <g key={node.individualId}>
            <line
              x1={apexX}
              y1={apexY}
              x2={node.x}
              y2={node.y - NODE_HALF}
              stroke={COLORS.line}
              strokeWidth={STROKE.twin}
              strokeLinecap="round"
            />
          </g>
        ))}
        {/* MZ indicator: horizontal bar at apex */}
        <line
          x1={apexX - 8}
          y1={apexY}
          x2={apexX + 8}
          y2={apexY}
          stroke={COLORS.line}
          strokeWidth={STROKE.twin + 0.5}
          strokeLinecap="round"
        />
      </g>
    );
  }

  /**
   * DZ twins: separate vertical lines from sibship bar, but connected
   * by a horizontal bracket at an intermediate y.
   * Visual: two vertical drops joined by a horizontal tie line
   */
  const tieY = sibshipY + 14;

  return (
    <g>
      {group.nodes.map((node) => (
        <g key={node.individualId}>
          {/* From sibship bar to tie point */}
          <line
            x1={node.x}
            y1={sibshipY}
            x2={node.x}
            y2={tieY}
            stroke={COLORS.line}
            strokeWidth={STROKE.twin}
            strokeLinecap="round"
          />
          {/* From tie point to child */}
          <line
            x1={node.x}
            y1={tieY}
            x2={node.x}
            y2={node.y - NODE_HALF}
            stroke={COLORS.line}
            strokeWidth={STROKE.twin}
            strokeLinecap="round"
          />
        </g>
      ))}
      {/* Horizontal tie between DZ twins */}
      <line
        x1={a.x}
        y1={tieY}
        x2={b.x}
        y2={tieY}
        stroke={COLORS.line}
        strokeWidth={STROKE.twin}
        strokeLinecap="round"
        strokeDasharray="4 3"
      />
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Build twin groups from child nodes
// ─────────────────────────────────────────────────────────────────────────────

function buildTwinGroups(
  childNodes: LayoutNode[],
  twinMap: Map<string, { twinType: string; twinWith: string[] }>
): TwinGroup[] {
  const groups: TwinGroup[] = [];
  const assigned = new Set<string>();

  childNodes.forEach((node) => {
    if (assigned.has(node.individualId)) return;
    const twinInfo = twinMap.get(node.individualId);
    if (!twinInfo) return;

    const twinPartnerIds = twinInfo.twinWith;
    const partnerNodes = childNodes.filter(
      (n) =>
        twinPartnerIds.includes(n.individualId) &&
        !assigned.has(n.individualId)
    );

    if (partnerNodes.length === 0) return;

    const groupNodes = [node, ...partnerNodes];
    groupNodes.forEach((n) => assigned.add(n.individualId));

    groups.push({
      nodes: groupNodes.sort((a, b) => a.x - b.x),
      type: twinInfo.twinType as 'monozygotic' | 'dizygotic',
    });
  });

  return groups;
}
