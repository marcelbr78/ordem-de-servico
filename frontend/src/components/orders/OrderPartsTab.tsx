import React, { useState, useEffect } from 'react';
import { DollarSign, Package, Trash2, Search, RefreshCw, Plus } from 'lucide-react';
import api from '../../services/api';

interface OrderPartsTabProps {
    order: any;
    onUpdate: () => void;
    onTotalChange: (total: number) => void;
}

export const OrderPartsTab: React.FC<OrderPartsTabProps> = ({ order, onUpdate, onTotalChange }) => {
    // ── Serviços de Mão de Obra ──────────────────────────────────
    const [serviceItems, setServiceItems] = useState<any[]>([]);
    const [newSvcName, setNewSvcName] = useState('');
    const [newSvcDesc, setNewSvcDesc] = useState('');
    const [newSvcPrice, setNewSvcPrice] = useState('');
    const [editingSvcId, setEditingSvcId] = useState<string | null>(null);
    const [editSvcData, setEditSvcData] = useState<any>({});
    const [svcCatalog, setSvcCatalog] = useState<any[]>([]);
    const [svcSearch, setSvcSearch] = useState('');

    // ── Peças do Estoque ─────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // ── Totais ───────────────────────────────────────────────────
    const totalPartsOnly = (order.parts || []).reduce(
        (acc: number, part: any) => acc + Number(part.unitPrice) * part.quantity, 0
    );
    const totalServiceItems = serviceItems.reduce((acc, s) => acc + Number(s.price), 0);
    const totalParts = totalPartsOnly + totalServiceItems;

    useEffect(() => {
        loadServiceItems();
        loadSvcCatalog();
    }, [order.id]);

    useEffect(() => {
        onTotalChange(totalParts);
    }, [totalParts]);

    const loadServiceItems = async () => {
        try {
            const r = await api.get(`/orders/${order.id}/service-items`);
            setServiceItems(r.data);
        } catch {}
    };

    const loadSvcCatalog = async () => {
        try {
            const r = await api.get('/inventory?type=service');
            setSvcCatalog(r.data.filter((p: any) => p.type === 'service'));
        } catch {}
    };

    const handleAddServiceItem = async (fromCatalog?: any) => {
        const name = fromCatalog?.name || newSvcName.trim();
        const rawPrice = newSvcPrice.replace(/[^\d.,]/g, '').replace(',', '.');
        const price = fromCatalog ? fromCatalog.priceSell : parseFloat(rawPrice);

        if (!name || isNaN(price)) return;
        try {
            let existingCatalogItem = fromCatalog || svcCatalog.find((c: any) => c.name.toLowerCase() === name.toLowerCase());

            if (!existingCatalogItem) {
                const res = await api.post('/inventory', {
                    name,
                    description: newSvcDesc.trim() || undefined,
                    type: 'service',
                    priceSell: price,
                    priceCost: 0,
                    trackStock: false,
                });
                existingCatalogItem = res.data;
                loadSvcCatalog();
            }

            const payload = {
                productId: existingCatalogItem.id,
                quantity: 1,
                unitPrice: price,
                unitCost: existingCatalogItem.priceCost || 0,
            };
            await api.post(`/orders/${order.id}/parts`, payload);

            setNewSvcName(''); setNewSvcDesc(''); setNewSvcPrice(''); setSvcSearch('');
            onUpdate();
        } catch (error: any) {
            console.error('Erro ao adicionar Serviço na base unificada:', error);
            alert('Falha ao adicionar serviço: ' + (error?.response?.data?.message || 'Verifique a conexão.'));
        }
    };

    const handleUpdateServiceItem = async (itemId: string) => {
        try {
            const payload = { ...editSvcData };
            if (payload.price !== undefined) {
                const rawPrice = payload.price.toString().replace(/[^\d.,]/g, '').replace(',', '.');
                payload.price = parseFloat(rawPrice);
            }
            await api.patch(`/orders/${order.id}/service-items/${itemId}`, payload);
            setEditingSvcId(null);
            await loadServiceItems();
            onUpdate();
        } catch {}
    };

    const handleRemoveServiceItem = async (itemId: string) => {
        try {
            await api.delete(`/orders/${order.id}/service-items/${itemId}`);
            await loadServiceItems();
            onUpdate();
        } catch {}
    };

    const handleSearchProducts = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const response = await api.get(`/inventory?search=${query}`);
            setSearchResults(response.data);
        } catch (error) {
            console.error('Error searching products:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddPart = async (product: any) => {
        try {
            const payload = {
                productId: product.id,
                quantity: 1,
                unitPrice: parseFloat(product.priceSell) || 0,
                unitCost: parseFloat(product.priceCost) || 0,
            };
            await api.post(`/orders/${order.id}/parts`, payload);
            onUpdate();
        } catch (error: any) {
            console.error('Error adding part:', error?.response?.data || error);
            const msg = error?.response?.data?.message;
            if (Array.isArray(msg)) {
                alert('Erro ao adicionar peça/serviço:\n' + msg.join('\n'));
            } else {
                alert('Erro ao adicionar peça/serviço: ' + (msg || 'Verifique o console do navegador.'));
            }
        } finally {
            setIsSearching(false);
            setSearchQuery('');
            setSearchResults([]);
        }
    };

    const handleRemovePart = async (partId: string) => {
        if (!confirm('Deseja remover este item?')) return;
        try {
            await api.delete(`/orders/parts/${partId}`);
            onUpdate();
        } catch (error) {
            console.error('Error removing part:', error);
            alert('Erro ao remover peça/serviço');
        }
    };

    const isLocked = order.status === 'finalizada' || order.status === 'entregue';

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>Peças e Serviços</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Gerencie os itens e mão de obra desta ordem.</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total de Peças/Serviços</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary)' }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalParts)}
                    </div>
                </div>
            </div>

            {/* ── Serviços de Mão de Obra ─────────────────── */}
            <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <DollarSign size={15} color="#a855f7" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Serviços de Mão de Obra</span>
                    <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#a855f7', fontWeight: 600 }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalServiceItems)}
                    </span>
                </div>

                {/* Lista de serviços já adicionados */}
                {serviceItems.map(svc => (
                    <div key={svc.id} style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: '10px', padding: '12px 14px', marginBottom: '8px' }}>
                        {editingSvcId === svc.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <input value={editSvcData.name ?? svc.name} onChange={e => setEditSvcData((p: any) => ({ ...p, name: e.target.value }))}
                                    placeholder="Nome do serviço" style={{ padding: '8px 10px', borderRadius: '7px', border: '1px solid rgba(168,85,247,0.3)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '13px', outline: 'none' }} />
                                <input value={editSvcData.description ?? svc.description ?? ''} onChange={e => setEditSvcData((p: any) => ({ ...p, description: e.target.value }))}
                                    placeholder="Descrição (opcional)" style={{ padding: '8px 10px', borderRadius: '7px', border: '1px solid rgba(168,85,247,0.3)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '13px', outline: 'none' }} />
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input type="text" inputMode="decimal" value={editSvcData.price ?? svc.price} onChange={e => setEditSvcData((p: any) => ({ ...p, price: e.target.value }))}
                                        placeholder="Valor R$" style={{ flex: 1, padding: '8px 10px', borderRadius: '7px', border: '1px solid rgba(168,85,247,0.3)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '13px', outline: 'none' }} />
                                    <button onClick={() => handleUpdateServiceItem(svc.id)} style={{ padding: '8px 16px', borderRadius: '7px', background: '#a855f7', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Salvar</button>
                                    <button onClick={() => setEditingSvcId(null)} style={{ padding: '8px 12px', borderRadius: '7px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer' }}>✕</button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{svc.name}</div>
                                    {svc.description && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>{svc.description}</div>}
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#a855f7', whiteSpace: 'nowrap' }}>
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(svc.price)}
                                </div>
                                {!isLocked && (
                                    <>
                                        <button onClick={() => { setEditingSvcId(svc.id); setEditSvcData({}); }}
                                            style={{ background: 'rgba(168,85,247,0.1)', border: 'none', color: '#a855f7', cursor: 'pointer', padding: '5px 8px', borderRadius: '6px', fontSize: '12px' }}>✏️</button>
                                        <button onClick={() => handleRemoveServiceItem(svc.id)}
                                            style={{ background: 'rgba(244,63,94,0.08)', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '5px 8px', borderRadius: '6px' }}><Trash2 size={13} /></button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {/* Formulário para adicionar serviço */}
                {!isLocked && (
                    <div style={{ background: 'rgba(168,85,247,0.04)', border: '1px dashed rgba(168,85,247,0.25)', borderRadius: '10px', padding: '12px 14px' }}>
                        {/* Busca rápida no catálogo */}
                        {svcCatalog.length > 0 && (
                            <div style={{ marginBottom: '10px', position: 'relative' }}>
                                <select onChange={e => {
                                    const s = svcCatalog.find((c: any) => c.id === e.target.value);
                                    if (s) {
                                        setNewSvcName(s.name);
                                        setNewSvcDesc(s.description || '');
                                        setNewSvcPrice(s.priceSell.toString().replace('.', ','));
                                    }
                                    e.target.value = '';
                                }}
                                    style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid rgba(168,85,247,0.25)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
                                    <option value="">⚡ Preencher a partir do catálogo...</option>
                                    {svcCatalog.map((s: any) => (
                                        <option key={s.id} value={s.id}>{s.name} — {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.priceSell)}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <input value={newSvcName} onChange={e => setNewSvcName(e.target.value)} placeholder="Nome do serviço *"
                                style={{ flex: 2, minWidth: '140px', padding: '8px 10px', borderRadius: '7px', border: '1px solid rgba(168,85,247,0.25)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '13px', outline: 'none' }} />
                            <input value={newSvcDesc} onChange={e => setNewSvcDesc(e.target.value)} placeholder="Descrição (opcional)"
                                style={{ flex: 3, minWidth: '140px', padding: '8px 10px', borderRadius: '7px', border: '1px solid rgba(168,85,247,0.25)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '13px', outline: 'none' }} />
                            <input type="text" inputMode="decimal" value={newSvcPrice} onChange={e => setNewSvcPrice(e.target.value)} placeholder="Valor (R$) *"
                                style={{ width: '100px', padding: '8px 10px', borderRadius: '7px', border: '1px solid rgba(168,85,247,0.25)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '13px', outline: 'none' }} />
                            <button onClick={() => handleAddServiceItem()} disabled={!newSvcName.trim() || !newSvcPrice.trim() || isNaN(parseFloat(newSvcPrice.replace(',', '.')))}
                                style={{ padding: '8px 14px', borderRadius: '7px', background: newSvcName.trim() && newSvcPrice.trim() && !isNaN(parseFloat(newSvcPrice.replace(',', '.'))) ? '#a855f7' : 'rgba(168,85,247,0.2)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Plus size={14} /> Adicionar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Divisor */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '5px' }}><Package size={12} /> Peças do Estoque</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
            </div>

            {/* Product Search */}
            {!isLocked && (
                <div style={{ position: 'relative', marginBottom: '24px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearchProducts(e.target.value)}
                            placeholder="Buscar peça no estoque (mín. 2 letras)..."
                            style={{
                                width: '100%', padding: '12px 12px 12px 42px', borderRadius: '10px',
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                color: '#fff', fontSize: '14px', outline: 'none'
                            }}
                        />
                        {isSearching && (
                            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                                <RefreshCw size={16} className="animate-spin" style={{ color: 'var(--primary)' }} />
                            </div>
                        )}
                    </div>

                    {searchResults.length > 0 && (
                        <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                            background: '#2a2a35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 100, overflow: 'hidden'
                        }}>
                            {searchResults.slice(0, 5).map(product => (
                                <div
                                    key={product.id}
                                    onClick={() => handleAddPart(product)}
                                    style={{
                                        padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        cursor: 'pointer', transition: 'background 0.2s', display: 'flex',
                                        justifyContent: 'space-between', alignItems: 'center'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div>
                                        <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>{product.name}</div>
                                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{product.sku || 'Sem SKU'} • {product.brand || 'Sem marca'}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: 'var(--primary)', fontWeight: 600 }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.priceSell)}</div>
                                        <div style={{ color: (product.balance?.quantity || 0) > 0 ? '#10b981' : '#f43f5e', fontSize: '11px' }}>
                                            {product.type === 'service' ? 'Serviço' : `Estoque: ${product.balance?.quantity || 0}`}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Items List */}
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Item</th>
                            <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', textAlign: 'center' }}>Qtd</th>
                            <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', textAlign: 'right' }}>Unitário</th>
                            <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', textAlign: 'right' }}>Subtotal</th>
                            <th style={{ padding: '12px 16px', width: '50px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {(order.parts || []).length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
                                    <Package size={32} style={{ opacity: 0.2, marginBottom: '8px' }} />
                                    <div>Nenhuma peça ou serviço adicionado.</div>
                                </td>
                            </tr>
                        ) : (
                            (order.parts || []).map((part: any) => (
                                <tr key={part.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ color: '#fff', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {part.product?.name}
                                            {(part.product as any)?.type === 'service' && <span style={{ padding: '2px 6px', fontSize: '10px', background: 'rgba(168,85,247,0.15)', color: '#a855f7', borderRadius: '4px', fontWeight: 700, letterSpacing: '0.5px' }}>SERVIÇO</span>}
                                        </div>
                                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '2px' }}>{part.product?.sku || 'S/N'}</div>
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center', color: '#fff' }}>{part.quantity}</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#fff' }}>
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(part.unitPrice)}
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--primary)', fontWeight: 600 }}>
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(part.unitPrice * part.quantity)}
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                        {!isLocked && (
                                            <button
                                                onClick={() => handleRemovePart(part.id)}
                                                style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(244,63,94,0.1)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
