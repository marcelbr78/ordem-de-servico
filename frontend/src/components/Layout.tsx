import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChangePasswordModal } from './ChangePasswordModal';
import {
    LayoutDashboard,
    ClipboardList,
    Users,
    Package,
    DollarSign,
    LogOut,
    Truck,
    Settings,
    Shield,
    Building2
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { signOut, user } = useAuth();
    const [isOpen, setIsOpen] = React.useState(true);
    const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
    const [showChangePassword, setShowChangePassword] = React.useState(false);

    React.useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) setIsOpen(false);
            else setIsOpen(true);
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // Init
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    React.useEffect(() => {
        if (user?.mustChangePassword) {
            setShowChangePassword(true);
        }
    }, [user]);

    const menuItems = [
        { label: 'Início', icon: LayoutDashboard, path: '/' },
        { label: 'Ordens', icon: ClipboardList, path: '/orders' },
        { label: 'Clientes', icon: Users, path: '/clients' },
        { label: 'Estoque', icon: Package, path: '/inventory' },
        { label: 'Fornecedores', icon: Truck, path: '/smartparts/suppliers' },
        { label: 'Financeiro', icon: DollarSign, path: '/finance' },
        { label: 'Contas Bancárias', icon: Building2, path: '/bank-accounts' },
        { label: 'Auditoria', icon: Shield, path: '/audit' },
        { label: 'Configurações', icon: Settings, path: '/settings' },
    ];

    const toggleSidebar = () => setIsOpen(!isOpen);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)', flexDirection: isMobile ? 'column' : 'row' }}>
            <ChangePasswordModal
                isOpen={showChangePassword}
                onSuccess={() => {
                    setShowChangePassword(false);
                    alert('Senha alterada com sucesso! Por favor, faça login novamente.');
                    signOut();
                }}
            />

            {/* Mobile Header */}
            {isMobile && (
                <header style={{
                    height: '60px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)',
                    display: 'flex', alignItems: 'center', padding: '0 16px', gap: '16px', position: 'sticky', top: 0, zIndex: 40
                }}>
                    <button onClick={toggleSidebar} style={{ color: 'var(--text-primary)', padding: '4px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>
                    <span style={{ fontWeight: 700, fontSize: '18px', color: '#fff' }}>TechManager</span>
                </header>
            )}

            {/* Mobile Overlay */}
            {isMobile && isOpen && (
                <div className="mobile-overlay" onClick={() => setIsOpen(false)} style={{ zIndex: 45 }} />
            )}

            {/* Sidebar */}
            <aside style={{
                width: isMobile ? '260px' : (isOpen ? '260px' : '80px'),
                background: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border-color)',
                padding: '24px 16px',
                transition: 'transform 0.3s ease, width 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                position: isMobile ? 'fixed' : 'relative',
                height: '100vh',
                zIndex: 50,
                top: 0, left: 0,
                transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
                boxShadow: isMobile && isOpen ? '4px 0 24px rgba(0,0,0,0.5)' : 'none'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 8px' }}>
                    <div style={{
                        minWidth: '32px',
                        height: '32px',
                        background: 'var(--accent-primary)',
                        borderRadius: '8px',
                        boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)'
                    }} />
                    {(isOpen || isMobile) && <span style={{ fontWeight: '700', fontSize: '18px' }}>TechManager</span>}
                </div>

                <nav style={{ flex: 1 }}>
                    {menuItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => isMobile && setIsOpen(false)}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                color: isActive ? 'white' : 'var(--text-secondary)',
                                background: isActive ? 'var(--bg-tertiary)' : 'transparent',
                                marginBottom: '4px',
                                transition: 'all 0.2s'
                            })}
                        >
                            <item.icon size={20} />
                            {(isOpen || isMobile) && <span>{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <button
                    onClick={signOut}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        color: 'var(--danger)',
                        width: '100%',
                        borderRadius: '8px'
                    }}
                >
                    <LogOut size={20} />
                    {(isOpen || isMobile) && <span>Sair</span>}
                </button>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, overflowY: 'auto', padding: '24px', width: '100%' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {children}
                </div>
            </main>
        </div>
    );
};
