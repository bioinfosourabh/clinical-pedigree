import React, { useState } from 'react';
import { usePedigreeStore } from '../../hooks/usePedigreeStore';
import { createIndividual } from '../../domain/factories';
import type { PregnancyStatus, Sex } from '../../domain/types';
import { Baby, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

/**
 * PregnancyEventForm
 *
 * Allows recording of reproductive events that do not produce living
 * family members: miscarriages, stillbirths, TOPs, ectopics, and
 * current pregnancies.
 *
 * Clinical conventions (Bennett et al. 2008):
 *   - Miscarriage (<20 weeks): small triangle pointing down
 *   - Stillbirth (≥20 weeks): larger diamond / filled symbol
 *   - Termination: triangle with horizontal line
 *   - Current pregnancy: diamond outline
 *   - Sex is often unknown for early losses — unknown is the default.
 *
 * Each event is stored as an Individual node with a pregnancyStatus flag,
 * and linked to the parental union as a child.
 */
export function PregnancyEventForm() {
  const { pedigreeCase, addIndividual, addChildToUnion, linkPartners } =
    usePedigreeStore();

  const [eventType, setEventType] = useState<PregnancyStatus>('miscarriage');
  const [sex, setSex] = useState<Sex>('unknown');
  const [gestationWeeks, setGestationWeeks] = useState('');
  const [parentUnionId, setParentUnionId] = useState('');
  const [notes, setNotes] = useState('');
  const [added, setAdded] = useState(false);

  const unions = Object.values(pedigreeCase.unions);
  const individuals = pedigreeCase.individuals;

  const unionLabel = (u: (typeof unions)[0]) => {
    const p1 = individuals[u.partner1Id];
    const p2 = individuals[u.partner2Id];
    const l1 = p1 ? `${p1.label}${p1.firstName ? ` (${p1.firstName})` : ''}` : '?';
    const l2 = p2 ? `${p2.label}${p2.firstName ? ` (${p2.firstName})` : ''}` : '?';
    return `${l1} × ${l2}`;
  };

  const handleAdd = () => {
    if (!eventType) return;

    const label = `${eventTypeLabel(eventType)}`;
    const ind = createIndividual({
      sex,
      pregnancyStatus: eventType,
      affectedStatus: 'unknown',
      deceasedStatus:
        eventType === 'current_pregnancy' ? 'unknown' : 'deceased',
      notes: [
        notes,
        gestationWeeks ? `Gestation: ${gestationWeeks} weeks` : '',
      ]
        .filter(Boolean)
        .join('. ') || undefined,
      label,
    });

    addIndividual(ind);

    if (parentUnionId) {
      addChildToUnion(parentUnionId, ind.id);
    }

    // Reset
    setGestationWeeks('');
    setNotes('');
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded bg-amber-50 border border-amber-100 px-3 py-2">
        <AlertCircle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          Pregnancy losses and current pregnancies are recorded as special
          individual nodes. They render as standard pedigree symbols (triangle,
          diamond) and can be attached to a parental union.
        </p>
      </div>

      {/* Event type */}
      <div>
        <label className="field-label">Event Type</label>
        <div className="grid grid-cols-2 gap-1.5">
          {PREGNANCY_EVENT_TYPES.map(({ value, label, desc }) => (
            <button
              key={value}
              className={clsx(
                'rounded border px-2.5 py-2 text-left transition-colors',
                eventType === value
                  ? 'bg-clinical-700 text-white border-clinical-700'
                  : 'bg-white text-surface-700 border-surface-300 hover:border-surface-400'
              )}
              onClick={() => setEventType(value as PregnancyStatus)}
            >
              <div className="text-xs font-medium font-display">{label}</div>
              <div
                className={clsx(
                  'text-2xs mt-0.5',
                  eventType === value ? 'text-clinical-200' : 'text-surface-400'
                )}
              >
                {desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Sex (often unknown for early losses) */}
      <div>
        <label className="field-label">Sex (if known)</label>
        <div className="flex gap-1.5">
          {(['unknown', 'male', 'female'] as Sex[]).map((s) => (
            <button
              key={s}
              className={clsx(
                'flex-1 rounded border py-1.5 text-xs font-display capitalize transition-colors',
                sex === s
                  ? 'bg-clinical-700 text-white border-clinical-700'
                  : 'bg-white text-surface-600 border-surface-300 hover:border-surface-400'
              )}
              onClick={() => setSex(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Gestation */}
      {eventType !== 'current_pregnancy' && (
        <div>
          <label className="field-label">Gestational Age (weeks)</label>
          <input
            className="field-input"
            type="number"
            min={4}
            max={42}
            placeholder="e.g. 12"
            value={gestationWeeks}
            onChange={(e) => setGestationWeeks(e.target.value)}
          />
          {gestationWeeks && parseInt(gestationWeeks) >= 20 && eventType === 'miscarriage' && (
            <p className="text-2xs text-amber-600 mt-1">
              ≥20 weeks is typically classified as a stillbirth, not a miscarriage.
            </p>
          )}
        </div>
      )}

      {/* Assign to union */}
      {unions.length > 0 && (
        <div>
          <label className="field-label">Assign to Parental Couple</label>
          <select
            className="field-select"
            value={parentUnionId}
            onChange={(e) => setParentUnionId(e.target.value)}
          >
            <option value="">— Not assigned —</option>
            {unions.map((u) => (
              <option key={u.id} value={u.id}>
                {unionLabel(u)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="field-label">Notes</label>
        <input
          className="field-input"
          placeholder="e.g. chromosomally abnormal, trisomy 21"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {added && (
        <p className="text-xs text-emerald-600 font-medium">✓ Event added to pedigree.</p>
      )}

      <button
        className="btn-primary btn w-full text-xs justify-center"
        onClick={handleAdd}
        disabled={!eventType}
      >
        <Baby size={12} />
        Add {eventType ? eventTypeLabel(eventType) : 'Event'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const PREGNANCY_EVENT_TYPES = [
  {
    value: 'miscarriage',
    label: 'Miscarriage',
    desc: 'SAB < 20 weeks',
  },
  {
    value: 'stillbirth',
    label: 'Stillbirth',
    desc: 'Fetal demise ≥ 20 weeks',
  },
  {
    value: 'terminated',
    label: 'Termination (TOP)',
    desc: 'Elective pregnancy termination',
  },
  {
    value: 'ectopic',
    label: 'Ectopic',
    desc: 'Ectopic pregnancy',
  },
  {
    value: 'current_pregnancy',
    label: 'Current Pregnancy',
    desc: 'Ongoing, sex may be unknown',
  },
];

function eventTypeLabel(type: PregnancyStatus): string {
  const found = PREGNANCY_EVENT_TYPES.find((e) => e.value === type);
  return found?.label ?? type ?? 'Event';
}
