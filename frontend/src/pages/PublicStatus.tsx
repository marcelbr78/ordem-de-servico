import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, CheckCircle, Clock, XCircle, Wrench, FileText, ArrowLeft } from 'lucide-react';
import api from '../services/api';

export const PublicStatus: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [order, setOrder] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchOrder = async (orderId: string) => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/orders/public/${orderId}`);
            setOrder(res.data);
        } catch (error) {
            console.error(error); // Log to avoid unused var
            setError('Ordem de Serviço não encontrada ou acesso inválido.');
            setOrder(null);
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch if ID is present
    React.useEffect(() => {
        if (id) fetchOrder(id);
    }, [id]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm) fetchOrder(searchTerm);
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'aberta': return { color: 'text-blue-500', bg: 'bg-blue-500/10', icon: FileText, label: 'Aberta' };
            case 'em_diagnostico': return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: Search, label: 'Em Diagnóstico' };
            case 'aguardando_aprovacao': return { color: 'text-orange-500', bg: 'bg-orange-500/10', icon: Clock, label: 'Aguardando Aprovação' };
            case 'em_reparo': return { color: 'text-purple-500', bg: 'bg-purple-500/10', icon: Wrench, label: 'Em Reparo' };
            case 'finalizada': return { color: 'text-green-500', bg: 'bg-green-500/10', icon: CheckCircle, label: 'Pronto' };
            case 'entregue': return { color: 'text-green-600', bg: 'bg-green-600/10', icon: CheckCircle, label: 'Entregue' };
            case 'cancelada': return { color: 'text-red-500', bg: 'bg-red-500/10', icon: XCircle, label: 'Cancelada' };
            default: return { color: 'text-gray-500', bg: 'bg-gray-500/10', icon: FileText, label: 'Desconhecido' };
        }
    };

    const statusInfo = order ? getStatusInfo(order.status) : null;
    const StatusIcon = statusInfo?.icon;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
            <div style={{ width: '100%', maxWidth: '600px' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
                        Consulta OS
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)' }}>Acompanhe o status do seu serviço em tempo real</p>
                </div>

                {!id && (
                    <form onSubmit={handleSearch} style={{ marginBottom: '32px' }}>
                        <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                placeholder="Digite o Nº da OS ou Protocolo..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{
                                    flex: 1, padding: '16px 16px 16px 48px', borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                                    color: '#fff', outline: 'none', fontSize: '16px'
                                }}
                            />
                            <Search size={20} style={{ position: 'absolute', left: '16px', top: '18px', color: 'rgba(255,255,255,0.4)' }} />
                            <button
                                type="submit"
                                disabled={loading || !searchTerm}
                                style={{
                                    padding: '0 24px', borderRadius: '12px', border: 'none',
                                    background: 'var(--primary)', color: '#fff', fontWeight: 600,
                                    cursor: 'pointer', opacity: loading || !searchTerm ? 0.5 : 1
                                }}
                            >
                                {loading ? '...' : 'Buscar'}
                            </button>
                        </div>
                    </form>
                )}

                {error && (
                    <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', textAlign: 'center', marginBottom: '24px' }}>
                        {error}
                        {id && <Link to="/status" style={{ display: 'block', marginTop: '8px', textDecoration: 'underline' }}>Tentar outra busca</Link>}
                    </div>
                )}

                {order && statusInfo && StatusIcon && (
                    <div className="animate-fade glass-panel" style={{ padding: '32px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px',
                                background: statusInfo.bg.replace('bg-', '').replace('/10', ', 0.1)'), // Hacky Tailwind to style conversion
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: statusInfo.color.replace('text-', '') // Hacky
                            }}>
                                {/* We need proper colors for inline styles if Tailwind classes aren't compiled for dynamic values, but assuming basic classes work or using inline fallback */}
                                <StatusIcon size={40} className={statusInfo.color} />
                            </div>
                            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{statusInfo.label}</h2>
                            <p style={{ color: 'rgba(255,255,255,0.5)' }}>OS #{order.id?.slice(-4).toUpperCase()}</p>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Atualizado em {new Date(order.updatedAt).toLocaleString('pt-BR')}</p>
                        </div>

                        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Equipamento</p>
                                    <p style={{ color: '#fff', fontWeight: 500 }}>{order.equipments?.[0]?.brand} {order.equipments?.[0]?.model}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Valor Total</p>
                                    <p style={{ color: '#fff', fontWeight: 500 }}>
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total || 0)}
                                    </p>
                                </div>
                            </div>

                            {order.diagnosis && (
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', marginTop: '16px' }}>
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Diagnóstico Técnico</p>
                                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: '1.5' }}>{order.diagnosis}</p>
                                </div>
                            )}
                        </div>

                        {id && (
                            <Link to="/status" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '24px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)' }}>
                                <ArrowLeft size={16} /> Nova Consulta
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
