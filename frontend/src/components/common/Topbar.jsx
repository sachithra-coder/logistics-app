import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { formatDistanceToNow } from 'date-fns';

const PAGE_TITLES = {
  '/customer/dashboard':    { title: 'Dashboard',           icon: '🏠' },
  '/customer/track':        { title: 'Track Shipment',      icon: '📍' },
  '/customer/shipments':    { title: 'My Shipments',        icon: '📦' },
  '/dispatcher/dashboard':  { title: 'Live Dashboard',      icon: '🗺️' },
  '/dispatcher/shipments':  { title: 'Manage Shipments',    icon: '📋' },
  '/driver/dashboard':      { title: 'My Deliveries',       icon: '🚚' },
  '/manager/dashboard':     { title: 'Reports & Analytics', icon: '📊' },
  '/customer/profile':      { title: 'My Profile',          icon: '👤' },
  '/dispatcher/profile':    { title: 'My Profile',          icon: '👤' },
  '/driver/profile':        { title: 'My Profile',          icon: '👤' },
  '/manager/profile':       { title: 'My Profile',          icon: '👤' },
};

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef(null);

  const pageInfo = PAGE_TITLES[location.pathname] || { title: 'LogiTrack', icon: '🚚' };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnread(res.data.unread || 0);
    } catch {}
  };

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(ns => ns.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnread(u => Math.max(0, u - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(ns => ns.map(n => ({ ...n, isRead: true })));
      setUnread(0);
    } catch {}
  };

  // Close notif panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const timeAgo = (date) => {
    try { return formatDistanceToNow(new Date(date), { addSuffix: true }); }
    catch { return ''; }
  };

  return (
    <header className="topbar">
      <button className="hamburger" onClick={onMenuClick} aria-label="Open menu">☰</button>

      <div className="topbar-title">
        <span style={{ marginRight: 8 }}>{pageInfo.icon}</span>
        {pageInfo.title}
      </div>

      {/* Greeting on desktop */}
      <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'none' }} className="topbar-greeting">
        Hi, {user?.name?.split(' ')[0]}
      </div>

      {/* Notification bell */}
      <div style={{ position: 'relative' }} ref={notifRef}>
        <button
          className="notif-btn"
          onClick={() => setShowNotif(s => !s)}
          aria-label="Notifications"
        >
          🔔
          {unread > 0 && (
            <span className="notif-count">{unread > 9 ? '9+' : unread}</span>
          )}
        </button>

        {showNotif && (
          <div className="notif-panel">
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>
                Notifications
              </span>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}
                >
                  Mark all read
                </button>
              )}
            </div>

            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '32px 18px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
                  No notifications yet
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n._id}
                    className={`notif-item${!n.isRead ? ' unread' : ''}`}
                    onClick={() => markRead(n._id)}
                  >
                    <div className="notif-title">
                      {!n.isRead && <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)', marginRight: 6, verticalAlign: 'middle' }} />}
                      {n.title}
                    </div>
                    <div className="notif-msg">{n.message}</div>
                    <div className="notif-time">{timeAgo(n.sentAt || n.createdAt)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 900px) {
          .topbar-greeting { display: block !important; }
        }
      `}</style>
    </header>
  );
}
