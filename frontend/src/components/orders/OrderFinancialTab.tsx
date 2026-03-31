import React, { useState, useEffect } from 'react';
import { DollarSign, FileText, CheckCircle, CreditCard, Landmark, Plus, Save, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { CurrencyInput } from '../common/CurrencyInput';

interface OrderFinancialTabProps {
    order: any;
    totalParts: number;
    onDeliveryReceipt: () => void;
    onTransactionsLoaded?: (txs: any[]) => void;
}

export const OrderFinancialTab: React.FC<OrderFinancialTabProps> = ({
    order, totalParts, onDeliveryReceipt, onTransactionsLoaded,
}) => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loadingTx, setLoadingTx] = useState(false);
    const [showAddPayment, setShowAddPayment] = useState(false);
    const [newPayment, setNewPayment] = useState({ method: 'Dinheiro', amount: '', description: '', bankAccountId: '' });
    const [savingPayment, setSavingPayment] = useState(false);
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);

    const fetchTransactions = async () => {
        setLoadingTx(true);
        try {
            const res = await api.get(`/finance/order/${order.id}`);
            const txs = res.data || [];
            setTransactions(txs);
            onTransactionsLoaded?.(txs);
        } catch (e) {
            console.error('Erro ao carregar transações', e);
        } finally {
            setLoadingTx(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
        api.get('/bank-accounts').then(res => setBankAccounts(res.data || []));
    }, [order.id]);

    const handleAddPayment = async () => {
        if (!newPayment.amount || isNaN(parseFloat(newPayment.amount))) {
            alert('Informe um valor válido.');
            return;
        }
        setSavingPayment(true);
        try {
            await api.post('/finance', {
                type: 'INCOME',
                amount: parseFloat(newPayment.amount),
                paymentMethod: newPayment.method,
                category: 'OS Payment',
                description: newPayment.description || `Pagamento OS #${order.protocol}`,
                orderId: order.id,
                bankAccountId: newPayment.bankAccountId || undefined,
            });
            setNewPayment({ method: 'Dinheiro', amount: '', description: '', bankAccountId: '' });
            setShowAddPayment(false);
            fetchTransactions();
        } catch (e: any) {
            alert('Erro ao registrar pagamento: ' + (e?.response?.data?.message || e.message));
        } finally {
            setSavingPayment(false);
        }
    };

    const totalPago = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + parseFloat(t.amount), 0);
    const valorOS = totalParts || parseFloat(String(order.finalValue ?? 0)) || parseFloat(String(order.estimatedValue ?? 0)) || 0;
    const saldo = valorOS - totalPago;
    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    const PAYMENT_ICONS: Record<string, React.ReactNode> = {
        'Dinheiro': <DollarSign size={14} />,
        'PIX': <CheckCircle size={14} />,
        'Cartão de Crédito': <CreditCard size={14} />,
        'Cartão de Débito': <CreditCard size={14} />,
        'Transferência': <Landmark size={14} />,
        'Boleto': <FileText size={14} />,
    };

    return (
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
            {/* Botão Recibo de Entrega */}
            {(order.status === 'finalizada' || order.status === 'entregue') && (
                <div style={{ marginBottom: '20px' }}>
                    <button
                        onClick={onDeliveryReceipt}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '10px', background: 'linear-gradient(135deg,#22c55e,#16a34a)', border: 'none', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                    >
                        📄 Gerar Recibo de Entrega Digital
                    </button>
                </div>
            )}

            {/* Resumo financeiro */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
                {[
                    { label: 'Valor Total da OS', value: fmt(valorOS), color: '#fff', icon: <FileText size={18} /> },
                    { label: 'Total Recebido', value: fmt(totalPago), color: '#10b981', icon: <CheckCircle size={18} /> },
                    { label: saldo > 0 ? 'Saldo Pendente' : 'Pago Integralmente', value: fmt(Math.abs(saldo)), color: saldo > 0 ? '#f59e0b' : '#10b981', icon: <DollarSign size={18} /> },
                ].map(card => (
                    <div key={card.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '10px' }}>
                            {card.icon} {card.label}
                        </div>
                        <div style={{ fontSize: '22px', fontWeight: 700, color: card.color }}>{card.value}</div>
                    </div>
                ))}
            </div>

            {/* Cabeçalho lançamentos */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#fff' }}>Lançamentos desta OS</h3>
                {saldo > 0 && order.status !== 'entregue' && (
                    <button
                        onClick={() => setShowAddPayment(!showAddPayment)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', background: 'var(--primary)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                    >
                        <Plus size={15} /> Registrar Pagamento
                    </button>
                )}
            </div>

            {/* Formulário inline de novo pagamento */}
            {showAddPayment && (
                <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 16px', color: '#c7d2fe', fontSize: '14px' }}>Novo Lançamento</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>Forma de Pagamento</label>
                            <select
                                value={newPayment.method}
                                onChange={e => setNewPayment(p => ({ ...p, method: e.target.value }))}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px' }}
                            >
                                {['Dinheiro', 'PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Transferência', 'Boleto'].map(m => (
                                    <option key={m} value={m} style={{ background: '#1a1b26' }}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>Valor (R$)</label>
                            <CurrencyInput
                                value={newPayment.amount}
                                onChange={val => setNewPayment(p => ({ ...p, amount: val }))}
                                placeholder="R$ 0,00"
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                            />
                        </div>
                        {bankAccounts.length > 0 && (
                            <div>
                                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>Conta Bancária</label>
                                <select
                                    value={newPayment.bankAccountId}
                                    onChange={e => setNewPayment(p => ({ ...p, bankAccountId: e.target.value }))}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px' }}
                                >
                                    <option value="" style={{ background: '#1a1b26' }}>Sem conta específica</option>
                                    {bankAccounts.map((acc: any) => (
                                        <option key={acc.id} value={acc.id} style={{ background: '#1a1b26' }}>{acc.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>Observação (opcional)</label>
                            <input
                                type="text"
                                placeholder="Ex: Entrada 50%"
                                value={newPayment.description}
                                onChange={e => setNewPayment(p => ({ ...p, description: e.target.value }))}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button onClick={() => setShowAddPayment(false)} style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
                        <button onClick={handleAddPayment} disabled={savingPayment} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 20px', borderRadius: '8px', background: '#10b981', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                            {savingPayment ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Salvar
                        </button>
                    </div>
                </div>
            )}

            {/* Lista de transações */}
            {loadingTx ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>Carregando...</div>
            ) : transactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.08)' }}>
                    <DollarSign size={32} style={{ color: 'rgba(255,255,255,0.2)', marginBottom: '12px' }} />
                    <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>Nenhum pagamento registrado ainda.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {transactions.map((tx: any) => (
                        <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px 18px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: tx.type === 'INCOME' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tx.type === 'INCOME' ? '#10b981' : '#ef4444', flexShrink: 0 }}>
                                {PAYMENT_ICONS[tx.paymentMethod] || <DollarSign size={14} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, color: '#fff', fontSize: '14px' }}>{tx.paymentMethod}</div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>{tx.description || tx.category}{tx.bankAccount?.name ? ` • ${tx.bankAccount.name}` : ''}</div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: '15px', color: tx.type === 'INCOME' ? '#10b981' : '#ef4444' }}>{tx.type === 'INCOME' ? '+' : '-'}{fmt(parseFloat(tx.amount))}</div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{new Date(tx.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
