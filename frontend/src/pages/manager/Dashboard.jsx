import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import api from '../../utils/api';

const COLORS = ['#1B6CA8','#06D6A0','#EF476F','#FFD166','#118AB2'];

function KpiCard({ icon, label, value, sub, color }) {
    return (
      <div className="stat-card" style={{ flexDirection:'column', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div className={`stat-icon ${color}`} style={{ fontSize:24 }}>{icon}</div>
          <div>
            <div className="stat-value" style={{ fontSize:32 }}>{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        </div>
        {sub && <div style={{ fontSize:12, color:'var(--text-muted)', borderTop:'1px solid var(--border)', paddingTop:8 }}>{sub}</div>}
      </div>
    );
}

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', boxShadow:'var(--shadow)', fontSize:13 }}>
        <div style={{ fontWeight:700, marginBottom:6 }}>{label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ color:p.color, display:'flex', gap:8, justifyContent:'space-between' }}>
            <span>{p.name}</span><span style={{ fontWeight:700 }}>{p.value}</span>
          </div>
        ))}
      </div>
    );
};

export default function ManagerDashboard() {
    const [overview, setOverview] = useState(null);
    const [daily, setDaily]       = useState([]);
    const [driverPerf, setDriverPerf] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [range, setRange]       = useState(30);

    useEffect(() => { 
        loadAll(); 
    }, [range]);

    const loadAll = async () => {
        setLoading(true);
        try {
          const [ov, dly, drv] = await Promise.all([
            api.get('/reports/overview'),
            api.get(`/reports/daily?days=${range}`),
            api.get('/reports/drivers'),
          ]);
          setOverview(ov.data.overview);
          // Format daily data
          const raw = dly.data.data || [];
          setDaily(raw.map(d => ({
            date: new Date(d._id).toLocaleDateString('en-US', { month:'short', day:'numeric' }),
            Total: d.total,
            Delivered: d.delivered,
            Failed: d.failed,
          })));
          setDriverPerf(drv.data.data || []);
        } catch {}
        setLoading(false);
    };

    const pieData = overview ? [
        { name:'Delivered',    value: overview.delivered },
        { name:'In Transit',   value: overview.inTransit },
        { name:'Pending',      value: overview.pending },
        { name:'Failed',       value: overview.failed },
    ].filter(d => d.value > 0) : [];

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;

    return (
        <div className='animate-fadeIn'>
            {/* Range selector */}
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:20 }}>
                <div className="tabs">
                    {[7,14,30,90].map(d => (
                        <button key={d} className={`tab${range === d ? ' active' : ''}`} onClick={() => setRange(d)}>
                            {d}d
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI cards */}
            <div className="stat-grid" style={{ marginBottom:24 }}>
                <KpiCard icon="📦" label="Total Shipments" value={overview?.total ?? '—'} color="blue"
                    sub={`Last ${range} days`} />
                <KpiCard icon="✅" label="On-Time Rate" value={`${overview?.onTimeRate ?? 0}%`} color="green"
                    sub={`${overview?.delivered ?? 0} delivered successfully`} />
                <KpiCard icon="❌" label="Failed" value={overview?.failed ?? 0} color="red"
                    sub="Could not be delivered" />
                <KpiCard icon="⏱️" label="Avg. Delivery" value={`${overview?.avgDeliveryHours ?? 0}h`} color="amber"
                    sub="Average time to deliver" />
                <KpiCard icon="👤" label="Active Drivers" value={overview?.totalDrivers ?? 0} color="purple"
                    sub="Registered in system" />
                <KpiCard icon="🚚" label="In Transit" value={overview?.inTransit ?? 0} color="blue"
                    sub="Currently on the road" />
            </div>

            {/* Area chart + Pie */}
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20, marginBottom:24 }}>
                <div className='card card-padded'>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                        <h3 style={{ fontFamily:'var(--font-display)', fontSize:15 }}>Delivery Trends</h3>
                        <span style={{ fontSize:12, color:'var(--text-muted)' }}>Last {range} days</span>
                    </div>
                    {daily.length === 0 ? (
                        <div className="empty-state" style={{ padding:'40px 0' }}>
                            <div className="empty-icon">📊</div>
                            <div className="empty-title">No data yet</div>
                            <div className="empty-sub">Create shipments to see trends here.</div>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={daily} margin={{ top:5, right:5, bottom:5, left:-20 }}>
                                <defs>
                                    <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1B6CA8" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#1B6CA8" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gDelivered" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06D6A0" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#06D6A0" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="date" tick={{ fontSize:11, fill:'var(--text-muted)' }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fontSize:11, fill:'var(--text-muted)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:12 }} />
                                <Area type="monotone" dataKey="Total"     stroke="#1B6CA8" fill="url(#gTotal)"     strokeWidth={2} dot={false} />
                                <Area type="monotone" dataKey="Delivered" stroke="#06D6A0" fill="url(#gDelivered)" strokeWidth={2} dot={false} />
                                <Area type="monotone" dataKey="Failed"    stroke="#EF476F" fill="none"             strokeWidth={2} dot={false} strokeDasharray="4 4" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className='card card-padded'>
                    <h3 style={{ fontFamily:'var(--font-display)', fontSize:15, marginBottom:20 }}>Status Breakdown</h3>
                    {pieData.length === 0 ? (
                        <div className="empty-state" style={{ padding:'40px 0' }}>
                        <div className="empty-icon">🍩</div>
                        <div className="empty-sub">No data yet</div>
                        </div>
                    ) : (
                        <>
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                                dataKey="value" paddingAngle={3}>
                                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(v, n) => [v, n]} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
                            {pieData.map((d, i) => (
                            <div key={d.name} style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                                <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                                <span style={{ width:10, height:10, borderRadius:'50%', background:COLORS[i], display:'inline-block' }} />
                                {d.name}
                                </span>
                                <span style={{ fontWeight:700 }}>{d.value}</span>
                            </div>
                            ))}
                        </div>
                        </>
                    )}
                </div>
            </div>

            {/* Driver performance bar chart */}
            {driverPerf.length > 0 && (
                <div className="card card-padded" style={{ marginBottom:24 }}>
                    <h3 style={{ fontFamily:'var(--font-display)', fontSize:15, marginBottom:20 }}>Driver Performance</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={driverPerf.slice(0,8)} margin={{ top:5, right:5, bottom:5, left:-20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis dataKey="driverName" tick={{ fontSize:11, fill:'var(--text-muted)' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize:11, fill:'var(--text-muted)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:12 }} />
                            <Bar dataKey="delivered" name="Delivered" fill="#06D6A0" radius={[4,4,0,0]} maxBarSize={40} />
                            <Bar dataKey="failed"    name="Failed"    fill="#EF476F" radius={[4,4,0,0]} maxBarSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Driver performance table */}
            {driverPerf.length > 0 && (
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Driver Leaderboard</span>
                    </div>
                    <div className="table-wrapper">
                        <table>
                            <thead><tr><th>#</th><th>Driver</th><th>Total</th><th>Delivered</th><th>Failed</th><th>Success Rate</th></tr></thead>
                            <tbody>
                                {driverPerf.map((d, i) => {
                                    const rate = Math.round(d.successRate || 0);
                                    return (
                                        <tr key={d._id}>
                                            <td style={{ fontWeight:700, color:'var(--text-muted)', fontSize:13 }}>#{i+1}</td>
                                            <td>
                                                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                                    <div style={{
                                                        width:30, height:30, borderRadius:'50%',
                                                        background: i === 0 ? 'linear-gradient(135deg, #f59e0b, #fcd34d)' :
                                                                    i === 1 ? 'linear-gradient(135deg, #9ca3af, #e5e7eb)' :
                                                                    i === 2 ? 'linear-gradient(135deg, #92400e, #d97706)' :
                                                                    'linear-gradient(135deg, var(--blue), var(--blue-light))',
                                                        display:'flex', alignItems:'center', justifyContent:'center',
                                                        fontSize:12, fontWeight:700, color: i < 3 ? '#fff' : '#fff', flexShrink:0,
                                                    }}>
                                                        {d.driverName?.[0]?.toUpperCase()}
                                                    </div>
                                                    <span style={{ fontWeight:600, fontSize:14 }}>{d.driverName}</span>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight:600 }}>{d.total}</td>
                                            <td><span style={{ color:'var(--success)', fontWeight:700 }}>{d.delivered}</span></td>
                                            <td><span style={{ color: d.failed > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: d.failed > 0 ? 700 : 400 }}>{d.failed}</span></td>
                                            <td>
                                                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                                    <div style={{ flex:1, height:6, background:'var(--border)', borderRadius:3, overflow:'hidden' }}>
                                                        <div style={{
                                                        height:'100%', borderRadius:3, width:`${rate}%`,
                                                        background: rate >= 80 ? 'var(--success)' : rate >= 60 ? 'var(--accent)' : 'var(--danger)',
                                                        transition:'width 0.5s',
                                                        }} />
                                                    </div>
                                                    <span style={{ fontSize:13, fontWeight:700, minWidth:36 }}>{rate}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty state if no data at all */}
            {!loading && overview?.total === 0 && (
                <div className="card card-padded" style={{ textAlign:'center', padding:'48px 24px' }}>
                    <div style={{ fontSize:48, marginBottom:16 }}>📊</div>
                    <h3 style={{ fontFamily:'var(--font-display)', fontSize:20, marginBottom:10 }}>No data yet</h3>
                    <p style={{ color:'var(--text-secondary)', maxWidth:400, margin:'0 auto' }}>
                        Reports will populate here once dispatchers start creating and completing shipments.
                        Use the <strong>demo seed button</strong> on the login page to create sample data.
                    </p>
                </div>
            )}
        </div>
    );
}