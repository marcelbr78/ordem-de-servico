import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import type { TenantAdminDto, PlanDto } from '../../services/adminService';
import {
    ArrowLeft, Store, BarChart3, Users, Package,
    TrendingUp, Calendar, Mail, Building2, Check, X
} from 'lucide-react';

// ─── Status Badge ──────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    active: { label: '🟢 ACTIVE', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
    trial: { label: '🟡 TRIAL', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
    suspended: { label: '🔴 SUSPENDED', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
    past_due: { label: '🟠 PAST_DUE', color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)' },
    inactive: { label: '⚪ INACTIVE', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.25)' },
};
const getStatusCfg = (s: string) => STATUS_CONFIG[s?.toLowerCase()] ?? STATUS_CONFIG['inactive'];

const StatusBadge = ({ status }: { status: string }) => {
    const cfg = getStatusCfg(status);
    return (
        <span style={{ fontSize: '13px', fontWeight: 800, padding: '6px 16px', borderRadius: '100px', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
            {cfg.label}
        </span>
    );
};

// ─── Progress Bar ──────────────────────────────────────────────
const UsageRow = ({ label, icon: Icon, used, limit, color }: {
    label: string; icon: React.ElementType; used: number; limit: number; color: string
}) => {
    const pct = limit === 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));
    const isWarning = pct >= 80;
    const barColor = isWarning ? '#f59e0b' : color;
    return (
        <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={18} color={color} />
                    </div>
                    <span style={{ fontWeight: 700, color: '#fff', fontSize: '15px' }}>{label}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '22px', fontWeight: 900, color: isWarning ? '#f59e0b' : '#fff' }}>
                        {used}
                    </span>
                    <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)', marginLeft: '4px' }}>
                        / {limit === 0 ? '∞' : limit}
                    </span>
                    {limit > 0 && (
                        <div style={{ fontSize: '11px', color: isWarning ? '#f59e0b' : 'rgba(255,255,255,0.3)', fontWeight: 700, marginTop: '2px' }}>
                            {pct}% usado
                        </div>
                    )}
                </div>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', overflow: 'hidden' }}>
                {limit > 0 && (
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: '100px', background: barColor, transition: 'width 0.6s ease' }} />
                )}
                {limit === 0 && (
                    <div style={{ height: '100%', width: '30%', borderRadius: '100px', background: color, opacity: 0.3 }} />
                )}
            </div>
        </div>
    );
};

