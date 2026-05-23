import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { io } from 'socket.io-client';
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

// Customer search component
function CustomerSearch({ value, onChange}) {
    const [query, setQuery]       = useState('');
    const [results, setResults]   = useState([]);
    const [searching, setSearching] = useState(false);
    const [showDrop, setShowDrop] = useState(false);
    const debounceRef = useRef(null);

    const search = (q) => {
        setQuery(q);
        if (value) onChange(null); // clear selection when typing again
        if (!q.trim()) { 
            setResults([]); 
            setShowDrop(false); 
            return; 
        }
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await api.get(`/auth/customers?q=${encodeURIComponent(q)}`);
                setResults(res.data.customers || []);
                setShowDrop(true);
            } catch { 
                setResults([]); 
            }
            finally { 
                setSearching(false); 
            }
        }, 400);
    };

    const select = (customer) => {
        onChange(customer);
        setQuery(customer.name + ' — ' + customer.email);
        setShowDrop(false);
    };

    return (
        <div style={{ position: 'relative'}}>
            <input
                className="form-control"
                placeholder="Search by name or email…"
                value={query}
                onChange={e => search(e.target.value)}
                onFocus={() => results.length > 0 && setShowDrop(true)}
                autoComplete="off"
            />
            {searching && (
                <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                    <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                </div>
            )}
            {showDrop && results.length > 0 && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-lg)',
                    maxHeight: 200, overflowY: 'auto', marginTop: 4,
                }}>
                    {results.map(c => (
                        <div key={c._id}
                            onClick={() => select(c)}
                            style={{
                                padding: '10px 14px', cursor: 'pointer', fontSize: 14,
                                borderBottom: '1px solid var(--border)', transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{ fontWeight: 600 }}>{c.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.email} · {c.phone || 'No phone'}</div>
                        </div>
                    ))}
                </div>
            )}
            {showDrop && results.length === 0 && !searching && query.length > 1 && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow)', marginTop: 4,
                    padding: '12px 14px', fontSize: 13, color: 'var(--text-muted)',
                }}>
                    No customers found. Ask them to register first.
                </div>
            )}
            {value && (
                <div style={{
                    marginTop: 8, padding: '8px 12px',
                    background: 'rgba(6,214,160,0.08)', border: '1px solid rgba(6,214,160,0.2)',
                    borderRadius: 'var(--radius-sm)', fontSize: 13,
                    display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    <span style={{ color: 'var(--success)', fontSize: 16 }}>✓</span>
                    <div>
                        <span style={{ fontWeight: 700 }}>{value.name}</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>{value.email}</span>
                    </div>
                    <button onClick={() => { onChange(null); setQuery(''); }}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}>✕</button>
                </div>
            )}
        </div>
    );
}

