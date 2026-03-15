import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import {
    Plus, TrendingUp, TrendingDown, Wallet, DollarSign, RefreshCw,
    Search, Filter, Calendar, AlertCircle, CheckCircle, Clock,
    ChevronDown, BarChart2, PieChart, ArrowUpRight, ArrowDownRight,
    Trash2, Edit3, X, Save, AlertTriangle,
} from 'lucide-react';

// ── Tipos ────────────────────────────────────────────────────
interface Tx {
    id: string; type: 'INCOME' | 'EXPENSE'; amount: number;
    paymentMethod: string; category: string; description: string;
    status: 'pending' | 'paid' | 'overdue' | 'canceled';
    dueDate?: string; paidDate?: string; supplier?: string;
    costCenter?: string; documentNumber?: string; orderId?: string;
    notes?: string; createdAt: string;
}
interface Summary {
    totalIncome: number; totalExpense: number; balance: number;
    aReceber: number; aPagar: number; vencidos: number; totalTransactions: number;
}
interface DreMonth { month: string; income: number; expense: number; profit: number; margin: number; }
interface CatItem { category: string; income: number; expense: number; }

// ── Utils ────────────────────────────────────────────────────
const R$ = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const fmtDate = (d?: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
const fmtDatetime = (d: string) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => new Date().toISOString().slice(0, 8) + '01';
const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
    paid:     { label: 'Pago',      color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    pending:  { label: 'Pendente',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    overdue:  { label: 'Vencido',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    canceled: { label: 'Cancelado', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
};

const CATEGORIES = {
    income:  ['Serviços de Reparo', 'Venda de Peças', 'Venda de Acessórios', 'Garantia', 'Outros'],
    expense: ['Peças / Insumos', 'Salários', 'Aluguel', 'Energia / Internet', 'Ferramentas', 'Marketing', 'Impostos', 'Contabilidade', 'Outros'],
};
const PAYMENT_METHODS = ['PIX', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Transferência', 'Boleto', 'Cheque'];

const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' };

// ── Modal de transação ─────────────────────────────────────
const TxModal: React.FC<{ tx?: Tx | null; onClose: () => void; onSuccess: () => void }> = ({ tx, onClose, onSuccess }) => {
    const isEdit = !!tx;
    const [data, setData] = useState({
        type: tx?.type || 'INCOME',
        amount: tx?.amount ? String(tx.amount) : '',
        category: tx?.category || '',
        paymentMethod: tx?.paymentMethod || 'PIX',
        description: tx?.description || '',
        supplier: tx?.supplier || '',
        status: tx?.status || 'paid',
        dueDate: tx?.dueDate || '',
        paidDate: tx?.paidDate || today(),
        documentNumber: tx?.documentNumber || '',
        notes: tx?.notes || '',
        costCenter: tx?.costCenter || '',
    });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    const save = async () => {
        if (!data.amount || isNaN(Number(data.amount))) { setErr('Informe um valor válido.'); return; }
        if (!data.category) { setErr('Selecione uma categoria.'); return; }
        setSaving(true); setErr('');
        try {
            const payload = { ...data, amount: Number(data.amount) };
            if (isEdit) await api.patch(`/finance/${tx!.id}`, payload);
            else        await api.post('/finance', payload);
            onSuccess();
        } catch { setErr('Erro ao salvar. Tente novamente.'); }
        finally { setSaving(false); }
    };

    const set = (k: string, v: string) => setData(p => ({ ...p, [k]: v }));
    const cats = data.type === 'INCOME' ? CATEGORIES.income : CATEGORIES.expense;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
            <div style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '92dvh', overflowY: 'auto' }}>
                <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>{isEdit ? 'Editar Transação' : 'Nova Transação'}</h3>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}><X size={15} /></button>
                </div>
                <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Tipo */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {(['INCOME', 'EXPENSE'] as const).map(t => (
                            <button key={t} onClick={() => { set('type', t); set('category', ''); }} style={{ flex: 1, padding: '10px', borderRadius: '9px', border: `1px solid ${data.type === t ? (t === 'INCOME' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)') : 'rgba(255,255,255,0.08)'}`, background: data.type === t ? (t === 'INCOME' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)') : 'rgba(255,255,255,0.03)', color: data.type === t ? (t === 'INCOME' ? '#22c55e' : '#ef4444') : 'rgba(255,255,255,0.4)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', fontSize: '14px' }}>
                                {t === 'INCOME' ? <TrendingUp size={15}/> : <TrendingDown size={15}/>}
                                {t === 'INCOME' ? 'Entrada' : 'Saída'}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={lbl}>Valor (R$) *</label>
                            <input type="number" step="0.01" min="0" value={data.amount} onChange={e => set('amount', e.target.value)} style={inp} placeholder="0,00" autoFocus />
                        </div>
                        <div>
                            <label style={lbl}>Status</label>
                            <select value={data.status} onChange={e => set('status', e.target.value)} style={inp}>
                                <option value="paid">✅ Pago / Recebido</option>
                                <option value="pending">⏳ Pendente</option>
                                <option value="overdue">🔴 Vencido</option>
                                <option value="canceled">⛔ Cancelado</option>
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Categoria *</label>
                            <select value={data.category} onChange={e => set('category', e.target.value)} style={inp}>
                                <option value="">Selecione...</option>
                                {cats.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Forma de Pagamento</label>
                            <select value={data.paymentMethod} onChange={e => set('paymentMethod', e.target.value)} style={inp}>
                                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div style={{ gridColumn: '1/-1' }}>
                            <label style={lbl}>Descrição</label>
                            <input value={data.description} onChange={e => set('description', e.target.value)} style={inp} placeholder="Ex: Reparo iPhone 13 - José Silva" />
                        </div>
                        <div>
                            <label style={lbl}>Fornecedor / Cliente</label>
                            <input value={data.supplier} onChange={e => set('supplier', e.target.value)} style={inp} placeholder="Nome" />
                        </div>
                        <div>
                            <label style={lbl}>Nº Documento</label>
                            <input value={data.documentNumber} onChange={e => set('documentNumber', e.target.value)} style={inp} placeholder="Boleto, NF, etc." />
                        </div>
                        <div>
                            <label style={lbl}>{data.status === 'paid' ? 'Data de Pagamento' : 'Data de Vencimento'}</label>
                            <input type="date" value={data.status === 'paid' ? data.paidDate : data.dueDate} onChange={e => data.status === 'paid' ? set('paidDate', e.target.value) : set('dueDate', e.target.value)} style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>Centro de Custo</label>
                            <input value={data.costCenter} onChange={e => set('costCenter', e.target.value)} style={inp} placeholder="Ex: Serviços, Peças" />
                        </div>
                        <div style={{ gridColumn: '1/-1' }}>
                            <label style={lbl}>Observações</label>
                            <textarea value={data.notes} onChange={e => set('notes', e.target.value)} style={{ ...inp, minHeight: '60px', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} placeholder="Informações adicionais..." />
                        </div>
                    </div>

                    {err && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', color: '#ef4444', fontSize: '13px' }}>{err}</div>}

                    <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
                        <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '9px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                        <button onClick={save} disabled={saving} style={{ flex: 2, padding: '11px', borderRadius: '9px', background: data.type === 'INCOME' ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', fontSize: '14px', opacity: saving ? 0.7 : 1 }}>
                            <Save size={15}/>{saving ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Registrar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── KPI Card ───────────────────────────────────────────────
const KpiCard: React.FC<{ label: string; value: string; sub?: string; color: string; icon: React.ElementType; trend?: number }> = ({ label, value, sub, color, icon: Icon, trend }) => (
    <div style={{ padding: '16px 18px', background: 'var(--bg-secondary)', border: `1px solid ${color}20`, borderRadius: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{label}</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={15} color={color} />
            </div>
        </div>
        <div style={{ fontSize: '22px', fontWeight: 800, color, letterSpacing: '-0.5px' }}>{value}</div>
        {sub && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>{sub}</div>}
        {trend !== undefined && (
            <div style={{ fontSize: '11px', color: trend >= 0 ? '#22c55e' : '#ef4444', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                {trend >= 0 ? <ArrowUpRight size={11}/> : <ArrowDownRight size={11}/>}
                {Math.abs(trend).toFixed(1)}% vs mês anterior
            </div>
        )}
    </div>
);

// ── DRE mini bar ──────────────────────────────────────────
const DreBar: React.FC<{ data: DreMonth[] }> = ({ data }) => {
    const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense)), 1);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: '4px', height: '80px', alignItems: 'flex-end', marginBottom: '4px' }}>
                {data.map((d, i) => {
                    const ih = (d.income / maxVal) * 76;
                    const eh = (d.expense / maxVal) * 76;
                    return (
                        <div key={i} title={`${MONTH_NAMES[i]}: ${R$(d.income)} / ${R$(d.expense)}`} style={{ display: 'flex', gap: '1px', alignItems: 'flex-end', height: '100%', justifyContent: 'center' }}>
                            <div style={{ width: '8px', height: `${ih}px`, background: '#22c55e', borderRadius: '2px 2px 0 0', minHeight: d.income > 0 ? '3px' : '0' }} />
                            <div style={{ width: '8px', height: `${eh}px`, background: '#ef4444', borderRadius: '2px 2px 0 0', minHeight: d.expense > 0 ? '3px' : '0' }} />
                        </div>
                    );
                })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: '4px' }}>
                {MONTH_NAMES.map(m => <div key={m} style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>{m}</div>)}
            </div>
        </div>
    );
};

// ── Componente principal ───────────────────────────────────
export const Finance: React.FC = () => {
    const [transactions, setTransactions] = useState<Tx[]>([]);
    const [summary, setSummary]           = useState<Summary>({ totalIncome: 0, totalExpense: 0, balance: 0, aReceber: 0, aPagar: 0, vencidos: 0, totalTransactions: 0 });
    const [dreData, setDreData]           = useState<DreMonth[]>([]);
    const [upcoming, setUpcoming]         = useState<Tx[]>([]);
    const [categories, setCategories]     = useState<CatItem[]>([]);
    const [loading, setLoading]           = useState(true);
    const [activeView, setActiveView]     = useState<'lancamentos' | 'dre' | 'cashflow' | 'apagar'>('lancamentos');
    const [showModal, setShowModal]       = useState(false);
    const [editTx, setEditTx]            = useState<Tx | null>(null);
    const [delId, setDelId]              = useState<string | null>(null);

    // Filtros
    const [from, setFrom]       = useState(monthStart());
    const [to, setTo]           = useState(today());
    const [filterType, setFilterType]   = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCat, setFilterCat]     = useState('');
    const [search, setSearch]           = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (from) params.append('from', from);
            if (to)   params.append('to', to);
            if (filterType)   params.append('type', filterType);
            if (filterStatus) params.append('status', filterStatus);
            if (filterCat)    params.append('category', filterCat);
            if (search)       params.append('search', search);

            const [txRes, sumRes, dreRes, upRes, catRes] = await Promise.all([
                api.get(`/finance?${params}`),
                api.get(`/finance/summary?from=${from}&to=${to}`),
                api.get(`/finance/dre?year=${new Date().getFullYear()}`),
                api.get('/finance/upcoming?days=30'),
                api.get(`/finance/by-category?from=${from}&to=${to}`),
            ]);
            setTransactions(txRes.data || []);
            setSummary(sumRes.data || {});
            setDreData(dreRes.data || []);
            setUpcoming(upRes.data || []);
            setCategories(catRes.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [from, to, filterType, filterStatus, filterCat, search]);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (id: string) => {
        try { await api.delete(`/finance/${id}`); setDelId(null); load(); }
        catch { alert('Erro ao excluir.'); }
    };

    const totalEntradas = transactions.filter(t => t.type === 'INCOME' && t.status === 'paid').reduce((s, t) => s + t.amount, 0);
    const totalSaidas   = transactions.filter(t => t.type === 'EXPENSE' && t.status === 'paid').reduce((s, t) => s + t.amount, 0);
    const overdueCount  = upcoming.filter(t => t.status === 'overdue' || (t.dueDate && t.dueDate < today())).length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DollarSign size={18} color="#22c55e" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Financeiro</h1>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>{summary.totalTransactions} transações no período</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={load} style={{ padding: '9px', borderRadius: '9px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: loading ? '#3b82f6' : 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '40px', minHeight: '40px' }}>
                        <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                    </button>
                    <button onClick={() => { setEditTx(null); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '9px', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer', background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', minHeight: '40px' }}>
                        <Plus size={16}/> Lançamento
                    </button>
                </div>
            </div>

            {/* Alerta vencidos */}
            {overdueCount > 0 && (
                <div style={{ padding: '11px 15px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '9px', fontSize: '13px', color: '#fca5a5' }}>
                    <AlertTriangle size={15} color="#ef4444" style={{ flexShrink: 0 }} />
                    <strong style={{ color: '#ef4444' }}>{overdueCount} conta{overdueCount > 1 ? 's' : ''} vencida{overdueCount > 1 ? 's'  : ''}</strong> — total de {R$(upcoming.filter(t => t.dueDate && t.dueDate < today()).reduce((s, t) => s + t.amount, 0))}. Acesse <button onClick={() => setActiveView('apagar')} style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', fontWeight: 600, padding: 0, textDecoration: 'underline' }}>Contas a Pagar</button> para resolver.
                </div>
            )}

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                <KpiCard label="Saldo do Período" value={R$(summary.balance)} color={summary.balance >= 0 ? '#22c55e' : '#ef4444'} icon={Wallet} />
                <KpiCard label="Entradas Pagas" value={R$(totalEntradas)} color="#22c55e" icon={TrendingUp} sub={`${transactions.filter(t => t.type === 'INCOME' && t.status === 'paid').length} lançamentos`} />
                <KpiCard label="Saídas Pagas" value={R$(totalSaidas)} color="#ef4444" icon={TrendingDown} sub={`${transactions.filter(t => t.type === 'EXPENSE' && t.status === 'paid').length} lançamentos`} />
                <KpiCard label="A Receber" value={R$(summary.aReceber)} color="#3b82f6" icon={Clock} sub="Pendentes" />
                <KpiCard label="A Pagar" value={R$(summary.aPagar)} color="#f59e0b" icon={Clock} sub="Pendentes" />
                <KpiCard label="Vencidos" value={R$(summary.vencidos)} color="#ef4444" icon={AlertCircle} sub="Urgente" />
            </div>

            {/* Tabs de visualização */}
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '4px', width: 'fit-content', flexWrap: 'wrap' }}>
                {([
                    ['lancamentos', '📋 Lançamentos'],
                    ['dre', '📊 DRE Mensal'],
                    ['cashflow', '💧 Por Categoria'],
                    ['apagar', '⏰ A Pagar / Receber'],
                ] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setActiveView(key)} style={{ padding: '8px 16px', borderRadius: '7px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: activeView === key ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeView === key ? '#fff' : 'rgba(255,255,255,0.45)', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                        {label}
                    </button>
                ))}
            </div>

            {/* ── LANÇAMENTOS ── */}
            {activeView === 'lancamentos' && (
                <>
                    {/* Filtros */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
                            <Search size={13} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar descrição, fornecedor..." style={{ ...inp, paddingLeft: '34px', fontSize: '13px' }} />
                        </div>
                        <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ ...inp, width: 'auto', fontSize: '13px' }} />
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>até</span>
                        <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ ...inp, width: 'auto', fontSize: '13px' }} />
                        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ ...inp, width: 'auto', fontSize: '13px' }}>
                            <option value="">Tipo</option>
                            <option value="INCOME">Entradas</option>
                            <option value="EXPENSE">Saídas</option>
                        </select>
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inp, width: 'auto', fontSize: '13px' }}>
                            <option value="">Status</option>
                            <option value="paid">Pago</option>
                            <option value="pending">Pendente</option>
                            <option value="overdue">Vencido</option>
                        </select>
                    </div>

                    {/* Tabela */}
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
                        {loading ? (
                            <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Carregando...
                            </div>
                        ) : transactions.length === 0 ? (
                            <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                <DollarSign size={32} style={{ opacity: 0.2 }} />
                                <p style={{ margin: 0 }}>Nenhuma transação encontrada</p>
                                <button onClick={() => setShowModal(true)} style={{ fontSize: '13px', color: '#22c55e', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ Novo lançamento</button>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '680px' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                            {['Tipo', 'Descrição', 'Categoria', 'Vencimento', 'Status', 'Valor', ''].map(h => (
                                                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((tx, i) => {
                                            const cfg = STATUS_CFG[tx.status] || STATUS_CFG.paid;
                                            return (
                                                <tr key={tx.id} style={{ borderBottom: i < transactions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                    <td style={{ padding: '11px 14px' }}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: tx.type === 'INCOME' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {tx.type === 'INCOME' ? <TrendingUp size={14} color="#22c55e"/> : <TrendingDown size={14} color="#ef4444"/>}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '11px 14px' }}>
                                                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description || tx.category}</div>
                                                        {tx.supplier && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>{tx.supplier}</div>}
                                                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>{tx.paymentMethod} · {fmtDatetime(tx.createdAt)}</div>
                                                    </td>
                                                    <td style={{ padding: '11px 14px' }}>
                                                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>{tx.category}</span>
                                                    </td>
                                                    <td style={{ padding: '11px 14px', fontSize: '12px', color: tx.dueDate && tx.dueDate < today() && tx.status !== 'paid' ? '#ef4444' : 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
                                                        {tx.status === 'paid' ? (tx.paidDate ? fmtDate(tx.paidDate) : '—') : fmtDate(tx.dueDate)}
                                                    </td>
                                                    <td style={{ padding: '11px 14px' }}>
                                                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 9px', borderRadius: '20px', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}20`, whiteSpace: 'nowrap' }}>{cfg.label}</span>
                                                    </td>
                                                    <td style={{ padding: '11px 14px', fontSize: '14px', fontWeight: 700, color: tx.type === 'INCOME' ? '#22c55e' : '#ef4444', whiteSpace: 'nowrap' }}>
                                                        {tx.type === 'INCOME' ? '+' : '-'}{R$(tx.amount)}
                                                    </td>
                                                    <td style={{ padding: '11px 10px' }}>
                                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                                            <button onClick={() => { setEditTx(tx); setShowModal(true); }} style={{ padding: '5px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex' }}><Edit3 size={12}/></button>
                                                            <button onClick={() => setDelId(tx.id)} style={{ padding: '5px', borderRadius: '6px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', cursor: 'pointer', display: 'flex' }}><Trash2 size={12}/></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                                    <span>{transactions.length} transação{transactions.length !== 1 ? 'ões' : ''}</span>
                                    <span style={{ fontWeight: 700, color: summary.balance >= 0 ? '#22c55e' : '#ef4444' }}>Saldo: {R$(totalEntradas - totalSaidas)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ── DRE MENSAL ── */}
            {activeView === 'dre' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                            <BarChart2 size={17} color="#3b82f6" />
                            <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>DRE — {new Date().getFullYear()}</span>
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '14px', fontSize: '11px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#22c55e' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#22c55e', display: 'inline-block' }}></span>Entradas</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#ef4444', display: 'inline-block' }}></span>Saídas</span>
                            </div>
                        </div>
                        <DreBar data={dreData} />
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                    {['Mês', 'Entradas', 'Saídas', 'Lucro', 'Margem'].map(h => (
                                        <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Mês' ? 'left' : 'right', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {dreData.map((d, i) => (
                                    <tr key={i} style={{ borderBottom: i < 11 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                        <td style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>{MONTH_NAMES[i]}</td>
                                        <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#22c55e' }}>{d.income > 0 ? R$(d.income) : '—'}</td>
                                        <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#ef4444' }}>{d.expense > 0 ? R$(d.expense) : '—'}</td>
                                        <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: d.profit >= 0 ? '#22c55e' : '#ef4444' }}>{d.income > 0 || d.expense > 0 ? R$(d.profit) : '—'}</td>
                                        <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '12px', color: d.margin >= 0 ? '#22c55e' : '#ef4444' }}>{d.income > 0 ? `${d.margin.toFixed(1)}%` : '—'}</td>
                                    </tr>
                                ))}
                                <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#fff' }}>Total Ano</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 800, color: '#22c55e' }}>{R$(dreData.reduce((s, d) => s + d.income, 0))}</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 800, color: '#ef4444' }}>{R$(dreData.reduce((s, d) => s + d.expense, 0))}</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 800, color: '#22c55e' }}>{R$(dreData.reduce((s, d) => s + d.profit, 0))}</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>—</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── POR CATEGORIA ── */}
            {activeView === 'cashflow' && (
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PieChart size={16} color="#a855f7" />
                        <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>Breakdown por Categoria</span>
                    </div>
                    {categories.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Nenhum dado no período</div>
                    ) : categories.map((cat, i) => {
                        const total = cat.income + cat.expense;
                        const maxTotal = Math.max(...categories.map(c => c.income + c.expense));
                        const pct = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
                        return (
                            <div key={cat.category} style={{ padding: '12px 18px', borderBottom: i < categories.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>{cat.category}</span>
                                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                                        {cat.income > 0 && <span style={{ color: '#22c55e', fontWeight: 600 }}>+{R$(cat.income)}</span>}
                                        {cat.expense > 0 && <span style={{ color: '#ef4444', fontWeight: 600 }}>-{R$(cat.expense)}</span>}
                                    </div>
                                </div>
                                <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${pct}%`, background: cat.expense > cat.income ? '#ef4444' : '#22c55e', borderRadius: '3px', transition: 'width 0.4s' }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── A PAGAR / RECEBER ── */}
            {activeView === 'apagar' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <div style={{ padding: '12px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '10px', flex: 1, minWidth: '120px' }}>
                            <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600, marginBottom: '3px' }}>A PAGAR</div>
                            <div style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b' }}>{R$(upcoming.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0))}</div>
                        </div>
                        <div style={{ padding: '12px 16px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '10px', flex: 1, minWidth: '120px' }}>
                            <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 600, marginBottom: '3px' }}>A RECEBER</div>
                            <div style={{ fontSize: '20px', fontWeight: 800, color: '#3b82f6' }}>{R$(upcoming.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0))}</div>
                        </div>
                        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', flex: 1, minWidth: '120px' }}>
                            <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600, marginBottom: '3px' }}>VENCIDOS</div>
                            <div style={{ fontSize: '20px', fontWeight: 800, color: '#ef4444' }}>{overdueCount} contas</div>
                        </div>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
                        {upcoming.length === 0 ? (
                            <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={28} style={{ opacity: 0.2 }} />
                                Nenhuma conta pendente nos próximos 30 dias!
                            </div>
                        ) : upcoming.map((tx, i) => {
                            const isOverdue = tx.dueDate && tx.dueDate < today() && tx.status !== 'paid';
                            return (
                                <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: i < upcoming.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', opacity: tx.status === 'canceled' ? 0.5 : 1 }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isOverdue ? 'rgba(239,68,68,0.15)' : tx.type === 'INCOME' ? 'rgba(59,130,246,0.12)' : 'rgba(245,158,11,0.12)' }}>
                                        {tx.type === 'INCOME' ? <TrendingUp size={15} color={isOverdue ? '#ef4444' : '#3b82f6'}/> : <TrendingDown size={15} color={isOverdue ? '#ef4444' : '#f59e0b'}/>}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description || tx.category}</div>
                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>
                                            {tx.supplier && `${tx.supplier} · `}{tx.category}
                                            {tx.documentNumber && ` · ${tx.documentNumber}`}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: tx.type === 'INCOME' ? '#3b82f6' : isOverdue ? '#ef4444' : '#f59e0b' }}>{R$(tx.amount)}</div>
                                        <div style={{ fontSize: '11px', color: isOverdue ? '#ef4444' : 'rgba(255,255,255,0.4)', marginTop: '1px' }}>
                                            {isOverdue ? '🔴 Venceu ' : 'Vence '}{fmtDate(tx.dueDate)}
                                        </div>
                                    </div>
                                    <button onClick={() => api.patch(`/finance/${tx.id}`, { status: 'paid', paidDate: today() }).then(load)} style={{ padding: '6px 12px', borderRadius: '7px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        ✓ Pagar
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Modais */}
            {showModal && (
                <TxModal
                    tx={editTx}
                    onClose={() => { setShowModal(false); setEditTx(null); }}
                    onSuccess={() => { setShowModal(false); setEditTx(null); load(); }}
                />
            )}

            {delId && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '28px', maxWidth: '380px', width: '90%', textAlign: 'center' }}>
                        <AlertTriangle size={32} color="#ef4444" style={{ marginBottom: '14px' }} />
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Excluir transação?</h3>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '20px' }}>Esta ação não pode ser desfeita.</p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => setDelId(null)} style={{ flex: 1, padding: '10px', borderRadius: '9px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                            <button onClick={() => handleDelete(delId)} style={{ flex: 1, padding: '10px', borderRadius: '9px', background: '#ef4444', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Excluir</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
