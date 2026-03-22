import React from 'react';
import { usePedigreeStore } from '../../hooks/usePedigreeStore';
import { X, Star, StarOff, Trash2 } from 'lucide-react';
import type { Sex, AffectedStatus, CarrierType, DeceasedStatus, PregnancyStatus, TwinType, AdoptionStatus } from '../../domain/types';

export function IndividualEditorDrawer() {
  const { pedigreeCase, ui, closeEditor, updateIndividual, removeIndividual, setProband } = usePedigreeStore();
  const individual = ui.selectedIndividualId ? pedigreeCase.individuals[ui.selectedIndividualId] : null;

  if (!individual) return null;

  const update = (field: string, value: unknown) => updateIndividual(individual.id, { [field]: value });
  const handleRemove = () => { removeIndividual(individual.id); closeEditor(); };

  const drawerStyle: React.CSSProperties = {
    position: 'absolute', right: 0, top: 0, bottom: 0, width: '300px',
    background: '#fff', borderLeft: '1px solid #e4e8ed',
    boxShadow: '-4px 0 16px rgb(0 0 0 / 0.07)',
    zIndex: 30, display: 'flex', flexDirection: 'column',
    transform: ui.editorOpen ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.2s ease',
  };

  return (
    <>
      {/* Backdrop */}
      {ui.editorOpen && (
        <div
          style={{ position: 'absolute', inset: 0, zIndex: 29 }}
          onClick={closeEditor}
        />
      )}

      <div style={drawerStyle}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: '1px solid #e4e8ed', background: '#fafbfc',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#111418', fontFamily: 'JetBrains Mono, monospace' }}>
              {individual.label || 'Individual'}
            </span>
            {individual.isProband && <span className="badge badge-info">Proband</span>}
          </div>
          <div style={{ display: 'flex', gap: '2px' }}>
            <IconBtn
              onClick={() => setProband(individual.id)}
              title={individual.isProband ? 'Remove proband' : 'Set as proband'}
              color={individual.isProband ? '#2563eb' : '#8b92a0'}
            >
              {individual.isProband ? <StarOff size={14} /> : <Star size={14} />}
            </IconBtn>
            <IconBtn onClick={handleRemove} title="Remove" color="#dc2626">
              <Trash2 size={14} />
            </IconBtn>
            <IconBtn onClick={closeEditor} title="Close">
              <X size={14} />
            </IconBtn>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          <Section title="Identity">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Field label="First Name">
                <input className="field-input" value={individual.firstName ?? ''} placeholder="Optional"
                  onChange={(e) => update('firstName', e.target.value || undefined)} />
              </Field>
              <Field label="Last Name">
                <input className="field-input" value={individual.lastName ?? ''} placeholder="Optional"
                  onChange={(e) => update('lastName', e.target.value || undefined)} />
              </Field>
            </div>
            <Field label="Pedigree Label">
              <input className="field-input" style={{ fontFamily: 'JetBrains Mono, monospace' }}
                value={individual.label}
                onChange={(e) => update('label', e.target.value)}
                placeholder="e.g. II-3" />
            </Field>
          </Section>

          <Section title="Demographics">
            <Field label="Sex">
              <SegmentControl
                value={individual.sex}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'unknown', label: '?' },
                ]}
                onChange={(v) => update('sex', v as Sex)}
              />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Field label="Birth Year">
                <input className="field-input" type="number" min={1900} max={2030} placeholder="YYYY"
                  value={individual.birthYear ?? ''}
                  onChange={(e) => update('birthYear', e.target.value ? parseInt(e.target.value) : undefined)} />
              </Field>
              <Field label="Death Year">
                <input className="field-input" type="number" min={1900} max={2030} placeholder="YYYY"
                  value={individual.deathYear ?? ''}
                  onChange={(e) => update('deathYear', e.target.value ? parseInt(e.target.value) : undefined)} />
              </Field>
            </div>
          </Section>

          <Section title="Clinical Status">
            <Field label="Affected Status">
              <select className="field-select" value={individual.affectedStatus}
                onChange={(e) => update('affectedStatus', e.target.value as AffectedStatus)}>
                <option value="unknown">Unknown</option>
                <option value="unaffected">Unaffected</option>
                <option value="affected">Affected</option>
                <option value="carrier">Carrier</option>
              </select>
            </Field>
            {individual.affectedStatus === 'carrier' && (
              <Field label="Carrier Type">
                <select className="field-select" value={individual.carrierType ?? ''}
                  onChange={(e) => update('carrierType', e.target.value as CarrierType)}>
                  <option value="">— Select —</option>
                  <option value="autosomal_recessive">Autosomal Recessive (dot)</option>
                  <option value="x_linked">X-linked (half-fill)</option>
                  <option value="obligate">Obligate (inferred)</option>
                  <option value="tested_positive">Tested Positive</option>
                </select>
              </Field>
            )}
            <Field label="Deceased Status">
              <select className="field-select" value={individual.deceasedStatus}
                onChange={(e) => update('deceasedStatus', e.target.value as DeceasedStatus)}>
                <option value="unknown">Unknown</option>
                <option value="alive">Alive</option>
                <option value="deceased">Deceased</option>
              </select>
            </Field>
            <Field label="Pregnancy / Repro Event">
              <select className="field-select" value={individual.pregnancyStatus ?? ''}
                onChange={(e) => update('pregnancyStatus', e.target.value as PregnancyStatus || null)}>
                <option value="">— Standard / Not applicable —</option>
                <option value="liveborn">Liveborn</option>
                <option value="current_pregnancy">Current Pregnancy</option>
                <option value="miscarriage">Miscarriage (&lt;20wks)</option>
                <option value="stillbirth">Stillbirth (≥20wks)</option>
                <option value="terminated">Termination (TOP)</option>
                <option value="ectopic">Ectopic</option>
              </select>
            </Field>
          </Section>

          <Section title="Designations">
            <Field label="Twin Type">
              <select className="field-select" value={individual.twinType ?? ''}
                onChange={(e) => update('twinType', e.target.value as TwinType || null)}>
                <option value="">Not a twin</option>
                <option value="monozygotic">Monozygotic (MZ / identical)</option>
                <option value="dizygotic">Dizygotic (DZ / fraternal)</option>
              </select>
            </Field>
            <Field label="Adoption Status">
              <select className="field-select" value={individual.adoptionStatus ?? 'not_adopted'}
                onChange={(e) => update('adoptionStatus', e.target.value as AdoptionStatus)}>
                <option value="not_adopted">Not adopted</option>
                <option value="adopted_in">Adopted in</option>
                <option value="adopted_out">Adopted out</option>
              </select>
            </Field>
            <CheckRow label="Consultand (seeking counseling)" checked={individual.isConsultand}
              onChange={(v) => update('isConsultand', v)} />
            <CheckRow label="Sex unconfirmed / uncertain" checked={individual.sexUnconfirmed}
              onChange={(v) => update('sexUnconfirmed', v)} />
          </Section>

          <Section title="Clinical Annotations">
            <Field label="Phenotype Summary">
              <textarea className="field-textarea" style={{ minHeight: '70px' }}
                value={individual.phenotypeSummary ?? ''}
                onChange={(e) => update('phenotypeSummary', e.target.value || undefined)}
                placeholder="Clinical features, age of onset…" />
            </Field>
            <Field label="Molecular / Genotype Notes">
              <textarea className="field-textarea" style={{ minHeight: '50px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}
                value={individual.genotypeNotes ?? ''}
                onChange={(e) => update('genotypeNotes', e.target.value || undefined)}
                placeholder="e.g. BRCA1 c.5266dupC (het), de novo confirmed" />
            </Field>
            <Field label="Notes">
              <textarea className="field-textarea" style={{ minHeight: '55px' }}
                value={individual.notes ?? ''}
                onChange={(e) => update('notes', e.target.value || undefined)}
                placeholder="Additional clinical or admin notes…" />
            </Field>
          </Section>
        </div>
      </div>
    </>
  );
}

