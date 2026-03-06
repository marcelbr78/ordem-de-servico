import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import type { TenantAdminDto, PlanDto } from '../../services/adminService';
import { Store, Lock, Unlock, ExternalLink, TrendingUp, X, Check, Eye } from 'lucide-react';

// ── Status Badge ──────────────────────────────────────────────
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
        <span style={{ fontSize: '11px', fontWeight: 800, padding: '5px 12px', borderRadius: '100px', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, whiteSpace: 'nowrap' }}>
            {cfg.label}
        </span>
    );
};

// ── Usage Bar ─────────────────────────────────────────────────
const UsageBar = ({ label, used, limit, color }: { label: string; used: number; limit: number; color: string }) => {
    const pct = limit === 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));
    const isWarning = pct >= 80;
    const barColor = isWarning ? '#f59e0b' : color;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '120px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: isWarning ? '#f59e0b' : 'rgba(255,255,255,0.7)' }}>
                    {limit === 0 ? `${used} / ∞` : `${used} / ${limit}`}
                </span>
            </div>
            <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', overflow: 'hidden' }}>
                {limit > 0 && (
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: '100px', background: barColor, transition: 'width 0.5s ease' }} />
                )}
            </div>
        </div>
    );
};

// ── Change Plan Modal ─────────────────────────────────────────
const ChangePlanModal = ({ tenant, plans, onClose, onDone }: {
    tenant: TenantAdminDto;
    plans: PlanDto[];
    onClose: () => void;
    onDone: () => void;
}) => {
    const [selectedPlanId, setSelectedPlanId] = useState(tenant.subscription?.plan?.id ?? '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!selectedPlanId) return;
        setSaving(true);
        try {
            await adminService.changeTenantPlan(tenant.id, selectedPlanId);
            onDone();
            onClose();
        } catch {
            alert('Erro ao alterar o plano.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: 0 }}>Alterar Plano</h2>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{tenant.name || tenant.storeName}</p>
                    </div>
                    <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.4)', padding: '4px' }}><X size={22} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {plans.map((plan) => {
                        const isSelected = plan.id === selectedPlanId;
                        return (
                            <button key={plan.id} onClick={() => setSelectedPlanId(plan.id)} style={{ padding: '16px', borderRadius: '12px', background: isSelected ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isSelected ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.07)'}`, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s' }}>
                                <div>
                                    <span style={{ fontWeight: 800, color: '#fff', fontSize: '15px', textTransform: 'capitalize' }}>{plan.name}</span>
                                    <span style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{plan.description}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontWeight: 900, color: 'var(--accent-primary)', fontSize: '16px' }}>
                                        {plan.price === 0 ? 'Grátis' : `R$ ${Number(plan.price).toFixed(0)}/mês`}
                                    </span>
                                    {isSelected && <Check size={18} color="var(--accent-primary)" />}
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 600, cursor: 'pointer' }}>
                        Cancelar
                    </button>
                    <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <TrendingUp size={16} />
                        {saving ? 'Salvando...' : 'Confirmar Upgrade'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────────
export const TenantsPage: React.FC = () => {
    const [tenants, setTenants] = useState<TenantAdminDto[]>([]);
    const [plans, setPlans] = useState<PlanDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [changingPlanFor, setChangingPlanFor] = useState<TenantAdminDto | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = async () => {
        try {
            setLoading(true);
            const [tenantsData, plansData] = await Promise.all([
                adminService.getTenants(1, 100),
                adminService.getPlans(),
            ]);
            setTenants(Array.isArray(tenantsData) ? tenantsData : tenantsData.data ?? []);
            setPlans(plansData);
        } catch (err) {
            console.error('Failed to load tenants:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        const isActive = currentStatus === 'active';
        if (!window.confirm(`Tem certeza que deseja ${isActive ? 'SUSPENDER' : 'ATIVAR'} esta loja?`)) return;
        try {
            await adminService.updateTenantStatus(id, isActive ? 'suspended' : 'active');
            await loadAll();
        } catch {
            alert('Erro ao atualizar status.');
        }
    };

    const handleShadowing = (tenantId: string) => {
        localStorage.setItem('shadow_tenant_id', tenantId);
        window.open('/dashboard', '_blank');
        alert('Modo Suporte ativado em nova aba!');
    };

    if (loading) {
        return (
            <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '2px' }}>CARREGANDO LOJAS...</div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {changingPlanFor && (
                <ChangePlanModal
                    tenant={changingPlanFor}
                    plans={plans}
                    onClose={() => setChangingPlanFor(null)}
                    onDone={loadAll}
                />
            )}

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 className="gradient-text" style={{ fontSize: '32px', fontWeight: 900, margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Store color="var(--accent-primary)" size={28} />
                        Gestão de Lojas
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', marginTop: '8px' }}>
                        {tenants.length} tenant{tenants.length !== 1 ? 's' : ''} registrado{tenants.length !== 1 ? 's' : ''} na plataforma.
                    </p>
                </div>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tenants.map((t) => {
                    const sub = (t as any).subscription;
                    const plan = sub?.plan;
                    const subStatus = sub?.status ?? t.status;
                    const cfg = getStatusCfg(t.status);
                    // Usage data (0 because backend would need per-tenant DB query — placeholder for now)
                    const ordersUsed = 0, usersUsed = 0, stockUsed = 0;

                    return (
                        <div key={t.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', borderLeft: `3px solid ${cfg.color}` }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                                {/* Tenant Info */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 200px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: 900, fontSize: '18px', color: '#fff' }}>{t.name || t.storeName}</span>
                                        <StatusBadge status={t.status} />
                                        {subStatus && subStatus !== t.status && <StatusBadge status={subStatus} />}
                                    </div>
                                    {t.subdomain && <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>{t.subdomain}.os4u.com.br</span>}
                                    {t.email && <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>{t.email}</span>}
                                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>Cadastrado: {new Date(t.createdAt).toLocaleDateString('pt-BR')}</span>
                                </div>

                                {/* Plan Badge */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Plano</span>
                                    <span style={{ fontSize: '14px', fontWeight: 800, padding: '6px 16px', borderRadius: '100px', background: 'rgba(59,130,246,0.12)', color: 'var(--accent-primary)', border: '1px solid rgba(59,130,246,0.25)', textTransform: 'capitalize' }}>
                                        {plan?.name ?? 'Sem Plano'}
                                    </span>
                                    {plan?.price !== undefined && (
                                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                                            {plan.price === 0 ? 'Grátis' : `R$ ${Number(plan.price).toFixed(2)}/mês`}
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => navigate(`/masteradmin/tenants/${t.id}`)}
                                        style={{ padding: '10px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                                    >
                                        <Eye size={14} />
                                        Detalhes
                                    </button>
                                    <button
                                        onClick={() => setChangingPlanFor(t)}
                                        style={{ padding: '10px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)', cursor: 'pointer' }}
                                    >
                                        <TrendingUp size={14} />
                                        Plano
                                    </button>
                                    <button
                                        onClick={() => handleToggleStatus(t.id, t.status)}
                                        style={{ padding: '10px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', background: t.status === 'active' ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', color: t.status === 'active' ? '#ef4444' : '#10b981', border: `1px solid ${t.status === 'active' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}` }}
                                    >
                                        {t.status === 'active' ? <><Lock size={14} />Suspender</> : <><Unlock size={14} />Ativar</>}
                                    </button>
                                    <button
                                        onClick={() => handleShadowing(t.id)}
                                        style={{ padding: '10px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                                    >
                                        <ExternalLink size={14} />
                                        Support
                                    </button>
                                </div>
                            </div>

                            {/* Usage Bars */}
                            {plan && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <UsageBar label="Ordens / Mês" used={ordersUsed} limit={plan.osLimit ?? 0} color="var(--accent-primary)" />
                                    <UsageBar label="Usuários" used={usersUsed} limit={plan.usersLimit ?? 0} color="#8b5cf6" />
                                    <UsageBar label="Itens Estoque" used={stockUsed} limit={plan.storageLimit ?? 0} color="#10b981" />
                                </div>
                            )}
                        </div>
                    );
                })}

                {tenants.length === 0 && (
                    <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                        Nenhuma loja encontrada na base SaaS.
                    </div>
                )}
            </div>
        </div>
    );
};
