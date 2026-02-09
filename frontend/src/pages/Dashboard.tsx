import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const { signOut, user } = useAuth();

    return (
        <div style={{ padding: '40px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '28px' }}>Olá, {user?.name}</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Aqui está o resumo da sua oficina hoje.</p>
                </div>
                <button
                    onClick={signOut}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        background: 'var(--bg-secondary)',
                        color: 'var(--danger)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px'
                    }}
                >
                    <LogOut size={18} />
                    Sair
                </button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div className="glass-panel" style={{ padding: '24px' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Ordens em Aberto</p>
                    <h2 style={{ fontSize: '32px', marginTop: '8px' }}>12</h2>
                </div>
                <div className="glass-panel" style={{ padding: '24px' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Aguardando Aprovação</p>
                    <h2 style={{ fontSize: '32px', marginTop: '8px', color: 'var(--warning)' }}>5</h2>
                </div>
                <div className="glass-panel" style={{ padding: '24px' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Faturamento Mensal</p>
                    <h2 style={{ fontSize: '32px', marginTop: '8px', color: 'var(--success)' }}>R$ 4.250</h2>
                </div>
            </div>
        </div>
    );
};
