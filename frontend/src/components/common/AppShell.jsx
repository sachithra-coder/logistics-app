import React, { useState } from "react";
import { Outlet } from "react-router-dom";
// Side bar and top bar

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

            {/* sidebar code */}

            <div className="main-content">
                {/* topbar */}
                <main className="page-content">
                    <Outlet/>
                </main>
            </div>
        </div>
    );
}