
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Search, Settings, Clock, CheckCircle, Trash2 } from 'lucide-react';
import type { Order } from '../types';
import { OrderList } from '../components/orders/OrderList';
import { OrderForm } from '../components/orders/OrderForm';
import { OrderDetails } from '../components/orders/OrderDetails';

// ─── Styles from Clients.tsx (Visual Parity) ─────────────────────────
const btnStyle = (active: boolean, color: string = '#6366f1'): React.CSSProperties => ({
    padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
    border: active ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.1)',
    background: active ? `${color}26` : 'rgba(255,255,255,0.04)',
    color: active ? color : 'rgba(255,255,255,0.6)',
    display: 'flex', alignItems: 'center', gap: '6px'
});

const modalOverlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    padding: '20px',
};

export const Orders: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'create'>('list');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Filters
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const [showDeleted, setShowDeleted] = useState(false);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const response = await api.get('/orders', {
                params: { deleted: showDeleted }
            });
            setOrders(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, [showDeleted]);

    const handleCreateSuccess = () => {
        setView('list');
        loadOrders();
    };

    const handleViewOrder = async (order: Order) => {
        // Set basic data first for immediate feedback
        setSelectedOrder(order);
        try {
            // Fetch full details including history, photos, etc.
            const response = await api.get(`/orders/${order.id}`);
            setSelectedOrder(response.data);
        } catch (error) {
            console.error("Error fetching full order details:", error);
        }
    };

    const handleUpdateOrder = async () => {
        await loadOrders();
        // If we have a selected order, refresh its details so the modal doesn't close/show stale data
        if (selectedOrder) {
            try {
                const response = await api.get(`/orders/${selectedOrder.id}`);
                setSelectedOrder(response.data);
            } catch (error) {
                console.error("Error refreshing order details:", error);
            }
        }
    };

    const handleDeleteOrder = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir esta Ordem de Serviço?')) return;
        try {
            await api.delete(`/orders/${id}`);
            loadOrders();
        } catch (error) {
            console.error('Error deleting order:', error);
            alert('Erro ao excluir ordem');
        }
    };

    const filteredOrders = orders.filter(o => {
        const matchSearch = search ? (o.protocol?.toLowerCase().includes(search.toLowerCase()) || o.client?.nome.toLowerCase().includes(search.toLowerCase())) : true;
        const matchStatus = filterStatus ? o.status === filterStatus : true;
        return matchSearch && matchStatus;
    });

    return (
        <>
            <div className="animate-fade" style={{ padding: '24px' }}>
                {view === 'list' && (
                    <>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    Ordens de Serviço
                                </h1>
                                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>
                                    {orders.length} ordens registradas
                                </p>
                            </div>
                            <button
                                onClick={() => setView('create')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                                    borderRadius: '10px', border: 'none', fontWeight: 600, cursor: 'pointer',
                                    background: 'linear-gradient(135deg, var(--primary), #7c3aed)', color: '#fff',
                                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)'
                                }}
                            >
                                <Plus size={18} /> Nova OS
                            </button>
                        </div>

                        {/* Search & Filters */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'rgba(255,255,255,0.3)' }} />
                                <input
                                    placeholder="Buscar por protocolo, cliente..."
                                    value={search} onChange={e => setSearch(e.target.value)}
                                    style={{
                                        width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px',
                                        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                                        color: '#fff', fontSize: '14px', outline: 'none',
                                    }}
                                />
                            </div>

                            <button onClick={() => setFilterStatus(filterStatus === 'aberta' ? '' : 'aberta')} style={btnStyle(filterStatus === 'aberta', '#9ca3af')}>
                                <Clock size={14} /> Aberta
                            </button>
                            <button onClick={() => setFilterStatus(filterStatus === 'em_diagnostico' ? '' : 'em_diagnostico')} style={btnStyle(filterStatus === 'em_diagnostico', '#3b82f6')}>
                                <Settings size={14} /> Em Diag.
                            </button>
                            <button onClick={() => setFilterStatus(filterStatus === 'em_reparo' ? '' : 'em_reparo')} style={btnStyle(filterStatus === 'em_reparo', '#a855f7')}>
                                <Settings size={14} /> Em Reparo
                            </button>
                            <button onClick={() => setFilterStatus(filterStatus === 'finalizada' ? '' : 'finalizada')} style={btnStyle(filterStatus === 'finalizada', '#22c55e')}>
                                <CheckCircle size={14} /> Finalizada
                            </button>
                            <button onClick={() => setShowDeleted(!showDeleted)} style={btnStyle(showDeleted, '#ef4444')}>
                                <Trash2 size={14} /> Lixeira
                            </button>
                        </div>

                        {/* Order List Table Container */}
                        <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', minHeight: '400px', overflow: 'hidden' }}>
                            <OrderList
                                orders={filteredOrders}
                                loading={loading}
                                onViewOrder={handleViewOrder}
                                onDelete={handleDeleteOrder}
                                showDeleted={showDeleted}
                            />
                        </div>
                    </>
                )}

                {view === 'create' && (
                    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                        <OrderForm
                            onClose={() => setView('list')}
                            onSuccess={handleCreateSuccess}
                        />
                    </div>
                )}
            </div>

            {selectedOrder && (
                <div style={modalOverlay} onClick={() => setSelectedOrder(null)}>
                    <div className="modal-box-responsive" style={{ maxWidth: '1000px', maxHeight: '90vh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                        <OrderDetails
                            key={selectedOrder.id}
                            order={selectedOrder}
                            onClose={() => setSelectedOrder(null)}
                            onUpdate={handleUpdateOrder}
                        />
                    </div>
                </div>
            )}
        </>
    );
};
