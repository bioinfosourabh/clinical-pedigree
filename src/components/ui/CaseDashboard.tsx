import React from 'react';
import { useAppStore } from '../../hooks/useAppStore';
import { usePedigreeStore } from '../../hooks/usePedigreeStore';
import {
  X, FolderOpen, Trash2, Clock, Users, ArrowRight, Plus, LogIn,
} from 'lucide-react';

export function CaseDashboard() {
  const { user, savedCases, deleteSavedCase, closeDashboard, openAuth, activeSavedCaseId, setActiveSavedCaseId } = useAppStore();
  const { loadCase } = usePedigreeStore();

  const handleLoad = (id: string) => {
    const sc = savedCases.find((c) => c.id === id);
    if (sc) {
      loadCase(sc.data);
      setActiveSavedCaseId(id);
      closeDashboard();
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const INHERITANCE_LABELS: Record<string, string> = {
    autosomal_dominant: 'AD',
    autosomal_recessive: 'AR',
    x_linked_dominant: 'XLD',
    x_linked_recessive: 'XLR',
    mitochondrial: 'Mito',
    de_novo: 'de novo',
    digenic: 'Digenic',
    multifactorial: 'MF',
    unknown: '?',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(17,20,24,0.45)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '56px',
        backdropFilter: 'blur(2px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) closeDashboard(); }}
    >
      <div style={{
        width: '640px', maxHeight: '80vh',
        background: '#fff', borderRadius: '14px',
        boxShadow: '0 24px 48px rgb(0 0 0 / 0.16)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 16px', borderBottom: '1px solid #e4e8ed',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111418', margin: 0 }}>
              {user ? `${user.name}'s Cases` : 'Saved Cases'}
            </h2>
            <p style={{ fontSize: '12px', color: '#8b92a0', marginTop: '2px' }}>
              {user?.institution && `${user.institution} · `}
              {savedCases.length} case{savedCases.length !== 1 ? 's' : ''} saved locally
            </p>
          </div>
          <button onClick={closeDashboard} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b92a0', padding: '4px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {!user && (
            <div style={{
              background: '#eff6ff', border: '1px solid #bfdbfe',
              borderRadius: '10px', padding: '16px', marginBottom: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '500', color: '#1e40af', margin: 0 }}>Sign in to personalise your workspace</p>
                <p style={{ fontSize: '12px', color: '#3b82f6', marginTop: '3px' }}>Cases are saved in your browser regardless</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => { closeDashboard(); openAuth('login'); }} style={{ gap: '5px' }}>
                <LogIn size={12} /> Sign in
              </button>
            </div>
          )}

          {savedCases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#8b92a0' }}>
              <FolderOpen size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ fontSize: '14px', fontWeight: '500' }}>No saved cases yet</p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>Generate a pedigree and click Save to store it here</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {savedCases.map((sc) => (
                <div
                  key={sc.id}
                  style={{
                    display: 'flex', alignItems: 'center',
                    padding: '12px 14px', borderRadius: '10px',
                    border: `1px solid ${sc.id === activeSavedCaseId ? '#bfdbfe' : '#e4e8ed'}`,
                    background: sc.id === activeSavedCaseId ? '#eff6ff' : '#fff',
                    transition: 'border-color 0.12s, background 0.12s',
                  }}
                  onMouseOver={(e) => {
                    if (sc.id !== activeSavedCaseId) {
                      (e.currentTarget as HTMLElement).style.borderColor = '#ccd1d9';
                      (e.currentTarget as HTMLElement).style.background = '#fafbfc';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (sc.id !== activeSavedCaseId) {
                      (e.currentTarget as HTMLElement).style.borderColor = '#e4e8ed';
                      (e.currentTarget as HTMLElement).style.background = '#fff';
                    }
                  }}
                >
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#111418', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sc.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                      {sc.inheritancePattern && (
                        <span style={{
                          fontSize: '10.5px', fontWeight: '600',
                          background: '#f1f5f9', color: '#475569',
                          borderRadius: '4px', padding: '1px 6px',
                        }}>
                          {INHERITANCE_LABELS[sc.inheritancePattern] ?? sc.inheritancePattern}
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11.5px', color: '#8b92a0' }}>
                        <Users size={11} /> {sc.individualCount}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11.5px', color: '#8b92a0' }}>
                        <Clock size={11} /> {formatDate(sc.updatedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '12px', flexShrink: 0 }}>
                    <button
                      onClick={() => handleLoad(sc.id)}
                      className="btn btn-primary btn-xs"
                      style={{ gap: '4px' }}
                    >
                      Open <ArrowRight size={11} />
                    </button>
                    <button
                      onClick={() => deleteSavedCase(sc.id)}
                      className="btn btn-ghost btn-xs"
                      style={{ color: '#dc2626' }}
                      title="Delete case"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
