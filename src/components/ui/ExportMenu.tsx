import React, { useRef, useState } from 'react';
import { usePedigreeStore } from '../../hooks/usePedigreeStore';
import { exportSVG, exportPNG, exportJSON, importJSON, printPedigree } from '../../utils/exportEngine';
import { Download, FileImage, FileJson, Printer, Upload, ChevronDown, Loader2 } from 'lucide-react';

export function ExportMenu() {
  const { pedigreeCase, loadCase } = usePedigreeStore();
  const [open, setOpen] = useState(false);
  const [pngLoading, setPngLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const caseId = pedigreeCase.metadata.caseId;

  const close = () => setOpen(false);

  const handlePNG = async () => {
    setPngLoading(true);
    close();
    try { await exportPNG(caseId, 2); } finally { setPngLoading(false); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await importJSON(file);
    if (result.success && result.pedigreeCase) loadCase(result.pedigreeCase);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{ position: 'relative' }}>
      <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />

      <button
        onClick={() => setOpen((v) => !v)}
        className="btn btn-secondary btn-sm"
        style={{ gap: '5px' }}
        disabled={pngLoading}
      >
        {pngLoading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
        Export
        <ChevronDown size={10} />
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={close} />
          <div style={{
            position: 'absolute', right: 0, top: '100%', marginTop: '4px',
            width: '192px', background: '#fff',
            border: '1px solid #e4e8ed', borderRadius: '10px',
            boxShadow: '0 8px 24px rgb(0 0 0 / 0.10), 0 2px 6px rgb(0 0 0 / 0.06)',
            zIndex: 50, overflow: 'hidden', padding: '4px',
          }}>
            <MenuSection label="Download" />
            <MenuItem icon={<Download size={13} />} label="SVG" desc="Vector, best for reports" onClick={() => { exportSVG(caseId); close(); }} />
            <MenuItem icon={<FileImage size={13} />} label="PNG (2×)" desc="High-res raster" onClick={handlePNG} />
            <MenuItem icon={<FileJson size={13} />} label="JSON" desc="Re-importable case file" onClick={() => { exportJSON(pedigreeCase); close(); }} />
            <div style={{ margin: '4px 0', borderTop: '1px solid #e4e8ed' }} />
            <MenuItem icon={<Printer size={13} />} label="Print / PDF" desc="A4 clinical layout" onClick={() => { printPedigree(pedigreeCase); close(); }} />
            <div style={{ margin: '4px 0', borderTop: '1px solid #e4e8ed' }} />
            <MenuSection label="Import" />
            <MenuItem icon={<Upload size={13} />} label="Import JSON" desc="Load a saved case" onClick={() => { fileInputRef.current?.click(); close(); }} />
          </div>
        </>
      )}
    </div>
  );
}

function MenuSection({ label }: { label: string }) {
  return (
    <p style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8b92a0', padding: '6px 10px 3px' }}>
      {label}
    </p>
  );
}

function MenuItem({ icon, label, desc, onClick }: { icon: React.ReactNode; label: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
        padding: '7px 10px', borderRadius: '6px', border: 'none',
        background: 'transparent', cursor: 'pointer', textAlign: 'left',
        transition: 'background 0.08s',
      }}
      onMouseOver={(e) => (e.currentTarget.style.background = '#f5f6f8')}
      onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <span style={{ color: '#8b92a0', flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: '12.5px', fontWeight: '500', color: '#111418' }}>{label}</div>
        <div style={{ fontSize: '11px', color: '#8b92a0', marginTop: '1px' }}>{desc}</div>
      </div>
    </button>
  );
}
