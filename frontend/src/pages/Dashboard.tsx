import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    ClipboardList, Clock, Wrench, CheckCircle, Package, TrendingUp,
    AlertCircle, RefreshCw, ChevronRight, Smartphone, AlertTriangle,
    DollarSign, Users, Zap, BarChart2, Calendar, ArrowUpRight,
    ArrowDownRight, Timer, Shield, Star, Activity,
} from 'lucide-react';

// ── Tipos ──────────────────────────────────────────────────────
interface SlaItem {
    id: string; protocol: string; status: string; priority: string;
    clientName: string; equipment: string; hoursOpen: number;
}
interface DashStats {
    total: number;
    byStatus: Record<string, number>;
    recentOrders: Array<{
        id: string; protocol: string; status: string; priority: string;
        clientName: string; equipmentBrand: string; equipmentModel: string;
        total: number; createdAt: string;
    }>;
    monthlyRevenue: number;
    prevMonthRevenue: number;
    todayOpened: number;
    todayDelivered: number;
    slaViolations: SlaItem[];
    last7days: Array<{ date: string; revenue: number }>;
    urgentCount: number;
}

// ── Utils ──────────────────────────────────────────────────────
const R$ = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const pctChange = (cur: number, prev: number) => prev > 0 ? ((cur - prev) / prev) * 100 : 0;

const STATUS_LABEL: Record<string, string> = {
    aberta: 'Aberta', em_diagnostico: 'Diagnóstico', aguardando_aprovacao: 'Ag. Aprovação',
    aguardando_peca: 'Ag. Peça', em_reparo: 'Em Reparo',
    testes: 'Testes', finalizada: 'Finalizada', entregue: 'Entregue', cancelada: 'Cancelada',
};
const STATUS_COLOR: Record<string, string> = {
    aberta: '#94a3b8', em_diagnostico: '#3b82f6', aguardando_aprovacao: '#06b6d4',
    aguardando_peca: '#f59e0b', em_reparo: '#a855f7',
    testes: '#ec4899', finalizada: '#22c55e', entregue: '#10b981', cancelada: '#6b7280',
};
const PRIORITY_COLOR: Record<string, string> = {
    urgente: '#ef4444', alta: '#f97316', normal: '#3b82f6', baixa: '#94a3b8',
};
const PRIORITY_LABEL: Record<string, string> = {
    urgente: '🔴 Urgente', alta: '🟠 Alta', normal: '🔵 Normal', baixa: '⚪ Baixa',
};

// ── Mini componentes ───────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const c = STATUS_COLOR[status] || '#94a3b8';
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: `${c}15`, color: c, border: `1px solid ${c}25`, whiteSpace: 'nowrap' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: c }} />
            {STATUS_LABEL[status] || status}
        </span>
    );
};

