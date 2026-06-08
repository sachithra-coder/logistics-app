import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";

export default function AppShell() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="app-shell">
            {/* mobile overlay */}
            { sidebarOpen && (
                <div 
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <Sidebar
                open={sidebarOpen}
                onClose={() => sidebarOpen(false)}
            />

            <div className="main-content">
                <Topbar onMenuClick={() => setSidebarOpen(true)}/>
                <main className="page-content">
                    <Outlet/>
                </main>
            </div>
        </div>
    );
}