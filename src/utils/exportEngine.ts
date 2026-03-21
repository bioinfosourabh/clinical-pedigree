/**
 * Export Engine
 *
 * Provides all export paths from a PedigreeCase:
 *   exportSVG     — downloads the rendered SVG directly
 *   exportPNG     — rasterises via OffscreenCanvas / Canvas API, downloads PNG
 *   exportJSON    — serialises the full PedigreeCase to a structured JSON file
 *   importJSON    — parses and validates a PedigreeCase JSON file
 *   printPedigree — opens a print-optimised window with the SVG embedded
 *
 * All functions are pure (no React hooks) so they can be called from any
 * event handler without hook rules.
 */

import type { PedigreeCase } from '../domain/types';

// ─────────────────────────────────────────────────────────────────────────────
// SVG Export
// ─────────────────────────────────────────────────────────────────────────────

export function exportSVG(caseId: string): void {
  const svgEl = document.getElementById('pedigree-svg') as SVGSVGElement | null;
  if (!svgEl) {
    alert('Pedigree SVG not found. Make sure the pedigree canvas is visible.');
    return;
  }

  // Clone so we can embed fonts / inline styles without mutating the live DOM
  const clone = svgEl.cloneNode(true) as SVGSVGElement;

  // Embed a minimal font-face declaration so the SVG is self-contained
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
    text { font-family: 'IBM Plex Mono', 'Courier New', monospace; }
  `;
  clone.insertBefore(style, clone.firstChild);

  const serialiser = new XMLSerializer();
  const svgStr = serialiser.serializeToString(clone);
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });

  triggerDownload(blob, `pedigree-${caseId.slice(0, 8).toUpperCase()}.svg`);
}

// ─────────────────────────────────────────────────────────────────────────────
// PNG Export
// ─────────────────────────────────────────────────────────────────────────────

export async function exportPNG(
  caseId: string,
  scale: number = 2
): Promise<void> {
  const svgEl = document.getElementById('pedigree-svg') as SVGSVGElement | null;
  if (!svgEl) {
    alert('Pedigree SVG not found. Make sure the pedigree canvas is visible.');
    return;
  }

  const serialiser = new XMLSerializer();
  const svgStr = serialiser.serializeToString(svgEl);
  const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const svgW = svgEl.viewBox.baseVal.width || svgEl.width.baseVal.value;
  const svgH = svgEl.viewBox.baseVal.height || svgEl.height.baseVal.value;

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svgW * scale;
      canvas.height = svgH * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Could not get 2D canvas context'));
        return;
      }

      // White background (SVG may be transparent)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, svgW, svgH);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('PNG conversion failed'));
          return;
        }
        triggerDownload(blob, `pedigree-${caseId.slice(0, 8).toUpperCase()}.png`);
        resolve();
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG for PNG conversion'));
    };

    img.src = url;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON Export
// ─────────────────────────────────────────────────────────────────────────────

export interface ExportedPedigreeJSON {
  /** Schema identifier for forward compatibility */
  _schema: 'clinped-v1';
  exportedAt: string;
  pedigreeCase: PedigreeCase;
}

export function exportJSON(pedigreeCase: PedigreeCase): void {
  const payload: ExportedPedigreeJSON = {
    _schema: 'clinped-v1',
    exportedAt: new Date().toISOString(),
    pedigreeCase,
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  triggerDownload(
    blob,
    `pedigree-${pedigreeCase.metadata.caseId.slice(0, 8).toUpperCase()}.json`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON Import
// ─────────────────────────────────────────────────────────────────────────────

export interface ImportResult {
  success: boolean;
  pedigreeCase?: PedigreeCase;
  error?: string;
}

export async function importJSON(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        // Minimal schema validation
        if (!parsed._schema || !parsed.pedigreeCase) {
          resolve({
            success: false,
            error:
              'Invalid file format. Expected a ClinPed JSON export with _schema and pedigreeCase fields.',
          });
          return;
        }

        if (parsed._schema !== 'clinped-v1') {
          resolve({
            success: false,
            error: `Unsupported schema version: ${parsed._schema}. This app supports clinped-v1.`,
          });
          return;
        }

        const pc = parsed.pedigreeCase as PedigreeCase;

        // Basic structural checks
        if (!pc.metadata || !pc.individuals || !pc.unions) {
          resolve({
            success: false,
            error: 'Malformed pedigree case: missing metadata, individuals, or unions.',
          });
          return;
        }

        resolve({ success: true, pedigreeCase: pc });
      } catch (err) {
        resolve({
          success: false,
          error: `JSON parse error: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    };

    reader.onerror = () =>
      resolve({ success: false, error: 'File read error.' });

    reader.readAsText(file);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Print view
