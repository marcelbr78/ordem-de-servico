import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
    MessageCircle, Lock, RefreshCw, Send, Phone,
    CheckCheck, Check, AlertCircle, Smartphone,
} from 'lucide-react';

// ── Tipos ──────────────────────────────────────────────────────
interface ConvMessage {
    id: string;
    direction: 'outbound' | 'inbound';
    channel: 'whatsapp' | 'email' | 'system';
    content: string;
    senderName?: string;
    senderPhone?: string;
    delivered: boolean;
    read: boolean;
    createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────────
const fmtTime = (d: string) =>
    new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

const fmtDay = (d: string) => {
    const date = new Date(d);
    const today = new Date();
    const diff = Math.floor((today.getTime() - date.getTime()) / 86400000);
    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Ontem';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
};

// Renderiza *negrito* e _itálico_ estilo WhatsApp
const WaText: React.FC<{ text: string }> = ({ text }) => {
    const parts: React.ReactNode[] = [];
    let i = 0;
    const src = text || '';
    while (i < src.length) {
        if (src[i] === '*') {
            const end = src.indexOf('*', i + 1);
            if (end > i) {
                parts.push(<strong key={i} style={{ fontWeight: 700 }}>{src.slice(i + 1, end)}</strong>);
                i = end + 1; continue;
            }
        }
        if (src[i] === '_') {
            const end = src.indexOf('_', i + 1);
            if (end > i) {
                parts.push(<em key={i} style={{ fontStyle: 'italic' }}>{src.slice(i + 1, end)}</em>);
                i = end + 1; continue;
            }
        }
        // Newline
        if (src[i] === '\n') { parts.push(<br key={i} />); i++; continue; }
        // Texto normal
        let j = i + 1;
        while (j < src.length && src[j] !== '*' && src[j] !== '_' && src[j] !== '\n') j++;
        parts.push(<span key={i}>{src.slice(i, j)}</span>);
        i = j;
    }
    return <>{parts}</>;
};

// ── Componente principal ───────────────────────────────────────
interface Props { orderId: string; order: any; }

export const ConversationTab: React.FC<Props> = ({ orderId, order }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ConvMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [restricted, setRestricted] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const isAdmin = ['admin', 'super_admin'].includes(user?.role || '');

    const load = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const r = await api.get(`/orders/${orderId}/conversation`);
            if (r.data?.restricted) {
                setRestricted(true);
            } else {
                setMessages(r.data || []);
                setRestricted(false);
            }
        } catch { } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { load(); }, [orderId]);

    useEffect(() => {
        if (messages.length > 0) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Agrupar mensagens por dia
    const grouped: { day: string; msgs: ConvMessage[] }[] = [];
    messages.forEach(msg => {
        const day = fmtDay(msg.createdAt);
        const last = grouped[grouped.length - 1];
        if (last && last.day === day) last.msgs.push(msg);
        else grouped.push({ day, msgs: [msg] });
    });

    const clientName = order?.client?.nome?.split(' ')[0] || 'Cliente';
    const clientPhone = order?.client?.contatos?.find((c: any) => c.principal)?.numero
        || order?.client?.contatos?.[0]?.numero || '';

    // ── Acesso restrito ────────────────────────────────────────
    if (!isAdmin || restricted) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: '14px', textAlign: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Lock size={24} color="#ef4444" />
                </div>
                <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>Acesso Restrito</div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '300px' }}>
                        O histórico de conversas só pode ser visualizado por administradores para fins de auditoria.
                    </div>
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Lock size={11} /> Visível apenas para: Administrador, Super Admin
                </div>
            </div>
        );
    }

    // ── Loading ────────────────────────────────────────────────
    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', color: 'rgba(255,255,255,0.4)', gap: '10px' }}>
            <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
            Carregando conversa...
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '700px', margin: '0 auto' }}>

            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', padding: '12px 16px', background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.15)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(37,211,102,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: '#25d366', flexShrink: 0 }}>
                        {clientName.charAt(0)}
                    </div>
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{order?.client?.nome || '—'}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={10} /> {clientPhone || 'Sem telefone'}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{messages.length}</div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>mensagens</div>
                    </div>
                    <button onClick={() => load(true)} style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: refreshing ? '#25d366' : 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex' }}>
                        <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                    </button>
                </div>
            </div>

            {/* Aviso de auditoria */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '8px', marginBottom: '14px', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                <Lock size={11} color="rgba(99,102,241,0.6)" />
                Histórico de auditoria — visível apenas para administradores. Inclui todas as mensagens enviadas e recebidas desta OS.
            </div>

            {/* Mensagens */}
            {messages.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', gap: '12px', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
                    <MessageCircle size={36} style={{ opacity: 0.3 }} />
                    <div style={{ fontSize: '14px' }}>Nenhuma mensagem registrada ainda</div>
                    <div style={{ fontSize: '12px', lineHeight: 1.6, maxWidth: '280px' }}>
                        As mensagens enviadas via WhatsApp são gravadas automaticamente. Respostas do cliente também são capturadas.
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0', flex: 1, overflowY: 'auto', padding: '4px 0' }}>
                    {grouped.map(({ day, msgs }) => (
                        <div key={day}>
                            {/* Separador de dia */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0 10px' }}>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', padding: '2px 10px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }}>{day}</span>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                            </div>

                            {msgs.map((msg, i) => {
                                const isOut = msg.direction === 'outbound';
                                const isSys = msg.channel === 'system';
                                const prevMsg = i > 0 ? msgs[i - 1] : null;
                                const sameDir = prevMsg?.direction === msg.direction;
                                const gap = sameDir ? '3px' : '10px';

                                // Mensagem de sistema — centralizada
                                if (isSys) return (
                                    <div key={msg.id} style={{ textAlign: 'center', margin: '6px 0' }}>
                                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.04)', padding: '3px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            <Smartphone size={9} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                                            {msg.content.length > 80 ? msg.content.slice(0, 80) + '…' : msg.content}
                                        </span>
                                    </div>
                                );

                                return (
                                    <div key={msg.id} style={{ display: 'flex', justifyContent: isOut ? 'flex-end' : 'flex-start', marginBottom: gap, paddingLeft: isOut ? '48px' : '0', paddingRight: isOut ? '0' : '48px' }}>
                                        {/* Avatar cliente (inbound) */}
                                        {!isOut && !sameDir && (
                                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', flexShrink: 0, marginRight: '8px', marginTop: '2px' }}>
                                                {clientName.charAt(0)}
                                            </div>
                                        )}
                                        {!isOut && sameDir && <div style={{ width: '36px', flexShrink: 0 }} />}

                                        {/* Bolha */}
                                        <div style={{
                                            maxWidth: '85%',
                                            background: isOut
                                                ? 'rgba(37,211,102,0.13)'
                                                : 'rgba(255,255,255,0.07)',
                                            border: isOut
                                                ? '1px solid rgba(37,211,102,0.2)'
                                                : '1px solid rgba(255,255,255,0.08)',
                                            borderRadius: isOut
                                                ? (sameDir ? '14px 4px 4px 14px' : '14px 4px 14px 14px')
                                                : (sameDir ? '4px 14px 14px 4px' : '4px 14px 14px 14px'),
                                            padding: '9px 12px',
                                        }}>
                                            {/* Remetente (primeira msg do grupo) */}
                                            {!sameDir && (
                                                <div style={{ fontSize: '10px', fontWeight: 700, marginBottom: '4px', color: isOut ? '#25d366' : 'rgba(255,255,255,0.5)' }}>
                                                    {isOut ? (msg.senderName || 'Sistema') : clientName}
                                                </div>
                                            )}
                                            {/* Conteúdo */}
                                            <div style={{ fontSize: '13px', color: '#fff', lineHeight: 1.55, wordBreak: 'break-word' }}>
                                                <WaText text={msg.content} />
                                            </div>
                                            {/* Hora + status */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '4px' }}>
                                                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                                                    {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {isOut && (
                                                    msg.read
                                                        ? <CheckCheck size={12} color="#25d366" />
                                                        : msg.delivered
                                                            ? <CheckCheck size={12} color="rgba(255,255,255,0.3)" />
                                                            : <Check size={12} color="rgba(255,255,255,0.25)" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>
            )}

            {/* Footer - legenda */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', marginTop: '10px', display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(37,211,102,0.3)' }} /> Loja → Cliente
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(255,255,255,0.1)' }} /> Cliente → Loja
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                    <CheckCheck size={11} color="#25d366" /> Lido
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                    <CheckCheck size={11} color="rgba(255,255,255,0.3)" /> Entregue
                </span>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
};
