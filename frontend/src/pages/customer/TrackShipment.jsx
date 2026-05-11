import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../utils/api";
import { format } from 'date-fns';

export default function TrackShipment() {
    const [searchParams] = useSearchParams();
    const [trackingId, setTrackingId] = useState(searchParams.get('id') || '');
    const [input, setInput] = useState(searchParams.get('id') || '');
    const [shipment, setShipment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { if (trackingId) doSearch(trackingId); }, []);

    const doSearch = async (id) => {
        if (!id.trim()) return;
        setLoading(true); setError(''); setShipment(null);
        try {
          const res = await api.get(`/shipments/track/${id.trim().toUpperCase()}`);
          setShipment(res.data.shipment);
        } catch (err) {
          setError(err.response?.data?.message || 'Shipment not found. Check your tracking ID.');
        } finally { setLoading(false); }
    };

    const handleSubmit = (e) => { 
        e.preventDefault(); 
        setTrackingId(input); 
        doSearch(input);
    };

    const stepIndex  = shipment ? STEPS.indexOf(shipment.status) : -1;
    const isFailed   = shipment?.status === 'failed' || shipment?.status === 'returned';

    return (
        <div className="animate-fadeIn" style={{ maxWidth: 760 }}>
            {/* Search */}
            <div className="card card-padded" style={{ marginBottom: 24}}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 4}}>Track Your Shipment</h2>
                <p style={{ color: 'var(--text-secondary', fontSize: 14, marginBottom: 20 }}>
                    Enter your tracking ID to get real-time updates on your delivery.
                </p>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap:10}}>
                    <div style={{ flex: 1, position: 'relative'}}>
                        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, pointerEvents: 'none'}}>📦</span>
                        <input
                            className="form-control" style={{ paddingLeft: 14, fontFamily: 'monospace', fontSize: 15, letterSpacing: 1 }}
                            placeholder="e.g. LGT000001"
                            value={input} onChange={e => setInput(e.target.value.toUpperCase())}
                        />
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={loading} style={{ whiteSpace:'nowrap'}}>
                        {loading ? 'Searching...' : 'Track →'}
                    </button>
                </form>
                {error && <div className="alert alert-error" style={{ marginTop:16, marginBottom:0 }}>⚠️ {error}</div>}
            </div>

            {shipment && (
                <div className="animate-slideUp">
                {/* Header card */}
                <div className="card card-padded" style={{ marginBottom: 16 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
                    <div>
                        <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Tracking ID</div>
                        <div style={{ fontFamily:'monospace', fontSize:24, fontWeight:800, color:'var(--navy)', letterSpacing:2 }}>{shipment.trackingId}</div>
                    </div>
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
                        <span className={`badge badge-${shipment.status}`} style={{ fontSize:13 }}>
                        {STEP_META[shipment.status]?.icon} {STEP_META[shipment.status]?.label || shipment.status}
                        </span>
                        {shipment.priority !== 'standard' && (
                        <span style={{
                            fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:20,
                            background: `${PRIORITY_COLORS[shipment.priority]}20`,
                            color: PRIORITY_COLORS[shipment.priority],
                        }}>{shipment.priority.toUpperCase()}</span>
                        )}
                    </div>
                    </div>

                    {/* Addresses */}
                    <div style={{
                    display:'grid', gridTemplateColumns:'1fr auto 1fr',
                    gap:12, marginTop:24, alignItems:'center',
                    }}>
                    <div style={{ background:'var(--bg)', borderRadius:'var(--radius-sm)', padding:'14px 16px' }}>
                        <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Pickup</div>
                        <div style={{ fontSize:14, fontWeight:600 }}>{shipment.pickup?.address}</div>
                        {shipment.pickup?.city && <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:2 }}>{shipment.pickup.city}</div>}
                    </div>
                    <div style={{ fontSize:22, color:'var(--text-muted)', textAlign:'center' }}>→</div>
                    <div style={{ background:'var(--bg)', borderRadius:'var(--radius-sm)', padding:'14px 16px' }}>
                        <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Delivery</div>
                        <div style={{ fontSize:14, fontWeight:600 }}>{shipment.delivery?.address}</div>
                        {shipment.delivery?.city && <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:2 }}>{shipment.delivery.city}</div>}
                    </div>
                    </div>

                    {/* ETA */}
                    {shipment.estimatedDelivery && !['delivered','failed','returned'].includes(shipment.status) && (
                    <div style={{
                        marginTop:16, padding:'12px 16px',
                        background:'rgba(6,214,160,0.08)', borderRadius:'var(--radius-sm)',
                        border:'1px solid rgba(6,214,160,0.2)', display:'flex', alignItems:'center', gap:10,
                    }}>
                        <span style={{ fontSize:20 }}>🕐</span>
                        <div>
                        <div style={{ fontSize:13, fontWeight:700, color:'#047857' }}>Estimated delivery</div>
                        <div style={{ fontSize:14, color:'var(--text-primary)' }}>
                            {format(new Date(shipment.estimatedDelivery), 'EEEE, MMMM d · h:mm a')}
                        </div>
                        </div>
                    </div>
                    )}
                    {shipment.status === 'delivered' && shipment.deliveredAt && (
                    <div style={{
                        marginTop:16, padding:'12px 16px',
                        background:'rgba(6,214,160,0.08)', borderRadius:'var(--radius-sm)',
                        border:'1px solid rgba(6,214,160,0.2)', display:'flex', alignItems:'center', gap:10,
                    }}>
                        <span style={{ fontSize:20 }}>✅</span>
                        <div>
                        <div style={{ fontSize:13, fontWeight:700, color:'#047857' }}>Delivered on</div>
                        <div style={{ fontSize:14 }}>{format(new Date(shipment.deliveredAt), 'EEEE, MMMM d · h:mm a')}</div>
                        </div>
                    </div>
                    )}
                </div>

                {/* Progress stepper */}
                {!isFailed && (
                    <div className="card card-padded" style={{ marginBottom:16 }}>
                    <h3 style={{ fontFamily:'var(--font-display)', fontSize:15, marginBottom:20 }}>Delivery Progress</h3>
                    <div style={{ display:'flex', alignItems:'flex-start', overflowX:'auto', paddingBottom:8 }}>
                        {STEPS.map((step, i) => {
                        const done    = i < stepIndex || (stepIndex === -1 && step === 'delivered' && shipment.status === 'delivered');
                        const current = i === stepIndex;
                        const meta    = STEP_META[step];
                        return (
                            <React.Fragment key={step}>
                            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:90, textAlign:'center' }}>
                                <div style={{
                                width:44, height:44, borderRadius:'50%', fontSize:18,
                                display:'flex', alignItems:'center', justifyContent:'center',
                                background: done || current ? 'linear-gradient(135deg, var(--blue), var(--blue-light))' : 'var(--bg)',
                                border: `2px solid ${done || current ? 'var(--blue)' : 'var(--border)'}`,
                                transition:'all 0.3s',
                                boxShadow: current ? '0 0 0 4px rgba(27,108,168,0.2)' : 'none',
                                }}>
                                {done ? '✓' : meta.icon}
                                </div>
                                <div style={{ fontSize:11, fontWeight: current ? 700 : 500, marginTop:8, color: current ? 'var(--blue)' : done ? 'var(--text-primary)' : 'var(--text-muted)', lineHeight:1.3 }}>
                                {meta.label}
                                </div>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div style={{
                                flex:1, height:2, marginTop:21,
                                background: i < stepIndex ? 'var(--blue)' : 'var(--border)',
                                transition:'background 0.3s',
                                }} />
                            )}
                            </React.Fragment>
                        );
                        })}
                    </div>
                    </div>
                )}

                {/* Status history timeline */}
                {shipment.statusHistory?.length > 0 && (
                    <div className="card card-padded" style={{ marginBottom:16 }}>
                    <h3 style={{ fontFamily:'var(--font-display)', fontSize:15, marginBottom:20 }}>Status History</h3>
                    <div className="timeline">
                        {[...shipment.statusHistory].reverse().map((h, i) => {
                        const meta = STEP_META[h.status] || { label: h.status, icon:'📍' };
                        return (
                            <div key={i} className="timeline-item">
                            <div className={`timeline-dot ${i === 0 ? 'active' : 'done'}`}>
                                <span style={{ fontSize:9 }}>{i === 0 ? '●' : '✓'}</span>
                            </div>
                            <div className="timeline-time">
                                {h.timestamp ? format(new Date(h.timestamp), 'MMM d, yyyy · h:mm a') : ''}
                            </div>
                            <div className="timeline-status">{meta.icon} {meta.label}</div>
                            {h.note && <div className="timeline-note">{h.note}</div>}
                            {h.location?.address && (
                                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>📍 {h.location.address}</div>
                            )}
                            </div>
                        );
                        })}
                    </div>
                    </div>
                )}

                {/* Driver info */}
                {shipment.driver && !['delivered','failed','returned'].includes(shipment.status) && (
                    <div className="card card-padded" style={{ marginBottom:16 }}>
                    <h3 style={{ fontFamily:'var(--font-display)', fontSize:15, marginBottom:16 }}>Your Driver</h3>
                    <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                        <div style={{
                        width:52, height:52, borderRadius:'50%',
                        background:'linear-gradient(135deg, var(--blue), var(--success))',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:22, color:'#fff', fontWeight:700, flexShrink:0,
                        }}>
                        {shipment.driver.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                        <div style={{ fontWeight:700, fontSize:16 }}>{shipment.driver.name}</div>
                        {shipment.driver.vehicleNumber && (
                            <div style={{ fontSize:13, color:'var(--text-secondary)', marginTop:2 }}>🚚 {shipment.driver.vehicleNumber}</div>
                        )}
                        {shipment.driver.phone && (
                            <div style={{ fontSize:13, color:'var(--text-secondary)', marginTop:2 }}>📞 {shipment.driver.phone}</div>
                        )}
                        </div>
                    </div>
                    </div>
                )}

                {/* Special instructions */}
                {shipment.delivery?.instructions && (
                    <div className="card card-padded" style={{ background:'rgba(240,165,0,0.04)', borderColor:'rgba(240,165,0,0.2)' }}>
                    <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                        <span style={{ fontSize:20 }}>📝</span>
                        <div>
                        <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>Delivery instructions</div>
                        <div style={{ fontSize:14, color:'var(--text-secondary)' }}>{shipment.delivery.instructions}</div>
                        </div>
                    </div>
                    </div>
                )}
                </div>
            )}
        </div>
    );
}