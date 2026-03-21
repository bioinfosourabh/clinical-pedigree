import React, { useRef, useCallback, useState } from 'react';
import { usePedigreeStore } from '../../hooks/usePedigreeStore';
import { PedigreeSVG } from '../pedigree/PedigreeSVG';
import { computeLayout } from '../../layout/layoutEngine';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
  LayoutGrid,
  BookOpen,
  Printer,
} from 'lucide-react';
import clsx from 'clsx';

const ZOOM_STEP = 0.15;
const ZOOM_MIN = 0.2;
const ZOOM_MAX = 3;

export function PedigreePanel() {
  const { pedigreeCase, ui, setZoom, setPan, selectIndividual } =
    usePedigreeStore();

  const [showLegend, setShowLegend] = useState(true);

  const layout = computeLayout(pedigreeCase);

  // Pan state
  const isPanning = useRef(false);
  const lastPan = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only pan on middle mouse or when clicking on empty canvas
      if (e.button === 1 || e.target === e.currentTarget) {
        isPanning.current = true;
        lastPan.current = { x: e.clientX, y: e.clientY };
        e.preventDefault();
      }
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning.current) return;
      const dx = e.clientX - lastPan.current.x;
      const dy = e.clientY - lastPan.current.y;
      lastPan.current = { x: e.clientX, y: e.clientY };
      setPan(ui.panX + dx, ui.panY + dy);
    },
    [ui.panX, ui.panY, setPan]
  );

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        setZoom(ui.zoom + delta);
      }
    },
    [ui.zoom, setZoom]
  );

  const fitToView = () => {
    setZoom(1);
    setPan(0, 0);
  };

  const individualCount = Object.values(pedigreeCase.individuals).filter(
    (i) => !i.id.startsWith('unknown_')
  ).length;

  return (
    <div className="flex flex-col h-full">
      {/* ── Pedigree toolbar ─────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2
                      border-b border-surface-200 bg-white">
        <div className="flex items-center gap-1">
          <LayoutGrid size={13} className="text-surface-400" />
          <span className="panel-title">Pedigree Chart</span>
          <span className="text-2xs text-surface-400 ml-2 font-mono">
            {individualCount} individual{individualCount !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Zoom controls */}
          <button
            className="btn-ghost btn btn-sm"
            onClick={() => setZoom(ui.zoom - ZOOM_STEP)}
            disabled={ui.zoom <= ZOOM_MIN}
            title="Zoom out (Ctrl + scroll)"
          >
            <ZoomOut size={14} />
          </button>

          <span
            className="text-xs font-mono text-surface-500 w-12 text-center select-none"
            title="Click to reset zoom"
            onClick={() => setZoom(1)}
            style={{ cursor: 'pointer' }}
          >
            {Math.round(ui.zoom * 100)}%
          </span>

          <button
            className="btn-ghost btn btn-sm"
            onClick={() => setZoom(ui.zoom + ZOOM_STEP)}
            disabled={ui.zoom >= ZOOM_MAX}
            title="Zoom in (Ctrl + scroll)"
          >
            <ZoomIn size={14} />
          </button>

          <div className="w-px h-4 bg-surface-200 mx-1" />

          <button
            className="btn-ghost btn btn-sm"
            onClick={fitToView}
            title="Fit to view"
          >
            <Maximize2 size={14} />
          </button>

          <div className="w-px h-4 bg-surface-200 mx-1" />

          <button
            className={`btn btn-sm gap-1 ${showLegend ? 'btn-secondary text-clinical-700 border-clinical-300' : 'btn-ghost text-surface-500'}`}
            onClick={() => setShowLegend(v => !v)}
            title="Toggle clinical legend"
          >
            <BookOpen size={13} />
            <span className="hidden sm:inline text-xs">Legend</span>
          </button>
        </div>
      </div>

      {/* ── Canvas ───────────────────────────────────── */}
      <div
        className="flex-1 overflow-hidden relative select-none"
        style={{ cursor: isPanning.current ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {individualCount === 0 ? (
          <EmptyState />
        ) : (
          <div
            style={{
              transform: `translate(${ui.panX}px, ${ui.panY}px) scale(${ui.zoom})`,
              transformOrigin: '50px 50px',
              transition: isPanning.current ? 'none' : 'transform 0.05s ease',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            <PedigreeSVG
              layout={layout}
              pedigreeCase={pedigreeCase}
              selectedId={ui.selectedIndividualId}
              onSelectIndividual={selectIndividual}
              showLegend={showLegend}
            />
          </div>
        )}

        {/* Generation ruler - subtle left-side labels */}
        {individualCount > 0 && (
          <GenerationRuler
            layout={layout}
            zoom={ui.zoom}
            panY={ui.panY}
          />
        )}
      </div>

      {/* ── Status bar ───────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-surface-200 bg-surface-50
                      px-3 py-1 flex items-center gap-4 text-2xs text-surface-400 font-mono">
        <span>
          Zoom: {Math.round(ui.zoom * 100)}% · Pan: ({Math.round(ui.panX)}, {Math.round(ui.panY)})
        </span>
        <span className="ml-auto">
          Ctrl+Scroll to zoom · Drag to pan · Click node to select
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-surface-400">
      <Move size={32} strokeWidth={1} className="mb-3 opacity-40" />
      <p className="text-sm font-display">No pedigree data</p>
      <p className="text-xs mt-1">Add family members in the Case Input panel</p>
    </div>
  );
}

function GenerationRuler({
  layout,
  zoom,
  panY,
}: {
  layout: ReturnType<typeof computeLayout>;
  zoom: number;
  panY: number;
}) {
  // Collect unique generation y values from layout nodes
  const generations = new Map<number, number>();
  layout.nodes.forEach((n) => {
    if (!generations.has(n.generation)) {
      generations.set(n.generation, n.y);
    }
  });

  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

  return (
    <div className="absolute left-0 top-0 bottom-0 w-8 pointer-events-none">
      {Array.from(generations.entries()).map(([gen, logicalY]) => {
        const pixelY = logicalY * zoom + panY + 50 * zoom;
        return (
          <div
            key={gen}
            className="absolute left-0 text-2xs text-surface-400 font-mono font-semibold
                       flex items-center justify-center w-7"
            style={{ top: pixelY, transform: 'translateY(-50%)' }}
          >
            {ROMAN[gen] ?? `G${gen + 1}`}
          </div>
        );
      })}
    </div>
  );
}
