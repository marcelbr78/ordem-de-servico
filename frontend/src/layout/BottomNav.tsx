import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Users, Package, MoreHorizontal } from 'lucide-react';

const NAV_ITEMS = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Ordens',    path: '/orders',    icon: ShoppingCart },
    { name: 'Clientes',  path: '/clients',   icon: Users },
    { name: 'Estoque',   path: '/inventory', icon: Package },
    { name: 'Mais',      path: '/settings',  icon: MoreHorizontal },
];

export const BottomNav: React.FC = () => {
    const location = useLocation();

    return (
        <nav style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            // Altura base + safe area para iPhone com home indicator
            paddingBottom: 'env(safe-area-inset-bottom)',
            background: 'rgba(10,10,12,0.96)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderTop: '0.5px solid rgba(255,255,255,0.07)',
            display: 'flex',
            alignItems: 'stretch',
            zIndex: 100,
        }}>
            {NAV_ITEMS.map(({ name, path, icon: Icon }) => {
                const isActive = location.pathname.startsWith(path);
                return (
                    <NavLink
                        key={path}
                        to={path}
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            padding: '10px 4px 8px',
                            textDecoration: 'none',
                            color: isActive ? '#fff' : 'rgba(255,255,255,0.35)',
                            transition: 'color 0.15s',
                            minHeight: '52px',
                            WebkitTapHighlightColor: 'transparent',
                        }}
                    >
                        {/* Pill indicator no ícone ativo — estilo iOS 18 */}
                        <div style={{
                            width: '42px',
                            height: '26px',
                            borderRadius: '13px',
                            background: isActive ? 'rgba(59,130,246,0.18)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.2s',
                            marginBottom: '1px',
                        }}>
                            <Icon
                                size={20}
                                strokeWidth={isActive ? 2.2 : 1.7}
                                color={isActive ? '#60a5fa' : 'rgba(255,255,255,0.35)'}
                            />
                        </div>
                        <span style={{
                            fontSize: '10px',
                            fontWeight: isActive ? 600 : 400,
                            letterSpacing: '0.1px',
                            color: isActive ? '#60a5fa' : 'rgba(255,255,255,0.35)',
                        }}>
                            {name}
                        </span>
                    </NavLink>
                );
            })}
        </nav>
    );
};
