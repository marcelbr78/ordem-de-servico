import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import {
    Trophy, TrendingUp, DollarSign, Users, RefreshCw, CheckCircle,
    Clock, AlertCircle, ChevronDown, ChevronUp, Search, Filter,
    Award, Star, BarChart2, Calendar, X, Save, Zap,
} from 'lucide-react';

// ── Tipos ────────────────────────────────────────────────────
interface Commission {
    id: string; technicianId: string; orderId: string; orderProtocol: string;
    baseValue: number; ratePercent: number; commissionValue: number;
    basis: string; status: 'pending' | 'paid' | 'canceled';
    paymentPeriod: string; paidAt?: string; createdAt: string;
    technician?: { id: string; name: string };
}
interface TechSummary {
    technicianId: string; technicianName: string;
    totalOS: number; totalBase: number; totalCommission: number;
    pendingCount: number; paidCount: number;
}

// ── Utils ────────────────────────────────────────────────────
const R$ = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');
const currentPeriod = () => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
};
const periodLabel = (p: string) => {
    if (!p) return '—';
    const [y, m] = p.split('-');
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return `${months[parseInt(m) - 1]}/${y}`;
};

// Gerar últimos 12 meses
const lastPeriods = () => {
    const periods: string[] = [];
    const d = new Date();
    for (let i = 0; i < 12; i++) {
        periods.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        d.setMonth(d.getMonth() - 1);
    }
    return periods;
};

