/**
 * AppHeader — redesigned premium clinical SaaS bar.
 *
 * Changes from old version:
 *   - No DNA icon
 *   - Light neutral background (#ffffff / bordered) — not dark navy
 *   - Clean wordmark only
 *   - Save / Export separated and re-styled as icon+label buttons
 *   - User avatar / login in top-right
 *   - Case status inline, not as a chip
 */

import React, { useState } from 'react';
import { usePedigreeStore } from '../../hooks/usePedigreeStore';
import { useAppStore } from '../../hooks/useAppStore';
import { validatePedigree } from '../../validation';
import { ExportMenu } from './ExportMenu';
import { AuthModal } from './AuthModal';
import { CaseDashboard } from './CaseDashboard';
import {
  Save,
  CheckCircle2,
  AlertTriangle,
  LayoutDashboard,
  ChevronDown,
  LogIn,
} from 'lucide-react';
import clsx from 'clsx';

export function AppHeader() {
  const { pedigreeCase } = usePedigreeStore();
  const {
    user, isAuthOpen, authView, isDashboardOpen,
    openAuth, openDashboard, saveCase, activeSavedCaseId, updateSavedCase,
  } = useAppStore();

  const [saveFlash, setSaveFlash] = useState(false);

  const validation = validatePedigree(pedigreeCase);
  const errorCount = validation.issues.filter((i: { severity: string }) => i.severity === 'error').length;
  const warnCount  = validation.issues.filter((i: { severity: string }) => i.severity === 'warning').length;
  const hasIndividuals = Object.values(pedigreeCase.individuals).filter(
    (i) => !i.id.startsWith('unknown_')
  ).length > 0;

  const caseTitle = pedigreeCase.metadata.suspectedDiagnosis
    || pedigreeCase.metadata.clinicalIndication?.slice(0, 72)
    || null;

  const handleSave = () => {
    if (activeSavedCaseId) {
      updateSavedCase(activeSavedCaseId, pedigreeCase);
    } else {
      saveCase(pedigreeCase);
    }
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1600);
  };

  return (
    <>
      <header
        style={{
          height: '48px',
          background: '#ffffff',
          borderBottom: '1px solid #e4e8ed',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: '0',
          zIndex: 40,
          flexShrink: 0,
        }}
      >
        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginRight: '20px', flexShrink: 0 }}>
          <span style={{
            fontSize: '15px',
            fontWeight: '700',
            color: '#111418',
            letterSpacing: '-0.02em',
          }}>
            ClinPed
          </span>
          <span style={{ fontSize: '10px', color: '#8b92a0', fontFamily: 'JetBrains Mono, monospace' }}>
            v1.0
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: '#e4e8ed', marginRight: '16px', flexShrink: 0 }} />

        {/* Dashboard toggle */}
        <button
          onClick={openDashboard}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '0 10px', height: '30px', borderRadius: '6px',
            fontSize: '12.5px', fontWeight: '500', color: '#4a5260',
            background: 'transparent', border: 'none', cursor: 'pointer',
            transition: 'background 0.1s',
            flexShrink: 0,
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#f5f6f8')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
          title="My cases"
        >
          <LayoutDashboard size={13} />
          Cases
        </button>

        {/* Case identity — centre */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '10px', padding: '0 12px' }}>
          {hasIndividuals && (
            <>
              <span style={{
                fontSize: '10.5px', fontFamily: 'JetBrains Mono, monospace',
                color: '#b8bec8', letterSpacing: '0.08em',
              }}>
                {pedigreeCase.metadata.caseId.slice(0, 8).toUpperCase()}
              </span>
              {caseTitle && (
                <span style={{
                  fontSize: '13px', color: '#4a5260',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  maxWidth: '400px',
                }}>
                  {caseTitle}
                </span>
              )}
              <ValidationPill errors={errorCount} warnings={warnCount} />
            </>
          )}
          {!hasIndividuals && (
            <span style={{ fontSize: '12.5px', color: '#b8bec8', fontStyle: 'italic' }}>
              Paste a clinical narrative and generate a pedigree
            </span>
          )}
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {hasIndividuals && (
            <>
              {/* Save */}
              <button
                onClick={handleSave}
                className={clsx('btn btn-sm', saveFlash ? 'btn-primary' : 'btn-secondary')}
                style={{ gap: '5px' }}
                title="Save case (Ctrl+S)"
              >
                {saveFlash ? <CheckCircle2 size={12} /> : <Save size={12} />}
                {saveFlash ? 'Saved' : 'Save'}
              </button>

              {/* Export */}
              <ExportMenu />
            </>
          )}

          {/* Auth */}
          {user ? (
            <button
              onClick={() => openAuth('profile')}
              style={{
                width: 30, height: 30, borderRadius: '50%',
                background: '#2563eb', color: '#fff',
                fontSize: '11px', fontWeight: '600',
                border: 'none', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              title={`${user.name} — click to view profile`}
            >
              {user.avatarInitials}
            </button>
          ) : (
            <button
              onClick={() => openAuth('login')}
              className="btn btn-secondary btn-sm"
              style={{ gap: '5px' }}
            >
              <LogIn size={12} />
              Sign in
            </button>
          )}
        </div>
      </header>

      {/* Modals */}
      {isAuthOpen && <AuthModal view={authView} />}
      {isDashboardOpen && <CaseDashboard />}
    </>
  );
}

function ValidationPill({ errors, warnings }: { errors: number; warnings: number }) {
  if (errors > 0) return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontSize: '11px', color: '#dc2626',
      background: '#fef2f2', border: '1px solid #fecaca',
      borderRadius: '99px', padding: '1px 8px',
    }}>
      <AlertTriangle size={10} />
      {errors} error{errors > 1 ? 's' : ''}
    </span>
  );
  if (warnings > 0) return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontSize: '11px', color: '#d97706',
      background: '#fffbeb', border: '1px solid #fde68a',
      borderRadius: '99px', padding: '1px 8px',
    }}>
      <AlertTriangle size={10} />
      {warnings} warning{warnings > 1 ? 's' : ''}
    </span>
  );
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontSize: '11px', color: '#059669',
      background: '#ecfdf5', border: '1px solid #a7f3d0',
      borderRadius: '99px', padding: '1px 8px',
    }}>
      <CheckCircle2 size={10} />
      Valid
    </span>
  );
}
