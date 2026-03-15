import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import type { TenantAdminDto, PlanDto } from '../../services/adminService';
import {
    Store, Lock, Unlock, ExternalLink, TrendingUp,
    X, Check, Eye, Search, RefreshCw, Filter, Users,
    Calendar, ChevronLeft, ChevronRight,
} from 'lucide-react';

// ── Shared Status config ──────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string; dot: string }> = {
    active:    { label: 'Ativo',     color: '#10b981', dot: '#10b981' },
    trial:     { label: 'Trial',     color: '#f59e0b', dot: '#f59e0b' },
    suspended: { label: 'Suspenso',  color: '#ef4444', dot: '#ef4444' },
    past_due:  { label: 'Em atraso', color: '#f97316', dot: '#f97316' },
    inactive:  { label: 'Inativo',   color: '#6b7280', dot: '#6b7280' },
};
const getS = (s: string) => STATUS_CFG[s?.toLowerCase()] ?? STATUS_CFG['inactive'];

const StatusBadge = ({ status }: { status: string }) => {
    const cfg = getS(status);
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30`, whiteSpace: 'nowrap' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: cfg.color }} />
            {cfg.label}
        </span>
    );
};

// ── Change Plan Modal ─────────────────────────────────────────
const ChangePlanModal = ({ tenant, plans, onClose, onDone }: {
    tenant: TenantAdminDto; plans: PlanDto[]; onClose: () => void; onDone: () => void;
}) => {
    const [selectedId, setSelectedId] = useState((tenant as any).subscription?.plan?.id ?? '');
    const [saving, setSaving] = useState(false);

    const save = async () => {
        if (!selectedId) return;
        setSaving(true);
        try { await adminService.changeTenantPlan(tenant.id, selectedId); onDone(); onClose(); }
        catch { alert('Erro ao alterar plano.'); }
        finally { setSaving(false); }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ width: '100%', maxWidth: '460px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>Alterar Plano</h2>
                        <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{tenant.name || tenant.storeName}</p>
                    </div>
                    <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.4)', minWidth: '36px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {plans.filter(p => p.active).map(plan => {
                        const sel = plan.id === selectedId;
                        return (
                            <button key={plan.id} onClick={() => setSelectedId(plan.id)} style={{ padding: '14px 16px', borderRadius: '12px', background: sel ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${sel ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.15s' }}>
                                <div>
                                    <span style={{ fontWeight: 700, color: '#fff', textTransform: 'capitalize', fontSize: '14px' }}>{plan.name}</span>
                                    <span style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{plan.description}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                                    <span style={{ fontWeight: 800, color: 'var(--accent-primary)', fontSize: '15px' }}>{plan.price === 0 ? 'Grátis' : `R$${Number(plan.price).toFixed(0)}/mês`}</span>
                                    {sel && <Check size={16} color="var(--accent-primary)" />}
                                </div>
                            </button>
                        );
                    })}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                    <button onClick={save} disabled={saving} style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: '#fff', borderRadius: '10px', border: 'none', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <TrendingUp size={15} />{saving ? 'Salvando...' : 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────────
const PAGE_SIZE = 20;

export const TenantsPage: React.FC = () => {
    const [tenants, setTenants] = useState<TenantAdminDto[]>([]);
    const [plans, setPlans] = useState<PlanDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [changingPlanFor, setChangingPlanFor] = useState<TenantAdminDto | null>(null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [page, setPage] = useState(1);
    const navigate = useNavigate();

    const loadAll = async () => {
        try {
            setLoading(true);
            const [td, pd] = await Promise.all([adminService.getTenants(1, 500), adminService.getPlans()]);
            setTenants(Array.isArray(td) ? td : td.data ?? []);
            setPlans(pd);
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => { loadAll(); }, []);
    useEffect(() => { setPage(1); }, [search, filterStatus]);

    const filtered = useMemo(() => tenants.filter(t => {
        const q = search.toLowerCase();
        const name = (t.name || t.storeName || '').toLowerCase();
        const matchSearch = !search || name.includes(q) || t.email?.toLowerCase().includes(q) || t.subdomain?.toLowerCase().includes(q);
        const matchStatus = !filterStatus || t.status === filterStatus;
        return matchSearch && matchStatus;
    }), [tenants, search, filterStatus]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const statusCounts = useMemo(() => {
        const c: Record<string, number> = {};
        tenants.forEach(t => { c[t.status] = (c[t.status] || 0) + 1; });
        return c;
    }, [tenants]);

    const handleToggle = async (id: string, status: string) => {
        const isActive = status === 'active';
        if (!window.confirm(`${isActive ? 'Suspender' : 'Ativar'} esta loja?`)) return;
        try { await adminService.updateTenantStatus(id, isActive ? 'suspended' : 'active'); await loadAll(); }
        catch { alert('Erro ao atualizar status.'); }
    };

    const handleShadow = (tenantId: string) => {
        localStorage.setItem('shadow_tenant_id', tenantId);
        window.open('/dashboard', '_blank');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {changingPlanFor && <ChangePlanModal tenant={changingPlanFor} plans={plans} onClose={() => setChangingPlanFor(null)} onDone={loadAll} />}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Store size={20} color="var(--accent-primary)" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0 }}>Gestão de Lojas</h1>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>{tenants.length} tenants · {statusCounts['active'] || 0} ativos</p>
                    </div>
                </div>
                <button onClick={loadAll} style={{ padding: '9px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Cards de status rápido */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
                {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                    <button key={key} onClick={() => setFilterStatus(filterStatus === key ? '' : key)} style={{
                        padding: '12px 14px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                        background: filterStatus === key ? `${cfg.color}15` : 'var(--bg-secondary)',
                        border: `1px solid ${filterStatus === key ? cfg.color + '40' : 'var(--border-color)'}`,
                        transition: 'all 0.15s',
                    }}>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: filterStatus === key ? cfg.color : '#fff' }}>{statusCounts[key] || 0}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>{cfg.label}</div>
                    </button>
                ))}
            </div>

            {/* Busca */}
            <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                <input
                    placeholder="Buscar por nome, email ou subdomínio..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    style={{ width: '100%', padding: '11px 12px 11px 38px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '16px', outline: 'none', boxSizing: 'border-box' }}
                />
                {(search || filterStatus) && (
                    <button onClick={() => { setSearch(''); setFilterStatus(''); }} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', minWidth: '36px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={15} />
                    </button>
                )}
            </div>

            {/* Lista */}
            {loading ? (
                <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Carregando lojas...
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
            ) : paginated.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.35)' }}>
                    <Store size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
                    <p style={{ margin: 0 }}>Nenhuma loja encontrada</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {paginated.map(t => {
                        const sub = (t as any).subscription;
                        const plan = sub?.plan;
                        const cfg = getS(t.status);
                        return (
                            <div key={t.id} style={{ background: 'var(--bg-secondary)', border: `1px solid var(--border-color)`, borderLeft: `3px solid ${cfg.color}`, borderRadius: '14px', padding: '16px 18px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', transition: 'border-color 0.15s' }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = cfg.color + '60')}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-color)')}>

                                {/* Info */}
                                <div style={{ display: 'flex', gap: '12px', flex: '1 1 200px', minWidth: 0 }}>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${cfg.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Store size={20} color={cfg.color} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                            <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{t.name || t.storeName}</span>
                                            <StatusBadge status={t.status} />
                                            {plan && (
                                                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: 'rgba(59,130,246,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(59,130,246,0.2)', textTransform: 'capitalize' }}>
                                                    {plan.name}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            {t.email && <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{t.email}</span>}
                                            {t.subdomain && <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{t.subdomain}.os4u.com.br</span>}
                                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Calendar size={10} /> {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Ações */}
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
                                    <button onClick={() => navigate(`/masteradmin/tenants/${t.id}`)} style={{ padding: '8px 12px', borderRadius: '9px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', minHeight: '36px' }}>
                                        <Eye size={13} /> Detalhes
                                    </button>
                                    <button onClick={() => setChangingPlanFor(t)} style={{ padding: '8px 12px', borderRadius: '9px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, background: 'rgba(139,92,246,0.08)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)', cursor: 'pointer', minHeight: '36px' }}>
                                        <TrendingUp size={13} /> Plano
                                    </button>
                                    <button onClick={() => handleToggle(t.id, t.status)} style={{ padding: '8px 12px', borderRadius: '9px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', minHeight: '36px', background: t.status === 'active' ? 'rgba(239,68,68,0.07)' : 'rgba(16,185,129,0.07)', color: t.status === 'active' ? '#ef4444' : '#10b981', border: `1px solid ${t.status === 'active' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
                                        {t.status === 'active' ? <><Lock size={13} /> Suspender</> : <><Unlock size={13} /> Ativar</>}
                                    </button>
                                    <button onClick={() => handleShadow(t.id)} style={{ padding: '8px 10px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', minHeight: '36px', minWidth: '36px' }} title="Suporte / Impersonate">
                                        <ExternalLink size={13} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Paginação */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '8px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: page === 1 ? 'rgba(255,255,255,0.2)' : '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', minWidth: '36px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronLeft size={16} />
                    </button>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                        Página {page} de {totalPages} · {filtered.length} lojas
                    </span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '8px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: page === totalPages ? 'rgba(255,255,255,0.2)' : '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', minWidth: '36px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};
