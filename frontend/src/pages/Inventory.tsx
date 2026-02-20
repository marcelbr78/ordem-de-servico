import React, { useState, useEffect } from 'react';
import { Search, Plus, Package, AlertTriangle, ArrowRightLeft, Pencil } from 'lucide-react';
import api from '../services/api';
import { ProductModal } from '../components/inventory/ProductModal';
import { StockAdjustmentModal } from '../components/inventory/StockAdjustmentModal';

export const Inventory: React.FC = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editProduct, setEditProduct] = useState<any | null>(null);
    const [adjustmentProduct, setAdjustmentProduct] = useState<any | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/inventory');
            setProducts(res.data);
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));

    return (
        <div className="animate-fade">
            <div className="flex justify-between items-center mb-8">
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>Estoque</h1>
                <button
                    onClick={() => setIsProductModalOpen(true)}
                    style={{
                        background: 'var(--primary)', color: '#fff', border: 'none',
                        padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600
                    }}
                >
                    <Plus size={20} /> Novo Produto
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
                {/* Search */}
                <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={20} style={{ position: 'absolute', left: '12px', top: '12px', color: 'rgba(255,255,255,0.4)' }} />
                        <input
                            type="text"
                            placeholder="Buscar produto por nome ou SKU..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '12px 12px 12px 42px', borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                                color: '#fff', outline: 'none'
                            }}
                        />
                    </div>
                </div>

                {/* List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {loading ? (
                        <p className="text-gray-500 text-center py-8">Carregando...</p>
                    ) : filteredProducts.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Nenhum produto encontrado.</p>
                    ) : (
                        filteredProducts.map((p) => {
                            const quantity = p.balance?.quantity || 0;
                            const isLowStock = quantity <= (p.minQuantity || 5);

                            return (
                                <div key={p.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{
                                            width: '48px', height: '48px', borderRadius: '12px',
                                            background: 'rgba(59,130,246,0.1)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#3b82f6'
                                        }}>
                                            <Package size={24} />
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 600, color: '#fff' }}>{p.name}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px', flexWrap: 'wrap' }}>
                                                <span>SKU: {p.sku || '-'}</span>
                                                {p.brand && <><span>•</span><span>{p.brand}</span></>}
                                                {p.category && <><span>•</span><span style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '1px 6px', borderRadius: '4px', fontSize: '11px' }}>{p.category}</span></>}
                                                <span>•</span>
                                                <span>Venda: {formatCurrency(p.priceSell)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ margin: 0, fontWeight: 700, fontSize: '18px', color: isLowStock ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                                                {quantity} {isLowStock && <AlertTriangle size={16} />}
                                            </p>
                                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Unidades</p>
                                        </div>

                                        <button
                                            onClick={() => setEditProduct(p)}
                                            style={{
                                                background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)',
                                                padding: '8px', borderRadius: '8px', cursor: 'pointer',
                                                transition: 'background 0.2s'
                                            }}
                                            title="Editar Produto"
                                        >
                                            <Pencil size={20} />
                                        </button>

                                        <button
                                            onClick={() => setAdjustmentProduct(p)}
                                            style={{
                                                background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)',
                                                padding: '8px', borderRadius: '8px', cursor: 'pointer',
                                                transition: 'background 0.2s'
                                            }}
                                            title="Ajustar Estoque"
                                        >
                                            <ArrowRightLeft size={20} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {(isProductModalOpen || editProduct) && (
                <ProductModal
                    initialData={editProduct || undefined}
                    onClose={() => { setIsProductModalOpen(false); setEditProduct(null); }}
                    onSuccess={() => {
                        setIsProductModalOpen(false);
                        setEditProduct(null);
                        fetchData();
                    }}
                />
            )}

            {adjustmentProduct && (
                <StockAdjustmentModal
                    product={adjustmentProduct}
                    onClose={() => setAdjustmentProduct(null)}
                    onSuccess={() => {
                        setAdjustmentProduct(null);
                        fetchData();
                    }}
                />
            )}
        </div>
    );
};
