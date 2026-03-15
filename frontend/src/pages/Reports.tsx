import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
    TrendingUp, TrendingDown, ClipboardList, Clock, RefreshCw, Calendar,
    CheckCircle, Wrench, Package, AlertCircle, Users, Trophy, Download,
    BarChart2, FileText, Star, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

// ── Utils ────────────────────────────────────────────────────
const R$ = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const fmtMonth = (m: string) => { const [y, mo] = m.split('-'); return new Date(Number(y), Number(mo) - 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }); };
const fmtDay = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const STATUS_COLOR: Record<string, string> = { aberta: '#94a3b8', em_diagnostico: '#3b82f6', aguardando_aprovacao: '#06b6d4', aguardando_peca: '#f59e0b', em_reparo: '#a855f7', testes: '#ec4899', finalizada: '#22c55e', entregue: '#10b981', cancelada: '#ef4444' };
const STATUS_LABEL: Record<string, string> = { aberta: 'Aberta', em_diagnostico: 'Diagnóstico', aguardando_aprovacao: 'Ag. Aprovação', aguardando_peca: 'Ag. Peça', em_reparo: 'Em Reparo', testes: 'Testes', finalizada: 'Finalizada', entregue: 'Entregue', cancelada: 'Cancelada' };
const BRAND_COLORS = ['#3b82f6', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];
const inp: React.CSSProperties = { padding: '9px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '13px', outline: 'none' };

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{label}</p>
            {payload.map((p: any) => <p key={p.name} style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: p.color }}>{p.name === 'revenue' || p.name === 'receita' ? R$(p.value) : p.value}</p>)}
        </div>
    );
};