// ─── Change Plan Modal ─────────────────────────────────────────
const ChangePlanModal = ({ tenant, plans, onClose, onDone }: {
    tenant: TenantAdminDto; plans: PlanDto[]; onClose: () => void; onDone: () => void;
}) => {
    const [selectedId, setSelectedId] = useState((tenant as any).subscription?.plan?.id ?? '');
    const [saving, setSaving] = useState(false);

    const save = async () => {
        if (!selectedId) return;
        setSaving(true);
        try {
            await adminService.changeTenantPlan(tenant.id, selectedId);
            onDone();
            onClose();
        } catch {
            alert('Erro ao alterar plano.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: 0 }}>Alterar Plano</h2>
                    <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.4)', padding: '4px' }}><X size={22} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {plans.map(plan => {
                        const sel = plan.id === selectedId;
                        return (
                            <button key={plan.id} onClick={() => setSelectedId(plan.id)} style={{ padding: '14px 16px', borderRadius: '12px', background: sel ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${sel ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.07)'}`, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <span style={{ fontWeight: 800, color: '#fff', textTransform: 'capitalize' }}>{plan.name}</span>
                                    <span style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{plan.description}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontWeight: 900, color: 'var(--accent-primary)' }}>{plan.price === 0 ? 'Grátis' : `R$${Number(plan.price).toFixed(0)}/mês`}</span>
                                    {sel && <Check size={16} color="var(--accent-primary)" />}
                                </div>
                            </button>
                        );
                    })}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                    <button onClick={save} disabled={saving} style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                        {saving ? 'Salvando...' : 'Confirmar Upgrade'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── TenantDetails Page ────────────────────────────────────────
export const TenantDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [tenant, setTenant] = useState<TenantAdminDto | null>(null);
    const [plans, setPlans] = useState<PlanDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [showChangePlan, setShowChangePlan] = useState(false);
    const [metrics, setMetrics] = useState<{ ordersThisMonth: number; totalOrders: number; activeUsers: number; inventoryItems: number; lastActivity: string | null } | null>(null);

    useEffect(() => {
        if (!id) return;
        Promise.all([
            adminService.getTenantById(id),
            adminService.getPlans(),
            adminService.getTenantMetrics(id).catch(() => null),
        ]).then(([t, p, m]) => {
            setTenant(t);
            setPlans(p);
            setMetrics(m);
        }).catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    const reload = async () => {
        if (!id) return;
        const t = await adminService.getTenantById(id);
        setTenant(t);
    };

    const handleToggleStatus = async () => {
        if (!tenant) return;
        const isActive = tenant.status === 'active';
        if (!window.confirm(`Tem certeza que deseja ${isActive ? 'SUSPENDER' : 'ATIVAR'} esta loja?`)) return;
        await adminService.updateTenantStatus(tenant.id, isActive ? 'suspended' : 'active');
        await reload();
    };

    const handleImpersonate = () => {
        if (!tenant) return;
        localStorage.setItem('shadow_tenant_id', tenant.id);
        window.open('/dashboard', '_blank');
        alert('✅ Modo Impersonate ativado! Abrindo dashboard da loja em nova aba.');
    };

    if (loading) {
        return (
            <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '2px' }}>CARREGANDO TENANT...</div>
            </div>
        );
    }

    if (!tenant) {
        return <div style={{ padding: '32px', color: '#ef4444' }}>Tenant não encontrado.</div>;
    }

    const sub = (tenant as any).subscription;
    const plan = sub?.plan;
    const cfg = getStatusCfg(tenant.status);

    const infoItems = [
        { icon: Mail, label: 'E-mail', value: tenant.email ?? '—' },
        { icon: Building2, label: 'CNPJ', value: tenant.cnpj ?? '—' },
        { icon: Store, label: 'Subdomínio', value: tenant.subdomain ? `${tenant.subdomain}.os4u.com.br` : '—' },
        { icon: Calendar, label: 'Cadastro', value: new Date(tenant.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {showChangePlan && tenant && (
                <ChangePlanModal tenant={tenant} plans={plans} onClose={() => setShowChangePlan(false)} onDone={reload} />
            )}

            {/* Back */}
            <button onClick={() => navigate('/masteradmin/tenants')} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', width: 'fit-content', padding: 0 }}>
                <ArrowLeft size={16} />
                Voltar para Lojas
            </button>

            {/* Header Card */}
            <div className="glass-card" style={{ padding: '32px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap', borderLeft: `4px solid ${cfg.color}` }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: `${cfg.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Store size={28} color={cfg.color} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', margin: 0 }}>{tenant.name || tenant.storeName}</h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                                <StatusBadge status={tenant.status} />
                                {sub?.status && sub.status !== tenant.status && <StatusBadge status={sub.status} />}
                                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>ID: {tenant.id.slice(0, 8)}…</span>
                            </div>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '8px' }}>
                        {infoItems.map(({ icon: Icon, label, value }) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Icon size={14} color="rgba(255,255,255,0.3)" />
                                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{label}:</span>
                                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '160px' }}>
                    <button onClick={handleImpersonate} style={{ padding: '12px 20px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Store size={16} />
                        Impersonate
                    </button>
                    <button onClick={() => setShowChangePlan(true)} style={{ padding: '12px 20px', background: 'rgba(139,92,246,0.12)', color: '#a78bfa', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.25)', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <TrendingUp size={16} />
                        Alterar Plano
                    </button>
                    <button onClick={handleToggleStatus} style={{ padding: '12px 20px', background: tenant.status === 'active' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: tenant.status === 'active' ? '#ef4444' : '#10b981', borderRadius: '12px', border: `1px solid ${tenant.status === 'active' ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`, fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                        {tenant.status === 'active' ? '🔒 Suspender' : '✅ Ativar'}
                    </button>
                </div>
            </div>

            {/* Plan & Subscription */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0 }}>Plano Atual</h3>
                    {plan ? (
                        <>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                <span style={{ fontSize: '28px', fontWeight: 900, color: 'var(--accent-primary)', textTransform: 'capitalize' }}>{plan.name}</span>
                                <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                                    {plan.price === 0 ? 'Grátis' : `R$${Number(plan.price).toFixed(2)}/mês`}
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {[
                                    { label: 'Ordens / Mês', val: plan.osLimit === 0 ? '∞' : plan.osLimit },
                                    { label: 'Usuários', val: plan.usersLimit === 0 ? '∞' : plan.usersLimit },
                                    { label: 'Itens Estoque', val: plan.storageLimit === 0 ? '∞' : plan.storageLimit },
                                ].map(row => (
                                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{row.label}</span>
                                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>{row.val}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Sem plano associado.</p>
                    )}
                </div>

                <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0 }}>Assinatura</h3>
                    {sub ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Status Sub.</span>
                                <StatusBadge status={sub.status} />
                            </div>
                            {sub.nextBilling && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Próx. cobrança</span>
                                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>{new Date(sub.nextBilling).toLocaleDateString('pt-BR')}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Sem assinatura ativa.</p>
                    )}
                </div>
            </div>

            {/* Usage Bars */}
            {plan && (
                <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <BarChart3 size={18} color="var(--accent-primary)" />
                        Uso do Plano
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: 500, marginLeft: '4px' }}>(dados ao vivo disponíveis após integração)</span>
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                        <UsageRow label="Ordens este mês" icon={BarChart3} used={0} limit={plan.osLimit ?? 0} color="var(--accent-primary)" />
                        <UsageRow label="Usuários" icon={Users} used={0} limit={plan.usersLimit ?? 0} color="#8b5cf6" />
                        <UsageRow label="Itens de Estoque" icon={Package} used={0} limit={plan.storageLimit ?? 0} color="#10b981" />
                    </div>
                </div>
            )}
        </div>
    );
};
