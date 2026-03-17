import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, ShoppingCart, Users, Package, DollarSign,
    Settings, ScrollText, Landmark, Blocks, Cpu,
    ChevronLeft, ChevronRight, Box, Activity, CreditCard, Award,
    LayoutGrid, UserPlus, Brain, Store, BarChart2, Kanban, Calendar, Shield, Receipt, Truck,
} from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    isDesktop: boolean;
    collapsed: boolean;
    onClose: () => void;
    onToggleCollapse: () => void;
}

// Links agrupados por seção
const LINK_GROUPS = [
    {
        label: 'OS & Atendimento',
        links: [
            { name: 'Dashboard',        path: '/dashboard', icon: LayoutDashboard },
            { name: 'Ordens de Serviço', path: '/orders',   icon: ShoppingCart },
            { name: 'Kanban',           path: '/kanban',    icon: Kanban },
            { name: 'Agenda',           path: '/schedule',  icon: Calendar },
            { name: 'Garantias',        path: '/warranty',  icon: Shield },
        ],
    },
    {
        label: 'Cadastros',
        links: [
            { name: 'Clientes',    path: '/clients',   icon: Users },
            { name: 'Fornecedores', path: '/suppliers', icon: Truck },
            { name: 'Estoque',     path: '/inventory', icon: Package },
        ],
    },
    {
        label: 'Financeiro',
        links: [
            { name: 'Financeiro',      path: '/finance',        icon: DollarSign },
            { name: 'Comissões',       path: '/commissions',    icon: Award },
            { name: 'Contas Bancárias', path: '/bank-accounts', icon: Landmark },
        ],
    },
    {
        label: 'Relatórios & Ferramentas',
        links: [
            { name: 'Relatórios',          path: '/reports',     icon: BarChart2 },
            { name: 'Diagnóstico de Placa', path: '/diagnostico', icon: Cpu },
            { name: 'App Store',           path: '/marketplace', icon: Blocks },
        ],
    },
];

// Flat list para compatibilidade
const MAIN_LINKS = LINK_GROUPS.flatMap(g => g.links);

const BOTTOM_LINKS = [
    { name: 'Notas Fiscais', path: '/fiscal', icon: Receipt },
    { name: 'Configurações', path: '/settings', icon: Settings },
    { name: 'Auditoria', path: '/audit', icon: ScrollText },
];

const SAAS_LINKS = [
    { name: 'Platform', path: '/portal-gestao/inicio', icon: Activity },
    { name: 'Lojas', path: '/masteradmin/tenants', icon: Store },
    { name: 'Billing', path: '/masteradmin/billing', icon: CreditCard },
    { name: 'Planos', path: '/masteradmin/plans', icon: LayoutGrid },
    { name: 'Signups', path: '/masteradmin/signups', icon: UserPlus },
    { name: 'AI Insights', path: '/masteradmin/insights', icon: Brain },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, isDesktop, collapsed, onClose, onToggleCollapse }) => {
    const { user } = useAuth();
    const isSuperAdmin =
        user?.role === 'super_admin' ||
        (typeof user?.role === 'string' && user.role.toLowerCase() === 'super_admin');

    const w = collapsed ? 72 : 260;

    const renderLink = (item: { name: string; path: string; icon: React.ElementType }, isSaas = false) => {
        const Icon = item.icon;
        return (
            <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                title={collapsed ? item.name : undefined}
                style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: collapsed ? 0 : '10px',
                    padding: collapsed ? '10px' : '10px 12px',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '14px',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                    backgroundColor: isActive
                        ? isSaas ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.06)'
                        : 'transparent',
                    border: isActive && isSaas
                        ? '0.5px solid rgba(59,130,246,0.25)'
                        : '0.5px solid transparent',
                    transition: 'all 0.15s',
                    minHeight: '44px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                })}
            >
                {({ isActive }: { isActive: boolean }) => (
                    <>
                        <Icon
                            size={18}
                            color={isActive ? (isSaas ? '#3b82f6' : 'var(--accent-primary)') : 'rgba(255,255,255,0.35)'}
                            style={{ flexShrink: 0 }}
                        />
                        {!collapsed && (
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.name}
                            </span>
                        )}
                    </>
                )}
            </NavLink>
        );
    };

    return (
        <aside style={{
            width: `${w}px`,
            minWidth: `${w}px`,
            backgroundColor: 'var(--bg-secondary)',
            borderRight: '0.5px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            flexShrink: 0,
            position: isDesktop ? 'relative' : 'fixed',
            top: 0,
            left: 0,
            zIndex: 50,
            transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1), transform 0.25s cubic-bezier(0.4,0,0.2,1)',
            transform: isOpen ? 'translateX(0)' : `translateX(-${w}px)`,
        }}>
            <div style={{
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
                padding: collapsed ? '0 12px' : '0 16px',
                borderBottom: '0.5px solid var(--border-color)',
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <div style={{
                        width: '32px', height: '32px', minWidth: '32px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Box size={18} color="#fff" />
                    </div>
                    {!collapsed && (
                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                            <span style={{ fontWeight: 800, fontSize: '18px', color: '#fff', letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>
                                OS4U
                            </span>
                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.5px', marginTop: '2px' }}>
                                v{(typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.1.2') as string}
                            </span>
                        </div>
                    )}
                </div>
                {!isDesktop && !collapsed && (
                    <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.5)', padding: '6px', flexShrink: 0, minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronLeft size={20} />
                    </button>
                )}
            </div>

            <nav style={{
                flex: 1,
                padding: collapsed ? '12px 8px' : '16px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                overflowY: 'auto',
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
            }}>
                {LINK_GROUPS.map((group, gi) => (
                    <React.Fragment key={group.label}>
                        {gi > 0 && <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.05)', margin: '6px 0' }} />}
                        {!collapsed && (
                            <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 12px 4px', marginTop: gi === 0 ? '4px' : '0' }}>
                                {group.label}
                            </div>
                        )}
                        {group.links.map(item => renderLink(item))}
                    </React.Fragment>
                ))}
                <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />
                {BOTTOM_LINKS.map(item => renderLink(item))}
                {isSuperAdmin && (
                    <>
                        <div style={{ height: '0.5px', background: 'rgba(59,130,246,0.2)', margin: '8px 0' }} />
                        {!collapsed && (
                            <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(59,130,246,0.55)', textTransform: 'uppercase', letterSpacing: '1px', padding: '0 12px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#3b82f6' }} />
                                Platform SaaS
                            </div>
                        )}
                        {SAAS_LINKS.map(item => renderLink(item, true))}
                    </>
                )}
            </nav>

            {isDesktop && (
                <div style={{ padding: collapsed ? '12px 8px' : '12px 10px', borderTop: '0.5px solid var(--border-color)', flexShrink: 0 }}>
                    <button
                        onClick={onToggleCollapse}
                        title={collapsed ? 'Expandir menu' : 'Recolher menu'}
                        style={{
                            width: '100%', padding: '8px', display: 'flex',
                            alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
                            gap: '8px', color: 'rgba(255,255,255,0.35)', borderRadius: '8px',
                            background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)',
                            fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s', minHeight: '36px',
                        }}
                    >
                        {collapsed
                            ? <ChevronRight size={15} />
                            : <><ChevronLeft size={15} /><span>Recolher</span></>
                        }
                    </button>
                </div>
            )}
        </aside>
    );
};
