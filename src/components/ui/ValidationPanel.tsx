import React, { useState } from 'react';
import { usePedigreeStore } from '../../hooks/usePedigreeStore';
import { validatePedigree } from '../../validation';
import type { ValidationIssue, ValidationSeverity } from '../../domain/types';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  ChevronDown,
  Filter,
} from 'lucide-react';
import clsx from 'clsx';

type SeverityFilter = ValidationSeverity | 'all';

export function ValidationPanel() {
  const { pedigreeCase, selectIndividual } = usePedigreeStore();
  const [filter, setFilter] = useState<SeverityFilter>('all');
  const [open, setOpen] = useState(true);

  const validation = validatePedigree(pedigreeCase);
  const all = validation.issues;

  const counts = {
    error: all.filter((i) => i.severity === 'error').length,
    warning: all.filter((i) => i.severity === 'warning').length,
    info: all.filter((i) => i.severity === 'info').length,
  };

  const visible = filter === 'all' ? all : all.filter((i) => i.severity === filter);

  const handleIssueClick = (issue: ValidationIssue) => {
    if (issue.entityType === 'individual' && issue.entityId) {
      selectIndividual(issue.entityId);
    }
  };

  return (
    <div className="panel overflow-hidden">
      {/* Header */}
      <button
        className="panel-header w-full text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <ValidationStatusIcon counts={counts} />
          <span className="panel-title">Validation</span>

          {/* Severity badges */}
          <div className="flex items-center gap-1 ml-1">
            {counts.error > 0 && (
              <span className="badge badge-error">{counts.error}</span>
            )}
            {counts.warning > 0 && (
              <span className="badge badge-warning">{counts.warning}</span>
            )}
            {counts.info > 0 && (
              <span className="badge badge-info">{counts.info}</span>
            )}
            {all.length === 0 && (
              <span className="text-2xs text-emerald-600 font-semibold font-display">
                OK
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          size={13}
          className={clsx(
            'text-surface-400 transition-transform duration-150',
            open ? 'rotate-0' : '-rotate-90'
          )}
        />
      </button>

      {open && (
        <div>
          {all.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-3 text-xs text-emerald-700
                            bg-emerald-50 border-t border-emerald-100">
              <CheckCircle2 size={14} className="text-emerald-600" />
              Pedigree is valid. No issues found.
            </div>
          ) : (
            <>
              {/* Filter bar */}
              <div className="flex items-center gap-1 px-3 py-2 border-t border-b
                              border-surface-100 bg-surface-50">
                <Filter size={11} className="text-surface-400 mr-1" />
                {(
                  [
                    { id: 'all', label: `All (${all.length})` },
                    { id: 'error', label: `Errors (${counts.error})` },
                    { id: 'warning', label: `Warnings (${counts.warning})` },
                    { id: 'info', label: `Info (${counts.info})` },
                  ] as { id: SeverityFilter; label: string }[]
                ).map((f) => (
                  <button
                    key={f.id}
                    className={clsx(
                      'px-2 py-0.5 rounded text-2xs font-display font-semibold',
                      'transition-colors uppercase tracking-wide',
                      filter === f.id
                        ? 'bg-clinical-700 text-white'
                        : 'text-surface-500 hover:text-surface-700'
                    )}
                    onClick={() => setFilter(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Issue list */}
              <div className="divide-y divide-surface-100 max-h-60 overflow-y-auto">
                {visible.length === 0 ? (
                  <p className="text-xs text-surface-400 italic px-4 py-3">
                    No {filter} issues.
                  </p>
                ) : (
                  visible.map((issue, idx) => (
                    <IssueRow
                      key={idx}
                      issue={issue}
                      onClick={() => handleIssueClick(issue)}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function IssueRow({
  issue,
  onClick,
}: {
  issue: ValidationIssue;
  onClick: () => void;
}) {
  const isClickable = issue.entityType === 'individual' && !!issue.entityId;

  return (
    <div
      className={clsx(
        'flex items-start gap-2.5 px-3 py-2.5 text-xs',
        'transition-colors duration-100',
        isClickable && 'cursor-pointer hover:bg-surface-50',
        issue.severity === 'error' && 'bg-red-50/60',
        issue.severity === 'warning' && 'bg-amber-50/60'
      )}
      onClick={onClick}
      title={isClickable ? 'Click to select individual' : undefined}
    >
      <IssueIcon severity={issue.severity} />
      <div className="flex-1 min-w-0">
        <p className="leading-relaxed text-surface-700">{issue.message}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-2xs font-mono text-surface-400">{issue.code}</span>
          {issue.entityType && (
            <span className="text-2xs text-surface-400">
              · {issue.entityType}
              {issue.entityId ? ` ${issue.entityId.slice(0, 6)}…` : ''}
            </span>
          )}
          {isClickable && (
            <span className="text-2xs text-clinical-500 ml-auto">click to select →</span>
          )}
        </div>
      </div>
    </div>
  );
}

function IssueIcon({ severity }: { severity: ValidationSeverity }) {
  if (severity === 'error')
    return <AlertCircle size={13} className="text-red-600 flex-shrink-0 mt-0.5" />;
  if (severity === 'warning')
    return <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />;
  return <Info size={13} className="text-clinical-500 flex-shrink-0 mt-0.5" />;
}

function ValidationStatusIcon({
  counts,
}: {
  counts: { error: number; warning: number; info: number };
}) {
  if (counts.error > 0)
    return <AlertCircle size={13} className="text-red-600" />;
  if (counts.warning > 0)
    return <AlertTriangle size={13} className="text-amber-500" />;
  return <CheckCircle2 size={13} className="text-emerald-600" />;
}
