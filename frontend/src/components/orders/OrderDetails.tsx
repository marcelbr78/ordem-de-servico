import { DeliveryReceiptModal } from './DeliveryReceiptModal';
import { QuoteTab } from './QuoteTab';
import React, { useState } from 'react';
import { X, Clock, Printer, FileText, FileCheck, ChevronDown, Timer, ArrowRight, Share2, MessageCircle, Mail, User, RefreshCw, Send, Save, Plus, RotateCcw, Shield } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { OrderPrint } from '../printing/OrderPrint';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import { SmartDiagnosticPanel } from './SmartDiagnosticPanel';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../ui/ToastContainer';
import { WhatsAppMessageModal } from './WhatsAppMessageModal';
import { ConversationTab } from './ConversationTab';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import type { Order } from '../../types';
import { ActiveQuote } from '../smartparts/ActiveQuote';
import { FiscalTab } from '../fiscal/FiscalTab';
import { OrderFinancialTab } from './OrderFinancialTab';
import { OrderPartsTab } from './OrderPartsTab';
import { OrderEquipmentTab } from './OrderEquipmentTab';
import { OrderPhotosTab } from './OrderPhotosTab';
import { OrderNextActionPanel } from './OrderNextActionPanel';

interface OrderDetailsProps {
    order: Order;
    onClose: () => void;
    onUpdate: () => void;
    initialTab?: string;
    startWithStatusOpen?: boolean;
    forceNewStatus?: string;
}

// ─── Styles for Internal Modals ──────────────────────
const modalOverlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
    padding: '20px',
};
const modalBox: React.CSSProperties = {
    background: '#1a1b26', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px',
    padding: '0', width: '100%', maxWidth: '900px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
};

// ─── Status Maps ─────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
    'aberta': 'Aberta',
    'em_diagnostico': 'Em Diagnóstico',
    'aguardando_aprovacao': 'Aguardando Aprovação',
    'aguardando_peca': 'Aguardando Peça',
    'em_reparo': 'Em Reparo',
    'testes': 'Testes',
    'finalizada': 'Finalizada',
    'entregue': 'Entregue',
    'cancelada': 'Cancelada',
};

const STATUS_COLORS: Record<string, string> = {
    'aberta': '#3b82f6',
    'em_diagnostico': '#f59e0b',
    'aguardando_aprovacao': '#8b5cf6',
    'aguardando_peca': '#f97316',
    'em_reparo': '#06b6d4',
    'testes': '#ec4899',
    'finalizada': '#10b981',
    'entregue': '#22c55e',
    'cancelada': '#ef4444',
};

const STATUS_ICONS: Record<string, string> = {
    'aberta': '📋',
    'em_diagnostico': '🔍',
    'aguardando_aprovacao': '⏳',
    'aguardando_peca': '📦',
    'em_reparo': '🔧',
    'testes': '🧪',
    'finalizada': '✅',
    'entregue': '🏁',
    'cancelada': '❌',
};

