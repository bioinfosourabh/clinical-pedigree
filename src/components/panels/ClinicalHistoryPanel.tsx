/**
 * ClinicalHistoryPanel — primary workflow panel.
 * Paste narrative → generate pedigree.
 */
import React, { useState } from 'react';
import { usePedigreeStore } from '../../hooks/usePedigreeStore';
import { useAppStore } from '../../hooks/useAppStore';
import { parseClinicaHistory, type ParseWarning } from '../../utils/clinicalParser';
import { SAMPLE_CASES } from '../../data/sampleCases';
import { Wand2, ChevronDown, ChevronUp, Trash2, FlaskConical, Info, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import clsx from 'clsx';

const PLACEHOLDER = `Paste your clinical / family history here.

The parser recognises:
• Proband, mother, father, siblings, grandparents, aunts, uncles
• Affected / unaffected / carrier / deceased status
• Age at death, consanguinity, miscarriage, stillbirth
• Inheritance pattern hints (AR, AD, X-linked, de novo)

Example:
"The proband is a 6-year-old boy with global developmental delay and seizures. His mother is unaffected. His father is unaffected. Maternal grandmother was affected with a similar condition and died at age 62. Parents are first cousins."`;

export function ClinicalHistoryPanel() {
  const { loadCase } = usePedigreeStore();
  const { saveCase } = useAppStore();

  const [text, setText] = useState('');
  const [warnings, setWarnings] = useState<ParseWarning[]>([]);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [generated, setGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showWarnings, setShowWarnings] = useState(true);
  const [samplesOpen, setSamplesOpen] = useState(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const canGenerate = text.trim().length > 10;

  const handleGenerate = () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    setGenerated(false);
    setTimeout(() => {
      const result = parseClinicaHistory(text);
      loadCase(result.pedigreeCase);
      setWarnings(result.warnings);
      setConfidence(result.confidence);
      setGenerated(true);
      setShowWarnings(true);
      setIsGenerating(false);
    }, 80);
  };

  const handleClear = () => {
    setText('');
    setWarnings([]);
    setConfidence(null);
    setGenerated(false);
  };

  const handleLoadSample = (name: string) => {
    const sc = SAMPLE_CASES[name];
    if (!sc) return;
    loadCase(sc);
    setText(sc.metadata.familyHistorySummary ?? sc.metadata.clinicalIndication ?? '');
    setSamplesOpen(false);
    setGenerated(false);
    setWarnings([]);
    setConfidence(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleGenerate();
  };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

      {/* Section header */}
      <div>
        <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#111418', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Wand2 size={14} color="#2563eb" />
          Generate from Clinical History
        </h2>
        <p style={{ fontSize: '12.5px', color: '#8b92a0', margin: 0, lineHeight: 1.5 }}>
          Paste a free-text family history or clinical narrative. The parser extracts
          family members and builds a pedigree automatically.
        </p>
      </div>

      {/* Textarea */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label className="field-label" style={{ margin: 0 }}>Clinical narrative</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', color: '#b8bec8', fontFamily: 'JetBrains Mono, monospace' }}>
              {wordCount}w
            </span>
            {text && (
              <button
                onClick={handleClear}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b8bec8', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', padding: 0 }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#dc2626')}
                onMouseOut={(e) => (e.currentTarget.style.color = '#b8bec8')}
              >
                <Trash2 size={11} /> Clear
              </button>
            )}
          </div>
        </div>

        <textarea
          className="field-textarea"
          style={{ minHeight: '200px', fontSize: '13px', lineHeight: '1.65', width: '100%' }}
          placeholder={PLACEHOLDER}
          value={text}
          onChange={(e) => { setText(e.target.value); if (generated) setGenerated(false); }}
          onKeyDown={handleKeyDown}
          spellCheck={false}
        />

        <p style={{ fontSize: '11px', color: '#b8bec8', marginTop: '5px', textAlign: 'right' }}>
          Ctrl+Enter to generate
        </p>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!canGenerate || isGenerating}
        style={{
          width: '100%', height: '42px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          borderRadius: '10px', border: 'none', cursor: canGenerate && !isGenerating ? 'pointer' : 'not-allowed',
          fontSize: '14px', fontWeight: '600', fontFamily: 'inherit',
          background: canGenerate ? '#2563eb' : '#e4e8ed',
          color: canGenerate ? '#ffffff' : '#b8bec8',
          boxShadow: canGenerate ? '0 2px 8px rgb(37 99 235 / 0.25)' : 'none',
          transition: 'all 0.15s',
        }}
      >
        {isGenerating
          ? <><Zap size={15} style={{ animation: 'pulse 1s infinite' }} /> Generating…</>
          : <><Wand2 size={15} /> Generate Pedigree</>
        }
      </button>

      {/* Result feedback */}
      {generated && confidence !== null && (
        <ParseResult
          confidence={confidence}
          warnings={warnings}
          showWarnings={showWarnings}
          onToggleWarnings={() => setShowWarnings(v => !v)}
        />
      )}

      {/* Parser capability hint */}
      {!generated && <ParserHint />}

      {/* Sample cases */}
      <div style={{ borderTop: '1px solid #e4e8ed', paddingTop: '14px' }}>
        <button
          onClick={() => setSamplesOpen(v => !v)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'none', border: 'none', cursor: 'pointer', padding: '0',
            fontSize: '12.5px', color: '#8b92a0', fontFamily: 'inherit',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FlaskConical size={12} color="#8b92a0" />
            Load a demo case
          </span>
          {samplesOpen ? <ChevronUp size={13} color="#b8bec8" /> : <ChevronDown size={13} color="#b8bec8" />}
        </button>

        {samplesOpen && (
          <div style={{
            marginTop: '8px', border: '1px solid #e4e8ed', borderRadius: '10px',
            overflow: 'hidden', boxShadow: '0 2px 6px rgb(0 0 0 / 0.05)',
          }}>
            {Object.keys(SAMPLE_CASES).map((name, i, arr) => (
              <button
                key={name}
                onClick={() => handleLoadSample(name)}
                style={{
                  width: '100%', textAlign: 'left', padding: '11px 14px',
                  borderBottom: i < arr.length - 1 ? '1px solid #e4e8ed' : 'none',
                  background: '#fff', border: 'none', cursor: 'pointer',
                  transition: 'background 0.08s', fontFamily: 'inherit',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#f5f6f8')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#fff')}
              >
                <div style={{ fontSize: '12.5px', fontWeight: '500', color: '#111418' }}>{name}</div>
                <div style={{ fontSize: '11.5px', color: '#8b92a0', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {SAMPLE_CASES[name].metadata.clinicalIndication}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ParseResult({
  confidence, warnings, showWarnings, onToggleWarnings
}: {
  confidence: number;
  warnings: ParseWarning[];
  showWarnings: boolean;
  onToggleWarnings: () => void;
}) {
  const pct = Math.round(confidence * 100);
  const tier = pct >= 70 ? 'high' : pct >= 40 ? 'mid' : 'low';
  const colors = {
    high: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', bar: '#22c55e' },
    mid:  { bg: '#fffbeb', border: '#fde68a', text: '#b45309', bar: '#f59e0b' },
    low:  { bg: '#fff1f2', border: '#fecdd3', text: '#be123c', bar: '#f43f5e' },
  }[tier];

  return (
    <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: '500', color: colors.text, display: 'flex', alignItems: 'center', gap: '5px' }}>
            {tier === 'high' ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
            {tier === 'high' ? 'Pedigree generated' : tier === 'mid' ? 'Generated with warnings' : 'Low confidence — review needed'}
          </span>
          <span style={{ fontSize: '11.5px', fontWeight: '600', fontFamily: 'JetBrains Mono, monospace', color: colors.text }}>
            {pct}%
          </span>
        </div>
        <div style={{ height: '4px', background: 'rgba(255,255,255,0.6)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: colors.bar, borderRadius: '99px', transition: 'width 0.5s ease' }} />
        </div>
      </div>

      {warnings.length > 0 && (
        <div style={{ borderTop: `1px solid ${colors.border}` }}>
          <button
            onClick={onToggleWarnings}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '11.5px', fontWeight: '500', color: colors.text, fontFamily: 'inherit',
            }}
          >
            <span>{warnings.length} parser note{warnings.length > 1 ? 's' : ''}</span>
            {showWarnings ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showWarnings && (
            <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {warnings.map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11.5px', color: colors.text, lineHeight: 1.5 }}>
                  <Info size={11} style={{ flexShrink: 0, marginTop: '2px' }} />
                  {w.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ParserHint() {
  return (
    <div style={{
      background: '#f5f6f8', border: '1px solid #e4e8ed',
      borderRadius: '10px', padding: '12px 14px',
    }}>
      <p style={{ fontSize: '11.5px', fontWeight: '600', color: '#4a5260', margin: '0 0 7px', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <Info size={12} color="#2563eb" /> Parser recognises
      </p>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {[
          'Proband, mother, father, siblings, grandparents, aunts, uncles',
          'Affected, unaffected, carrier, deceased + age at death',
          'Miscarriage, stillbirth, termination events',
          'Consanguinity, inheritance hints (AR, AD, X-linked, de novo)',
        ].map((t) => (
          <li key={t} style={{ fontSize: '11.5px', color: '#8b92a0', paddingLeft: '10px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0, top: '5px', width: '4px', height: '4px', borderRadius: '50%', background: '#ccd1d9' }} />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
