import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Monitor, Clock, CheckCircle, Search, Laptop, Smartphone } from 'lucide-react';

interface Order {
    id: string;
    protocol: string;
    status: string;
    priority: string;
    entryDate: string;
    client: { nome: string };
    equipments: Array<{ type: string; model: string }>;
}

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: any }> = {
    aberta: { color: '#94a3b8', label: 'ABERTA', icon: Search },
    em_diagnostico: { color: '#3b82f6', label: 'EM DIAGNÓSTICO', icon: Search },
    aguardando_aprovacao: { color: '#f59e0b', label: 'AGUAR. APROVAÇÃO', icon: Clock },
    aguardando_peca: { color: '#ec4899', label: 'AGUAR. PEÇA', icon: Clock },
    em_reparo: { color: '#8b5cf6', label: 'EM REPARO', icon: Laptop },
    testes: { color: '#06b6d4', label: 'EM TESTES', icon: CheckCircle },
    finalizada: { color: '#10b981', label: 'PRONTO / FINALIZADA', icon: CheckCircle },
};

const ITEMS_PER_PAGE = 8;

export const MonitorDashboard: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState(new Date());
    const [currentPage, setCurrentPage] = useState(0);

    const loadOrders = async () => {
        try {
            const res = await api.get('/orders/public/monitor');
            setOrders(res.data);
        } catch (err) {
            console.error('Error loading monitor data:', err);
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);

    useEffect(() => {
        loadOrders();
        const refreshInterval = setInterval(loadOrders, 30000);
        const timerInterval = setInterval(() => setNow(new Date()), 1000);

        const pageInterval = setInterval(() => {
            setCurrentPage(prev => (prev + 1) >= totalPages ? 0 : prev + 1);
        }, 15000);

        return () => {
            clearInterval(refreshInterval);
            clearInterval(timerInterval);
            clearInterval(pageInterval);
        };
    }, [totalPages]);

    useEffect(() => {
        if (currentPage >= totalPages && totalPages > 0) {
            setCurrentPage(0);
        }
    }, [orders.length, totalPages]);

    const getTimeOpen = (entryDate: string) => {
        const start = new Date(entryDate);
        const diff = now.getTime() - start.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    if (loading && orders.length === 0) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c', color: '#f8fafc' }}>
                <div className="animate-pulse" style={{ fontSize: '24px', fontWeight: 700 }}>Carregando Monitor de Serviços...</div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0a0a0c',
            color: '#f8fafc',
            padding: '40px',
            fontFamily: "'Inter', sans-serif",
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '40px',
                padding: '24px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(12px)'
            }}>
                <div>
                    <h1 style={{ fontSize: '36px', fontWeight: 800, margin: 0, background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        MONITOR DE SERVIÇOS
                    </h1>
                    <div style={{ fontSize: '16px', color: '#94a3b8', marginTop: '4px', fontWeight: 500 }}>
                        {orders.length} ordens ativas • {totalPages > 1 ? `Página ${currentPage + 1} de ${totalPages}` : 'Visão Geral'}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '32px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    <div style={{ fontSize: '14px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </div>
                </div>
            </div>

            {/* Content Table */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Table Header */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '150px 250px 1fr 240px 150px',
                    gap: '20px',
                    padding: '16px 32px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#94a3b8',
                    marginBottom: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                    <div>Protocolo</div>
                    <div>Cliente</div>
                    <div>Equipamento / Modelo</div>
                    <div>Status do Serviço</div>
                    <div style={{ textAlign: 'right' }}>Aguardando</div>
                </div>

                {/* Rows with Fade Animation */}
                <div key={currentPage} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    animation: 'fadeInUp 0.5s ease-out'
                }}>
                    {orders
                        .slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE)
                        .map(order => {
                            const isUrgent = order.priority === 'urgente';
                            const timeOpen = getTimeOpen(order.entryDate);
                            const equipment = order.equipments?.[0] || { type: 'Dispositivo', model: 'N/D' };
                            const statusConfig = STATUS_CONFIG[order.status] || { color: '#94a3b8', label: order.status.toUpperCase(), icon: Clock };
                            const StatusIcon = statusConfig.icon;

                            return (
                                <div key={order.id} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '150px 250px 1fr 240px 150px',
                                    gap: '20px',
                                    padding: '20px 32px',
                                    background: isUrgent ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                                    border: `1px solid ${isUrgent ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`,
                                    borderRadius: '16px',
                                    fontSize: '18px',
                                    fontWeight: 500,
                                    position: 'relative',
                                    alignItems: 'center',
                                    boxShadow: isUrgent ? '0 0 20px rgba(239, 68, 68, 0.05)' : 'none'
                                }}>
                                    <div style={{ fontWeight: 700, color: isUrgent ? '#ef4444' : '#fff', fontFamily: 'monospace' }}>
                                        {order.protocol}
                                    </div>
                                    <div style={{ color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {order.client.nome.toUpperCase()}
                                    </div>
                                    <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {equipment.type.includes('Celular') ? <Smartphone size={18} /> : <Laptop size={18} />}
                                        <span style={{ color: '#fff' }}>{equipment.type}</span>
                                        <span style={{ opacity: 0.7 }}>{equipment.model}</span>
                                    </div>
                                    <div>
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '6px 16px',
                                            borderRadius: '100px',
                                            fontSize: '14px',
                                            fontWeight: 700,
                                            background: `${statusConfig.color}15`,
                                            color: statusConfig.color,
                                            border: `1px solid ${statusConfig.color}30`
                                        }}>
                                            <StatusIcon size={14} />
                                            {statusConfig.label}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', color: isUrgent ? '#ef4444' : '#fff', fontWeight: 600 }}>
                                        {timeOpen}
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>

            {/* Footer */}
            <div style={{
                marginTop: '40px',
                padding: '16px 32px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#94a3b8', fontSize: '14px' }}>
                    <Monitor size={18} />
                    <span>SISTEMA ATUALIZADO EM TEMPO REAL</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 2s infinite' }}></div>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>PRIORIDADE URGENTE</span>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
                body {
                    margin: 0;
                    overflow: hidden;
                    background: #0a0a0c;
                }
            `}</style>
        </div>
    );
};
