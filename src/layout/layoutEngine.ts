/**
 * Pedigree Layout Engine
 *
 * Converts a PedigreeCase into a PedigreeLayout (positioned nodes + union lines)
 * ready for the SVG renderer.
 *
 * Algorithm:
 *   1. Topological-sort individuals into generations via BFS from founders.
 *   2. Within each generation, assign x positions respecting union groupings.
 *   3. Centre parents over their children where possible.
 *   4. Return LayoutNode[] and LayoutUnion[] in logical units (not pixels).
 *
 * Limitations (noted for future improvement):
 *   - Does not handle very large complex pedigrees with crossing lines optimally.
 *   - Twin positioning is approximate (MZ/DZ distinction drawn but not perfectly
 *     space-optimised for >3 generations).
 *   - Does not re-route edges to avoid overlaps in non-standard topologies.
 */

import type {
  PedigreeCase,
  PedigreeLayout,
  LayoutNode,
  LayoutUnion,
  Individual,
  Union,
} from '../domain/types';
import { getParentalUnion, getUnionsForIndividual } from '../domain/operations';

// ── Layout constants (logical units) ────────────────────────────────────────

const H_SPACING = 130;  // horizontal distance between sibling nodes
const V_SPACING = 170;  // vertical distance between generations
const UNION_V_OFFSET = V_SPACING * 0.5; // y of union midpoint relative to parents

// ─────────────────────────────────────────────────────────────────────────────

