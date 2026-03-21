/**
 * Pedigree case operations.
 *
 * All mutations to PedigreeCase go through these pure functions.
 * They return a new PedigreeCase — no direct mutation of state.
 *
 * This ensures the layout engine and validation can be run
 * deterministically after any operation.
 */

import type { Individual, Union, PedigreeCase } from './types';
import { createUnion } from './factories';

// ─────────────────────────────────────────────────────────────────────────────
// Individual operations
// ─────────────────────────────────────────────────────────────────────────────

export function addIndividual(
  pedigreeCase: PedigreeCase,
  individual: Individual
): PedigreeCase {
  return {
    ...pedigreeCase,
    individuals: {
      ...pedigreeCase.individuals,
      [individual.id]: individual,
    },
    metadata: {
      ...pedigreeCase.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function updateIndividual(
  pedigreeCase: PedigreeCase,
  id: string,
  updates: Partial<Individual>
): PedigreeCase {
  const existing = pedigreeCase.individuals[id];
  if (!existing) return pedigreeCase;

  return {
    ...pedigreeCase,
    individuals: {
      ...pedigreeCase.individuals,
      [id]: { ...existing, ...updates },
    },
    metadata: {
      ...pedigreeCase.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function removeIndividual(
  pedigreeCase: PedigreeCase,
  id: string
): PedigreeCase {
  const individuals = { ...pedigreeCase.individuals };
  delete individuals[id];

  // Remove from all unions
  const unions: Record<string, Union> = {};
  Object.values(pedigreeCase.unions).forEach((union) => {
    if (union.partner1Id === id || union.partner2Id === id) {
      // Drop the union entirely if a partner is removed
      return;
    }
    unions[union.id] = {
      ...union,
      childrenIds: union.childrenIds.filter((cid) => cid !== id),
    };
  });

  return {
    ...pedigreeCase,
    individuals,
    unions,
    metadata: {
      ...pedigreeCase.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Mark one individual as proband; remove proband flag from any previous proband.
 * Only one proband is allowed per pedigree.
 */
export function setProband(
  pedigreeCase: PedigreeCase,
  id: string
): PedigreeCase {
  const individuals: Record<string, Individual> = {};

  Object.values(pedigreeCase.individuals).forEach((ind) => {
    individuals[ind.id] = {
      ...ind,
      isProband: ind.id === id,
    };
  });

  return {
    ...pedigreeCase,
    individuals,
    metadata: {
      ...pedigreeCase.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Union operations
// ─────────────────────────────────────────────────────────────────────────────

export function addUnion(
  pedigreeCase: PedigreeCase,
  union: Union
): PedigreeCase {
  return {
    ...pedigreeCase,
    unions: {
      ...pedigreeCase.unions,
      [union.id]: union,
    },
    metadata: {
      ...pedigreeCase.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function updateUnion(
  pedigreeCase: PedigreeCase,
  id: string,
  updates: Partial<Union>
): PedigreeCase {
  const existing = pedigreeCase.unions[id];
  if (!existing) return pedigreeCase;

  return {
    ...pedigreeCase,
    unions: {
      ...pedigreeCase.unions,
      [id]: { ...existing, ...updates },
    },
    metadata: {
      ...pedigreeCase.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function removeUnion(
  pedigreeCase: PedigreeCase,
  id: string
): PedigreeCase {
  const unions = { ...pedigreeCase.unions };
  delete unions[id];

  return {
    ...pedigreeCase,
    unions,
    metadata: {
      ...pedigreeCase.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Add a child to an existing union.
 * The child must already exist in pedigreeCase.individuals.
 */
export function addChildToUnion(
  pedigreeCase: PedigreeCase,
  unionId: string,
  childId: string
): PedigreeCase {
  const union = pedigreeCase.unions[unionId];
  if (!union) return pedigreeCase;
  if (union.childrenIds.includes(childId)) return pedigreeCase;

  return updateUnion(pedigreeCase, unionId, {
    childrenIds: [...union.childrenIds, childId],
  });
}

export function removeChildFromUnion(
  pedigreeCase: PedigreeCase,
  unionId: string,
  childId: string
): PedigreeCase {
  const union = pedigreeCase.unions[unionId];
  if (!union) return pedigreeCase;

  return updateUnion(pedigreeCase, unionId, {
    childrenIds: union.childrenIds.filter((id) => id !== childId),
  });
}

/**
 * Create a union between two existing individuals and optionally
 * attach a list of existing children.
 */
export function linkPartners(
  pedigreeCase: PedigreeCase,
  partner1Id: string,
  partner2Id: string,
  childIds: string[] = [],
  unionOptions: Partial<Union> = {}
): PedigreeCase {
  // Prevent duplicate unions between the same pair
  const existingUnion = Object.values(pedigreeCase.unions).find(
    (u) =>
      (u.partner1Id === partner1Id && u.partner2Id === partner2Id) ||
      (u.partner1Id === partner2Id && u.partner2Id === partner1Id)
  );

  if (existingUnion) {
    // Just add children to the existing union
    let updated = pedigreeCase;
    childIds.forEach((cid) => {
      updated = addChildToUnion(updated, existingUnion.id, cid);
    });
    return updated;
  }

  const union = createUnion(partner1Id, partner2Id, {
    childrenIds: childIds,
    ...unionOptions,
  });

  return addUnion(pedigreeCase, union);
}

// ─────────────────────────────────────────────────────────────────────────────
// Query helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Return all unions that include a given individual as a partner */
export function getUnionsForIndividual(
  pedigreeCase: PedigreeCase,
  individualId: string
): Union[] {
  return Object.values(pedigreeCase.unions).filter(
    (u) =>
      u.partner1Id === individualId || u.partner2Id === individualId
  );
}

/** Return the union (if any) that produced this individual as a child */
export function getParentalUnion(
  pedigreeCase: PedigreeCase,
  individualId: string
): Union | null {
  return (
    Object.values(pedigreeCase.unions).find((u) =>
      u.childrenIds.includes(individualId)
    ) ?? null
  );
}

/** Return the parent IDs of an individual */
export function getParents(
  pedigreeCase: PedigreeCase,
  individualId: string
): { parent1Id: string; parent2Id: string } | null {
  const parentalUnion = getParentalUnion(pedigreeCase, individualId);
  if (!parentalUnion) return null;
  return {
    parent1Id: parentalUnion.partner1Id,
    parent2Id: parentalUnion.partner2Id,
  };
}

/** Return the children of an individual across all unions */
export function getChildren(
  pedigreeCase: PedigreeCase,
  individualId: string
): Individual[] {
  const childIds = new Set<string>();
  getUnionsForIndividual(pedigreeCase, individualId).forEach((u) => {
    u.childrenIds.forEach((cid) => childIds.add(cid));
  });
  return Array.from(childIds)
    .map((id) => pedigreeCase.individuals[id])
    .filter(Boolean);
}

/** Return the siblings of an individual (through the same parental union) */
export function getSiblings(
  pedigreeCase: PedigreeCase,
  individualId: string
): Individual[] {
  const parentalUnion = getParentalUnion(pedigreeCase, individualId);
  if (!parentalUnion) return [];
  return parentalUnion.childrenIds
    .filter((id) => id !== individualId)
    .map((id) => pedigreeCase.individuals[id])
    .filter(Boolean);
}

/** Return the proband, if set */
export function getProband(
  pedigreeCase: PedigreeCase
): Individual | null {
  return (
    Object.values(pedigreeCase.individuals).find((i) => i.isProband) ?? null
  );
}
