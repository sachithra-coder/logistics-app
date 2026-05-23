import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const STATUS_META = {
    pending:          { label: 'Pending',         cls: 'badge-pending' },
    assigned:         { label: 'Assigned',         cls: 'badge-assigned' },
    picked_up:        { label: 'Picked Up',        cls: 'badge-picked_up' },
    in_transit:       { label: 'In Transit',       cls: 'badge-in_transit' },
    out_for_delivery: { label: 'Out for Delivery', cls: 'badge-out_for_delivery' },
    delivered:        { label: 'Delivered',        cls: 'badge-delivered' },
    failed:           { label: 'Failed',           cls: 'badge-failed' },
    returned:         { label: 'Returned',         cls: 'badge-returned' },
};

export default function CustomerDashboard() {
    const { user } = useAuth();
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/shipments?limit=20')
            .then(r => setShipments(r.data.shipments || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const active    = shipments.filter(s => !['delivered','failed','returned'].includes(s.status)).length;
    const delivered = shipments.filter(s => s.status === 'delivered').length;
    const outNow    = shipments.filter(s => s.status === 'out_for_delivery').length;


    return(
        <div className='animate-fadeIn'>
            {/* banner */}
            <div style={{
                background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-700) 100%)',
                borderRadius: 'var(--radius-lg)', padding: '28px 32px', marginBottom: 24, position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position:'absolute', right:-40, top:-40, width:200, height:200, borderRadius:'50%', background:'rgba(240,165,0,0.08)' }} />
                <div style={{ position:'absolute', right:80, bottom:-60, width:150, height:150, borderRadius:'50%', background:'rgba(27,108,168,0.15)' }} />
                <h2 style={{ fontFamily:'var(--font-display)', color:'#fff', fontSize:22, marginBottom:6, position:'relative' }}>
                    Welcome back, {user?.name?.split(' ')[0]} 👋
                </h2>
                <p style={{ color:'rgba(255,255,255,0.5)', fontSize:14, marginBottom:20, position:'relative' }}>
                    Track your deliveries and manage shipment preferences from here.
                </p>
                <div style={{ display:'flex', gap:12, flexWrap:'wrap', position:'relative' }}>
                    <Link to="/customer/track" className="btn btn-accent btn-sm">📍 Track a shipment</Link>
                    <Link to="/customer/shipments" className="btn btn-ghost btn-sm" style={{ color:'rgba(255,255,255,0.7)', borderColor:'rgba(255,255,255,0.2)' }}>All shipments →</Link>
                </div>
            </div>

            {/* Stats */}
            <div className="stat-grid" style={{ marginBottom: 24 }}>
                {[
                    { icon:'📦', label:'Total shipments', value: shipments.length, color:'blue' },
                    { icon:'🚚', label:'Active',           value: active,           color:'amber' },
                    { icon:'🏃', label:'Out for delivery', value: outNow,           color:'green' },
                    { icon:'✅', label:'Delivered',        value: delivered,        color:'purple' },
                ].map(s => (
                <div key={s.label} className="stat-card">
                    <div className={`stat-icon ${s.color}`} style={{ fontSize:24 }}>{s.icon}</div>
                    <div>
                        <div className="stat-value">{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                </div>
                ))}
            </div>

            {/* Recent */}
            <div className="card">
                <div className="card-header">
                    <span className="card-title">Recent Shipments</span>
                    <Link to="/customer/shipments" style={{ fontSize:13, color:'var(--blue)', fontWeight:600 }}>View all →</Link>
                </div>
                {loading ? (
                    <div className="loading-center"><div className="spinner" /></div>
                ) : shipments.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <div className="empty-title">No shipments yet</div>
                        <div className="empty-sub">Your shipments will appear here once created by your dispatcher.</div>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>Tracking ID</th><th>Destination</th><th>Status</th><th>Updated</th><th></th></tr></thead>
                            <tbody>
                                {shipments.slice(0,8).map(s => {
                                const meta = STATUS_META[s.status] || { label: s.status, cls: '' };
                                return (
                                    <tr key={s._id}>
                                    <td><code style={{ fontSize:13, fontWeight:700, color:'var(--blue)', background:'rgba(27,108,168,0.08)', padding:'2px 8px', borderRadius:6 }}>{s.trackingId}</code></td>
                                    <td style={{ maxWidth:180 }}>
                                        <div style={{ fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.delivery?.address}</div>
                                        <div style={{ fontSize:12, color:'var(--text-muted)' }}>{s.delivery?.city}</div>
                                    </td>
                                    <td><span className={`badge ${meta.cls}`}>{meta.label}</span></td>
                                    <td style={{ fontSize:12, color:'var(--text-muted)', whiteSpace:'nowrap' }}>{formatDistanceToNow(new Date(s.updatedAt), { addSuffix:true })}</td>
                                    <td><Link to={`/customer/track?id=${s.trackingId}`} className="btn btn-ghost btn-sm">Track →</Link></td>
                                    </tr>
                                );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}