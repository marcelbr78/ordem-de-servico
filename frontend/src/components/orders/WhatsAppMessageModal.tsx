import React, { useState, useEffect } from 'react';
import {
    X, Send, MessageCircle, Edit3, RefreshCw,
    CheckCircle, ChevronDown, ChevronUp, Smartphone,
} from 'lucide-react';

// ── Templates por status ───────────────────────────────────────
const TEMPLATES: Record<string, { label: string; emoji: string; body: string }[]> = {
    default: [
        {
            label: 'Padrão',
            emoji: '📋',
            body: 'Olá {nome}, informamos que a OS #{protocolo} ({equipamento}) foi atualizada para: *{status}*.\n\n{observacao}\n\n🔗 Acompanhe: {link}',
        },
        {
            label: 'Curto',
            emoji: '💬',
            body: 'Olá {nome}! Sua OS #{protocolo} agora está: *{status}*. {link}',
        },
    ],
    em_diagnostico: [
        {
            label: 'Padrão',
            emoji: '🔍',
            body: 'Olá {nome}! Estamos analisando seu {equipamento}.\n\nAssim que o diagnóstico for concluído, te avisaremos aqui. 🔧\n\n📋 OS #{protocolo}\n🔗 {link}',
        },
    ],
    aguardando_aprovacao: [
        {
            label: 'Orçamento',
            emoji: '💬',
            body: 'Olá {nome}! O diagnóstico do seu {equipamento} foi concluído.\n\n💰 *Valor do serviço:* {valor}\n\n📋 Acesse o link para ver o orçamento completo e aprovar:\n{link}\n\n_Aguardamos sua resposta para iniciar o reparo!_',
        },
        {
            label: 'Curto',
            emoji: '⚡',
            body: 'Olá {nome}, o orçamento da OS #{protocolo} está pronto! Valor: *{valor}*. Acesse para aprovar: {link}',
        },
    ],
    em_reparo: [
        {
            label: 'Padrão',
            emoji: '🔧',
            body: 'Olá {nome}! Boa notícia: seu {equipamento} já está em reparo.\n\nTe avisaremos assim que estiver pronto! 🙌\n\n📋 OS #{protocolo} | 🔗 {link}',
        },
    ],
    finalizada: [
        {
            label: 'Pronto para retirada',
            emoji: '✅',
            body: 'Olá {nome}, seu {equipamento} está *pronto para retirada*! 🎉\n\n💰 *Total: {valor}*\n\nPasse em nossa loja no horário de atendimento.\n\n📋 OS #{protocolo} | 🔗 {link}',
        },
        {
            label: 'Curto',
            emoji: '⚡',
            body: 'Olá {nome}! {equipamento} pronto! ✅ Valor: {valor}. Pode buscar! OS #{protocolo}',
        },
    ],
    entregue: [
        {
            label: 'Pós-entrega',
            emoji: '🎉',
            body: 'Olá {nome}, obrigado por confiar em nossos serviços! 🙏\n\nSeu {equipamento} foi entregue. Qualquer dúvida ou problema dentro da garantia, estamos à disposição!\n\n_Avaliação: Como foi o atendimento?_ ⭐',
        },
    ],
    aguardando_peca: [
        {
            label: 'Padrão',
            emoji: '📦',
            body: 'Olá {nome}, estamos aguardando a chegada das peças para o seu {equipamento}.\n\nAssim que chegar, iniciaremos o reparo imediatamente! ⚡\n\n📋 OS #{protocolo} | 🔗 {link}',
        },
    ],
};

function getTemplates(status: string) {
    return TEMPLATES[status] || TEMPLATES.default;
}

// ── Substitui variáveis na mensagem ───────────────────────────
function applyVars(template: string, vars: Record<string, string>) {
    return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] || `{${k}}`);
}