const KpiCard: React.FC<{
    label: string; value: string | number; icon: React.ElementType; color: string;
    sub?: string; trend?: number; onClick?: () => void; urgent?: boolean;
}> = ({ label, value, icon: Icon, color, sub, trend, onClick, urgent }) => (
    <div onClick={onClick} style={{
        background: 'var(--bg-secondary)', border: `1px solid ${urgent ? color + '40' : 'var(--border-color)'}`,
        borderRadius: '14px', padding: '16px 18px', cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.18s', position: 'relative', overflow: 'hidden',
    }}
        onMouseEnter={e => { if (onClick) { (e.currentTarget as HTMLElement).style.borderColor = color + '60'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; } }}
        onMouseLeave={e => { if (onClick) { (e.currentTarget as HTMLElement).style.borderColor = urgent ? color + '40' : 'var(--border-color)'; (e.currentTarget as HTMLElement).style.transform = 'none'; } }}>
        {urgent && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${color}, ${color}80)` }} />}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{label}</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={15} color={color} />
            </div>
        </div>
        <div style={{ fontSize: '26px', fontWeight: 800, color: urgent ? color : '#fff', letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
            {sub && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{sub}</div>}
            {trend !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px', color: trend >= 0 ? '#22c55e' : '#ef4444' }}>
                    {trend >= 0 ? <ArrowUpRight size={11}/> : <ArrowDownRight size={11}/>}
                    {Math.abs(trend).toFixed(1)}%
                </div>
            )}
        </div>
    </div>
);

// ── Mini gráfico de barras ─────────────────────────────────────
const MiniBarChart: React.FC<{ data: Array<{ date: string; revenue: number }> }> = ({ data }) => {
    const max = Math.max(...data.map(d => d.revenue), 1);
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '64px' }}>
            {data.map((d, i) => {
                const h = Math.max((d.revenue / max) * 60, d.revenue > 0 ? 4 : 2);
                const weekday = days[new Date(d.date + 'T12:00:00').getDay()];
                const isToday = d.date === new Date().toISOString().slice(0, 10);
                return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }} title={`${weekday}: ${R$(d.revenue)}`}>
                        <div style={{ width: '100%', height: `${h}px`, background: isToday ? '#22c55e' : d.revenue > 0 ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.06)', borderRadius: '3px 3px 0 0', transition: 'height 0.4s', minHeight: '2px' }} />
                        <div style={{ fontSize: '9px', color: isToday ? '#22c55e' : 'rgba(255,255,255,0.25)', fontWeight: isToday ? 700 : 400 }}>{weekday.slice(0, 1)}</div>
                    </div>
                );
            })}
        </div>
    );
};

// ── Live clock ─────────────────────────────────────────────────
const LiveClock: React.FC = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
    return (
        <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', fontFamily: 'monospace', letterSpacing: '1px' }}>
                {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                {time.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            </div>
        </div>
    );
};

// ── SLA Urgency bar ────────────────────────────────────────────
const UrgencyBar: React.FC<{ hours: number }> = ({ hours }) => {
    const pct = Math.min((hours / 72) * 100, 100);
    const color = hours > 48 ? '#ef4444' : hours > 24 ? '#f59e0b' : '#22c55e';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px', transition: 'width 0.4s' }} />
            </div>
            <span style={{ fontSize: '11px', color, fontWeight: 700, minWidth: '36px', textAlign: 'right' }}>
                {hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}d`}
            </span>
        </div>
    );
};

