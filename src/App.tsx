import React from 'react';
import { AppHeader } from './components/ui/AppHeader';
import { MainWorkspace } from './components/ui/MainWorkspace';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export default function App() {
  useKeyboardShortcuts();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[--color-bg]">
      <AppHeader />
      <MainWorkspace />
    </div>
  );
}
