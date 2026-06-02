import { useState, useRef, useEffect } from "react";
import api from "../../utils/api";
import { io } from "socket.io-client";
import { formatDistanceToNow } from "date-fns";

const NEXT_STATUS = {
    assigned:         { next:'picked_up',        label:'Mark Picked Up',        icon:'📦', color:'var(--blue)' },
    picked_up:        { next:'in_transit',        label:'Start Transit',         icon:'🚚', color:'var(--info)' },
    in_transit:       { next:'out_for_delivery',  label:'Out for Delivery',      icon:'🏃', color:'#7c3aed' },
    out_for_delivery: { next:'delivered',         label:'Mark Delivered ✅',     icon:'✅', color:'var(--success)' },
};

const STATUS_ICONS = {
    pending:'⏳', assigned:'📋', picked_up:'📦', in_transit:'🚚',
    out_for_delivery:'🏃', delivered:'✅', failed:'❌', returned:'↩️',
};
  
const STATUS_LABELS = {
    pending:'Pending', assigned:'Assigned', picked_up:'Picked Up',
    in_transit:'In Transit', out_for_delivery:'Out for Delivery',
    delivered:'Delivered', failed:'Failed', returned:'Returned',
};

function StatusUpdateModal({ shipment, onClose, onSuccess }) {
    const action = NEXT_STATUS[shipment?.status];
    const [note, setNote]         = useState('');
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');
    const [showFail, setShowFail] = useState(false);
    const [failReason, setFail]   = useState('');

    const update = async (status, noteText) => {
        setLoading(true); 
        setError('');
        try {
          await api.patch(`/shipments/${shipment._id}/status`, { status, note: noteText });
          onSuccess(status);
        } catch (err) {
          setError(err.response?.data?.message || 'Update failed.');
          setLoading(false);
        }
    };

    if (!action && shipment?.status !== 'out_for_delivery') {
        return (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal">
              <div className="modal-header">
                <span className="modal-title">Delivery Info</span>
                <button className="modal-close" onClick={onClose}>✕</button>
              </div>
              <div className="modal-body">
                <p style={{ color:'var(--text-secondary)' }}>This delivery is already <strong>{STATUS_LABELS[shipment?.status]}</strong>.</p>
              </div>
              <div className="modal-footer"><button className="btn btn-ghost" onClick={onClose}>Close</button></div>
            </div>
          </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <span className="modal-title">Update Delivery</span>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <div style={{ background:'var(--bg)', borderRadius:'var(--radius-sm)', padding:'12px 16px', marginBottom:20 }}>
                        <div style={{ fontFamily:'monospace', fontWeight:700, color:'var(--blue)', fontSize:15, marginBottom:4 }}>{shipment?.trackingId}</div>
                        <div style={{ fontSize:13, color:'var(--text-secondary)' }}>📍 {shipment?.delivery?.address}</div>
                        {shipment?.delivery?.instructions && (
                            <div style={{ marginTop:8, padding:'8px 10px', background:'rgba(240,165,0,0.08)', borderRadius:6, fontSize:12, color:'#b07800' }}>
                                📝 {shipment.delivery.instructions}
                            </div>
                        )}
                    </div>

                    {error && <div className="alert alert-error">{error}</div>}

                    {!showFail ? (
                        <>
                        <div className="form-group">
                            <label className="form-label">Note <span style={{ fontWeight:400, color:'var(--text-muted)' }}>(optional)</span></label>
                            <textarea className="form-control" rows={2} placeholder="Any comments about this delivery…"
                            value={note} onChange={e => setNote(e.target.value)} style={{ resize:'none' }} />
                        </div>
                        <div style={{ display:'flex', gap:10, flexDirection:'column' }}>
                            {action && (
                                <button className="btn btn-lg" disabled={loading}
                                    onClick={() => update(action.next, note)}
                                    style={{
                                    background:`linear-gradient(135deg, ${action.color}, ${action.color}cc)`,
                                    color: action.color === 'var(--success)' ? 'var(--navy)' : '#fff',
                                    fontSize:15, fontWeight:700, width:'100%',
                                }}>
                                    {loading ? 'Updating…' : `${action.icon} ${action.label}`}
                                </button>
                            )}
                            {['out_for_delivery','in_transit','picked_up','assigned'].includes(shipment?.status) && (
                                <button className="btn btn-ghost" onClick={() => setShowFail(true)} style={{ width:'100%', color:'var(--danger)', borderColor:'rgba(239,71,111,0.3)' }}>
                                    ❌ Report Failure
                                </button>
                            )}
                        </div>
                        </>
                    ) : (
                        <>
                        <div className="form-group">
                            <label className="form-label">Failure reason</label>
                            <select className="form-control" value={failReason} onChange={e => setFail(e.target.value)}>
                            <option value="">— Select reason —</option>
                            <option>Customer not home</option>
                            <option>Access denied</option>
                            <option>Address not found</option>
                            <option>Customer refused delivery</option>
                            <option>Damaged package</option>
                            <option>Other</option>
                            </select>
                        </div>
                        <div style={{ display:'flex', gap:10 }}>
                            <button className="btn btn-ghost" style={{ flex:1 }} onClick={() => setShowFail(false)}>Back</button>
                            <button className="btn btn-danger" style={{ flex:1 }} disabled={loading || !failReason}
                                onClick={() => update('failed', failReason)}>
                                {loading ? 'Updating…' : 'Confirm Failure'}
                            </button>
                        </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function DriverDashboard() {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading]       = useState(true);
    const [selected, setSelected]     = useState(null);
    const [available, setAvailable]   = useState(true);
    const [toast, setToast]           = useState('');
    const [filter, setFilter]         = useState('active');
    const socketRef = useRef(null);
    const watchIdRef = useRef(null);

    const load = () => {
        setLoading(true);
        api.get('/shipments')
            .then(r => setDeliveries(r.data.shipments || []))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        const socket = io(process.env.REACT_APP_SOCKET_URL || window.location.origin);
        socketRef.current = socket;
        socket.emit('join_role', 'driver');
        socket.on('new_assignment', () => { load(); showToast('📦 New delivery assigned!'); });
    
        // GPS tracking
        if (navigator.geolocation) {
          watchIdRef.current = navigator.geolocation.watchPosition(
            pos => {
              api.patch('/drivers/location', { lat: pos.coords.latitude, lng: pos.coords.longitude }).catch(() => {});
            },
            () => {},
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
          );
        }
    
        return () => {
          socket.disconnect();
          if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
        };
    }, []);

    const toggleAvailability = async () => {
        try {
          await api.patch('/drivers/availability', { isAvailable: !available });
          setAvailable(a => !a);
          showToast(available ? '⛔ Marked as unavailable' : '✅ Marked as available');
        } catch {}
    };

    const showToast = (msg) => { 
        setToast(msg); 
        setTimeout(() => setToast(''), 3000); 
    };

    const onStatusUpdated = (newStatus) => {
        setSelected(null);
        load();
        const msgs = {
          picked_up:'📦 Marked as picked up', in_transit:'🚚 Transit started',
          out_for_delivery:'🏃 Out for delivery', delivered:'✅ Delivery completed!', failed:'❌ Failure reported',
        };
        showToast(msgs[newStatus] || 'Updated');
    };

    const active    = deliveries.filter(d => !['delivered','failed','returned','pending'].includes(d.status));
    const completed = deliveries.filter(d => ['delivered','failed','returned'].includes(d.status));
    const shown     = filter === 'active' ? active : completed;

    const completedToday = deliveries.filter(d => {
        if (d.status !== 'delivered' || !d.deliveredAt) return false;
        const today = new Date(); 
        const del = new Date(d.deliveredAt);
        return del.toDateString() === today.toDateString();
    }).length;

    return (
        <div className="animate-fadeIn" style={{ maxWidth: 600, margin:'0 auto' }}>
            {toast && <div className="alert alert-success" style={{ marginBottom:16, position:'sticky', top:0, zIndex:10 }}>{toast}</div>}

            {/* Driver status card */}
            <div style={{
                background: available
                ? 'linear-gradient(135deg, var(--navy), var(--navy-700))'
                : 'linear-gradient(135deg, #374151, #4B5563)',
                borderRadius:'var(--radius-lg)', padding:'22px 24px',
                display:'flex', alignItems:'center', justifyContent:'space-between',
                marginBottom:20, flexWrap:'wrap', gap:12,
            }}>
                <div>
                    <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, marginBottom:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>Status</div>
                    <div style={{ color:'#fff', fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ width:10, height:10, borderRadius:'50%', background: available ? 'var(--success)' : '#9CA3AF', display:'inline-block' }} />
                        {available ? 'Available for delivery' : 'Unavailable'}
                    </div>
                    <div style={{ color:'rgba(255,255,255,0.4)', fontSize:13, marginTop:4 }}>
                        📍 GPS {watchIdRef.current ? 'tracking active' : 'not available'}
                    </div>
                </div>
                <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                    <div style={{ textAlign:'center' }}>
                        <div style={{ color:'#fff', fontFamily:'var(--font-display)', fontSize:28, fontWeight:800, lineHeight:1 }}>{completedToday}</div>
                        <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, marginTop:2 }}>Today</div>
                    </div>
                    <button
                        onClick={toggleAvailability}
                        style={{
                        padding:'10px 18px', borderRadius:'var(--radius-sm)',
                        background: available ? 'rgba(239,71,111,0.2)' : 'rgba(6,214,160,0.2)',
                        color: available ? '#ff8fab' : 'var(--success)',
                        border: `1px solid ${available ? 'rgba(239,71,111,0.3)' : 'rgba(6,214,160,0.3)'}`,
                        fontWeight:700, fontSize:13, cursor:'pointer',
                        }}
                    >
                        {available ? '⛔ Go offline' : '✅ Go online'}
                    </button>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="tabs" style={{ marginBottom:16 }}>
                <button className={`tab${filter === 'active' ? ' active' : ''}`} onClick={() => setFilter('active')}>
                Active ({active.length})
                </button>
                <button className={`tab${filter === 'done' ? ' active' : ''}`} onClick={() => setFilter('done')}>
                Completed ({completed.length})
                </button>
            </div>

            {/* Delivery cards */}
            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : shown.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">{filter === 'active' ? '🎉' : '📋'}</div>
                    <div className="empty-title">{filter === 'active' ? 'No active deliveries' : 'No completed deliveries'}</div>
                    <div className="empty-sub">{filter === 'active' ? 'You\'re all caught up! Wait for new assignments.' : 'Completed deliveries will appear here.'}</div>
                </div>
            ) : (
                shown.map(d => {
                    const nextAction = NEXT_STATUS[d.status];
                    const icon       = STATUS_ICONS[d.status] || '📦';
                    const label      = STATUS_LABELS[d.status] || d.status;
                    const isActive   = !['delivered','failed','returned'].includes(d.status);

                    return (
                        <div key={d._id} style={{
                            background:'var(--bg-card)', borderRadius:'var(--radius)',
                            border: isActive ? '1px solid rgba(27,108,168,0.25)' : '1px solid var(--border)',
                            padding:'18px', marginBottom:12,
                            boxShadow: isActive ? '0 4px 16px rgba(27,108,168,0.08)' : 'var(--shadow-sm)',
                            transition:'all 0.2s',
                        }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                                <code style={{ fontWeight:800, color:'var(--blue)', fontSize:15, letterSpacing:0.5 }}>{d.trackingId}</code>
                                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                                    {d.priority !== 'standard' && (
                                        <span style={{
                                            fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20,
                                            background: d.priority === 'urgent' ? 'rgba(239,71,111,0.1)' : 'rgba(240,165,0,0.1)',
                                            color: d.priority === 'urgent' ? 'var(--danger)' : '#b07800',
                                        }}>{d.priority?.toUpperCase()}</span>
                                    )}
                                    <span className={`badge badge-${d.status}`}>{icon} {label}</span>
                                </div>
                            </div>

                            {/* Route */}
                            <div style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:12 }}>
                                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, paddingTop:3 }}>
                                    <div style={{ width:10, height:10, borderRadius:'50%', background:'var(--blue)', border:'2px solid var(--bg-card)', boxShadow:'0 0 0 2px var(--blue)' }} />
                                    <div style={{ width:2, height:20, background:'var(--border)' }} />
                                    <div style={{ width:10, height:10, borderRadius:2, background:'var(--success)', border:'2px solid var(--bg-card)', boxShadow:'0 0 0 2px var(--success)' }} />
                                </div>
                                <div style={{ flex:1 }}>
                                    <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:4 }}>From: <span style={{ color:'var(--text-primary)', fontWeight:500 }}>{d.pickup?.address}</span></div>
                                    <div style={{ fontSize:13, color:'var(--text-secondary)' }}>To: <span style={{ color:'var(--text-primary)', fontWeight:600 }}>{d.delivery?.address}</span></div>
                                </div>
                            </div>

                            {/* Instructions */}
                            {d.delivery?.instructions && (
                                <div style={{
                                    fontSize:12, color:'#b07800', background:'rgba(240,165,0,0.08)',
                                    borderRadius:6, padding:'7px 10px', marginBottom:12,
                                }}>
                                    📝 {d.delivery.instructions}
                                </div>
                            )}

                            {/* Contact */}
                            {d.delivery?.contactPhone && (
                                <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:12 }}>
                                    📞 {d.delivery?.contactName && <span style={{ fontWeight:600 }}>{d.delivery.contactName} · </span>}
                                    <a href={`tel:${d.delivery.contactPhone}`} style={{ color:'var(--blue)' }}>{d.delivery.contactPhone}</a>
                                </div>
                            )}

                            <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom: nextAction ? 14 : 0 }}>
                                Updated {formatDistanceToNow(new Date(d.updatedAt), { addSuffix:true })}
                            </div>

                            {/* Actions */}
                            {isActive && (
                                <div style={{ display:'flex', gap:8 }}>
                                    {nextAction && (
                                        <button
                                            onClick={() => setSelected(d)}
                                            style={{
                                                flex:1, padding:'11px 16px', borderRadius:'var(--radius-sm)',
                                                background:`linear-gradient(135deg, ${nextAction.color}, ${nextAction.color}cc)`,
                                                color: nextAction.color === 'var(--success)' ? 'var(--navy)' : '#fff',
                                                border:'none', fontWeight:700, fontSize:14, cursor:'pointer',
                                                transition:'all 0.2s',
                                            }}
                                        >
                                            {nextAction.icon} {nextAction.label}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setSelected(d)}
                                        className="btn btn-ghost btn-sm"
                                        style={{ padding:'10px 14px' }}
                                        title="More options"
                                    >⋯</button>
                                </div>
                            )}
                        </div>
                    );
                })
            )}

            {selected && (
                <StatusUpdateModal shipment={selected} onClose={() => setSelected(null)} onSuccess={onStatusUpdated} />
            )}

        </div>
    );
}