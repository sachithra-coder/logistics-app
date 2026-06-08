import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleHome } from '../App';

export default function NotFound() {
  const { user } = useAuth();
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-800) 100%)',
      color: '#fff', textAlign: 'center', padding: 24,
    }}>
      <div style={{ fontSize: 80, marginBottom: 16, lineHeight: 1 }}>🚚</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 64, fontWeight: 800, margin: '0 0 8px', color: 'var(--accent)' }}>404</h1>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Package not found</h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32, maxWidth: 360 }}>
        Looks like this delivery got lost in transit. The page you're looking for doesn't exist.
      </p>
      <Link
        to={user ? getRoleHome(user.role) : '/login'}
        style={{
          background: 'linear-gradient(135deg, var(--blue), var(--blue-light))',
          color: '#fff', padding: '12px 28px', borderRadius: 'var(--radius)',
          fontWeight: 700, fontSize: 15, textDecoration: 'none',
          boxShadow: '0 4px 20px rgba(27,108,168,0.4)',
        }}
      >
        {user ? '← Back to Dashboard' : '← Go to Login'}
      </Link>
    </div>
  );
}