export function computeLayout(pedigreeCase: PedigreeCase): PedigreeLayout {
  const individuals = Object.values(pedigreeCase.individuals);
  const unions = Object.values(pedigreeCase.unions);

  if (individuals.length === 0) {
    return { nodes: [], unionLines: [], width: 400, height: 300 };
  }

  // ── Step 1: Assign generation index via BFS ───────────────────────────────

  const generationMap = assignGenerations(pedigreeCase);

  // Group by generation
  const generations: Map<number, string[]> = new Map();
  individuals.forEach((ind) => {
    const gen = generationMap.get(ind.id) ?? 0;
    if (!generations.has(gen)) generations.set(gen, []);
    generations.get(gen)!.push(ind.id);
  });

  const sortedGens = Array.from(generations.keys()).sort((a, b) => a - b);

  // ── Step 2: Assign x positions within each generation ────────────────────

  const nodeMap = new Map<string, LayoutNode>();

  sortedGens.forEach((genIndex) => {
    const genIds = generations.get(genIndex)!;

    // Order within generation: try to keep couples adjacent
    const orderedIds = orderWithinGeneration(genIds, unions, nodeMap, pedigreeCase);

    orderedIds.forEach((id, posIndex) => {
      nodeMap.set(id, {
        individualId: id,
        x: posIndex * H_SPACING,
        y: genIndex * V_SPACING,
        generation: genIndex,
        siblingIndex: posIndex,
      });
    });
  });

  // ── Step 3: Centre parents over children ─────────────────────────────────

  // Multiple passes to propagate centering top-down
  for (let pass = 0; pass < 3; pass++) {
    sortedGens.forEach((genIndex) => {
      const genIds = generations.get(genIndex)!;
      genIds.forEach((id) => {
        const ownUnions = unions.filter(
          (u) => u.partner1Id === id || u.partner2Id === id
        );
        ownUnions.forEach((union) => {
          if (union.childrenIds.length === 0) return;

          const childNodes = union.childrenIds
            .map((cid) => nodeMap.get(cid))
            .filter(Boolean) as LayoutNode[];

          if (childNodes.length === 0) return;

          const childMidX =
            childNodes.reduce((sum, n) => sum + n.x, 0) / childNodes.length;

          // Adjust both partners to be symmetric around childMidX
          const p1Node = nodeMap.get(union.partner1Id);
          const p2Node = nodeMap.get(union.partner2Id);

          if (p1Node && p2Node) {
            const pairMidX = (p1Node.x + p2Node.x) / 2;
            const delta = childMidX - pairMidX;
            nodeMap.set(union.partner1Id, { ...p1Node, x: p1Node.x + delta });
            nodeMap.set(union.partner2Id, { ...p2Node, x: p2Node.x + delta });
          }
        });
      });
    });
  }

  // ── Step 4: Build LayoutUnion lines ──────────────────────────────────────

  const layoutUnions: LayoutUnion[] = [];

  unions.forEach((union) => {
    const p1Node = nodeMap.get(union.partner1Id);
    const p2Node = nodeMap.get(union.partner2Id);

    // At least one partner must be known for rendering
    if (!p1Node && !p2Node) return;

    // For unknown parents, create a virtual node adjacent to the known parent
    const effectiveP1 = p1Node ?? deriveVirtualNode(p2Node!, 'left');
    const effectiveP2 = p2Node ?? deriveVirtualNode(p1Node!, 'right');

    const midX = (effectiveP1.x + effectiveP2.x) / 2;
    const y = effectiveP1.y; // partners are always on same generation row

    const childNodes = union.childrenIds
      .map((cid) => nodeMap.get(cid))
      .filter(Boolean) as LayoutNode[];

    layoutUnions.push({
      unionId: union.id,
      midX,
      y,
      partner1Node: effectiveP1,
      partner2Node: effectiveP2,
      childNodes,
    });
  });

  // ── Step 5: Compute canvas bounds ────────────────────────────────────────

  const allNodes = Array.from(nodeMap.values());
  const maxX = allNodes.reduce((m, n) => Math.max(m, n.x), 0);
  const maxY = allNodes.reduce((m, n) => Math.max(m, n.y), 0);

  return {
    nodes: allNodes,
    unionLines: layoutUnions,
    width: maxX + H_SPACING * 2,
    height: maxY + V_SPACING * 2,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Generation assignment (topological BFS)
// ─────────────────────────────────────────────────────────────────────────────

function assignGenerations(
  pedigreeCase: PedigreeCase
): Map<string, number> {
  const genMap = new Map<string, number>();
  const individuals = Object.values(pedigreeCase.individuals);

  // Find founders: individuals with no parents in the pedigree
  const hasParents = new Set<string>();
  Object.values(pedigreeCase.unions).forEach((union) => {
    union.childrenIds.forEach((cid) => hasParents.add(cid));
  });

  const founders = individuals.filter(
    (i) => !hasParents.has(i.id)
  );

  if (founders.length === 0 && individuals.length > 0) {
    // Cycle or fully isolated — assign generation 0 to all
    individuals.forEach((i) => genMap.set(i.id, 0));
    return genMap;
  }

  // BFS downward from founders
  const queue: { id: string; gen: number }[] = founders.map((f) => ({
    id: f.id,
    gen: 0,
  }));

  while (queue.length > 0) {
    const { id, gen } = queue.shift()!;

    // Only update if this gives a deeper (later) generation
    if ((genMap.get(id) ?? -1) < gen) {
      genMap.set(id, gen);

      // Propagate to children
      const ownUnions = getUnionsForIndividual(pedigreeCase, id);
      ownUnions.forEach((union) => {
        union.childrenIds.forEach((cid) => {
          queue.push({ id: cid, gen: gen + 1 });
        });

        // Partner is on same generation
        const partnerId =
          union.partner1Id === id ? union.partner2Id : union.partner1Id;
        if (!partnerId.startsWith('unknown_')) {
          queue.push({ id: partnerId, gen });
        }
      });
    }
  }

  // Assign gen 0 to any remaining unmapped individuals
  individuals.forEach((i) => {
    if (!genMap.has(i.id)) genMap.set(i.id, 0);
  });

  return genMap;
}

// ─────────────────────────────────────────────────────────────────────────────
// Intra-generation ordering
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Order individuals within a generation so that:
 * - Coupled partners are adjacent
 * - Children are positioned near their parents' midpoint
 */
function orderWithinGeneration(
  ids: string[],
  unions: Union[],
  existingNodes: Map<string, LayoutNode>,
  pedigreeCase: PedigreeCase
): string[] {
  // Simple heuristic: keep couples together, then sort by first appearance
  const ordered: string[] = [];
  const placed = new Set<string>();

  // Start with individuals who have children in the next generation
  const withChildren = ids.filter((id) =>
    unions.some(
      (u) =>
        (u.partner1Id === id || u.partner2Id === id) &&
        u.childrenIds.length > 0
    )
  );
  const withoutChildren = ids.filter((id) => !withChildren.includes(id));

  [...withChildren, ...withoutChildren].forEach((id) => {
    if (placed.has(id)) return;
    ordered.push(id);
    placed.add(id);

    // Place partner immediately after
    const partnerUnion = unions.find(
      (u) =>
        (u.partner1Id === id || u.partner2Id === id) &&
        ids.includes(u.partner1Id === id ? u.partner2Id : u.partner1Id)
    );

    if (partnerUnion) {
      const partnerId =
        partnerUnion.partner1Id === id
          ? partnerUnion.partner2Id
          : partnerUnion.partner1Id;

      if (!placed.has(partnerId)) {
        ordered.push(partnerId);
        placed.add(partnerId);
      }
    }
  });

  return ordered;
}

// ─────────────────────────────────────────────────────────────────────────────
// Virtual node for unknown parent
// ─────────────────────────────────────────────────────────────────────────────

function deriveVirtualNode(
  knownNode: LayoutNode,
  side: 'left' | 'right'
): LayoutNode {
  return {
    individualId: `virtual_${side}_${knownNode.individualId}`,
    x: knownNode.x + (side === 'right' ? H_SPACING * 0.8 : -H_SPACING * 0.8),
    y: knownNode.y,
    generation: knownNode.generation,
    siblingIndex: -1,
  };
}
