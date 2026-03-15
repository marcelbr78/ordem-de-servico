import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import {
    Activity, CheckCircle, XCircle, AlertTriangle, RefreshCw,
    Database, MessageCircle, CreditCard, Server,
    TrendingUp, Users, ShoppingCart, DollarSign, UserPlus,
    Clock, Zap, Globe, Shield,
} from 'lucide-react';

// ── Tipos ──────────────────────────────────────────────────────
interface ServiceStatus {
    name: string; status: 'up' | 'down' | 'degraded' | 'unknown';
    latencyMs?: number; message?: string; checkedAt: string;
}
interface PlatformMetrics {
    totalTenants: number; activeTenants: number; trialTenants: number;
    suspendedTenants: number; pastDueTenants: number; activeSubscriptions: number;
    mrr: number; newTenantsToday: number; newTenantsThisWeek: number;
    churnedThisMonth: number; globalUsers: number; ordersToday: number; ordersThisWeek: number;
}
interface ErrorEvent { time: string; type: string; message: string; tenantId?: string; }
interface WebhookStats { receivedToday: number; deliveredToday: number; failedToday: number; avgLatencyMs: number; }
interface HealthReport {
    timestamp: string; overall: 'healthy' | 'degraded' | 'critical';
    services: ServiceStatus[]; metrics: PlatformMetrics;
    recentErrors: ErrorEvent[]; webhookStats: WebhookStats;
}

// ── Helpers ────────────────────────────────────────────────────
const fmtCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const SERVICE_ICONS: Record<string, React.ElementType> = {
    'Database': Database,
    'Evolution': MessageCircle,
    'Billing': CreditCard,
    'WhatsApp': MessageCircle,
};
const getServiceIcon = (name: string) => {
    const k = Object.keys(SERVICE_ICONS).find(k => name.includes(k));
    return k ? SERVICE_ICONS[k] : Server;
};

const STATUS_CFG = {
    up:       { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.25)',  label: 'Operacional', icon: CheckCircle },
    down:     { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)',  label: 'Fora do ar',  icon: XCircle },
    degraded: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)', label: 'Degradado',   icon: AlertTriangle },
    unknown:  { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)', label: 'Desconhecido',icon: AlertTriangle },
};

const OVERALL_CFG = {
    healthy:  { color: '#22c55e', label: '✓ Todos os sistemas operacionais',  bg: 'rgba(34,197,94,0.08)'  },
    degraded: { color: '#f59e0b', label: '⚠ Degradação em alguns serviços',   bg: 'rgba(245,158,11,0.08)' },
    critical: { color: '#ef4444', label: '✗ Problemas críticos detectados',   bg: 'rgba(239,68,68,0.08)'  },
};

// ── Componente KPI ─────────────────────────────────────────────
const KPI: React.FC<{ label: string; value: string | number; icon: React.ElementType; color: string; sub?: string }> =
    ({ label, value, icon: Icon, color, sub }) => (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={14} color={color} />
            </div>
        </div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>{value}</div>
        {sub && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '3px' }}>{sub}</div>}
    </div>
);

