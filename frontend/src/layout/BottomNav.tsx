import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Users, Package, MoreHorizontal } from 'lucide-react';

const NAV_ITEMS = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Ordens', path: '/orders', icon: ShoppingCart },
    { name: 'Clientes', path: '/clients', icon: Users },
    { name: 'Estoque', path: '/inventory', icon: Package },
    { name: 'Mais', path: '/settings', icon: MoreHorizontal },
];

export const BottomNav: React.FC = () => (
    <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: '60px',
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: 'rgba(15, 17, 26, 0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '0.5px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'stretch',
        zIndex: 50,
    }}>
        {NAV_ITEMS.map(({ name, path, icon: Icon }) => (
            <NavLink key={path} to={path} style={({ isActive }) => ({
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '3px', padding: '6px 4px',
                textDecoration: 'none',
                color: isActive ? 'var(--accent-primary)' : 'rgba(255,255,255,0.4)',
                transition: 'color 0.2s',
                minHeight: '44px',
            })}>
                {({ isActive }) => (
                    <>
                        <div style={{
                            width: '36px', height: '22px', borderRadius: '11px',
                            background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.2s',
                        }}>
                            <Icon size={19} />
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: isActive ? 600 : 400, letterSpacing: '0.2px' }}>
                            {name}
                        </span>
                    </>
                )}
            </NavLink>
        ))}
    </nav>
);
