import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import {
    FileText, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle,
    Download, X, Receipt, Search, Filter, TrendingUp, Send,
    Copy, ExternalLink, AlertTriangle, ChevronDown, ChevronUp,
    Printer, Mail, Edit3, Ban, RotateCcw, Shield, Info,
    DollarSign, Package, Wrench,
} from 'lucide-react';

// ── Tipos ───────────────────────────────────────────────────────
interface FiscalNota {
    id: string;
    tipo: 'produto' | 'servico';
    status: 'pendente' | 'aguardando' | 'autorizada' | 'rejeitada' | 'cancelada';
    protocolo?: string;
    chaveAcesso?: string;
    numero?: number;
    serie?: string;
    nomeDestinatario?: string;
    cpfCnpjDestinatario?: string;
    valorTotal: number;
    ambiente: number;
    mensagemSefaz?: string;
    motivoRejeicao?: string;
    cStat?: number;
    erroDetalhes?: string;
    orderId?: string;
    createdAt: string;
    updatedAt: string;
}

// ── Config de status ────────────────────────────────────────────
const STATUS: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    pendente:   { label: 'Pendente',   color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: Clock },
    aguardando: { label: 'Aguardando', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: RefreshCw },
    autorizada: { label: 'Autorizada', color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   icon: CheckCircle },
    rejeitada:  { label: 'Rejeitada',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: XCircle },
    cancelada:  { label: 'Cancelada',  color: '#6b7280', bg: 'rgba(107,114,128,0.1)',  icon: Ban },
};

const fmtR$ = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const fmtDate = (d: string) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
const fmtKey = (key?: string) => key ? `${key.slice(0, 4)} ${key.slice(4, 8)} ${key.slice(8, 12)} ... ${key.slice(-8)}` : '—';

const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };

