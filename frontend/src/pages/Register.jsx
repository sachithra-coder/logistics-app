import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleHome } from '../App';

const ROLES = [
  { value: 'customer',   label: 'Customer',   icon: '📦', desc: 'Track and manage your deliveries' },
  { value: 'driver',     label: 'Driver',     icon: '🚚', desc: 'View routes and update delivery status' },
  { value: 'dispatcher', label: 'Dispatcher', icon: '🗺️', desc: 'Assign deliveries and monitor fleet' },
  { value: 'manager',    label: 'Manager',    icon: '📊', desc: 'View reports and oversee operations' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = role, 2 = details
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const selectRole = (role) => { setForm(f => ({ ...f, role })); setStep(2); };

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError(''); setLoading(true);
    try {
      const user = await register({ name: form.name, email: form.email, password: form.password, role: form.role, phone: form.phone });
      navigate(getRoleHome(user.role));
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const selectedRole = ROLES.find(r => r.value === form.role);

  return (
    <div className="auth-shell">
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(240,165,0,0.08) 0%, transparent 70%)',
        top: -200, left: -100, pointerEvents: 'none'
      }} />

      <div className="auth-card" style={{ maxWidth: step === 1 ? 560 : 460 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">🚚</div>
          <div className="auth-logo-text">Logi<span>Track</span></div>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, alignItems: 'center' }}>
          {[1, 2].map(s => (
            <React.Fragment key={s}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                background: step >= s ? 'var(--blue)' : 'var(--border)',
                color: step >= s ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.25s',
              }}>{s}</div>
              {s < 2 && <div style={{ flex: 1, height: 2, background: step > s ? 'var(--blue)' : 'var(--border)', transition: 'background 0.25s', borderRadius: 2 }} />}
            </React.Fragment>
          ))}
        </div>

        {step === 1 ? (
          <>
            <h1 className="auth-title">Choose your role</h1>
            <p className="auth-sub">How will you use LogiTrack?</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {ROLES.map(role => (
                <button
                  key={role.value}
                  onClick={() => selectRole(role.value)}
                  style={{
                    padding: '20px 16px', border: '2px solid var(--border)',
                    borderRadius: 'var(--radius)', background: 'var(--bg)',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{role.icon}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{role.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{role.desc}</div>
                </button>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
              Already have an account? <Link to="/login" style={{ fontWeight: 600, color: 'var(--blue)' }}>Sign in</Link>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20, padding: '2px 4px', borderRadius: 6 }}>←</button>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(27,108,168,0.08)', padding: '6px 14px',
                borderRadius: 20, fontSize: 13, fontWeight: 600, color: 'var(--blue)',
              }}>
                <span>{selectedRole?.icon}</span> {selectedRole?.label}
              </div>
            </div>

            <h1 className="auth-title">Create account</h1>
            <p className="auth-sub" style={{ marginBottom: 24 }}>Fill in your details to get started</p>

            {error && <div className="alert alert-error">⚠️ {error}</div>}

            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Full name</label>
                <input className="form-control" type="text" name="name" placeholder="John Smith"
                  value={form.name} onChange={handle} required autoComplete="name" />
              </div>
              <div className="form-group">
                <label className="form-label">Email address</label>
                <input className="form-control" type="email" name="email" placeholder="you@example.com"
                  value={form.email} onChange={handle} required autoComplete="email" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
                <input className="form-control" type="tel" name="phone" placeholder="+1 234 567 8900"
                  value={form.phone} onChange={handle} autoComplete="tel" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-control" type="password" name="password" placeholder="••••••••"
                    value={form.password} onChange={handle} required autoComplete="new-password" />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm password</label>
                  <input className="form-control" type="password" name="confirm" placeholder="••••••••"
                    value={form.confirm} onChange={handle} required autoComplete="new-password" />
                </div>
              </div>

              <button className="btn btn-primary btn-lg" type="submit" disabled={loading}
                style={{ width: '100%', marginTop: 4 }}>
                {loading
                  ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Creating account…</>
                  : 'Create account →'
                }
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
              Already have an account? <Link to="/login" style={{ fontWeight: 600, color: 'var(--blue)' }}>Sign in</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
