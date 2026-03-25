import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Search, Clock, CheckCircle, Trash2, Wrench, Package, X } from 'lucide-react';
import type { Order } from '../types';
import { OrderList } from '../components/orders/OrderList';
import { OrderForm } from '../components/orders/OrderForm';
import { OrderDetails } from '../components/orders/OrderDetails';

// ── Helpers ────────────────────────────────────────────────────
const FILTERS = [
    { label: 'Aberta', value: 'aberta', icon: Clock, color: '#94a3b8' },
    { label: 'Diagnóstico', value: 'em_diagnostico', icon: Search, color: '#3b82f6' },
    { label: 'Em Reparo', value: 'em_reparo', icon: Wrench, color: '#a855f7' },
    { label: 'Ag. Peça', value: 'aguardando_peca', icon: Package, color: '#f59e0b' },
    { label: 'Finalizada', value: 'finalizada', icon: CheckCircle, color: '#22c55e' },
];

const btnFilter = (active: boolean, color: string): React.CSSProperties => ({
    padding: '8px 14px', borderRadius: '10px', cursor: 'pointer',
    fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center',
    gap: '5px', whiteSpace: 'nowrap', minHeight: '44px',
    border: active ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.1)',
    background: active ? `${color}20` : 'rgba(255,255,255,0.04)',
    color: active ? color : 'rgba(255,255,255,0.6)',
    transition: 'all 0.15s',
});

export const Orders: React.FC = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const fn = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', fn);
        return () => window.removeEventListener('resize', fn);
    }, []);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'create'>('list');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [selectedTab, setSelectedTab] = useState('Histórico');
    const [startWithStatusOpen, setStartWithStatusOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showDeleted, setShowDeleted] = useState(false);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get('/orders', { params: { deleted: showDeleted } });
            setOrders(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadOrders(); }, [showDeleted]);

    // Trava scroll do fundo quando modal está aberto
    useEffect(() => {
        if (selectedOrder) {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        } else {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        };
    }, [selectedOrder]);

    const handleViewOrder = async (order: Order, tab?: string, openStatus?: boolean) => {
        setSelectedTab(tab || 'Histórico');
        setStartWithStatusOpen(!!openStatus);
        setSelectedOrder(order);
        try {
            const res = await api.get(`/orders/${order.id}`);
            setSelectedOrder(res.data);
        } catch {}
    };

    const handleUpdateOrder = async () => {
        await loadOrders();
        if (selectedOrder) {
            try {
                const res = await api.get(`/orders/${selectedOrder.id}`);
                setSelectedOrder(res.data);
            } catch {}
        }
    };

    const handleDeleteOrder = async (id: string) => {
        if (!window.confirm('Excluir esta Ordem de Serviço?')) return;
        try {
            await api.delete(`/orders/${id}`);
            loadOrders();
        } catch {
            alert('Erro ao excluir ordem');
        }
    };

    const toggleFilter = (val: string) =>
        setFilterStatus(prev => prev === val ? '' : val);

    const filteredOrders = orders.filter(o => {
        const q = search.toLowerCase();
        const matchSearch = !search || o.protocol?.toLowerCase().includes(q) || o.client?.nome?.toLowerCase().includes(q);
        const matchStatus = !filterStatus || o.status === filterStatus;
        return matchSearch && matchStatus;
    });

    if (view === 'create') return (
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <OrderForm onClose={() => setView('list')} onSuccess={() => { setView('list'); loadOrders(); }} />
        </div>
    );

    return (
        <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>
                            Ordens de Serviço
                        </h1>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>
                            {filteredOrders.length} de {orders.length} ordens
                        </p>
                    </div>
                    <button
                        onClick={() => setView('create')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '10px 18px', borderRadius: '10px', border: 'none',
                            fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                            background: 'linear-gradient(135deg, var(--accent-primary), #7c3aed)',
                            color: '#fff', minHeight: '44px', whiteSpace: 'nowrap',
                        }}
                    >
                        <Plus size={17} /> Nova OS
                    </button>
                </div>

                {/* Busca */}
                <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                    <input
                        placeholder="Buscar protocolo, cliente..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            width: '100%', padding: '11px 36px 11px 38px', borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                            color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                        }}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={15} />
                        </button>
                    )}
                </div>

                {/* Filtros de status — scroll horizontal no mobile */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', WebkitOverflowScrolling: 'touch' }}>
                    {FILTERS.map(({ label, value, icon: Icon, color }) => (
                        <button key={value} onClick={() => toggleFilter(value)} style={btnFilter(filterStatus === value, color)}>
                            <Icon size={13} /> {label}
                        </button>
                    ))}
                    <button onClick={() => setShowDeleted(v => !v)} style={btnFilter(showDeleted, '#ef4444')}>
                        <Trash2 size={13} /> Lixeira
                    </button>
                    {filterStatus && (
                        <button onClick={() => setFilterStatus('')} style={{ ...btnFilter(false, '#fff'), padding: '8px 10px' }}>
                            <X size={13} />
                        </button>
                    )}
                </div>

                {/* Lista */}
                <div style={{
                    background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px',
                    minHeight: '300px', overflow: 'hidden',
                }}>
                    <OrderList
                        orders={filteredOrders}
                        loading={loading}
                        onViewOrder={handleViewOrder}
                        onDelete={handleDeleteOrder}
                        showDeleted={showDeleted}
                    />
                </div>
            </div>

            {/* Modal de detalhes */}
            {selectedOrder && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: isMobile ? 0 : '12px' }}
                    onClick={() => setSelectedOrder(null)}
                >
                    <div
                        className="modal-box-responsive"
                        style={{ maxWidth: isMobile ? '100%' : '1000px', height: isMobile ? '100dvh' : '94dvh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', width: '100%', borderRadius: isMobile ? 0 : '16px' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <OrderDetails
                            key={selectedOrder.id}
                            order={selectedOrder}
                            initialTab={selectedTab}
                            startWithStatusOpen={startWithStatusOpen}
                            onClose={() => setSelectedOrder(null)}
                            onUpdate={handleUpdateOrder}
                        />
                    </div>
                </div>
            )}
        </>
    );
};
