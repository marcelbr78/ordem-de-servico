import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { Smartphone, User, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import type { Order } from '../types';
import { OrderDetails } from '../components/orders/OrderDetails';

// ── Configuração das colunas ───────────────────────────────────
const COLUMNS = [
    { status: 'aberta',               label: 'Aberta',        color: '#94a3b8' },
    { status: 'em_diagnostico',       label: 'Diagnóstico',   color: '#3b82f6' },
    { status: 'aguardando_aprovacao', label: 'Ag. Aprovação', color: '#eab308' },
    { status: 'aguardando_peca',      label: 'Ag. Peça',      color: '#f97316' },
    { status: 'em_reparo',            label: 'Em Reparo',     color: '#a855f7' },
    { status: 'testes',               label: 'Testes',        color: '#06b6d4' },
    { status: 'finalizada',           label: 'Finalizada',    color: '#22c55e' },
];

const PRIORITY_COLOR: Record<string, string> = {
    baixa: '#22c55e', normal: '#3b82f6', alta: '#f59e0b', urgente: '#ef4444',
};

// ── Card de OS ─────────────────────────────────────────────────
const KanbanCard: React.FC<{
    order: Order;
    onDragStart: (e: React.DragEvent, order: Order) => void;
    onClick: (order: Order) => void;
}> = ({ order, onDragStart, onClick }) => {
    const eq = order.equipments?.find(e => e.isMain) || order.equipments?.[0];
    const pColor = PRIORITY_COLOR[order.priority] || '#3b82f6';

    return (
        <div
            draggable
            onDragStart={e => onDragStart(e, order)}
            onClick={() => onClick(order)}
            style={{
                background: '#1a1a2a', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px', padding: '12px', cursor: 'grab',
                transition: 'all 0.15s', userSelect: 'none',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'none'; }}
        >
            {/* Protocolo + prioridade */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: 'var(--accent-primary)', letterSpacing: '0.5px' }}>
                    #{order.protocol}
                </span>
                <span style={{ fontSize: '9px', fontWeight: 800, color: pColor, background: `${pColor}18`, padding: '2px 6px', borderRadius: '5px', textTransform: 'uppercase' }}>
                    {order.priority}
                </span>
            </div>

            {/* Cliente */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                <User size={11} color="rgba(255,255,255,0.3)" />
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {order.client?.nome || '—'}
                </span>
            </div>

            {/* Equipamento */}
            {eq && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                    <Smartphone size={11} color="rgba(255,255,255,0.25)" />
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {eq.brand} {eq.model}
                    </span>
                </div>
            )}

            {/* Data */}
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
                {new Date(order.entryDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                {order.priority?.toString().toLowerCase() === 'urgente' && (
                    <span style={{ marginLeft: '6px', color: '#ef4444' }}>⚡ URGENTE</span>
                )}
            </div>
        </div>
    );
};

// ── Coluna do Kanban ───────────────────────────────────────────
const KanbanColumn: React.FC<{
    column: typeof COLUMNS[0];
    orders: Order[];
    onDragStart: (e: React.DragEvent, order: Order) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, status: string) => void;
    onCardClick: (order: Order) => void;
}> = ({ column, orders, onDragStart, onDragOver, onDrop, onCardClick }) => {
    const [isDragOver, setIsDragOver] = useState(false);

    return (
        <div
            style={{ minWidth: '220px', width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0' }}
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); onDragOver(e); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={e => { setIsDragOver(false); onDrop(e, column.status); }}
        >
            {/* Cabeçalho */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px 10px 0 0', background: `${column.color}12`, borderBottom: `2px solid ${column.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: column.color }} />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{column.label}</span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: column.color, background: `${column.color}20`, padding: '2px 7px', borderRadius: '10px' }}>{orders.length}</span>
            </div>

            {/* Cards */}
            <div style={{
                flex: 1, minHeight: '200px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px',
                background: isDragOver ? `${column.color}08` : '#0f0f18',
                border: `1px solid ${isDragOver ? column.color + '40' : 'rgba(255,255,255,0.05)'}`,
                borderTop: 'none', borderRadius: '0 0 10px 10px',
                transition: 'all 0.15s',
            }}>
                {orders.length === 0 && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.1)', fontSize: '12px', minHeight: '60px' }}>
                        {isDragOver ? 'Solte aqui' : 'Sem OS'}
                    </div>
                )}
                {orders.map(order => (
                    <KanbanCard key={order.id} order={order} onDragStart={onDragStart} onClick={onCardClick} />
                ))}
            </div>
        </div>
    );
};

// ── Página principal ───────────────────────────────────────────
export const Kanban: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [dragTargetStatus, setDragTargetStatus] = useState<string | null>(null);
    const dragOrder = useRef<Order | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const res = await api.get('/orders');
            // Excluir entregues e canceladas do kanban
            setOrders(res.data.filter((o: Order) => !['entregue', 'cancelada'].includes(o.status)));
        } catch (e) { console.error('Kanban load error', e); } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleDragStart = (e: React.DragEvent, order: Order) => {
        dragOrder.current = order;
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        const order = dragOrder.current;
        if (!order || order.status === newStatus) return;

        // Em vez de salvar silenciosamente no fundo falhando o WhatsApp, abrimos a OS
        // com a modal de mudança de status já aberta apontando pro status soltado.
        setDragTargetStatus(newStatus);
        setSelectedOrder(order);
        
        dragOrder.current = null;
    };

    const ordersByStatus = (status: string) =>
        orders.filter(o => o.status === status)
            .sort((a, b) => {
                // Urgentes primeiro
                const pOrder = { urgente: 0, alta: 1, normal: 2, baixa: 3 };
                return (pOrder[a.priority] ?? 2) - (pOrder[b.priority] ?? 2);
            });

    const totalActive = orders.length;
    const urgent = orders.filter(o => o.priority?.toString().toLowerCase() === 'urgente').length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexShrink: 0 }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Kanban de OS</h1>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>
                        {totalActive} OS ativas
                        {urgent > 0 && <span style={{ color: '#ef4444', marginLeft: '8px' }}>⚡ {urgent} urgente{urgent > 1 ? 's' : ''}</span>}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={load} style={{ padding: '9px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: loading ? 'var(--accent-primary)' : 'rgba(255,255,255,0.6)', cursor: 'pointer', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                    </button>
                    <a href="/orders" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent-primary), #7c3aed)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '13px', minHeight: '44px' }}>
                        <Plus size={15} /> Nova OS
                    </a>
                </div>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

            {/* Dica mobile */}
            <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '10px', padding: '8px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <AlertCircle size={13} color="rgba(59,130,246,0.6)" />
                Arraste os cards entre as colunas para alterar o status da OS
            </div>

            {/* Board — scroll horizontal */}
            <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', minWidth: 'max-content', height: '100%', alignItems: 'flex-start' }}>
                    {COLUMNS.map(col => (
                        <KanbanColumn
                            key={col.status}
                            column={col}
                            orders={ordersByStatus(col.status)}
                            onDragStart={handleDragStart}
                            onDragOver={e => e.preventDefault()}
                            onDrop={handleDrop}
                            onCardClick={order => window.location.href = `/orders?open=${order.id}`}
                        />
                    ))}
                </div>
            </div>

            {/* Modal de detalhes ao soltar arrastado */}
            {selectedOrder && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '12px' }} onClick={() => setSelectedOrder(null)}>
                    <div className="modal-box-responsive" style={{ maxWidth: '1000px', maxHeight: '94dvh', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', width: '100%' }} onClick={e => e.stopPropagation()}>
                        <OrderDetails
                            key={selectedOrder.id}
                            order={selectedOrder}
                            initialTab="Histórico"
                            startWithStatusOpen={true}
                            forceNewStatus={dragTargetStatus || undefined}
                            onClose={() => { setSelectedOrder(null); setDragTargetStatus(null); }}
                            onUpdate={load}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
