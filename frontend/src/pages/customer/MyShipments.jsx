import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { format, formatDistanceToNow } from 'date-fns';

const STATUS_META = {
  pending:          { label:'Pending',         cls:'badge-pending' },
  assigned:         { label:'Assigned',         cls:'badge-assigned' },
  picked_up:        { label:'Picked Up',        cls:'badge-picked_up' },
  in_transit:       { label:'In Transit',       cls:'badge-in_transit' },
  out_for_delivery: { label:'Out for Delivery', cls:'badge-out_for_delivery' },
  delivered:        { label:'Delivered',        cls:'badge-delivered' },
  failed:           { label:'Failed',           cls:'badge-failed' },
  returned:         { label:'Returned',         cls:'badge-returned' },
};

function RescheduleModal({ shipment, onClose, onSuccess }) {
  const [date, setDate]         = useState('');
  const [instructions, setInst] = useState(shipment?.delivery?.instructions || '');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const minDate = new Date(); minDate.setDate(minDate.getDate() + 1);
  const maxDate = new Date(); maxDate.setDate(maxDate.getDate() + 30);

  const submit = async (e) => {
    e.preventDefault();
    if (!date) { setError('Please select a date.'); return; }
    setLoading(true); setError('');
    try {
      await api.patch(`/shipments/${shipment._id}/reschedule`, { scheduledDate: date, instructions });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reschedule. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">📅 Reschedule Delivery</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{
            background:'var(--bg)', borderRadius:'var(--radius-sm)',
            padding:'12px 16px', marginBottom:20, fontSize:14,
          }}>
            <div style={{ color:'var(--text-muted)', fontSize:12, marginBottom:2 }}>Shipment</div>
            <div style={{ fontWeight:700, fontFamily:'monospace', color:'var(--blue)', fontSize:16 }}>{shipment?.trackingId}</div>
            <div style={{ fontSize:13, color:'var(--text-secondary)', marginTop:2 }}>{shipment?.delivery?.address}</div>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">New delivery date</label>
              <input
                className="form-control" type="date"
                min={minDate.toISOString().split('T')[0]}
                max={maxDate.toISOString().split('T')[0]}
                value={date} onChange={e => setDate(e.target.value)} required
              />
              <span style={{ fontSize:12, color:'var(--text-muted)', marginTop:4, display:'block' }}>
                Choose a date between tomorrow and 30 days from now
              </span>
            </div>
            <div className="form-group">
              <label className="form-label">Special instructions <span style={{ fontWeight:400, color:'var(--text-muted)' }}>(optional)</span></label>
              <textarea
                className="form-control" rows={3}
                placeholder="e.g. Leave at back door, call on arrival, fragile items..."
                value={instructions} onChange={e => setInst(e.target.value)}
                maxLength={250} style={{ resize:'vertical' }}
              />
              <span style={{ fontSize:12, color:'var(--text-muted)', display:'block', textAlign:'right', marginTop:4 }}>
                {instructions.length}/250
              </span>
            </div>
            <div className="modal-footer" style={{ padding:0, marginTop:8 }}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Rescheduling…' : 'Confirm Reschedule'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function MyShipments() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState(null); // for reschedule
  const [toastMsg, setToastMsg]   = useState('');

  const load = () => {
    setLoading(true);
    api.get('/shipments?limit=50').then(r => setShipments(r.data.shipments || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filters = [
    { key:'all',    label:'All' },
    { key:'active', label:'Active' },
    { key:'delivered', label:'Delivered' },
    { key:'failed', label:'Failed' },
  ];

  const filtered = shipments.filter(s => {
    if (filter === 'active' && ['delivered','failed','returned'].includes(s.status)) return false;
    if (filter === 'delivered' && s.status !== 'delivered') return false;
    if (filter === 'failed'    && !['failed','returned'].includes(s.status)) return false;
    if (search && !s.trackingId.toLowerCase().includes(search.toLowerCase())
               && !s.delivery?.address?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); };

  const onRescheduleSuccess = () => {
    setSelected(null);
    load();
    toast('✅ Delivery rescheduled successfully.');
  };

  const canReschedule = (s) => ['pending','assigned'].includes(s.status);

  return (
    <div className="animate-fadeIn">
      {toastMsg && (
        <div className="alert alert-success" style={{ marginBottom:20, position:'sticky', top:0, zIndex:10 }}>
          {toastMsg}
        </div>
      )}

      {/* Filters + search */}
      <div style={{ display:'flex', gap:16, alignItems:'center', marginBottom:20, flexWrap:'wrap' }}>
        <div className="tabs">
          {filters.map(f => (
            <button key={f.key} className={`tab${filter === f.key ? ' active' : ''}`} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="search-bar" style={{ flex:1, minWidth:200 }}>
          <span className="search-icon">🔍</span>
          <input className="form-control" style={{ paddingLeft:38 }}
            placeholder="Search by tracking ID or address…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-title">No shipments found</div>
            <div className="empty-sub">{search ? 'Try a different search term.' : 'No shipments match the selected filter.'}</div>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div style={{ display:'none' }} className="mobile-list">
              {filtered.map(s => {
                const meta = STATUS_META[s.status] || { label:s.status, cls:'' };
                return (
                  <div key={s._id} className="delivery-card-mobile" style={{ margin:'0 16px 12px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <code style={{ fontWeight:700, color:'var(--blue)', fontSize:14 }}>{s.trackingId}</code>
                      <span className={`badge ${meta.cls}`}>{meta.label}</span>
                    </div>
                    <div className="addr">{s.delivery?.address}</div>
                    <div className="meta">{s.delivery?.city} · {formatDistanceToNow(new Date(s.updatedAt), { addSuffix:true })}</div>
                    <div className="actions">
                      <Link to={`/customer/track?id=${s.trackingId}`} className="btn btn-primary btn-sm">Track →</Link>
                      {canReschedule(s) && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setSelected(s)}>📅 Reschedule</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="table-wrapper desktop-table">
              <table>
                <thead><tr>
                  <th>Tracking ID</th><th>From</th><th>To</th><th>Status</th><th>Scheduled</th><th>Updated</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {filtered.map(s => {
                    const meta = STATUS_META[s.status] || { label:s.status, cls:'' };
                    return (
                      <tr key={s._id}>
                        <td><code style={{ fontWeight:700, color:'var(--blue)', fontSize:13 }}>{s.trackingId}</code></td>
                        <td style={{ maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:13 }}>{s.pickup?.address}</td>
                        <td style={{ maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:13 }}>{s.delivery?.address}</td>
                        <td><span className={`badge ${meta.cls}`}>{meta.label}</span></td>
                        <td style={{ fontSize:12, color:'var(--text-muted)' }}>
                          {s.scheduledDate ? format(new Date(s.scheduledDate), 'MMM d, yyyy') : '—'}
                          {s.isRescheduled && <span style={{ marginLeft:6, fontSize:10, background:'rgba(240,165,0,0.15)', color:'#b07800', padding:'1px 6px', borderRadius:10, fontWeight:700 }}>RESCHEDULED</span>}
                        </td>
                        <td style={{ fontSize:12, color:'var(--text-muted)', whiteSpace:'nowrap' }}>{formatDistanceToNow(new Date(s.updatedAt), { addSuffix:true })}</td>
                        <td>
                          <div style={{ display:'flex', gap:8 }}>
                            <Link to={`/customer/track?id=${s.trackingId}`} className="btn btn-ghost btn-sm">Track</Link>
                            {canReschedule(s) && (
                              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(s)}>📅</button>
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

      {selected && (
        <RescheduleModal shipment={selected} onClose={() => setSelected(null)} onSuccess={onRescheduleSuccess} />
      )}

      <style>{`
        @media (max-width: 700px) {
          .mobile-list  { display: block !important; padding-top: 8px; }
          .desktop-table { display: none; }
        }
      `}</style>
    </div>
  );
}
