import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface AppLayoutProps {
    children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setWindowWidth(width);
            if (width >= 1024) {
                setIsSidebarOpen(true);
            } else {
                setIsSidebarOpen(false);
                setIsCollapsed(false); // Reset collapse on mobile/tablet
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth < 768;
    const isDesktop = windowWidth >= 1024;

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebarMobile = () => {
        if (!isDesktop) setIsSidebarOpen(false);
    };
    const toggleCollapse = () => setIsCollapsed(!isCollapsed);

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--bg-primary)', overflow: 'hidden', color: 'var(--text-primary)', fontFamily: 'system-ui, sans-serif' }}>

            {/* Mobile Overlay */}
            {!isDesktop && isSidebarOpen && (
                <div
                    onClick={closeSidebarMobile}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 40 }}
                />
            )}

            {/* Sidebar */}
            <Sidebar
                isOpen={isSidebarOpen}
                isDesktop={isDesktop}
                collapsed={isDesktop && isCollapsed}
                onClose={closeSidebarMobile}
                onToggleCollapse={toggleCollapse}
            />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
                <Topbar toggleSidebar={toggleSidebar} isDesktop={isDesktop} />

                {/* Ambient Glow */}
                <div style={{ top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '800px', background: 'var(--accent-primary)', opacity: 0.1, pointerEvents: 'none', position: 'absolute', borderRadius: '50%', filter: 'blur(120px)', zIndex: 0 }} />

                <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: isMobile ? '16px' : '32px', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ width: '100%', margin: '0 auto', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
