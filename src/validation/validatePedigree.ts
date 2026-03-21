/**
 * Pedigree Validation Engine
 *
 * Returns typed ValidationIssue[] so the UI can render inline errors,
 * highlight problematic nodes, and gate exports.
 *
 * Rules are tiered:
 *   error   — pedigree is structurally impossible / clinically invalid
 *   warning — unusual or likely-incorrect but renderable
 *   info    — reminder / best-practice note
 */

import type {
  PedigreeCase,
  Individual,
  Union,
  ValidationIssue,
  ValidationResult,
} from '../domain/types';
import {
  getParentalUnion,
  getUnionsForIndividual,
  getProband,
} from '../domain/operations';

export function validatePedigree(
  pedigreeCase: PedigreeCase
): ValidationResult {
  const issues: ValidationIssue[] = [];

  const individuals: Individual[] = Object.values(pedigreeCase.individuals);
  const unions: Union[] = Object.values(pedigreeCase.unions);

  // ── Individual-level checks ──────────────────────────────────────────────

  individuals.forEach((ind) => {
    // Cannot be both proband and carrier (carriers are unaffected by definition
    // in most contexts — warn rather than error, as nomenclature varies)
    if (ind.isProband && ind.affectedStatus === 'carrier') {
      issues.push({
        code: 'PROBAND_CARRIER',
        severity: 'warning',
        message: `${ind.label || ind.id}: Proband is marked as carrier. In most contexts the proband is affected; verify clinical intent.`,
        entityId: ind.id,
        entityType: 'individual',
      });
    }

    // Deceased but death year before birth year
    if (
      ind.birthYear &&
      ind.deathYear &&
      ind.deathYear < ind.birthYear
    ) {
      issues.push({
        code: 'DEATH_BEFORE_BIRTH',
        severity: 'error',
        message: `${ind.label || ind.id}: Death year (${ind.deathYear}) is before birth year (${ind.birthYear}).`,
        entityId: ind.id,
        entityType: 'individual',
      });
    }

    // Pregnancy status and sex conflict
    if (
      ind.pregnancyStatus === 'current_pregnancy' &&
      ind.sex === 'male'
    ) {
      issues.push({
        code: 'PREGNANCY_MALE',
        severity: 'error',
        message: `${ind.label || ind.id}: Current pregnancy cannot be assigned to a male individual.`,
        entityId: ind.id,
        entityType: 'individual',
      });
    }

    // Twins without a twin partner
    if (ind.twinType && (!ind.twinWith || ind.twinWith.length === 0)) {
      issues.push({
        code: 'TWIN_NO_PARTNER',
        severity: 'warning',
        message: `${ind.label || ind.id}: Twin type is set but no twin sibling is linked.`,
        entityId: ind.id,
        entityType: 'individual',
      });
    }

    // Miscarriage / stillbirth should not have a proband flag
    if (
      ind.isProband &&
      (ind.pregnancyStatus === 'miscarriage' ||
        ind.pregnancyStatus === 'stillbirth' ||
        ind.pregnancyStatus === 'terminated')
    ) {
      issues.push({
        code: 'PROBAND_PREGNANCY_LOSS',
        severity: 'error',
        message: `${ind.label || ind.id}: A miscarriage, stillbirth, or termination cannot be the proband.`,
        entityId: ind.id,
        entityType: 'individual',
      });
    }
  });

  // ── Union-level checks ───────────────────────────────────────────────────

  unions.forEach((union) => {
    const p1 = pedigreeCase.individuals[union.partner1Id];
    const p2 = pedigreeCase.individuals[union.partner2Id];

    // Both partners must exist (unless they are unknown sentinel IDs)
    if (
      !union.partner1Id.startsWith('unknown_') &&
      !p1
    ) {
      issues.push({
        code: 'UNION_MISSING_PARTNER',
        severity: 'error',
        message: `Union ${union.id}: Partner 1 (${union.partner1Id}) does not exist in pedigree.`,
        entityId: union.id,
        entityType: 'union',
      });
    }

    if (
      !union.partner2Id.startsWith('unknown_') &&
      !p2
    ) {
      issues.push({
        code: 'UNION_MISSING_PARTNER',
        severity: 'error',
        message: `Union ${union.id}: Partner 2 (${union.partner2Id}) does not exist in pedigree.`,
        entityId: union.id,
        entityType: 'union',
      });
    }

    // Same-sex check: not an error, but info (biological ambiguity)
    if (p1 && p2 && p1.sex === p2.sex && p1.sex !== 'unknown') {
      issues.push({
        code: 'SAME_SEX_UNION',
        severity: 'info',
        message: `Union ${union.id}: Both partners have the same recorded sex (${p1.sex}). Verify if donor conception or adoption applies.`,
        entityId: union.id,
        entityType: 'union',
      });
    }

    // Children must exist in pedigree
    union.childrenIds.forEach((cid: string) => {
      if (!pedigreeCase.individuals[cid]) {
        issues.push({
          code: 'UNION_MISSING_CHILD',
          severity: 'error',
          message: `Union ${union.id}: Child ${cid} does not exist in pedigree.`,
          entityId: union.id,
          entityType: 'union',
        });
      }
    });

    // Consanguinity: both partners should trace to a common ancestor
    // (We only emit a reminder; tracing is complex for MVP)
    if (union.consanguineous) {
      issues.push({
        code: 'CONSANGUINITY_MARKED',
        severity: 'info',
        message: `Union ${union.id} is marked consanguineous. Verify that both partners share a documented common ancestor in this pedigree.`,
        entityId: union.id,
        entityType: 'union',
      });
    }
  });

  // ── Pedigree-level checks ────────────────────────────────────────────────

  // Exactly one proband
  const probands = individuals.filter((i) => i.isProband);
  if (probands.length === 0) {
    issues.push({
      code: 'NO_PROBAND',
      severity: 'warning',
      message: 'No proband is designated. Pedigrees submitted for WES typically require an index case.',
      entityType: 'pedigree',
    });
  }

  if (probands.length > 1) {
    issues.push({
      code: 'MULTIPLE_PROBANDS',
      severity: 'error',
      message: `${probands.length} individuals are marked as proband. Only one proband is allowed per pedigree.`,
      entityType: 'pedigree',
    });
  }

  // Circular ancestry check (individual cannot be their own ancestor)
  const cycleId = findAncestorCycle(pedigreeCase);
  if (cycleId) {
    issues.push({
      code: 'ANCESTOR_CYCLE',
      severity: 'error',
      message: `Circular ancestry detected involving individual ${cycleId}. The pedigree graph contains a cycle.`,
      entityId: cycleId,
      entityType: 'individual',
    });
  }

  // Orphan individuals (not in any union, no parents — could be intentional)
  individuals.forEach((ind) => {
    const parentalUnion = getParentalUnion(pedigreeCase, ind.id);
    const ownUnions = getUnionsForIndividual(pedigreeCase, ind.id);
    if (!parentalUnion && ownUnions.length === 0 && individuals.length > 1) {
      issues.push({
        code: 'ORPHAN_INDIVIDUAL',
        severity: 'info',
        message: `${ind.label || ind.id}: This individual has no family connections. Add parental or partner relationships.`,
        entityId: ind.id,
        entityType: 'individual',
      });
    }
  });

  return {
    valid: !issues.some((i: ValidationIssue) => i.severity === 'error'),
    issues,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Cycle detection (DFS on ancestor graph)
// ─────────────────────────────────────────────────────────────────────────────

function findAncestorCycle(pedigreeCase: PedigreeCase): string | null {
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(id: string): string | null {
    if (inStack.has(id)) return id;
    if (visited.has(id)) return null;

    visited.add(id);
    inStack.add(id);

    const parentalUnion = getParentalUnion(pedigreeCase, id);
    if (parentalUnion) {
      for (const parentId of [
        parentalUnion.partner1Id,
        parentalUnion.partner2Id,
      ]) {
        if (!parentId.startsWith('unknown_')) {
          const cycle = dfs(parentId);
          if (cycle) return cycle;
        }
      }
    }

    inStack.delete(id);
    return null;
  }

  for (const id of Object.keys(pedigreeCase.individuals)) {
    const result = dfs(id);
    if (result) return result;
  }

  return null;
}
