/**
 * PedigreePanel — full pan + zoom canvas with floating controls.
 *
 * Key improvements:
 *   - Pan works by dragging ANYWHERE on the canvas (not just background)
 *   - Scroll always zooms (no Ctrl required)
 *   - Pinch-to-zoom on trackpad via wheel events
 *   - Zoom centres on cursor position (not top-left origin)
 *   - Legend is a floating overlay, toggleable, never forces zoom-out
 *   - Generation ruler stays fixed in screen space (not canvas space)
 *   - Controls are minimal and non-obstructive
 */

import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { usePedigreeStore } from '../../hooks/usePedigreeStore';
import { PedigreeSVG } from '../pedigree/PedigreeSVG';
import { computeLayout } from '../../layout/layoutEngine';
import { ZoomIn, ZoomOut, Maximize2, Map, GitBranch } from 'lucide-react';

const ZOOM_MIN = 0.15;
const ZOOM_MAX = 4;
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

export function PedigreePanel() {
  const { pedigreeCase, ui, setZoom, setPan, selectIndividual } = usePedigreeStore();

  const [showLegend, setShowLegend] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan state — stored in refs so event handlers don't need to re-bind
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const [dragging, setDragging] = useState(false);

  const layout = useMemo(() => computeLayout(pedigreeCase), [pedigreeCase]);

  const individualCount = useMemo(() =>
    Object.values(pedigreeCase.individuals).filter((i) => !i.id.startsWith('unknown_')).length,
    [pedigreeCase.individuals]
  );

  // ── Zoom towards cursor position ───────────────────────────────────────────
  const zoomAt = useCallback((clientX: number, clientY: number, delta: number) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;

    const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, ui.zoom + delta));
    const scale = newZoom / ui.zoom;

    // Adjust pan so the point under the cursor stays fixed
    const newPanX = cx - scale * (cx - ui.panX);
    const newPanY = cy - scale * (cy - ui.panY);

    setZoom(newZoom);
    setPan(newPanX, newPanY);
  }, [ui.zoom, ui.panX, ui.panY, setZoom, setPan]);

  // ── Mouse/touch handlers ───────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Middle mouse or left-click on canvas background
    if (e.button === 1 || e.button === 0) {
      isDragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY, panX: ui.panX, panY: ui.panY };
      setDragging(true);
      e.preventDefault();
    }
  }, [ui.panX, ui.panY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan(dragStart.current.panX + dx, dragStart.current.panY + dy);
  }, [setPan]);

  const stopDrag = useCallback(() => {
    isDragging.current = false;
    setDragging(false);
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    // Trackpad pinch sends ctrlKey with deltaY, regular scroll is plain deltaY
    const isTouchpad = Math.abs(e.deltaY) < 30 || e.ctrlKey;
    const sensitivity = isTouchpad ? 0.008 : 0.12;
    const delta = -e.deltaY * sensitivity;
    zoomAt(e.clientX, e.clientY, delta);
  }, [zoomAt]);

  // Attach wheel with non-passive to prevent page scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const fitToView = useCallback(() => {
    if (!containerRef.current || individualCount === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const padding = 80;
    const scaleX = (rect.width - padding * 2) / layout.width;
    const scaleY = (rect.height - padding * 2) / layout.height;
    const zoom = Math.max(ZOOM_MIN, Math.min(1, Math.min(scaleX, scaleY)));
    const panX = (rect.width - layout.width * zoom) / 2;
    const panY = (rect.height - layout.height * zoom) / 2 + padding * 0.3;
    setZoom(zoom);
    setPan(panX, panY);
  }, [layout, individualCount, setZoom, setPan]);

  const handleNodeSelect = useCallback((id: string | null) => {
    if (!isDragging.current) selectIndividual(id);
  }, [selectIndividual]);

  // Auto-fit on first load
  const hasFit = useRef(false);
  useEffect(() => {
    if (individualCount > 0 && !hasFit.current) {
      hasFit.current = true;
      setTimeout(fitToView, 80);
    }
    if (individualCount === 0) hasFit.current = false;
  }, [individualCount, fitToView]);

  // ── Generation ruler (screen-space) ───────────────────────────────────────
  const generationLines = useMemo((): Array<[number, number]> => {
    const pairs: Array<[number, number]> = [];
    const seen = new Set<number>();
    layout.nodes.forEach((n) => {
      if (!seen.has(n.generation)) {
        seen.add(n.generation);
        pairs.push([n.generation, n.y]);
      }
    });
    return pairs.sort((a, b) => a[0] - b[0]);
  }, [layout.nodes]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f6f8' }}>

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div style={{
        height: '44px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 14px',
        background: '#fff', borderBottom: '1px solid #e4e8ed',
      }}>
        {/* Left: chart info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitBranch size={13} color="#8b92a0" />
          <span style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#8b92a0' }}>
            Pedigree Chart
          </span>
          {individualCount > 0 && (
            <span style={{ fontSize: '11px', color: '#b8bec8', fontFamily: 'JetBrains Mono, monospace' }}>
              {individualCount} individuals
            </span>
          )}
        </div>

        {/* Right: controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <CanvasBtn onClick={() => zoomAt(0, 0, 0.2)} title="Zoom in (+)" disabled={ui.zoom >= ZOOM_MAX}>
            <ZoomIn size={14} />
          </CanvasBtn>

          <button
            onClick={() => { setZoom(1); setPan(0, 0); }}
            style={{
              padding: '0 8px', height: '28px', borderRadius: '6px',
              fontSize: '11.5px', fontFamily: 'JetBrains Mono, monospace',
              color: '#4a5260', background: 'transparent', border: 'none',
              cursor: 'pointer', minWidth: '44px', textAlign: 'center',
            }}
            title="Reset zoom"
          >
            {Math.round(ui.zoom * 100)}%
          </button>

          <CanvasBtn onClick={() => zoomAt(0, 0, -0.2)} title="Zoom out (−)" disabled={ui.zoom <= ZOOM_MIN}>
            <ZoomOut size={14} />
          </CanvasBtn>

          <div style={{ width: 1, height: 16, background: '#e4e8ed', margin: '0 4px' }} />

          <CanvasBtn onClick={fitToView} title="Fit to view">
            <Maximize2 size={13} />
          </CanvasBtn>

          <div style={{ width: 1, height: 16, background: '#e4e8ed', margin: '0 4px' }} />

          <button
            onClick={() => setShowLegend((v) => !v)}
            title="Toggle legend"
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '0 10px', height: '28px', borderRadius: '6px',
              fontSize: '12px', fontWeight: '500',
              color: showLegend ? '#2563eb' : '#4a5260',
              background: showLegend ? '#eff6ff' : 'transparent',
              border: showLegend ? '1px solid #bfdbfe' : 'none',
              cursor: 'pointer', transition: 'all 0.12s',
            }}
          >
            <Map size={13} />
            Legend
          </button>
        </div>
      </div>

      {/* ── Canvas ──────────────────────────────────────────── */}
      <div
        ref={containerRef}
        style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          cursor: dragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
      >
        {/* Empty state */}
        {individualCount === 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: '#b8bec8',
          }}>
            <GitBranch size={36} strokeWidth={1} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ fontSize: '14px', fontWeight: '500', margin: 0 }}>No pedigree generated yet</p>
            <p style={{ fontSize: '12px', marginTop: '5px' }}>Paste a clinical narrative in the Generate tab</p>
          </div>
        )}

        {/* Pedigree SVG — positioned in canvas-space */}
        {individualCount > 0 && (
          <div style={{
            position: 'absolute', top: 0, left: 0,
            transform: `translate(${ui.panX}px, ${ui.panY}px) scale(${ui.zoom})`,
            transformOrigin: '0 0',
            willChange: 'transform',
          }}>
            <PedigreeSVG
              layout={layout}
              pedigreeCase={pedigreeCase}
              selectedId={ui.selectedIndividualId}
              onSelectIndividual={handleNodeSelect}
              showLegend={false} /* Legend is now floating, not embedded */
            />
          </div>
        )}

        {/* Generation ruler — screen-space, always readable */}
        {individualCount > 0 && generationLines.map(([genIndex, logicalY]) => {
          const screenY = logicalY * ui.zoom + ui.panY + 50 * ui.zoom;
          return (
            <div
              key={genIndex}
              style={{
                position: 'absolute', left: 0, top: screenY,
                transform: 'translateY(-50%)',
                width: '28px', height: '22px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace',
                color: '#b8bec8', pointerEvents: 'none',
                letterSpacing: '0.02em',
              }}
            >
              {ROMAN[genIndex] ?? `G${genIndex + 1}`}
            </div>
          );
        })}

        {/* Floating legend overlay */}
        {showLegend && <FloatingLegend onClose={() => setShowLegend(false)} />}
      </div>

      {/* ── Status bar ──────────────────────────────────────── */}
      <div style={{
        height: '26px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 14px',
        borderTop: '1px solid #e4e8ed', background: '#fafbfc',
        fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#b8bec8',
      }}>
        <span>Zoom {Math.round(ui.zoom * 100)}% · Pan ({Math.round(ui.panX)}, {Math.round(ui.panY)})</span>
        <span>Scroll to zoom · Drag to pan · Click node to select</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Canvas icon button
