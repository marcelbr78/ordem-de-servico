import React from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface SummaryProps {
    summary: {
        totalIncome: number;
        totalExpense: number;
        balance: number;
    };
    loading: boolean;
}

export const FinanceSummary: React.FC<SummaryProps> = ({ summary, loading }) => {
    const format = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const cards = [
        {
            label: 'Entradas',
            value: summary.totalIncome,
            icon: TrendingUp,
            color: '#10b981',
            bg: 'rgba(16,185,129,0.1)',
        },
        {
            label: 'Saídas',
            value: summary.totalExpense,
            icon: TrendingDown,
            color: '#ef4444',
            bg: 'rgba(239,68,68,0.1)',
        },
        {
            label: 'Saldo',
            value: summary.balance,
            icon: Wallet,
            color: summary.balance >= 0 ? '#3b82f6' : '#ef4444',
            bg: summary.balance >= 0 ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)',
        },
    ];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            {cards.map((card, i) => (
                <div key={i} className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '16px',
                        background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: card.color
                    }}>
                        <card.icon size={28} />
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{card.label}</p>
                        <h3 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 700, color: '#fff' }}>
                            {loading ? '...' : format(card.value)}
                        </h3>
                    </div>
                </div>
            ))}
        </div>
    );
};
