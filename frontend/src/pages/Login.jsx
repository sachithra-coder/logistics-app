import React, { use, useState} from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleHome } from '../App';
import api from "../utils/api";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({email: '', passwaord: ''});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [seeding, setSeeding] = useState(false);

    const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const user = await login(form.email, form.passwaord);
            navigate(getRoleHome(user.role));
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Check your credentials.');
        } finally { setLoading(false); }
    };

    const fillDemo = (email) => setForm({ email, passwaord: 'demo1234' });

    const seedAndLogin = async (email) => {
        setSeeding(true); setError('');
        try {
            await api.post('auth/seed');
            await new Promise(r => setTimeout(r, 400));
            const user = await login(email, 'demo1234');
            navigate(getRoleHome(user.role));
        } catch (err) {
            setError('Could not connect to the server. Make sure the backend is running.');
        } finally { setSeeding(false); }
    };

    const demoAccounts = [
        { role: 'Manager', email: 'manager@demo.com', icon: '📊', color: '#7c3aed' },
        { role: 'Dispatcher', emial: 'dispatcher@demo.com', icon: '🗺️', color: 'var(--blue)' },
        { role: 'Driver', email: 'driver@demo.com', icon: '🚚', color: 'var(--success)' },
        { role: 'Customer', email: 'customer@demo.com', icon: '📦', color: 'var(--accent)' }
    ];

    return (
        <div className="auth-shell">
            {/* Decorative blob */}
            <div style={{
                position: 'absolute', width: 500, height: 500, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(240,165,0,0.1) 0%, transaparent 70%)',
                top: -100, right: -100, pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute', width: 300, height: 300, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(240,165,0,0.1) 0%, transparent 70%)',
                bottom: 50, left: 50, pointerEvents: 'none'
            }} />

            <div className="auth-card">
                {/* Logo */}
                <div className="auth-logo">
                    <div className="auth-logo-icon">🚚</div>
                    <div className="auth-logo-text">Logi<span>Track</span></div>
                </div>

                <h1 className="auth-title">Welcome back</h1>
                <p className="auth-sub">Sign in to your account to continue</p>

                { error && <div className="alert alert-error"> ⚠️ {error}</div>}

                <form onSubmit={submit}>
                    <div className="form-group">
                        <label className="form-label">Email address</label>
                        <input
                            className="form-control"
                            type="email" name="email"
                            placeholder="you@example.com"
                            value={form.email} onChange={handle} required
                            autoComplete="email"
                        />
                    </div>
                    <div className="form-group">
                        <lable className="form-label">Password</lable>
                        <input
                            className="form-control"
                            type="password" name="password"
                            placeholder="*********"
                            value={form.passwaord} onChange={handle} required
                            autoComplete="current-password"
                        />
                    </div>

                    <div style={{ textAlign: 'right', marginBottom: 24 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        Demo password: <code style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>demo1234</code>
                        </span>
                    </div>

                    <button className="btn btn-primary btn-lg" type="submit" disabled={loading}
                        style={{ width: '100%' }}>
                        {loading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in…</> : 'Sign in →'}
                    </button>
                </form>

                <div style={{ textAlign: 'center' , marginTop: 20, fontSize: 14, color: 'var(--text-secondary' }}>
                    No account?{' '}
                    <Link to="/register" style={{ fontWeight: 600, color: 'var(--blue)' }}>
                        Create one
                    </Link>
                </div>

                {/* Demo accounts */}
                <div style={{ marginTop: 32 }}>
                    <div style={{ 
                        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16
                    }}>
                        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                        <span style={{ fontSize: 12, color: 'var(--text-muted', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8em' }}>
                            Quick demo login
                        </span>
                        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    </div>

                </div>
            </div>
        </div>
    )

}