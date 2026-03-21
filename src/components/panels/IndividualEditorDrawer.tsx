import React from 'react';
import { usePedigreeStore } from '../../hooks/usePedigreeStore';
import { X, Star, StarOff, Trash2 } from 'lucide-react';
import type {
  Sex,
  AffectedStatus,
  CarrierType,
  DeceasedStatus,
  PregnancyStatus,
  TwinType,
  AdoptionStatus,
} from '../../domain/types';
import clsx from 'clsx';

export function IndividualEditorDrawer() {
  const {
    pedigreeCase,
    ui,
    closeEditor,
    updateIndividual,
    removeIndividual,
    setProband,
  } = usePedigreeStore();

  const individual = ui.selectedIndividualId
    ? pedigreeCase.individuals[ui.selectedIndividualId]
    : null;

  if (!individual) return null;

  const update = (field: string, value: unknown) =>
    updateIndividual(individual.id, { [field]: value });

  const handleRemove = () => {
    removeIndividual(individual.id);
    closeEditor();
  };

  return (
    <>
      {/* Backdrop for smaller screens */}
      <div
        className={clsx(
          'fixed inset-0 bg-black/20 z-20 transition-opacity duration-200',
          ui.editorOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={closeEditor}
      />

      {/* Drawer */}
      <aside
        className={clsx(
          'absolute right-0 top-0 bottom-0 w-80 bg-white border-l border-surface-200',
          'shadow-modal z-30 flex flex-col transition-transform duration-200',
          ui.editorOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3
                        border-b border-surface-200 bg-surface-50">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-surface-800">
              {individual.label || 'Individual'}
            </span>
            {individual.isProband && (
              <span className="badge badge-info">Proband</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              className={clsx(
                'btn-ghost btn btn-sm',
                individual.isProband && 'text-clinical-600'
              )}
              onClick={() => setProband(individual.id)}
              title={individual.isProband ? 'Remove proband flag' : 'Set as proband'}
            >
              {individual.isProband ? (
                <StarOff size={14} />
              ) : (
                <Star size={14} />
              )}
            </button>
            <button
              className="btn-ghost btn btn-sm text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={handleRemove}
              title="Remove individual"
            >
              <Trash2 size={14} />
            </button>
            <button
              className="btn-ghost btn btn-sm"
              onClick={closeEditor}
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">

          {/* ── Identity ─────────────────────────────── */}
          <Section title="Identity">
            <div className="grid grid-cols-2 gap-2">
              <Field label="First Name">
                <input
                  className="field-input"
                  value={individual.firstName ?? ''}
                  onChange={(e) => update('firstName', e.target.value || undefined)}
                  placeholder="Optional"
                />
              </Field>
              <Field label="Last Name">
                <input
                  className="field-input"
                  value={individual.lastName ?? ''}
                  onChange={(e) => update('lastName', e.target.value || undefined)}
                  placeholder="Optional"
                />
              </Field>
            </div>

            <Field label="Pedigree Label">
              <input
                className="field-input font-mono"
                value={individual.label}
                onChange={(e) => update('label', e.target.value)}
                placeholder="e.g. II-3"
              />
            </Field>
          </Section>

          {/* ── Demographics ─────────────────────────── */}
          <Section title="Demographics">
            <Field label="Sex">
              <div className="flex gap-1.5">
                {(['male', 'female', 'unknown'] as Sex[]).map((s) => (
                  <button
                    key={s}
                    className={clsx(
                      'flex-1 rounded border py-1.5 text-xs font-display capitalize transition-colors',
                      individual.sex === s
                        ? 'bg-clinical-700 text-white border-clinical-700'
                        : 'bg-white text-surface-600 border-surface-300 hover:border-surface-400'
                    )}
                    onClick={() => update('sex', s)}
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
                  value={individual.birthYear ?? ''}
                  onChange={(e) =>
                    update('birthYear', e.target.value ? parseInt(e.target.value) : undefined)
                  }
                  placeholder="YYYY"
                />
              </Field>
              <Field label="Death Year">
                <input
                  className="field-input"
                  type="number"
                  min={1900}
                  max={2030}
                  value={individual.deathYear ?? ''}
                  onChange={(e) =>
                    update('deathYear', e.target.value ? parseInt(e.target.value) : undefined)
                  }
                  placeholder="YYYY"
                />
              </Field>
            </div>
          </Section>

          {/* ── Clinical Status ───────────────────────── */}
          <Section title="Clinical Status">
            <Field label="Affected Status">
              <select
                className="field-select"
                value={individual.affectedStatus}
                onChange={(e) => update('affectedStatus', e.target.value as AffectedStatus)}
              >
                <option value="unknown">Unknown</option>
                <option value="unaffected">Unaffected</option>
                <option value="affected">Affected</option>
                <option value="carrier">Carrier</option>
              </select>
            </Field>

            {individual.affectedStatus === 'carrier' && (
              <Field label="Carrier Type">
                <select
                  className="field-select"
                  value={individual.carrierType ?? ''}
                  onChange={(e) => update('carrierType', e.target.value as CarrierType)}
                >
                  <option value="">— Select —</option>
                  <option value="autosomal_recessive">Autosomal Recessive (dot)</option>
                  <option value="x_linked">X-linked (quadrant fill)</option>
                  <option value="obligate">Obligate Carrier</option>
                  <option value="tested_positive">Tested Positive</option>
                </select>
              </Field>
            )}

            <Field label="Deceased Status">
              <select
                className="field-select"
                value={individual.deceasedStatus}
                onChange={(e) => update('deceasedStatus', e.target.value as DeceasedStatus)}
              >
                <option value="unknown">Unknown</option>
                <option value="alive">Alive</option>
                <option value="deceased">Deceased</option>
              </select>
            </Field>

            <Field label="Pregnancy / Reproductive Event">
              <select
                className="field-select"
                value={individual.pregnancyStatus ?? ''}
                onChange={(e) =>
                  update('pregnancyStatus', e.target.value as PregnancyStatus || null)
                }
              >
                <option value="">— Standard birth / Not applicable —</option>
                <option value="liveborn">Liveborn</option>
                <option value="current_pregnancy">Current Pregnancy</option>
                <option value="miscarriage">Miscarriage (&lt;20wks)</option>
                <option value="stillbirth">Stillbirth (≥20wks)</option>
                <option value="terminated">Elective Termination (TOP)</option>
                <option value="ectopic">Ectopic Pregnancy</option>
              </select>
            </Field>
          </Section>

          {/* ── Special Designations ─────────────────── */}
          <Section title="Special Designations">
            <Field label="Twin Type">
              <select
                className="field-select"
                value={individual.twinType ?? ''}
                onChange={(e) =>
                  update('twinType', e.target.value as TwinType || null)
                }
              >
                <option value="">Not a twin</option>
                <option value="monozygotic">Monozygotic (MZ / identical)</option>
                <option value="dizygotic">Dizygotic (DZ / fraternal)</option>
              </select>
            </Field>

            <Field label="Adoption Status">
              <select
                className="field-select"
                value={individual.adoptionStatus ?? 'not_adopted'}
                onChange={(e) => update('adoptionStatus', e.target.value as AdoptionStatus)}
              >
                <option value="not_adopted">Not adopted</option>
                <option value="adopted_in">Adopted into family</option>
                <option value="adopted_out">Adopted out of family</option>
              </select>
            </Field>

            <div className="space-y-2">
              <CheckOption
                id="isProband"
                label="Proband (index case)"
                checked={individual.isProband}
                onChange={() => setProband(individual.id)}
              />
              <CheckOption
                id="isConsultand"
                label="Consultand (seeking counseling)"
                checked={individual.isConsultand}
                onChange={(v) => update('isConsultand', v)}
              />
              <CheckOption
                id="sexUnconfirmed"
                label="Sex unconfirmed / uncertain"
                checked={individual.sexUnconfirmed}
                onChange={(v) => update('sexUnconfirmed', v)}
              />
            </div>
          </Section>

          {/* ── Clinical Annotations ─────────────────── */}
          <Section title="Clinical Annotations">
            <Field label="Phenotype Summary">
              <textarea
                className="field-textarea min-h-[70px]"
                value={individual.phenotypeSummary ?? ''}
                onChange={(e) => update('phenotypeSummary', e.target.value || undefined)}
                placeholder="Clinical features, age of onset, severity…"
              />
            </Field>

            <Field label="Molecular / Genotype Notes">
              <textarea
                className="field-textarea min-h-[50px] font-mono text-xs"
                value={individual.genotypeNotes ?? ''}
                onChange={(e) => update('genotypeNotes', e.target.value || undefined)}
                placeholder="e.g. BRCA1 c.5266dupC (het), de novo confirmed"
              />
            </Field>

            <Field label="Free-text Notes">
              <textarea
                className="field-textarea min-h-[60px]"
                value={individual.notes ?? ''}
                onChange={(e) => update('notes', e.target.value || undefined)}
                placeholder="Any additional clinical or administrative notes…"
              />
            </Field>
          </Section>

        </div>
      </aside>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="section-heading">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

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
  onChange: (value: boolean) => void;
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