// ── Medal colors ─────────────────────────────────────────────
const MEDALS: Record<number, { icon: string; color: string; bg: string }> = {
    0: { icon: '🥇', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    1: { icon: '🥈', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
    2: { icon: '🥉', color: '#b45309', bg: 'rgba(180,83,9,0.12)' },
};

// ── Status badge ─────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const cfg = {
        paid:     { label: 'Pago',     color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
        pending:  { label: 'Pendente', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
        canceled: { label: 'Cancelado',color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
    }[status] || { label: status, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
    return (
        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 9px', borderRadius: '20px', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}20`, whiteSpace: 'nowrap' }}>
            {cfg.label}
        </span>
    );
};

// ── Painel de configuração de regras ─────────────────────────
const RulesPanel: React.FC<{ technicians: TechSummary[]; onClose: () => void }> = ({ technicians, onClose }) => {
    const [globalEnabled, setGlobalEnabled] = useState(false);
    const [globalRate, setGlobalRate] = useState('10');
    const [globalBasis, setGlobalBasis] = useState('service_value');
    const [rules, setRules] = useState<Array<{ technicianId: string; rate: string; basis: string }>>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [enRes, rateRes, rulesRes, basisRes] = await Promise.all([
                    api.get('/settings/finance_commission_enabled'),
                    api.get('/settings/finance_commission_default'),
                    api.get('/settings/finance_commission_rules'),
                    api.get('/settings/finance_commission_basis').catch(() => ({ data: { value: 'service_value' } })),
                ]);
                setGlobalEnabled(enRes.data?.value === 'true');
                setGlobalRate(rateRes.data?.value || '10');
                setGlobalBasis(basisRes.data?.value || 'service_value');
                try { setRules(JSON.parse(rulesRes.data?.value || '[]')); } catch {}
            } catch {}
        };
        load();
    }, []);

    const save = async () => {
        setSaving(true);
        try {
            await Promise.all([
                api.put('/settings/finance_commission_enabled', { value: String(globalEnabled) }),
                api.put('/settings/finance_commission_default', { value: globalRate }),
                api.put('/settings/finance_commission_basis',   { value: globalBasis }),
                api.put('/settings/finance_commission_rules',   { value: JSON.stringify(rules) }),
            ]);
            onClose();
        } catch { alert('Erro ao salvar'); }
        finally { setSaving(false); }
    };

    const setRule = (tid: string, field: string, val: string) => {
        setRules(prev => {
            const idx = prev.findIndex(r => r.technicianId === tid);
            if (idx >= 0) return prev.map((r, i) => i === idx ? { ...r, [field]: val } : r);
            return [...prev, { technicianId: tid, rate: globalRate, basis: globalBasis, [field]: val }];
        });
    };
    const getRule = (tid: string) => rules.find(r => r.technicianId === tid);

    const basisOptions = [
        { value: 'service_value', label: '% sobre valor da OS' },
        { value: 'parts_value',   label: '% sobre peças' },
        { value: 'total_value',   label: '% sobre total (OS + peças)' },
        { value: 'fixed',         label: 'Valor fixo por OS (R$)' },
    ];

    const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' };
    const lbl: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
            <div style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: '90dvh', overflowY: 'auto' }}>
                <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap size={18} color="#f59e0b" />
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>Regras de Comissão</h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}><X size={15}/></button>
                </div>
                <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {/* Global */}
                    <div style={{ padding: '16px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Habilitar comissões</span>
                            <button onClick={() => setGlobalEnabled(e => !e)} style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: globalEnabled ? '#f59e0b' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'all 0.2s' }}>
                                <div style={{ position: 'absolute', top: '3px', left: globalEnabled ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                            </button>
                        </div>
                        {globalEnabled && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                                <div>
                                    <label style={lbl}>Taxa padrão (%)</label>
                                    <input type="number" min="0" max="100" step="0.5" value={globalRate} onChange={e => setGlobalRate(e.target.value)} style={inp} />
                                </div>
                                <div>
                                    <label style={lbl}>Base de cálculo padrão</label>
                                    <select value={globalBasis} onChange={e => setGlobalBasis(e.target.value)} style={inp}>
                                        {basisOptions.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Por técnico */}
                    {globalEnabled && technicians.length > 0 && (
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '10px' }}>Regras individuais por técnico (opcional)</div>
                            {technicians.map(tech => {
                                const rule = getRule(tech.technicianId);
                                return (
                                    <div key={tech.technicianId} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#60a5fa' }}>
                                                {tech.technicianName.charAt(0)}
                                            </div>
                                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{tech.technicianName}</span>
                                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>
                                                {rule ? 'Regra personalizada' : `Padrão: ${globalRate}%`}
                                            </span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                                            <div>
                                                <label style={lbl}>Taxa (%)</label>
                                                <input type="number" min="0" max="100" step="0.5" value={rule?.rate ?? globalRate} onChange={e => setRule(tech.technicianId, 'rate', e.target.value)} style={inp} placeholder={globalRate} />
                                            </div>
                                            <div>
                                                <label style={lbl}>Base de cálculo</label>
                                                <select value={rule?.basis ?? globalBasis} onChange={e => setRule(tech.technicianId, 'basis', e.target.value)} style={inp}>
                                                    {basisOptions.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
                        <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '9px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                        <button onClick={save} disabled={saving} style={{ flex: 2, padding: '11px', borderRadius: '9px', background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', fontSize: '14px', opacity: saving ? 0.7 : 1 }}>
                            <Save size={15}/>{saving ? 'Salvando...' : 'Salvar Regras'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Componente principal ───────────────────────────────────
export const Commissions: React.FC = () => {
    const [summary, setSummary]       = useState<TechSummary[]>([]);
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [loading, setLoading]       = useState(true);
    const [activeView, setActiveView] = useState<'ranking' | 'detalhes'>('ranking');
    const [period, setPeriod]         = useState(currentPeriod());
    const [selectedTech, setSelectedTech] = useState<string>('');
    const [showRules, setShowRules]   = useState(false);
    const [paying, setPaying]         = useState<string | null>(null);
    const [search, setSearch]         = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [sumRes, commRes] = await Promise.all([
                api.get(`/commissions/summary?period=${period}`),
                api.get(`/commissions?period=${period}${selectedTech ? `&technicianId=${selectedTech}` : ''}`),
            ]);
            setSummary(sumRes.data || []);
            setCommissions(commRes.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [period, selectedTech]);

    useEffect(() => { load(); }, [load]);

    const handlePayPeriod = async (technicianId: string) => {
        const tech = summary.find(t => t.technicianId === technicianId);
        if (!tech || tech.pendingCount === 0) return;
        const confirmed = window.confirm(`Marcar todas as ${tech.pendingCount} comissões pendentes de ${tech.technicianName} como pagas?\n\nTotal: ${R$(tech.totalCommission)}`);
        if (!confirmed) return;
        setPaying(technicianId);
        try {
            await api.post('/commissions/pay-period', { technicianId, period });
            load();
        } catch { alert('Erro ao registrar pagamento.'); }
        finally { setPaying(null); }
    };

    const filteredComms = commissions.filter(c => {
        if (!search) return true;
        return [c.orderProtocol, c.technician?.name].some(v => v?.toLowerCase().includes(search.toLowerCase()));
    });

    const totalPending  = summary.reduce((s, t) => s + (t.pendingCount > 0 ? (t.totalCommission / (t.totalOS || 1)) * t.pendingCount : 0), 0);
    const totalPaid     = summary.reduce((s, t) => s + (t.paidCount > 0 ? (t.totalCommission / (t.totalOS || 1)) * t.paidCount : 0), 0);
    const totalAll      = summary.reduce((s, t) => s + t.totalCommission, 0);
    const totalOS       = summary.reduce((s, t) => s + t.totalOS, 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trophy size={18} color="#f59e0b" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Comissões</h1>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>
                            {periodLabel(period)} · {totalOS} OS · {summary.length} técnico{summary.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Seletor de período */}
                    <select value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '9px 12px', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
                        {lastPeriods().map(p => <option key={p} value={p}>{periodLabel(p)}</option>)}
                    </select>
                    <button onClick={load} style={{ padding: '9px', borderRadius: '9px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: loading ? '#f59e0b' : 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '40px', minHeight: '40px' }}>
                        <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                    </button>
                    <button onClick={() => setShowRules(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '9px', border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontWeight: 600, cursor: 'pointer', fontSize: '13px', minHeight: '40px' }}>
                        <Zap size={14}/> Regras
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                {[
                    { label: 'Total a Pagar', value: R$(totalAll), color: '#f59e0b', icon: DollarSign, sub: `${totalOS} OS no período` },
                    { label: 'Pendente Pagamento', value: R$(totalPending), color: '#ef4444', icon: Clock, sub: `${summary.reduce((s, t) => s + t.pendingCount, 0)} comissões` },
                    { label: 'Já Pago', value: R$(totalPaid), color: '#22c55e', icon: CheckCircle, sub: `${summary.reduce((s, t) => s + t.paidCount, 0)} pagas` },
                    { label: 'Técnicos Ativos', value: summary.filter(t => t.totalOS > 0).length, color: '#3b82f6', icon: Users, sub: 'com OS no período' },
                ].map(({ label, value, color, icon: Icon, sub }) => (
                    <div key={label} style={{ padding: '14px 16px', background: 'var(--bg-secondary)', border: `1px solid ${color}20`, borderRadius: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{label}</span>
                            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon size={14} color={color} />
                            </div>
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color, letterSpacing: '-0.5px' }}>{value}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>{sub}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
                {([['ranking', '🏆 Ranking de Técnicos'], ['detalhes', '📋 Detalhes por OS']] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setActiveView(key)} style={{ padding: '8px 16px', borderRadius: '7px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: activeView === key ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeView === key ? '#fff' : 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>
                        {label}
                    </button>
                ))}
            </div>

            {/* ── RANKING ── */}
            {activeView === 'ranking' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {loading ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Carregando...
                        </div>
                    ) : summary.length === 0 ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                            <Trophy size={36} style={{ opacity: 0.2 }} />
                            <p style={{ margin: 0, fontSize: '14px' }}>Nenhum técnico com OS no período</p>
                            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>Configure as regras de comissão e as OS serão calculadas automaticamente ao finalizar.</p>
                        </div>
                    ) : summary.map((tech, i) => {
                        const medal = MEDALS[i];
                        const isPaying = paying === tech.technicianId;
                        const completionRate = tech.totalOS > 0 ? (tech.paidCount / tech.totalOS) * 100 : 0;

                        return (
                            <div key={tech.technicianId} style={{ background: 'var(--bg-secondary)', border: `1px solid ${i < 3 ? (medal?.color + '30') : 'var(--border-color)'}`, borderRadius: '14px', padding: '18px 20px', transition: 'border-color 0.15s' }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = i < 3 ? medal?.color + '50' : 'rgba(255,255,255,0.12)')}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = i < 3 ? medal?.color + '30' : 'var(--border-color)')}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px', flexWrap: 'wrap' }}>
                                    {/* Avatar + posição */}
                                    <div style={{ position: 'relative', flexShrink: 0 }}>
                                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: i < 3 ? medal.bg : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 800, color: i < 3 ? medal.color : '#fff', border: i < 3 ? `2px solid ${medal.color}40` : '2px solid rgba(255,255,255,0.1)' }}>
                                            {i < 3 ? medal.icon : tech.technicianName.charAt(0)}
                                        </div>
                                        <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '18px', height: '18px', borderRadius: '50%', background: '#0c0c16', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            {i + 1}
                                        </div>
                                    </div>

                                    {/* Nome e stats */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '3px' }}>{tech.technicianName}</div>
                                        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <BarChart2 size={11}/> {tech.totalOS} OS
                                            </span>
                                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <DollarSign size={11}/> Base: {R$(tech.totalBase)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Comissão total */}
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontSize: '22px', fontWeight: 900, color: i < 3 ? medal.color : '#f59e0b', letterSpacing: '-0.5px' }}>{R$(tech.totalCommission)}</div>
                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>comissão total</div>
                                    </div>

                                    {/* Botão pagar */}
                                    {tech.pendingCount > 0 && (
                                        <button onClick={() => handlePayPeriod(tech.technicianId)} disabled={isPaying} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '9px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', fontWeight: 700, cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap', minHeight: '38px', opacity: isPaying ? 0.6 : 1 }}>
                                            {isPaying ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }}/> : <CheckCircle size={13}/>}
                                            Pagar {tech.pendingCount} pendente{tech.pendingCount > 1 ? 's' : ''}
                                        </button>
                                    )}
                                    {tech.pendingCount === 0 && tech.paidCount > 0 && (
                                        <span style={{ fontSize: '12px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                                            <CheckCircle size={13}/> Tudo pago
                                        </span>
                                    )}
                                </div>

                                {/* Barra de pagamento */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${completionRate}%`, background: 'linear-gradient(90deg, #22c55e, #16a34a)', borderRadius: '3px', transition: 'width 0.4s' }} />
                                    </div>
                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', flexShrink: 0, minWidth: '90px', textAlign: 'right' }}>
                                        {tech.paidCount}/{tech.totalOS} pagas
                                        {tech.pendingCount > 0 && <span style={{ color: '#f59e0b' }}> · {tech.pendingCount} pendente{tech.pendingCount > 1 ? 's' : ''}</span>}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── DETALHES POR OS ── */}
            {activeView === 'detalhes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Filtros */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
                            <Search size={13} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar protocolo ou técnico..." style={{ width: '100%', padding: '9px 12px 9px 33px', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <select value={selectedTech} onChange={e => setSelectedTech(e.target.value)} style={{ padding: '9px 12px', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '13px', outline: 'none' }}>
                            <option value="">Todos os técnicos</option>
                            {summary.map(t => <option key={t.technicianId} value={t.technicianId}>{t.technicianName}</option>)}
                        </select>
                    </div>

                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
                        {loading ? (
                            <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Carregando...</div>
                        ) : filteredComms.length === 0 ? (
                            <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Nenhuma comissão no período</div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '580px' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                            {['OS', 'Técnico', 'Base', 'Taxa', 'Comissão', 'Status', 'Data'].map(h => (
                                                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredComms.map((c, i) => (
                                            <tr key={c.id} style={{ borderBottom: i < filteredComms.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontSize: '12px', color: '#60a5fa', fontWeight: 700 }}>{c.orderProtocol}</td>
                                                <td style={{ padding: '11px 14px', fontSize: '13px', color: '#fff', fontWeight: 500 }}>{c.technician?.name || '—'}</td>
                                                <td style={{ padding: '11px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{R$(c.baseValue)}</td>
                                                <td style={{ padding: '11px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                                                    {c.basis === 'fixed' ? 'Fixo' : `${c.ratePercent}%`}
                                                </td>
                                                <td style={{ padding: '11px 14px', fontSize: '14px', fontWeight: 700, color: '#f59e0b' }}>{R$(c.commissionValue)}</td>
                                                <td style={{ padding: '11px 14px' }}><StatusBadge status={c.status} /></td>
                                                <td style={{ padding: '11px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{fmtDate(c.createdAt)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                                    <span>{filteredComms.length} registro{filteredComms.length !== 1 ? 's' : ''}</span>
                                    <span style={{ fontWeight: 700, color: '#f59e0b' }}>Total: {R$(filteredComms.reduce((s, c) => s + c.commissionValue, 0))}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modais */}
            {showRules && <RulesPanel technicians={summary} onClose={() => { setShowRules(false); load(); }} />}
        </div>
    );
};
