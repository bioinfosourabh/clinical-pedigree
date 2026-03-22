/**
 * Case Persistence & Auth Store
 *
 * Frontend-only implementation using localStorage.
 * Architecture is designed for easy swap to a real backend:
 *   - replace localStorage calls with API calls
 *   - replace mock user with JWT/session
 *   - keep the same Zustand interface
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PedigreeCase } from '../domain/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SavedCase {
  id: string;
  name: string;
  /** Clinical indication / diagnosis — shown in case list */
  indication: string;
  inheritancePattern: string | null;
  individualCount: number;
  createdAt: string;
  updatedAt: string;
  /** Full serialized PedigreeCase */
  data: PedigreeCase;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'clinician' | 'geneticist' | 'researcher' | 'bioinformatician' | 'student';
  institution?: string;
  avatarInitials: string;
}

interface AppStore {
  // ── Auth ──────────────────────────────────────────────────────
  user: UserProfile | null;
  isAuthOpen: boolean;
  /** 'login' | 'profile' */
  authView: 'login' | 'profile';

  login: (name: string, email: string, role: UserProfile['role'], institution?: string) => void;
  logout: () => void;
  openAuth: (view?: 'login' | 'profile') => void;
  closeAuth: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;

  // ── Saved cases ────────────────────────────────────────────────
  savedCases: SavedCase[];
  activeSavedCaseId: string | null;

  saveCase: (pedigreeCase: PedigreeCase, name?: string) => SavedCase;
  updateSavedCase: (id: string, pedigreeCase: PedigreeCase) => void;
  deleteSavedCase: (id: string) => void;
  getSavedCase: (id: string) => SavedCase | undefined;
  setActiveSavedCaseId: (id: string | null) => void;

  // ── UI ────────────────────────────────────────────────────────
  isDashboardOpen: boolean;
  openDashboard: () => void;
  closeDashboard: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────

function makeInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function deriveCaseName(pc: PedigreeCase): string {
  const indication = pc.metadata.suspectedDiagnosis || pc.metadata.clinicalIndication;
  if (indication) return indication.slice(0, 60);
  const probandCount = Object.values(pc.individuals).filter(
    (i) => i.isProband
  ).length;
  if (probandCount) return `Pedigree — ${new Date().toLocaleDateString()}`;
  return `Untitled case — ${new Date().toLocaleDateString()}`;
}

// ─────────────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // ── Auth ────────────────────────────────────────────────────
      user: null,
      isAuthOpen: false,
      authView: 'login',

      login: (name, email, role, institution) => {
        const user: UserProfile = {
          id: crypto.randomUUID(),
          name,
          email,
          role,
          institution,
          avatarInitials: makeInitials(name),
        };
        set({ user, isAuthOpen: false });
      },

      logout: () => set({ user: null, activeSavedCaseId: null }),

      openAuth: (view = 'login') => set({ isAuthOpen: true, authView: view }),
      closeAuth: () => set({ isAuthOpen: false }),

      updateProfile: (updates) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, ...updates, avatarInitials: makeInitials(updates.name ?? state.user.name) }
            : null,
        })),

      // ── Saved cases ──────────────────────────────────────────────
      savedCases: [],
      activeSavedCaseId: null,

      saveCase: (pedigreeCase, name) => {
        const now = new Date().toISOString();
        const savedCase: SavedCase = {
          id: crypto.randomUUID(),
          name: name || deriveCaseName(pedigreeCase),
          indication: pedigreeCase.metadata.clinicalIndication?.slice(0, 80) ?? '',
          inheritancePattern: pedigreeCase.metadata.inheritancePattern ?? null,
          individualCount: Object.values(pedigreeCase.individuals).filter(
            (i) => !i.id.startsWith('unknown_')
          ).length,
          createdAt: now,
          updatedAt: now,
          data: pedigreeCase,
        };

        set((state) => ({
          savedCases: [savedCase, ...state.savedCases],
          activeSavedCaseId: savedCase.id,
        }));

        return savedCase;
      },

      updateSavedCase: (id, pedigreeCase) => {
        set((state) => ({
          savedCases: state.savedCases.map((sc) =>
            sc.id === id
              ? {
                  ...sc,
                  data: pedigreeCase,
                  individualCount: Object.values(pedigreeCase.individuals).filter(
                    (i) => !i.id.startsWith('unknown_')
                  ).length,
                  updatedAt: new Date().toISOString(),
                  indication: pedigreeCase.metadata.clinicalIndication?.slice(0, 80) ?? sc.indication,
                }
              : sc
          ),
        }));
      },

      deleteSavedCase: (id) =>
        set((state) => ({
          savedCases: state.savedCases.filter((sc) => sc.id !== id),
          activeSavedCaseId: state.activeSavedCaseId === id ? null : state.activeSavedCaseId,
        })),

      getSavedCase: (id) => get().savedCases.find((sc) => sc.id === id),

      setActiveSavedCaseId: (id) => set({ activeSavedCaseId: id }),

      // ── UI ──────────────────────────────────────────────────────
      isDashboardOpen: false,
      openDashboard: () => set({ isDashboardOpen: true }),
      closeDashboard: () => set({ isDashboardOpen: false }),
    }),
    {
      name: 'clinped-app-store',
      // Only persist user + savedCases, not transient UI state
      partialize: (state) => ({
        user: state.user,
        savedCases: state.savedCases,
        activeSavedCaseId: state.activeSavedCaseId,
      }),
    }
  )
);
