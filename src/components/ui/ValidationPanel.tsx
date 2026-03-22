import React, { useState } from 'react';
import { usePedigreeStore } from '../../hooks/usePedigreeStore';
import { validatePedigree } from '../../validation';
import type { ValidationIssue, ValidationSeverity } from '../../domain/types';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, Filter } from 'lucide-react';

type SeverityFilter = ValidationSeverity | 'all';

export function ValidationPanel() {
  const { pedigreeCase, selectIndividual } = usePedigreeStore();
  const [filter, setFilter] = useState<SeverityFilter>('all');
  const validation = validatePedigree(pedigreeCase);
  const all = validation.issues;
  const counts = {
    error:   all.filter((i) => i.severity === 'error').length,
    warning: all.filter((i) => i.severity === 'warning').length,
    info:    all.filter((i) => i.severity === 'info').length,
  };
  const visible = filter === 'all' ? all : all.filter((i) => i.severity === filter);

  if (all.length === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '14px 16px', borderRadius: '10px',
        background: '#f0fdf4', border: '1px solid #bbf7d0',
      }}>
        <CheckCircle2 size={15} color="#059669" />
        <span style={{ fontSize: '13px', fontWeight: '500', color: '#166534' }}>Pedigree is valid — no issues found.</span>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid #e4e8ed', borderRadius: '10px', overflow: 'hidden' }}>
      {/* Header + filters */}
      <div style={{ padding: '10px 14px', background: '#fafbfc', borderBottom: '1px solid #e4e8ed', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <Filter size={12} color="#8b92a0" />
        {([
          { id: 'all',     label: `All (${all.length})` },
          { id: 'error',   label: `Errors (${counts.error})` },
          { id: 'warning', label: `Warnings (${counts.warning})` },
          { id: 'info',    label: `Info (${counts.info})` },
        ] as { id: SeverityFilter; label: string }[]).map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '2px 9px', borderRadius: '99px', border: 'none', cursor: 'pointer',
            fontSize: '11.5px', fontWeight: '500', fontFamily: 'inherit',
            background: filter === f.id ? '#111418' : 'transparent',
            color: filter === f.id ? '#fff' : '#4a5260',
            transition: 'all 0.1s',
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Issue list */}
      <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
        {visible.length === 0
          ? <p style={{ fontSize: '12px', color: '#8b92a0', padding: '14px 16px', margin: 0 }}>No {filter} issues.</p>
          : visible.map((issue, i) => (
              <IssueRow key={i} issue={issue}
                onClick={() => issue.entityType === 'individual' && issue.entityId && selectIndividual(issue.entityId)}
              />
            ))
        }
      </div>
    </div>
  );
}

function IssueRow({ issue, onClick }: { issue: ValidationIssue; onClick: () => void }) {
  const clickable = issue.entityType === 'individual' && !!issue.entityId;
  const colors = {
    error:   { bg: 'transparent', hover: '#fff1f2', icon: <AlertCircle size={12} color="#dc2626" style={{ flexShrink: 0, marginTop: '1px' }} /> },
    warning: { bg: 'transparent', hover: '#fffbeb', icon: <AlertTriangle size={12} color="#d97706" style={{ flexShrink: 0, marginTop: '1px' }} /> },
    info:    { bg: 'transparent', hover: '#eff6ff', icon: <Info size={12} color="#2563eb" style={{ flexShrink: 0, marginTop: '1px' }} /> },
  }[issue.severity];

  return (
    <div
      onClick={clickable ? onClick : undefined}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '9px',
        padding: '10px 14px', cursor: clickable ? 'pointer' : 'default',
        borderBottom: '1px solid #e4e8ed', transition: 'background 0.08s',
      }}
      onMouseOver={(e) => { if (clickable) (e.currentTarget.style.background = colors.hover); }}
      onMouseOut={(e) => { (e.currentTarget.style.background = 'transparent'); }}
    >
      {colors.icon}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '12.5px', color: '#111418', margin: '0 0 2px', lineHeight: 1.4 }}>{issue.message}</p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '10.5px', fontFamily: 'JetBrains Mono, monospace', color: '#b8bec8' }}>{issue.code}</span>
          {clickable && <span style={{ fontSize: '10.5px', color: '#2563eb' }}>click to select →</span>}
        </div>
      </div>
    </div>
  );
}
