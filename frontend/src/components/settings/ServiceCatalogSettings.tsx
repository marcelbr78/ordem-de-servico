import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Tag, DollarSign, RefreshCw } from 'lucide-react';
import api from '../../services/api';

interface ServiceItem { id?: string; name: string; category: string; price: number; description?: string; }
interface Category { id?: string; name: string; color: string; }

const COLORS = ['#3b82f6','#a855f7','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899'];
const inp: React.CSSProperties = { padding: '9px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' };
const fmtCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export const ServiceCatalogSettings: React.FC = () => {
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success'|'error'; text: string } | null>(null);
    const [newSvc, setNewSvc] = useState<ServiceItem>({ name: '', category: '', price: 0, description: '' });
    const [newCat, setNewCat] = useState<Category>({ name: '', color: COLORS[0] });
    const [tab, setTab] = useState<'services'|'categories'>('services');

    const load = async () => {
        setLoading(true);
        try {
            const [sRes, cRes] = await Promise.all([api.get('/inventory?type=service'), api.get('/settings')]);
            const allSettings: any[] = cRes.data;
            const cats = allSettings.find((s:any) => s.key === 'service_categories');
            setCategories(cats ? JSON.parse(cats.value) : []);
            setServices(sRes.data.filter((p:any) => p.type === 'service').map((p:any) => ({
                id: p.id, name: p.name, category: p.category || '', price: p.priceSell || 0, description: p.description || '',
            })));
        } catch {} finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const addService = async () => {
        if (!newSvc.name || newSvc.price <= 0) { setMsg({ type: 'error', text: 'Preencha nome e preço' }); return; }
        setSaving(true);
        try {
            await api.post('/inventory', { ...newSvc, type: 'service', unit: 'UN', priceSell: newSvc.price, priceCost: 0 });
            setNewSvc({ name: '', category: '', price: 0, description: '' });
            setMsg({ type: 'success', text: 'Serviço adicionado!' });
            await load();
        } catch { setMsg({ type: 'error', text: 'Erro ao salvar' }); }
        finally { setSaving(false); setTimeout(() => setMsg(null), 3000); }
    };

    const removeService = async (id: string) => {
        if (!window.confirm('Remover este serviço?')) return;
        try { await api.delete(`/inventory/${id}`); await load(); } catch {}
    };

    const saveCategories = async () => {
        setSaving(true);
        try {
            await api.post('/settings', { key: 'service_categories', value: JSON.stringify(categories) });
            setMsg({ type: 'success', text: 'Categorias salvas!' });
        } catch { setMsg({ type: 'error', text: 'Erro ao salvar' }); }
        finally { setSaving(false); setTimeout(() => setMsg(null), 3000); }
    };

    const addCategory = () => {
        if (!newCat.name) return;
        setCategories(p => [...p, { ...newCat, id: Date.now().toString() }]);
        setNewCat({ name: '', color: COLORS[categories.length % COLORS.length] });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '6px', padding: '3px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', width: 'fit-content' }}>
                {[{ k: 'services', l: 'Serviços' }, { k: 'categories', l: 'Categorias' }].map(({ k, l }) => (
                    <button key={k} onClick={() => setTab(k as any)} style={{ padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: tab === k ? 'var(--accent-primary)' : 'transparent', color: tab === k ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer' }}>{l}</button>
                ))}
            </div>

            {msg && <div style={{ padding: '10px 16px', borderRadius: '10px', background: msg.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: msg.type === 'error' ? '#ef4444' : '#22c55e', fontSize: '13px' }}>{msg.text}</div>}

            {tab === 'services' && (
                <>
                    {/* Adicionar serviço */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Novo Serviço</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                            <input value={newSvc.name} onChange={e => setNewSvc(p => ({ ...p, name: e.target.value }))} placeholder="Nome do serviço *" style={inp} />
                            <select value={newSvc.category} onChange={e => setNewSvc(p => ({ ...p, category: e.target.value }))} style={{ ...inp }}>
                                <option value="">Categoria</option>
                                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                            <input type="number" min="0" step="0.01" value={newSvc.price || ''} onChange={e => setNewSvc(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} placeholder="Preço (R$) *" style={inp} />
                            <input value={newSvc.description || ''} onChange={e => setNewSvc(p => ({ ...p, description: e.target.value }))} placeholder="Descrição" style={inp} />
                        </div>
                        <button onClick={addService} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '9px', background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: '#fff', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer', minHeight: '40px' }}>
                            <Plus size={15} /> Adicionar
                        </button>
                    </div>

                    {/* Lista de serviços */}
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
                        {loading ? <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Carregando...</div> : services.length === 0 ? (
                            <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}><DollarSign size={32} style={{ opacity: 0.3, marginBottom: '8px' }} /><p style={{ margin: 0 }}>Nenhum serviço cadastrado</p></div>
                        ) : services.map((s, i) => (
                            <div key={s.id || i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: i < services.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Tag size={16} color="#a78bfa" />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#fff' }}>{s.name}</div>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{s.category || 'Sem categoria'} {s.description ? `· ${s.description}` : ''}</div>
                                </div>
                                <div style={{ fontSize: '15px', fontWeight: 700, color: '#22c55e', whiteSpace: 'nowrap' }}>{fmtCurrency(s.price)}</div>
                                {s.id && <button onClick={() => removeService(s.id!)} style={{ padding: '7px', borderRadius: '7px', background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={13} /></button>}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {tab === 'categories' && (
                <>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nova Categoria</h4>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input value={newCat.name} onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))} placeholder="Nome da categoria" style={{ ...inp, flex: 1, minWidth: '140px' }} />
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {COLORS.map(c => (
                                    <button key={c} onClick={() => setNewCat(p => ({ ...p, color: c }))} style={{ width: '24px', height: '24px', borderRadius: '50%', background: c, border: newCat.color === c ? '3px solid #fff' : '2px solid transparent', cursor: 'pointer' }} />
                                ))}
                            </div>
                            <button onClick={addCategory} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '9px', background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer', minHeight: '40px' }}>
                                <Plus size={14} /> Adicionar
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {categories.map((c, i) => (
                            <div key={c.id || i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                                <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                                <span style={{ flex: 1, fontSize: '14px', color: '#fff', fontWeight: 500 }}>{c.name}</span>
                                <button onClick={() => setCategories(p => p.filter((_, idx) => idx !== i))} style={{ padding: '6px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={13} /></button>
                            </div>
                        ))}
                        {categories.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Nenhuma categoria cadastrada</div>}
                    </div>

                    <button onClick={saveCategories} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer', alignSelf: 'flex-start', minHeight: '44px' }}>
                        <Save size={16} />{saving ? 'Salvando...' : 'Salvar categorias'}
                    </button>
                </>
            )}
        </div>
    );
};
