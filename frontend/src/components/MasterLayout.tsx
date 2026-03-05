import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Building2,
    Users,
    LogOut,
    ShieldCheck,
    Server,
    Settings,
    Bell,
    CreditCard
} from 'lucide-react';

export const MasterLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { signOut, user } = useAuth();
    const navigate = useNavigate();

    const menuItems = [
        { label: 'Estatísticas', icon: LayoutDashboard, path: '/portal-gestao/inicio' },
        { label: 'Gerenciar Lojas', icon: Building2, path: '/portal-gestao/tenants' },
        { label: 'Assinaturas', icon: CreditCard, path: '/portal-gestao/billing' },
        { label: 'Audit Global', icon: ShieldCheck, path: '/portal-gestao/audit' },
        { label: 'Infraestrutura', icon: Server, path: '/portal-gestao/infra' },
        { label: 'Configurações Master', icon: Settings, path: '/portal-gestao/settings' },
    ];

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            background: '#0a0a0c', // Darker background for Master
            color: '#fff',
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* Sidebar Master */}
            <aside style={{
                width: '280px',
                background: 'rgba(20, 20, 25, 0.8)',
                backdropFilter: 'blur(20px)',
                borderRight: '1px solid rgba(255, 255, 255, 0.05)',
                padding: '30px 20px',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                height: '100vh',
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '50px', padding: '0 10px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)'
                    }}>
                        <ShieldCheck size={24} color="#fff" />
                    </div>
                    <div>
                        <div style={{ fontWeight: '800', fontSize: '18px', letterSpacing: '-0.5px' }}>OS4U MASTER</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '600', textTransform: 'uppercase' }}>Founder Portal</div>
                    </div>
                </div>

                <nav style={{ flex: 1 }}>
                    {menuItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                padding: '14px 18px',
                                borderRadius: '14px',
                                textDecoration: 'none',
                                color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                                background: isActive ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.15), transparent)' : 'transparent',
                                borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                                marginBottom: '8px',
                                transition: 'all 0.3s ease',
                                fontWeight: isActive ? '600' : '500'
                            })}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', marginBottom: '20px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={18} />
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Super Admin</div>
                        </div>
                    </div>
                    <button
                        onClick={signOut}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '14px',
                            color: '#ef4444',
                            width: '100%',
                            borderRadius: '12px',
                            background: 'rgba(239, 68, 68, 0.05)',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all 0.2s'
                        }}
                    >
                        <LogOut size={20} />
                        <span>Encerrar Sessão</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Master */}
            <main style={{
                flex: 1,
                marginLeft: '280px',
                padding: '40px',
                background: 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.05), transparent 400px)'
            }}>
                <header style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px', marginBottom: '40px' }}>
                    <button style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}>
                        <Bell size={20} />
                    </button>
                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                    <button
                        onClick={() => navigate('/')}
                        style={{ background: 'var(--accent-primary)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}
                    >
                        Ver Landing Page
                    </button>
                </header>

                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    {children}
                </div>
            </main>
        </div>
    );
};
