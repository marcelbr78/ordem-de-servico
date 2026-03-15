import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Plus, Edit3, Trash2, Star, Truck, Phone, Mail, MapPin,
    X, Save, RefreshCw, TrendingUp, Package, CheckCircle,
    Building2, MessageCircle, Award,
} from 'lucide-react';

interface Supplier {
    id: string; name: string; phone: string; contactPerson?: string;
    email?: string; cnpj?: string; address?: string; city?: string; state?: string;
    category: string; brands?: string; paymentTerms?: string; notes?: string;
    active: boolean; reliability: number; deliveryDays: number;
    totalQuotes: number; totalWins: number; totalOrders: number;
    totalSpent: number; responseRatePercent: number; createdAt: string;
}

const fmtCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const CATEGORY_LABELS: Record<string, string> = { parts: 'Peças', services: 'Serviços', both: 'Peças e Serviços' };
const CATEGORY_COLORS: Record<string, string> = { parts: '#3b82f6', services: '#a855f7', both: '#10b981' };

const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '16px', outline: 'none', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.4px' };

const Stars: React.FC<{ n: number; onChange?: (v: number) => void }> = ({ n, onChange }) => (
    <span style={{ display: 'flex', gap: '2px' }}>
        {[1,2,3,4,5].map(i => (
            <Star key={i} size={14}
                fill={i <= n ? '#f59e0b' : 'none'} color={i <= n ? '#f59e0b' : 'rgba(255,255,255,0.2)'}
                style={{ cursor: onChange ? 'pointer' : 'default' }}
                onClick={() => onChange?.(i)} />
        ))}
    </span>
);

const StatChip: React.FC<{ label: string; value: string | number; color: string }> = ({ label, value, color }) => (
    <div style={{ padding: '6px 10px', background: `${color}10`, border: `1px solid ${color}20`, borderRadius: '8px', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color }}>{value}</div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>{label}</div>
    </div>
);

