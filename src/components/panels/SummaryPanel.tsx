import React from 'react';
import { usePedigreeStore } from '../../hooks/usePedigreeStore';
import { validatePedigree } from '../../validation';
import { getProband } from '../../domain/operations';
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import type { ValidationSeverity } from '../../domain/types';

export function SummaryPanel() {
  const { pedigreeCase } = usePedigreeStore();
  const meta = pedigreeCase.metadata;
  const validation = validatePedigree(pedigreeCase);
  const proband = getProband(pedigreeCase);

  const individuals = Object.values(pedigreeCase.individuals).filter(
    (i) => !i.id.startsWith('unknown_')
  );
  const affectedCount = individuals.filter((i) => i.affectedStatus === 'affected').length;
  const carrierCount = individuals.filter((i) => i.affectedStatus === 'carrier').length;
  const deceasedCount = individuals.filter((i) => i.deceasedStatus === 'deceased').length;
  const unionCount = Object.keys(pedigreeCase.unions).length;

  const errorCount = validation.issues.filter((i: { severity: string }) => i.severity === 'error').length;
  const warnCount = validation.issues.filter((i: { severity: string }) => i.severity === 'warning').length;
  const infoCount = validation.issues.filter((i: { severity: string }) => i.severity === 'info').length;

  return (
    <div className="p-4 space-y-4">

      {/* ── Validation summary card ────────────────────────── */}
      <div
        className={clsx(
          'rounded-md p-3 border',
          errorCount > 0
            ? 'bg-red-50 border-red-200'
            : warnCount > 0
            ? 'bg-amber-50 border-amber-200'
            : 'bg-emerald-50 border-emerald-200'
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          {errorCount > 0 ? (
            <AlertCircle size={14} className="text-red-600" />
          ) : warnCount > 0 ? (
            <AlertTriangle size={14} className="text-amber-600" />
          ) : (
            <CheckCircle2 size={14} className="text-emerald-600" />
          )}
          <span className="text-xs font-semibold font-display">
            {errorCount > 0
              ? `${errorCount} Validation Error${errorCount > 1 ? 's' : ''}`
              : warnCount > 0
              ? `${warnCount} Warning${warnCount > 1 ? 's' : ''}`
              : 'Pedigree Valid'}
          </span>
        </div>

        {validation.issues.length > 0 && (
          <div className="space-y-1 mt-2">
            {validation.issues.map((issue: import('../../domain/types').ValidationIssue, i: number) => (
              <div key={i} className={`issue-row-${issue.severity}`}>
                <IssueIcon severity={issue.severity} />
                <span className="leading-relaxed">{issue.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Case Stats ─────────────────────────────────────── */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Case Statistics</span>
        </div>
        <div className="p-3 grid grid-cols-2 gap-2">
          <Stat label="Total Individuals" value={individuals.length} />
          <Stat label="Unions / Couples" value={unionCount} />
          <Stat label="Affected" value={affectedCount} accent />
          <Stat label="Carriers" value={carrierCount} />
          <Stat label="Deceased" value={deceasedCount} />
          <Stat
            label="Inheritance"
            value={
              meta.inheritancePattern
                ? formatInheritance(meta.inheritancePattern)
                : '—'
            }
            small
          />
        </div>
      </div>

      {/* ── Proband details ────────────────────────────────── */}
      {proband && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Proband (Index Case)</span>
            <span className="font-mono text-xs text-surface-500">{proband.label}</span>
          </div>
          <div className="p-3 space-y-2 text-xs">
            {proband.firstName && (
              <Row label="Name" value={`${proband.firstName} ${proband.lastName ?? ''}`} />
            )}
            <Row label="Sex" value={proband.sex} />
            {proband.birthYear && (
              <Row label="Birth Year" value={String(proband.birthYear)} />
            )}
            <Row
              label="Affected Status"
              value={proband.affectedStatus}
              accent={proband.affectedStatus === 'affected'}
            />
            {proband.phenotypeSummary && (
              <div className="pt-1">
                <span className="field-label">Phenotype Summary</span>
                <p className="text-surface-700 leading-relaxed mt-0.5">
                  {proband.phenotypeSummary}
                </p>
              </div>
            )}
            {proband.genotypeNotes && (
              <div className="pt-1">
                <span className="field-label">Molecular Result</span>
                <p className="font-mono text-2xs text-surface-700 bg-surface-50
                              rounded px-2 py-1.5 mt-0.5 break-all">
                  {proband.genotypeNotes}
                </p>
              </div>
            )}
            {proband.hpoTerms.length > 0 && (
              <div className="pt-1">
                <span className="field-label">HPO Terms</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {proband.hpoTerms.map((t) => (
                    <span
                      key={t.id}
                      className="badge badge-info"
                      title={t.id}
                    >
                      {t.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Clinical metadata ──────────────────────────────── */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Clinical Record</span>
        </div>
        <div className="p-3 space-y-2 text-xs">
          {meta.clinicalIndication && (
            <Row label="Indication" value={meta.clinicalIndication} />
          )}
          {meta.suspectedDiagnosis && (
            <Row label="Suspected Dx" value={meta.suspectedDiagnosis} accent />
          )}
          {meta.ethnicBackground && (
            <Row label="Ethnic Background" value={meta.ethnicBackground} />
          )}
          {meta.consanguinityBackground && (
            <Row label="Consanguinity" value={meta.consanguinityBackground} />
          )}
          {meta.recordedBy && (
            <Row label="Recorded By" value={meta.recordedBy} />
          )}
          {meta.institution && (
            <Row label="Institution" value={meta.institution} />
          )}
          <Row
            label="Case ID"
            value={meta.caseId.toUpperCase()}
            mono
          />
          <Row
            label="Last Updated"
            value={new Date(meta.updatedAt).toLocaleString()}
          />
        </div>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  accent,
  small,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <div className="bg-surface-50 rounded px-2.5 py-2">
      <p className="text-2xs text-surface-400 font-display uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p
        className={clsx(
          'font-semibold',
          small ? 'text-xs' : 'text-base',
          accent ? 'text-clinical-700' : 'text-surface-800'
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
  mono,
}: {
  label: string;
  value: string;
  accent?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-2 leading-relaxed">
      <span className="text-surface-400 font-display uppercase tracking-wide text-2xs w-28 flex-shrink-0 mt-0.5">
        {label}
      </span>
      <span
        className={clsx(
          'flex-1 break-words',
          accent ? 'text-clinical-700 font-medium' : 'text-surface-700',
          mono ? 'font-mono text-2xs' : ''
        )}
      >
        {value}
      </span>
    </div>
  );
}

function IssueIcon({ severity }: { severity: ValidationSeverity }) {
  if (severity === 'error')
    return <AlertCircle size={12} className="text-red-600 flex-shrink-0 mt-0.5" />;
  if (severity === 'warning')
    return <AlertTriangle size={12} className="text-amber-600 flex-shrink-0 mt-0.5" />;
  return <Info size={12} className="text-clinical-600 flex-shrink-0 mt-0.5" />;
}

function formatInheritance(pattern: string): string {
  return pattern
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
