import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard } from 'lucide-react';

export const Sidebar: React.FC = () => {
    const menuItems = [
        { name: 'Dashboard', path: '/portal-gestao/inicio', icon: LayoutDashboard },
        { name: 'Tenants', path: '/masteradmin/tenants', icon: Users },
        { name: 'Billing', path: '/masteradmin/billing', icon: CreditCard },
    ];

    return (
        <aside style={{ width: '260px', backgroundColor: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0 }}>
            <div style={{ height: '70px', display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: '1px solid var(--border-color)' }}>
                <span className="gradient-text" style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '1px' }}>
                    SaaS ADMIN
                </span>
            </div>
            <nav style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '14px 16px',
                                borderRadius: '12px',
                                transition: 'all 0.2s',
                                textDecoration: 'none',
                                fontWeight: isActive ? 600 : 500,
                                color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                                backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                border: isActive ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                            })}
                        >
                            <Icon size={20} color={window.location.pathname === item.path ? 'var(--accent-primary)' : 'rgba(255,255,255,0.6)'} />
                            {item.name}
                        </NavLink>
                    );
                })}
            </nav>
            <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', fontSize: '12px', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
                v1.0.0 Global Platform
            </div>
        </aside>
    );
};