export const Suppliers: React.FC = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Supplier | null>(null);
    const [detail, setDetail] = useState<Supplier | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<Partial<Supplier>>({ reliability: 5, deliveryDays: 3, active: true, category: 'parts' });

    const load = async () => {
        setLoading(true);
        try { const r = await api.get('/smartparts/suppliers'); setSuppliers(r.data); }
        catch {} finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const openNew = () => { setEditing(null); setForm({ reliability: 5, deliveryDays: 3, active: true, category: 'parts' }); setShowModal(true); };
    const openEdit = (s: Supplier) => { setEditing(s); setForm({ ...s }); setShowModal(true); setDetail(null); };

    const handleSave = async () => {
        if (!form.name || !form.phone) return alert('Nome e telefone são obrigatórios.');
        setSaving(true);
        try {
            if (editing) await api.patch(`/smartparts/suppliers/${editing.id}`, form);
            else await api.post('/smartparts/suppliers', form);
            setShowModal(false); load();
        } catch { alert('Erro ao salvar.'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (s: Supplier) => {
        if (!confirm(`Excluir fornecedor "${s.name}"? As cotações existentes serão mantidas.`)) return;
        try { await api.delete(`/smartparts/suppliers/${s.id}`); load(); setDetail(null); }
        catch { alert('Erro ao excluir.'); }
    };

    const handleToggle = async (s: Supplier) => {
        try { await api.patch(`/smartparts/suppliers/${s.id}`, { active: !s.active }); load(); setDetail(d => d?.id === s.id ? { ...d, active: !s.active } : d); }
        catch {}
    };

    const filtered = suppliers.filter(s => {
        const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search);
        const matchFilter = filter === 'all' || (filter === 'active' ? s.active : !s.active);
        return matchSearch && matchFilter;
    });

    const activeCount = suppliers.filter(s => s.active).length;
    const totalSpentAll = suppliers.reduce((sum, s) => sum + (s.totalSpent || 0), 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Building2 size={19} color="#6366f1" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Fornecedores</h1>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>{activeCount} ativos · {fmtCurrency(totalSpentAll)} total gasto</p>
                    </div>
                </div>
                <button onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer', minHeight: '44px' }}>
                    <Plus size={16} /> Novo Fornecedor
                </button>
            </div>

            {/* Resumo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
                {[
                    { label: 'Total', value: suppliers.length, color: '#94a3b8' },
                    { label: 'Ativos', value: activeCount, color: '#22c55e' },
                    { label: 'Total gasto', value: fmtCurrency(totalSpentAll), color: '#3b82f6' },
                    { label: 'Cotações enviadas', value: suppliers.reduce((s, x) => s + (x.totalQuotes || 0), 0), color: '#f59e0b' },
                ].map(({ label, value, color }) => (
                    <StatChip key={label} label={label} value={value} color={color} />
                ))}
            </div>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou telefone..." style={{ ...inp, paddingLeft: '36px', fontSize: '14px' }} />
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>🔍</span>
                </div>
                <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '3px' }}>
                    {(['all', 'active', 'inactive'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 12px', borderRadius: '7px', border: 'none', background: filter === f ? 'rgba(99,102,241,0.3)' : 'transparent', color: filter === f ? '#a5b4fc' : 'rgba(255,255,255,0.45)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                            {f === 'all' ? 'Todos' : f === 'active' ? 'Ativos' : 'Inativos'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lista */}
            {loading ? (
                <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Carregando...
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                    <Building2 size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
                    <p style={{ margin: 0 }}>{search ? 'Nenhum fornecedor encontrado' : 'Cadastre seu primeiro fornecedor'}</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filtered.map(s => {
                        const catColor = CATEGORY_COLORS[s.category] || '#94a3b8';
                        const brandsArr = s.brands ? (() => { try { return JSON.parse(s.brands!); } catch { return []; } })() : [];
                        return (
                            <div key={s.id} style={{
                                background: 'var(--bg-secondary)', border: `1px solid ${s.active ? 'var(--border-color)' : 'rgba(255,255,255,0.04)'}`,
                                borderLeft: `3px solid ${s.active ? catColor : '#374151'}`, borderRadius: '12px',
                                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
                                opacity: s.active ? 1 : 0.6, cursor: 'pointer', transition: 'all 0.15s',
                            }}
                                onClick={() => setDetail(s)}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = catColor + '60')}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = s.active ? 'var(--border-color)' : 'rgba(255,255,255,0.04)')}>

                                {/* Avatar */}
                                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: `${catColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: catColor, flexShrink: 0 }}>
                                    {s.name.charAt(0).toUpperCase()}
                                </div>

                                {/* Info principal */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap', marginBottom: '3px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{s.name}</span>
                                        <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '20px', background: `${catColor}15`, color: catColor, border: `1px solid ${catColor}25`, fontWeight: 600 }}>{CATEGORY_LABELS[s.category] || s.category}</span>
                                        {!s.active && <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '20px', background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>Inativo</span>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <Stars n={s.reliability} />
                                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <Phone size={10} /> {s.phone}
                                        </span>
                                        {s.deliveryDays > 0 && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '3px' }}><Truck size={10} /> {s.deliveryDays}d</span>}
                                        {s.responseRatePercent > 0 && <span style={{ fontSize: '11px', color: s.responseRatePercent >= 80 ? '#22c55e' : '#f59e0b' }}>{s.responseRatePercent}% resp.</span>}
                                    </div>
                                    {brandsArr.length > 0 && (
                                        <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                                            {brandsArr.slice(0, 4).map((b: string) => (
                                                <span key={b} style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>{b}</span>
                                            ))}
                                            {brandsArr.length > 4 && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>+{brandsArr.length - 4}</span>}
                                        </div>
                                    )}
                                </div>

                                {/* Stats */}
                                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                    {s.totalOrders > 0 && <div style={{ textAlign: 'center' }}><div style={{ fontSize: '14px', fontWeight: 700, color: '#22c55e' }}>{s.totalOrders}</div><div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)' }}>pedidos</div></div>}
                                    {s.totalSpent > 0 && <div style={{ textAlign: 'center' }}><div style={{ fontSize: '12px', fontWeight: 700, color: '#60a5fa' }}>{fmtCurrency(s.totalSpent)}</div><div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)' }}>gasto</div></div>}
                                </div>

                                {/* Ações */}
                                <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                                    <a href={`https://wa.me/${s.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                                        onClick={e => e.stopPropagation()}
                                        style={{ padding: '7px', borderRadius: '7px', background: 'rgba(37,211,102,0.1)', color: '#25d366', border: '1px solid rgba(37,211,102,0.2)', display: 'flex', alignItems: 'center', minWidth: '32px', minHeight: '32px', justifyContent: 'center' }}>
                                        <MessageCircle size={13} />
                                    </a>
                                    <button onClick={e => { e.stopPropagation(); openEdit(s); }} style={{ padding: '7px', borderRadius: '7px', background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', minWidth: '32px', minHeight: '32px', justifyContent: 'center', cursor: 'pointer' }}>
                                        <Edit3 size={13} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal Criar/Editar */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', width: '100%', maxWidth: '520px', maxHeight: '90dvh', overflowY: 'auto', padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', margin: 0 }}>{editing ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', borderRadius: '8px', padding: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {/* Dados básicos */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={lbl}>Nome / Razão Social *</label>
                                    <input value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={inp} placeholder="Ex: Distribuidora ABC" />
                                </div>
                                <div>
                                    <label style={lbl}>WhatsApp *</label>
                                    <input value={form.phone || ''} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} style={inp} placeholder="5511999999999" />
                                </div>
                                <div>
                                    <label style={lbl}>Pessoa de Contato</label>
                                    <input value={form.contactPerson || ''} onChange={e => setForm(p => ({ ...p, contactPerson: e.target.value }))} style={inp} placeholder="Nome do vendedor" />
                                </div>
                                <div>
                                    <label style={lbl}>E-mail</label>
                                    <input type="email" value={form.email || ''} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={inp} placeholder="contato@fornecedor.com" />
                                </div>
                                <div>
                                    <label style={lbl}>CNPJ</label>
                                    <input value={form.cnpj || ''} onChange={e => setForm(p => ({ ...p, cnpj: e.target.value }))} style={inp} placeholder="00.000.000/0001-00" />
                                </div>
                            </div>

                            {/* Categoria e marcas */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={lbl}>Categoria</label>
                                    <select value={form.category || 'parts'} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={inp}>
                                        <option value="parts">Peças</option>
                                        <option value="services">Serviços</option>
                                        <option value="both">Peças e Serviços</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={lbl}>Prazo de Entrega (dias)</label>
                                    <input type="number" value={form.deliveryDays || 3} onChange={e => setForm(p => ({ ...p, deliveryDays: parseInt(e.target.value) || 3 }))} style={inp} min="0" max="30" />
                                </div>
                            </div>

                            {/* Marcas */}
                            <div>
                                <label style={lbl}>Marcas que fornece (separadas por vírgula)</label>
                                <input value={form.brands ? (() => { try { return JSON.parse(form.brands).join(', '); } catch { return form.brands; } })() : ''} onChange={e => setForm(p => ({ ...p, brands: JSON.stringify(e.target.value.split(',').map(b => b.trim()).filter(Boolean)) }))} style={inp} placeholder="Samsung, Apple, Motorola, Xiaomi" />
                            </div>

                            {/* Condições */}
                            <div>
                                <label style={lbl}>Condições de Pagamento</label>
                                <input value={form.paymentTerms || ''} onChange={e => setForm(p => ({ ...p, paymentTerms: e.target.value }))} style={inp} placeholder="Ex: 30 dias, à vista 5% desc." />
                            </div>

                            {/* Confiabilidade */}
                            <div>
                                <label style={lbl}>Confiabilidade</label>
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    {[1,2,3,4,5].map(i => (
                                        <Star key={i} size={22} fill={i <= (form.reliability || 5) ? '#f59e0b' : 'none'} color={i <= (form.reliability || 5) ? '#f59e0b' : 'rgba(255,255,255,0.2)'} style={{ cursor: 'pointer' }} onClick={() => setForm(p => ({ ...p, reliability: i }))} />
                                    ))}
                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginLeft: '8px' }}>{form.reliability || 5}/5</span>
                                </div>
                            </div>

                            {/* Observações */}
                            <div>
                                <label style={lbl}>Observações</label>
                                <textarea value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ ...inp, minHeight: '72px', resize: 'vertical' }} placeholder="Notas internas sobre este fornecedor..." />
                            </div>

                            {/* Botões */}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                                <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '12px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: saving ? 0.7 : 1 }}>
                                    <Save size={15} />{saving ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Detalhe */}
            {detail && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', width: '100%', maxWidth: '460px', maxHeight: '90dvh', overflowY: 'auto', padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `${CATEGORY_COLORS[detail.category] || '#94a3b8'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, color: CATEGORY_COLORS[detail.category] || '#94a3b8' }}>
                                    {detail.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', margin: 0 }}>{detail.name}</h3>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                                        <Stars n={detail.reliability} />
                                        <span style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '20px', background: `${CATEGORY_COLORS[detail.category] || '#94a3b8'}15`, color: CATEGORY_COLORS[detail.category] || '#94a3b8', fontWeight: 600, fontSize: '10px' }}>{CATEGORY_LABELS[detail.category]}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setDetail(null)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', borderRadius: '8px', padding: '7px', cursor: 'pointer', display: 'flex' }}><X size={15} /></button>
                        </div>

                        {/* Métricas */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
                            <StatChip label="Cotações" value={detail.totalQuotes} color="#3b82f6" />
                            <StatChip label="Pedidos" value={detail.totalOrders} color="#22c55e" />
                            <StatChip label="% Resp." value={`${detail.responseRatePercent}%`} color="#f59e0b" />
                            <StatChip label="Gasto" value={fmtCurrency(detail.totalSpent)} color="#a855f7" />
                        </div>

                        {/* Contato */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '14px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[
                                { icon: Phone, label: 'WhatsApp', value: detail.phone },
                                detail.contactPerson && { icon: Award, label: 'Contato', value: detail.contactPerson },
                                detail.email && { icon: Mail, label: 'E-mail', value: detail.email },
                                detail.cnpj && { icon: Building2, label: 'CNPJ', value: detail.cnpj },
                                (detail.city || detail.state) && { icon: MapPin, label: 'Cidade', value: [detail.city, detail.state].filter(Boolean).join(' - ') },
                                detail.paymentTerms && { icon: TrendingUp, label: 'Pagamento', value: detail.paymentTerms },
                                detail.deliveryDays > 0 && { icon: Truck, label: 'Prazo', value: `${detail.deliveryDays} dias` },
                            ].filter(Boolean).map((item: any) => (
                                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                    <item.icon size={13} color="rgba(255,255,255,0.35)" style={{ flexShrink: 0 }} />
                                    <span style={{ color: 'rgba(255,255,255,0.4)', minWidth: '70px' }}>{item.label}</span>
                                    <span style={{ color: '#fff', fontWeight: 500 }}>{item.value}</span>
                                </div>
                            ))}
                        </div>

                        {detail.notes && (
                            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '12px', marginBottom: '12px', fontSize: '13px', color: 'rgba(255,255,255,0.55)', fontStyle: 'italic' }}>
                                {detail.notes}
                            </div>
                        )}

                        {/* Ações */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <a href={`https://wa.me/${detail.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '10px', background: 'rgba(37,211,102,0.12)', color: '#25d366', border: '1px solid rgba(37,211,102,0.25)', textDecoration: 'none', fontWeight: 600, fontSize: '13px', minHeight: '40px' }}>
                                <MessageCircle size={14} /> WhatsApp
                            </a>
                            <button onClick={() => openEdit(detail)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '10px', background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', minHeight: '40px' }}>
                                <Edit3 size={14} /> Editar
                            </button>
                            <button onClick={() => handleToggle(detail)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '10px', background: detail.active ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', color: detail.active ? '#ef4444' : '#22c55e', border: `1px solid ${detail.active ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`, fontWeight: 600, fontSize: '13px', cursor: 'pointer', minHeight: '40px' }}>
                                {detail.active ? 'Desativar' : 'Ativar'}
                            </button>
                            <button onClick={() => handleDelete(detail)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(239,68,68,0.06)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', minHeight: '40px' }}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
};