// ── Dashboard principal ────────────────────────────────────────
export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const intervalRef = useRef<any>(null);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const load = useCallback(async () => {
        try {
            const res = await api.get('/orders/dashboard');
            setStats(res.data);
            setLastUpdate(new Date());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    // Auto-refresh a cada 60s
    useEffect(() => {
        if (autoRefresh) {
            intervalRef.current = setInterval(load, 60000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [autoRefresh, load]);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px', color: 'rgba(255,255,255,0.4)' }}>
            <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} /> Carregando dashboard...
            <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
        </div>
    );

    if (!stats) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px', color: 'rgba(255,255,255,0.4)' }}>
            <AlertCircle size={32} color="#ef4444" />
            <div style={{ fontSize: '15px' }}>Falha temporária de rede ao carregar os dados.</div>
            <button onClick={load} style={{ marginTop: '10px', padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Tentar novamente</button>
        </div>
    );

    const s = stats!;

    const activeOS = (s.byStatus?.aberta || 0) + (s.byStatus?.em_diagnostico || 0) + (s.byStatus?.aguardando_peca || 0) + (s.byStatus?.em_reparo || 0) + (s.byStatus?.testes || 0);
    const revTrend = pctChange(s.monthlyRevenue, s.prevMonthRevenue);
    const slaWarning = (s.slaViolations || []).filter((o:any) => o.hoursOpen > 48).length;
    const hora = new Date().getHours();
    const greeting = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

            {/* ── HEADER ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0 }}>
                        {greeting}, {user?.name?.split(' ')[0]} 👋
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: autoRefresh ? '#22c55e' : '#6b7280', animation: autoRefresh ? 'pulse 2s infinite' : 'none' }} />
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                            Atualizado às {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button onClick={() => setAutoRefresh(a => !a)} style={{ fontSize: '11px', color: autoRefresh ? '#22c55e' : 'rgba(255,255,255,0.3)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0', textDecoration: 'underline' }}>
                            {autoRefresh ? 'auto-refresh on' : 'auto-refresh off'}
                        </button>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <LiveClock />
                    <button onClick={load} style={{ padding: '9px 14px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'rgba(255,255,255,0.55)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', minHeight: '40px' }}>
                        <RefreshCw size={14}/> Atualizar
                    </button>
                </div>
            </div>

            {/* ── ALERTA SLA ── */}
            {slaWarning > 0 && (
                <div onClick={() => navigate('/orders')} style={{ padding: '11px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '11px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.12)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}>
                    <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '13px', color: '#fca5a5', fontWeight: 600 }}>
                            {slaWarning} OS com mais de 48h sem atualização
                        </span>
                        <span style={{ fontSize: '12px', color: 'rgba(239,68,68,0.7)', marginLeft: '6px' }}>— requer atenção</span>
                    </div>
                    <ChevronRight size={14} color="#ef4444" />
                </div>
            )}

            {/* ── KPIs LINHA 1 ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: '10px' }}>
                <KpiCard label="OS Ativas" value={activeOS} icon={ClipboardList} color="#3b82f6" sub="em andamento" onClick={() => navigate('/orders')} />
                <KpiCard label="Abertas Hoje" value={s.todayOpened || 0} icon={Zap} color="#a855f7" sub="novas entradas" />
                <KpiCard label="Entregues Hoje" value={s.todayDelivered || 0} icon={CheckCircle} color="#22c55e" sub="concluídas hoje" />
                <KpiCard label="Ag. Peça" value={s.byStatus?.aguardando_peca || 0} icon={Package} color="#f59e0b" sub="paradas" onClick={() => navigate('/orders')} urgent={(s.byStatus?.aguardando_peca || 0) > 5} />
                <KpiCard label="SLA em Risco" value={(s.slaViolations || []).length} icon={Timer} color="#ef4444" sub="+24h sem mover" urgent={(s.slaViolations || []).length > 0} onClick={() => navigate('/orders')} />
                {user?.canViewFinancials !== false && <KpiCard label="Faturamento Mês" value={R$(s.monthlyRevenue)} icon={TrendingUp} color="#22c55e" sub="mês atual" trend={revTrend} onClick={() => navigate('/finance')} />}
            </div>

            {/* ── LINHA 2: Funil + Gráfico 7 dias ── */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                {/* Funil de status */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <Activity size={16} color="#3b82f6"/>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Pipeline de OS</span>
                        </div>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{s.total} total</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Object.entries(s.byStatus || {}).filter(([, v]) => v > 0).sort(([, a], [, b]) => b - a).map(([status, count]) => {
                            const pct = Math.round((count / (s.total || 1)) * 100);
                            const color = STATUS_COLOR[status] || '#94a3b8';
                            return (
                                <div key={status}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{STATUS_LABEL[status]}</span>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color }}>{count}<span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400, fontSize: '11px' }}> ({pct}%)</span></span>
                                    </div>
                                    <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px', transition: 'width 0.6s', opacity: 0.85 }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Faturamento 7 dias */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <BarChart2 size={16} color="#22c55e"/>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Faturamento — 7 dias</span>
                        </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 900, color: '#22c55e', letterSpacing: '-0.5px' }}>
                            {R$(s.last7days?.reduce((acc, d) => acc + d.revenue, 0) || 0)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>total nos últimos 7 dias</div>
                    </div>
                    {s.last7days && <MiniBarChart data={s.last7days} />}

                    {/* Meta do mês */}
                    <div style={{ marginTop: '14px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Mês atual vs anterior</span>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: revTrend >= 0 ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                {revTrend >= 0 ? <ArrowUpRight size={11}/> : <ArrowDownRight size={11}/>}
                                {Math.abs(revTrend).toFixed(1)}%
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                            <span>Este mês: <strong style={{ color: '#22c55e' }}>{R$(s.monthlyRevenue)}</strong></span>
                            <span>Anterior: <strong style={{ color: 'rgba(255,255,255,0.6)' }}>{R$(s.prevMonthRevenue)}</strong></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── SLA — OS sem mover ── */}
            {(s.slaViolations || []).length > 0 && (
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '14px', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Timer size={16} color="#ef4444"/>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>OS Paradas — SLA em Risco</span>
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '1px 7px', borderRadius: '20px', background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>{(s.slaViolations || []).length}</span>
                        </div>
                        <button onClick={() => navigate('/orders')} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Ver todas <ChevronRight size={13}/>
                        </button>
                    </div>
                    <div style={{ padding: '4px 0' }}>
                        {(s.slaViolations || []).slice(0, 6).map((item, i) => (
                            <div key={item.id} onClick={() => navigate('/orders')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 18px', borderBottom: i < Math.min((s.slaViolations || []).length, 6) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer', transition: 'background 0.12s' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                <div style={{ flexShrink: 0 }}>
                                    <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#60a5fa', fontWeight: 700 }}>#{item.protocol}</div>
                                    <div style={{ fontSize: '10px', color: PRIORITY_COLOR[item.priority] || '#94a3b8', marginTop: '1px' }}>{PRIORITY_LABEL[item.priority] || item.priority}</div>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.clientName}</div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.equipment}</div>
                                </div>
                                <StatusBadge status={item.status} />
                                <UrgencyBar hours={item.hoursOpen} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── ORDENS RECENTES ── */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ClipboardList size={16} color="#3b82f6"/>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Últimas Ordens de Serviço</span>
                    </div>
                    <button onClick={() => navigate('/orders')} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Ver todas <ChevronRight size={13}/>
                    </button>
                </div>
                {isMobile ? (
                    /* Cards no mobile */
                    <div style={{ padding: '4px 0' }}>
                        {(s.recentOrders || []).length === 0 ? (
                            <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Nenhuma OS encontrada</div>
                        ) : (s.recentOrders || []).map((o, i) => (
                            <div key={o.id} onClick={() => navigate('/orders')}
                                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: i < (s.recentOrders || []).length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#60a5fa', fontWeight: 700 }}>#{o.protocol}</span>
                                        <StatusBadge status={o.status} />
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.clientName}</div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {o.equipmentBrand} {o.equipmentModel}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontSize: '11px', color: PRIORITY_COLOR[o.priority] || '#94a3b8', marginBottom: '2px' }}>{PRIORITY_LABEL[o.priority]}</div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{new Date(o.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Tabela no desktop */
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    {['Protocolo', 'Cliente', 'Equipamento', 'Status', 'Prioridade', 'Data'].map(h => (
                                        <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(s.recentOrders || []).length === 0 ? (
                                    <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Nenhuma OS encontrada</td></tr>
                                ) : (s.recentOrders || []).map((o, i) => (
                                    <tr key={o.id} onClick={() => navigate('/orders')} style={{ borderBottom: i < (s.recentOrders || []).length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer', transition: 'background 0.12s' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '12px', color: '#60a5fa', fontWeight: 700 }}>#{o.protocol}</td>
                                        <td style={{ padding: '10px 14px', fontSize: '13px', color: '#fff', fontWeight: 500, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.clientName}</td>
                                        <td style={{ padding: '10px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <Smartphone size={12} color="rgba(255,255,255,0.3)"/>
                                                {o.equipmentBrand} {o.equipmentModel}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px 14px' }}><StatusBadge status={o.status}/></td>
                                        <td style={{ padding: '10px 14px' }}>
                                            <span style={{ fontSize: '11px', color: PRIORITY_COLOR[o.priority] || '#94a3b8' }}>
                                                {PRIORITY_LABEL[o.priority] || o.priority}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
                                            {new Date(o.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── ATALHOS RÁPIDOS ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                {[
                    { label: 'Nova OS', icon: '➕', color: '#3b82f6', path: '/orders' },
                    { label: 'Clientes', icon: '👥', color: '#a855f7', path: '/clients' },
                    { label: 'Estoque', icon: '📦', color: '#f97316', path: '/inventory' },
                    ...(user?.canViewFinancials !== false ? [{ label: 'Financeiro', icon: '💰', color: '#22c55e', path: '/finance' }] : []),
                    // Comissões (também envolve dinheiro, talvez esconder se quiser)
                    ...(user?.canViewFinancials !== false ? [{ label: 'Comissões', icon: '🏆', color: '#f59e0b', path: '/commissions' }] : []),
                    { label: 'Relatórios', icon: '📊', color: '#06b6d4', path: '/reports' },
                ].map(({ label, icon, color, path }) => (
                    <button key={label} onClick={() => navigate(path)} style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.15s', textAlign: 'left' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${color}10`; (e.currentTarget as HTMLElement).style.borderColor = `${color}30`; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                        <span style={{ fontSize: '18px' }}>{icon}</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