function IconBtn({ children, onClick, title, color }: { children: React.ReactNode; onClick: () => void; title?: string; color?: string }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: '28px', height: '28px', borderRadius: '6px', border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: color ?? '#8b92a0', background: 'transparent', transition: 'background 0.1s',
    }}
      onMouseOver={(e) => (e.currentTarget.style.background = '#f5f6f8')}
      onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: '10.5px', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8b92a0', margin: '0 0 10px' }}>{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

function SegmentControl({ value, options, onChange }: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', border: '1px solid #e4e8ed', borderRadius: '8px', overflow: 'hidden' }}>
      {options.map((opt) => (
        <button key={opt.value} onClick={() => onChange(opt.value)} style={{
          flex: 1, height: '34px', border: 'none', cursor: 'pointer',
          fontSize: '12.5px', fontWeight: '500', fontFamily: 'inherit',
          background: value === opt.value ? '#2563eb' : '#fff',
          color: value === opt.value ? '#fff' : '#4a5260',
          borderRight: '1px solid #e4e8ed', transition: 'all 0.1s',
        }} style-last={{ borderRight: 'none' }}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = React.useId();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: '#2563eb' }} />
      <label htmlFor={id} style={{ fontSize: '12.5px', color: '#4a5260', cursor: 'pointer' }}>{label}</label>
    </div>
  );
}