// ─── Helper: format duration ─────────────────────────
function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}min`;
    if (minutes > 0) return `${minutes}min`;
    return `${seconds}s`;
}

// ─── Warranty Tab (inline) ─────────────────────────────────────────────────────

const RETURN_STATUS_MAP: Record<string, { label: string; color: string }> = {
    pendente:    { label: 'Pendente',     color: '#f59e0b' },
    em_avaliacao:{ label: 'Em Avaliação', color: '#3b82f6' },
    aprovada:    { label: 'Aprovada',     color: '#22c55e' },
    negada:      { label: 'Negada',       color: '#ef4444' },
    concluida:   { label: 'Concluída',    color: '#94a3b8' },
};

const inpStyle: React.CSSProperties = {
    width: '100%', padding: '9px 13px', borderRadius: '9px', fontSize: '13px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    color: '#fff', outline: 'none', boxSizing: 'border-box',
};
const taStyle: React.CSSProperties = { ...inpStyle, minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' };
const lbl12: React.CSSProperties = { display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginBottom: '6px', fontWeight: 600 };

// Sub-componente: formulário de avaliação técnica com sugestões de memória
const EvalForm: React.FC<{ item: any; order: any; onDone: () => void }> = ({ item, order, onDone }) => {
    const [techEval, setTechEval] = React.useState(item.techEvaluation || '');
    const [isSame, setIsSame] = React.useState<boolean>(item.isSameDefect ?? true);
    const [saving, setSaving] = React.useState(false);
    const [suggestions, setSuggestions] = React.useState<any[]>([]);

    // Busca memória técnica ao abrir
    React.useEffect(() => {
        const equip = order?.equipments?.[0];
        if (!equip) return;
        api.get('/warranties/memory', {
            params: { brand: equip.brand, model: equip.model, symptom: item.defectDescription },
        }).then(r => setSuggestions(r.data || [])).catch(() => {});
    }, []);

    const save = async () => {
        if (!techEval.trim()) { alert('Preencha a avaliação técnica.'); return; }
        setSaving(true);
        try {
            await api.patch(`/warranties/returns/${item.id}/evaluate`, { techEvaluation: techEval, isSameDefect: isSame });
            onDone();
        } catch (e: any) { alert(e.response?.data?.message || 'Erro ao salvar.'); }
        finally { setSaving(false); }
    };

    return (
        <div style={{ marginTop: '12px', padding: '14px', borderRadius: '10px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 700, color: '#93c5fd' }}>🔍 AVALIAÇÃO TÉCNICA</p>

            {/* Sugestões da memória técnica */}
            {suggestions.length > 0 && (
                <div style={{ marginBottom: '12px', padding: '10px 12px', borderRadius: '9px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                    <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 700, color: '#c4b5fd' }}>
                        💡 {suggestions.length} caso(s) similar(es) na memória técnica:
                    </p>
                    {suggestions.slice(0, 2).map((s, i) => (
                        <div key={i} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px', lineHeight: 1.4 }}>
                            <span style={{ color: '#a78bfa' }}>Causa:</span> {s.rootCause || '—'}
                            {s.solution && <> · <span style={{ color: '#86efac' }}>Solução:</span> {s.solution}</>}
                            <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: '6px' }}>({s.recurrenceCount}x)</span>
                        </div>
                    ))}
                    {suggestions[0]?.rootCause && (
                        <button onClick={() => setTechEval(suggestions[0].rootCause)} style={{ marginTop: '6px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                            Usar como base
                        </button>
                    )}
                </div>
            )}

            <div style={{ marginBottom: '10px' }}>
                <label style={lbl12}>Avaliação técnica *</label>
                <textarea value={techEval} onChange={e => setTechEval(e.target.value)} style={taStyle}
                    placeholder="Descreva o que foi encontrado tecnicamente..." />
            </div>
            <div style={{ marginBottom: '12px' }}>
                <label style={lbl12}>É o mesmo defeito?</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {[true, false].map(v => (
                        <button key={String(v)} onClick={() => setIsSame(v)} style={{
                            padding: '7px 18px', borderRadius: '8px', border: '1px solid',
                            borderColor: isSame === v ? (v ? '#22c55e' : '#ef4444') : 'rgba(255,255,255,0.15)',
                            background: isSame === v ? (v ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)') : 'transparent',
                            color: isSame === v ? (v ? '#22c55e' : '#ef4444') : 'rgba(255,255,255,0.5)',
                            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                        }}>{v ? 'Sim' : 'Não'}</button>
                    ))}
                </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={onDone} style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={save} disabled={saving} style={{ padding: '8px 16px', borderRadius: '8px', background: '#3b82f6', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
                    {saving ? 'Salvando...' : 'Salvar Avaliação'}
                </button>
            </div>
        </div>
    );
};

// Sub-componente: formulário de decisão
const DecideForm: React.FC<{ item: any; onDone: () => void }> = ({ item, onDone }) => {
    const [valid, setValid] = React.useState<boolean>(true);
    const [resolution, setResolution] = React.useState(item.resolution || '');
    const [denialReason, setDenialReason] = React.useState(item.denialReason || '');
    const [saving, setSaving] = React.useState(false);

    const save = async () => {
        if (valid && !resolution.trim()) { alert('Preencha a resolução.'); return; }
        if (!valid && !denialReason.trim()) { alert('Preencha o motivo da negação.'); return; }
        setSaving(true);
        try {
            await api.patch(`/warranties/returns/${item.id}/decide`, { warrantyValid: valid, resolution, denialReason });
            onDone();
        } catch (e: any) { alert(e.response?.data?.message || 'Erro ao salvar.'); }
        finally { setSaving(false); }
    };

    return (
        <div style={{ marginTop: '12px', padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>⚖️ DECISÃO</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {[true, false].map(v => (
                    <button key={String(v)} onClick={() => setValid(v)} style={{
                        flex: 1, padding: '10px', borderRadius: '9px', border: '1px solid',
                        borderColor: valid === v ? (v ? '#22c55e' : '#ef4444') : 'rgba(255,255,255,0.15)',
                        background: valid === v ? (v ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)') : 'transparent',
                        color: valid === v ? (v ? '#22c55e' : '#ef4444') : 'rgba(255,255,255,0.4)',
                        fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                    }}>{v ? '✓ Garantia Válida' : '✗ Negar'}</button>
                ))}
            </div>
            {valid ? (
                <div style={{ marginBottom: '12px' }}>
                    <label style={lbl12}>Resolução *</label>
                    <textarea value={resolution} onChange={e => setResolution(e.target.value)} style={taStyle}
                        placeholder="O que será feito para resolver..." />
                </div>
            ) : (
                <div style={{ marginBottom: '12px' }}>
                    <label style={lbl12}>Motivo da negação *</label>
                    <textarea value={denialReason} onChange={e => setDenialReason(e.target.value)} style={taStyle}
                        placeholder="Por que a garantia está sendo negada..." />
                </div>
            )}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={onDone} style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={save} disabled={saving} style={{ padding: '8px 16px', borderRadius: '8px', background: valid ? '#22c55e' : '#ef4444', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
                    {saving ? 'Salvando...' : valid ? 'Aprovar Garantia' : 'Negar Garantia'}
                </button>
            </div>
        </div>
    );
};

const WarrantyTab: React.FC<{ orderId: string; order: any }> = ({ orderId, order }) => {
    const { user } = useAuth();
    const role = user?.role || '';
    const isAdmin    = ['admin', 'super_admin'].includes(role);
    const isTech     = ['admin', 'super_admin', 'technician'].includes(role);

    const [returns, setReturns]         = React.useState<any[]>([]);
    const [loading, setLoading]         = React.useState(true);
    const [showCreate, setShowCreate]   = React.useState(false);
    const [defect, setDefect]           = React.useState('');
    const [saving, setSaving]           = React.useState(false);
    const [expandedId, setExpandedId]   = React.useState<string | null>(null);
    const [activeAction, setActiveAction] = React.useState<'eval' | 'decide' | null>(null);

    const load = async () => {
        setLoading(true);
        try { const r = await api.get(`/warranties/returns/order/${orderId}`); setReturns(r.data || []); }
        catch { } finally { setLoading(false); }
    };

    React.useEffect(() => { load(); }, [orderId]);

    const handleCreate = async () => {
        if (!defect.trim()) { alert('Descreva o defeito relatado.'); return; }
        setSaving(true);
        try {
            await api.post('/warranties/returns', { originalOrderId: orderId, defectDescription: defect.trim() });
            setDefect(''); setShowCreate(false); load();
        } catch (e: any) { alert(e.response?.data?.message || 'Erro ao criar retorno.'); }
        finally { setSaving(false); }
    };

    const handleComplete = async (id: string) => {
        if (!confirm('Confirmar conclusão do retorno?')) return;
        try {
            await api.patch(`/warranties/returns/${id}/complete`, {});
            load();
        } catch (e: any) { alert(e.response?.data?.message || 'Erro.'); }
    };

    const toggleExpand = (id: string) => {
        if (expandedId === id) { setExpandedId(null); setActiveAction(null); }
        else { setExpandedId(id); setActiveAction(null); }
    };

    const warrantyColor = order.warrantyExpiresAt
        ? (new Date() <= new Date(order.warrantyExpiresAt) ? '#22c55e' : '#ef4444')
        : '#94a3b8';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Banner de status da garantia */}
            <div style={{ padding: '12px 16px', borderRadius: '12px', background: `${warrantyColor}08`, border: `1px solid ${warrantyColor}25`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Shield size={20} color={warrantyColor} />
                <div>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: warrantyColor }}>
                        {order.warrantyExpiresAt
                            ? (new Date() <= new Date(order.warrantyExpiresAt) ? 'Dentro da garantia' : 'Garantia vencida')
                            : order.warrantyDays ? `Garantia de ${order.warrantyDays} dias` : 'Sem garantia configurada'}
                    </p>
                    {order.warrantyExpiresAt && (
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                            Vence em: {new Date(order.warrantyExpiresAt).toLocaleDateString('pt-BR')}
                        </p>
                    )}
                </div>
            </div>

            {/* Botão abrir retorno */}
            <button onClick={() => setShowCreate(v => !v)} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
                borderRadius: '10px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
                color: 'var(--primary,#6366f1)', fontWeight: 700, fontSize: '13px', cursor: 'pointer', alignSelf: 'flex-start',
            }}>
                <Plus size={14} /> Abrir Retorno de Garantia
            </button>

            {showCreate && (
                <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <label style={lbl12}>Defeito relatado pelo cliente *</label>
                    <textarea value={defect} onChange={e => setDefect(e.target.value)}
                        placeholder="Descreva o problema que o cliente está relatando..." style={taStyle} />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end' }}>
                        <button onClick={() => setShowCreate(false)} style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer' }}>Cancelar</button>
                        <button onClick={handleCreate} disabled={saving || !defect.trim()} style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--primary,#6366f1)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: saving || !defect.trim() ? 0.5 : 1 }}>
                            {saving ? 'Salvando...' : 'Criar Retorno'}
                        </button>
                    </div>
                </div>
            )}

            {/* Lista de retornos */}
            {loading ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Carregando...</div>
            ) : returns.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                    <RotateCcw size={28} style={{ opacity: 0.3, marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontSize: '13px' }}>Nenhum retorno de garantia para esta OS</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase' }}>{returns.length} retorno(s)</p>
                    {returns.map((item: any) => {
                        const st = RETURN_STATUS_MAP[item.status] || { label: item.status, color: '#94a3b8' };
                        const isExpanded = expandedId === item.id;
                        const canEval    = isTech && item.status === 'pendente';
                        const canDecide  = isAdmin && item.status === 'em_avaliacao';
                        const canComplete = isAdmin && item.status === 'aprovada';

                        return (
                            <div key={item.id} style={{ borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${st.color}20`, borderLeft: `3px solid ${st.color}`, overflow: 'hidden' }}>
                                {/* Header do card — clicável para expandir */}
                                <div onClick={() => toggleExpand(item.id)} style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 9px', borderRadius: '20px', background: `${st.color}20`, color: st.color, border: `1px solid ${st.color}30` }}>{st.label}</span>
                                            {!item.isWithinWarranty && <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>⚠ Fora da garantia</span>}
                                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.defectDescription}</p>
                                    </div>
                                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '16px', flexShrink: 0 }}>{isExpanded ? '▲' : '▼'}</span>
                                </div>

                                {/* Detalhes expandidos */}
                                {isExpanded && (
                                    <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                        <div style={{ paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {item.techEvaluation && (
                                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', background: 'rgba(59,130,246,0.06)', padding: '8px 12px', borderRadius: '8px' }}>
                                                    <span style={{ color: '#93c5fd', fontWeight: 600 }}>Avaliação: </span>{item.techEvaluation}
                                                    {item.isSameDefect !== null && <span style={{ marginLeft: '8px', color: item.isSameDefect ? '#22c55e' : '#f59e0b' }}>({item.isSameDefect ? 'mesmo defeito' : 'defeito diferente'})</span>}
                                                </div>
                                            )}
                                            {item.resolution && (
                                                <div style={{ fontSize: '12px', color: '#86efac', background: 'rgba(34,197,94,0.06)', padding: '8px 12px', borderRadius: '8px' }}>
                                                    <span style={{ fontWeight: 600 }}>Resolução: </span>{item.resolution}
                                                </div>
                                            )}
                                            {item.denialReason && (
                                                <div style={{ fontSize: '12px', color: '#fca5a5', background: 'rgba(239,68,68,0.06)', padding: '8px 12px', borderRadius: '8px' }}>
                                                    <span style={{ fontWeight: 600 }}>Negação: </span>{item.denialReason}
                                                </div>
                                            )}
                                            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>Aberto por {item.openedByName}</p>
                                        </div>

                                        {/* Botões de ação contextuais */}
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                                            {canEval && activeAction !== 'eval' && (
                                                <button onClick={() => setActiveAction('eval')} style={{ padding: '7px 14px', borderRadius: '8px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                                                    🔍 Registrar Avaliação
                                                </button>
                                            )}
                                            {canDecide && activeAction !== 'decide' && (
                                                <button onClick={() => setActiveAction('decide')} style={{ padding: '7px 14px', borderRadius: '8px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                                                    ⚖️ Tomar Decisão
                                                </button>
                                            )}
                                            {canComplete && (
                                                <button onClick={() => handleComplete(item.id)} style={{ padding: '7px 14px', borderRadius: '8px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                                                    🏁 Marcar Concluído
                                                </button>
                                            )}
                                        </div>

                                        {/* Formulários inline */}
                                        {activeAction === 'eval' && (
                                            <EvalForm item={item} order={order} onDone={() => { setActiveAction(null); load(); }} />
                                        )}
                                        {activeAction === 'decide' && (
                                            <DecideForm item={item} onDone={() => { setActiveAction(null); load(); }} />
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export const OrderDetails: React.FC<OrderDetailsProps> = ({ order, onClose, onUpdate, initialTab, startWithStatusOpen, forceNewStatus }) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    React.useEffect(() => {
        const fn = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', fn);
        return () => window.removeEventListener('resize', fn);
    }, []);
    const [showDeliveryReceipt, setShowDeliveryReceipt] = useState(false);
    const [activeTab, setActiveTab] = useState(initialTab === 'Impressão' ? 'Histórico' : (initialTab || 'Histórico'));
    const { toasts, show: showToast, dismiss: dismissToast } = useToast();
    const { user } = useAuth();
    const isAdmin = ['admin', 'super_admin'].includes(user?.role || '');
    const [waModalOpen, setWaModalOpen] = useState(false);
    const [waModalStatus, setWaModalStatus] = useState('');
    const [waModalStatusLabel, setWaModalStatusLabel] = useState('');

    // transactions mantido apenas para o componente de impressão (OrderPrint)
    const [transactions, setTransactions] = useState<any[]>([]);

    const [showStatusDropdown, setShowStatusDropdown] = useState(!!startWithStatusOpen);
    const [statusDropdownPos, setStatusDropdownPos] = useState<{ top: number; left: number } | null>(null);
    const [changingStatus, setChangingStatus] = useState(false);
    const [printMenuOpen, setPrintMenuOpen] = useState(false);
    const [shareMenuOpen, setShareMenuOpen] = useState(false);
    const [technicalReport, setTechnicalReport] = useState(order.technicalReport || '');
    const [observations, setObservations] = useState(order.observations || '');
    const [savingReport, setSavingReport] = useState(false);
    const [exitChecklist, setExitChecklist] = useState<Record<string, boolean>>({});
    const { settings } = useSystemSettings();

    const DEFAULT_CHECKLIST_ITEMS = [
        { id: 'cam_front', label: 'Câmera Frontal' },
        { id: 'cam_rear', label: 'Câmera Traseira' },
        { id: 'charging', label: 'Carregamento' },
        { id: 'screen', label: 'Tela' },
        { id: 'touch', label: 'Touch' },
        { id: 'audio', label: 'Som/Áudio' },
        { id: 'calling', label: 'Ligação' },
        { id: 'wifi', label: 'WiFi' },
        { id: 'signal', label: 'Sinal/Rede' },
        { id: 'face_id', label: 'FaceID/Biometria' },
        { id: 'buttons', label: 'Botões' },
        { id: 'battery', label: 'Bateria' },
    ];
    const [CHECKLIST_ITEMS, setChecklistItems] = useState(DEFAULT_CHECKLIST_ITEMS);

    React.useEffect(() => {
        api.get('/settings/delivery_checklist')
            .then(res => {
                if (res.data?.value) {
                    try {
                        const parsed = JSON.parse(res.data.value);
                        if (Array.isArray(parsed) && parsed.length > 0) setChecklistItems(parsed);
                    } catch {}
                }
            })
            .catch(() => {});
    }, []);

    const getBaseUrl = () => {
        if (settings.company_url) {
            return settings.company_url.replace(/\/+$/, '');
        }
        const origin = window.location.origin;
        // If technical is accessing via internal IP or localhost, don't share that.
        if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.match(/192\.168\./)) {
            return 'https://os4u.com.br';
        }
        return origin;
    };

    // totalParts alimentado via callback de OrderPartsTab
    const [totalParts, setTotalParts] = useState(
        (order.parts || []).reduce((acc: number, p: any) => acc + Number(p.unitPrice) * p.quantity, 0)
    );

    // Click Outside Handling
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (shareMenuOpen && !target.closest('.share-menu-container')) {
                setShareMenuOpen(false);
            }
            if (printMenuOpen && !target.closest('.print-menu-container')) {
                setPrintMenuOpen(false);
            }
        };

        if (shareMenuOpen || printMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [shareMenuOpen, printMenuOpen]);

    // System Settings for Custom Workflow
    const [customWorkflow, setCustomWorkflow] = useState<{ labels?: Record<string, string>, flow?: Record<string, string[]> }>({});

    React.useEffect(() => {
        if (settings.os_custom_workflow) {
            try {
                setCustomWorkflow(JSON.parse(settings.os_custom_workflow));
            } catch (e) {
                console.error("Failed to parse custom workflow", e);
            }
        }
    }, [settings.os_custom_workflow]);

    const getDynamicStatusLabel = (status: string) => {
        return customWorkflow.labels?.[status] || STATUS_LABELS[status] || status;
    };

    // Status Flow Helper
    const getNextStatuses = (current: string) => {
        // Ignorando fluxo restrito personalizado temporariamente a pedido do usuário
        // if (customWorkflow.flow && Array.isArray(customWorkflow.flow[current])) {
        //    return customWorkflow.flow[current];
        // }

        // If no custom flow is found (or default is too restrictive), allow ALL transitions
        // This is a "permissive" fallback requested by user to allow any movement.
        const allStatuses = Object.keys(STATUS_LABELS);
        return allStatuses.filter(s => s !== current);
    };

    const nextStatuses = getNextStatuses(order.status);

    // Status Change Modal State
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [targetStatus, setTargetStatus] = useState<string | null>(null);
    const [statusComment, setStatusComment] = useState('');
    const [notifyWhatsApp, setNotifyWhatsApp] = useState(false);
    const [includeCommentInWA, setIncludeCommentInWA] = useState(true);
    const [whatsappPreviewOpen, setWhatsappPreviewOpen] = useState(false);
    const [whatsappMessage, setWhatsappMessage] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
    const [bankAccountId, setBankAccountId] = useState('');
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [expandedWaMsgs, setExpandedWaMsgs] = useState<Set<string>>(new Set());
    const [balanceToPay, setBalanceToPay] = useState<number>(0);

    React.useEffect(() => {
        if (statusModalOpen && targetStatus === 'entregue') {
            api.get('/bank-accounts').then(res => {
                setBankAccounts(res.data || []);
                if (res.data?.length > 0) {
                    setBankAccountId(res.data[0].id);
                }
            }).catch(err => console.error("Failed to fetch bank accounts", err));

            // Fetch current transactions and calculate remaining
            api.get(`/finance/order/${order.id}`).then(res => {
                const txs = res.data || [];
                const paid = txs.filter((t: any) => t.type === 'INCOME').reduce((acc: number, t: any) => acc + parseFloat(t.amount), 0);
                const currentTotal = (order.parts || []).reduce((acc: number, part: any) => acc + (Number(part.unitPrice) * part.quantity), 0);
                setBalanceToPay(Math.max(0, currentTotal - paid));
            }).catch(err => console.error("Failed to fetch finance to calculate balance", err));
        } else {
            setBalanceToPay(0);
        }
    }, [statusModalOpen, targetStatus, order.id, order.parts]);

    React.useEffect(() => {
        if (startWithStatusOpen && forceNewStatus) {
            setTargetStatus(forceNewStatus);
            setStatusModalOpen(true);
            setShowStatusDropdown(false);
        }
    }, [startWithStatusOpen, forceNewStatus]);

    const toggleWaMsg = (id: string) => {
        setExpandedWaMsgs(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const generateStatusMessage = (newStatus: string, currentComment: string) => {
        const clientName = (order.client?.nome || 'Cliente').split(' ')[0];
        const device = order.equipments?.[0] ? `${order.equipments[0].type} ${order.equipments[0].model}` : 'seu equipamento';

        const base = getBaseUrl();
        const statusUrl = `${base}/status/${order.id}`;
        const statusLabel = getDynamicStatusLabel(newStatus);

        let intro = '';
        if (newStatus === 'finalizada' || newStatus === 'entregue') {
            const total = totalParts || order.finalValue || order.estimatedValue || 0;
            const totalFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total);
            intro = `Olá ${clientName}, o serviço no ${device} foi finalizado!\n\n📄 *Protocolo:* ${order.protocol}\n✅ *Status:* ${statusLabel}\n💰 *Total:* ${totalFormatted}`;
        } else {
            intro = `Olá ${clientName}, informamos que o status da sua Ordem de Serviço #${order.protocol} (${device}) foi atualizado para: *${statusLabel}*.`;
        }

        const commentPart = includeCommentInWA && currentComment.trim() ? `\n\n💬 *Observações:* ${currentComment.trim()}` : '';
        return `${intro}${commentPart}\n\nAcompanhe o progresso em tempo real aqui: ${statusUrl}`;
    };

    const handleQuickStatusChange = (newStatus: string) => {
        setTargetStatus(newStatus);
        setStatusComment('');
        setStatusModalOpen(true);
        setShowStatusDropdown(false);
    };

    const confirmStatusChange = async () => {
        if (!targetStatus) return;

        if (targetStatus === 'finalizada') {
            const allChecked = CHECKLIST_ITEMS.every(item => exitChecklist[item.id]);
            if (!allChecked) {
                alert('Você precisa assinalar todo o Checklist de Saída para garantir que todos os testes foram executados!');
                return;
            }
        }

        if (notifyWhatsApp) {
            setWhatsappMessage(generateStatusMessage(targetStatus, statusComment));
            setWhatsappPreviewOpen(true);
            return;
        }

        await proceedWithStatusChange();
    };

    const proceedWithStatusChange = async (customWaMessage?: string) => {
        setChangingStatus(true);
        try {
            let finalComment = statusComment?.trim() || 'Status atualizado';
            if (targetStatus === 'finalizada') {
                finalComment += '\n\n[Checklist de Saída Executado: Todos os testes OK]';
            }

            // 1. Update status
            await api.patch(`/orders/${order.id}/status`, {
                status: targetStatus,
                comments: finalComment,
                paymentMethod: (targetStatus === 'entregue' && balanceToPay > 0) ? paymentMethod : undefined,
                bankAccountId: (targetStatus === 'entregue' && balanceToPay > 0) ? bankAccountId : undefined,
                paymentDate: (targetStatus === 'entregue' && balanceToPay > 0) ? new Date().toISOString() : undefined,
                paymentAmount: (targetStatus === 'entregue' && balanceToPay > 0) ? balanceToPay : undefined
            });

            // 2. Send WhatsApp if requested
            if (notifyWhatsApp && customWaMessage) {
                try {
                    console.log(`[Frontend] Sending WhatsApp Share:`, {
                        type: 'update',
                        message: customWaMessage
                    });
                    await api.post(`/orders/${order.id}/share`, {
                        type: 'update',
                        origin: getBaseUrl(),
                        message: customWaMessage
                    });
                } catch (waError) {
                    console.error("Failed to send automatic WhatsApp", waError);
                    showToast('Status atualizado, mas o WhatsApp falhou.', 'warning');
                }
            }

            setStatusModalOpen(false);
            setWhatsappPreviewOpen(false);
            onUpdate();
        } catch (error: any) {
            console.error(error);
            const msg = error?.response?.data?.message;
            if (Array.isArray(msg)) {
                alert('Erro ao atualizar status:\n' + msg.join('\n'));
            } else {
                alert('Erro ao atualizar status: ' + (msg || 'Verifique o console ou tente novamente.'));
            }
        } finally {
            setChangingStatus(false);
        }
    };

    // New Sharing Handler
    const [shareStep, setShareStep] = useState<'main' | 'whatsapp'>('main');

    // Reset share menu when closed
    React.useEffect(() => {
        if (!shareMenuOpen) setShareStep('main');
    }, [shareMenuOpen]);

    const handleShare = async (type: 'whatsapp_entry' | 'whatsapp_exit' | 'whatsapp_update' | 'email') => {
        // Email sharing remains manual for now (mailto)
        if (type === 'email') {
            const base = getBaseUrl();
            const statusUrl = `${base}/status/${order.id}`;
            const message = `Ol\u00e1, sua Ordem de Servi\u00e7o #${order.protocol} foi atualizada. Acompanhe o status aqui: ${statusUrl}`;

            const email = order.client?.email || '';
            const subject = `Atualiza\u00e7\u00e3o OS #${order.protocol} - ${settings.storeName || 'Loja'}`;
            const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
            window.open(mailtoLink, '_blank');
            setShareMenuOpen(false);
            return;
        }

        // Automatic WhatsApp Sharing via Backend
        try {
            // Map frontend type to backend expected type
            let shareType: 'entry' | 'exit' | 'update' = 'update';
            if (type === 'whatsapp_entry') shareType = 'entry';
            else if (type === 'whatsapp_exit') shareType = 'exit';

            // Show loading state/toast if possible, or just optimistic UI
            // Assuming we want to give feedback
            // For now, utilizing alert/console or if there's a toast hook available.
            // checking imports... no toast hook imported. using browser alert or console for now, user asked for automation.

            await api.post(`/orders/${order.id}/share`, {
                type: shareType,
                origin: getBaseUrl()
            });
            showToast('Mensagem enviada via WhatsApp! ✓', 'success');
        } catch (error: any) {
            console.error('Erro ao enviar mensagem:', error);
            const msg = error.response?.data?.message || 'Erro ao enviar mensagem.';

            // 1. Try to get a manual number from user
            const wantsToInput = msg.includes('sem telefone') || confirm(`Falha no envio autom\u00e1tico: ${msg}\n\nDeseja informar um n\u00famero manualmente para o sistema enviar?`);

            if (wantsToInput) {
                const existingPhone = order.client?.contatos?.find((c: any) => c.principal)?.numero || order.client?.contatos?.[0]?.numero || '';
                const manualNumber = prompt('Digite o n\u00famero do WhatsApp (com DDD):', existingPhone);
                if (manualNumber) {
                    try {
                        let shareType: 'entry' | 'exit' | 'update' = 'update';
                        if (type === 'whatsapp_entry') shareType = 'entry';
                        else if (type === 'whatsapp_exit') shareType = 'exit';

                        await api.post(`/orders/${order.id}/share`, {
                            type: shareType,
                            origin: getBaseUrl(),
                            customNumber: manualNumber
                        });
                        showToast(`Mensagem enviada para ${manualNumber}! ✓`, 'success');
                        setShareMenuOpen(false);
                        return;
                    } catch (retryErr) {
                        console.error('Erro no envio manual:', retryErr);
                        alert('Falha ao enviar para o n\u00famero informado. Abrindo WhatsApp Web...');
                    }
                }
            }

            // 2. Fallback to opening WhatsApp Web manually
            const base = getBaseUrl();
            const statusUrl = `${base}/status/${order.id}`;
            let message = '';
            const clientName = (order.client?.nome || 'Cliente').split(' ')[0];
            const device = order.equipments?.[0] ? `${order.equipments[0].type} ${order.equipments[0].model}` : 'seu equipamento';
            const storeName = settings.storeName || 'nossa loja';

            if (type.startsWith('whatsapp_entry')) {
                const defect = order.equipments?.[0]?.reportedDefect || order.initialObservations || 'Não informado';
                message = `Olá ${clientName}, confirmamos a entrada do ${device} na ${storeName}.\n\n📄 *Protocolo:* ${order.protocol}\n🛠 *Defeito:* ${defect}\n\nAcompanhe o status em tempo real aqui: ${statusUrl}`;
            } else if (type.startsWith('whatsapp_exit')) {
                const total = totalParts || order.finalValue || 0;
                const totalFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total);
                const lastComment = order.history?.find(h => h.comments && h.comments.length > 5)?.comments || order.history?.[0]?.comments || 'Serviço concluído.';
                message = `Olá ${clientName}, o serviço no ${device} foi finalizado!\n\n📄 *Protocolo:* ${order.protocol}\n✅ *Status:* ${getDynamicStatusLabel(order.status)}\n💬 *Laudo:* ${lastComment}\n💰 *Total:* ${totalFormatted}\n\nConfira os detalhes e o laudo técnico aqui: ${statusUrl}`;
            } else {
                const lastHistory = order.history?.[0];
                const comment = lastHistory?.comments || 'Status atualizado.';
                message = `Olá ${clientName}, informamos que o status da sua Ordem de Serviço #${order.protocol} (${device}) foi atualizado para: *${getDynamicStatusLabel(order.status)}*.\n\n💬 *Observações:* ${comment}\n\nAcompanhe o progresso em tempo real aqui: ${statusUrl}`;
            }

            const phone = order.client?.contatos?.find((c: any) => c.principal)?.numero || order.client?.contatos?.[0]?.numero || '';
            const cleanPhone = phone.replace(/\D/g, '');
            const waLink = `https://wa.me/${cleanPhone ? '55' + cleanPhone : ''}?text=${encodeURIComponent(message)}`;
            window.open(waLink, '_blank');
        } finally {
            setShareMenuOpen(false);
        }
    };

    // Compute time durations between history entries
    const historyWithDurations = (order.history || []).map((hist: any, index: number, arr: any[]) => {
        const nextEntry = arr[index + 1];
        let duration: string | null = null;
        if (nextEntry) {
            const diff = new Date(hist.createdAt).getTime() - new Date(nextEntry.createdAt).getTime();
            duration = formatDuration(Math.abs(diff));
        }
        return { ...hist, duration };
    });

    // Time in current status
    const lastHistoryEntry = order.history?.[0];
    const timeInCurrentStatus = lastHistoryEntry
        ? formatDuration(Date.now() - new Date(lastHistoryEntry.createdAt).getTime())
        : null;

    const [printType, setPrintType] = useState<'client' | 'store' | 'term'>('client');
    const printRef = React.useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `OS-${order.id}-${printType}`,
    });

    const triggerPrint = (type: 'client' | 'store' | 'term') => {
        setPrintType(type);
        setTimeout(() => {
            handlePrint();
        }, 100);
    };

    React.useEffect(() => {
        if (initialTab === 'Impressão') {
            triggerPrint('client'); // default client print
        }
    }, [initialTab]);

    const handleSaveReport = async () => {
        setSavingReport(true);
        try {
            await api.patch(`/orders/${order.id}`, { technicalReport, observations });
            onUpdate();
            alert('Laudo e observações salvos com sucesso!');
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar laudo e observações');
        } finally {
            setSavingReport(false);
        }
    };

    const currentColor = STATUS_COLORS[order.status] || '#3b82f6';

    // ── Layout contextual de abas ────────────────────────────────
    const TAB_LAYOUT: Record<string, { primary: string[]; recommended: string }> = {
        aberta:               { primary: ['Histórico', 'Equipamentos', 'Laudo Técnico', 'Peças/Serviços'], recommended: 'Equipamentos' },
        em_diagnostico:       { primary: ['Laudo Técnico', 'Peças/Serviços', 'Equipamentos', 'Histórico'], recommended: 'Laudo Técnico' },
        aguardando_aprovacao: { primary: ['Orçamento 📝', 'Peças/Serviços', 'Histórico'], recommended: 'Orçamento 📝' },
        aguardando_peca:      { primary: ['Peças/Serviços', 'Histórico', 'Equipamentos'], recommended: 'Peças/Serviços' },
        em_reparo:            { primary: ['Peças/Serviços', 'Laudo Técnico', 'Equipamentos', 'Histórico'], recommended: 'Peças/Serviços' },
        testes:               { primary: ['Peças/Serviços', 'Laudo Técnico', 'Histórico'], recommended: 'Laudo Técnico' },
        finalizada:           { primary: ['Financeiro 💰', 'Histórico', 'Garantia 🛡️'], recommended: 'Financeiro 💰' },
        entregue:             { primary: ['Garantia 🛡️', 'Financeiro 💰', 'Histórico'], recommended: 'Garantia 🛡️' },
        cancelada:            { primary: ['Histórico', 'Financeiro 💰'], recommended: 'Histórico' },
    };

    const allTabs = [
        'Histórico', 'Laudo Técnico', 'Peças/Serviços',
        'Equipamentos', 'Cotações', 'Fotos',
        'Orçamento 📝', ...(user?.canViewFinancials !== false ? ['Financeiro 💰'] : []), 'Nota Fiscal 🧾', 'Garantia 🛡️', 'Detalhes',
        ...(isAdmin ? ['Conversa 🔒'] : []),
    ];

    const layout = TAB_LAYOUT[order.status] ?? { primary: allTabs, recommended: 'Histórico' };
    const primaryTabs = layout.primary.filter(t => allTabs.includes(t));
    const recommendedTab = layout.recommended;
    const secondaryTabs = allTabs.filter(t => !primaryTabs.includes(t));

    const [showSecondaryTabs, setShowSecondaryTabs] = useState(
        secondaryTabs.includes(activeTab)
    );
    // Expand automaticamente se a aba ativa for secundária
    React.useEffect(() => {
        if (secondaryTabs.includes(activeTab)) setShowSecondaryTabs(true);
    }, [activeTab]);

    const visibleTabs = showSecondaryTabs
        ? [...primaryTabs, ...secondaryTabs]
        : primaryTabs;

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#1a1b26', overflow: 'hidden' }}>
            {/* Hidden Print Component */}
            <div style={{ display: 'none' }}>
                <OrderPrint ref={printRef} order={order} settings={settings} type={printType} transactions={transactions} />
            </div>

            {/* Loading State for Partial Data */}
            {(!order.history || !order.client?.contatos) && (
                <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                    <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>
                    <p>Carregando detalhes completos da OS...</p>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            {/* Main Content - Only show when data is ready */}
            {(order.history && (order.client?.contatos || !order.client)) && (
                <>
                    {/* Header */}
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', gap: '8px' }}>
                        <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'nowrap', overflow: 'hidden' }}>
                                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff', fontFamily: 'monospace', whiteSpace: 'nowrap', flexShrink: 0 }}>{order.protocol}</h2>

                                {/* ─── QUICK STATUS DROPDOWN ─── */}
                                <div style={{ flexShrink: 0 }}>
                                    <button
                                        onClick={(e) => {
                                            if (nextStatuses.length === 0) return;
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setStatusDropdownPos({ top: rect.bottom + 4, left: rect.left });
                                            setShowStatusDropdown(!showStatusDropdown);
                                        }}
                                        disabled={nextStatuses.length === 0}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            padding: '4px 10px', borderRadius: '8px', fontSize: '11px',
                                            fontWeight: 700, border: `1px solid ${currentColor}40`,
                                            background: `${currentColor}15`, color: currentColor,
                                            cursor: nextStatuses.length > 0 ? 'pointer' : 'default',
                                            textTransform: 'uppercase', letterSpacing: '0.4px',
                                            transition: 'all 0.2s', whiteSpace: 'nowrap',
                                        }}
                                    >
                                        <span>{STATUS_ICONS[order.status]} {getDynamicStatusLabel(order.status)}</span>
                                        {nextStatuses.length > 0 && <ChevronDown size={12} />}
                                    </button>

                                    {showStatusDropdown && statusDropdownPos && (
                                        <div style={{
                                            position: 'fixed', left: statusDropdownPos.left, top: statusDropdownPos.top,
                                            background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.12)',
                                            borderRadius: '10px', minWidth: '220px', boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                                            zIndex: 10001, overflow: 'hidden',
                                        }}>
                                            <div style={{ padding: '8px 12px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                Alterar para
                                            </div>
                                            {nextStatuses.map((status: string) => {
                                                const clr = STATUS_COLORS[status] || '#888';
                                                return (
                                                    <button
                                                        key={status}
                                                        onClick={() => handleQuickStatusChange(status)}
                                                        disabled={changingStatus}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '10px',
                                                            width: '100%', padding: '10px 14px', background: 'transparent',
                                                            border: 'none', color: '#fff', textAlign: 'left',
                                                            cursor: changingStatus ? 'wait' : 'pointer', fontSize: '13px',
                                                            fontWeight: 500, transition: 'background 0.15s',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        <span style={{ fontSize: '16px' }}>{STATUS_ICONS[status]}</span>
                                                        <span>{getDynamicStatusLabel(status)}</span>
                                                        <ArrowRight size={14} style={{ marginLeft: 'auto', color: clr, opacity: 0.6 }} />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Time in current status */}
                                {timeInCurrentStatus && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                                        <Timer size={14} />
                                        <span>{timeInCurrentStatus}</span>
                                    </div>
                                )}
                                {/* Expected Delivery Alert */}
                                {order.expectedDeliveryDate && !['finalizada', 'entregue', 'cancelada'].includes(order.status) && (() => {
                                    const isOverdue = new Date(order.expectedDeliveryDate + 'T23:59:59') < new Date();
                                    const expectedFmt = new Date(order.expectedDeliveryDate + 'T12:00:00').toLocaleDateString('pt-BR');
                                    return (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: isOverdue ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>
                                            <span>Previsão: {expectedFmt} {isOverdue && '⚠️ Atrasado!'}</span>
                                        </div>
                                    );
                                })()}
                            </div>
                            <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>{order.client?.nome} • {order.client?.cpfCnpj}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>

                            {/* ─── SHARE BUTTON ─── */}
                            <div className="share-menu-container" style={{ position: 'relative', display: 'inline-block', zIndex: 50 }}>
                                <button
                                    onClick={() => setShareMenuOpen(!shareMenuOpen)}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#fff', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px',
                                        display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600
                                    }}>
                                    <Share2 size={16} /> Enviar
                                </button>

                                {shareMenuOpen && (
                                    <div style={{
                                        position: 'absolute', right: 0, top: '100%', marginTop: '4px',
                                        background: '#2a2a35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                                        minWidth: '200px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 51, overflow: 'hidden'
                                    }}>

                                        {shareStep === 'main' ? (
                                            <>
                                                <button onClick={() => setShareStep('whatsapp')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', color: '#fff', textAlign: 'left', cursor: 'pointer', fontSize: '13px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <MessageCircle size={14} /> WhatsApp
                                                    </div>
                                                    <ArrowRight size={12} style={{ opacity: 0.5 }} />
                                                </button>
                                                <button onClick={() => handleShare('email')} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', color: '#fff', textAlign: 'left', cursor: 'pointer', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                                    <Mail size={14} /> Email
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <div style={{ padding: '8px 12px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={() => setShareStep('main')}>
                                                    <ArrowRight size={10} style={{ transform: 'rotate(180deg)' }} /> Voltar
                                                </div>
                                                <button onClick={() => handleShare('whatsapp_entry')} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', color: '#fff', textAlign: 'left', cursor: 'pointer', fontSize: '13px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                                    <FileText size={14} /> Via Entrada (Comprovante)
                                                </button>
                                                <button onClick={() => handleShare('whatsapp_update')} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', color: '#fff', textAlign: 'left', cursor: 'pointer', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                                    <RefreshCw size={14} /> Via Atualização
                                                </button>
                                                <button onClick={() => handleShare('whatsapp_exit')} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', color: '#fff', textAlign: 'left', cursor: 'pointer', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                                    <FileCheck size={14} /> Via Final (Valores)
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Print Dropdown */}
                            <div className="print-menu-container" style={{ position: 'relative', display: 'inline-block', zIndex: 50 }}>
                                <button
                                    onClick={() => setPrintMenuOpen(!printMenuOpen)}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#fff', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px',
                                        display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600
                                    }}>
                                    <Printer size={16} /> Imprimir
                                </button>

                                {printMenuOpen && (
                                    <div style={{
                                        position: 'absolute', right: 0, top: '100%', marginTop: '4px',
                                        background: '#2a2a35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                                        minWidth: '180px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 51, overflow: 'hidden'
                                    }}>
                                        <button onClick={() => triggerPrint('client')} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', color: '#fff', textAlign: 'left', cursor: 'pointer', fontSize: '13px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                            <FileText size={14} /> Ordem de Serviço
                                        </button>
                                        <button onClick={() => { setPrintMenuOpen(false); setShowDeliveryReceipt(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', color: '#fff', textAlign: 'left', cursor: 'pointer', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                            <FileCheck size={14} /> Termo Entrega
                                        </button>
                                        <button onClick={async () => {
                                            setPrintMenuOpen(false);
                                            try {
                                                const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3005';
                                                const token = localStorage.getItem('@OS:token');
                                                const res = await fetch(`${apiUrl}/orders/${order.id}/pdf`, {
                                                    headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': localStorage.getItem('tenant_id') || '' }
                                                });
                                                if (!res.ok) throw new Error('Erro ao gerar PDF');
                                                const blob = await res.blob();
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url; a.download = `OS-${order.protocol}.pdf`;
                                                a.click(); URL.revokeObjectURL(url);
                                            } catch { alert('Erro ao baixar PDF. Verifique a conexão.'); }
                                        }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', color: '#3b82f6', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: 600, borderTop: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                            <FileText size={14} /> ↓ Download PDF
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'background 0.2s' }}>
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Body: lateral tabs (desktop) + content */}
                    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                        {/* Sidebar tabs — desktop only */}
                        {!isMobile && (
                            <div style={{
                                width: '148px', minWidth: '148px',
                                borderRight: '1px solid rgba(255,255,255,0.08)',
                                background: 'rgba(0,0,0,0.15)',
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                padding: '8px 0',
                                scrollbarWidth: 'none',
                            }}>
                                {visibleTabs.map(tab => {
                                    const isActive = activeTab === tab;
                                    const isRecommended = tab === recommendedTab && !isActive;
                                    const isSecondary = secondaryTabs.includes(tab);
                                    return (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            style={{
                                                padding: '10px 16px',
                                                background: isActive ? 'rgba(99,102,241,0.12)' : isRecommended ? 'rgba(251,191,36,0.06)' : 'transparent',
                                                border: 'none',
                                                borderLeft: isActive ? '3px solid var(--primary)' : isRecommended ? '3px solid #fbbf24' : '3px solid transparent',
                                                color: isActive ? 'var(--primary)' : isRecommended ? '#fbbf24' : isSecondary ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.5)',
                                                fontWeight: isActive || isRecommended ? 600 : 400,
                                                fontSize: '13px',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                transition: 'all 0.15s',
                                                minHeight: '40px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                            }}
                                        >
                                            {isRecommended && (
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', flexShrink: 0, display: 'inline-block' }} />
                                            )}
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{tab}</span>
                                        </button>
                                    );
                                })}

                                {/* Botão Ver mais / Ver menos */}
                                {secondaryTabs.length > 0 && (
                                    <button
                                        onClick={() => setShowSecondaryTabs(v => !v)}
                                        style={{
                                            padding: '8px 16px',
                                            background: 'transparent', border: 'none',
                                            color: 'rgba(255,255,255,0.3)',
                                            fontSize: '12px', cursor: 'pointer',
                                            textAlign: 'left', fontWeight: 500,
                                            borderTop: showSecondaryTabs ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                            marginTop: showSecondaryTabs ? '4px' : '0',
                                        }}
                                    >
                                        {showSecondaryTabs ? '↑ Ver menos' : `··· +${secondaryTabs.length} abas`}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Right column: mobile tabs + content */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                        {/* Tabs — scroll horizontal (mobile only) */}
                        {isMobile && (
                        <div style={{
                            overflowX: 'auto',
                            overflowY: 'hidden',
                            WebkitOverflowScrolling: 'touch',
                            borderBottom: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(0,0,0,0.2)',
                            scrollbarWidth: 'none',
                        }}>
                            <div style={{ display: 'flex', padding: '0 16px', minWidth: 'max-content' }}>
                            {visibleTabs.map(tab => {
                                const isActive = activeTab === tab;
                                const isRecommended = tab === recommendedTab && !isActive;
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        style={{
                                            padding: '14px 16px',
                                            background: 'transparent',
                                            border: 'none',
                                            borderBottom: isActive ? '2px solid var(--primary)' : isRecommended ? '2px solid #fbbf24' : '2px solid transparent',
                                            color: isActive ? 'var(--primary)' : isRecommended ? '#fbbf24' : 'rgba(255,255,255,0.5)',
                                            fontWeight: isActive || isRecommended ? 600 : 400,
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            marginBottom: '-1px',
                                            whiteSpace: 'nowrap',
                                            minHeight: '44px',
                                            WebkitTapHighlightColor: 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                        }}
                                    >
                                        {isRecommended && (
                                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#fbbf24', flexShrink: 0, display: 'inline-block' }} />
                                        )}
                                        {tab}
                                    </button>
                                );
                            })}
                            {secondaryTabs.length > 0 && (
                                <button
                                    onClick={() => setShowSecondaryTabs(v => !v)}
                                    style={{
                                        padding: '14px 12px',
                                        background: 'transparent',
                                        border: 'none',
                                        borderBottom: '2px solid transparent',
                                        color: 'rgba(255,255,255,0.3)',
                                        fontWeight: 500,
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        marginBottom: '-1px',
                                        whiteSpace: 'nowrap',
                                        minHeight: '44px',
                                        WebkitTapHighlightColor: 'transparent',
                                    }}
                                >
                                    {showSecondaryTabs ? '↑' : `··· +${secondaryTabs.length}`}
                                </button>
                            )}
                            </div>
                        </div>
                        )}

                        {/* Content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', paddingBottom: '80px', overscrollBehavior: 'contain' }}>
                        <OrderNextActionPanel
                            order={order}
                            onChangeStatus={handleQuickStatusChange}
                            onNavigateTab={setActiveTab}
                        />
                        {activeTab === 'Orçamento 📝' && (
                            <QuoteTab order={order} />
                        )}
                        {activeTab === 'Nota Fiscal 🧾' && (
                            <FiscalTab order={order} />
                        )}

                        {activeTab === 'Garantia 🛡️' && (
                            <WarrantyTab orderId={order.id} order={order} />
                        )}

                        {activeTab === 'Financeiro 💰' && (
                            <OrderFinancialTab
                                order={order}
                                totalParts={totalParts}
                                onDeliveryReceipt={() => setShowDeliveryReceipt(true)}
                                onTransactionsLoaded={setTransactions}
                            />
                        )}

                        {activeTab === 'Peças/Serviços' && (
                            <OrderPartsTab
                                order={order}
                                onUpdate={onUpdate}
                                onTotalChange={setTotalParts}
                            />
                        )}

                                                {activeTab === 'Laudo Técnico' && (() => {
                            const eq = order.equipments?.find((e: any) => e.isMain) || order.equipments?.[0];
                            const model = eq ? `${eq.brand} ${eq.model}` : '';
                            const symptom = order.reportedDefect || eq?.reportedDefect || '';
                            return (
                            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>Laudo Técnico</h3>
                                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Relatório detalhado do diagnóstico e solução aplicada.</p>
                                    </div>
                                    <button
                                        onClick={handleSaveReport}
                                        disabled={order.status === 'finalizada' || order.status === 'entregue' || savingReport || (technicalReport === order.technicalReport && observations === order.observations)}
                                        style={{
                                            padding: '8px 16px', borderRadius: '8px', border: 'none',
                                            background: 'var(--primary)', color: '#fff', fontWeight: 600, fontSize: '13px',
                                            cursor: (savingReport || (technicalReport === order.technicalReport && observations === order.observations)) ? 'not-allowed' : 'pointer',
                                            opacity: (savingReport || (technicalReport === order.technicalReport && observations === order.observations)) ? 0.6 : 1,
                                            display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {savingReport ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                        Salvar
                                    </button>
                                </div>

                                <textarea
                                    readOnly={order.status === 'finalizada' || order.status === 'entregue'}
                                    value={technicalReport}
                                    onChange={(e) => setTechnicalReport(e.target.value)}
                                    placeholder="Descreva aqui o diagnóstico técnico, peças trocadas e a solução do problema..."
                                    style={{
                                        width: '100%', height: '180px', padding: '16px', borderRadius: '12px',
                                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                        color: '#fff', fontSize: '14px', lineHeight: '1.6', outline: 'none',
                                        resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '16px',
                                    }}
                                />

                                <div style={{ marginBottom: '16px' }}>
                                    <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Observações Livres (Impressas)</h4>
                                    <textarea
                                        readOnly={order.status === 'finalizada' || order.status === 'entregue'}
                                        value={observations}
                                        onChange={(e) => setObservations(e.target.value)}
                                        placeholder="Ex: Cliente ciente de risco, tela paralela aceita pelo cliente... (Fica visível no termo de entrega e Via Cliente)"
                                        style={{
                                            width: '100%', minHeight: '80px', padding: '12px', borderRadius: '12px',
                                            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                                            color: '#fff', fontSize: '13px', resize: 'vertical', display: 'block'
                                        }}
                                    />
                                </div>

                                {/* Painel de diagnóstico inteligente */}
                                <SmartDiagnosticPanel
                                    model={model}
                                    symptom={symptom}
                                    diagnosis={technicalReport}
                                    onApplySuggestion={(text) => setTechnicalReport(prev => prev ? `${prev}\n\n${text}` : text)}
                                    onApplyPrice={(price) => {
                                        api.patch(`/orders/${order.id}`, { estimatedValue: price }).catch(() => {});
                                    }}
                                />
                            </div>
                            );
                        })()}

                        {activeTab === 'Histórico' && (
                            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>Linha do Tempo</h3>
                                </div>

                                <div style={{ position: 'relative', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '32px', marginLeft: '10px' }}>
                                    {historyWithDurations
                                        .map((hist: any, index: number) => {
                                            const isStatusChange = hist.actionType === 'STATUS_CHANGE';
                                            const statusColor = isStatusChange && hist.newStatus ? (STATUS_COLORS[hist.newStatus] || '#3b82f6') : '#3b82f6';

                                            return (
                                                <React.Fragment key={hist.id}>
                                                    <div style={{ marginBottom: '12px', position: 'relative' }}>
                                                        {/* Dot */}
                                                        <div style={{
                                                            position: 'absolute', left: '-41px', top: '0', width: '20px', height: '20px', borderRadius: '50%',
                                                            background: index === 0 ? statusColor : '#1a1a1a',
                                                            border: index === 0 ? `2px solid ${statusColor}` : '2px solid rgba(255,255,255,0.2)',
                                                            boxShadow: index === 0 ? `0 0 12px ${statusColor}60` : 'none',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: '10px',
                                                        }} />

                                                        {/* Card */}
                                                        <div style={{
                                                            background: index === 0 ? `${statusColor}08` : 'rgba(255,255,255,0.02)',
                                                            border: `1px solid ${index === 0 ? `${statusColor}20` : 'rgba(255,255,255,0.06)'}`,
                                                            borderRadius: '12px', padding: '14px 16px',
                                                        }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                <div style={{ fontWeight: 600, color: '#fff', fontSize: '13px' }}>
                                                                    {isStatusChange ? (
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                                            <span style={{
                                                                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                                padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                                                                background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)',
                                                                            }}>
                                                                                {STATUS_ICONS[hist.previousStatus]} {getDynamicStatusLabel(hist.previousStatus)}
                                                                            </span>
                                                                            <ArrowRight size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
                                                                            <span style={{
                                                                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                                padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                                                                background: `${statusColor}20`, color: statusColor,
                                                                            }}>
                                                                                {STATUS_ICONS[hist.newStatus]} {getDynamicStatusLabel(hist.newStatus)}
                                                                            </span>

                                                                            {hist.waMsgSent ? (
                                                                                <button
                                                                                    onClick={() => toggleWaMsg(hist.id)}
                                                                                    style={{
                                                                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                                        padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                                                                                        background: expandedWaMsgs.has(hist.id) ? '#25d366' : 'rgba(37,211,102,0.15)',
                                                                                        color: expandedWaMsgs.has(hist.id) ? '#fff' : '#25d366',
                                                                                        border: '1px solid rgba(37,211,102,0.2)',
                                                                                        cursor: 'pointer'
                                                                                    }}
                                                                                >
                                                                                    <MessageCircle size={12} /> {expandedWaMsgs.has(hist.id) ? 'Ocultar WhatsApp' : 'WhatsApp Enviado'}
                                                                                </button>
                                                                            ) : (
                                                                                <span style={{
                                                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                                    padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                                                                                    background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)',
                                                                                    border: '1px solid rgba(255,255,255,0.1)'
                                                                                }}>
                                                                                    <MessageCircle size={12} /> Sem Notificação
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                            {hist.actionType === 'ITEM_EDIT' ? (
                                                                                <span style={{
                                                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                                    padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                                                                    background: 'rgba(99,102,241,0.15)', color: '#818cf8',
                                                                                    border: '1px solid rgba(99,102,241,0.2)',
                                                                                }}>
                                                                                    🔧 Serviço
                                                                                </span>
                                                                            ) : hist.actionType === 'COMMENT' ? (
                                                                                <span style={{
                                                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                                    padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                                                                    background: 'rgba(16,185,129,0.15)', color: '#34d399',
                                                                                    border: '1px solid rgba(16,185,129,0.2)',
                                                                                }}>
                                                                                    💬 Comentário
                                                                                </span>
                                                                            ) : hist.actionType === 'PHOTO' ? (
                                                                                <span style={{
                                                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                                    padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                                                                    background: 'rgba(245,158,11,0.15)', color: '#fbbf24',
                                                                                    border: '1px solid rgba(245,158,11,0.2)',
                                                                                }}>
                                                                                    📷 Foto
                                                                                </span>
                                                                            ) : hist.actionType === 'SYSTEM' ? (
                                                                                <span style={{
                                                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                                    padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                                                                    background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)',
                                                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                                                }}>
                                                                                    ⚙️ Sistema
                                                                                </span>
                                                                            ) : (
                                                                                <span>{hist.actionType}</span>
                                                                            )}
                                                                            {hist.waMsgSent && hist.actionType === 'INTEGRATION' && (
                                                                                <span style={{
                                                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                                    padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                                                                                    background: 'rgba(37,211,102,0.15)', color: '#25d366'
                                                                                }}>
                                                                                    <MessageCircle size={12} /> WhatsApp
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                                                                    {hist.user && (
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.5)' }} title={`Ação realizada por: ${hist.user.name}`}>
                                                                            <User size={11} />
                                                                            <span>{hist.user.name?.split(' ')[0]}</span>
                                                                        </div>
                                                                    )}
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                        <Clock size={11} />
                                                                        {new Date(hist.createdAt).toLocaleString('pt-BR')}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {hist.comments && (
                                                                hist.actionType === 'ITEM_EDIT' ? (
                                                                    <div style={{ margin: '8px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                                                                        {hist.comments.split('\n').map((line: string, i: number) => (
                                                                            <div key={i} style={i === 0 ? { fontWeight: 500, color: 'rgba(255,255,255,0.75)', marginBottom: '4px' } : { paddingLeft: '8px', borderLeft: '2px solid rgba(99,102,241,0.3)', marginBottom: '2px', fontSize: '12px' }}>
                                                                                {line}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{hist.comments}</p>
                                                                )
                                                            )}
                                                            {hist.waMsgSent && hist.waMsgContent && hist.waMsgContent !== hist.comments && expandedWaMsgs.has(hist.id) && (
                                                                <div className="animate-fade" style={{
                                                                    marginTop: '8px', padding: '12px',
                                                                    background: 'rgba(37,211,102,0.08)', borderRadius: '8px',
                                                                    borderLeft: '3px solid #25d366', fontSize: '12.5px',
                                                                    color: 'rgba(255,255,255,0.7)', fontFamily: 'inherit',
                                                                    whiteSpace: 'pre-wrap', position: 'relative'
                                                                }}>
                                                                    <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#25d366', fontWeight: 800, marginBottom: '6px', opacity: 0.8 }}>
                                                                        Conteúdo enviado via WhatsApp:
                                                                    </div>
                                                                    {hist.waMsgContent}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Duration between states */}
                                                    {hist.duration && (
                                                        <div style={{
                                                            display: 'flex', alignItems: 'center', gap: '6px',
                                                            marginLeft: '-19px', marginBottom: '12px',
                                                            fontSize: '11px', color: 'rgba(255,255,255,0.25)',
                                                        }}>
                                                            <Timer size={12} />
                                                            <span>{hist.duration}</span>
                                                        </div>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                </div>

                                {(!order.history || order.history.length === 0) && (
                                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)' }}>
                                        <Clock size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                                        <p>Nenhum registro no histórico.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'Equipamentos' && (
                            <OrderEquipmentTab order={order} onUpdate={onUpdate} />
                        )}

                        {activeTab === 'Cotações' && (
                            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                                <ActiveQuote orderId={order.id} />
                            </div>
                        )}

                        {activeTab === 'Fotos' && (
                            <OrderPhotosTab order={order} onUpdate={onUpdate} />
                        )}

                        {activeTab === 'Detalhes' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                {/* Client Info */}
                                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px' }}>
                                    <h4 style={{ margin: '0 0 16px', fontSize: '14px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.5px' }}>
                                        Cliente
                                    </h4>
                                    <div style={{ display: 'grid', gap: '12px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Nome</label>
                                            <div style={{ color: '#fff', fontWeight: 500 }}>{order.client?.nome || '-'}</div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>CPF/CNPJ</label>
                                            <div style={{ color: 'rgba(255,255,255,0.7)' }}>{order.client?.cpfCnpj || '-'}</div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Contato</label>
                                            <div style={{ color: 'rgba(255,255,255,0.7)' }}>{order.client?.email || '-'}</div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Endereço</label>
                                            <div style={{ color: 'rgba(255,255,255,0.7)' }}>{order.client?.endereco || '-'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Info */}
                                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px' }}>
                                    <h4 style={{ margin: '0 0 16px', fontSize: '14px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.5px' }}>
                                        Dados da OS
                                    </h4>
                                    <div style={{ display: 'grid', gap: '12px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Protocolo</label>
                                                <div style={{ color: '#fff', fontWeight: 700, fontFamily: 'monospace' }}>{order.protocol}</div>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Prioridade</label>
                                                <div style={{ color: order.priority === 'URGENTE' ? '#ef4444' : '#fff' }}>{order.priority}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Entrada</label>
                                                <div style={{ color: 'rgba(255,255,255,0.7)' }}>{new Date(order.entryDate).toLocaleDateString()}</div>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Saída</label>
                                                <div style={{ color: 'rgba(255,255,255,0.7)' }}>{order.exitDate ? new Date(order.exitDate).toLocaleDateString() : '-'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial */}
                                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px', gridColumn: 'span 2' }}>
                                    <h4 style={{ margin: '0 0 16px', fontSize: '14px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.5px' }}>
                                        Valores
                                    </h4>
                                    <div style={{ display: 'flex', gap: '40px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Valor Estimado</label>
                                            <div style={{ fontSize: '20px', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>
                                                {order.estimatedValue ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.estimatedValue) : '-'}
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Valor Final</label>
                                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
                                                {order.finalValue ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.finalValue) : '-'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Observations */}
                                {order.initialObservations && (
                                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '20px', gridColumn: 'span 2' }}>
                                        <h4 style={{ margin: '0 0 16px', fontSize: '14px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.5px' }}>
                                            Observações Iniciais
                                        </h4>
                                        <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{order.initialObservations}</p>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === 'Conversa 🔒' && (
                            <ConversationTab orderId={order.id} order={order} />
                        )}
                    </div>
                        </div>{/* right column */}
                    </div>{/* body wrapper */}
                </>
            )}

            {/* Click outside to close status dropdown */}
            {showStatusDropdown && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 10000 }}
                    onClick={() => setShowStatusDropdown(false)}
                />
            )}

            {/* Status Confirmation Modal */}
            {statusModalOpen && (
                <div style={modalOverlay}>
                    <div style={{ ...modalBox, maxWidth: '500px', height: 'auto', padding: '24px', overflow: 'visible' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>Confirmar Alteração de Status</h3>
                            <button onClick={() => setStatusModalOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '8px' }}>
                                Você está alterando o status para: <strong style={{ color: STATUS_COLORS[targetStatus || ''] }}>{getDynamicStatusLabel(targetStatus || '')}</strong>
                            </p>

                            {targetStatus === 'entregue' && balanceToPay > 0 && (
                                <div style={{
                                    padding: '16px',
                                    background: 'rgba(59,130,246,0.1)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(59,130,246,0.2)',
                                    marginBottom: '20px'
                                }}>
                                    <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#3b82f6', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        💰 Informações de Pagamento (Faturamento)
                                    </h4>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Forma de Pagamento</label>
                                            <select
                                                value={paymentMethod}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
                                            >
                                                <option value="Dinheiro">Dinheiro</option>
                                                <option value="PIX">PIX</option>
                                                <option value="Cartão de Débito">Cartão de Débito</option>
                                                <option value="Cartão de Crédito">Cartão de Crédito</option>
                                                <option value="Transferência">Transferência</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Conta de Destino</label>
                                            <select
                                                value={bankAccountId}
                                                onChange={(e) => setBankAccountId(e.target.value)}
                                                style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
                                            >
                                                {bankAccounts.map(acc => (
                                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                                ))}
                                                {bankAccounts.length === 0 && <option value="">Carregando contas...</option>}
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Valor Restante a Pagar</span>
                                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981' }}>
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balanceToPay)}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                                Motivo da alteração (Obrigatório)
                            </label>
                            <textarea
                                value={statusComment}
                                onChange={(e) => setStatusComment(e.target.value)}
                                placeholder="Descreva o motivo da mudança de status..."
                                style={{
                                    width: '100%', minHeight: '100px', background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                                    padding: '12px', color: '#fff', fontSize: '14px', resize: 'vertical',
                                    marginBottom: targetStatus === 'finalizada' ? '16px' : '0'
                                }}
                                autoFocus
                            />

                            {targetStatus === 'finalizada' && (
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px' }}>
                                    <h4 style={{ margin: '0 0 12px', fontSize: '13px', color: '#fff' }}>Checklist Funcional de Saída (Obrigatório)</h4>
                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '-8px', marginBottom: '16px' }}>Verifique se está tudo funcionando após o reparo.</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                                        {CHECKLIST_ITEMS.map((item) => (
                                            <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={!!exitChecklist[item.id]}
                                                    onChange={(e) => setExitChecklist(prev => ({ ...prev, [item.id]: e.target.checked }))}
                                                    style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                                                />
                                                {item.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                id="notifyWhatsApp"
                                checked={notifyWhatsApp}
                                onChange={(e) => setNotifyWhatsApp(e.target.checked)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <label htmlFor="notifyWhatsApp" style={{ color: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: 500 }}>
                                Notificar cliente via WhatsApp
                            </label>
                        </div>

                        {notifyWhatsApp && (
                            <div style={{ marginBottom: '20px', marginLeft: '26px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="checkbox"
                                    id="includeCommentInWA"
                                    checked={includeCommentInWA}
                                    onChange={(e) => setIncludeCommentInWA(e.target.checked)}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <label htmlFor="includeCommentInWA" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', cursor: 'pointer' }}>
                                    Incluir observações na mensagem
                                </label>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'end', gap: '12px' }}>
                            <button
                                onClick={() => setStatusModalOpen(false)}
                                style={{
                                    padding: '10px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'transparent', color: 'rgba(255,255,255,0.7)', cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmStatusChange}
                                style={{
                                    padding: '10px 20px', borderRadius: '8px', border: 'none',
                                    background: '#3b82f6', color: '#fff',
                                    cursor: 'pointer', fontWeight: 600
                                }}
                            >
                                Confirmar Alteração
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* WhatsApp Preview Modal */}
            {/* Novo modal WhatsApp com preview visual e templates */}
            <WhatsAppMessageModal
                open={whatsappPreviewOpen}
                onClose={() => setWhatsappPreviewOpen(false)}
                onSend={async (msg) => {
                    await proceedWithStatusChange(msg);
                    setWhatsappPreviewOpen(false);
                    showToast('Mensagem enviada pelo WhatsApp! ✓', 'success');
                }}
                order={order}
                targetStatus={waModalStatus || targetStatus || ''}
                statusLabel={waModalStatusLabel || getDynamicStatusLabel(targetStatus || '')}
                totalValue={totalParts || Number(order.finalValue) || Number(order.estimatedValue) || 0}
                sending={changingStatus}
                companyName={settings?.storeName || settings?.companyName || 'Assistência'}
                statusUrl={`${getBaseUrl()}/status/${order.id}`}
            />

            {/* Toast notifications */}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />

            {showDeliveryReceipt && (
                <DeliveryReceiptModal
                    order={order}
                    settings={settings}
                    onClose={() => setShowDeliveryReceipt(false)}
                    onSuccess={() => { setShowDeliveryReceipt(false); }}
                />
            )}
        </div>
    );
};
