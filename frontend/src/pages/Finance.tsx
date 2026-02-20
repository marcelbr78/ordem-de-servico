import React, { useState, useEffect } from 'react';
import { Plus, ArrowUpCircle, ArrowDownCircle, Calendar } from 'lucide-react';
import api from '../services/api';
import { FinanceSummary } from '../components/finance/FinanceSummary';
import { TransactionModal } from '../components/finance/TransactionModal';

export const Finance: React.FC = () => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filter, setFilter] = useState('ALL'); // ALL, INCOME, EXPENSE

    const fetchData = async () => {
        setLoading(true);
        try {
            const [listRes, summaryRes] = await Promise.all([
                api.get('/finance'),
                api.get('/finance/summary')
            ]);
            setTransactions(listRes.data);
            setSummary(summaryRes.data);
        } catch (error) {
            console.error('Error fetching finance data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredTransactions = transactions.filter(t => {
        if (filter === 'ALL') return true;
        return t.type === filter;
    });

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
    const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');



    return (
        <div className="animate-fade">
            <div className="flex justify-between items-center mb-8">
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>Financeiro</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    style={{
                        background: 'var(--primary)', color: '#fff', border: 'none',
                        padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600
                    }}
                >
                    <Plus size={20} /> Nova Transação
                </button>
            </div>

            <FinanceSummary summary={summary} loading={loading} />

            <div className="glass-panel" style={{ padding: '24px' }}>
                {/* Filters */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
                    <button
                        onClick={() => setFilter('ALL')}
                        style={{
                            background: filter === 'ALL' ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: filter === 'ALL' ? '#fff' : 'rgba(255,255,255,0.5)',
                            border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500
                        }}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilter('INCOME')}
                        style={{
                            background: filter === 'INCOME' ? 'rgba(16,185,129,0.1)' : 'transparent',
                            color: filter === 'INCOME' ? '#10b981' : 'rgba(255,255,255,0.5)',
                            border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500
                        }}
                    >
                        Entradas
                    </button>
                    <button
                        onClick={() => setFilter('EXPENSE')}
                        style={{
                            background: filter === 'EXPENSE' ? 'rgba(239,68,68,0.1)' : 'transparent',
                            color: filter === 'EXPENSE' ? '#ef4444' : 'rgba(255,255,255,0.5)',
                            border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500
                        }}
                    >
                        Saídas
                    </button>
                </div>

                {/* List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {loading ? (
                        <p className="text-gray-500 text-center py-8">Carregando...</p>
                    ) : filteredTransactions.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Nenhuma transação encontrada.</p>
                    ) : (
                        filteredTransactions.map((t) => (
                            <div key={t.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        background: t.type === 'INCOME' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: t.type === 'INCOME' ? '#10b981' : '#ef4444'
                                    }}>
                                        {t.type === 'INCOME' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 600, color: '#fff' }}>{t.description || t.category}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {formatDate(t.createdAt)}</span>
                                            <span>•</span>
                                            <span>{t.paymentMethod}</span>
                                            {t.orderId && <span style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '2px 6px', borderRadius: '4px' }}>OS #{t.orderId.slice(-4)}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ margin: 0, fontWeight: 700, fontSize: '16px', color: t.type === 'INCOME' ? '#10b981' : '#ef4444' }}>
                                        {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
                                    </p>
                                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{t.category}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {isModalOpen && (
                <TransactionModal
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchData();
                    }}
                />
            )}
        </div>
    );
};