// ── Renderiza preview estilo WhatsApp ─────────────────────────
const WhatsAppBubble: React.FC<{ text: string; senderName: string }> = ({ text, senderName }) => {
    const lines = text.split('\n');
    const rendered = lines.map((line, i) => {
        // Bold com *texto*
        const parts = line.split(/(\*[^*]+\*)/g).map((p, j) =>
            p.startsWith('*') && p.endsWith('*')
                ? <strong key={j} style={{ fontWeight: 700 }}>{p.slice(1, -1)}</strong>
                : <span key={j}>{p}</span>
        );
        // Itálico com _texto_
        return <div key={i} style={{ lineHeight: 1.5 }}>{parts}</div>;
    });

    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return (
        <div style={{ background: 'rgba(37,211,102,0.12)', borderRadius: '14px 14px 4px 14px', padding: '10px 14px', maxWidth: '340px', marginLeft: 'auto', position: 'relative', border: '1px solid rgba(37,211,102,0.15)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#25d366', marginBottom: '4px' }}>{senderName}</div>
            <div style={{ fontSize: '14px', color: '#fff', lineHeight: 1.5 }}>{rendered}</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '5px', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                {now}
                <svg width="14" height="10" viewBox="0 0 14 10" fill="#25d366"><path d="M1 5l3 3 9-7M5 8l3-3"/></svg>
            </div>
        </div>
    );
};

// ── Props ──────────────────────────────────────────────────────
interface Props {
    open: boolean;
    onClose: () => void;
    onSend: (message: string) => Promise<void>;
    order: any;
    targetStatus: string;
    statusLabel: string;
    totalValue: number;
    sending: boolean;
    companyName?: string;
    statusUrl?: string;
}

