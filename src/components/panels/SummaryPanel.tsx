import React from 'react';
import { usePedigreeStore } from '../../hooks/usePedigreeStore';
import { validatePedigree } from '../../validation';
import { getProband } from '../../domain/operations';
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import type { ValidationSeverity } from '../../domain/types';

export function SummaryPanel() {
  const { pedigreeCase } = usePedigreeStore();
  const meta = pedigreeCase.metadata;
  const validation = validatePedigree(pedigreeCase);
  const proband = getProband(pedigreeCase);

  const individuals = Object.values(pedigreeCase.individuals).filter(
    (i) => !i.id.startsWith('unknown_')
  );
  const affectedCount  = individuals.filter((i) => i.affectedStatus === 'affected').length;
  const carrierCount   = individuals.filter((i) => i.affectedStatus === 'carrier').length;
  const deceasedCount  = individuals.filter((i) => i.deceasedStatus === 'deceased').length;
  const unionCount     = Object.keys(pedigreeCase.unions).length;

  const errorCount   = validation.issues.filter((i: { severity: string }) => i.severity === 'error').length;
  const warnCount    = validation.issues.filter((i: { severity: string }) => i.severity === 'warning').length;

  if (individuals.length === 0) {
    return (
      <div style={{ padding: '32px 20px', textAlign: 'center', color: '#b8bec8' }}>
        <p style={{ fontSize: '13px', fontWeight: '500', margin: '0 0 5px' }}>No pedigree to summarise</p>
        <p style={{ fontSize: '12px', margin: 0 }}>Generate a pedigree first</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Validation status */}
      <div style={{
        padding: '12px 14px', borderRadius: '10px',
        background: errorCount > 0 ? '#fff1f2' : warnCount > 0 ? '#fffbeb' : '#f0fdf4',
        border: `1px solid ${errorCount > 0 ? '#fecdd3' : warnCount > 0 ? '#fde68a' : '#bbf7d0'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: validation.issues.length ? '8px' : '0' }}>
          {errorCount > 0
            ? <AlertCircle size={14} color="#dc2626" />
            : warnCount > 0
            ? <AlertTriangle size={14} color="#d97706" />
            : <CheckCircle2 size={14} color="#059669" />
          }
          <span style={{ fontSize: '13px', fontWeight: '500', color: errorCount > 0 ? '#be123c' : warnCount > 0 ? '#92400e' : '#166534' }}>
            {errorCount > 0 ? `${errorCount} validation error${errorCount > 1 ? 's' : ''}` : warnCount > 0 ? `${warnCount} warning${warnCount > 1 ? 's' : ''}` : 'Pedigree valid'}
          </span>
        </div>
        {validation.issues.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {validation.issues.slice(0, 4).map((issue, i) => (
              <div key={i} className={`issue-row-${issue.severity}`}>
                <IssueIcon severity={issue.severity} />
                <span>{issue.message}</span>
              </div>
            ))}
            {validation.issues.length > 4 && (
              <p style={{ fontSize: '11px', color: '#8b92a0', margin: 0, paddingLeft: '2px' }}>
                +{validation.issues.length - 4} more — see Validate tab
              </p>
            )}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {[
          { label: 'Individuals', value: individuals.length },
          { label: 'Unions',      value: unionCount },
          { label: 'Affected',    value: affectedCount, accent: true },
          { label: 'Carriers',    value: carrierCount },
          { label: 'Deceased',    value: deceasedCount },
          { label: 'Inheritance', value: formatPattern(meta.inheritancePattern), small: true },
        ].map((s) => (
          <div key={s.label} style={{
            background: '#fafbfc', border: '1px solid #e4e8ed', borderRadius: '8px', padding: '10px 12px',
          }}>
            <p style={{ fontSize: '10.5px', fontWeight: '500', color: '#8b92a0', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {s.label}
            </p>
            <p style={{ fontSize: s.small ? '13px' : '20px', fontWeight: '600', margin: 0, color: s.accent ? '#2563eb' : '#111418' }}>
              {s.value ?? '—'}
            </p>
          </div>
        ))}
      </div>

      {/* Proband card */}
      {proband && (
        <div style={{ border: '1px solid #e4e8ed', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', background: '#fafbfc', borderBottom: '1px solid #e4e8ed', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#8b92a0' }}>Proband</span>
            <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#b8bec8' }}>{proband.label}</span>
          </div>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {[
              { label: 'Sex', value: proband.sex },
              proband.birthYear ? { label: 'Birth year', value: String(proband.birthYear) } : null,
              { label: 'Status', value: proband.affectedStatus, accent: proband.affectedStatus === 'affected' },
            ].filter(Boolean).map((r) => r && (
              <Row key={r.label} label={r.label} value={r.value} accent={r.accent} />
            ))}
            {proband.phenotypeSummary && (
              <div>
                <p style={{ fontSize: '10.5px', fontWeight: '500', color: '#8b92a0', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Phenotype</p>
                <p style={{ fontSize: '12.5px', color: '#4a5260', margin: 0, lineHeight: 1.5 }}>{proband.phenotypeSummary}</p>
              </div>
            )}
            {proband.genotypeNotes && (
              <div>
                <p style={{ fontSize: '10.5px', fontWeight: '500', color: '#8b92a0', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Molecular</p>
                <p style={{ fontSize: '11.5px', fontFamily: 'JetBrains Mono, monospace', color: '#4a5260', margin: 0, wordBreak: 'break-all', background: '#f5f6f8', padding: '6px 8px', borderRadius: '6px' }}>
                  {proband.genotypeNotes}
                </p>
              </div>
            )}
            {proband.hpoTerms.length > 0 && (
              <div>
                <p style={{ fontSize: '10.5px', fontWeight: '500', color: '#8b92a0', margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>HPO Terms</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {proband.hpoTerms.map((t) => (
                    <span key={t.id} className="badge badge-info" title={t.id}>{t.label}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Case metadata */}
      <div style={{ border: '1px solid #e4e8ed', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', background: '#fafbfc', borderBottom: '1px solid #e4e8ed' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#8b92a0' }}>Case Record</span>
        </div>
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            meta.clinicalIndication  && { label: 'Indication', value: meta.clinicalIndication },
            meta.suspectedDiagnosis  && { label: 'Diagnosis',  value: meta.suspectedDiagnosis, accent: true },
            meta.ethnicBackground    && { label: 'Ethnicity',  value: meta.ethnicBackground },
            meta.consanguinityBackground && { label: 'Consanguinity', value: meta.consanguinityBackground },
            meta.recordedBy          && { label: 'Recorded by', value: meta.recordedBy },
            meta.institution         && { label: 'Institution', value: meta.institution },
            { label: 'Case ID', value: meta.caseId.toUpperCase(), mono: true },
            { label: 'Updated', value: new Date(meta.updatedAt).toLocaleString() },
          ].filter(Boolean).map((r) => r && (
            <Row key={r.label} label={r.label} value={r.value} accent={r.accent} mono={r.mono} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent, mono }: { label: string; value: string; accent?: boolean; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '11px', color: '#8b92a0', minWidth: '90px', flexShrink: 0, paddingTop: '1px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '500' }}>
        {label}
      </span>
      <span style={{
        fontSize: mono ? '11px' : '12.5px', flex: 1, wordBreak: 'break-word',
        fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit',
        color: accent ? '#2563eb' : '#111418', fontWeight: accent ? '500' : '400',
      }}>
        {value}
      </span>
    </div>
  );
}

function IssueIcon({ severity }: { severity: ValidationSeverity }) {
  if (severity === 'error')   return <AlertCircle size={12} color="#dc2626" style={{ flexShrink: 0, marginTop: '1px' }} />;
  if (severity === 'warning') return <AlertTriangle size={12} color="#d97706" style={{ flexShrink: 0, marginTop: '1px' }} />;
  return <Info size={12} color="#2563eb" style={{ flexShrink: 0, marginTop: '1px' }} />;
}

function formatPattern(p: string | null | undefined): string {
  if (!p) return '—';
  return p.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
