import React, { useState } from 'react';
import { usePedigreeStore } from '../../hooks/usePedigreeStore';
import { createIndividual } from '../../domain/factories';
import type { Sex, AffectedStatus } from '../../domain/types';
import { UserPlus, Link2 } from 'lucide-react';
import clsx from 'clsx';

type QuickFormState = {
  firstName: string;
  sex: Sex;
  affectedStatus: AffectedStatus;
  isProband: boolean;
  birthYear: string;
  linkedParentId: string;
  relationship: 'child' | 'partner';
};

const initial: QuickFormState = {
  firstName: '',
  sex: 'unknown',
  affectedStatus: 'unknown',
  isProband: false,
  birthYear: '',
  linkedParentId: '',
  relationship: 'child',
};

export function AddIndividualForm() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<QuickFormState>(initial);

  const { pedigreeCase, addIndividual, linkPartners, setProband } =
    usePedigreeStore();

  const individuals = Object.values(pedigreeCase.individuals).filter(
    (i) => !i.id.startsWith('unknown_')
  );

  const set = (field: keyof QuickFormState, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleAdd = () => {
    const ind = createIndividual({
      firstName: form.firstName.trim() || undefined,
      sex: form.sex,
      affectedStatus: form.affectedStatus,
      isProband: form.isProband,
      birthYear: form.birthYear ? parseInt(form.birthYear) : undefined,
      deceasedStatus: 'unknown',
    });

    addIndividual(ind);

    if (form.isProband) {
      setProband(ind.id);
    }

    // Link to parent/partner if selected
    if (form.linkedParentId) {
      if (form.relationship === 'partner') {
        linkPartners(form.linkedParentId, ind.id, []);
      } else {
        // Link as child — need to find or create a union for the parent
        const existingUnion = Object.values(pedigreeCase.unions).find(
          (u) =>
            u.partner1Id === form.linkedParentId ||
            u.partner2Id === form.linkedParentId
        );
        if (existingUnion) {
          // Add to existing union via store action
          usePedigreeStore.getState().addChildToUnion(existingUnion.id, ind.id);
        } else {
          // Create a new union with an unknown partner
          linkPartners(form.linkedParentId, `unknown_other_${ind.id}`, [ind.id]);
        }
      }
    }

    setForm(initial);
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        className="btn-secondary btn w-full justify-center text-xs gap-2"
        onClick={() => setOpen(true)}
      >
        <UserPlus size={13} />
        Add Family Member
      </button>
    );
  }

  return (
    <div className="panel p-3 space-y-3">
      <p className="panel-title">New Individual</p>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="field-label">First Name</label>
          <input
            className="field-input"
            placeholder="Optional"
            value={form.firstName}
            onChange={(e) => set('firstName', e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">Birth Year</label>
          <input
            className="field-input"
            type="number"
            placeholder="YYYY"
            min={1900}
            max={2030}
            value={form.birthYear}
            onChange={(e) => set('birthYear', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="field-label">Sex</label>
        <div className="flex gap-2">
          {(['male', 'female', 'unknown'] as Sex[]).map((s) => (
            <button
              key={s}
              className={clsx(
                'flex-1 rounded border py-1.5 text-xs font-display font-medium capitalize transition-colors',
                form.sex === s
                  ? 'bg-clinical-700 text-white border-clinical-700'
                  : 'bg-white text-surface-600 border-surface-300 hover:border-surface-400'
              )}
              onClick={() => set('sex', s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="field-label">Affected Status</label>
        <select
          className="field-select"
          value={form.affectedStatus}
          onChange={(e) => set('affectedStatus', e.target.value as AffectedStatus)}
        >
          <option value="unknown">Unknown</option>
          <option value="unaffected">Unaffected</option>
          <option value="affected">Affected</option>
          <option value="carrier">Carrier</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="isProband"
          type="checkbox"
          className="rounded border-surface-300 text-clinical-600 focus:ring-clinical-500"
          checked={form.isProband}
          onChange={(e) => set('isProband', e.target.checked)}
        />
        <label htmlFor="isProband" className="text-xs text-surface-600 cursor-pointer">
          Mark as Proband (index case)
        </label>
      </div>

      {individuals.length > 0 && (
        <>
          <div className="divider" />
          <div className="flex items-center gap-1.5 mb-2">
            <Link2 size={12} className="text-surface-400" />
            <span className="text-2xs text-surface-500 font-display uppercase tracking-wide">
              Link to existing individual
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="field-label">Individual</label>
              <select
                className="field-select"
                value={form.linkedParentId}
                onChange={(e) => set('linkedParentId', e.target.value)}
              >
                <option value="">— None —</option>
                {individuals.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.label} {i.firstName ? `(${i.firstName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {form.linkedParentId && (
              <div>
                <label className="field-label">As</label>
                <select
                  className="field-select"
                  value={form.relationship}
                  onChange={(e) =>
                    set('relationship', e.target.value as 'child' | 'partner')
                  }
                >
                  <option value="child">Child of</option>
                  <option value="partner">Partner of</option>
                </select>
              </div>
            )}
          </div>
        </>
      )}

      <div className="flex gap-2 pt-1">
        <button className="btn-primary btn flex-1 text-xs" onClick={handleAdd}>
          Add Individual
        </button>
        <button
          className="btn-secondary btn text-xs px-3"
          onClick={() => {
            setForm(initial);
            setOpen(false);
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
