import React, { useRef, useState } from 'react';
import { usePedigreeStore } from '../../hooks/usePedigreeStore';
import { validatePedigree } from '../../validation';
import {
  exportSVG,
  exportPNG,
  exportJSON,
  importJSON,
  printPedigree,
} from '../../utils/exportEngine';
import {
  Download,
  FileImage,
  FileJson,
  Printer,
  Upload,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import clsx from 'clsx';

export function ExportToolbar() {
  const { pedigreeCase, loadCase } = usePedigreeStore();
  const [open, setOpen] = useState(false);
  const [pngLoading, setPngLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validation = validatePedigree(pedigreeCase);
  const hasErrors = validation.issues.some((i) => i.severity === 'error');
  const caseId = pedigreeCase.metadata.caseId;

  const handleSVG = () => {
    exportSVG(caseId);
    setOpen(false);
  };

  const handlePNG = async () => {
    setPngLoading(true);
    setOpen(false);
    try {
      await exportPNG(caseId, 2);
    } catch (err) {
      console.error('PNG export failed:', err);
      alert('PNG export failed. Try SVG export instead.');
    } finally {
      setPngLoading(false);
    }
  };

  const handleJSON = () => {
    exportJSON(pedigreeCase);
    setOpen(false);
  };

  const handlePrint = () => {
    printPedigree(pedigreeCase);
    setOpen(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportSuccess(false);

    const result = await importJSON(file);
    if (result.success && result.pedigreeCase) {
      loadCase(result.pedigreeCase);
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 3000);
    } else {
      setImportError(result.error ?? 'Unknown import error');
    }

    // Reset file input so same file can be re-imported
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="relative">
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleImport}
      />

      <div className="flex items-center gap-1.5">
        {/* Import */}
        <button
          className={clsx(
            'btn btn-sm gap-1.5',
            importSuccess
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'btn-secondary'
          )}
          onClick={() => fileInputRef.current?.click()}
          title="Import pedigree JSON"
        >
          {importSuccess ? (
            <CheckCircle2 size={13} />
          ) : (
            <Upload size={13} />
          )}
          <span className="hidden sm:inline">
            {importSuccess ? 'Imported!' : 'Import'}
          </span>
        </button>

        {/* Export dropdown */}
        <div className="relative">
          <button
            className={clsx(
              'btn btn-sm gap-1.5',
              hasErrors
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'btn-primary'
            )}
            onClick={() => setOpen((v) => !v)}
            disabled={pngLoading}
          >
            {pngLoading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Download size={13} />
            )}
            <span className="hidden sm:inline">
              {pngLoading ? 'Generating…' : 'Export'}
            </span>
            <ChevronDown size={11} />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-white border
                              border-surface-200 rounded-md shadow-modal py-1 text-sm">

                {hasErrors && (
                  <div className="flex items-start gap-2 px-3 py-2 bg-amber-50
                                  border-b border-amber-100 text-xs text-amber-800">
                    <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                    <span>Pedigree has validation errors. Export may be incomplete.</span>
                  </div>
                )}

                <p className="px-3 py-1.5 text-2xs text-surface-400 font-display
                               uppercase tracking-widest border-b border-surface-100">
                  Download
                </p>

                <ExportItem
                  icon={<Download size={13} className="text-surface-500" />}
                  label="Export SVG"
                  description="Scalable vector, embeds in reports"
                  onClick={handleSVG}
                />

                <ExportItem
                  icon={<FileImage size={13} className="text-surface-500" />}
                  label="Export PNG (2×)"
                  description="High-res raster, 300 DPI equivalent"
                  onClick={handlePNG}
                />

                <ExportItem
                  icon={<FileJson size={13} className="text-surface-500" />}
                  label="Export JSON"
                  description="Full case data, re-importable"
                  onClick={handleJSON}
                />

                <div className="border-t border-surface-100 mt-1 pt-1">
                  <ExportItem
                    icon={<Printer size={13} className="text-surface-500" />}
                    label="Print / PDF"
                    description="Opens print-optimised view"
                    onClick={handlePrint}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Import error toast */}
      {importError && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-red-50 border
                        border-red-200 rounded-md shadow-card px-3 py-2.5 text-xs text-red-800">
          <div className="flex items-start gap-2">
            <AlertTriangle size={13} className="flex-shrink-0 mt-0.5 text-red-600" />
            <div>
              <p className="font-semibold mb-0.5">Import failed</p>
              <p className="leading-relaxed">{importError}</p>
            </div>
            <button
              className="ml-auto text-red-400 hover:text-red-600"
              onClick={() => setImportError(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function ExportItem({
  icon,
  label,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-surface-50
                 transition-colors text-left"
      onClick={onClick}
    >
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <div className="text-xs font-medium text-surface-800">{label}</div>
        <div className="text-2xs text-surface-400 mt-0.5">{description}</div>
      </div>
    </button>
  );
}
