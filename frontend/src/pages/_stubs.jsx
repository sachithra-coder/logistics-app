import React from 'react';
import { Link } from 'react-router-dom';

function ComingSoon({ title, icon, description, nextStep }) {
  return (
    <div>
      <div className="card card-padded" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 'var(--radius)',
            background: 'linear-gradient(135deg, var(--blue), var(--blue-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
          }}>{icon}</div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 2 }}>{title}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{description}</p>
          </div>
        </div>
      </div>
      <div className="card card-padded" style={{
        border: '2px dashed var(--border)', background: 'transparent',
        textAlign: 'center', padding: '48px 24px',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔧</div>
        <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>Coming in next build</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 400, margin: '0 auto 20px' }}>
          {nextStep}
        </p>
        <div style={{ display: 'inline-block', background: 'rgba(27,108,168,0.08)', color: 'var(--blue)', padding: '8px 20px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
          Shell ✓  →  This page (next)  →  Full app
        </div>
      </div>
    </div>
  );
}

export function CustomerDashboard() {
  return <ComingSoon title="Customer Dashboard" icon="🏠"
    description="Overview of your shipments and activity"
    nextStep='Say "Build the customer portal" to build this page with live shipment tracking, status cards, and reschedule functionality.' />;
}

export function TrackShipment() {
  return <ComingSoon title="Track Shipment" icon="📍"
    description="Real-time shipment tracking with map view"
    nextStep='Say "Build the customer portal" to build this page.' />;
}

export function MyShipments() {
  return <ComingSoon title="My Shipments" icon="📦"
    description="Full list of your past and current shipments"
    nextStep='Say "Build the customer portal" to build this page.' />;
}

export function DispatcherDashboard() {
  return <ComingSoon title="Live Dispatcher Dashboard" icon="🗺️"
    description="Live map of drivers, assign deliveries, monitor fleet"
    nextStep='Say "Build the dispatcher dashboard" to build this page with live map, driver tracking, and assignment modal.' />;
}

export function ManageShipments() {
  return <ComingSoon title="Manage Shipments" icon="📋"
    description="Create, assign and manage all shipments"
    nextStep='Say "Build the dispatcher dashboard" to build this page.' />;
}

export function DriverDashboard() {
  return <ComingSoon title="My Deliveries" icon="🚚"
    description="Mobile-optimised delivery list with route and status updates"
    nextStep='Say "Build the driver app" to build this page.' />;
}

export function ManagerDashboard() {
  return <ComingSoon title="Reports & Analytics" icon="📊"
    description="Delivery performance, driver stats, and operational insights"
    nextStep='Say "Build the manager reports" to build this page with charts and export.' />;
}
