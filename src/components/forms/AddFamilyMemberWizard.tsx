import React, { useState, useReducer } from 'react';
import { usePedigreeStore } from '../../hooks/usePedigreeStore';
import { createIndividual } from '../../domain/factories';
import type {
  Sex,
  AffectedStatus,
  CarrierType,
  DeceasedStatus,
  AdoptionStatus,
  Individual,
} from '../../domain/types';
import {
  UserPlus,
  ChevronRight,
  ChevronLeft,
  Check,
  Link2,
} from 'lucide-react';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────────────────────────
// Wizard state
// ─────────────────────────────────────────────────────────────────────────────

type WizardStep = 'identity' | 'clinical' | 'relationships' | 'review';

interface WizardState {
  step: WizardStep;
  // Step 1: Identity
  firstName: string;
  lastName: string;
  sex: Sex;
  birthYear: string;
  deathYear: string;
  // Step 2: Clinical
  affectedStatus: AffectedStatus;
  carrierType: CarrierType | '';
  deceasedStatus: DeceasedStatus;
  isProband: boolean;
  isConsultand: boolean;
  adoptionStatus: AdoptionStatus;
  phenotypeSummary: string;
  genotypeNotes: string;
  notes: string;
  // Step 3: Relationships
  parentUnionId: string;   // assign as child to existing union
  partnerOfId: string;     // create a new union with this person
}

const initial: WizardState = {
  step: 'identity',
  firstName: '',
  lastName: '',
  sex: 'unknown',
  birthYear: '',
  deathYear: '',
  affectedStatus: 'unknown',
  carrierType: '',
  deceasedStatus: 'unknown',
  isProband: false,
  isConsultand: false,
  adoptionStatus: 'not_adopted',
  phenotypeSummary: '',
  genotypeNotes: '',
  notes: '',
  parentUnionId: '',
  partnerOfId: '',
};

type Action = { field: keyof WizardState; value: string | boolean };

function reducer(state: WizardState, action: Action): WizardState {
  return { ...state, [action.field]: action.value };
}

const STEPS: WizardStep[] = ['identity', 'clinical', 'relationships', 'review'];
const STEP_LABELS: Record<WizardStep, string> = {
  identity: 'Identity',
  clinical: 'Clinical Status',
  relationships: 'Relationships',
  review: 'Review & Add',
};

// ─────────────────────────────────────────────────────────────────────────────
// Main wizard component
// ─────────────────────────────────────────────────────────────────────────────