// ── Página principal ───────────────────────────────────────────
export const HealthMonitor: React.FC = () => {
    const [report, setReport] = useState<HealthReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const r = await api.get('/admin/dashboard/health');
            setReport(r.data);
            setLastRefresh(new Date());
        } catch (e: any) {
            console.error('Health check failed:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (!autoRefresh) return;
        const iv = setInterval(() => load(true), 30000); // 30s auto-refresh
        return () => clearInterval(iv);
    }, [autoRefresh, load]);

    const overall = report ? OVERALL_CFG[report.overall] : null;
    const m = report?.metrics;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Activity size={20} color="#3b82f6" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0 }}>Health Monitor</h1>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>
                            {lastRefresh ? `Última atualização: ${fmtTime(lastRefresh.toISOString())}` : 'Carregando...'}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Auto refresh toggle */}
                    <button onClick={() => setAutoRefresh(a => !a)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '8px', background: autoRefresh ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${autoRefresh ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.1)'}`, color: autoRefresh ? '#22c55e' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                        <Zap size={12} /> {autoRefresh ? 'Auto: ON' : 'Auto: OFF'}
                    </button>
                    <button onClick={() => load(false)} disabled={loading} style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: loading ? '#3b82f6' : 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex' }}>
                        <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                    </button>
                </div>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>

            {/* Overall status banner */}
            {overall && (
                <div style={{ padding: '14px 18px', borderRadius: '12px', background: overall.bg, border: `1px solid ${overall.color}30`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: overall.color, flexShrink: 0, boxShadow: `0 0 0 3px ${overall.color}25`, animation: report?.overall === 'healthy' ? 'none' : 'pulse 2s infinite' }} />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: overall.color }}>{overall.label}</span>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginLeft: 'auto' }}>
                        {report?.timestamp ? fmtTime(report.timestamp) : ''}
                    </span>
                </div>
            )}

            {/* Serviços */}
            <div>
                <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px' }}>Serviços</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                    {loading && !report ? [1,2,3].map(i => (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px', height: '80px', animation: 'pulse 1.5s infinite' }} />
                    )) : report?.services.map(svc => {
                        const cfg = STATUS_CFG[svc.status] || STATUS_CFG.unknown;
                        const Icon = getServiceIcon(svc.name);
                        const StatusIcon = cfg.icon;
                        return (
                            <div key={svc.name} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Icon size={15} color={cfg.color} />
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{svc.name.split('(')[0].trim()}</span>
                                    </div>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: cfg.color }}>
                                        <StatusIcon size={11} /> {cfg.label}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', flex: 1 }}>{svc.message}</span>
                                    {svc.latencyMs !== undefined && (
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: svc.latencyMs > 300 ? '#f59e0b' : '#22c55e', flexShrink: 0 }}>
                                            {svc.latencyMs}ms
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Métricas da plataforma */}
            <div>
                <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px' }}>Plataforma</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                    {m && <>
                        <KPI label="MRR" value={fmtCurrency(m.mrr)} icon={DollarSign} color="#22c55e" sub="receita mensal recorrente" />
                        <KPI label="Tenants ativos" value={m.activeTenants} icon={Globe} color="#3b82f6" sub={`${m.trialTenants} em trial`} />
                        <KPI label="Novos hoje" value={m.newTenantsToday} icon={UserPlus} color="#a855f7" sub={`${m.newTenantsThisWeek} esta semana`} />
                        <KPI label="Usuários globais" value={m.globalUsers} icon={Users} color="#06b6d4" />
                        <KPI label="OS hoje" value={m.ordersToday} icon={ShoppingCart} color="#f59e0b" sub={`${m.ordersThisWeek} esta semana`} />
                        <KPI label="Churn/mês" value={m.churnedThisMonth} icon={TrendingUp} color={m.churnedThisMonth > 0 ? '#ef4444' : '#22c55e'} sub="cancelamentos" />
                        <KPI label="Inadimplentes" value={m.pastDueTenants} icon={AlertTriangle} color={m.pastDueTenants > 0 ? '#f97316' : '#22c55e'} sub="past due" />
                        <KPI label="Suspensos" value={m.suspendedTenants} icon={Shield} color={m.suspendedTenants > 0 ? '#ef4444' : '#22c55e'} />
                    </>}
                </div>
            </div>

            {/* Webhooks */}
            {report?.webhookStats && (
                <div>
                    <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px' }}>Webhooks hoje</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                        {[
                            { label: 'Recebidos', value: report.webhookStats.receivedToday, color: '#3b82f6' },
                            { label: 'Entregues', value: report.webhookStats.deliveredToday, color: '#22c55e' },
                            { label: 'Falhas', value: report.webhookStats.failedToday, color: report.webhookStats.failedToday > 0 ? '#ef4444' : '#22c55e' },
                        ].map(({ label, value, color }) => (
                            <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}20`, borderRadius: '10px', padding: '12px 14px', textAlign: 'center' }}>
                                <div style={{ fontSize: '24px', fontWeight: 800, color }}>{value}</div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '3px' }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Erros recentes */}
            {report?.recentErrors && report.recentErrors.length > 0 && (
                <div>
                    <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px' }}>Erros recentes</h3>
                    <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
                        {report.recentErrors.slice(0, 10).map((err, i) => (
                            <div key={i} style={{ display: 'flex', gap: '12px', padding: '10px 14px', borderBottom: i < report.recentErrors.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'flex-start' }}>
                                <XCircle size={13} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '12px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{err.message}</div>
                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{err.type} · {fmtTime(err.time)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {report?.recentErrors?.length === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '10px', fontSize: '13px', color: '#22c55e' }}>
                    <CheckCircle size={14} /> Nenhum erro registrado nas últimas 24h
                </div>
            )}
        </div>
    );
};
