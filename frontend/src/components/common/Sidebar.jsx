import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_CONFIG = {
    customer: [
        { to: '/customer/dashboard', icon: '🏠', label: 'Dashboard' },
        { to: '/customer/track',     icon: '📍', label: 'Track Shipment' },
        { to: '/customer/shipments', icon: '📦', label: 'My Shipments' },
    ],
    dispatcher: [
        { to: '/dispatcher/dashboard', icon: '🗺️', label: 'Live Dashboard' },
        { to: '/dispatcher/shipments', icon: '📋', label: 'Manage Shipments' },
    ],
    driver: [
        { to: '/driver/dashboard', icon: '🚚', label: 'My Deliveries' },
    ],
    manager: [
        { to: '/manager/dashboard', icon: '📊', label: 'Reports & Analytics' },
    ],
};

const ROLE_COLORS = {
    customer:   'var(--accent)',
    dispatcher: 'var(--blue-light)',
    driver:     'var(--success)',
    manager:    '#a78bfa',
};

export default function Sidebar({ open, onClose, unreadCount = 0 }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const navItems = NAV_CONFIG[user?.role] || [];
    const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
    const roleColor = ROLE_COLORS[user?.role] || 'var(--blue)';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className={`sidebar${open ? ' open' : ''}`}>
        {/* Logo */}
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">🚚</div>
                <div className="sidebar-logo-text">Logi<span>Track</span></div>
                {/* Mobile close */}
                <button
                    onClick={onClose}
                    style={{
                        marginLeft: 'auto', background: 'none', border: 'none',
                        color: 'rgba(255,255,255,0.4)', fontSize: 20, cursor: 'pointer',
                        padding: '2px 6px', borderRadius: 6, display: 'none',
                }}
                    className="sidebar-close-btn"
                >✕</button>
            </div>

            {/* Role badge */}
            <div style={{ padding: '12px 20px 8px' }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'rgba(255,255,255,0.07)',
                    border: `1px solid ${roleColor}30`,
                    borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600,
                    color: roleColor,
                }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: roleColor, display: 'inline-block' }} />
                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} Portal
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <div className="nav-section-label">Navigation</div>
                {navItems.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                        onClick={onClose}
                    >
                        <span className="nav-item-icon">{item.icon}</span>
                        {item.label}
                        {item.badge && unreadCount > 0 && (
                            <span className="nav-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                        )}
                    </NavLink>
                ))}

                <div className="nav-section-label" style={{ marginTop: 8 }}>Account</div>
                <NavLink
                    to={`/${user?.role}/profile`}
                    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                    onClick={onClose}
                >
                    <span className="nav-item-icon">👤</span>
                    Profile
                </NavLink>
            </nav>

            {/* User footer */}
            <div className="sidebar-footer">
                <div className="sidebar-user" onClick={handleLogout} title="Sign out">
                    <div className="sidebar-avatar" style={{ background: `linear-gradient(135deg, ${roleColor}, var(--navy-600))` }}>
                        {initials}
                    </div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">{user?.name}</div>
                        <div className="sidebar-user-role">{user?.role} · Sign out</div>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>→</span>
                </div>
            </div>

            <style>{`
                @media (max-width: 900px) {
                .sidebar-close-btn { display: flex !important; }
                }
            `}</style>
        </aside>
    );
}
