import React, { useState } from 'react';
import { PedigreePanel } from '../panels/PedigreePanel';
import { IndividualEditorDrawer } from '../panels/IndividualEditorDrawer';
import { ClinicalHistoryPanel } from '../panels/ClinicalHistoryPanel';
import { ManualRefinementPanel } from '../panels/ManualRefinementPanel';
import { SummaryPanel } from '../panels/SummaryPanel';
import { ValidationPanel } from './ValidationPanel';
import { Wand2, SlidersHorizontal, BookOpen, ShieldCheck } from 'lucide-react';

type LeftTab = 'generate' | 'refine' | 'summary' | 'validate';

const TABS: Array<{ id: LeftTab; label: string; icon: React.ReactNode }> = [
  { id: 'generate', label: 'Generate',  icon: <Wand2 size={13} /> },
  { id: 'refine',   label: 'Refine',    icon: <SlidersHorizontal size={13} /> },
  { id: 'summary',  label: 'Summary',   icon: <BookOpen size={13} /> },
  { id: 'validate', label: 'Validate',  icon: <ShieldCheck size={13} /> },
];

export function MainWorkspace() {
  const [activeLeft, setActiveLeft] = useState<LeftTab>('generate');

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

      {/* ── Left sidebar ─────────────────────────────────────── */}
      <aside style={{
        width: '400px', flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        background: '#fff',
        borderRight: '1px solid #e4e8ed',
        overflow: 'hidden',
      }}>
        {/* Tab nav */}
        <nav style={{
          display: 'flex', alignItems: 'flex-end',
          padding: '0 16px',
          borderBottom: '1px solid #e4e8ed',
          background: '#fafbfc',
          flexShrink: 0,
          height: '42px',
        }}>
          {TABS.map((tab) => {
            const active = activeLeft === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveLeft(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '0 12px', height: '42px',
                  fontSize: '12.5px', fontWeight: '500', fontFamily: 'inherit',
                  color: active ? '#2563eb' : '#4a5260',
                  background: 'transparent', border: 'none',
                  borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
                  cursor: 'pointer', transition: 'color 0.1s, border-color 0.1s',
                  whiteSpace: 'nowrap',
                  marginBottom: '-1px',
                }}
                onMouseOver={(e) => { if (!active) (e.currentTarget.style.color = '#111418'); }}
                onMouseOut={(e) => { if (!active) (e.currentTarget.style.color = '#4a5260'); }}
              >
                <span style={{ color: active ? '#2563eb' : '#8b92a0', transition: 'color 0.1s' }}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Panel content */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', overscrollBehavior: 'contain' }}>
          {activeLeft === 'generate' && <ClinicalHistoryPanel />}
          {activeLeft === 'refine'   && <ManualRefinementPanel />}
          {activeLeft === 'summary'  && <SummaryPanel />}
          {activeLeft === 'validate' && (
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <ValidationPanel />
            </div>
          )}
        </div>
      </aside>

      {/* ── Centre: Pedigree canvas ──────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <PedigreePanel />
      </main>

      {/* ── Right: Individual editor drawer ─────────────────── */}
      <IndividualEditorDrawer />
    </div>
  );
}
