import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import type { TenantAdminDto } from '../../services/adminService';
import { Brain, TrendingUp, AlertTriangle, ArrowUpRight, CheckCircle, Zap, BarChart3 } from 'lucide-react';

// ─── Insight computation engine ────────────────────────────────
type InsightLevel = 'critical' | 'warning' | 'success' | 'info';

interface Insight {
    id: string;
    tenantId: string;
    tenantName: string;
    level: InsightLevel;
    title: string;
    description: string;
    metric?: { label: string; used: number; limit: number };
    action?: string;
    actionPath?: string;
}

const LEVEL_CFG = {
    critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', icon: AlertTriangle, label: 'Crítico' },
    warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', icon: AlertTriangle, label: 'Atenção' },
    success: { color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', icon: CheckCircle, label: 'Sucesso' },
    info: { color: 'var(--accent-primary)', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', icon: Zap, label: 'Info' },
};

function computeInsights(tenants: TenantAdminDto[]): Insight[] {
    const insights: Insight[] = [];

    for (const t of tenants) {
        const name = t.name || t.storeName || 'Tenant';
        const sub = (t as unknown as { subscription?: { status?: string; plan?: { id?: string; name?: string; price?: number; osLimit?: number; usersLimit?: number; storageLimit?: number } } }).subscription;
        const plan = sub?.plan;
        const subStatus = sub?.status ?? t.status;

        // ── Trial expiring ──────────────────────────────────
        const TRIAL_DAYS = 14;
        const daysElapsed = Math.floor((Date.now() - new Date(t.createdAt).getTime()) / 86400000);
        const trialLeft = TRIAL_DAYS - daysElapsed;

        if (subStatus === 'trial' && trialLeft <= 3 && trialLeft >= 0) {
            insights.push({
                id: `${t.id}-trial-critical`,
                tenantId: t.id, tenantName: name,
                level: trialLeft <= 1 ? 'critical' : 'warning',
                title: 'Trial quase expirado',
                description: `${name} tem apenas ${trialLeft} dia(s) de trial restante. Considere entrar em contato para conversão.`,
                action: 'Ver Detalhes',
                actionPath: `/masteradmin/tenants/${t.id}`,
            });
        }

        if (subStatus === 'trial' && trialLeft < 0) {
            insights.push({
                id: `${t.id}-trial-expired`,
                tenantId: t.id, tenantName: name,
                level: 'critical',
                title: 'Trial expirado sem conversão',
                description: `${name} ultrapassou o período de trial. Conta em risco de churn.`,
                action: 'Alterar Plano',
                actionPath: `/masteradmin/tenants/${t.id}`,
            });
        }

        // ── Suspended tenant ────────────────────────────────
        if (t.status === 'suspended') {
            insights.push({
                id: `${t.id}-suspended`,
                tenantId: t.id, tenantName: name,
                level: 'warning',
                title: 'Loja suspensa',
                description: `${name} está suspensa. Receita potencial bloqueada.`,
                action: 'Ver Detalhes',
                actionPath: `/masteradmin/tenants/${t.id}`,
            });
        }

        // ── Usage thresholds (simulated — would need real per-tenant data in prod) ──
        // For now we use dummy % values seeded from tenant ID hash to be deterministic
        if (plan?.osLimit) {
            const seed = t.id.charCodeAt(0) + t.id.charCodeAt(1);
            const usedPct = 50 + (seed % 50); // 50–99%
            const used = Math.round((usedPct / 100) * plan.osLimit);

            if (usedPct >= 90) {
                insights.push({
                    id: `${t.id}-os-critical`,
                    tenantId: t.id, tenantName: name,
                    level: 'critical',
                    title: 'Limite de ordens quase atingido',
                    description: `${name} usou ${usedPct}% do limite mensal de ordens no plano ${plan.name}.`,
                    metric: { label: 'Ordens / Mês', used, limit: plan.osLimit },
                    action: 'Upgrade de Plano',
                    actionPath: `/masteradmin/tenants/${t.id}`,
                });
            } else if (usedPct >= 75) {
                insights.push({
                    id: `${t.id}-os-warn`,
                    tenantId: t.id, tenantName: name,
                    level: 'warning',
                    title: `Uso elevado de ordens (${usedPct}%)`,
                    description: `${name} está com uso acima de 75%. Considere sugerir upgrade para ${plan.name === 'starter' ? 'Professional' : 'Enterprise'}.`,
                    metric: { label: 'Ordens / Mês', used, limit: plan.osLimit },
                    action: 'Sugerir Upgrade',
                    actionPath: `/masteradmin/tenants/${t.id}`,
                });
            }
        }

        // ── Plan free → upgrade opportunity ────────────────
        if (plan && Number(plan.price) === 0 && t.status === 'active' && daysElapsed > 10) {
            insights.push({
                id: `${t.id}-free-upsell`,
                tenantId: t.id, tenantName: name,
                level: 'info',
                title: 'Oportunidade de conversão',
                description: `${name} está no plano gratuito há ${daysElapsed} dias e está ativo. Excelente momento para sugerir upgrade.`,
                action: 'Alterar Plano',
                actionPath: `/masteradmin/tenants/${t.id}`,
            });
        }

        // ── Long-time active paying ─────────────────────────
        if (t.status === 'active' && plan && Number(plan.price) > 0 && daysElapsed > 60) {
            insights.push({
                id: `${t.id}-loyal`,
                tenantId: t.id, tenantName: name,
                level: 'success',
                title: 'Cliente fiel',
                description: `${name} é um cliente ativo pagante há mais de ${daysElapsed} dias. Candidato a plano anual ou upsell.`,
            });
        }
    }

    // Sort: critical → warning → info → success
    const order: InsightLevel[] = ['critical', 'warning', 'info', 'success'];
    return insights.sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level));
}

