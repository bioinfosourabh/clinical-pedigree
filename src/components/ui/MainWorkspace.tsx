import React, { useState } from 'react';
import { CaseInputPanel } from '../panels/CaseInputPanel';
import { PedigreePanel } from '../panels/PedigreePanel';
import { SummaryPanel } from '../panels/SummaryPanel';
import { IndividualEditorDrawer } from '../panels/IndividualEditorDrawer';
import { ValidationPanel } from './ValidationPanel';
import { ClipboardList, BookOpen, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';

type LeftTab = 'input' | 'summary' | 'validation';

export function MainWorkspace() {
  const [activeLeft, setActiveLeft] = useState<LeftTab>('input');

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* ── Left panel ─────────────────────────────── */}
      <aside className="w-80 flex-shrink-0 flex flex-col border-r border-surface-200 bg-white overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-surface-200 bg-surface-50 flex-shrink-0">
          <PanelTab active={activeLeft === 'input'} onClick={() => setActiveLeft('input')}
            icon={<ClipboardList size={12} />} label="Case Input" />
          <PanelTab active={activeLeft === 'summary'} onClick={() => setActiveLeft('summary')}
            icon={<BookOpen size={12} />} label="Summary" />
          <PanelTab active={activeLeft === 'validation'} onClick={() => setActiveLeft('validation')}
            icon={<ShieldCheck size={12} />} label="Validate" />
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeLeft === 'input'      && <CaseInputPanel />}
          {activeLeft === 'summary'    && <SummaryPanel />}
          {activeLeft === 'validation' && (
            <div className="p-3 space-y-3">
              <ValidationPanel />
            </div>
          )}
        </div>
      </aside>

      {/* ── Centre panel: Pedigree canvas ──────────── */}
      <main className="flex-1 flex flex-col overflow-hidden bg-surface-50 min-w-0">
        <PedigreePanel />
      </main>

      {/* ── Right drawer: Individual editor ────────── */}
      <IndividualEditorDrawer />
    </div>
  );
}

function PanelTab({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-1.5 px-2.5 py-2.5 text-xs font-display font-medium',
        'transition-colors duration-100 flex-1 justify-center',
        active
          ? 'text-clinical-700 border-b-2 border-clinical-600 bg-white'
          : 'text-surface-500 hover:text-surface-700 hover:bg-surface-100 border-b-2 border-transparent'
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
