/**
 * useKeyboardShortcuts
 *
 * Global keyboard shortcut handler. Registered on document in the
 * root App component. Shortcuts are clinical-workflow oriented.
 *
 * Shortcuts:
 *   Escape        — deselect / close editor
 *   Ctrl+Z        — undo (future: history)
 *   Ctrl+E        — export SVG
 *   Ctrl+P        — print
 *   Ctrl+Shift+V  — jump to Validation tab (via store)
 *   +/-           — zoom in / zoom out
 */

import { useEffect } from 'react';
import { usePedigreeStore } from './usePedigreeStore';
import { exportSVG, printPedigree } from '../utils/exportEngine';

export function useKeyboardShortcuts() {
  const store = usePedigreeStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      const isEditing = tag === 'input' || tag === 'textarea' || tag === 'select';

      // Escape — deselect
      if (e.key === 'Escape') {
        store.selectIndividual(null);
        store.closeEditor();
        return;
      }

      // Don't fire other shortcuts while typing in a form field
      if (isEditing) return;

      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+E — export SVG
      if (ctrl && e.key === 'e') {
        e.preventDefault();
        exportSVG(store.pedigreeCase.metadata.caseId);
        return;
      }

      // Ctrl+P — print
      if (ctrl && e.key === 'p') {
        e.preventDefault();
        printPedigree(store.pedigreeCase);
        return;
      }

      // + / = — zoom in
      if (!ctrl && (e.key === '+' || e.key === '=')) {
        store.setZoom(store.ui.zoom + 0.15);
        return;
      }

      // - — zoom out
      if (!ctrl && e.key === '-') {
        store.setZoom(store.ui.zoom - 0.15);
        return;
      }

      // 0 — reset zoom
      if (!ctrl && e.key === '0') {
        store.setZoom(1);
        store.setPan(0, 0);
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [store]);
}
