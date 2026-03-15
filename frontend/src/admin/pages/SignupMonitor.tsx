import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import type { TenantAdminDto } from '../../services/adminService';
import { UserPlus, Clock, CheckCircle, AlertCircle, Store, Eye } from 'lucide-react';

// ── Trial days remaining ───────────────────────────────────────
function trialDaysLeft(tenantCreatedAt: string): number | null {
    const TRIAL_DAYS = 14;
    const created = new Date(tenantCreatedAt);
    const now = new Date();
    const daysElapsed = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    const remaining = TRIAL_DAYS - daysElapsed;
    return remaining;
}

// ── Status Config ─────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
    trial: { label: 'Trial', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', icon: Clock },
    active: { label: 'Ativo', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', icon: CheckCircle },
    suspended: { label: 'Suspenso', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', icon: AlertCircle },
    past_due: { label: 'Atrasado', color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)', icon: AlertCircle },
};
const getCfg = (s: string) => STATUS_CFG[s?.toLowerCase()] ?? STATUS_CFG['active'];

// ── Trial Progress Bar ────────────────────────────────────────
const TrialBar = ({ daysLeft }: { daysLeft: number }) => {
    const pct = Math.max(0, Math.min(100, Math.round((daysLeft / 14) * 100)));
    const color = daysLeft <= 3 ? '#ef4444' : daysLeft <= 7 ? '#f59e0b' : '#10b981';
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={12} color={color} />
                    Trial restante
                </span>
                <span style={{ fontSize: '12px', fontWeight: 800, color }}>
                    {daysLeft > 0 ? `${daysLeft} dias` : 'Expirado'}
                </span>
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '100px', transition: 'width 0.5s ease' }} />
            </div>
        </div>
    );
};

// ── Signup Card ───────────────────────────────────────────────
const SignupCard = ({ tenant, onView }: { tenant: TenantAdminDto; onView: () => void }) => {
    const sub = (tenant as unknown as { subscription?: { status?: string; plan?: { name?: string; price?: number } } }).subscription;
    const plan = sub?.plan;
    const status = sub?.status ?? tenant.status;
    const cfg = getCfg(status);
    const StatusIcon = cfg.icon;
    const daysLeft = trialDaysLeft(tenant.createdAt);
    const isTrial = status === 'trial' || (daysLeft !== null && daysLeft <= 14 && daysLeft >= 0 && status === 'active');

    return (
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: `3px solid ${cfg.color}`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: `${cfg.color}06`, borderRadius: '0 0 0 100%' }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${cfg.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Store size={22} color={cfg.color} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#fff', margin: 0 }}>{tenant.name || tenant.storeName || '—'}</h3>
                        {tenant.email && <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{tenant.email}</p>}
                    </div>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, padding: '5px 12px', borderRadius: '100px', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, flexShrink: 0 }}>
                    <StatusIcon size={11} />
                    {cfg.label}
                </span>
            </div>

            {/* Plan */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>Plano:</span>
                <span style={{ fontSize: '13px', fontWeight: 800, padding: '4px 12px', borderRadius: '100px', background: 'rgba(59,130,246,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(59,130,246,0.2)', textTransform: 'capitalize' }}>
                    {plan?.name ?? 'Sem Plano'}
                </span>
                {plan?.price !== undefined && (
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                        {plan.price === 0 ? 'Grátis' : `R$${Number(plan.price).toFixed(2)}/mês`}
                    </span>
                )}
            </div>

            {/* Trial progress */}
            {isTrial && daysLeft !== null && <TrialBar daysLeft={daysLeft} />}

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>
                    Cadastro: {new Date(tenant.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <button onClick={onView} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    <Eye size={13} />
                    Ver Detalhes
                </button>
            </div>
        </div>
    );
};

// ── Summary Stat ──────────────────────────────────────────────
const Stat = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
        <span style={{ fontSize: '32px', fontWeight: 900, color }}>{value}</span>
    </div>
);

