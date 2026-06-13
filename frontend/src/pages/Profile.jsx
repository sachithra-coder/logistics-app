import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Profile() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    emailNotif: user?.notificationPreferences?.email ?? true,
    smsNotif: user?.notificationPreferences?.sms ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const handle = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [e.target.name]: val }));
  };

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setMsg(null);
    try {
      await api.put('/auth/profile', {
        name: form.name, phone: form.phone,
        notificationPreferences: { email: form.emailNotif, sms: form.smsNotif },
      });
      setMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch {
      setMsg({ type: 'error', text: 'Failed to update profile.' });
    } finally { setSaving(false); }
  };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="card card-padded" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--blue), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 700, color: '#fff',
            flexShrink: 0,
          }}>{initials}</div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 4 }}>{user?.name}</h2>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{user?.email}</div>
            <div style={{
              display: 'inline-block', marginTop: 6,
              background: 'rgba(27,108,168,0.08)', color: 'var(--blue)',
              padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              textTransform: 'capitalize',
            }}>{user?.role}</div>
          </div>
        </div>

        {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Full name</label>
            <input className="form-control" name="name" value={form.name} onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input className="form-control" value={user?.email} disabled style={{ opacity: 0.6 }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Email cannot be changed</span>
          </div>
          <div className="form-group">
            <label className="form-label">Phone number</label>
            <input className="form-control" name="phone" type="tel" value={form.phone} onChange={handle} placeholder="+1 234 567 8900" />
          </div>

          <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 14, fontSize: 14 }}>
              Notification preferences
            </div>
            {[
              { name: 'emailNotif', label: 'Email notifications', desc: 'Receive shipment updates by email', icon: '📧' },
              { name: 'smsNotif', label: 'SMS notifications', desc: 'Receive shipment updates by text message', icon: '💬' },
            ].map(pref => (
              <label key={pref.name} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '10px 0', borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
              }}>
                <input type="checkbox" name={pref.name} checked={form[pref.name]} onChange={handle}
                  style={{ width: 18, height: 18, accentColor: 'var(--blue)', cursor: 'pointer' }} />
                <span style={{ fontSize: 20 }}>{pref.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{pref.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pref.desc}</div>
                </div>
              </label>
            ))}
          </div>

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Account info */}
      <div className="card card-padded">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, marginBottom: 16 }}>Account information</h3>
        {[
          { label: 'Account ID', value: user?._id?.slice(-8).toUpperCase() },
          { label: 'Member since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'N/A' },
          { label: 'Role', value: user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) },
        ].map(row => (
          <div key={row.label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 14,
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
            <span style={{ fontWeight: 600 }}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
