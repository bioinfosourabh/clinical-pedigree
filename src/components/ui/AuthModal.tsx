import React, { useState } from 'react';
import { useAppStore } from '../../hooks/useAppStore';
import { X, User, Building2, Stethoscope } from 'lucide-react';
import type { UserProfile } from '../../hooks/useAppStore';

type Role = UserProfile['role'];

const ROLES: Array<{ value: Role; label: string }> = [
  { value: 'clinician',         label: 'Clinician / Physician' },
  { value: 'geneticist',        label: 'Clinical Geneticist' },
  { value: 'researcher',        label: 'Clinical Researcher' },
  { value: 'bioinformatician',  label: 'Bioinformatician' },
  { value: 'student',           label: 'Student / Trainee' },
];

export function AuthModal({ view }: { view: 'login' | 'profile' }) {
  const { user, closeAuth, login, logout, updateProfile } = useAppStore();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [role, setRole] = useState<Role>(user?.role ?? 'clinician');
  const [institution, setInstitution] = useState(user?.institution ?? '');

  const handleSubmit = () => {
    if (!name.trim() || !email.trim()) return;
    if (view === 'login') {
      login(name.trim(), email.trim(), role, institution.trim() || undefined);
    } else {
      updateProfile({ name: name.trim(), email: email.trim(), role, institution: institution.trim() || undefined });
      closeAuth();
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(17,20,24,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(2px)',
    }}
      onClick={(e) => { if (e.target === e.currentTarget) closeAuth(); }}
    >
      <div style={{
        width: '400px', background: '#fff', borderRadius: '14px',
        boxShadow: '0 24px 48px rgb(0 0 0 / 0.18), 0 4px 12px rgb(0 0 0 / 0.08)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 16px', borderBottom: '1px solid #e4e8ed',
        }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111418', margin: 0 }}>
              {view === 'login' ? 'Sign in to ClinPed' : 'Your Profile'}
            </h2>
            <p style={{ fontSize: '12px', color: '#8b92a0', marginTop: '2px' }}>
              {view === 'login'
                ? 'Cases are saved locally in your browser'
                : 'Update your clinical profile'}
            </p>
          </div>
          <button onClick={closeAuth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b92a0', padding: '4px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Field label="Full name">
            <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Sarah Chen" />
          </Field>
          <Field label="Email">
            <input className="field-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="s.chen@hospital.org" />
          </Field>
          <Field label="Role">
            <select className="field-select" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </Field>
          <Field label="Institution (optional)">
            <input className="field-input" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Hospital / university / lab" />
          </Field>

          <button
            className="btn-primary btn"
            style={{ width: '100%', justifyContent: 'center', height: '38px', fontSize: '13.5px' }}
            onClick={handleSubmit}
            disabled={!name.trim() || !email.trim()}
          >
            {view === 'login' ? 'Continue' : 'Save Changes'}
          </button>

          {view === 'profile' && user && (
            <button
              onClick={() => { logout(); closeAuth(); }}
              style={{
                width: '100%', background: 'none', border: '1px solid #e4e8ed',
                borderRadius: '8px', padding: '8px', fontSize: '12.5px',
                color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}