export const WhatsAppMessageModal: React.FC<Props> = ({
    open, onClose, onSend, order, targetStatus, statusLabel, totalValue, sending, companyName, statusUrl,
}) => {
    const [selectedTpl, setSelectedTpl] = useState(0);
    const [message, setMessage] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);

    const templates = getTemplates(targetStatus);
    const clientName = order?.client?.nome?.split(' ')[0] || 'Cliente';
    const eq = order?.equipments?.[0];
    const equipment = eq ? `${eq.brand} ${eq.model}` : 'equipamento';
    const fmtVal = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

    const vars: Record<string, string> = {
        nome: clientName,
        protocolo: order?.protocol || '',
        equipamento: equipment,
        status: statusLabel,
        valor: fmtVal(totalValue),
        link: statusUrl || '',
        observacao: '',
        empresa: companyName || 'nossa loja',
    };

    useEffect(() => {
        if (open && templates[selectedTpl]) {
            setMessage(applyVars(templates[selectedTpl].body, vars));
            setIsEditing(false);
        }
    }, [open, selectedTpl, targetStatus]);

    if (!open) return null;

    const clientPhone = order?.client?.contatos?.find((c: any) => c.principal)?.numero
        || order?.client?.contatos?.[0]?.numero || '';

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
            <div style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', width: '100%', maxWidth: '480px', maxHeight: '92dvh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

                {/* Header */}
                <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '34px', height: '34px', background: 'rgba(37,211,102,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MessageCircle size={18} color="#25d366" />
                        </div>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>Mensagem WhatsApp</div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Smartphone size={10} /> {clientPhone || 'Sem telefone'}
                                <span style={{ marginLeft: '6px', padding: '1px 6px', borderRadius: '20px', background: 'rgba(37,211,102,0.12)', color: '#25d366', fontWeight: 600 }}>{statusLabel}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', borderRadius: '8px', padding: '7px', cursor: 'pointer', display: 'flex' }}>
                        <X size={16} />
                    </button>
                </div>

                {/* Seletor de template */}
                <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                    <button onClick={() => setShowTemplates(s => !s)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '9px 14px', cursor: 'pointer', color: '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                            <span style={{ fontSize: '16px' }}>{templates[selectedTpl]?.emoji}</span>
                            Template: <strong>{templates[selectedTpl]?.label}</strong>
                        </div>
                        {showTemplates ? <ChevronUp size={14} color="rgba(255,255,255,0.4)" /> : <ChevronDown size={14} color="rgba(255,255,255,0.4)" />}
                    </button>

                    {showTemplates && (
                        <div style={{ marginTop: '6px', background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                            {templates.map((t, i) => (
                                <button key={i} onClick={() => { setSelectedTpl(i); setShowTemplates(false); setIsEditing(false); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px', background: i === selectedTpl ? 'rgba(37,211,102,0.1)' : 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '13px', borderBottom: i < templates.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', textAlign: 'left' }}>
                                    <span>{t.emoji}</span>
                                    <span style={{ flex: 1 }}>{t.label}</span>
                                    {i === selectedTpl && <CheckCircle size={13} color="#25d366" />}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Variáveis disponíveis */}
                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {Object.entries(vars).filter(([, v]) => v).map(([k, v]) => (
                            <span key={k} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '20px', background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)', cursor: 'pointer', fontFamily: 'monospace' }}
                                onClick={() => { setMessage(m => m + `{${k}}`); setIsEditing(true); }}
                                title={`Valor: ${v}`}>
                                {`{${k}}`}
                            </span>
                        ))}
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', paddingTop: '3px' }}>← clique para inserir</span>
                    </div>
                </div>

                {/* Preview / Editor */}
                <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {/* Tabs Preview / Editar */}
                    <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '3px' }}>
                        <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: 'none', background: !isEditing ? 'rgba(37,211,102,0.2)' : 'transparent', color: !isEditing ? '#25d366' : 'rgba(255,255,255,0.45)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                            👁 Prévia
                        </button>
                        <button onClick={() => setIsEditing(true)} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: 'none', background: isEditing ? 'rgba(99,102,241,0.2)' : 'transparent', color: isEditing ? '#a5b4fc' : 'rgba(255,255,255,0.45)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <Edit3 size={11} /> Editar
                        </button>
                    </div>

                    {/* Preview WhatsApp */}
                    {!isEditing && (
                        <div style={{ background: '#111827', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                            {/* Header fake WA */}
                            <div style={{ background: '#1a1a2a', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(37,211,102,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#25d366' }}>
                                    {clientName.charAt(0)}
                                </div>
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{order?.client?.nome || 'Cliente'}</div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{clientPhone}</div>
                                </div>
                            </div>
                            {/* Bolha da mensagem */}
                            <div style={{ padding: '16px', background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Crect width=\'40\' height=\'40\' fill=\'%23111827\'/%3E%3C/svg%3E")' }}>
                                <WhatsAppBubble text={message} senderName={companyName || 'Assistência'} />
                            </div>
                        </div>
                    )}

                    {/* Editor */}
                    {isEditing && (
                        <textarea value={message} onChange={e => setMessage(e.target.value)} style={{
                            width: '100%', minHeight: '160px', padding: '14px', borderRadius: '10px',
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.3)',
                            color: '#fff', fontSize: '14px', lineHeight: 1.6, outline: 'none',
                            resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
                        }} />
                    )}

                    {/* Contagem de caracteres */}
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textAlign: 'right', marginTop: '-8px' }}>
                        {message.length} caracteres
                    </div>
                </div>

                {/* Footer com botões */}
                <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '10px', flexShrink: 0 }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
                        Cancelar
                    </button>
                    <button onClick={() => onSend(message)} disabled={sending || !message.trim()} style={{
                        flex: 2, padding: '12px', borderRadius: '10px', border: 'none',
                        background: sending || !message.trim() ? 'rgba(37,211,102,0.3)' : '#25d366',
                        color: '#fff', fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer',
                        fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        minHeight: '48px',
                    }}>
                        {sending ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Enviando...</> : <><Send size={15} /> Enviar WhatsApp</>}
                    </button>
                </div>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
};
