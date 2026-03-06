import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import type { PlanDto } from '../../services/adminService';
import { LayoutGrid, Plus, Pencil, Trash2, Check, X, Package, Users, BarChart3 } from 'lucide-react';

const EMPTY_PLAN: Partial<PlanDto> = {
    name: '',
    description: '',
    price: 0,
    osLimit: 0,
    usersLimit: 0,
    storageLimit: 0,
    active: true,
};

const limitLabel = (val: number) => val === 0 ? '∞ Ilimitado' : String(val);

export const PlansPage: React.FC = () => {
    const [plans, setPlans] = useState<PlanDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Partial<PlanDto>>(EMPTY_PLAN);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState('');

    useEffect(() => { loadPlans(); }, []);

    const loadPlans = async () => {
        try {
            setLoading(true);
            const data = await adminService.getPlans();
            setPlans(data);
        } catch (_e) {
            setError('Erro ao carregar planos.');
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditingPlan({ ...EMPTY_PLAN });
        setIsEditing(false);
        setShowModal(true);
    };

    const openEdit = (plan: PlanDto) => {
        setEditingPlan({ ...plan });
        setIsEditing(true);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!editingPlan.name?.trim()) return;
        setSaving(true);
        try {
            if (isEditing && editingPlan.id) {
                await adminService.updatePlan(editingPlan.id, editingPlan);
            } else {
                await adminService.createPlan(editingPlan);
            }
            setShowModal(false);
            await loadPlans();
        } catch (_e) {
            setError('Erro ao salvar plano.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja remover este plano? Tenants ativos podem ser afetados.')) return;
        setDeletingId(id);
        try {
            await adminService.deletePlan(id);
            await loadPlans();
        } catch (_e) {
            setError('Erro ao remover plano.');
        } finally {
            setDeletingId(null);
        }
    };

    const planColors: Record<string, string> = {
        free: '#6b7280',
        starter: '#3b82f6',
        professional: '#8b5cf6',
        enterprise: '#f59e0b',
    };

    const getColor = (name: string) => planColors[name.toLowerCase()] ?? '#10b981';

    if (loading) {
        return (
            <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '2px' }}>CARREGANDO PLANOS...</div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Header */}
            <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 className="gradient-text" style={{ fontSize: '32px', fontWeight: 900, margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <LayoutGrid color="#8b5cf6" size={28} />
                        Planos SaaS
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', marginTop: '8px' }}>
                        Crie e gerencie os planos de assinatura da plataforma com limites de uso.
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                >
                    <Plus size={18} />
                    Novo Plano
                </button>
            </header>

            {error && (
                <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#ef4444', fontSize: '14px' }}>
                    {error}
                </div>
            )}

            {/* Plans Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {plans.map((plan) => {
                    const color = getColor(plan.name);
                    return (
                        <div key={plan.id} className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', overflow: 'hidden', border: `1px solid ${color}28` }}>
                            {/* Accent line */}
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${color}, transparent)` }} />

                            {/* Plan Header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', margin: 0, textTransform: 'capitalize' }}>{plan.name}</h3>
                                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{plan.description || '—'}</p>
                                </div>
                                <span style={{ padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 800, background: plan.active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: plan.active ? '#10b981' : '#ef4444', border: `1px solid ${plan.active ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                                    {plan.active ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>

                            {/* Price */}
                            <div>
                                <span style={{ fontSize: '36px', fontWeight: 900, color }}>
                                    {plan.price === 0 ? 'Grátis' : `R$ ${Number(plan.price).toFixed(2)}`}
                                </span>
                                {plan.price > 0 && <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginLeft: '4px' }}>/mês</span>}
                            </div>

                            {/* Limits */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                                        <BarChart3 size={15} color={color} />
                                        Ordens / Mês
                                    </div>
                                    <span style={{ fontWeight: 700, color: '#fff', fontSize: '14px' }}>{limitLabel(plan.osLimit)}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                                        <Users size={15} color={color} />
                                        Usuários
                                    </div>
                                    <span style={{ fontWeight: 700, color: '#fff', fontSize: '14px' }}>{limitLabel(plan.usersLimit)}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                                        <Package size={15} color={color} />
                                        Itens Estoque
                                    </div>
                                    <span style={{ fontWeight: 700, color: '#fff', fontSize: '14px' }}>{limitLabel(plan.storageLimit)}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '4px' }}>
                                <button
                                    onClick={() => openEdit(plan)}
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    <Pencil size={15} /> Editar
                                </button>
                                <button
                                    onClick={() => handleDelete(plan.id)}
                                    disabled={deletingId === plan.id}
                                    style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', color: '#ef4444', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    {deletingId === plan.id ? '...' : <Trash2 size={15} />}
                                </button>
                            </div>
                        </div>
                    );
                })}

                {plans.length === 0 && (
                    <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontWeight: 600, gridColumn: '1 / -1' }}>
                        Nenhum plano cadastrado. Clique em "Novo Plano" para começar.
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '540px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', margin: 0 }}>
                                {isEditing ? 'Editar Plano' : 'Criar Novo Plano'}
                            </h2>
                            <button onClick={() => setShowModal(false)} style={{ color: 'rgba(255,255,255,0.5)', padding: '4px' }}>
                                <X size={22} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {([
                                { label: 'Nome do Plano', key: 'name', type: 'text', placeholder: 'ex: starter' },
                                { label: 'Descrição', key: 'description', type: 'text', placeholder: 'Para assistências em crescimento' },
                                { label: 'Preço Mensal (R$)', key: 'price', type: 'number', placeholder: '79.90' },
                                { label: 'Limite de Ordens / Mês (0 = ilimitado)', key: 'osLimit', type: 'number', placeholder: '100' },
                                { label: 'Limite de Usuários (0 = ilimitado)', key: 'usersLimit', type: 'number', placeholder: '5' },
                                { label: 'Limite de Itens de Estoque (0 = ilimitado)', key: 'storageLimit', type: 'number', placeholder: '500' },
                            ] as { label: string; key: keyof PlanDto; type: string; placeholder: string }[]).map(({ label, key, type, placeholder }) => (
                                <div key={key}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{label}</label>
                                    <input
                                        type={type}
                                        value={String(editingPlan[key] ?? '')}
                                        placeholder={placeholder}
                                        onChange={(e) => setEditingPlan(prev => ({ ...prev, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 14px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                                    />
                                </div>
                            ))}

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <button
                                    onClick={() => setEditingPlan(p => ({ ...p, active: !p.active }))}
                                    style={{ width: '44px', height: '24px', borderRadius: '100px', background: editingPlan.active ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}
                                >
                                    <div style={{ position: 'absolute', top: '3px', left: editingPlan.active ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'all 0.2s' }} />
                                </button>
                                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Plano Ativo</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ flex: 1, padding: '13px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !editingPlan.name?.trim()}
                                style={{ flex: 2, padding: '13px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: saving ? 0.7 : 1 }}
                            >
                                <Check size={16} />
                                {saving ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Plano')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
