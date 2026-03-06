import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    ShoppingCart,
    Calculator,
    Package,
    Activity,
    Users,
    CreditCard,
    ChevronLeft,
    ChevronRight,
    Box,
    LayoutGrid,
    UserPlus,
    Brain,
    Blocks
} from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    isDesktop: boolean;
    collapsed: boolean;
    onClose: () => void;
    onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, isDesktop, collapsed, onClose, onToggleCollapse }) => {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'super_admin' || (typeof user?.role === 'string' && user.role.toLowerCase() === 'super_admin');

    const mainSystemLinks = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Ordens', path: '/orders', icon: ShoppingCart },
        { name: 'Orçamentos', path: '/quotes', icon: Calculator },
        { name: 'Estoque', path: '/inventory', icon: Package },
        { name: 'App Store', path: '/marketplace', icon: Blocks },
    ];

    const saasSystemLinks = [
        { name: 'Platform', path: '/portal-gestao/inicio', icon: Activity },
        { name: 'Tenants', path: '/masteradmin/tenants', icon: Users },
        { name: 'Billing', path: '/masteradmin/billing', icon: CreditCard },
        { name: 'Planos', path: '/masteradmin/plans', icon: LayoutGrid },
        { name: 'Signups', path: '/masteradmin/signups', icon: UserPlus },
        { name: 'Insights', path: '/masteradmin/insights', icon: Brain },
    ];

    const sidebarWidth = collapsed ? 72 : 260;

    const renderLink = (item: { name: string; path: string; icon: React.ElementType }, isSaas = false) => {
        const Icon = item.icon;
        const isRouteActive = window.location.pathname.startsWith(item.path);
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
                    gap: collapsed ? 0 : '12px',
                    padding: collapsed ? '12px' : '12px 14px',
                    borderRadius: '10px',
                    transition: 'all 0.2s',
                    textDecoration: 'none',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                    backgroundColor: isActive
                        ? (isSaas ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)')
                        : 'transparent',
                    border: isActive && isSaas
                        ? '1px solid rgba(59, 130, 246, 0.2)'
                        : '1px solid transparent',
                })}
            >
                <Icon size={20} color={isRouteActive ? 'var(--accent-primary)' : 'rgba(255,255,255,0.4)'} />
                {!collapsed && (
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', opacity: 1, transition: 'opacity 0.2s' }}>
                        {item.name}
                    </span>
                )}
            </NavLink>
        );
    };

    return (
        <aside style={{
            width: `${sidebarWidth}px`,
            minWidth: `${sidebarWidth}px`,
            backgroundColor: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            flexShrink: 0,
            position: isDesktop ? 'relative' : 'fixed',
            top: 0,
            left: 0,
            zIndex: 50,
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isOpen ? 'translateX(0)' : `translateX(-${sidebarWidth}px)`,
        }}>
            {/* Header / Logo */}
            <div style={{
                height: '70px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
                padding: collapsed ? '0 12px' : '0 20px',
                borderBottom: '1px solid var(--border-color)',
                flexShrink: 0,
                overflow: 'hidden'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        minWidth: '32px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Box size={20} color="#fff" />
                    </div>
                    {!collapsed && (
                        <span className="gradient-text" style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>
                            OS4U
                        </span>
                    )}
                </div>
                {!isDesktop && !collapsed && (
                    <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.6)', padding: '4px', flexShrink: 0 }}>
                        <ChevronLeft size={24} />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav style={{
                flex: 1,
                padding: collapsed ? '16px 8px' : '24px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                overflowY: 'auto',
                overflowX: 'hidden'
            }}>
                {/* Main System Section */}
                <div>
                    {!collapsed && (
                        <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', paddingLeft: '12px' }}>
                            Main System
                        </div>
                    )}
                    {collapsed && <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 4px 12px' }} />}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {mainSystemLinks.map((item) => renderLink(item))}
                    </div>
                </div>

                {/* Platform SaaS Section */}
                {isSuperAdmin && (
                    <div>
                        {!collapsed && (
                            <div style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(59, 130, 246, 0.6)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', paddingLeft: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
                                Platform SaaS
                            </div>
                        )}
                        {collapsed && <div style={{ height: '1px', background: 'rgba(59, 130, 246, 0.2)', margin: '0 4px 12px' }} />}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {saasSystemLinks.map((item) => renderLink(item, true))}
                        </div>
                    </div>
                )}
            </nav>

            {/* Footer / Collapse Toggle */}
            <div style={{
                padding: collapsed ? '16px 8px' : '16px 12px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-end',
                flexShrink: 0
            }}>
                {isDesktop && (
                    <button
                        onClick={onToggleCollapse}
                        title={collapsed ? 'Expandir menu' : 'Recolher menu'}
                        style={{
                            padding: '8px',
                            color: 'rgba(255,255,255,0.4)',
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            width: '100%',
                            maxWidth: collapsed ? '40px' : '120px',
                            cursor: 'pointer'
                        }}
                    >
                        {collapsed
                            ? <ChevronRight size={16} />
                            : <><ChevronLeft size={16} /><span style={{ fontSize: '12px', marginLeft: '6px', whiteSpace: 'nowrap' }}>Recolher</span></>
                        }
                    </button>
                )}
                {!isDesktop && !collapsed && (
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>v1.0.0</span>
                )}
            </div>
        </aside>
    );
};