// Main dashboard
export default function DispatcherDashboard(){
    const [shipments, setShipments]   = useState([]);
    const [drivers, setDrivers]       = useState([]);
    const [loading, setLoading]       = useState(true);
    const [selected, setSelected]     = useState(null);
    const [showNew, setShowNew]       = useState(false);
    const [filter, setFilter]         = useState('pending');
    const [driverLocs, setDriverLocs] = useState({});
    const [toast, setToast]           = useState('');
    const socketRef = useRef(null);

    const load = async () => {
        setLoading(true);
        try {
          const [sRes, dRes] = await Promise.all([
            api.get('/shipments?limit=50'),
            api.get('/drivers'),
          ]);
          setShipments(sRes.data.shipments || []);
          setDrivers(dRes.data.drivers || []);
        } catch {}
        setLoading(false);
    };

    useEffect(() => {
        load();
        const socket = io(process.env.REACT_APP_SOCKET_URL || window.location.origin);
        socketRef.current = socket;
        socket.emit('join_role', 'dispatcher');
        socket.on('driver_location_update', data => {
          setDriverLocs(prev => ({ ...prev, [data.driverId]: { lat: data.lat, lng: data.lng, name: data.driverName } }));
        });
        socket.on('delivery_status_changed', () => load());
        return () => socket.disconnect();
    }, []);

    const showToast = (msg) => { 
        setToast(msg); 
        setTimeout(() => setToast(''), 3500); 
    };
    const onAssigned = () => { 
        setSelected(null); 
        load(); 
        showToast('✅ Driver assigned successfully.'); 
    };
    const onCreated  = () => { 
        setShowNew(false); 
        load(); showToast('✅ Shipment created successfully.'); 
    };

    const unassign = async (shipmentId) => {
        if (!window.confirm('Unassign this driver?')) return;
        try { 
            await api.delete(`/assignments/${shipmentId}`); 
            load(); 
            showToast('Driver unassigned.'); 
        } catch {}
    };

    const filters = [
        { key: 'all',      label: 'All' },
        { key: 'pending',  label: 'Pending' },
        { key: 'assigned', label: 'Assigned' },
        { key: 'active',   label: 'In Transit' },
        { key: 'done',     label: 'Completed' },
    ];

    const filtered = shipments.filter(s => {
        if (filter === 'pending'  && s.status !== 'pending') return false;
        if (filter === 'assigned' && s.status !== 'assigned') return false;
        if (filter === 'active'   && !['picked_up','in_transit','out_for_delivery'].includes(s.status)) return false;
        if (filter === 'done'     && !['delivered','failed','returned'].includes(s.status)) return false;
        return true;
    });

    const stats = {
        pending: shipments.filter(s => s.status === 'pending').length,
        active:  shipments.filter(s => ['in_transit','out_for_delivery','picked_up'].includes(s.status)).length,
        done:    shipments.filter(s => s.status === 'delivered').length,
        drivers: drivers.filter(d => d.isAvailable).length,
    };

    return(
        <div className='animate-fadeIn'>
            {toast && (
                <div className="alert alert-success" style={{ marginBottom: 20, position: 'sticky', top: 0, zIndex: 10 }}>
                {toast}
                </div>
            )}

            {/* Stats */}
            <div className="stat-grid" style={{ marginBottom: 24 }}>
                {[
                    { icon: '⏳', label: 'Pending',          value: stats.pending, color: 'amber' },
                    { icon: '🚚', label: 'In Transit',        value: stats.active,  color: 'blue' },
                    { icon: '✅', label: 'Delivered today',   value: stats.done,    color: 'green' },
                    { icon: '👤', label: 'Available drivers', value: stats.drivers, color: 'purple' },
                ].map(s => (
                    <div key={s.label} className="stat-card">
                        <div className={`stat-icon ${s.color}`} style={{ fontSize: 24 }}>{s.icon}</div>
                        <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
                    </div>
                ))}
            </div>

            {/* Live drivers */}
            {Object.keys(driverLocs).length > 0 && (
                <div className="card card-padded" style={{ marginBottom: 24 }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, marginBottom: 14 }}>🟢 Drivers Online</h3>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {Object.entries(driverLocs).map(([id, loc]) => (
                            <div key={id} style={{
                                background: 'rgba(6,214,160,0.07)', border: '1px solid rgba(6,214,160,0.2)',
                                borderRadius: 'var(--radius-sm)', padding: '8px 14px', fontSize: 13,
                            }}>
                                <span style={{ fontWeight: 700 }}>{loc.name || 'Driver'}</span>
                                <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
                                    GPS: {loc.lat?.toFixed(4)}, {loc.lng?.toFixed(4)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Shipments */}
            <div className='card'>
                <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
                    <span className="card-title">Shipments ({filtered.length})</span>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div className="tabs">
                            {filters.map(f => (
                                <button key={f.key} className={`tab${filter === f.key ? ' active' : ''}`} onClick={() => setFilter(f.key)}>
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>+ New Shipment</button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-center"><div className="spinner" /></div>
                ): filtered.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <div className="empty-title">No shipments</div>
                        <div className="empty-sub">
                        {filter === 'pending' ? 'No pending shipments. Create one with "+ New Shipment".' : 'No shipments match this filter.'}
                        </div>
                    </div>
                )   :   (
                    <>  
                        {/* Mobile */}
                        <div className="mobile-dispatch" style={{ display: 'none' }}>
                            {filtered.map(s => {
                                const meta = STATUS_META[s.status] || { label: s.status, cls: '' };
                                return (
                                    <div key={s._id} className="delivery-card-mobile" style={{ margin: '0 16px 12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <code style={{ fontWeight: 700, color: 'var(--blue)', fontSize: 14 }}>{s.trackingId}</code>
                                            <span className={`badge ${meta.cls}`}>{meta.label}</span>
                                        </div>
                                        <div className="addr">{s.delivery?.address}</div>
                                        <div className="meta">
                                            👤 {s.customer?.name || 'Unknown'} · {formatDistanceToNow(new Date(s.updatedAt), { addSuffix: true })}
                                        </div>
                                        {s.driver?.name && <div className="meta" style={{ marginTop: 4 }}>🚚 {s.driver.name}</div>}
                                        <div className="actions">
                                            {s.status === 'pending' && (
                                                <button className="btn btn-primary btn-sm" onClick={() => setSelected(s)}>Assign Driver</button>
                                            )}
                                            {s.status === 'assigned' && (
                                                <button className="btn btn-ghost btn-sm" onClick={() => unassign(s._id)}>Unassign</button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop */}
                        <div className='table-wrapper desktop-dispatch'>
                            <table>
                                <thead><tr>
                                    <th>Tracking ID</th><th>Customer</th><th>Destination</th>
                                    <th>Status</th><th>Driver</th><th>Priority</th><th>Updated</th><th>Actions</th>
                                </tr></thead>
                                <tbody>
                                    {filtered.map(s => {
                                        const meta = STATUS_META[s.status] || { label: s.status, cls: '' };
                                        const driverName = s.driver?.name;
                                        return (
                                            <tr key={s._id}>
                                                <td><code style={{ fontWeight: 700, color: 'var(--blue)', fontSize: 13 }}>{s.trackingId}</code></td>
                                                <td>
                                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{s.customer?.name || '—'}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.customer?.email}</div>
                                                </td>
                                                <td style={{ fontSize: 13, maxWidth: 160 }}>
                                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.delivery?.address}</div>
                                                    {s.delivery?.city && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.delivery.city}</div>}
                                                </td>
                                                <td><span className={`badge ${meta.cls}`}>{meta.label}</span></td>
                                                <td style={{ fontSize: 13 }}>
                                                {driverName ? (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{
                                                        width: 26, height: 26, borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, var(--blue), var(--blue-light))',
                                                        color: '#fff', fontSize: 11, fontWeight: 700,
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>{driverName[0].toUpperCase()}</span>
                                                    {driverName}
                                                    </span>
                                                ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Unassigned</span>}
                                                </td>
                                                <td>
                                                    <span style={{
                                                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                                                        background: s.priority === 'urgent' ? 'rgba(239,71,111,0.1)' : s.priority === 'express' ? 'rgba(240,165,0,0.1)' : 'rgba(27,108,168,0.08)',
                                                        color: s.priority === 'urgent' ? 'var(--danger)' : s.priority === 'express' ? '#b07800' : 'var(--blue)',
                                                    }}>{s.priority?.toUpperCase()}</span>
                                                </td>
                                                <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                    {formatDistanceToNow(new Date(s.updatedAt), { addSuffix: true })}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        {s.status === 'pending' && (
                                                        <button className="btn btn-primary btn-sm" onClick={() => setSelected(s)}>Assign</button>
                                                        )}
                                                        {s.status === 'assigned' && (
                                                        <button className="btn btn-ghost btn-sm" onClick={() => unassign(s._id)}>Unassign</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {selected && <AssignModal shipment={selected} drivers={drivers} onClose={() => setSelected(null)} onSuccess={onAssigned} />}
            {showNew   && <NewShipmentModal onClose={() => setShowNew(false)} onSuccess={onCreated} />}

            <style>{`
                @media (max-width: 700px) {
                .mobile-dispatch  { display: block !important; padding-top: 8px; }
                .desktop-dispatch { display: none; }
                }
            `}</style>
        </div>
    );
}