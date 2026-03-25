import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Activity, Brain, Users, UserPlus,
    BarChart3, CreditCard, ToggleRight, Megaphone,
    MessageSquare, Shield, TrendingUp, Monitor, MessageCircle,
} from 'lucide-react';

const GROUPS = [
    {
        label: 'Visão Geral',
        items: [
            { name: 'Dashboard',       path: '/portal-gestao/inicio',       icon: LayoutDashboard },
            { name: 'Health Monitor',  path: '/masteradmin/health',          icon: Activity },
            { name: 'AI Insights',     path: '/masteradmin/insights',        icon: Brain },
            { name: 'Analytics',       path: '/masteradmin/analytics',       icon: TrendingUp },
        ],
    },
    {
        label: 'Clientes',
        items: [
            { name: 'Tenants',         path: '/masteradmin/tenants',         icon: Users },
            { name: 'Novos Cadastros', path: '/masteradmin/signups',         icon: UserPlus },
            { name: 'Onboarding',      path: '/masteradmin/onboarding',      icon: BarChart3 },
        ],
    },
    {
        label: 'Financeiro',
        items: [
            { name: 'Faturamento',     path: '/masteradmin/billing',         icon: CreditCard },
            { name: 'Planos',          path: '/masteradmin/plans',           icon: ToggleRight },
        ],
    },
    {
        label: 'Operações',
        items: [
            { name: 'Comunicados',     path: '/masteradmin/broadcasts',      icon: Megaphone },
            { name: 'Suporte',         path: '/masteradmin/support',         icon: MessageSquare },
            { name: 'Evolution',       path: '/masteradmin/evolution',       icon: MessageCircle },
            { name: 'Kiosk',           path: '/masteradmin/kiosk',           icon: Monitor },
            { name: 'Feature Flags',   path: '/masteradmin/feature-flags',   icon: ToggleRight },
            { name: 'Auditoria',       path: '/masteradmin/audit',           icon: Shield },
        ],
    },
];

export const Sidebar: React.FC = () => (
    <aside style={{ width: '215px', background: '#080810', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0 }}>
        <div style={{ height: '56px', display: 'flex', alignItems: 'center', padding: '0 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', gap: '9px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Shield size={13} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '13px', color: '#fff', letterSpacing: '0.3px' }}>OS4U Admin</span>
        </div>
        <nav style={{ flex: 1, padding: '10px 7px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {GROUPS.map(group => (
                <div key={group.label}>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '1.5px', padding: '0 9px', marginBottom: '3px' }}>{group.label}</div>
                    {group.items.map(item => {
                        const Icon = item.icon;
                        return (
                            <NavLink key={item.path} to={item.path} style={({ isActive }) => ({
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '7px 9px', borderRadius: '7px', transition: 'all 0.12s',
                                textDecoration: 'none', fontSize: '12.5px', marginBottom: '1px',
                                fontWeight: isActive ? 600 : 400,
                                color: isActive ? '#fff' : 'rgba(255,255,255,0.48)',
                                background: isActive ? 'rgba(59,130,246,0.14)' : 'transparent',
                                border: isActive ? '1px solid rgba(59,130,246,0.28)' : '1px solid transparent',
                            })}>
                                {({ isActive }) => (
                                    <><Icon size={13} color={isActive ? '#60a5fa' : 'rgba(255,255,255,0.3)'} />{item.name}</>
                                )}
                            </NavLink>
                        );
                    })}
                </div>
            ))}
        </nav>
        <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>
            OS4U Platform v2.0
        </div>
    </aside>
);