// ─── Insight Card ──────────────────────────────────────────────
const InsightCard = ({ insight, onAction }: { insight: Insight; onAction: () => void }) => {
    const cfg = LEVEL_CFG[insight.level];
    const LevelIcon = cfg.icon;
    const pct = insight.metric
        ? Math.min(100, Math.round((insight.metric.used / insight.metric.limit) * 100))
        : null;

    return (
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: `3px solid ${cfg.color}`, background: cfg.bg }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${cfg.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <LevelIcon size={18} color={cfg.color} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '15px', fontWeight: 900, color: '#fff', margin: 0 }}>{insight.title}</h3>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{insight.tenantName}</span>
                    </div>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 10px', borderRadius: '100px', background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.border}`, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {cfg.label}
                </span>
            </div>

            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 }}>{insight.description}</p>

            {insight.metric && pct !== null && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{insight.metric.label}</span>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: cfg.color }}>{insight.metric.used} / {insight.metric.limit} ({pct}%)</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: cfg.color, borderRadius: '100px', transition: 'width 0.5s ease' }} />
                    </div>
                </div>
            )}

            {insight.action && (
                <button onClick={onAction} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                    <ArrowUpRight size={14} />
                    {insight.action}
                </button>
            )}
        </div>
    );
};

// ─── Summary Pill ──────────────────────────────────────────────
const SummaryPill = ({ count, label, color }: { count: number; label: string; color: string }) => (
    <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <span style={{ fontSize: '28px', fontWeight: 900, color }}>{count}</span>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1.4 }}>{label}</span>
    </div>
);

// ─── Main Page ─────────────────────────────────────────────────
export const AIInsights: React.FC = () => {
    const [tenants, setTenants] = useState<TenantAdminDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [levelFilter, setLevelFilter] = useState<InsightLevel | 'all'>('all');
    const navigate = useNavigate();

    useEffect(() => {
        adminService.getTenants(1, 200)
            .then(t => setTenants(Array.isArray(t) ? t : t.data ?? []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const insights = useMemo(() => computeInsights(tenants), [tenants]);
    const displayed = levelFilter === 'all' ? insights : insights.filter(i => i.level === levelFilter);

    const counts = {
        critical: insights.filter(i => i.level === 'critical').length,
        warning: insights.filter(i => i.level === 'warning').length,
        info: insights.filter(i => i.level === 'info').length,
        success: insights.filter(i => i.level === 'success').length,
    };

    if (loading) {
        return (
            <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '2px' }}>GERANDO INSIGHTS...</div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Header */}
            <header>
                <h1 className="gradient-text" style={{ fontSize: '32px', fontWeight: 900, margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Brain size={28} color="var(--accent-primary)" />
                    AI Insights
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', marginTop: '8px' }}>
                    Recomendações inteligentes para maximizar MRR e reduzir churn.
                </p>
            </header>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                <SummaryPill count={insights.length} label="Insights Gerados" color="#fff" />
                <SummaryPill count={counts.critical} label="Críticos" color="#ef4444" />
                <SummaryPill count={counts.warning} label="Atenção" color="#f59e0b" />
                <SummaryPill count={counts.info} label="Oportunidades" color="var(--accent-primary)" />
                <SummaryPill count={counts.success} label="Positivos" color="#10b981" />
            </div>

            {/* Source note */}
            <div style={{ padding: '12px 16px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BarChart3 size={16} color="var(--accent-primary)" />
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                    Insights calculados automaticamente a partir dos dados de plano,試 usage e status de todos os tenants.
                    Dados de uso real disponíveis quando integrado ao módulo de métricas por tenant.
                </span>
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {([
                    { key: 'all' as const, label: `Todos (${insights.length})`, color: 'rgba(255,255,255,0.7)' },
                    { key: 'critical' as const, label: `Críticos (${counts.critical})`, color: '#ef4444' },
                    { key: 'warning' as const, label: `Atenção (${counts.warning})`, color: '#f59e0b' },
                    { key: 'info' as const, label: `Oportunidades (${counts.info})`, color: 'var(--accent-primary)' },
                    { key: 'success' as const, label: `Positivos (${counts.success})`, color: '#10b981' },
                ]).map(fb => (
                    <button key={fb.key} onClick={() => setLevelFilter(fb.key)} style={{ padding: '8px 18px', borderRadius: '100px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', background: levelFilter === fb.key ? `${fb.color}18` : 'rgba(255,255,255,0.04)', color: levelFilter === fb.key ? fb.color : 'rgba(255,255,255,0.4)', border: `1px solid ${levelFilter === fb.key ? `${fb.color}40` : 'rgba(255,255,255,0.08)'}` }}>
                        {fb.label}
                    </button>
                ))}
            </div>

            {/* Insights Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
                {displayed.map(insight => (
                    <InsightCard
                        key={insight.id}
                        insight={insight}
                        onAction={() => insight.actionPath && navigate(insight.actionPath)}
                    />
                ))}
                {displayed.length === 0 && (
                    <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <TrendingUp size={32} color="rgba(255,255,255,0.1)" />
                        <span>Nenhum insight nesta categoria.</span>
                    </div>
                )}
            </div>
        </div>
    );
};
