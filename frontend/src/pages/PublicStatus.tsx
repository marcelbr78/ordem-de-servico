import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Search, CheckCircle, Clock, XCircle, Wrench, FileText,
    ChevronRight, Smartphone, Calendar, MessageCircle,
    ThumbsUp, ThumbsDown, AlertCircle, RefreshCw,
} from 'lucide-react';
import api from '../services/api';

// ── Status config ──────────────────────────────────────────────
const STATUS: Record<string, { label: string; color: string; icon: any; desc: string }> = {
    aberta:               { label: 'Recebido',         color: '#94a3b8', icon: FileText,    desc: 'Equipamento recebido e aguardando diagnóstico.' },
    em_diagnostico:       { label: 'Em Diagnóstico',   color: '#3b82f6', icon: Search,      desc: 'Nossos técnicos estão analisando o equipamento.' },
    aguardando_aprovacao: { label: 'Orçamento Pronto', color: '#f59e0b', icon: AlertCircle, desc: 'O diagnóstico foi concluído. Aprovação necessária.' },
    aguardando_peca:      { label: 'Aguardando Peça',  color: '#f97316', icon: Clock,       desc: 'Aguardando chegada das peças para o reparo.' },
    em_reparo:            { label: 'Em Reparo',        color: '#a855f7', icon: Wrench,      desc: 'Equipamento em processo de reparo.' },
    testes:               { label: 'Em Testes',        color: '#06b6d4', icon: RefreshCw,   desc: 'Reparo concluído, realizando testes finais.' },
    finalizada:           { label: 'Pronto!',          color: '#22c55e', icon: CheckCircle, desc: 'Equipamento pronto para retirada.' },
    entregue:             { label: 'Entregue',         color: '#10b981', icon: CheckCircle, desc: 'Equipamento entregue ao cliente.' },
    cancelada:            { label: 'Cancelada',        color: '#ef4444', icon: XCircle,     desc: 'Ordem de serviço cancelada.' },
};

const ALL_STEPS = ['aberta', 'em_diagnostico', 'aguardando_aprovacao', 'aguardando_peca', 'em_reparo', 'testes', 'finalizada', 'entregue'];
const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

