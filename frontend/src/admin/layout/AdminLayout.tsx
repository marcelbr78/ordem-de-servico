import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--bg-primary)', overflow: 'hidden', color: 'var(--text-primary)', fontFamily: 'system-ui, sans-serif' }}>
            <Sidebar />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
                <Topbar />

                {/* Ambient Glow */}
                <div className="accent-glow" style={{ top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '800px', background: 'var(--accent-primary)', opacity: 0.15, pointerEvents: 'none' }} />

                <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '32px', position: 'relative', zIndex: 1 }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