// ─────────────────────────────────────────────────────────────────────────────

function CanvasBtn({ children, onClick, title, disabled }: {
  children: React.ReactNode; onClick: () => void; title?: string; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        width: '28px', height: '28px', borderRadius: '6px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        color: disabled ? '#d1d9e0' : '#4a5260',
        transition: 'background 0.1s, color 0.1s',
      }}
      onMouseOver={(e) => { if (!disabled) (e.currentTarget.style.background = '#f5f6f8'); }}
      onMouseOut={(e) => { (e.currentTarget.style.background = 'transparent'); }}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Floating legend panel
// ─────────────────────────────────────────────────────────────────────────────

const LEGEND_ITEMS = [
  { label: 'Unaffected ♂', symbol: 'square-open' },
  { label: 'Unaffected ♀', symbol: 'circle-open' },
  { label: 'Affected', symbol: 'square-filled' },
  { label: 'Carrier (AR)', symbol: 'circle-dot' },
  { label: 'Carrier (XL ♀)', symbol: 'circle-half' },
  { label: 'Deceased', symbol: 'circle-slash' },
  { label: 'Unknown status', symbol: 'circle-q' },
  { label: 'Proband', symbol: 'proband' },
  { label: 'Consanguineous', symbol: 'double-line' },
  { label: 'Miscarriage', symbol: 'triangle' },
  { label: 'MZ twins', symbol: 'mz' },
  { label: 'DZ twins', symbol: 'dz' },
];

