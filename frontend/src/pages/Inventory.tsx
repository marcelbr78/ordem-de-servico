import React, { useState, useEffect } from 'react';
import { Search, Plus, Package, ArrowRightLeft, Pencil, X } from 'lucide-react';
import api from '../services/api';
import { ProductModal } from '../components/inventory/ProductModal';
import { StockAdjustmentModal } from '../components/inventory/StockAdjustmentModal';

export const Inventory: React.FC = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'product' | 'service'>('all');
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editProduct, setEditProduct] = useState<any | null>(null);
    const [adjustmentProduct, setAdjustmentProduct] = useState<any | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/inventory');
            setProducts(res.data || []);
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));

    return (
        <div style={{ padding: '24px' }}>
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
                    <Plus size={20} /> Novo Item
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
                {/* Search and Tabs Container */}
                <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={20} style={{ position: 'absolute', left: '12px', top: '12px', color: 'rgba(255,255,255,0.4)' }} />
                        <input
                            type="text"
                            placeholder="Buscar item por nome ou SKU..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '12px 12px 12px 42px', borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                                color: '#fff', outline: 'none'
                            }}
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div style={{ display: 'flex', gap: '8px', padding: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', width: 'fit-content' }}>
                        {(['all', 'product', 'service'] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                style={{
                                    padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                                    background: filterType === type ? 'var(--primary)' : 'transparent',
                                    color: filterType === type ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {type === 'all' ? 'Todos' : type === 'product' ? 'Produtos' : 'Serviços'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List */}
                <div className="grid-responsive-2">
                    {loading ? (
                        <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                            Carregando estoque...
                        </div>
                    ) : (
                        products
                            .filter(p => {
                                const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
                                const matchesType = filterType === 'all' || p.type === filterType;
                                return matchesSearch && matchesType;
                            })
                            .map(product => {
                                const quantity = product.balance?.quantity || 0;
                                const isService = product.type === 'service';
                                return (
                                    <div key={product.id} className="card-glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', color: 'var(--primary)' }}>
                                                    <Package size={20} />
                                                </div>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>{product.name}</h3>
                                                        <span style={{
                                                            fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                                                            background: isService ? 'rgba(139, 92, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                                            color: isService ? '#a78bfa' : '#60a5fa', fontWeight: 700, textTransform: 'uppercase'
                                                        }}>
                                                            {isService ? 'Serviço' : 'Produto'}
                                                        </span>
                                                    </div>
                                                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                                                        {isService ? product.category : `${product.brand || 'Sem marca'} • ${product.sku || 'Sem SKU'}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button onClick={() => setEditProduct(product)}
                                                    style={{ padding: '6px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
                                                    title="Editar"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                {!isService && (
                                                    <button onClick={() => setAdjustmentProduct(product)}
                                                        style={{ padding: '6px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
                                                        title="Ajustar Estoque"
                                                    >
                                                        <ArrowRightLeft size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                            <div>
                                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '2px' }}>Venda</div>
                                                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)' }}>
                                                    {formatCurrency(product.priceSell)}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '2px' }}>Custo</div>
                                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                                                    {isService ? '-' : formatCurrency(product.priceCost || 0)}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '2px' }}>Estoque</div>
                                                <div style={{ fontSize: '14px', fontWeight: 600, color: isService ? 'rgba(255,255,255,0.3)' : (quantity > (product.minQuantity || 0) ? '#10b981' : '#f43f5e') }}>
                                                    {isService ? '-' : quantity}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                    )}
                </div>
            </div>

            {/* Modals */}
            {(isProductModalOpen || editProduct) && (
                <div style={modalOverlay} onClick={() => { setIsProductModalOpen(false); setEditProduct(null); }}>
                    <div className="modal-box-responsive" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                                {editProduct ? 'Editar Item' : 'Novo Item'}
                            </h2>
                            <button
                                onClick={() => { setIsProductModalOpen(false); setEditProduct(null); }}
                                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <ProductModal
                            initialData={editProduct || undefined}
                            onClose={() => { setIsProductModalOpen(false); setEditProduct(null); }}
                            onSuccess={() => {
                                setIsProductModalOpen(false);
                                setEditProduct(null);
                                fetchData();
                            }}
                        />
                    </div>
                </div>
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

const modalOverlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
};
