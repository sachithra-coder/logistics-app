import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from "./context/AuthContext";
import './styles/global.css';

// Layout
import AppShell from './components/common/AppShell';

// Auth
import Login from './pages/Login';
import Register from './pages/Register';

// Customer
import CustomerDashboard from "./pages/customer/Dashboard";
import TrackShipment from './pages/customer/TrackShipment';
// import MyShipments from './pages/customer/MyShipments';

// Dispatcher
// import DispatcherDashboard from  './pages/dispatcher/Dashboard';
// import ManageShipments from './pages/dispatcher/ManageShipments';

// Driver
// import DriverDashboard from './pages/driver/Dashboard';

// Manger
// import ManagerDashboard from './pages/manager/Dashboard';

// Shared
// import NotFound from './pages/NotFound';
// import Profile from './pages/Profile';

function PrivateRoute({ children, roles }) {
    const { user, loading } = useAuth();
    if (loading) return (
        <div className="loading-center" style={{ minHeight: '100vh' }}>
            <div className="spinner" />
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading...</span>
        </div>
    );
    if (!user) 
        return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user.role))
        return <Navigate to={getRoleHome(user.role)} replace />;
    return children;
}

function PublicRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (user)
        return <Navigate to={getRoleHome(user.role)} replace />;
    return children;
}

export function getRoleHome(role) {
    switch(role) {
        case 'customer': return '/customer/dashboard';
        case 'dispatcher': return '/dispatcher/dashboard';
        case 'driver': return '/driver/dashboard';
        case 'manager': return '/manager/dashboard';
        default: return '/login';
    }
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                    <Route path="/track" element={<TrackShipment public />} />
                    <Route path="/track/:trackingId" element={<TrackShipment public />} />

                    {/* Customer */}
                    <Route path="/customer" element={
                        <PrivateRoute roles={['customer']}>
                            <AppShell />
                        </PrivateRoute>
                    }>
                        <Route path="dashboard" element={<CustomerDashboard />} />
                        {/* <Route path="track" element={<TrackShipment />} />
                        <Route path="shipment" element={<MyShipments />} />
                        <Route path="profile" element={<Profile />} /> */}
                    </Route>

                    {/* Dispatcher */}
                    {/* <Route path="/dispatcher" element={
                        <PrivateRoute roles={['dispatcher']}>
                            <AppShell />
                        </PrivateRoute>
                    }>
                        <Route path="dashboard" element={<DispatcherDashboard />} />
                        <Route path="shipments" element={<ManageShipments />} />
                        <Route path="profile" element={<Profile />} />
                    </Route> */}

                    {/* Driver */}
                    {/* <Route path="/driver" element={
                        <PrivateRoute roles={['driver']}>
                            <AppShell />
                        </PrivateRoute>
                    }>
                        <Route path="dashboard" element={<DriverDashboard />} />
                        <Route path="profile" element={<Profile />} />
                    </Route> */}

                    {/* Manager */}
                    {/* <Route path="/manager" element={
                        <PrivateRoute roles={['manager']}>
                            <AppShell />
                        </PrivateRoute>
                    }>
                        <Route path="dashboard" element={<ManagerDashboard />} />
                        <Route path="profile" element={<Profile />} />
                    </Route>

                    <Route path="*" element={<NotFound />} /> */}

                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}