export function AddFamilyMemberWizard({
  onDone,
}: {
  onDone: () => void;
}) {
  const [state, dispatch] = useReducer(reducer, initial);
  const set = (field: keyof WizardState, value: string | boolean) =>
    dispatch({ field, value });

  const { pedigreeCase, addIndividual, setProband, linkPartners, addChildToUnion } =
    usePedigreeStore();

  const individuals = Object.values(pedigreeCase.individuals).filter(
    (i) => !i.id.startsWith('unknown_')
  );
  const unions = Object.values(pedigreeCase.unions);

  const stepIndex = STEPS.indexOf(state.step);

  const goNext = () => set('step', STEPS[stepIndex + 1]);
  const goPrev = () => set('step', STEPS[stepIndex - 1]);

  const handleSubmit = () => {
    const ind = createIndividual({
      firstName: state.firstName.trim() || undefined,
      lastName: state.lastName.trim() || undefined,
      sex: state.sex,
      birthYear: state.birthYear ? parseInt(state.birthYear) : undefined,
      deathYear: state.deathYear ? parseInt(state.deathYear) : undefined,
      affectedStatus: state.affectedStatus,
      carrierType: (state.carrierType as CarrierType) || undefined,
      deceasedStatus: state.deceasedStatus,
      isProband: state.isProband,
      isConsultand: state.isConsultand,
      adoptionStatus: state.adoptionStatus ?? 'not_adopted',
      phenotypeSummary: state.phenotypeSummary || undefined,
      genotypeNotes: state.genotypeNotes || undefined,
      notes: state.notes || undefined,
    });

    addIndividual(ind);

    if (state.isProband) setProband(ind.id);

    if (state.parentUnionId) {
      addChildToUnion(state.parentUnionId, ind.id);
    }

    if (state.partnerOfId) {
      linkPartners(state.partnerOfId, ind.id, []);
    }

    onDone();
  };

  return (
    <div className="panel overflow-hidden">
      {/* Step indicator */}
      <div className="px-4 py-3 border-b border-surface-200 bg-surface-50">
        <div className="flex items-center gap-0">
          {STEPS.map((s, idx) => (
            <React.Fragment key={s}>
              <div
                className={clsx(
                  'flex items-center gap-1.5 text-2xs font-display font-semibold uppercase tracking-wide',
                  stepIndex === idx
                    ? 'text-clinical-700'
                    : stepIndex > idx
                    ? 'text-surface-400'
                    : 'text-surface-300'
                )}
              >
                <div
                  className={clsx(
                    'w-4 h-4 rounded-full flex items-center justify-center text-2xs font-mono',
                    stepIndex === idx
                      ? 'bg-clinical-700 text-white'
                      : stepIndex > idx
                      ? 'bg-surface-300 text-white'
                      : 'bg-surface-200 text-surface-400'
                  )}
                >
                  {stepIndex > idx ? <Check size={9} /> : idx + 1}
                </div>
                <span className="hidden sm:inline">{STEP_LABELS[s]}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className="flex-1 h-px bg-surface-200 mx-2 min-w-[8px]" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="p-4">
        {/* ── Step 1: Identity ───────────────────────────── */}
        {state.step === 'identity' && (
          <StepIdentity state={state} set={set} />
        )}

        {/* ── Step 2: Clinical ───────────────────────────── */}
        {state.step === 'clinical' && (
          <StepClinical state={state} set={set} />
        )}

        {/* ── Step 3: Relationships ──────────────────────── */}
        {state.step === 'relationships' && (
          <StepRelationships
            state={state}
            set={set}
            individuals={individuals}
            unions={unions}
            pedigreeCase={pedigreeCase}
          />
        )}

        {/* ── Step 4: Review ─────────────────────────────── */}
        {state.step === 'review' && (
          <StepReview
            state={state}
            pedigreeCase={pedigreeCase}
          />
        )}

        {/* Navigation */}
        <div className="flex gap-2 mt-5 pt-4 border-t border-surface-100">
          {stepIndex > 0 && (
            <button
              className="btn-secondary btn text-xs gap-1"
              onClick={goPrev}
            >
              <ChevronLeft size={13} /> Back
            </button>
          )}
          <div className="flex-1" />
          <button className="btn-ghost btn text-xs" onClick={onDone}>
            Cancel
          </button>
          {stepIndex < STEPS.length - 1 ? (
            <button
              className="btn-primary btn text-xs gap-1"
              onClick={goNext}
            >
              Next <ChevronRight size={13} />
            </button>
          ) : (
            <button
              className="btn-primary btn text-xs gap-1.5"
              onClick={handleSubmit}
            >
              <UserPlus size={13} />
              Add to Pedigree
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StepIdentity({
  state,
  set,
}: {
  state: WizardState;
  set: (f: keyof WizardState, v: string | boolean) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-surface-500 mb-3">
        Basic identifying information. Names are optional — label will be auto-assigned.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Field label="First Name">
          <input
            className="field-input"
            value={state.firstName}
            onChange={(e) => set('firstName', e.target.value)}
            placeholder="Optional"
          />
        </Field>
        <Field label="Last Name">
          <input
            className="field-input"
            value={state.lastName}
            onChange={(e) => set('lastName', e.target.value)}
            placeholder="Optional"
          />
        </Field>
      </div>

      <Field label="Sex">
        <div className="flex gap-1.5">
          {(['male', 'female', 'unknown'] as Sex[]).map((s) => (
            <button
              key={s}
              className={clsx(
                'flex-1 rounded border py-2 text-xs font-display capitalize transition-colors',
                state.sex === s
                  ? 'bg-clinical-700 text-white border-clinical-700'
                  : 'bg-white text-surface-600 border-surface-300 hover:border-surface-400'
              )}
              onClick={() => set('sex', s)}
            >
              {s}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Birth Year">
          <input
            className="field-input"
            type="number"
            min={1900}
            max={2030}
            placeholder="YYYY"
            value={state.birthYear}
            onChange={(e) => set('birthYear', e.target.value)}
          />
        </Field>
        <Field label="Death Year">
          <input
            className="field-input"
            type="number"
            min={1900}
            max={2030}
            placeholder="YYYY"
            value={state.deathYear}
            onChange={(e) => set('deathYear', e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}

function StepClinical({
  state,
  set,
}: {
  state: WizardState;
  set: (f: keyof WizardState, v: string | boolean) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-surface-500 mb-3">
        Clinical and genetic status. These drive pedigree symbol rendering.
      </p>

      <Field label="Affected Status">
        <select
          className="field-select"
          value={state.affectedStatus}
          onChange={(e) => set('affectedStatus', e.target.value)}
        >
          <option value="unknown">Unknown</option>
          <option value="unaffected">Unaffected</option>
          <option value="affected">Affected</option>
          <option value="carrier">Carrier</option>
        </select>
      </Field>

      {state.affectedStatus === 'carrier' && (
        <Field label="Carrier Type">
          <select
            className="field-select"
            value={state.carrierType}
            onChange={(e) => set('carrierType', e.target.value)}
          >
            <option value="">— Select carrier type —</option>
            <option value="autosomal_recessive">Autosomal Recessive (central dot)</option>
            <option value="x_linked">X-linked (half-filled)</option>
            <option value="obligate">Obligate (inferred, not tested)</option>
            <option value="tested_positive">Tested Positive (molecular)</option>
          </select>
        </Field>
      )}

      <Field label="Deceased Status">
        <select
          className="field-select"
          value={state.deceasedStatus}
          onChange={(e) => set('deceasedStatus', e.target.value)}
        >
          <option value="unknown">Unknown</option>
          <option value="alive">Alive</option>
          <option value="deceased">Deceased</option>
        </select>
      </Field>

      <Field label="Adoption Status">
        <select
          className="field-select"
          value={state.adoptionStatus ?? 'not_adopted'}
          onChange={(e) => set('adoptionStatus', e.target.value)}
        >
          <option value="not_adopted">Not adopted</option>
          <option value="adopted_in">Adopted into family (bracket notation)</option>
          <option value="adopted_out">Adopted out of family</option>
        </select>
      </Field>

      <div className="space-y-2 pt-1">
        <CheckOption
          id="wiz-proband"
          label="Mark as Proband (index case)"
          checked={state.isProband}
          onChange={(v) => set('isProband', v)}
        />
        <CheckOption
          id="wiz-consultand"
          label="Mark as Consultand (seeking counseling)"
          checked={state.isConsultand}
          onChange={(v) => set('isConsultand', v)}
        />
      </div>

      <Field label="Phenotype Summary">
        <textarea
          className="field-textarea min-h-[60px]"
          placeholder="Key clinical features, age of onset…"
          value={state.phenotypeSummary}
          onChange={(e) => set('phenotypeSummary', e.target.value)}
        />
      </Field>

      <Field label="Molecular / Genotype Notes">
        <input
          className="field-input font-mono text-xs"
          placeholder="e.g. CFTR c.1521_1523del (het)"
          value={state.genotypeNotes}
          onChange={(e) => set('genotypeNotes', e.target.value)}
        />
      </Field>

      <Field label="Free-text Notes">
        <textarea
          className="field-textarea min-h-[48px]"
          placeholder="Any other clinical or admin notes…"
          value={state.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </Field>
    </div>
  );
}

function StepRelationships({
  state,
  set,
  individuals,
  unions,
  pedigreeCase,
}: {
  state: WizardState;
  set: (f: keyof WizardState, v: string | boolean) => void;
  individuals: Individual[];
  unions: import('../../domain/types').Union[];
  pedigreeCase: import('../../domain/types').PedigreeCase;
}) {
  const unionLabel = (u: (typeof unions)[0]) => {
    const p1 = pedigreeCase.individuals[u.partner1Id];
    const p2 = pedigreeCase.individuals[u.partner2Id];
    const l1 = p1 ? `${p1.label}${p1.firstName ? ` (${p1.firstName})` : ''}` : '?';
    const l2 = p2 ? `${p2.label}${p2.firstName ? ` (${p2.firstName})` : ''}` : '?';
    return `${l1} × ${l2}`;
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-surface-500">
        Optionally place this individual in the family graph. Both fields are optional —
        you can always link relationships later.
      </p>

      {/* Assign as child of a union */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <Link2 size={12} className="text-surface-400" />
          <label className="field-label mb-0">Add as child of couple</label>
        </div>
        {unions.length === 0 ? (
          <p className="text-xs text-surface-400 italic">
            No couples defined yet. Add relationships in the Unions tab.
          </p>
        ) : (
          <select
            className="field-select"
            value={state.parentUnionId}
            onChange={(e) => set('parentUnionId', e.target.value)}
          >
            <option value="">— Not assigned as child —</option>
            {unions.map((u) => (
              <option key={u.id} value={u.id}>
                {unionLabel(u)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Link as partner of someone */}
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <Link2 size={12} className="text-surface-400" />
          <label className="field-label mb-0">Create partnership with</label>
        </div>
        {individuals.length === 0 ? (
          <p className="text-xs text-surface-400 italic">No existing individuals.</p>
        ) : (
          <select
            className="field-select"
            value={state.partnerOfId}
            onChange={(e) => set('partnerOfId', e.target.value)}
          >
            <option value="">— Not linked as partner —</option>
            {individuals.map((i) => (
              <option key={i.id} value={i.id}>
                {i.label} {i.firstName ? `(${i.firstName})` : ''} [{i.sex}]
              </option>
            ))}
          </select>
        )}
      </div>

      {state.parentUnionId && state.partnerOfId && (
        <p className="text-xs text-amber-600 bg-amber-50 rounded px-2.5 py-1.5 border border-amber-100">
          Note: Being both a child of one couple and a partner of another is valid —
          this is the typical case for middle generations.
        </p>
      )}
    </div>
  );
}

function StepReview({
  state,
  pedigreeCase,
}: {
  state: WizardState;
  pedigreeCase: import('../../domain/types').PedigreeCase;
}) {
  const rows: Array<{ label: string; value: string; accent?: boolean }> = [
    {
      label: 'Name',
      value:
        [state.firstName, state.lastName].filter(Boolean).join(' ') || '(not provided)',
    },
    { label: 'Sex', value: state.sex },
    { label: 'Birth Year', value: state.birthYear || '—' },
    { label: 'Death Year', value: state.deathYear || '—' },
    { label: 'Affected Status', value: state.affectedStatus, accent: state.affectedStatus === 'affected' },
    { label: 'Deceased Status', value: state.deceasedStatus },
    { label: 'Proband', value: state.isProband ? 'Yes' : 'No', accent: state.isProband },
    { label: 'Consultand', value: state.isConsultand ? 'Yes' : 'No' },
    { label: 'Adoption', value: state.adoptionStatus ?? 'not_adopted' },
  ];

  if (state.phenotypeSummary) {
    rows.push({ label: 'Phenotype', value: state.phenotypeSummary });
  }
  if (state.genotypeNotes) {
    rows.push({ label: 'Genotype', value: state.genotypeNotes });
  }

  const parentUnion = state.parentUnionId
    ? pedigreeCase.unions[state.parentUnionId]
    : null;

  const partnerOf = state.partnerOfId
    ? pedigreeCase.individuals[state.partnerOfId]
    : null;

  return (
    <div className="space-y-3">
      <p className="text-xs text-surface-500">
        Review before adding to pedigree. Go back to correct any details.
      </p>

      <div className="panel p-3 space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex gap-2 text-xs">
            <span className="text-surface-400 w-28 flex-shrink-0 font-display uppercase tracking-wide text-2xs mt-0.5">
              {r.label}
            </span>
            <span className={clsx('flex-1', r.accent ? 'text-clinical-700 font-semibold' : 'text-surface-700')}>
              {r.value}
            </span>
          </div>
        ))}
      </div>

      {(parentUnion || partnerOf) && (
        <div className="panel p-3">
          <p className="section-heading mt-0">Relationships to be created</p>
          <div className="space-y-1 text-xs">
            {parentUnion && (
              <div className="flex items-center gap-2 text-surface-700">
                <Link2 size={11} className="text-clinical-500" />
                <span>
                  Child of:{' '}
                  <span className="font-medium">
                    {pedigreeCase.individuals[parentUnion.partner1Id]?.label ?? '?'} ×{' '}
                    {pedigreeCase.individuals[parentUnion.partner2Id]?.label ?? '?'}
                  </span>
                </span>
              </div>
            )}
            {partnerOf && (
              <div className="flex items-center gap-2 text-surface-700">
                <Link2 size={11} className="text-clinical-500" />
                <span>
                  Partner of:{' '}
                  <span className="font-medium">
                    {partnerOf.label}
                    {partnerOf.firstName ? ` (${partnerOf.firstName})` : ''}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Local helpers
// ─────────────────────────────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

function CheckOption({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="checkbox"
        className="rounded border-surface-300 text-clinical-600 focus:ring-clinical-500"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label htmlFor={id} className="text-xs text-surface-600 cursor-pointer">
        {label}
      </label>
    </div>
  );
}
