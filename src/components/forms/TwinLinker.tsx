import React, { useState } from 'react';
import { usePedigreeStore } from '../../hooks/usePedigreeStore';
import type { TwinType } from '../../domain/types';
import { Link2, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

/**
 * TwinLinker
 *
 * Allows the user to designate two siblings as a twin pair (MZ or DZ).
 * Writes twinType and twinWith to both individuals.
 *
 * Clinical notes:
 *   - MZ twins share 100% of DNA; DZ twins share ~50% like regular siblings.
 *   - Twin type matters for inheritance pattern assessment.
 *   - The pedigree renderer draws a diverging line for twins.
 */
export function TwinLinker() {
  const { pedigreeCase, updateIndividual } = usePedigreeStore();
  const [ind1Id, setInd1Id] = useState('');
  const [ind2Id, setInd2Id] = useState('');
  const [twinType, setTwinType] = useState<TwinType>('dizygotic');
  const [success, setSuccess] = useState(false);

  const individuals = Object.values(pedigreeCase.individuals).filter(
    (i) => !i.id.startsWith('unknown_')
  );

  // Find pairs that are already linked as twins
  const existingTwinPairs: Array<{ id1: string; id2: string; type: TwinType }> = [];
  const seen = new Set<string>();
  individuals.forEach((ind) => {
    if (ind.twinType && ind.twinWith && ind.twinWith.length > 0) {
      const partnerId = ind.twinWith[0];
      const pairKey = [ind.id, partnerId].sort().join('|');
      if (!seen.has(pairKey)) {
        seen.add(pairKey);
        existingTwinPairs.push({ id1: ind.id, id2: partnerId, type: ind.twinType });
      }
    }
  });

  const canLink = ind1Id && ind2Id && ind1Id !== ind2Id && twinType;

  const handleLink = () => {
    if (!canLink) return;
    // Write twinType + twinWith to both individuals
    updateIndividual(ind1Id, { twinType, twinWith: [ind2Id] });
    updateIndividual(ind2Id, { twinType, twinWith: [ind1Id] });
    setInd1Id('');
    setInd2Id('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const handleUnlink = (id1: string, id2: string) => {
    updateIndividual(id1, { twinType: null, twinWith: [] });
    updateIndividual(id2, { twinType: null, twinWith: [] });
  };

  return (
    <div className="space-y-3">
      {/* Existing twin pairs */}
      {existingTwinPairs.length > 0 && (
        <div className="space-y-1.5">
          <p className="section-heading mt-0">Existing Twin Pairs</p>
          {existingTwinPairs.map(({ id1, id2, type }) => {
            const a = pedigreeCase.individuals[id1];
            const b = pedigreeCase.individuals[id2];
            return (
              <div
                key={`${id1}|${id2}`}
                className="flex items-center gap-2 rounded bg-surface-50 border border-surface-200 px-2.5 py-2 text-xs"
              >
                <Link2 size={11} className="text-clinical-500 flex-shrink-0" />
                <span className="font-mono text-surface-700">
                  {a?.label ?? id1}
                </span>
                <span className="text-surface-400">+</span>
                <span className="font-mono text-surface-700">
                  {b?.label ?? id2}
                </span>
                <span
                  className={clsx(
                    'badge ml-auto',
                    type === 'monozygotic' ? 'badge-info' : 'badge-unaffected'
                  )}
                >
                  {type === 'monozygotic' ? 'MZ' : 'DZ'}
                </span>
                <button
                  className="text-surface-400 hover:text-red-500 transition-colors ml-1 text-2xs underline"
                  onClick={() => handleUnlink(id1, id2)}
                >
                  unlink
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Link new pair */}
      <p className="section-heading mt-0">Link Twin Pair</p>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="field-label">Twin A</label>
          <select
            className="field-select"
            value={ind1Id}
            onChange={(e) => setInd1Id(e.target.value)}
          >
            <option value="">— Select —</option>
            {individuals.map((i) => (
              <option key={i.id} value={i.id} disabled={i.id === ind2Id}>
                {i.label} {i.firstName ? `(${i.firstName})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Twin B</label>
          <select
            className="field-select"
            value={ind2Id}
            onChange={(e) => setInd2Id(e.target.value)}
          >
            <option value="">— Select —</option>
            {individuals.map((i) => (
              <option key={i.id} value={i.id} disabled={i.id === ind1Id}>
                {i.label} {i.firstName ? `(${i.firstName})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="field-label">Twin Type</label>
        <div className="flex gap-2">
          {(['monozygotic', 'dizygotic'] as TwinType[]).map((t) => (
            <button
              key={t as string}
              className={clsx(
                'flex-1 rounded border py-2 text-xs font-display font-medium transition-colors',
                twinType === t
                  ? 'bg-clinical-700 text-white border-clinical-700'
                  : 'bg-white text-surface-600 border-surface-300 hover:border-surface-400'
              )}
              onClick={() => setTwinType(t)}
            >
              {t === 'monozygotic' ? 'Monozygotic (MZ)' : 'Dizygotic (DZ)'}
            </button>
          ))}
        </div>
        <p className="text-2xs text-surface-400 mt-1">
          {twinType === 'monozygotic'
            ? 'MZ: identical twins, single zygote. Drawn with converging lines.'
            : 'DZ: fraternal twins, two zygotes. Drawn with diverging lines from a single point.'}
        </p>
      </div>

      {ind1Id === ind2Id && ind1Id !== '' && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle size={12} /> Select two different individuals.
        </p>
      )}

      {success && (
        <p className="text-xs text-emerald-600 font-medium">✓ Twin pair linked.</p>
      )}

      <button
        className="btn-primary btn w-full text-xs justify-center"
        onClick={handleLink}
        disabled={!canLink}
      >
        <Link2 size={12} />
        Link as {twinType === 'monozygotic' ? 'MZ' : 'DZ'} Twins
      </button>
    </div>
  );
}
