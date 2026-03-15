import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Shield } from 'lucide-react';

export const Topbar: React.FC = () => {
    const { user, signOut } = useAuth();

    return (
        <header style={{ height: '70px', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <Shield size={18} color="var(--accent-primary)" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#fff', fontSize: '15px', fontWeight: 600, lineHeight: 1.2 }}>Master Panel</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>CEO Config</span>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{user?.name || 'Super Admin'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--accent-primary)', textTransform: 'capitalize' }}>{user?.role?.replace('_', ' ')}</div>
                </div>

                <button
                    onClick={signOut}
                    style={{ padding: '10px', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Sair do sistema Master"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
};
