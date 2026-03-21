import React, { useState } from 'react';
import { usePedigreeStore } from '../../hooks/usePedigreeStore';
import { FamilyMemberList } from '../forms/FamilyMemberList';
import { AddFamilyMemberWizard } from '../forms/AddFamilyMemberWizard';
import { UnionEditorPanel } from '../forms/UnionEditorPanel';
import { TwinLinker } from '../forms/TwinLinker';
import { PregnancyEventForm } from '../forms/PregnancyEventForm';
import type { InheritancePattern } from '../../domain/types';
import {
  Activity,
  FileText,
  Users,
  Heart,
  Baby,
  Link2,
  ChevronDown,
  UserPlus,
} from 'lucide-react';
import clsx from 'clsx';

type InputTab = 'members' | 'unions' | 'twins' | 'pregnancy';

export function CaseInputPanel() {
  const { pedigreeCase, updateMetadata } = usePedigreeStore();
  const meta = pedigreeCase.metadata;
  const [inputTab, setInputTab] = useState<InputTab>('members');
  const [showWizard, setShowWizard] = useState(false);

  const update = (field: string, value: string) =>
    updateMetadata({ [field]: value || undefined });

  return (
    <div className="p-3 space-y-4">

      <CollapsibleSection icon={<Activity size={13} />} title="Clinical Details" defaultOpen>
        <div className="space-y-3">
          <Field label="Clinical Indication">
            <textarea
              className="field-textarea min-h-[56px]"
              placeholder="e.g. Global developmental delay, seizures, WES trio requested"
              value={meta.clinicalIndication ?? ''}
              onChange={(e) => update('clinicalIndication', e.target.value)}
            />
          </Field>
          <Field label="Suspected Diagnosis / Syndrome">
            <input
              className="field-input"
              type="text"
              placeholder="e.g. Gaucher Disease Type 1 (OMIM #230800)"
              value={meta.suspectedDiagnosis ?? ''}
              onChange={(e) => update('suspectedDiagnosis', e.target.value)}
            />
          </Field>
          <Field label="Inheritance Pattern">
            <select
              className="field-select"
              value={meta.inheritancePattern ?? ''}
              onChange={(e) =>
                updateMetadata({ inheritancePattern: (e.target.value as InheritancePattern) || null })
              }
            >
              <option value="">— Unknown / Not selected —</option>
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
          <div className="grid grid-cols-2 gap-2">
            <Field label="Ethnic Background">
              <input
                className="field-input"
                type="text"
                placeholder="e.g. Ashkenazi Jewish"
                value={meta.ethnicBackground ?? ''}
                onChange={(e) => update('ethnicBackground', e.target.value)}
              />
            </Field>
            <Field label="Recorded By">
              <input
                className="field-input"
                type="text"
                placeholder="GC / clinician name"
                value={meta.recordedBy ?? ''}
                onChange={(e) => update('recordedBy', e.target.value)}
              />
            </Field>
          </div>
          <Field label="Institution">
            <input
              className="field-input"
              type="text"
              placeholder="Hospital / genomics lab"
              value={meta.institution ?? ''}
              onChange={(e) => update('institution', e.target.value)}
            />
          </Field>
        </div>
      </CollapsibleSection>

      <CollapsibleSection icon={<FileText size={13} />} title="Family History">
        <div className="space-y-3">
          <Field label="Family History Summary">
            <textarea
              className="field-textarea min-h-[64px]"
              placeholder="Affected relatives, prior genetic testing…"
              value={meta.familyHistorySummary ?? ''}
              onChange={(e) => update('familyHistorySummary', e.target.value)}
            />
          </Field>
          <Field label="Consanguinity Background">
            <input
              className="field-input"
              type="text"
              placeholder="e.g. First cousin marriage (F = 1/16)"
              value={meta.consanguinityBackground ?? ''}
              onChange={(e) => update('consanguinityBackground', e.target.value)}
            />
          </Field>
        </div>
      </CollapsibleSection>

      <CollapsibleSection icon={<Users size={13} />} title="Family Structure" defaultOpen>
        <div className="flex border border-surface-200 rounded-md overflow-hidden mb-3">
          {INPUT_TABS.map((tab) => (
            <button
              key={tab.id}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1 py-1.5 text-2xs font-display font-semibold',
                'transition-colors border-r border-surface-200 last:border-r-0 uppercase tracking-wide',
                inputTab === tab.id
                  ? 'bg-clinical-700 text-white'
                  : 'bg-surface-50 text-surface-500 hover:bg-surface-100 hover:text-surface-700'
              )}
              onClick={() => setInputTab(tab.id as InputTab)}
              title={tab.label}
            >
              {tab.icon}
              <span className="hidden sm:inline ml-1">{tab.label}</span>
            </button>
          ))}
        </div>

        {inputTab === 'members' && (
          <div className="space-y-3">
            <FamilyMemberList />
            {showWizard ? (
              <AddFamilyMemberWizard onDone={() => setShowWizard(false)} />
            ) : (
              <button
                className="btn-secondary btn w-full justify-center text-xs gap-1.5"
                onClick={() => setShowWizard(true)}
              >
                <UserPlus size={13} />
                Add Family Member
              </button>
            )}
          </div>
        )}

        {inputTab === 'unions' && <UnionEditorPanel />}
        {inputTab === 'twins' && <TwinLinker />}
        {inputTab === 'pregnancy' && <PregnancyEventForm />}
      </CollapsibleSection>
    </div>
  );
}

const INPUT_TABS = [
  { id: 'members', label: 'Members', icon: <Users size={11} /> },
  { id: 'unions', label: 'Unions', icon: <Heart size={11} /> },
  { id: 'twins', label: 'Twins', icon: <Link2 size={11} /> },
  { id: 'pregnancy', label: 'Repro', icon: <Baby size={11} /> },
];

function CollapsibleSection({
  title, icon, children, defaultOpen = false,
}: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="panel overflow-hidden">
      <button className="panel-header w-full text-left" onClick={() => setOpen((v) => !v)}>
        <div className="flex items-center gap-2">
          <span className="text-surface-400">{icon}</span>
          <span className="panel-title">{title}</span>
        </div>
        <ChevronDown
          size={13}
          className={clsx('text-surface-400 transition-transform duration-150', open ? 'rotate-0' : '-rotate-90')}
        />
      </button>
      {open && <div className="p-3">{children}</div>}
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
