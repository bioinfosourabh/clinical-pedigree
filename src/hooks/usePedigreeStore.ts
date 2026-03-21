/**
 * Global application state using Zustand.
 *
 * Keeps PedigreeCase + UI state together but logically separated.
 * All mutations go through the pure domain/operations functions,
 * then the result replaces the pedigreeCase in store.
 */

import { create } from 'zustand';
import type {
  PedigreeCase,
  Individual,
  Union,
  AppUIState,
  InheritancePattern,
} from '../domain/types';
import {
  addIndividual,
  updateIndividual,
  removeIndividual,
  addUnion,
  updateUnion,
  removeUnion,
  addChildToUnion,
  removeChildFromUnion,
  linkPartners,
  setProband,
} from '../domain/operations';
import { DEFAULT_SAMPLE_CASE } from '../data/sampleCases';

// ─────────────────────────────────────────────────────────────────────────────

interface PedigreeStore {
  pedigreeCase: PedigreeCase;
  ui: AppUIState;

  // ── Case-level actions ──────────────────────────────────────────────────
  loadCase: (pedigreeCase: PedigreeCase) => void;
  resetCase: () => void;
  updateMetadata: (updates: Partial<PedigreeCase['metadata']>) => void;

  // ── Individual actions ──────────────────────────────────────────────────
  addIndividual: (individual: Individual) => void;
  updateIndividual: (id: string, updates: Partial<Individual>) => void;
  removeIndividual: (id: string) => void;
  setProband: (id: string) => void;

  // ── Union actions ───────────────────────────────────────────────────────
  addUnion: (union: Union) => void;
  updateUnion: (id: string, updates: Partial<Union>) => void;
  removeUnion: (id: string) => void;
  linkPartners: (
    partner1Id: string,
    partner2Id: string,
    childIds?: string[],
    options?: Partial<Union>
  ) => void;
  addChildToUnion: (unionId: string, childId: string) => void;
  removeChildFromUnion: (unionId: string, childId: string) => void;

  // ── UI actions ──────────────────────────────────────────────────────────
  selectIndividual: (id: string | null) => void;
  selectUnion: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  openEditor: () => void;
  closeEditor: () => void;
  setActivePanel: (panel: AppUIState['activePanel']) => void;
}

const defaultUI: AppUIState = {
  selectedIndividualId: null,
  selectedUnionId: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  editorOpen: false,
  activePanel: 'pedigree',
};

export const usePedigreeStore = create<PedigreeStore>((set, get) => ({
  pedigreeCase: DEFAULT_SAMPLE_CASE,
  ui: defaultUI,

  // ── Case-level ────────────────────────────────────────────────────────

  loadCase: (pedigreeCase) => set({ pedigreeCase, ui: defaultUI }),

  resetCase: () =>
    set({ pedigreeCase: DEFAULT_SAMPLE_CASE, ui: defaultUI }),

  updateMetadata: (updates) =>
    set((state) => ({
      pedigreeCase: {
        ...state.pedigreeCase,
        metadata: {
          ...state.pedigreeCase.metadata,
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      },
    })),

  // ── Individual ────────────────────────────────────────────────────────

  addIndividual: (individual) =>
    set((state) => ({
      pedigreeCase: addIndividual(state.pedigreeCase, individual),
    })),

  updateIndividual: (id, updates) =>
    set((state) => ({
      pedigreeCase: updateIndividual(state.pedigreeCase, id, updates),
    })),

  removeIndividual: (id) =>
    set((state) => ({
      pedigreeCase: removeIndividual(state.pedigreeCase, id),
      ui:
        state.ui.selectedIndividualId === id
          ? { ...state.ui, selectedIndividualId: null, editorOpen: false }
          : state.ui,
    })),

  setProband: (id) =>
    set((state) => ({
      pedigreeCase: setProband(state.pedigreeCase, id),
    })),

  // ── Union ─────────────────────────────────────────────────────────────

  addUnion: (union) =>
    set((state) => ({
      pedigreeCase: addUnion(state.pedigreeCase, union),
    })),

  updateUnion: (id, updates) =>
    set((state) => ({
      pedigreeCase: updateUnion(state.pedigreeCase, id, updates),
    })),

  removeUnion: (id) =>
    set((state) => ({
      pedigreeCase: removeUnion(state.pedigreeCase, id),
    })),

  linkPartners: (partner1Id, partner2Id, childIds = [], options = {}) =>
    set((state) => ({
      pedigreeCase: linkPartners(
        state.pedigreeCase,
        partner1Id,
        partner2Id,
        childIds,
        options
      ),
    })),

  addChildToUnion: (unionId, childId) =>
    set((state) => ({
      pedigreeCase: addChildToUnion(state.pedigreeCase, unionId, childId),
    })),

  removeChildFromUnion: (unionId, childId) =>
    set((state) => ({
      pedigreeCase: removeChildFromUnion(state.pedigreeCase, unionId, childId),
    })),

  // ── UI ────────────────────────────────────────────────────────────────

  selectIndividual: (id) =>
    set((state) => ({
      ui: {
        ...state.ui,
        selectedIndividualId: id,
        selectedUnionId: null,
        editorOpen: id !== null,
      },
    })),

  selectUnion: (id) =>
    set((state) => ({
      ui: {
        ...state.ui,
        selectedUnionId: id,
        selectedIndividualId: null,
        editorOpen: false,
      },
    })),

  setZoom: (zoom) =>
    set((state) => ({ ui: { ...state.ui, zoom: Math.max(0.2, Math.min(3, zoom)) } })),

  setPan: (panX, panY) =>
    set((state) => ({ ui: { ...state.ui, panX, panY } })),

  openEditor: () =>
    set((state) => ({ ui: { ...state.ui, editorOpen: true } })),

  closeEditor: () =>
    set((state) => ({ ui: { ...state.ui, editorOpen: false } })),

  setActivePanel: (panel) =>
    set((state) => ({ ui: { ...state.ui, activePanel: panel } })),
}));
