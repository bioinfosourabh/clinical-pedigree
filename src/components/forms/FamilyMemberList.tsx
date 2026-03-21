import React from 'react';
import { usePedigreeStore } from '../../hooks/usePedigreeStore';
import { Star, Skull, Circle, User, UserX } from 'lucide-react';
import clsx from 'clsx';
import type { Individual } from '../../domain/types';

export function FamilyMemberList() {
  const { pedigreeCase, ui, selectIndividual, removeIndividual } =
    usePedigreeStore();

  const individuals = Object.values(pedigreeCase.individuals).filter(
    (i) => !i.id.startsWith('unknown_')
  );

  if (individuals.length === 0) {
    return (
      <p className="text-xs text-surface-400 italic py-2">
        No family members yet. Add individuals below.
      </p>
    );
  }

  return (
    <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
      {individuals.map((ind) => (
        <MemberRow
          key={ind.id}
          individual={ind}
          selected={ui.selectedIndividualId === ind.id}
          onSelect={() => selectIndividual(ind.id)}
          onRemove={() => removeIndividual(ind.id)}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function MemberRow({
  individual,
  selected,
  onSelect,
  onRemove,
}: {
  individual: Individual;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { sex, affectedStatus, deceasedStatus, isProband, label, pregnancyStatus } =
    individual;

  return (
    <div
      className={clsx(
        'group flex items-center gap-2 rounded px-2 py-1.5 cursor-pointer',
        'transition-colors duration-100 text-xs',
        selected
          ? 'bg-clinical-50 border border-clinical-200'
          : 'hover:bg-surface-50 border border-transparent'
      )}
      onClick={onSelect}
    >
      {/* Symbol mini */}
      <MiniSymbol
        sex={sex}
        affected={affectedStatus === 'affected'}
        carrier={affectedStatus === 'carrier'}
        deceased={deceasedStatus === 'deceased'}
        pregnancy={!!pregnancyStatus && pregnancyStatus !== 'liveborn' && pregnancyStatus !== 'current_pregnancy'}
      />

      {/* Label + name */}
      <div className="flex-1 min-w-0">
        <span className="font-mono text-surface-600 mr-1.5">{label}</span>
        {individual.firstName && (
          <span className="text-surface-800">
            {individual.firstName} {individual.lastName ?? ''}
          </span>
        )}
        {individual.birthYear && (
          <span className="text-surface-400 ml-1">b.{individual.birthYear}</span>
        )}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1">
        {isProband && (
          <span title="Proband">
            <Star size={11} className="text-clinical-600 fill-clinical-200" />
          </span>
        )}
        {deceasedStatus === 'deceased' && (
          <span title="Deceased">
            <Skull size={11} className="text-surface-400" />
          </span>
        )}
      </div>

      {/* Remove button */}
      <button
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5
                   text-surface-400 hover:text-red-500 rounded"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        title="Remove individual"
      >
        <UserX size={12} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function MiniSymbol({
  sex,
  affected,
  carrier,
  deceased,
  pregnancy,
}: {
  sex: string;
  affected: boolean;
  carrier: boolean;
  deceased: boolean;
  pregnancy: boolean;
}) {
  const fillClass = affected
    ? 'fill-surface-900'
    : carrier
    ? 'fill-surface-400'
    : 'fill-white';

  if (pregnancy) {
    // Diamond for miscarriage/stillbirth
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" className="flex-shrink-0">
        <polygon
          points="7,0 14,7 7,14 0,7"
          className={`stroke-surface-700 ${fillClass}`}
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  if (sex === 'male') {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" className="flex-shrink-0">
        <rect
          x="1"
          y="1"
          width="12"
          height="12"
          className={`stroke-surface-700 ${fillClass}`}
          strokeWidth="1.5"
        />
        {deceased && (
          <line x1="1" y1="1" x2="13" y2="13" stroke="#64748b" strokeWidth="1.5" />
        )}
      </svg>
    );
  }

  if (sex === 'female') {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" className="flex-shrink-0">
        <circle
          cx="7"
          cy="7"
          r="6"
          className={`stroke-surface-700 ${fillClass}`}
          strokeWidth="1.5"
        />
        {deceased && (
          <line x1="1" y1="7" x2="13" y2="7" stroke="#64748b" strokeWidth="1.5" />
        )}
      </svg>
    );
  }

  // Unknown sex — diamond/rhombus
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className="flex-shrink-0">
      <polygon
        points="7,1 13,7 7,13 1,7"
        className={`stroke-surface-700 ${fillClass}`}
        strokeWidth="1.5"
      />
    </svg>
  );
}
