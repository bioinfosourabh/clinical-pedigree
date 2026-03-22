import React, { useState } from 'react';
import { usePedigreeStore } from '../../hooks/usePedigreeStore';
import { FamilyMemberList } from '../forms/FamilyMemberList';
import { AddFamilyMemberWizard } from '../forms/AddFamilyMemberWizard';
import { UnionEditorPanel } from '../forms/UnionEditorPanel';
import { TwinLinker } from '../forms/TwinLinker';
import { PregnancyEventForm } from '../forms/PregnancyEventForm';
import type { InheritancePattern } from '../../domain/types';
import { SlidersHorizontal, Users, Heart, Link2, Baby, Activity, FileText, ChevronDown, UserPlus } from 'lucide-react';
import clsx from 'clsx';

type StructureTab = 'members' | 'unions' | 'twins' | 'pregnancy';

export function ManualRefinementPanel() {
  const { pedigreeCase, updateMetadata } = usePedigreeStore();
  const meta = pedigreeCase.metadata;
  const [tab, setTab] = useState<StructureTab>('members');
  const [showWizard, setShowWizard] = useState(false);

  const update = (field: string, value: string) =>
    updateMetadata({ [field]: value || undefined });

  const individualCount = Object.values(pedigreeCase.individuals)
    .filter((i) => !i.id.startsWith('unknown_')).length;

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#111418', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <SlidersHorizontal size={14} color="#2563eb" />
          Manual Refinement
        </h2>
        <p style={{ fontSize: '12.5px', color: '#8b92a0', margin: 0, lineHeight: 1.5 }}>
          Add, edit, or link family members. Use after auto-generation to correct or extend the pedigree.
        </p>
        {individualCount > 0 && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            marginTop: '8px', padding: '3px 10px',
            background: '#eff6ff', border: '1px solid #bfdbfe',
            borderRadius: '99px', fontSize: '11.5px', fontWeight: '500', color: '#2563eb',
          }}>
            <Users size={11} /> {individualCount} individual{individualCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Clinical details */}
      <Section title="Clinical Details" icon={<Activity size={13} />} defaultOpen>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Field label="Clinical Indication">
            <textarea className="field-textarea" style={{ minHeight: '60px' }}
              placeholder="e.g. Global developmental delay, WES trio requested"
              value={meta.clinicalIndication ?? ''}
              onChange={(e) => update('clinicalIndication', e.target.value)} />
          </Field>
          <Field label="Suspected Diagnosis">
            <input className="field-input" type="text"
              placeholder="e.g. Gaucher Disease Type 1 (OMIM #230800)"
              value={meta.suspectedDiagnosis ?? ''}
              onChange={(e) => update('suspectedDiagnosis', e.target.value)} />
          </Field>
          <Field label="Inheritance Pattern">
            <select className="field-select" value={meta.inheritancePattern ?? ''}
              onChange={(e) => updateMetadata({ inheritancePattern: (e.target.value as InheritancePattern) || null })}>
              <option value="">— Unknown —</option>
              <option value="autosomal_dominant">Autosomal Dominant</option>
              <option value="autosomal_recessive">Autosomal Recessive</option>
              <option value="x_linked_dominant">X-linked Dominant</option>
              <option value="x_linked_recessive">X-linked Recessive</option>
              <option value="mitochondrial">Mitochondrial</option>
              <option value="de_novo">De Novo</option>
              <option value="digenic">Digenic</option>
              <option value="multifactorial">Multifactorial</option>
              <option value="unknown">Unknown</option>
            </select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Field label="Ethnic Background">
              <input className="field-input" type="text" placeholder="e.g. Ashkenazi Jewish"
                value={meta.ethnicBackground ?? ''}
                onChange={(e) => update('ethnicBackground', e.target.value)} />
            </Field>
            <Field label="Recorded By">
              <input className="field-input" type="text" placeholder="GC / clinician"
                value={meta.recordedBy ?? ''}
                onChange={(e) => update('recordedBy', e.target.value)} />
            </Field>
          </div>
          <Field label="Institution">
            <input className="field-input" type="text" placeholder="Hospital / genomics lab"
              value={meta.institution ?? ''}
              onChange={(e) => update('institution', e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* Family history notes */}
      <Section title="Family History Notes" icon={<FileText size={13} />}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Field label="Family History Summary">
            <textarea className="field-textarea" style={{ minHeight: '70px' }}
              placeholder="Affected relatives, prior genetic testing…"
              value={meta.familyHistorySummary ?? ''}
              onChange={(e) => update('familyHistorySummary', e.target.value)} />
          </Field>
          <Field label="Consanguinity Background">
            <input className="field-input" type="text"
              placeholder="e.g. First cousin marriage (F = 1/16)"
              value={meta.consanguinityBackground ?? ''}
              onChange={(e) => update('consanguinityBackground', e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* Family structure */}
      <Section title="Family Structure" icon={<Users size={13} />} defaultOpen>
        {/* Sub-tabs */}
        <div style={{
          display: 'flex', borderRadius: '8px', overflow: 'hidden',
          border: '1px solid #e4e8ed', marginBottom: '14px',
          boxShadow: '0 1px 2px rgb(0 0 0 / 0.04)',
        }}>
          {STRUCTURE_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as StructureTab)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '4px', padding: '7px 4px', border: 'none', cursor: 'pointer',
                fontSize: '11.5px', fontWeight: '500', fontFamily: 'inherit',
                borderRight: t.id !== 'pregnancy' ? '1px solid #e4e8ed' : 'none',
                background: tab === t.id ? '#2563eb' : '#fff',
                color: tab === t.id ? '#fff' : '#4a5260',
                transition: 'background 0.1s, color 0.1s',
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'members' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <FamilyMemberList />
            {showWizard
              ? <AddFamilyMemberWizard onDone={() => setShowWizard(false)} />
              : (
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setShowWizard(true)}>
                  <UserPlus size={13} /> Add Family Member
                </button>
              )
            }
          </div>
        )}
        {tab === 'unions'    && <UnionEditorPanel />}
        {tab === 'twins'     && <TwinLinker />}
        {tab === 'pregnancy' && <PregnancyEventForm />}
      </Section>
    </div>
  );
}

const STRUCTURE_TABS = [
  { id: 'members',   label: 'Members',  icon: <Users size={11} /> },
  { id: 'unions',    label: 'Unions',   icon: <Heart size={11} /> },
  { id: 'twins',     label: 'Twins',    icon: <Link2 size={11} /> },
  { id: 'pregnancy', label: 'Repro',    icon: <Baby size={11} /> },
];

function Section({ title, icon, children, defaultOpen = false }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: '1px solid #e4e8ed', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgb(0 0 0 / 0.05)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '11px 14px', background: '#fafbfc', border: 'none', cursor: 'pointer',
          borderBottom: open ? '1px solid #e4e8ed' : 'none', fontFamily: 'inherit',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ color: '#8b92a0' }}>{icon}</span>
          <span style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#4a5260' }}>
            {title}
          </span>
        </div>
        <ChevronDown size={14} color="#b8bec8"
          style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }} />
      </button>
      {open && <div style={{ padding: '14px' }}>{children}</div>}
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