// ── Main Page ─────────────────────────────────────────────────
type FilterType = 'all' | 'trial' | 'active' | 'suspended';

export const SignupMonitor: React.FC = () => {
    const [tenants, setTenants] = useState<TenantAdminDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');
    const navigate = useNavigate();

    useEffect(() => {
        adminService.getTenants(1, 200)
            .then(res => setTenants(Array.isArray(res) ? res : res.data ?? []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const trialTenants = tenants.filter(t => {
        const sub = (t as unknown as { subscription?: { status?: string } }).subscription;
        return (sub?.status ?? t.status) === 'trial';
    });
    const activeCount = tenants.filter(t => t.status === 'active').length;
    const suspendedCount = tenants.filter(t => t.status === 'suspended').length;

    const displayed = tenants.filter(t => {
        const sub = (t as unknown as { subscription?: { status?: string } }).subscription;
        const s = sub?.status ?? t.status;
        if (filter === 'all') return true;
        if (filter === 'trial') return s === 'trial';
        if (filter === 'active') return t.status === 'active';
        if (filter === 'suspended') return t.status === 'suspended';
        return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const filterButtons: { key: FilterType; label: string; color: string }[] = [
        { key: 'all', label: `Todos (${tenants.length})`, color: 'rgba(255,255,255,0.7)' },
        { key: 'trial', label: `Trial (${trialTenants.length})`, color: '#f59e0b' },
        { key: 'active', label: `Ativos (${activeCount})`, color: '#10b981' },
        { key: 'suspended', label: `Suspensos (${suspendedCount})`, color: '#ef4444' },
    ];

    if (loading) {
        return (
            <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '2px' }}>CARREGANDO CADASTROS...</div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Header */}
            <header>
                <h1 className="gradient-text" style={{ fontSize: '32px', fontWeight: 900, margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <UserPlus size={28} color="var(--accent-primary)" />
                    Signup Monitor
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', marginTop: '8px' }}>
                    Acompanhe novos cadastros, trials ativos e status de onboarding.
                </p>
            </header>

            {/* Summary stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <Stat label="Total Registrados" value={tenants.length} color="#fff" />
                <Stat label="Em Trial" value={trialTenants.length} color="#f59e0b" />
                <Stat label="Ativos" value={activeCount} color="#10b981" />
                <Stat label="Suspensos" value={suspendedCount} color="#ef4444" />
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {filterButtons.map(fb => (
                    <button key={fb.key} onClick={() => setFilter(fb.key)} style={{ padding: '8px 18px', borderRadius: '100px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', background: filter === fb.key ? `${fb.color}18` : 'rgba(255,255,255,0.04)', color: filter === fb.key ? fb.color : 'rgba(255,255,255,0.4)', border: `1px solid ${filter === fb.key ? `${fb.color}40` : 'rgba(255,255,255,0.08)'}` }}>
                        {fb.label}
                    </button>
                ))}
            </div>

            {/* Cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                {displayed.map(t => (
                    <SignupCard
                        key={t.id}
                        tenant={t}
                        onView={() => navigate(`/masteradmin/tenants/${t.id}`)}
                    />
                ))}
                {displayed.length === 0 && (
                    <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', gridColumn: '1 / -1' }}>
                        Nenhum cadastro encontrado para o filtro selecionado.
                    </div>
                )}
            </div>

            {/* Trial expiring warn */}
            {trialTenants.filter(t => {
                const d = trialDaysLeft(t.createdAt);
                return d !== null && d <= 3 && d >= 0;
            }).length > 0 && (
                    <div style={{ padding: '16px 20px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <AlertCircle size={18} color="#ef4444" />
                        <span style={{ fontSize: '14px', color: '#ef4444', fontWeight: 700 }}>
                            {trialTenants.filter(t => { const d = trialDaysLeft(t.createdAt); return d !== null && d <= 3 && d >= 0; }).length} assistência(s) com trial expirando em menos de 3 dias!
                        </span>
                    </div>
                )}
        </div>
    );
};
