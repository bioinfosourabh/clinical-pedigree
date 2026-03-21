import React, { useState } from 'react';
import { Dna, FolderOpen, RotateCcw, ChevronDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { usePedigreeStore } from '../../hooks/usePedigreeStore';
import { validatePedigree } from '../../validation';
import { SAMPLE_CASES } from '../../data/sampleCases';
import { ExportToolbar } from './ExportToolbar';

export function AppHeader() {
  const { pedigreeCase, loadCase, resetCase } = usePedigreeStore();
  const [sampleMenuOpen, setSampleMenuOpen] = useState(false);

  const validation = validatePedigree(pedigreeCase);
  const errorCount = validation.issues.filter((i: { severity: string }) => i.severity === 'error').length;
  const warnCount  = validation.issues.filter((i: { severity: string }) => i.severity === 'warning').length;

  const caseTitle =
    pedigreeCase.metadata.suspectedDiagnosis ||
    pedigreeCase.metadata.clinicalIndication ||
    'Untitled Case';

  return (
    <header className="flex-shrink-0 h-12 bg-clinical-950 border-b border-clinical-900
                       flex items-center px-4 gap-3 z-30">
      {/* Brand */}
      <div className="flex items-center gap-2 mr-1">
        <Dna size={18} className="text-clinical-400" strokeWidth={1.5} />
        <span className="font-display font-semibold text-white tracking-wider text-sm">ClinPed</span>
        <span className="text-clinical-600 text-xs font-mono hidden sm:block">v1.0</span>
      </div>

      <div className="w-px h-6 bg-clinical-800" />

      {/* Case title */}
      <div className="flex-1 min-w-0 hidden sm:flex items-center gap-3">
        <span className="font-mono text-2xs text-clinical-500 uppercase tracking-widest">
          {pedigreeCase.metadata.caseId.slice(0, 8).toUpperCase()}
        </span>
        <span className="text-clinical-300 text-xs truncate max-w-xs opacity-80">{caseTitle}</span>
      </div>

      {/* Validation chip */}
      <ValidationChip errors={errorCount} warnings={warnCount} />

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {/* Sample loader */}
        <div className="relative">
          <button
            className="btn btn-sm flex items-center gap-1 bg-clinical-900 text-clinical-300
                       border border-clinical-800 hover:bg-clinical-800 hover:text-white"
            onClick={() => setSampleMenuOpen((v) => !v)}
          >
            <FolderOpen size={13} />
            <span className="hidden sm:inline">Samples</span>
            <ChevronDown size={11} />
          </button>

          {sampleMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSampleMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-72 bg-white border
                              border-surface-200 rounded-md shadow-modal py-1 text-sm">
                <p className="px-3 py-1.5 text-2xs text-surface-400 font-display uppercase
                               tracking-widest border-b border-surface-100">
                  Sample Cases
                </p>
                {Object.entries(SAMPLE_CASES).map(([name, sc]) => (
                  <button
                    key={sc.metadata.caseId}
                    className="w-full text-left px-3 py-2.5 hover:bg-surface-50 transition-colors"
                    onClick={() => { loadCase(sc); setSampleMenuOpen(false); }}
                  >
                    <div className="font-medium text-surface-800 text-xs">{name}</div>
                    <div className="text-2xs text-surface-500 mt-0.5 truncate">
                      {sc.metadata.clinicalIndication}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Reset */}
        <button
          className="btn btn-sm bg-clinical-900 text-clinical-400 border border-clinical-800
                     hover:bg-clinical-800 hover:text-white"
          onClick={resetCase}
          title="Reset to default sample"
        >
          <RotateCcw size={13} />
          <span className="hidden sm:inline">Reset</span>
        </button>

        <div className="w-px h-5 bg-clinical-800" />

        {/* Export toolbar */}
        <ExportToolbar />
      </div>
    </header>
  );
}

function ValidationChip({ errors, warnings }: { errors: number; warnings: number }) {
  if (errors > 0) {
    return (
      <div className="flex items-center gap-1 text-red-400 text-xs">
        <AlertTriangle size={13} />
        <span className="hidden sm:inline font-mono">{errors} error{errors > 1 ? 's' : ''}</span>
      </div>
    );
  }
  if (warnings > 0) {
    return (
      <div className="flex items-center gap-1 text-amber-400 text-xs">
        <AlertTriangle size={13} />
        <span className="hidden sm:inline font-mono">{warnings} warning{warnings > 1 ? 's' : ''}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-emerald-400 text-xs">
      <CheckCircle2 size={13} />
      <span className="hidden sm:inline font-mono">Valid</span>
    </div>
  );
}