function FloatingLegend({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        position: 'absolute', bottom: '12px', right: '12px',
        width: '220px', background: 'rgba(255,255,255,0.97)',
        border: '1px solid #e4e8ed', borderRadius: '10px',
        boxShadow: '0 8px 24px rgb(0 0 0 / 0.10)',
        overflow: 'hidden', zIndex: 10,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '9px 12px 8px', borderBottom: '1px solid #e4e8ed',
        background: '#fafbfc',
      }}>
        <span style={{ fontSize: '10.5px', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8b92a0' }}>
          Symbol Key
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b8bec8', padding: '0' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div style={{ padding: '8px 0' }}>
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '4px 12px',
          }}>
            <LegendSymbol type={item.symbol} />
            <span style={{ fontSize: '11.5px', color: '#4a5260' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LegendSymbol({ type }: { type: string }) {
  const s = 14;
  const stroke = '#1a1a1a';
  const sw = 1.5;

  switch (type) {
    case 'square-open':
      return <svg width={s} height={s} viewBox="0 0 14 14" style={{ flexShrink: 0 }}><rect x="1" y="1" width="12" height="12" fill="#fff" stroke={stroke} strokeWidth={sw} rx="1"/></svg>;
    case 'circle-open':
      return <svg width={s} height={s} viewBox="0 0 14 14" style={{ flexShrink: 0 }}><circle cx="7" cy="7" r="6" fill="#fff" stroke={stroke} strokeWidth={sw}/></svg>;
    case 'square-filled':
      return <svg width={s} height={s} viewBox="0 0 14 14" style={{ flexShrink: 0 }}><rect x="1" y="1" width="12" height="12" fill="#1a1a1a" stroke={stroke} strokeWidth={sw} rx="1"/></svg>;
    case 'circle-dot':
      return <svg width={s} height={s} viewBox="0 0 14 14" style={{ flexShrink: 0 }}><circle cx="7" cy="7" r="6" fill="#fff" stroke={stroke} strokeWidth={sw}/><circle cx="7" cy="7" r="2.5" fill="#64748b"/></svg>;
    case 'circle-half':
      return <svg width={s} height={s} viewBox="0 0 14 14" style={{ flexShrink: 0 }}><circle cx="7" cy="7" r="6" fill="#fff" stroke={stroke} strokeWidth={sw}/><path d="M7 1 A6 6 0 0 0 7 13 Z" fill="#64748b"/></svg>;
    case 'circle-slash':
      return <svg width={s} height={s} viewBox="0 0 14 14" style={{ flexShrink: 0 }}><circle cx="7" cy="7" r="6" fill="#fff" stroke={stroke} strokeWidth={sw}/><line x1="1" y1="13" x2="13" y2="1" stroke="#64748b" strokeWidth={sw}/></svg>;
    case 'circle-q':
      return <svg width={s} height={s} viewBox="0 0 14 14" style={{ flexShrink: 0 }}><circle cx="7" cy="7" r="6" fill="#f0f4f8" stroke={stroke} strokeWidth={sw}/><text x="7" y="10.5" textAnchor="middle" fontSize="8" fill="#8b92a0" fontFamily="system-ui">?</text></svg>;
    case 'proband':
      return <svg width={s} height={s} viewBox="0 0 14 14" style={{ flexShrink: 0 }}><rect x="4" y="4" width="9" height="9" fill="#1a1a1a" stroke={stroke} strokeWidth={sw} rx="1"/><line x1="0" y1="14" x2="5" y2="4" stroke="#2563eb" strokeWidth={1.5} markerEnd="url(#a)"/></svg>;
    case 'double-line':
      return <svg width={s} height={s} viewBox="0 0 14 14" style={{ flexShrink: 0 }}><line x1="0" y1="5" x2="14" y2="5" stroke={stroke} strokeWidth={1.5}/><line x1="0" y1="9" x2="14" y2="9" stroke={stroke} strokeWidth={1.5}/></svg>;
    case 'triangle':
      return <svg width={s} height={s} viewBox="0 0 14 14" style={{ flexShrink: 0 }}><polygon points="7,13 1,3 13,3" fill="#f0f4f8" stroke={stroke} strokeWidth={sw}/></svg>;
    case 'mz':
      return <svg width={s} height={s} viewBox="0 0 14 14" style={{ flexShrink: 0 }}><line x1="3" y1="1" x2="7" y2="7" stroke={stroke} strokeWidth={sw}/><line x1="11" y1="1" x2="7" y2="7" stroke={stroke} strokeWidth={sw}/><line x1="5" y1="7" x2="9" y2="7" stroke={stroke} strokeWidth="2"/></svg>;
    case 'dz':
      return <svg width={s} height={s} viewBox="0 0 14 14" style={{ flexShrink: 0 }}><line x1="3" y1="1" x2="3" y2="13" stroke={stroke} strokeWidth={sw}/><line x1="11" y1="1" x2="11" y2="13" stroke={stroke} strokeWidth={sw}/><line x1="3" y1="7" x2="11" y2="7" stroke={stroke} strokeWidth={sw} strokeDasharray="2 1.5"/></svg>;
    default:
      return <svg width={s} height={s} viewBox="0 0 14 14" style={{ flexShrink: 0 }}></svg>;
  }
}
