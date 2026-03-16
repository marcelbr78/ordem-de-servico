import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';

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
                setIsCollapsed(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // iPhone: < 768 | iPad: 768–1023 | Desktop: >= 1024
    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;
    const isDesktop = windowWidth >= 1024;

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const closeSidebarMobile = () => {
        if (!isDesktop) setIsSidebarOpen(false);
    };
    const toggleCollapse = () => setIsCollapsed(prev => !prev);

    // Padding do conteúdo principal
    const mainPadding = isMobile ? '12px 12px 80px' : isTablet ? '20px 20px 24px' : '28px 32px';

    return (
        <div style={{
            display: 'flex',
            height: '100dvh', // dvh: funciona melhor no iOS (considera barra de endereço)
            backgroundColor: 'var(--bg-primary)',
            overflow: 'hidden',
            color: 'var(--text-primary)',
            fontFamily: 'system-ui, sans-serif',
        }}>
            {/* Overlay mobile/tablet ao abrir sidebar */}
            {!isDesktop && isSidebarOpen && (
                <div
                    onClick={closeSidebarMobile}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.65)',
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)',
                        zIndex: 40,
                    }}
                />
            )}

            {/* Sidebar — position:fixed no mobile/tablet, relative no desktop */}
            {/* Só renderiza no mobile quando aberta para não deixar espaço vazio */}
            {(isDesktop || (!isMobile && isSidebarOpen) || (isMobile && isSidebarOpen)) && (
                <Sidebar
                    isOpen={isSidebarOpen}
                    isDesktop={isDesktop}
                    collapsed={isDesktop && isCollapsed}
                    onClose={closeSidebarMobile}
                    onToggleCollapse={toggleCollapse}
                />
            )}

            {/* Área principal */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
                <Topbar toggleSidebar={toggleSidebar} isDesktop={isDesktop} isMobile={isMobile} />

                <main style={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    padding: mainPadding,
                    position: 'relative',
                    zIndex: 1,
                    // Scroll suave no iOS
                    WebkitOverflowScrolling: 'touch',
                }}>
                    {children}
                </main>

                {/* Bottom navigation — apenas iPhone */}
                {isMobile && <BottomNav />}
            </div>
        </div>
    );
};
