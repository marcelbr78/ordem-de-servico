import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    ClipboardList,
    Users,
    Package,
    DollarSign,
    LogOut,
    Menu,
    X
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { signOut } = useAuth();
    const [isOpen, setIsOpen] = React.useState(true);

    const menuItems = [
        { name: 'Início', icon: <LayoutDashboard size={20} />, path: '/' },
        { name: 'Ordens', icon: <ClipboardList size={20} />, path: '/orders' },
        { name: 'Clientes', icon: <Users size={20} />, path: '/clients' },
        { name: 'Estoque', icon: <Package size={20} />, path: '/inventory' },
        { name: 'Financeiro', icon: <DollarSign size={20} />, path: '/finance' },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            {/* Sidebar */}
            <aside style={{
                width: isOpen ? '260px' : '80px',
                background: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border-color)',
                padding: '24px 16px',
                transition: 'width 0.3s ease',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 8px' }}>
                    <div style={{
                        minWidth: '32px',
                        height: '32px',
                        background: 'var(--accent-primary)',
                        borderRadius: '8px',
                        boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)'
                    }} />
                    {isOpen && <span style={{ fontWeight: '700', fontSize: '18px' }}>TechManager</span>}
                </div>

                <nav style={{ flex: 1 }}>
                    {menuItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
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
                            {item.icon}
                            {isOpen && <span>{item.name}</span>}
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
                    {isOpen && <span>Sair</span>}
                </button>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {children}
                </div>
            </main>
        </div>
    );
};