export const PublicStatus: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [order, setOrder] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [approving, setApproving] = useState(false);
    const [approvalDone, setApprovalDone] = useState<{ approved: boolean; message: string } | null>(null);
    const [clientNote, setClientNote] = useState('');
    const [showApprovalForm, setShowApprovalForm] = useState(false);

    const fetchOrder = async (orderId: string) => {
        setLoading(true); setError('');
        try {
            const res = await api.get(`/orders/public/${orderId}`);
            setOrder(res.data);
        } catch {
            setError('Ordem não encontrada. Verifique o protocolo e tente novamente.');
            setOrder(null);
        } finally { setLoading(false); }
    };

    useEffect(() => { if (id) fetchOrder(id); }, [id]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (search.trim()) fetchOrder(search.trim());
    };

    const handleApproval = async (approved: boolean) => {
        if (!order) return;
        setApproving(true);
        try {
            const res = await api.post(`/orders/public/${order.id}/approve`, { approved, clientNote });
            setApprovalDone({ approved, message: res.data.message });
            // Recarregar OS para refletir novo status
            await fetchOrder(order.protocol);
        } catch {
            alert('Erro ao processar aprovação. Tente novamente ou entre em contato conosco.');
        } finally { setApproving(false); }
    };

    const currentStep = order ? ALL_STEPS.indexOf(order.status) : -1;
    const cfg = order ? (STATUS[order.status] || STATUS.aberta) : null;
    // Usa finalValue se disponível (peças/serviços lançados), senão estimatedValue
    const displayValue = order ? (Number(order.finalValue) > 0 ? Number(order.finalValue) : Number(order.estimatedValue) || 0) : 0;
    // Configurações de exibição vindas do backend
    const pub = order?.publicSettings ?? { showPrice: true, showTimeline: true, showTechnician: false, customMessage: '', accentColor: '#3b82f6' };
    const accentColor = pub.accentColor || '#3b82f6';

    return (
        <div style={{ minHeight: '100dvh', background: '#0a0a0c', color: '#fff', fontFamily: 'system-ui, sans-serif', padding: '16px' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>

                {/* Logo / Header */}
                <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: `linear-gradient(135deg, ${accentColor}, #7c3aed)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                        <Smartphone size={26} color="#fff" />
                    </div>
                    <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px' }}>Status da OS</h1>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>Acompanhe o andamento do seu equipamento</p>
                </div>

                {/* Campo de busca */}
                {!id && (
                    <form onSubmit={handleSearch} style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                <input
                                    placeholder="Digite o número do protocolo..."
                                    value={search} onChange={e => setSearch(e.target.value)}
                                    style={{ width: '100%', padding: '13px 12px 13px 38px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '16px', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                            <button type="submit" style={{ padding: '0 20px', borderRadius: '12px', background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', minHeight: '48px', whiteSpace: 'nowrap' }}>
                                Buscar
                            </button>
                        </div>
                    </form>
                )}

                {loading && (
                    <div style={{ textAlign: 'center', padding: '48px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} /> Buscando...
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    </div>
                )}

                {error && (
                    <div style={{ padding: '16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', color: '#ef4444', textAlign: 'center', marginBottom: '16px' }}>
                        {error}
                    </div>
                )}

                {order && cfg && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* Mensagem personalizada da loja */}
                        {pub.customMessage && (
                            <div style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}30`, borderRadius: '12px', padding: '12px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.75)', fontStyle: 'italic', textAlign: 'center' }}>
                                {pub.customMessage}
                            </div>
                        )}

                        {/* Card de status */}
                        <div style={{ background: '#16161a', border: `1px solid ${cfg.color}40`, borderRadius: '16px', padding: '20px', borderTop: `3px solid ${cfg.color}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <div>
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '0 0 2px' }}>Protocolo</p>
                                    <p style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: 0, fontFamily: 'monospace' }}>#{order.protocol}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: `${cfg.color}18`, border: `1px solid ${cfg.color}30`, borderRadius: '10px', padding: '8px 14px' }}>
                                    <cfg.icon size={16} color={cfg.color} />
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                                </div>
                            </div>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '0 0 14px' }}>{cfg.desc}</p>

                            {/* Info equipamento */}
                            {order.equipments?.[0] && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                                    <Smartphone size={15} color="rgba(255,255,255,0.4)" />
                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                                        {order.equipments[0].brand} {order.equipments[0].model}
                                    </span>
                                </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                                <Calendar size={12} /> Abertura: {fmtDate(order.entryDate)}
                            </div>
                        </div>

                        {/* Timeline de progresso */}
                        {order.status !== 'cancelada' && pub.showTimeline && (
                            <div style={{ background: '#16161a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Progresso</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                    {ALL_STEPS.map((step, i) => {
                                        const s = STATUS[step];
                                        const done = i < currentStep;
                                        const active = i === currentStep;
                                        const future = i > currentStep;
                                        return (
                                            <div key={step} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: done ? s.color : active ? s.color : 'rgba(255,255,255,0.08)', border: `2px solid ${active ? s.color : done ? s.color : 'transparent'}`, boxShadow: active ? `0 0 0 3px ${s.color}30` : 'none', transition: 'all 0.3s' }}>
                                                        {done ? <CheckCircle size={12} color="#fff" /> : active ? <s.icon size={11} color="#fff" /> : null}
                                                    </div>
                                                    {i < ALL_STEPS.length - 1 && (
                                                        <div style={{ width: '2px', height: '24px', background: done ? s.color : 'rgba(255,255,255,0.06)', margin: '2px 0' }} />
                                                    )}
                                                </div>
                                                <div style={{ paddingBottom: i < ALL_STEPS.length - 1 ? '4px' : '0', paddingTop: '3px' }}>
                                                    <p style={{ fontSize: '13px', fontWeight: active ? 700 : 400, color: future ? 'rgba(255,255,255,0.25)' : active ? '#fff' : 'rgba(255,255,255,0.6)', margin: 0 }}>
                                                        {s.label}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Diagnóstico / orçamento */}
                        {(order.diagnosis || (pub.showPrice && displayValue > 0)) && (
                            <div style={{ background: '#16161a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Diagnóstico</p>
                                {order.diagnosis && <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', margin: '0 0 12px', lineHeight: 1.6 }}>{order.diagnosis}</p>}
                                {pub.showPrice && displayValue > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Valor do Serviço</span>
                                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#22c55e' }}>{fmtCurrency(displayValue)}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* APROVAÇÃO DE ORÇAMENTO */}
                        {order.showBudget && !approvalDone && (
                            <div style={{ background: '#16161a', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '16px', padding: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <AlertCircle size={18} color="#f59e0b" />
                                    <p style={{ fontSize: '15px', fontWeight: 700, color: '#f59e0b', margin: 0 }}>Aprovação Necessária</p>
                                </div>
                                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: '0 0 16px', lineHeight: 1.6 }}>
                                    O diagnóstico foi concluído. Deseja aprovar o serviço pelo valor de <strong style={{ color: '#22c55e' }}>{fmtCurrency(displayValue)}</strong>?
                                </p>

                                {!showApprovalForm ? (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => setShowApprovalForm(true)} style={{ flex: 1, padding: '13px', borderRadius: '12px', background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <ThumbsUp size={16} /> Aprovar
                                        </button>
                                        <button onClick={() => setShowApprovalForm(true)} style={{ flex: 1, padding: '13px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <ThumbsDown size={16} /> Rejeitar
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <textarea
                                            placeholder="Observação (opcional)..."
                                            value={clientNote} onChange={e => setClientNote(e.target.value)}
                                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', resize: 'vertical', minHeight: '72px', outline: 'none', boxSizing: 'border-box' }}
                                        />
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => handleApproval(true)} disabled={approving} style={{ flex: 1, padding: '13px', borderRadius: '12px', background: '#22c55e', color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: approving ? 0.7 : 1 }}>
                                                <ThumbsUp size={16} /> {approving ? 'Aguarde...' : 'Confirmar Aprovação'}
                                            </button>
                                            <button onClick={() => handleApproval(false)} disabled={approving} style={{ flex: 1, padding: '13px', borderRadius: '12px', background: '#ef4444', color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: approving ? 0.7 : 1 }}>
                                                <ThumbsDown size={16} /> {approving ? 'Aguarde...' : 'Rejeitar'}
                                            </button>
                                        </div>
                                        <button onClick={() => setShowApprovalForm(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Resultado da aprovação */}
                        {approvalDone && (
                            <div style={{ background: approvalDone.approved ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${approvalDone.approved ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.25)'}`, borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
                                {approvalDone.approved ? <ThumbsUp size={28} color="#22c55e" style={{ marginBottom: '8px' }} /> : <ThumbsDown size={28} color="#ef4444" style={{ marginBottom: '8px' }} />}
                                <p style={{ fontSize: '15px', fontWeight: 700, color: approvalDone.approved ? '#22c55e' : '#ef4444', margin: '0 0 6px' }}>
                                    {approvalDone.approved ? 'Aprovado!' : 'Rejeitado'}
                                </p>
                                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>{approvalDone.message}</p>
                            </div>
                        )}

                        {/* WhatsApp */}
                        {order.shopPhone && (
                            <a
                                href={`https://wa.me/${order.shopPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Estou acompanhando minha OS #${order.protocol}.`)}`}
                                target="_blank" rel="noopener noreferrer"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px', borderRadius: '14px', background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.25)', color: '#25d366', textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}
                            >
                                <MessageCircle size={18} /> Falar com a Assistência
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