// ── Painel de métricas ─────────────────────────────────────────
const MetricCard: React.FC<{ label: string; value: string | number; color: string; sub?: string }> = ({ label, value, color, sub }) => (
    <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}20`, borderRadius: '12px' }}>
        <div style={{ fontSize: '22px', fontWeight: 800, color, letterSpacing: '-0.5px' }}>{value}</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>{label}</div>
        {sub && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>{sub}</div>}
    </div>
);

// ── Modal de detalhe da nota ───────────────────────────────────
const NotaDetail: React.FC<{
    nota: FiscalNota;
    onClose: () => void;
    onRefresh: () => void;
}> = ({ nota, onClose, onRefresh }) => {
    const cfg = STATUS[nota.status] || STATUS.pendente;
    const Icon = cfg.icon;
    const [cancelJust, setCancelJust] = useState('');
    const [showCancelForm, setShowCancelForm] = useState(false);
    const [ccTexto, setCcTexto] = useState('');
    const [showCCForm, setShowCCForm] = useState(false);
    const [emailDest, setEmailDest] = useState('');
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [loading, setLoading] = useState<string | null>(null);
    const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

    const showMsg = (type: 'ok' | 'err', text: string) => {
        setMsg({ type, text });
        setTimeout(() => setMsg(null), 4000);
    };

    const handleDownload = async () => {
        setLoading('danfe');
        try {
            const token = localStorage.getItem('@OS:token');
            const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3005';
            const res = await fetch(`${apiUrl}/fiscal/nfe/${nota.id}/danfe`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('DANFE indisponível');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `DANFE_${nota.numero || nota.id}.pdf`; a.click();
            URL.revokeObjectURL(url);
        } catch (e: any) { showMsg('err', 'Erro ao baixar DANFE: ' + e.message); }
        finally { setLoading(null); }
    };

    const handleConsultar = async () => {
        setLoading('consultar');
        try {
            const r = await api.get(`/fiscal/nfe/${nota.id}/consultar`);
            showMsg('ok', `SEFAZ: ${r.data?.nota?.mensagemSefaz || 'Consultado com sucesso'}`);
            onRefresh();
        } catch { showMsg('err', 'Erro ao consultar SEFAZ'); }
        finally { setLoading(null); }
    };

    const handleCancelar = async () => {
        if (cancelJust.trim().length < 15) return;
        setLoading('cancelar');
        try {
            await api.post(`/fiscal/nfe/${nota.id}/cancelar`, { justificativa: cancelJust });
            showMsg('ok', 'Nota cancelada com sucesso');
            onRefresh(); setShowCancelForm(false); setCancelJust('');
        } catch (e: any) { showMsg('err', e?.response?.data?.error || 'Erro ao cancelar'); }
        finally { setLoading(null); }
    };

    const handleCartaCorrecao = async () => {
        if (ccTexto.trim().length < 15) return;
        setLoading('cc');
        try {
            await api.post(`/fiscal/nfe/${nota.id}/carta-correcao`, { correcao: ccTexto });
            showMsg('ok', 'Carta de correção emitida!');
            setShowCCForm(false); setCcTexto('');
        } catch (e: any) { showMsg('err', e?.response?.data?.error || 'Erro ao emitir CC'); }
        finally { setLoading(null); }
    };

    const handleEnviarEmail = async () => {
        if (!emailDest) return;
        setLoading('email');
        try {
            await api.post(`/fiscal/nfe/${nota.id}/enviar-email`, { email: emailDest });
            showMsg('ok', `DANFE enviado para ${emailDest}`);
            setShowEmailForm(false); setEmailDest('');
        } catch (e: any) { showMsg('err', e?.response?.data?.error || 'Erro ao enviar e-mail'); }
        finally { setLoading(null); }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showMsg('ok', 'Copiado!');
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
            <div style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '680px', maxHeight: '92dvh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

                {/* Header */}
                <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, padding: '2px 10px', borderRadius: '6px', background: nota.tipo === 'produto' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)', color: nota.tipo === 'produto' ? '#60a5fa' : '#a78bfa' }}>
                                {nota.tipo === 'produto' ? 'NF-e' : 'NFS-e'}
                            </span>
                            {nota.numero && <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>#{nota.numero}</span>}
                            {nota.serie && <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Série {nota.serie}</span>}
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, padding: '2px 9px', borderRadius: '20px', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}25` }}>
                                <Icon size={10} /> {cfg.label}
                            </span>
                            {nota.ambiente === 2 && <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '20px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>HOMOLOGAÇÃO</span>}
                        </div>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                            {nota.nomeDestinatario && <span>{nota.nomeDestinatario}</span>}
                            {nota.cpfCnpjDestinatario && <span style={{ fontFamily: 'monospace', marginLeft: '8px', color: 'rgba(255,255,255,0.35)' }}>{nota.cpfCnpjDestinatario}</span>}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', borderRadius: '8px', padding: '7px', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
                        <X size={16} />
                    </button>
                </div>

                <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>

                    {/* Mensagens feedback */}
                    {msg && (
                        <div style={{ padding: '10px 14px', borderRadius: '8px', background: msg.type === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${msg.type === 'ok' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`, color: msg.type === 'ok' ? '#22c55e' : '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                            {msg.type === 'ok' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                            {msg.text}
                        </div>
                    )}

                    {/* Dados principais */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                        {[
                            { l: 'Valor Total', v: fmtR$(nota.valorTotal), color: '#22c55e' },
                            { l: 'Emissão', v: fmtDate(nota.createdAt), color: undefined },
                            { l: 'Atualização', v: fmtDate(nota.updatedAt), color: undefined },
                            nota.protocolo ? { l: 'Protocolo', v: nota.protocolo, color: undefined } : null,
                            nota.cStat ? { l: 'cStat SEFAZ', v: String(nota.cStat), color: undefined } : null,
                        ].filter(Boolean).map((item: any) => (
                            <div key={item.l} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>{item.l}</div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: item.color || '#fff' }}>{item.v}</div>
                            </div>
                        ))}
                    </div>

                    {/* Chave de acesso */}
                    {nota.chaveAcesso && (
                        <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Chave de Acesso</span>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button onClick={() => copyToClipboard(nota.chaveAcesso!)} title="Copiar chave" style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                                        <Copy size={11} /> Copiar
                                    </button>
                                    <a href={`https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConsulta=completa&chave=${nota.chaveAcesso}`} target="_blank" rel="noopener noreferrer" title="Consultar no portal SEFAZ" style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', textDecoration: 'none' }}>
                                        <ExternalLink size={11} /> SEFAZ
                                    </a>
                                </div>
                            </div>
                            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#94a3b8', wordBreak: 'break-all', lineHeight: 1.6 }}>
                                {nota.chaveAcesso.match(/.{4}/g)?.join(' ')}
                            </div>
                        </div>
                    )}

                    {/* Mensagens SEFAZ */}
                    {nota.mensagemSefaz && (
                        <div style={{ padding: '10px 14px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '9px', display: 'flex', gap: '8px' }}>
                            <CheckCircle size={14} color="#22c55e" style={{ flexShrink: 0, marginTop: 1 }} />
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#22c55e', marginBottom: '2px' }}>Mensagem SEFAZ</div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>{nota.mensagemSefaz}</div>
                            </div>
                        </div>
                    )}

                    {(nota.motivoRejeicao || nota.erroDetalhes) && (
                        <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '9px', display: 'flex', gap: '8px' }}>
                            <AlertTriangle size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', marginBottom: '2px' }}>Motivo da Rejeição</div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', whiteSpace: 'pre-wrap' }}>{nota.motivoRejeicao || nota.erroDetalhes}</div>
                            </div>
                        </div>
                    )}

                    {/* Ações principais */}
                    <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                        {/* Download DANFE */}
                        {nota.status === 'autorizada' && nota.tipo === 'produto' && (
                            <button onClick={handleDownload} disabled={loading === 'danfe'} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '9px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#3b82f6', fontWeight: 600, fontSize: '13px', cursor: 'pointer', minHeight: '40px' }}>
                                {loading === 'danfe' ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={13} />}
                                DANFE (PDF)
                            </button>
                        )}

                        {/* Imprimir */}
                        {nota.status === 'autorizada' && nota.tipo === 'produto' && (
                            <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '9px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', minHeight: '40px' }}>
                                <Printer size={13} /> Imprimir
                            </button>
                        )}

                        {/* Enviar por e-mail */}
                        {nota.status === 'autorizada' && nota.tipo === 'produto' && (
                            <button onClick={() => setShowEmailForm(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '9px', background: showEmailForm ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${showEmailForm ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.1)'}`, color: showEmailForm ? '#60a5fa' : 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', minHeight: '40px' }}>
                                <Mail size={13} /> Enviar por E-mail
                            </button>
                        )}

                        {/* Carta de correção */}
                        {nota.status === 'autorizada' && nota.tipo === 'produto' && (
                            <button onClick={() => setShowCCForm(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '9px', background: showCCForm ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${showCCForm ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`, color: showCCForm ? '#f59e0b' : 'rgba(255,255,255,0.55)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', minHeight: '40px' }}>
                                <Edit3 size={13} /> Carta de Correção
                            </button>
                        )}

                        {/* Consultar SEFAZ */}
                        {nota.status === 'aguardando' && (
                            <button onClick={handleConsultar} disabled={loading === 'consultar'} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '9px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b', fontWeight: 600, fontSize: '13px', cursor: 'pointer', minHeight: '40px' }}>
                                {loading === 'consultar' ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Shield size={13} />}
                                Consultar SEFAZ
                            </button>
                        )}

                        {/* Cancelar */}
                        {nota.status === 'autorizada' && !showCancelForm && (
                            <button onClick={() => setShowCancelForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '9px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontWeight: 600, fontSize: '13px', cursor: 'pointer', minHeight: '40px' }}>
                                <Ban size={13} /> Cancelar Nota
                            </button>
                        )}
                    </div>

                    {/* Form enviar e-mail */}
                    {showEmailForm && (
                        <div style={{ padding: '14px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Mail size={14} /> Enviar DANFE por E-mail
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="email" value={emailDest} onChange={e => setEmailDest(e.target.value)} placeholder="destinatario@email.com" style={{ ...inp, flex: 1 }} />
                                <button onClick={handleEnviarEmail} disabled={!emailDest || loading === 'email'} style={{ padding: '10px 16px', borderRadius: '8px', background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap', minWidth: '90px' }}>
                                    {loading === 'email' ? '...' : 'Enviar'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Form carta de correção */}
                    {showCCForm && (
                        <div style={{ padding: '14px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Edit3 size={14} /> Carta de Correção Eletrônica (CC-e)
                            </div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '7px' }}>
                                <strong style={{ color: '#f59e0b' }}>Atenção:</strong> A CC-e não pode alterar destinatário, valor, CFOP ou dados de produtos. Só pode corrigir dados auxiliares como endereço e condições de pagamento.
                            </div>
                            <textarea value={ccTexto} onChange={e => setCcTexto(e.target.value)} placeholder="Descreva a correção (mín. 15 caracteres)..." style={{ ...inp, minHeight: '90px', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} />
                            <div style={{ fontSize: '11px', color: ccTexto.length < 15 ? '#ef4444' : 'rgba(255,255,255,0.3)' }}>{ccTexto.length}/1000 caracteres (mín. 15)</div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => { setShowCCForm(false); setCcTexto(''); }} style={{ padding: '9px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>Cancelar</button>
                                <button onClick={handleCartaCorrecao} disabled={ccTexto.trim().length < 15 || loading === 'cc'} style={{ padding: '9px 16px', borderRadius: '8px', background: ccTexto.trim().length >= 15 ? '#f59e0b' : 'rgba(255,255,255,0.05)', color: ccTexto.trim().length >= 15 ? '#000' : 'rgba(255,255,255,0.3)', border: 'none', fontWeight: 700, fontSize: '13px', cursor: ccTexto.trim().length >= 15 ? 'pointer' : 'not-allowed' }}>
                                    {loading === 'cc' ? 'Emitindo...' : 'Emitir CC-e'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Form cancelar */}
                    {showCancelForm && (
                        <div style={{ padding: '14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Ban size={14} /> Cancelar Nota Fiscal
                            </div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                                O cancelamento só é possível dentro de 24h da autorização ou em casos previstos na legislação. Após cancelada, a nota não pode ser reativada.
                            </div>
                            <textarea value={cancelJust} onChange={e => setCancelJust(e.target.value)} placeholder="Justificativa do cancelamento (mín. 15 caracteres)..." maxLength={255} style={{ ...inp, minHeight: '80px', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} />
                            <div style={{ fontSize: '11px', color: cancelJust.length < 15 ? '#ef4444' : 'rgba(255,255,255,0.3)' }}>{cancelJust.length}/255 caracteres</div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => { setShowCancelForm(false); setCancelJust(''); }} style={{ padding: '9px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>Voltar</button>
                                <button onClick={handleCancelar} disabled={cancelJust.trim().length < 15 || loading === 'cancelar'} style={{ padding: '9px 16px', borderRadius: '8px', background: cancelJust.trim().length >= 15 ? '#ef4444' : 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '13px', cursor: cancelJust.trim().length >= 15 ? 'pointer' : 'not-allowed' }}>
                                    {loading === 'cancelar' ? 'Cancelando...' : 'Confirmar Cancelamento'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
};

// ── Componente principal ────────────────────────────────────────
export const Fiscal: React.FC = () => {
    const [notas, setNotas] = useState<FiscalNota[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterTipo, setFilterTipo] = useState<'all' | 'produto' | 'servico'>('all');
    const [filterStatus, setFilterStatus] = useState('');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<FiscalNota | null>(null);
    const [sortBy, setSortBy] = useState<'date' | 'value'>('date');
    const [sortDesc, setSortDesc] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await api.get('/fiscal/notas');
            setNotas(r.data);
        } catch { }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Filtro + busca + sort
    const filtered = notas
        .filter(n => {
            const matchTipo = filterTipo === 'all' || n.tipo === filterTipo;
            const matchStatus = !filterStatus || n.status === filterStatus;
            const matchSearch = !search || [n.nomeDestinatario, n.cpfCnpjDestinatario, String(n.numero || ''), n.protocolo, n.chaveAcesso].some(v => v?.toLowerCase().includes(search.toLowerCase()));
            return matchTipo && matchStatus && matchSearch;
        })
        .sort((a, b) => {
            const va = sortBy === 'date' ? new Date(a.createdAt).getTime() : a.valorTotal;
            const vb = sortBy === 'date' ? new Date(b.createdAt).getTime() : b.valorTotal;
            return sortDesc ? vb - va : va - vb;
        });

    const countByStatus = (s: string) => notas.filter(n => n.status === s).length;
    const totalAutorizadas = notas.filter(n => n.status === 'autorizada').reduce((s, n) => s + n.valorTotal, 0);
    const totalMes = notas.filter(n => {
        const d = new Date(n.createdAt);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && n.status === 'autorizada';
    }).reduce((s, n) => s + n.valorTotal, 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Receipt size={19} color="#3b82f6" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Notas Fiscais</h1>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>NF-e e NFS-e · {notas.length} notas no total</p>
                    </div>
                </div>
                <button onClick={load} style={{ padding: '9px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: loading ? '#3b82f6' : 'rgba(255,255,255,0.6)', cursor: 'pointer', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                </button>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

            {/* Banner informativo */}
            <div style={{ padding: '11px 15px', background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={14} color="#60a5fa" style={{ flexShrink: 0 }} />
                Para emitir NF-e ou NFS-e acesse a OS → aba <strong style={{ color: '#fff' }}>Nota Fiscal 🧾</strong>. Configure o certificado digital em <strong style={{ color: '#fff' }}>Configurações → Fiscal</strong>.
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
                <MetricCard label="Total emitidas" value={notas.length} color="#94a3b8" />
                <MetricCard label="Autorizadas" value={countByStatus('autorizada')} color="#22c55e" />
                <MetricCard label="Aguardando" value={countByStatus('aguardando')} color="#f59e0b" />
                <MetricCard label="Rejeitadas" value={countByStatus('rejeitada')} color="#ef4444" />
                <MetricCard label="Faturado total" value={fmtR$(totalAutorizadas)} color="#3b82f6" />
                <MetricCard label="Faturado este mês" value={fmtR$(totalMes)} color="#a855f7" />
            </div>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Busca */}
                <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por destinatário, CNPJ, número, chave..." style={{ ...inp, paddingLeft: '36px', fontSize: '13px' }} />
                </div>
                {/* Tipo */}
                <div style={{ display: 'flex', gap: '3px', background: 'rgba(255,255,255,0.04)', borderRadius: '9px', padding: '3px' }}>
                    {([['all', 'Todas'], ['produto', 'NF-e'], ['servico', 'NFS-e']] as const).map(([k, l]) => (
                        <button key={k} onClick={() => setFilterTipo(k)} style={{ padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, background: filterTipo === k ? 'rgba(59,130,246,0.2)' : 'transparent', color: filterTipo === k ? '#60a5fa' : 'rgba(255,255,255,0.45)', border: 'none', cursor: 'pointer' }}>{l}</button>
                    ))}
                </div>
                {/* Status */}
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inp, width: 'auto', fontSize: '13px', paddingRight: '28px' }}>
                    <option value="">Todos os status</option>
                    {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                {/* Sort */}
                <button onClick={() => { if (sortBy === 'date') setSortDesc(s => !s); else setSortBy('date'); }} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', borderRadius: '8px', background: sortBy === 'date' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    Data {sortBy === 'date' ? (sortDesc ? '↓' : '↑') : ''}
                </button>
                <button onClick={() => { if (sortBy === 'value') setSortDesc(s => !s); else setSortBy('value'); }} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', borderRadius: '8px', background: sortBy === 'value' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    Valor {sortBy === 'value' ? (sortDesc ? '↓' : '↑') : ''}
                </button>
            </div>

            {/* Status pills rápidos */}
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {[{ k: '', l: `Todas (${notas.length})` }, ...Object.entries(STATUS).map(([k, v]) => ({ k, l: `${v.label} (${countByStatus(k)})` }))].map(({ k, l }) => (
                    <button key={k} onClick={() => setFilterStatus(k)} style={{ padding: '5px 11px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, border: `1px solid ${filterStatus === k ? (STATUS[k]?.color || '#94a3b8') + '40' : 'rgba(255,255,255,0.08)'}`, background: filterStatus === k ? `${STATUS[k]?.color || '#94a3b8'}12` : 'rgba(255,255,255,0.03)', color: filterStatus === k ? (STATUS[k]?.color || '#94a3b8') : 'rgba(255,255,255,0.45)', cursor: 'pointer' }}>
                        {l}
                    </button>
                ))}
            </div>

            {/* Tabela */}
            {loading ? (
                <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Carregando...
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <Receipt size={36} style={{ opacity: 0.25 }} />
                    <p style={{ margin: 0, fontSize: '14px' }}>Nenhuma nota encontrada</p>
                    {search && <button onClick={() => setSearch('')} style={{ fontSize: '12px', color: '#3b82f6', background: 'transparent', border: 'none', cursor: 'pointer' }}>Limpar busca</button>}
                </div>
            ) : (
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                                    {['Tipo', 'Número', 'Destinatário', 'Valor', 'Status', 'Ambiente', 'Data', 'Ações'].map(h => (
                                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((nota, i) => {
                                    const cfg = STATUS[nota.status] || STATUS.pendente;
                                    const Icon = cfg.icon;
                                    const isLast = i === filtered.length - 1;
                                    return (
                                        <tr key={nota.id}
                                            style={{ borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.1s' }}
                                            onClick={() => setSelected(nota)}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                            <td style={{ padding: '11px 14px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {nota.tipo === 'produto' ? <Package size={13} color="#60a5fa" /> : <Wrench size={13} color="#a78bfa" />}
                                                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '5px', background: nota.tipo === 'produto' ? 'rgba(59,130,246,0.12)' : 'rgba(139,92,246,0.12)', color: nota.tipo === 'produto' ? '#60a5fa' : '#a78bfa' }}>
                                                        {nota.tipo === 'produto' ? 'NF-e' : 'NFS-e'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontSize: '13px', color: '#fff', fontWeight: 700 }}>
                                                {nota.numero ? `#${nota.numero}` : <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>}
                                            </td>
                                            <td style={{ padding: '11px 14px' }}>
                                                <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nota.nomeDestinatario || <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>}</div>
                                                {nota.cpfCnpjDestinatario && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', marginTop: '1px' }}>{nota.cpfCnpjDestinatario}</div>}
                                            </td>
                                            <td style={{ padding: '11px 14px', fontSize: '13px', fontWeight: 700, color: '#22c55e', whiteSpace: 'nowrap' }}>
                                                {fmtR$(nota.valorTotal)}
                                            </td>
                                            <td style={{ padding: '11px 14px' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}20`, whiteSpace: 'nowrap' }}>
                                                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '11px 14px' }}>
                                                {nota.ambiente === 2
                                                    ? <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>Homolog.</span>
                                                    : <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>Produção</span>
                                                }
                                            </td>
                                            <td style={{ padding: '11px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
                                                {fmtDate(nota.createdAt)}
                                            </td>
                                            <td style={{ padding: '11px 10px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                                    {nota.status === 'autorizada' && nota.tipo === 'produto' && (
                                                        <button onClick={async (e) => { e.stopPropagation(); setSelected(nota); }} title="Ver detalhes e baixar DANFE"
                                                            style={{ padding: '6px 10px', borderRadius: '7px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600 }}>
                                                            <Download size={11} /> DANFE
                                                        </button>
                                                    )}
                                                    {nota.status === 'aguardando' && (
                                                        <button onClick={e => { e.stopPropagation(); setSelected(nota); }} title="Consultar SEFAZ"
                                                            style={{ padding: '6px 8px', borderRadius: '7px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                            <Shield size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {/* Rodapé com total */}
                    <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                        <span>{filtered.length} nota{filtered.length !== 1 ? 's' : ''} exibida{filtered.length !== 1 ? 's' : ''}</span>
                        <span style={{ fontWeight: 700, color: '#22c55e' }}>
                            Total exibido: {fmtR$(filtered.reduce((s, n) => s + n.valorTotal, 0))}
                        </span>
                    </div>
                </div>
            )}

            {/* Modal de detalhe */}
            {selected && (
                <NotaDetail
                    nota={selected}
                    onClose={() => setSelected(null)}
                    onRefresh={() => { load(); setSelected(null); }}
                />
            )}
        </div>
    );
};