const KpiCard: React.FC<{ label: string; value: string | number; icon: React.ElementType; color: string; sub?: string; trend?: number }> = ({ label, value, icon: Icon, color, sub, trend }) => (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{label}</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={15} color={color}/>
            </div>
        </div>
        <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>{value}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '5px' }}>
            {sub && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{sub}</div>}
            {trend !== undefined && <div style={{ fontSize: '11px', color: trend >= 0 ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', gap: '2px' }}>{trend >= 0 ? <ArrowUpRight size={11}/> : <ArrowDownRight size={11}/>}{Math.abs(trend).toFixed(1)}%</div>}
        </div>
    </div>
);

export const Reports: React.FC = () => {
    const [data, setData]             = useState<any>(null);
    const [techs, setTechs]           = useState<any[]>([]);
    const [parts, setParts]           = useState<any[]>([]);
    const [models, setModels]         = useState<any[]>([]);
    const [warranty, setWarranty]     = useState<any>(null);
    const [loading, setLoading]       = useState(true);
    const [activeTab, setActiveTab]   = useState<'geral' | 'tecnicos' | 'pecas' | 'modelos'>('geral');
    const [from, setFrom]             = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
    const [to, setTo]                 = useState(() => new Date().toISOString().slice(0, 10));

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [overRes, techRes, partsRes, modRes, warRes] = await Promise.all([
                api.get(`/reports/overview?from=${from}&to=${to}`),
                api.get(`/reports/technicians?from=${from}&to=${to}`),
                api.get(`/reports/parts?from=${from}&to=${to}`),
                api.get(`/reports/models?from=${from}&to=${to}`),
                api.get(`/reports/warranty-return`),
            ]);
            setData(overRes.data);
            setTechs(techRes.data || []);
            setParts(partsRes.data || []);
            setModels(modRes.data || []);
            setWarranty(warRes.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [from, to]);

    useEffect(() => { load(); }, [load]);

    const exportCsv = (rows: any[], filename: string) => {
        if (!rows.length) return;
        const keys = Object.keys(rows[0]);
        const csv = [keys.join(','), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');
        const a = document.createElement('a');
        a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
        a.download = filename + '.csv'; a.click();
    };

    const pieData = Object.entries(data?.byStatus || {}).filter(([, v]) => (v as number) > 0).map(([k, v]) => ({ name: STATUS_LABEL[k] || k, value: v as number, color: STATUS_COLOR[k] }));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BarChart2 size={18} color="#a855f7"/>
                    </div>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Relatórios</h1>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>Análise de desempenho e produtividade</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={inp}/>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>até</span>
                    <input type="date" value={to} onChange={e => setTo(e.target.value)} style={inp}/>
                    <button onClick={load} style={{ padding: '9px 14px', borderRadius: '9px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#a855f7', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {loading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }}/> : <RefreshCw size={14}/>} Atualizar
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '4px', width: 'fit-content', flexWrap: 'wrap' }}>
                {([['geral','📊 Geral'],['tecnicos','👷 Técnicos'],['pecas','🔩 Peças'],['modelos','📱 Modelos']] as const).map(([k, l]) => (
                    <button key={k} onClick={() => setActiveTab(k)} style={{ padding: '7px 14px', borderRadius: '7px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: activeTab === k ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === k ? '#fff' : 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>{l}</button>
                ))}
            </div>

            {loading && !data ? (
                <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }}/> Carregando relatórios...
                </div>
            ) : (
                <>
                    {/* ── GERAL ── */}
                    {activeTab === 'geral' && data && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                                <KpiCard label="OS no Período" value={data.totals.totalOS} icon={ClipboardList} color="#3b82f6" sub="ordens abertas" />
                                <KpiCard label="Receita" value={R$(data.totals.revenue)} icon={TrendingUp} color="#22c55e" sub="transações de entrada" />
                                <KpiCard label="Despesas" value={R$(data.totals.expenses)} icon={TrendingDown} color="#ef4444" sub="transações de saída" />
                                <KpiCard label="Saldo" value={R$(data.totals.balance)} icon={BarChart2} color={data.totals.balance >= 0 ? '#22c55e' : '#ef4444'} />
                                <KpiCard label="Tempo Médio" value={`${data.avgRepairHours}h`} icon={Clock} color="#f59e0b" sub="abertura → entrega" />
                                <KpiCard label="Retorno Garantia" value={`${warranty?.rate || 0}%`} icon={AlertCircle} color="#a855f7" sub={`${warranty?.warrantyReturns || 0} de ${warranty?.total || 0}`} />
                            </div>

                            {/* Gráfico faturamento por mês */}
                            {data.monthlyRevenue?.length > 0 && (
                                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                            <TrendingUp size={16} color="#22c55e"/>
                                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Faturamento Mensal</span>
                                        </div>
                                        <button onClick={() => exportCsv(data.monthlyRevenue, 'faturamento-mensal')} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '7px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                                            <Download size={11}/> CSV
                                        </button>
                                    </div>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={data.monthlyRevenue} barSize={28}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                                            <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false}/>
                                            <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`}/>
                                            <Tooltip content={<CustomTooltip/>}/>
                                            <Bar dataKey="revenue" name="receita" fill="#22c55e" radius={[4,4,0,0]}/>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                {/* OS por dia */}
                                {data.dailyChart?.length > 0 && (
                                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
                                            <ClipboardList size={15} color="#3b82f6"/>
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>OS por Dia</span>
                                        </div>
                                        <ResponsiveContainer width="100%" height={160}>
                                            <LineChart data={data.dailyChart.slice(-14)}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                                                <XAxis dataKey="date" tickFormatter={fmtDay} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false}/>
                                                <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false}/>
                                                <Tooltip content={<CustomTooltip/>}/>
                                                <Line dataKey="count" name="OS" stroke="#3b82f6" strokeWidth={2} dot={false}/>
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                                {/* Status Pizza */}
                                {pieData.length > 0 && (
                                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
                                            <BarChart2 size={15} color="#a855f7"/>
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Distribuição por Status</span>
                                        </div>
                                        <ResponsiveContainer width="100%" height={160}>
                                            <PieChart>
                                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                                                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
                                                </Pie>
                                                <Tooltip formatter={(v: any, n: any) => [v + ' OS', n]}/>
                                                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px' }}/>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>

                            {/* Top marcas */}
                            {data.topBrands?.length > 0 && (
                                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '14px' }}>
                                        <Star size={15} color="#f59e0b"/>
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Top Marcas</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {data.topBrands.map((b: any, i: number) => {
                                            const max = data.topBrands[0].count;
                                            return (
                                                <div key={b.brand} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ width: '18px', fontSize: '11px', color: 'rgba(255,255,255,0.35)', textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                                                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#fff', minWidth: '90px' }}>{b.brand}</span>
                                                    <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${(b.count / max) * 100}%`, background: BRAND_COLORS[i % BRAND_COLORS.length], borderRadius: '3px' }}/>
                                                    </div>
                                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff', minWidth: '30px', textAlign: 'right' }}>{b.count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── TÉCNICOS ── */}
                    {activeTab === 'tecnicos' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={() => exportCsv(techs, 'ranking-tecnicos')} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                    <Download size={12}/> Exportar CSV
                                </button>
                            </div>
                            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead><tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        {['#','ID Técnico','Total OS','Entregues','Receita','Tempo Médio'].map(h => (
                                            <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                        ))}
                                    </tr></thead>
                                    <tbody>
                                        {techs.length === 0 ? <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Nenhum dado no período</td></tr>
                                        : techs.map((t, i) => (
                                            <tr key={t.technicianId} style={{ borderBottom: i < techs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                                <td style={{ padding: '11px 14px' }}>
                                                    <span style={{ fontSize: '14px' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                                                </td>
                                                <td style={{ padding: '11px 14px', fontSize: '12px', fontFamily: 'monospace', color: '#60a5fa' }}>{t.technicianId.slice(0, 8)}...</td>
                                                <td style={{ padding: '11px 14px', fontSize: '14px', fontWeight: 700, color: '#fff' }}>{t.total}</td>
                                                <td style={{ padding: '11px 14px', fontSize: '14px', fontWeight: 700, color: '#22c55e' }}>{t.delivered}</td>
                                                <td style={{ padding: '11px 14px', fontSize: '13px', fontWeight: 600, color: '#22c55e' }}>{R$(t.revenue)}</td>
                                                <td style={{ padding: '11px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{t.avgHours}h</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── PEÇAS ── */}
                    {activeTab === 'pecas' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={() => exportCsv(parts, 'top-pecas')} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                    <Download size={12}/> Exportar CSV
                                </button>
                            </div>
                            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px' }}>
                                {parts.length === 0 ? <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Nenhuma peça registrada no período</div>
                                : parts.map((p, i) => {
                                    const max = parts[0].count;
                                    return (
                                        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 0', borderBottom: i < parts.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                            <span style={{ width: '22px', fontSize: '11px', color: 'rgba(255,255,255,0.35)', textAlign: 'right', flexShrink: 0, fontWeight: 600 }}>{i + 1}</span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                                                    <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${(p.count / max) * 100}%`, background: BRAND_COLORS[i % BRAND_COLORS.length], borderRadius: '2px' }}/>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{p.count}x</div>
                                                <div style={{ fontSize: '11px', color: '#22c55e' }}>{R$(p.revenue)}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── MODELOS ── */}
                    {activeTab === 'modelos' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={() => exportCsv(models, 'modelos-mais-reparados')} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                    <Download size={12}/> Exportar CSV
                                </button>
                            </div>
                            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead><tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        {['#','Marca','Modelo','OS','Receita'].map(h => (
                                            <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                        ))}
                                    </tr></thead>
                                    <tbody>
                                        {models.length === 0 ? <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Nenhum dado no período</td></tr>
                                        : models.map((m, i) => (
                                            <tr key={i} style={{ borderBottom: i < models.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                                <td style={{ padding: '10px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{i + 1}</td>
                                                <td style={{ padding: '10px 14px' }}><span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>{m.brand}</span></td>
                                                <td style={{ padding: '10px 14px', fontSize: '13px', color: '#fff', fontWeight: 500 }}>{m.model}</td>
                                                <td style={{ padding: '10px 14px', fontSize: '14px', fontWeight: 800, color: '#fff' }}>{m.count}</td>
                                                <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: 600, color: '#22c55e' }}>{R$(m.revenue)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
