import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import {
    MessageSquare, Plus, RefreshCw, ChevronRight, Clock,
    CheckCircle, AlertCircle, AlertTriangle, XCircle, Send,
    X, Tag, Building2, Calendar, User,
} from 'lucide-react';

interface TicketMessage { id: string; content: string; isStaff: boolean; authorName?: string; createdAt: string; }
interface Ticket {
    id: string; title: string; description: string;
    status: string; priority: string; category: string;
    tenantId?: string; tenant?: { name?: string; storeName?: string };
    assignedToName?: string; createdAt: string; updatedAt: string;
    messages: TicketMessage[];
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    open:        { label: 'Aberto',       color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  icon: MessageSquare },
    in_progress: { label: 'Em Andamento', color: '#a855f7', bg: 'rgba(168,85,247,0.12)', icon: RefreshCw },
    waiting:     { label: 'Aguardando',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: Clock },
    resolved:    { label: 'Resolvido',    color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  icon: CheckCircle },
    closed:      { label: 'Fechado',      color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: XCircle },
};
const PRIORITY_CFG: Record<string, { label: string; color: string }> = {
    low:      { label: 'Baixa',   color: '#22c55e' },
    medium:   { label: 'Média',   color: '#f59e0b' },
    high:     { label: 'Alta',    color: '#ef4444' },
    critical: { label: 'Crítico', color: '#7f1d1d' },
};
const CATEGORY_LABELS: Record<string, string> = {
    billing: 'Faturamento', technical: 'Técnico', feature: 'Funcionalidade',
    bug: 'Bug', onboarding: 'Onboarding', other: 'Outro',
};

const fmtDate = (d: string) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };

