import React from 'react';
import { Link } from 'react-router-dom';

// Re-uses dispatcher dashboard which already has full ship management
export default function ManageShipments() {
  return (
    <div className="animate-fadeIn">
      <div className="alert alert-info" style={{ marginBottom: 20 }}>
        💡 Full shipment management is available on the <Link to="/dispatcher/dashboard" style={{ fontWeight:700 }}>Live Dashboard →</Link>
      </div>
      <div className="card card-padded" style={{ textAlign:'center', padding:'48px 24px' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🗺️</div>
        <h3 style={{ fontFamily:'var(--font-display)', fontSize:20, marginBottom:10 }}>Use the Live Dashboard</h3>
        <p style={{ color:'var(--text-secondary)', maxWidth:400, margin:'0 auto 24px' }}>
          The Live Dashboard gives you real-time shipment management, driver assignment, status filtering, and live driver location updates all in one place.
        </p>
        <Link to="/dispatcher/dashboard" className="btn btn-primary">Open Live Dashboard →</Link>
      </div>
    </div>
  );
}
