import React from 'react';
import { Eye, Settings, Clock, CheckCircle, AlertTriangle, Smartphone, Laptop, Wrench, XCircle, Trash2 } from 'lucide-react';
import type { Order } from '../../types';

interface OrderListProps {
    orders: Order[];
    loading: boolean;
    onViewOrder: (order: Order) => void;
    onDelete?: (id: string) => void;
    showDeleted?: boolean;
}

const badge = (color: string): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
    background: `${color}18`, color, border: `1px solid ${color}30`,
});

const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
    ABERTA: { label: 'Aberta', color: '#9ca3af', icon: Clock },
    EM_DIAGNOSTICO: { label: 'Em Diagnóstico', color: '#3b82f6', icon: Settings },
    AGUARDANDO_APROVACAO: { label: 'Aguardando Aprovação', color: '#eab308', icon: AlertTriangle },
    AGUARDANDO_PECA: { label: 'Aguardando Peça', color: '#f97316', icon: Clock },
    EM_REPARO: { label: 'Em Reparo', color: '#a855f7', icon: Wrench },
    TESTES: { label: 'Em Testes', color: '#06b6d4', icon: Settings },
    FINALIZADA: { label: 'Finalizada', color: '#22c55e', icon: CheckCircle },
    ENTREGUE: { label: 'Entregue', color: '#10b981', icon: CheckCircle },
    CANCELADA: { label: 'Cancelada', color: '#ef4444', icon: XCircle },
};

export const OrderList: React.FC<OrderListProps> = ({ orders, loading, onViewOrder, onDelete, showDeleted }) => {
    if (loading) {
        return <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Carregando ordens...</div>;
    }

    if (orders.length === 0) {
        return (
            <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                <Settings size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                <p>Nenhuma ordem de serviço encontrada.</p>
            </div>
        );
    }

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        {['Protocolo', 'Cliente', 'Equipamentos', 'Status', 'Data', 'Ações'].map(h => (
                            <th key={h} style={{ padding: '14px 16px', textAlign: h === 'Ações' ? 'right' : 'left', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => {
                        const config = statusConfig[order.status] || { label: order.status, color: '#9ca3af', icon: Clock };
                        const StatusIcon = config.icon;
                        const mainEquipment = order.equipments?.find(e => e.isMain) || order.equipments?.[0];
                        const otherEquipmentsCount = (order.equipments?.length || 0) - 1;

                        return (
                            <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s', cursor: 'pointer' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                onClick={() => onViewOrder(order)}>

                                <td style={{ padding: '12px 16px' }}>
                                    <div style={{ fontWeight: 500, color: '#fff', fontSize: '14px', fontFamily: 'monospace' }}>{order.protocol}</div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginTop: '2px' }}>{order.priority}</div>
                                </td>

                                <td style={{ padding: '12px 16px' }}>
                                    <div style={{ fontWeight: 500, color: '#fff', fontSize: '14px' }}>{order.client?.nome || 'Cliente não identificado'}</div>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{order.client?.email || '—'}</div>
                                </td>

                                <td style={{ padding: '12px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                                        {mainEquipment ? (
                                            <>
                                                {mainEquipment.type.toLowerCase().includes('celular') ? <Smartphone size={14} /> : <Laptop size={14} />}
                                                <span>{mainEquipment.brand} {mainEquipment.model}</span>
                                                {otherEquipmentsCount > 0 && (
                                                    <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '10px', padding: '2px 6px', borderRadius: '10px' }}>+{otherEquipmentsCount}</span>
                                                )}
                                            </>
                                        ) : (
                                            <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.3)' }}>Sem equipamento</span>
                                        )}
                                    </div>
                                </td>

                                <td style={{ padding: '12px 16px' }}>
                                    <span style={badge(config.color)}>
                                        <StatusIcon size={12} /> {config.label}
                                    </span>
                                </td>

                                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                                    {new Date(order.entryDate).toLocaleDateString()}
                                </td>

                                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                    <button onClick={(e) => { e.stopPropagation(); onViewOrder(order); }} title="Ver detalhes"
                                        style={{ padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', color: 'var(--primary)', cursor: 'pointer' }}>
                                        <Eye size={16} />
                                    </button>
                                    {onDelete && !showDeleted && (
                                        <button onClick={(e) => { e.stopPropagation(); onDelete(order.id); }} title="Excluir"
                                            style={{ padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