export const SupportPage: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selected, setSelected] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'medium', category: 'technical' });
    const [stats, setStats] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const load = async () => {
        setLoading(true);
        try {
            const [tRes, sRes] = await Promise.all([
                api.get('/admin/support/tickets', { params: { status: filterStatus || undefined } }),
                api.get('/admin/support/tickets/stats'),
            ]);
            setTickets(tRes.data.data || []);
            setStats(sRes.data);
        } catch {} finally { setLoading(false); }
    };

    useEffect(() => { load(); }, [filterStatus]);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [selected?.messages]);

    const handleReply = async () => {
        if (!reply.trim() || !selected) return;
        setSending(true);
        try {
            await api.post(`/admin/support/tickets/${selected.id}/messages`, { content: reply, isStaff: true });
            setReply('');
            const r = await api.get(`/admin/support/tickets/${selected.id}`);
            setSelected(r.data);
            load();
        } catch {} finally { setSending(false); }
    };

    const handleStatusChange = async (status: string) => {
        if (!selected) return;
        try {
            const r = await api.patch(`/admin/support/tickets/${selected.id}`, { status });
            setSelected(r.data);
            load();
        } catch {}
    };

    const handleCreateTicket = async () => {
        try {
            await api.post('/admin/support/tickets', newTicket);
            setShowNew(false);
            setNewTicket({ title: '', description: '', priority: 'medium', category: 'technical' });
            load();
        } catch {}
    };

    const openCount = tickets.filter(t => ['open','in_progress'].includes(t.status)).length;
    const criticalCount = tickets.filter(t => t.priority === 'critical' && t.status !== 'closed').length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageSquare size={18} color="#6366f1" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>Suporte</h1>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                            {openCount} abertos {criticalCount > 0 && <span style={{ color: '#ef4444' }}>· {criticalCount} críticos</span>}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={load} style={{ padding: '7px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex' }}>
                        <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                    </button>
                    <button onClick={() => setShowNew(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: '#6366f1', color: '#fff', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                        <Plus size={14} /> Novo Ticket
                    </button>
                </div>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

            {/* Stats rápidos */}
            {stats && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[
                        { key: '', label: 'Todos', count: tickets.length, color: '#94a3b8' },
                        { key: 'open', label: 'Abertos', count: tickets.filter(t=>t.status==='open').length, color: '#3b82f6' },
                        { key: 'in_progress', label: 'Em Andamento', count: tickets.filter(t=>t.status==='in_progress').length, color: '#a855f7' },
                        { key: 'waiting', label: 'Aguardando', count: tickets.filter(t=>t.status==='waiting').length, color: '#f59e0b' },
                        { key: 'resolved', label: 'Resolvidos', count: tickets.filter(t=>t.status==='resolved').length, color: '#22c55e' },
                    ].map(f => (
                        <button key={f.key} onClick={() => setFilterStatus(f.key)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', background: filterStatus === f.key ? `${f.color}18` : 'rgba(255,255,255,0.04)', border: `1px solid ${filterStatus === f.key ? f.color+'40' : 'rgba(255,255,255,0.08)'}`, color: filterStatus === f.key ? f.color : 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: f.color }}>{f.count}</span> {f.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Layout split */}
            <div style={{ display: 'flex', gap: '14px', flex: 1, minHeight: 0, overflow: 'hidden' }}>

                {/* Lista de tickets */}
                <div style={{ width: '340px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Carregando...
                        </div>
                    ) : tickets.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                            <MessageSquare size={28} style={{ opacity: 0.3, marginBottom: '8px' }} />
                            <br />Nenhum ticket encontrado
                        </div>
                    ) : tickets.map(t => {
                        const s = STATUS_CFG[t.status] || STATUS_CFG.open;
                        const p = PRIORITY_CFG[t.priority] || PRIORITY_CFG.medium;
                        const isSelected = selected?.id === t.id;
                        return (
                            <div key={t.id} onClick={() => setSelected(t)} style={{
                                padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                                background: isSelected ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${isSelected ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
                                borderLeft: `3px solid ${p.color}`,
                                transition: 'all 0.15s',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '5px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '20px', background: s.bg, color: s.color, flexShrink: 0 }}>{s.label}</span>
                                </div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Building2 size={9} />{t.tenant?.name || t.tenant?.storeName || t.tenantId?.slice(0,8) || 'Interno'}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Tag size={9} />{CATEGORY_LABELS[t.category] || t.category}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', marginLeft: 'auto' }}><Calendar size={9} />{fmtDate(t.createdAt)}</span>
                                </div>
                                {t.messages?.length > 0 && (
                                    <div style={{ marginTop: '5px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <MessageSquare size={9} /> {t.messages.length} mensagem(s)
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Detalhe do ticket */}
                {selected ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden' }}>
                        {/* Header do ticket */}
                        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexShrink: 0 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>{selected.title}</div>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: (STATUS_CFG[selected.status] || STATUS_CFG.open).bg, color: (STATUS_CFG[selected.status] || STATUS_CFG.open).color }}>
                                        {(STATUS_CFG[selected.status] || STATUS_CFG.open).label}
                                    </span>
                                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: `${(PRIORITY_CFG[selected.priority] || PRIORITY_CFG.medium).color}15`, color: (PRIORITY_CFG[selected.priority] || PRIORITY_CFG.medium).color }}>
                                        {(PRIORITY_CFG[selected.priority] || PRIORITY_CFG.medium).label}
                                    </span>
                                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                                        {CATEGORY_LABELS[selected.category] || selected.category}
                                    </span>
                                </div>
                            </div>
                            {/* Ações de status */}
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                {['in_progress','waiting','resolved','closed'].map(s => (
                                    <button key={s} onClick={() => handleStatusChange(s)} disabled={selected.status === s} style={{
                                        padding: '5px 10px', borderRadius: '7px', border: `1px solid ${(STATUS_CFG[s]||STATUS_CFG.open).color}30`,
                                        background: selected.status === s ? (STATUS_CFG[s]||STATUS_CFG.open).bg : 'transparent',
                                        color: (STATUS_CFG[s]||STATUS_CFG.open).color, fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                                        opacity: selected.status === s ? 1 : 0.7,
                                    }}>
                                        {(STATUS_CFG[s]||STATUS_CFG.open).label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Descrição inicial */}
                        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', flexShrink: 0 }}>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '5px', display: 'flex', gap: '10px' }}>
                                <span><Building2 size={10} style={{ display: 'inline', marginRight: '3px' }} />{selected.tenant?.name || selected.tenant?.storeName || 'Interno'}</span>
                                <span><Calendar size={10} style={{ display: 'inline', marginRight: '3px' }} />{fmtDate(selected.createdAt)}</span>
                            </div>
                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selected.description}</div>
                        </div>

                        {/* Mensagens */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {selected.messages?.map(msg => (
                                <div key={msg.id} style={{ display: 'flex', justifyContent: msg.isStaff ? 'flex-end' : 'flex-start' }}>
                                    <div style={{
                                        maxWidth: '80%', padding: '10px 14px', borderRadius: msg.isStaff ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                                        background: msg.isStaff ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.06)',
                                        border: `1px solid ${msg.isStaff ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)'}`,
                                    }}>
                                        <div style={{ fontSize: '10px', fontWeight: 700, color: msg.isStaff ? '#a5b4fc' : 'rgba(255,255,255,0.45)', marginBottom: '4px' }}>
                                            <User size={9} style={{ display: 'inline', marginRight: '3px' }} />{msg.authorName || (msg.isStaff ? 'Suporte' : 'Cliente')}
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#fff', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', textAlign: 'right' }}>{fmtDate(msg.createdAt)}</div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Responder */}
                        {!['resolved','closed'].includes(selected.status) && (
                            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '8px', flexShrink: 0 }}>
                                <textarea value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleReply(); }} placeholder="Responder... (Ctrl+Enter para enviar)" style={{ ...inp, flex: 1, resize: 'none', minHeight: '56px', fontSize: '13px' }} />
                                <button onClick={handleReply} disabled={sending || !reply.trim()} style={{ padding: '0 16px', borderRadius: '8px', background: sending || !reply.trim() ? 'rgba(99,102,241,0.3)' : '#6366f1', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, minWidth: '80px', justifyContent: 'center' }}>
                                    {sending ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                                    {!sending && 'Enviar'}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', flexDirection: 'column', gap: '10px' }}>
                        <MessageSquare size={36} style={{ opacity: 0.2 }} />
                        <span style={{ fontSize: '14px' }}>Selecione um ticket para ver os detalhes</span>
                    </div>
                )}
            </div>

            {/* Modal novo ticket */}
            {showNew && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
                    <div style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>Novo Ticket</h3>
                            <button onClick={() => setShowNew(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', borderRadius: '7px', padding: '6px', cursor: 'pointer', display: 'flex' }}><X size={15} /></button>
                        </div>
                        <div><label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '5px' }}>Título</label><input value={newTicket.title} onChange={e => setNewTicket(p => ({...p, title: e.target.value}))} style={inp} placeholder="Descreva o problema em uma linha" /></div>
                        <div><label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '5px' }}>Descrição</label><textarea value={newTicket.description} onChange={e => setNewTicket(p => ({...p, description: e.target.value}))} style={{ ...inp, minHeight: '100px', resize: 'vertical' }} placeholder="Detalhes do problema..." /></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div><label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '5px' }}>Prioridade</label>
                                <select value={newTicket.priority} onChange={e => setNewTicket(p => ({...p, priority: e.target.value}))} style={inp}>
                                    {Object.entries(PRIORITY_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                                </select>
                            </div>
                            <div><label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '5px' }}>Categoria</label>
                                <select value={newTicket.category} onChange={e => setNewTicket(p => ({...p, category: e.target.value}))} style={inp}>
                                    {Object.entries(CATEGORY_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setShowNew(false)} style={{ flex: 1, padding: '11px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                            <button onClick={handleCreateTicket} style={{ flex: 2, padding: '11px', borderRadius: '10px', background: '#6366f1', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Plus size={14} />Abrir Ticket</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
