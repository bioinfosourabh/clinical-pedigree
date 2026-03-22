import React, { useEffect } from 'react';
import { AppHeader } from './components/ui/AppHeader';
import { MainWorkspace } from './components/ui/MainWorkspace';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { usePedigreeStore } from './hooks/usePedigreeStore';
import { useAppStore } from './hooks/useAppStore';

export default function App() {
  useKeyboardShortcuts();

  const { pedigreeCase } = usePedigreeStore();
  const { saveCase, activeSavedCaseId, updateSavedCase } = useAppStore();

  // Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const hasIndividuals = Object.keys(pedigreeCase.individuals).length > 0;
        if (!hasIndividuals) return;
        if (activeSavedCaseId) {
          updateSavedCase(activeSavedCaseId, pedigreeCase);
        } else {
          saveCase(pedigreeCase);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pedigreeCase, activeSavedCaseId, saveCase, updateSavedCase]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#f5f6f8' }}>
      <AppHeader />
      <MainWorkspace />
    </div>
  );
}
