import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Search, Filter, MoreVertical, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface Order {
    id: string;
    protocol: string;
    equipment: string;
    status: string;
    entryDate: string;
    client: {
        name: string;
    };
}

const statusColors: Record<string, string> = {
    FILA: 'var(--text-secondary)',
    DIAGNOSTICO: 'var(--accent-primary)',
    ORCAMENTO: 'var(--warning)',
    APROVADO: 'var(--success)',
    REPARO: '#a855f7',
    PRONTO: '#22c55e',
}

export const Orders: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadOrders() {
            try {
                const response = await api.get('/orders');
                setOrders(response.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadOrders();
    }, []);

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px' }}>Ordens de Serviço</h1>
                <button style={{
                    background: 'var(--accent-primary)',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: '600'
                }}>
                    <Plus size={20} />
                    Nova OS
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                            <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>Protocolo</th>
                            <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>Cliente / Equipamento</th>
                            <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>Status</th>
                            <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>Data Entrada</th>
                            <th style={{ padding: '16px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '16px' }}>
                                    <span style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>{order.protocol}</span>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ fontWeight: '500' }}>{order.client?.name || '---'}</div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{order.equipment}</div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: statusColors[order.status] || 'white',
                                        border: `1px solid ${statusColors[order.status] || 'var(--border-color)'}33`
                                    }}>
                                        {order.status}
                                    </span>
                                </td>
                                <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                    {new Date(order.entryDate).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right' }}>
                                    <button style={{ color: 'var(--text-secondary)' }}><MoreVertical size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {loading && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Carregando ordens...</div>}
                {!loading && orders.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Nenhuma ordem encontrada. Clique em "Nova OS" para começar.
                    </div>
                )}
            </div>
        </div>
    );
};
