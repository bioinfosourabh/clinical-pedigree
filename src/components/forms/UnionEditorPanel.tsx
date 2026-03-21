import React, { useState } from 'react';
import { usePedigreeStore } from '../../hooks/usePedigreeStore';
import type { Union, RelationshipType } from '../../domain/types';
import { createUnion } from '../../domain/factories';
import {
  Heart,
  Link2,
  Unlink,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  AlertTriangle,
} from 'lucide-react';
import clsx from 'clsx';

export function UnionEditorPanel() {
  const { pedigreeCase, addUnion, updateUnion, removeUnion, addChildToUnion, removeChildFromUnion } =
    usePedigreeStore();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAddUnion, setShowAddUnion] = useState(false);

  const unions = Object.values(pedigreeCase.unions);
  const individuals = Object.values(pedigreeCase.individuals).filter(
    (i) => !i.id.startsWith('unknown_')
  );

  return (
    <div className="space-y-3">
      {/* Existing unions */}
      {unions.length === 0 && (
        <p className="text-xs text-surface-400 italic py-1">
          No partner relationships defined yet.
        </p>
      )}

      {unions.map((union) => (
        <UnionRow
          key={union.id}
          union={union}
          expanded={expanded === union.id}
          onToggle={() => setExpanded(expanded === union.id ? null : union.id)}
          onUpdate={(updates) => updateUnion(union.id, updates)}
          onRemove={() => removeUnion(union.id)}
          onAddChild={(cid) => addChildToUnion(union.id, cid)}
          onRemoveChild={(cid) => removeChildFromUnion(union.id, cid)}
          pedigreeCase={pedigreeCase}
        />
      ))}

      {/* Add new union */}
      {showAddUnion ? (
        <AddUnionForm
          individuals={individuals}
          onAdd={(u) => {
            addUnion(u);
            setShowAddUnion(false);
          }}
          onCancel={() => setShowAddUnion(false)}
        />
      ) : (
        <button
          className="btn-secondary btn w-full justify-center text-xs gap-1.5"
          onClick={() => setShowAddUnion(true)}
        >
          <Heart size={12} />
          Add Partner Relationship
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function UnionRow({
  union,
  expanded,
  onToggle,
  onUpdate,
  onRemove,
  onAddChild,
  onRemoveChild,
  pedigreeCase,
}: {
  union: Union;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<Union>) => void;
  onRemove: () => void;
  onAddChild: (childId: string) => void;
  onRemoveChild: (childId: string) => void;
  pedigreeCase: import('../../domain/types').PedigreeCase;
}) {
  const p1 = pedigreeCase.individuals[union.partner1Id];
  const p2 = pedigreeCase.individuals[union.partner2Id];

  const individuals = Object.values(pedigreeCase.individuals).filter(
    (i) => !i.id.startsWith('unknown_') && !union.childrenIds.includes(i.id)
  );

  const p1Label = p1 ? `${p1.label}${p1.firstName ? ` (${p1.firstName})` : ''}` : '?';
  const p2Label = p2 ? `${p2.label}${p2.firstName ? ` (${p2.firstName})` : ''}` : '?';

  return (
    <div className="panel overflow-hidden">
      {/* Row header */}
      <button
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-surface-50 transition-colors"
        onClick={onToggle}
      >
        <Heart size={12} className="text-surface-400 flex-shrink-0" />
        <span className="flex-1 text-xs font-medium text-surface-700 truncate">
          <span className="font-mono">{p1Label}</span>
          <span className="text-surface-400 mx-1.5">×</span>
          <span className="font-mono">{p2Label}</span>
        </span>
        {union.consanguineous && (
          <span className="badge badge-warning text-2xs">consang.</span>
        )}
        <span className="text-2xs text-surface-400 font-mono mr-1">
          {union.childrenIds.length} child{union.childrenIds.length !== 1 ? 'ren' : ''}
        </span>
        {expanded ? (
          <ChevronDown size={12} className="text-surface-400" />
        ) : (
          <ChevronRight size={12} className="text-surface-400" />
        )}
      </button>

      {/* Expanded editor */}
      {expanded && (
        <div className="border-t border-surface-200 p-3 space-y-3">
          {/* Relationship type */}
          <div>
            <label className="field-label">Relationship Type</label>
            <select
              className="field-select"
              value={union.relationshipType}
              onChange={(e) =>
                onUpdate({ relationshipType: e.target.value as RelationshipType })
              }
            >
              <option value="biological">Biological / Standard</option>
              <option value="consanguineous">Consanguineous</option>
              <option value="separated">Separated</option>
              <option value="divorced">Divorced</option>
              <option value="extramarital">Extramarital / Informal</option>
            </select>
          </div>

          {/* Consanguinity toggle */}
          <div className="flex items-center gap-2">
            <input
              id={`consang-${union.id}`}
              type="checkbox"
              className="rounded border-surface-300 text-clinical-600"
              checked={union.consanguineous}
              onChange={(e) => onUpdate({ consanguineous: e.target.checked })}
            />
            <label htmlFor={`consang-${union.id}`} className="text-xs text-surface-700 cursor-pointer">
              Consanguineous union (renders double horizontal line)
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="field-label">Union Notes</label>
            <textarea
              className="field-textarea min-h-[48px]"
              placeholder="Optional notes about this relationship…"
              value={union.notes ?? ''}
              onChange={(e) => onUpdate({ notes: e.target.value || undefined })}
            />
          </div>

          {/* Children */}
          <div>
            <label className="field-label">
              Children ({union.childrenIds.length})
            </label>
            <div className="space-y-1 mb-2">
              {union.childrenIds.map((cid) => {
                const child = pedigreeCase.individuals[cid];
                return (
                  <div
                    key={cid}
                    className="flex items-center gap-2 rounded bg-surface-50 px-2 py-1.5"
                  >
                    <span className="font-mono text-xs text-surface-600 flex-1">
                      {child?.label ?? cid}
                      {child?.firstName ? ` (${child.firstName})` : ''}
                    </span>
                    <button
                      className="text-surface-400 hover:text-red-500 transition-colors"
                      onClick={() => onRemoveChild(cid)}
                      title="Remove child from this union"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
              {union.childrenIds.length === 0 && (
                <p className="text-xs text-surface-400 italic">No children assigned.</p>
              )}
            </div>

            {/* Add child dropdown */}
            {individuals.length > 0 && (
              <select
                className="field-select text-xs"
                value=""
                onChange={(e) => {
                  if (e.target.value) onAddChild(e.target.value);
                }}
              >
                <option value="">+ Assign existing individual as child…</option>
                {individuals.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.label} {i.firstName ? `(${i.firstName})` : ''} — {i.sex}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Danger zone */}
          <div className="pt-1 border-t border-surface-100">
            <button
              className="btn-danger btn btn-sm gap-1.5"
              onClick={onRemove}
            >
              <Unlink size={12} />
              Remove Relationship
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function AddUnionForm({
  individuals,
  onAdd,
  onCancel,
}: {
  individuals: import('../../domain/types').Individual[];
  onAdd: (union: Union) => void;
  onCancel: () => void;
}) {
  const [p1Id, setP1Id] = useState('');
  const [p2Id, setP2Id] = useState('');
  const [consanguineous, setConsanguineous] = useState(false);
  const [relType, setRelType] = useState<RelationshipType>('biological');

  const canAdd = p1Id && p2Id && p1Id !== p2Id;

  const handleAdd = () => {
    if (!canAdd) return;
    const union = createUnion(p1Id, p2Id, {
      consanguineous,
      relationshipType: relType,
      childrenIds: [],
    });
    onAdd(union);
  };

  return (
    <div className="panel p-3 space-y-3">
      <p className="panel-title">New Relationship</p>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="field-label">Partner 1</label>
          <select
            className="field-select"
            value={p1Id}
            onChange={(e) => setP1Id(e.target.value)}
          >
            <option value="">— Select —</option>
            {individuals.map((i) => (
              <option key={i.id} value={i.id} disabled={i.id === p2Id}>
                {i.label} {i.firstName ? `(${i.firstName})` : ''} [{i.sex}]
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Partner 2</label>
          <select
            className="field-select"
            value={p2Id}
            onChange={(e) => setP2Id(e.target.value)}
          >
            <option value="">— Select —</option>
            {individuals.map((i) => (
              <option key={i.id} value={i.id} disabled={i.id === p1Id}>
                {i.label} {i.firstName ? `(${i.firstName})` : ''} [{i.sex}]
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="field-label">Relationship Type</label>
        <select
          className="field-select"
          value={relType}
          onChange={(e) => setRelType(e.target.value as RelationshipType)}
        >
          <option value="biological">Biological / Standard</option>
          <option value="consanguineous">Consanguineous</option>
          <option value="separated">Separated</option>
          <option value="divorced">Divorced</option>
          <option value="extramarital">Extramarital / Informal</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="new-consang"
          type="checkbox"
          className="rounded border-surface-300 text-clinical-600"
          checked={consanguineous}
          onChange={(e) => setConsanguineous(e.target.checked)}
        />
        <label htmlFor="new-consang" className="text-xs text-surface-700 cursor-pointer">
          Consanguineous union
        </label>
      </div>

      {p1Id === p2Id && p1Id !== '' && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle size={12} /> Partners must be different individuals.
        </p>
      )}

      <div className="flex gap-2">
        <button
          className="btn-primary btn flex-1 text-xs"
          onClick={handleAdd}
          disabled={!canAdd}
        >
          Create Relationship
        </button>
        <button className="btn-secondary btn text-xs px-3" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
