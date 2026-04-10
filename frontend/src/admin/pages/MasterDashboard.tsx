import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import type { AdminDashboardMetrics } from '../../services/adminService';
import { Users, DollarSign, Activity, TrendingUp, ShoppingBag, ArrowUpRight, TrendingDown } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Legend, ReferenceLine
} from 'recharts';

// ── KPI Card ──────────────────────────────────────────────────
const MetricCard = ({ title, value, icon: Icon, color, bg, trend, trendLabel, onClick }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    bg: string;
    trend?: number;
    trendLabel?: string;
    onClick?: () => void;
}) => (
    <div 
        className="glass-card" 
        onClick={onClick}
        style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', overflow: 'hidden', cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.2s, boxShadow 0.2s' }}
        onMouseEnter={e => { if (onClick) { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)'; } }}
        onMouseLeave={e => { if (onClick) { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; } }}
    >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${color}, transparent)` }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ width: '48px', height: '48px', background: bg, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={24} color={color} />
            </div>
            {trend !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '100px', background: trend >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${trend >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                    <ArrowUpRight size={12} color={trend >= 0 ? '#10b981' : '#ef4444'} style={{ transform: trend < 0 ? 'rotate(90deg)' : 'none' }} />
                    <span style={{ fontSize: '11px', fontWeight: 800, color: trend >= 0 ? '#10b981' : '#ef4444' }}>
                        {trend >= 0 ? '+' : ''}{trend}%
                    </span>
                </div>
            )}
        </div>
        <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px' }}>{title}</p>
            <h3 style={{ fontSize: '34px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-1px' }}>{value}</h3>
            {trendLabel && <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{trendLabel}</p>}
        </div>
    </div>
);

// ── Custom Tooltip ─────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 16px', backdropFilter: 'blur(8px)' }}>
            <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                {label}
            </p>
            {payload.map((p, i) => (
                <p key={i} style={{ margin: '3px 0', fontSize: '13px', fontWeight: 800, color: p.name === 'mrr' ? '#f59e0b' : p.name === 'forecast' ? '#a78bfa' : 'var(--accent-primary)' }}>
                    {p.name === 'mrr' ? `MRR Real: ` : p.name === 'forecast' ? `Previsão: ` : `Tenants: `}
                    {p.name === 'tenants' ? p.value : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.value)}
                </p>
            ))}
        </div>
    );
};

// ── Usage Bar ─────────────────────────────────────────────────
const UsageBar = ({ label, used, limit, color }: { label: string; used: number; limit: number; color: string }) => {
    const pct = limit === 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));
    const isWarning = pct >= 80;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: isWarning ? '#f59e0b' : '#fff' }}>
                    {limit === 0 ? `${used} / ∞` : `${used} / ${limit}`}
                    {limit > 0 && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginLeft: '6px' }}>({pct}%)</span>}
                </span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: '100px', background: isWarning ? '#f59e0b' : color, transition: 'width 0.6s ease' }} />
            </div>
        </div>
    );
};

// ── Forecast Engine ────────────────────────────────────────────
type ChartPoint = { month: string; mrr: number; tenants: number; forecast?: number; isProjected?: boolean };

function buildForecastData(historical: { month: string; mrr: number; tenants: number }[]): ChartPoint[] {
    if (historical.length < 2) return historical;

    // Simple linear regression on MRR
    const n = historical.length;
    const sumX = (n * (n - 1)) / 2;
    const sumX2 = ((n - 1) * n * (2 * n - 1)) / 6;
    const sumY = historical.reduce((a, p) => a + p.mrr, 0);
    const sumXY = historical.reduce((a, p, i) => a + i * p.mrr, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Add 3 forecast months
    const months_pt = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const now = new Date();
    const forecasts: ChartPoint[] = [];

    for (let i = 1; i <= 3; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const label = `${months_pt[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
        const projectedMrr = Math.max(0, Math.round(intercept + slope * (n - 1 + i)));
        forecasts.push({ month: label, mrr: 0, tenants: 0, forecast: projectedMrr, isProjected: true });
    }

    // Tag last historical point as bridge
    const combined: ChartPoint[] = historical.map((p, i) => ({
        ...p,
        forecast: i === historical.length - 1 ? p.mrr : undefined,
    }));

    return [...combined, ...forecasts];
}

// ── Platform Activity Feed Component ──────────────────────────
// (inline simplified version in the dashboard)
interface ActivityEvent {
    id: string;
    type: 'tenant_created' | 'plan_changed' | 'tenant_suspended' | 'tenant_activated' | 'user_created';
    title: string;
    subtitle: string;
    ts: Date;
}

const EVENT_CFG: Record<string, { color: string; emoji: string }> = {
    tenant_created: { color: '#10b981', emoji: '🏪' },
    plan_changed: { color: '#a78bfa', emoji: '📋' },
    tenant_suspended: { color: '#ef4444', emoji: '🔒' },
    tenant_activated: { color: '#10b981', emoji: '✅' },
    user_created: { color: 'var(--accent-primary)', emoji: '👤' },
};

function generateSeedActivity(tenants: { name?: string; storeName?: string; createdAt: string; status: string }[]): ActivityEvent[] {
    const events: ActivityEvent[] = [];
    tenants.forEach((t, i) => {
        const name = t.name || t.storeName || `Tenant #${i + 1}`;
        events.push({ id: `${i}-created`, type: 'tenant_created', title: 'Nova loja cadastrada', subtitle: name, ts: new Date(t.createdAt) });
        if (t.status === 'suspended') {
            events.push({ id: `${i}-suspended`, type: 'tenant_suspended', title: 'Loja suspensa', subtitle: name, ts: new Date(new Date(t.createdAt).getTime() + 86400000 * (5 + i % 10)) });
        }
    });
    return events.sort((a, b) => b.ts.getTime() - a.ts.getTime()).slice(0, 12);
}

const ActivityFeed = ({ events }: { events: ActivityEvent[] }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {events.map((ev, i) => {
            const cfg = EVENT_CFG[ev.type] ?? { color: '#fff', emoji: '•' };
            const isLast = i === events.length - 1;
            return (
                <div key={ev.id} style={{ display: 'flex', gap: '16px', paddingBottom: isLast ? 0 : '16px', position: 'relative' }}>
                    {/* Timeline line */}
                    {!isLast && <div style={{ position: 'absolute', left: '18px', top: '36px', bottom: 0, width: '2px', background: 'rgba(255,255,255,0.06)' }} />}
                    {/* Dot */}
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `${cfg.color}15`, border: `2px solid ${cfg.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0, zIndex: 1 }}>
                        {cfg.emoji}
                    </div>
                    <div style={{ paddingTop: '6px', flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{ev.title}</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.subtitle}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>
                            {ev.ts.toLocaleDateString('pt-BR')} {ev.ts.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>
            );
        })}
        {events.length === 0 && (
            <div style={{ padding: '24px', color: 'rgba(255,255,255,0.25)', textAlign: 'center', fontSize: '13px' }}>Sem atividade recente.</div>
        )}
    </div>
);

// ── Main Dashboard ─────────────────────────────────────────────
export const MasterDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
    const [chartData, setChartData] = useState<ChartPoint[]>([]);
    const [tenants, setTenants] = useState<{ name?: string; storeName?: string; createdAt: string; status: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [data, chart, tenantsRes] = await Promise.all([
                    adminService.getDashboard(),
                    adminService.getMrrChart().catch(() => []),
                    adminService.getTenants(1, 200).catch(() => ({ data: [], meta: { total: 0 } })),
                ]);
                setMetrics(data);
                setChartData(buildForecastData(chart));
                setTenants(tenantsRes.data ?? []);
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) {
        return (
            <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '2px' }}>CARREGANDO MÉTRICAS GLOBAIS...</div>
            </div>
        );
    }

    if (error || !metrics) {
        return <div style={{ padding: '32px', color: 'rgba(239,68,68,0.8)', fontWeight: 600, background: 'rgba(239,68,68,0.05)', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.15)' }}>⚠ Erro de conexão: Could not load dashboard data.</div>;
    }

    const mrr = metrics.activeMrr ?? metrics.mrr ?? 0;
    const activeTenants = metrics.activeTenants ?? metrics.activeSubscriptions ?? 0;
    const globalUsers = metrics.globalUsers ?? 0;
    const totalTenants = metrics.totalTenants ?? 0;

    // Churn calculation — suspended vs total
    const suspendedCount = tenants.filter(t => t.status === 'suspended').length;
    const churnRate = totalTenants > 0 ? ((suspendedCount / totalTenants) * 100).toFixed(1) : '0.0';

    // Forecast projected MRR (last point in chartData that has forecast)
    const forecastPoints = chartData.filter(p => p.isProjected && p.forecast !== undefined);
    const forecastMrr = forecastPoints.length > 0 ? forecastPoints[forecastPoints.length - 1].forecast ?? 0 : 0;

    // MRR trend
    const historical = chartData.filter(p => !p.isProjected);
    const mrrTrend = historical.length >= 2
        ? (() => {
            const prev = historical[historical.length - 2]?.mrr ?? 0;
            const curr = historical[historical.length - 1]?.mrr ?? 0;
            if (prev === 0) return null;
            return Math.round(((curr - prev) / prev) * 100);
        })() : null;

    const kpiCards = [
        { title: 'MRR Ativo', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mrr), icon: DollarSign, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', trend: mrrTrend ?? undefined, trendLabel: 'Receita recorrente mensal', onClick: () => navigate('/masteradmin/billing') },
        { title: 'Total Lojas', value: totalTenants, icon: ShoppingBag, color: 'var(--accent-primary)', bg: 'rgba(59,130,246,0.12)', trendLabel: `${activeTenants} lojas ativas`, onClick: () => navigate('/masteradmin/tenants') },
        { title: 'Lojas Ativas', value: activeTenants, icon: Activity, color: '#10b981', bg: 'rgba(16,185,129,0.12)', trendLabel: 'Assinaturas em dia', onClick: () => navigate('/masteradmin/tenants') },
        { title: 'Usuários Globais', value: globalUsers, icon: Users, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', trendLabel: 'Cadastrados na plataforma', onClick: () => navigate('/masteradmin/tenants') },
        { title: 'Churn Rate', value: `${churnRate}%`, icon: TrendingDown, color: suspendedCount > 0 ? '#ef4444' : '#10b981', bg: suspendedCount > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', trendLabel: `${suspendedCount} loja(s) suspensa(s)`, onClick: () => navigate('/masteradmin/analytics') },
        { title: 'Previsão 3 meses', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(forecastMrr), icon: TrendingUp, color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', trendLabel: 'MRR projetado via regressão linear', onClick: () => navigate('/masteradmin/analytics') },
    ];

    const platformUsage = [
        { label: 'Lojas vs Capacidade', used: totalTenants, limit: 500, color: 'var(--accent-primary)' },
        { label: 'Usuários Totais', used: globalUsers, limit: 1000, color: '#8b5cf6' },
    ];

    const brlFormat = (v: number) => v === 0 ? 'R$0' : `R$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`;

    // Find where historical ends for the forecast divider line
    const dividerMonth = historical.length > 0 ? historical[historical.length - 1].month : undefined;

    const activityEvents = generateSeedActivity(tenants);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <header>
                <h1 className="gradient-text" style={{ fontSize: '32px', fontWeight: 900, margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <TrendingUp size={28} color="var(--accent-primary)" />
                    Platform Overview
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', marginTop: '8px' }}>
                    Analytics em tempo real, previsão de receita e atividade da plataforma.
                </p>
            </header>

            {/* KPI Cards — 3 columns on wide, 2 on medium */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                {kpiCards.map((card, i) => <MetricCard key={i} {...card} />)}
            </div>

            {/* Main charts row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr min(340px, 38%)', gap: '20px', alignItems: 'start' }}>
                {/* MRR + Forecast Chart */}
                <div className="glass-card" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <TrendingUp size={18} color="#f59e0b" />
                            MRR + Previsão de Receita
                        </h2>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '11px', fontWeight: 700 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b' }}>
                                <span style={{ width: '20px', height: '2px', background: '#f59e0b', display: 'inline-block', borderRadius: '2px' }} /> MRR Real
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a78bfa' }}>
                                <span style={{ width: '20px', height: '2px', background: '#a78bfa', display: 'inline-block', borderRadius: '2px', borderTop: '2px dashed #a78bfa' }} /> Previsão
                            </span>
                        </div>
                    </div>
                    {chartData.length === 0 ? (
                        <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '14px', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '12px' }}>Sem dados ainda</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tickFormatter={brlFormat} tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
                                <Tooltip content={<CustomTooltip />} />
                                {dividerMonth && (
                                    <ReferenceLine x={dividerMonth} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" label={{ value: 'hoje', position: 'top', fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} />
                                )}
                                <Area type="monotone" dataKey="mrr" stroke="#f59e0b" strokeWidth={2.5} fill="url(#mrrGrad)" dot={{ fill: '#f59e0b', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls />
                                <Area type="monotone" dataKey="forecast" stroke="#a78bfa" strokeWidth={2} strokeDasharray="6 4" fill="url(#forecastGrad)" dot={{ fill: '#a78bfa', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Activity Feed */}
                <div className="glass-card" style={{ padding: '28px', maxHeight: '380px', overflowY: 'auto' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite', display: 'inline-block' }} />
                        Atividade Recente
                    </h2>
                    <ActivityFeed events={activityEvents} />
                </div>
            </div>

            {/* Tenant Growth + Capacity */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Tenant Growth */}
                {chartData.length > 0 && (
                    <div className="glass-card" style={{ padding: '28px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ShoppingBag size={16} color="var(--accent-primary)" />
                            Crescimento de Tenants
                        </h2>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={chartData.filter(p => !p.isProjected)} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend formatter={() => 'Tenants Ativos'} wrapperStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }} />
                                <Bar dataKey="tenants" fill="var(--accent-primary)" radius={[6, 6, 0, 0]} fillOpacity={0.8} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Platform Capacity */}
                <div className="glass-card" style={{ padding: '28px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: '0 0 20px' }}>Capacidade da Plataforma</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {platformUsage.map((u, i) => <UsageBar key={i} {...u} />)}
                        {/* Churn visual */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Taxa de Churn</span>
                                <span style={{ fontSize: '13px', fontWeight: 800, color: suspendedCount > 0 ? '#ef4444' : '#10b981' }}>{churnRate}%</span>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.min(100, parseFloat(churnRate))}%`, borderRadius: '100px', background: suspendedCount > 0 ? '#ef4444' : '#10b981', transition: 'width 0.6s ease' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