// ─────────────────────────────────────────────────────────────────────────────

export function printPedigree(pedigreeCase: PedigreeCase): void {
  const svgEl = document.getElementById('pedigree-svg') as SVGSVGElement | null;
  if (!svgEl) {
    alert('Pedigree SVG not found.');
    return;
  }

  const serialiser = new XMLSerializer();
  const svgStr = serialiser.serializeToString(svgEl);

  const meta = pedigreeCase.metadata;
  const date = new Date(meta.updatedAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Pedigree — ${meta.caseId.slice(0, 8).toUpperCase()}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'IBM Plex Sans', system-ui, sans-serif;
      font-size: 11pt;
      color: #1a1a2e;
      background: #fff;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 16pt 20pt 10pt;
      border-bottom: 1.5pt solid #1a1a2e;
      margin-bottom: 16pt;
    }

    .header-left h1 {
      font-size: 14pt;
      font-weight: 600;
      margin-bottom: 3pt;
    }

    .header-left .sub {
      font-size: 9pt;
      color: #475569;
    }

    .header-right {
      text-align: right;
      font-size: 8.5pt;
      color: #64748b;
      font-family: 'IBM Plex Mono', monospace;
      line-height: 1.6;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4pt 16pt;
      padding: 0 20pt 12pt;
      font-size: 9pt;
    }

    .meta-row { display: flex; gap: 6pt; }
    .meta-label {
      color: #64748b;
      font-family: 'IBM Plex Mono', monospace;
      white-space: nowrap;
      min-width: 100pt;
    }
    .meta-value { color: #1e293b; font-weight: 500; }

    .pedigree-wrap {
      padding: 0 20pt;
      page-break-inside: avoid;
    }

    .pedigree-wrap svg {
      max-width: 100%;
      height: auto;
    }

    .footer {
      margin-top: 20pt;
      padding: 10pt 20pt 0;
      border-top: 0.75pt solid #cbd5e1;
      font-size: 7.5pt;
      color: #94a3b8;
      font-family: 'IBM Plex Mono', monospace;
      display: flex;
      justify-content: space-between;
    }

    @media print {
      @page { size: A4 landscape; margin: 10mm; }
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>${meta.suspectedDiagnosis ?? meta.clinicalIndication ?? 'Clinical Pedigree'}</h1>
      <div class="sub">
        ${meta.institution ?? 'Clinical Genomics Unit'}
        ${meta.recordedBy ? ' · ' + meta.recordedBy : ''}
      </div>
    </div>
    <div class="header-right">
      Case: ${meta.caseId.slice(0, 8).toUpperCase()}<br/>
      Date: ${date}<br/>
      Schema: ${meta.schemaVersion}
    </div>
  </div>

  <div class="meta-grid">
    ${meta.inheritancePattern ? `<div class="meta-row"><span class="meta-label">Inheritance</span><span class="meta-value">${formatPattern(meta.inheritancePattern)}</span></div>` : ''}
    ${meta.ethnicBackground ? `<div class="meta-row"><span class="meta-label">Ethnicity</span><span class="meta-value">${meta.ethnicBackground}</span></div>` : ''}
    ${meta.consanguinityBackground ? `<div class="meta-row"><span class="meta-label">Consanguinity</span><span class="meta-value">${meta.consanguinityBackground}</span></div>` : ''}
    ${meta.familyHistorySummary ? `<div class="meta-row" style="grid-column:1/-1"><span class="meta-label">Family History</span><span class="meta-value">${meta.familyHistorySummary}</span></div>` : ''}
  </div>

  <div class="pedigree-wrap">
    ${svgStr}
  </div>

  <div class="footer">
    <span>Generated by ClinPed · Clinical Pedigree Builder v1.0</span>
    <span>CONFIDENTIAL — For clinical use only</span>
    <span>Printed: ${new Date().toLocaleString('en-GB')}</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=1200,height=800');
  if (!printWindow) {
    alert('Pop-up blocked. Please allow pop-ups for this site to use print.');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function formatPattern(pattern: string): string {
  return pattern.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
