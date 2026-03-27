import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import {
    Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw,
    Phone, Smartphone, Calendar, RotateCcw, DollarSign,
    Plus, Clock, ChevronRight, X, FileText, Wrench
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WarrantyOrder {
    id: string; protocol: string; clientName: string; clientPhone: string;
    equipment: string; exitDate: string; warrantyExpiresAt: string;
    warrantyDays: number; daysLeft: number; isExpired: boolean; isExpiringSoon: boolean;
}

interface WarrantyReturn {
    id: string; tenantId: string; originalOrderId: string;
    openedByName: string; evaluatedByName?: string; authorizedByName?: string;
    status: string; defectDescription: string; techEvaluation?: string;
    isSameDefect?: boolean; warrantyValid?: boolean;
    resolution?: string; denialReason?: string;
    warrantyExpiresAt?: string; isWithinWarranty: boolean;
    createdAt: string; updatedAt: string;
    originalOrder?: { protocol: string; client?: { name: string }; equipments?: any[] };
}

interface WarrantyRefund {
    id: string; tenantId: string; originalOrderId: string; originalProtocol?: string;
    requestedByName: string; authorizedByName?: string;
    status: string; type: string; amount?: number; reason: string;
    adminNotes?: string; executedAt?: string; createdAt: string;
}

// ─── Status helpers ────────────────────────────────────────────────────────────

const RETURN_STATUS: Record<string, { label: string; color: string }> = {
    pendente: { label: 'Pendente', color: '#f59e0b' },
    em_avaliacao: { label: 'Em Avaliação', color: '#3b82f6' },
    aprovada: { label: 'Aprovada', color: '#22c55e' },
    negada: { label: 'Negada', color: '#ef4444' },
    concluida: { label: 'Concluída', color: '#94a3b8' },
};

const REFUND_STATUS: Record<string, { label: string; color: string }> = {
    solicitado: { label: 'Solicitado', color: '#f59e0b' },
    aprovado: { label: 'Aprovado', color: '#22c55e' },
    negado: { label: 'Negado', color: '#ef4444' },
    executado: { label: 'Executado', color: '#94a3b8' },
};

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
const fmtCurrency = (v?: number) => v != null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) : '—';

// ─── Modals ────────────────────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px',
};
const modalBox: React.CSSProperties = {
    background: '#1a1b26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
    width: '100%', maxWidth: '520px', overflow: 'hidden',
};
const modalHeader: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)',
};
const modalBody: React.CSSProperties = { padding: '24px' };
const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '10px', fontSize: '14px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    color: '#fff', outline: 'none', boxSizing: 'border-box',
};
const textareaStyle: React.CSSProperties = { ...inputStyle, minHeight: '90px', resize: 'vertical', fontFamily: 'inherit' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', fontWeight: 600 };
const btnPrimary: React.CSSProperties = {
    padding: '10px 20px', borderRadius: '10px', background: 'var(--primary, #6366f1)',
    border: 'none', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
};
const btnSecondary: React.CSSProperties = {
    padding: '10px 20px', borderRadius: '10px', background: 'transparent',
    border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
};

// ─── Create Return Modal ───────────────────────────────────────────────────────

const CreateReturnModal: React.FC<{ onClose: () => void; onCreated: () => void }> = ({ onClose, onCreated }) => {
    const [orderId, setOrderId] = useState('');
    const [protocol, setProtocol] = useState('');
    const [defect, setDefect] = useState('');
    const [searching, setSearching] = useState(false);
    const [saving, setSaving] = useState(false);
    const [foundOrder, setFoundOrder] = useState<any>(null);
    const [searchError, setSearchError] = useState('');

    const searchOrder = async () => {
        if (!protocol.trim()) return;
        setSearching(true); setSearchError(''); setFoundOrder(null);
        try {
            const res = await api.get('/orders', { params: { protocol: protocol.trim() } });
            const orders: any[] = res.data?.data || res.data || [];
            const found = orders.find((o: any) => o.protocol?.toLowerCase() === protocol.trim().toLowerCase());
            if (found) { setFoundOrder(found); setOrderId(found.id); }
            else setSearchError('OS não encontrada. Verifique o protocolo.');
        } catch { setSearchError('Erro ao buscar OS.'); } finally { setSearching(false); }
    };

    const handleCreate = async () => {
        if (!orderId || !defect.trim()) { alert('Preencha todos os campos obrigatórios.'); return; }
        setSaving(true);
        try {
            await api.post('/warranties/returns', { originalOrderId: orderId, defectDescription: defect.trim() });
            onCreated();
        } catch (e: any) {
            alert(e.response?.data?.message || 'Erro ao criar retorno.');
        } finally { setSaving(false); }
    };

    return (
        <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={modalBox}>
                <div style={modalHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <RotateCcw size={18} color="#f59e0b" />
                        <span style={{ fontWeight: 700, color: '#fff', fontSize: '16px' }}>Novo Retorno de Garantia</span>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <div style={modalBody}>
                    <div style={{ marginBottom: '18px' }}>
                        <label style={labelStyle}>Protocolo da OS Original *</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input value={protocol} onChange={e => setProtocol(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && searchOrder()}
                                placeholder="ex: OS-0042" style={{ ...inputStyle, flex: 1 }} />
                            <button onClick={searchOrder} disabled={searching} style={{ ...btnPrimary, padding: '10px 16px' }}>
                                {searching ? '...' : 'Buscar'}
                            </button>
                        </div>
                        {searchError && <p style={{ color: '#ef4444', fontSize: '12px', margin: '6px 0 0' }}>{searchError}</p>}
                        {foundOrder && (
                            <div style={{ marginTop: '10px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                                <p style={{ margin: 0, fontSize: '13px', color: '#22c55e', fontWeight: 600 }}>✓ OS #{foundOrder.protocol} — {foundOrder.client?.name || foundOrder.clientName || '—'}</p>
                                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                                    Garantia: {foundOrder.warrantyExpiresAt ? fmtDate(foundOrder.warrantyExpiresAt) : `${foundOrder.warrantyDays || 90} dias`}
                                </p>
                            </div>
                        )}
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={labelStyle}>Descrição do Defeito *</label>
                        <textarea value={defect} onChange={e => setDefect(e.target.value)}
                            placeholder="Descreva o problema que o cliente está relatando..." style={textareaStyle} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button onClick={onClose} style={btnSecondary}>Cancelar</button>
                        <button onClick={handleCreate} disabled={saving || !orderId || !defect.trim()} style={{ ...btnPrimary, opacity: saving || !orderId || !defect.trim() ? 0.5 : 1 }}>
                            {saving ? 'Salvando...' : 'Criar Retorno'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Return Detail Modal ───────────────────────────────────────────────────────

const ReturnDetailModal: React.FC<{ item: WarrantyReturn; onClose: () => void; onUpdated: () => void }> = ({ item, onClose, onUpdated }) => {
    const [tab, setTab] = useState<'info' | 'evaluate' | 'decide'>('info');
    const [techEval, setTechEval] = useState(item.techEvaluation || '');
    const [isSameDefect, setIsSameDefect] = useState<boolean>(item.isSameDefect ?? true);
    const [warrantyValid, setWarrantyValid] = useState<boolean>(true);
    const [resolution, setResolution] = useState(item.resolution || '');
    const [denialReason, setDenialReason] = useState(item.denialReason || '');
    const [saving, setSaving] = useState(false);

    const status = RETURN_STATUS[item.status] || { label: item.status, color: '#94a3b8' };

    const handleEvaluate = async () => {
        if (!techEval.trim()) { alert('Informe a avaliação técnica.'); return; }
        setSaving(true);
        try {
            await api.patch(`/warranties/returns/${item.id}/evaluate`, { techEvaluation: techEval, isSameDefect });
            onUpdated();
        } catch (e: any) { alert(e.response?.data?.message || 'Erro ao salvar avaliação.'); }
        finally { setSaving(false); }
    };

    const handleDecide = async () => {
        if (warrantyValid && !resolution.trim()) { alert('Informe a resolução aprovada.'); return; }
        if (!warrantyValid && !denialReason.trim()) { alert('Informe o motivo da negação.'); return; }
        setSaving(true);
        try {
            await api.patch(`/warranties/returns/${item.id}/decide`, { warrantyValid, resolution, denialReason });
            onUpdated();
        } catch (e: any) { alert(e.response?.data?.message || 'Erro ao salvar decisão.'); }
        finally { setSaving(false); }
    };

    const handleComplete = async () => {
        if (!confirm('Confirmar conclusão do retorno?')) return;
        setSaving(true);
        try {
            await api.patch(`/warranties/returns/${item.id}/complete`, {});
            onUpdated();
        } catch (e: any) { alert(e.response?.data?.message || 'Erro.'); }
        finally { setSaving(false); }
    };

    return (
        <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ ...modalBox, maxWidth: '600px' }}>
                <div style={modalHeader}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <RotateCcw size={18} color={status.color} />
                            <span style={{ fontWeight: 700, color: '#fff', fontSize: '16px' }}>
                                Retorno — OS #{item.originalOrder?.protocol || item.originalOrderId.slice(0,8)}
                            </span>
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '20px', background: `${status.color}20`, color: status.color, border: `1px solid ${status.color}30` }}>
                                {status.label}
                            </span>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                            Aberto por {item.openedByName} em {fmtDate(item.createdAt)}
                            {!item.isWithinWarranty && <span style={{ color: '#ef4444', marginLeft: '8px' }}>⚠ Fora da garantia</span>}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={18} /></button>
                </div>

                {/* Tab bar */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 24px' }}>
                    {(['info', 'evaluate', 'decide'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)} style={{
                            padding: '12px 16px', background: 'none', border: 'none',
                            borderBottom: tab === t ? '2px solid var(--primary,#6366f1)' : '2px solid transparent',
                            color: tab === t ? 'var(--primary,#6366f1)' : 'rgba(255,255,255,0.4)',
                            fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                        }}>
                            {t === 'info' ? 'Informações' : t === 'evaluate' ? 'Avaliação Técnica' : 'Decisão'}
                        </button>
                    ))}
                </div>

                <div style={{ ...modalBody, maxHeight: '55vh', overflowY: 'auto' }}>
                    {tab === 'info' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <p style={labelStyle}>Defeito relatado pelo cliente</p>
                                <p style={{ margin: 0, color: '#fff', fontSize: '14px', background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    {item.defectDescription}
                                </p>
                            </div>
                            {item.techEvaluation && (
                                <div>
                                    <p style={labelStyle}>Avaliação Técnica</p>
                                    <p style={{ margin: 0, color: '#fff', fontSize: '14px', background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        {item.techEvaluation}
                                        <span style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                                            Mesmo defeito: {item.isSameDefect ? 'Sim' : 'Não'} — por {item.evaluatedByName}
                                        </span>
                                    </p>
                                </div>
                            )}
                            {item.resolution && (
                                <div>
                                    <p style={labelStyle}>Resolução Aprovada</p>
                                    <p style={{ margin: 0, color: '#22c55e', fontSize: '14px', background: 'rgba(34,197,94,0.06)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(34,197,94,0.15)' }}>{item.resolution}</p>
                                </div>
                            )}
                            {item.denialReason && (
                                <div>
                                    <p style={labelStyle}>Motivo da Negação</p>
                                    <p style={{ margin: 0, color: '#ef4444', fontSize: '14px', background: 'rgba(239,68,68,0.06)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.15)' }}>{item.denialReason}</p>
                                </div>
                            )}
                            {item.status === 'aprovada' && (
                                <button onClick={handleComplete} disabled={saving} style={{ ...btnPrimary, background: '#22c55e', opacity: saving ? 0.5 : 1 }}>
                                    {saving ? 'Salvando...' : '✓ Marcar como Concluído'}
                                </button>
                            )}
                        </div>
                    )}

                    {tab === 'evaluate' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={labelStyle}>Avaliação Técnica *</label>
                                <textarea value={techEval} onChange={e => setTechEval(e.target.value)}
                                    placeholder="Descreva o resultado da avaliação técnica do equipamento..." style={textareaStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>É o mesmo defeito da OS original?</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {[true, false].map(v => (
                                        <button key={String(v)} onClick={() => setIsSameDefect(v)} style={{
                                            padding: '8px 20px', borderRadius: '10px', border: '1px solid',
                                            borderColor: isSameDefect === v ? (v ? '#22c55e' : '#ef4444') : 'rgba(255,255,255,0.15)',
                                            background: isSameDefect === v ? (v ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)') : 'transparent',
                                            color: isSameDefect === v ? (v ? '#22c55e' : '#ef4444') : 'rgba(255,255,255,0.5)',
                                            fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                                        }}>
                                            {v ? 'Sim' : 'Não'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button onClick={handleEvaluate} disabled={saving || !techEval.trim()} style={{ ...btnPrimary, opacity: saving || !techEval.trim() ? 0.5 : 1 }}>
                                    {saving ? 'Salvando...' : 'Salvar Avaliação'}
                                </button>
                            </div>
                        </div>
                    )}

                    {tab === 'decide' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={labelStyle}>Decisão sobre a garantia</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {[true, false].map(v => (
                                        <button key={String(v)} onClick={() => setWarrantyValid(v)} style={{
                                            flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid',
                                            borderColor: warrantyValid === v ? (v ? '#22c55e' : '#ef4444') : 'rgba(255,255,255,0.15)',
                                            background: warrantyValid === v ? (v ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)') : 'transparent',
                                            color: warrantyValid === v ? (v ? '#22c55e' : '#ef4444') : 'rgba(255,255,255,0.5)',
                                            fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                                        }}>
                                            {v ? '✓ Garantia Válida' : '✗ Negar Garantia'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {warrantyValid ? (
                                <div>
                                    <label style={labelStyle}>Resolução *</label>
                                    <textarea value={resolution} onChange={e => setResolution(e.target.value)}
                                        placeholder="Descreva o que será feito para resolver o problema..." style={textareaStyle} />
                                </div>
                            ) : (
                                <div>
                                    <label style={labelStyle}>Motivo da Negação *</label>
                                    <textarea value={denialReason} onChange={e => setDenialReason(e.target.value)}
                                        placeholder="Explique por que a garantia está sendo negada..." style={textareaStyle} />
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button onClick={handleDecide} disabled={saving} style={{ ...btnPrimary, background: warrantyValid ? '#22c55e' : '#ef4444', opacity: saving ? 0.5 : 1 }}>
                                    {saving ? 'Salvando...' : warrantyValid ? 'Aprovar Garantia' : 'Negar Garantia'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Create Refund Modal ───────────────────────────────────────────────────────

const CreateRefundModal: React.FC<{ onClose: () => void; onCreated: () => void }> = ({ onClose, onCreated }) => {
    const [protocol, setProtocol] = useState('');
    const [orderId, setOrderId] = useState('');
    const [type, setType] = useState<'financeiro' | 'servico'>('financeiro');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [searching, setSearching] = useState(false);
    const [foundOrder, setFoundOrder] = useState<any>(null);
    const [searchError, setSearchError] = useState('');
    const [saving, setSaving] = useState(false);

    const searchOrder = async () => {
        if (!protocol.trim()) return;
        setSearching(true); setSearchError(''); setFoundOrder(null);
        try {
            const res = await api.get('/orders', { params: { protocol: protocol.trim() } });
            const orders: any[] = res.data?.data || res.data || [];
            const found = orders.find((o: any) => o.protocol?.toLowerCase() === protocol.trim().toLowerCase());
            if (found) { setFoundOrder(found); setOrderId(found.id); }
            else setSearchError('OS não encontrada.');
        } catch { setSearchError('Erro ao buscar OS.'); } finally { setSearching(false); }
    };

    const handleCreate = async () => {
        if (!orderId || !reason.trim()) { alert('Preencha todos os campos obrigatórios.'); return; }
        setSaving(true);
        try {
            await api.post('/warranties/refunds', {
                originalOrderId: orderId, type, reason: reason.trim(),
                amount: amount ? parseFloat(amount.replace(',', '.')) : undefined,
            });
            onCreated();
        } catch (e: any) { alert(e.response?.data?.message || 'Erro ao criar estorno.'); }
        finally { setSaving(false); }
    };

    return (
        <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={modalBox}>
                <div style={modalHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <DollarSign size={18} color="#f59e0b" />
                        <span style={{ fontWeight: 700, color: '#fff', fontSize: '16px' }}>Novo Estorno</span>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <div style={modalBody}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Protocolo da OS *</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input value={protocol} onChange={e => setProtocol(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && searchOrder()}
                                placeholder="ex: OS-0042" style={{ ...inputStyle, flex: 1 }} />
                            <button onClick={searchOrder} disabled={searching} style={{ ...btnPrimary, padding: '10px 16px' }}>
                                {searching ? '...' : 'Buscar'}
                            </button>
                        </div>
                        {searchError && <p style={{ color: '#ef4444', fontSize: '12px', margin: '6px 0 0' }}>{searchError}</p>}
                        {foundOrder && <p style={{ color: '#22c55e', fontSize: '12px', margin: '6px 0 0' }}>✓ OS #{foundOrder.protocol} — {foundOrder.client?.name || '—'}</p>}
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Tipo de Estorno</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {(['financeiro', 'servico'] as const).map(v => (
                                <button key={v} onClick={() => setType(v)} style={{
                                    flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid',
                                    borderColor: type === v ? 'var(--primary,#6366f1)' : 'rgba(255,255,255,0.15)',
                                    background: type === v ? 'rgba(99,102,241,0.12)' : 'transparent',
                                    color: type === v ? 'var(--primary,#6366f1)' : 'rgba(255,255,255,0.5)',
                                    fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                                }}>
                                    {v === 'financeiro' ? '💰 Financeiro' : '🔧 Serviço'}
                                </button>
                            ))}
                        </div>
                    </div>
                    {type === 'financeiro' && (
                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Valor (R$)</label>
                            <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" style={inputStyle} />
                        </div>
                    )}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={labelStyle}>Motivo do Estorno *</label>
                        <textarea value={reason} onChange={e => setReason(e.target.value)}
                            placeholder="Descreva o motivo do estorno..." style={textareaStyle} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button onClick={onClose} style={btnSecondary}>Cancelar</button>
                        <button onClick={handleCreate} disabled={saving || !orderId || !reason.trim()} style={{ ...btnPrimary, opacity: saving || !orderId || !reason.trim() ? 0.5 : 1 }}>
                            {saving ? 'Salvando...' : 'Criar Estorno'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Authorize Refund Modal ────────────────────────────────────────────────────

const AuthorizeRefundModal: React.FC<{ item: WarrantyRefund; onClose: () => void; onUpdated: () => void }> = ({ item, onClose, onUpdated }) => {
    const [adminNotes, setAdminNotes] = useState('');
    const [saving, setSaving] = useState(false);

    const handle = async (approved: boolean) => {
        if (!confirm(approved ? 'Aprovar e executar este estorno?' : 'Negar este estorno?')) return;
        setSaving(true);
        try {
            await api.patch(`/warranties/refunds/${item.id}/authorize`, { approved, adminNotes });
            onUpdated();
        } catch (e: any) { alert(e.response?.data?.message || 'Erro.'); }
        finally { setSaving(false); }
    };

    const status = REFUND_STATUS[item.status] || { label: item.status, color: '#94a3b8' };

    return (
        <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={modalBox}>
                <div style={modalHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <DollarSign size={18} color={status.color} />
                        <span style={{ fontWeight: 700, color: '#fff', fontSize: '16px' }}>Estorno — OS #{item.originalProtocol || item.originalOrderId.slice(0, 8)}</span>
                        <span style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '20px', background: `${status.color}20`, color: status.color, border: `1px solid ${status.color}30`, fontWeight: 700 }}>{status.label}</span>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <div style={modalBody}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                        <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <p style={{ ...labelStyle, margin: '0 0 4px' }}>Tipo</p>
                            <p style={{ margin: 0, color: '#fff', fontSize: '14px', fontWeight: 600 }}>{item.type === 'financeiro' ? '💰 Financeiro' : '🔧 Serviço'}</p>
                        </div>
                        {item.amount != null && (
                            <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <p style={{ ...labelStyle, margin: '0 0 4px' }}>Valor</p>
                                <p style={{ margin: 0, color: '#f59e0b', fontSize: '14px', fontWeight: 700 }}>{fmtCurrency(item.amount)}</p>
                            </div>
                        )}
                    </div>
                    <div style={{ marginBottom: '18px' }}>
                        <p style={labelStyle}>Motivo</p>
                        <p style={{ margin: 0, color: '#fff', fontSize: '14px', background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>{item.reason}</p>
                    </div>
                    {item.status === 'solicitado' && (
                        <>
                            <div style={{ marginBottom: '18px' }}>
                                <label style={labelStyle}>Observações do Admin</label>
                                <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
                                    placeholder="Observações (opcional)..." style={textareaStyle} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => handle(false)} disabled={saving} style={{ ...btnSecondary, flex: 1, borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444' }}>
                                    {saving ? '...' : '✗ Negar'}
                                </button>
                                <button onClick={() => handle(true)} disabled={saving} style={{ ...btnPrimary, flex: 1, background: '#22c55e', opacity: saving ? 0.5 : 1 }}>
                                    {saving ? '...' : '✓ Aprovar e Executar'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export const Warranty: React.FC = () => {
    const [mainTab, setMainTab] = useState<'ativas' | 'retornos' | 'estornos'>('ativas');

    // Garantias Ativas (existing)
    const [items, setItems] = useState<WarrantyOrder[]>([]);
    const [loadingItems, setLoadingItems] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');

    // Retornos
    const [returns, setReturns] = useState<WarrantyReturn[]>([]);
    const [loadingReturns, setLoadingReturns] = useState(false);
    const [returnFilter, setReturnFilter] = useState('');
    const [showCreateReturn, setShowCreateReturn] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState<WarrantyReturn | null>(null);

    // Estornos
    const [refunds, setRefunds] = useState<WarrantyRefund[]>([]);
    const [loadingRefunds, setLoadingRefunds] = useState(false);
    const [showCreateRefund, setShowCreateRefund] = useState(false);
    const [selectedRefund, setSelectedRefund] = useState<WarrantyRefund | null>(null);

    const loadItems = useCallback(async () => {
        setLoadingItems(true);
        try { const r = await api.get('/orders/warranty'); setItems(r.data || []); }
        catch { } finally { setLoadingItems(false); }
    }, []);

    const loadReturns = useCallback(async () => {
        setLoadingReturns(true);
        try { const r = await api.get('/warranties/returns'); setReturns(r.data || []); }
        catch { } finally { setLoadingReturns(false); }
    }, []);

    const loadRefunds = useCallback(async () => {
        setLoadingRefunds(true);
        try { const r = await api.get('/warranties/refunds'); setRefunds(r.data || []); }
        catch { } finally { setLoadingRefunds(false); }
    }, []);

    useEffect(() => { loadItems(); }, [loadItems]);
    useEffect(() => { if (mainTab === 'retornos') loadReturns(); }, [mainTab, loadReturns]);
    useEffect(() => { if (mainTab === 'estornos') loadRefunds(); }, [mainTab, loadRefunds]);

    const filteredItems = items.filter(i => {
        if (filter === 'active') return !i.isExpired && !i.isExpiringSoon;
        if (filter === 'expiring') return i.isExpiringSoon;
        if (filter === 'expired') return i.isExpired;
        return true;
    });

    const filteredReturns = returns.filter(r =>
        !returnFilter || r.status === returnFilter
    );

    const counts = {
        active: items.filter(i => !i.isExpired && !i.isExpiringSoon).length,
        expiring: items.filter(i => i.isExpiringSoon).length,
        expired: items.filter(i => i.isExpired).length,
    };

    const returnCounts = {
        pendente: returns.filter(r => r.status === 'pendente').length,
        em_avaliacao: returns.filter(r => r.status === 'em_avaliacao').length,
        aprovada: returns.filter(r => r.status === 'aprovada').length,
    };

    const refundCounts = {
        solicitado: refunds.filter(r => r.status === 'solicitado').length,
        executado: refunds.filter(r => r.status === 'executado').length,
    };

    const FILTERS = [
        { key: 'all', label: 'Todas', count: items.length, color: '#94a3b8' },
        { key: 'active', label: 'Ativas', count: counts.active, color: '#22c55e' },
        { key: 'expiring', label: 'Vencendo', count: counts.expiring, color: '#f59e0b' },
        { key: 'expired', label: 'Vencidas', count: counts.expired, color: '#ef4444' },
    ] as const;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Shield size={19} color="#22c55e" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Garantias</h1>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>
                            {mainTab === 'ativas' && `${items.length} equipamentos em garantia`}
                            {mainTab === 'retornos' && `${returns.length} retornos registrados`}
                            {mainTab === 'estornos' && `${refunds.length} estornos registrados`}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {mainTab === 'retornos' && (
                        <button onClick={() => setShowCreateReturn(true)} style={{
                            display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px',
                            borderRadius: '10px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                            color: 'var(--primary,#6366f1)', cursor: 'pointer', fontSize: '13px', fontWeight: 700,
                            minHeight: '44px',
                        }}>
                            <Plus size={15} /> Novo Retorno
                        </button>
                    )}
                    {mainTab === 'estornos' && (
                        <button onClick={() => setShowCreateRefund(true)} style={{
                            display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px',
                            borderRadius: '10px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)',
                            color: '#f59e0b', cursor: 'pointer', fontSize: '13px', fontWeight: 700, minHeight: '44px',
                        }}>
                            <Plus size={15} /> Novo Estorno
                        </button>
                    )}
                    <button onClick={() => mainTab === 'ativas' ? loadItems() : mainTab === 'retornos' ? loadReturns() : loadRefunds()}
                        style={{ padding: '9px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* Main tabs */}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                {([
                    { key: 'ativas', label: '🛡️ Garantias Ativas', count: items.length },
                    { key: 'retornos', label: '🔄 Retornos', count: returns.length || returnCounts.pendente || undefined },
                    { key: 'estornos', label: '💰 Estornos', count: refunds.length || refundCounts.solicitado || undefined },
                ] as const).map(t => (
                    <button key={t.key} onClick={() => setMainTab(t.key)} style={{
                        flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                        background: mainTab === t.key ? 'rgba(255,255,255,0.08)' : 'transparent',
                        color: mainTab === t.key ? '#fff' : 'rgba(255,255,255,0.4)',
                        fontWeight: mainTab === t.key ? 700 : 500, fontSize: '13px', cursor: 'pointer',
                        transition: 'all 0.15s',
                    }}>
                        {t.label}
                        {(mainTab !== t.key && t.count && t.count > 0) ? <span style={{ marginLeft: '6px', fontSize: '11px', background: 'rgba(255,255,255,0.1)', padding: '1px 7px', borderRadius: '20px' }}>{t.count}</span> : null}
                    </button>
                ))}
            </div>

            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

            {/* ── Garantias Ativas ── */}
            {mainTab === 'ativas' && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
                        {FILTERS.map(f => (
                            <button key={f.key} onClick={() => setFilter(f.key)} style={{
                                padding: '12px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                                background: filter === f.key ? `${f.color}15` : 'var(--bg-secondary)',
                                border: `1px solid ${filter === f.key ? f.color + '40' : 'var(--border-color)'}`,
                                transition: 'all 0.15s',
                            }}>
                                <div style={{ fontSize: '22px', fontWeight: 800, color: filter === f.key ? f.color : '#fff' }}>{f.count}</div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>{f.label}</div>
                            </button>
                        ))}
                    </div>
                    {loadingItems ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Carregando...
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                            <Shield size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
                            <p style={{ margin: 0 }}>Nenhuma garantia encontrada</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {filteredItems.map(item => {
                                const color = item.isExpired ? '#ef4444' : item.isExpiringSoon ? '#f59e0b' : '#22c55e';
                                const Icon = item.isExpired ? XCircle : item.isExpiringSoon ? AlertTriangle : CheckCircle;
                                return (
                                    <div key={item.id} style={{ background: 'var(--bg-secondary)', border: `1px solid ${color}25`, borderLeft: `3px solid ${color}`, borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
                                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Icon size={18} color={color} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                                <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: 'var(--accent-primary)' }}>#{item.protocol}</span>
                                                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: `${color}15`, color, border: `1px solid ${color}30` }}>
                                                    {item.isExpired ? 'Vencida' : item.isExpiringSoon ? `Vence em ${item.daysLeft}d` : `${item.daysLeft} dias restantes`}
                                                </span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '6px' }}>
                                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                                                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginRight: '4px' }}>Cliente</span>
                                                    <span style={{ fontWeight: 500 }}>{item.clientName}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                                                    <Smartphone size={12} color="rgba(255,255,255,0.3)" /> {item.equipment}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                                                    <Calendar size={12} /> Entregue: {fmtDate(item.exitDate)}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: item.isExpired ? '#ef4444' : 'rgba(255,255,255,0.4)' }}>
                                                    <Shield size={12} /> Vence: {fmtDate(item.warrantyExpiresAt)}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                            {item.clientPhone && (
                                                <a href={`https://wa.me/${item.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${item.clientName}! Referente à OS #${item.protocol} (${item.equipment})`)}`}
                                                    target="_blank" rel="noopener noreferrer"
                                                    style={{ padding: '8px', borderRadius: '8px', background: 'rgba(37,211,102,0.1)', color: '#25d366', border: '1px solid rgba(37,211,102,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '34px', minHeight: '34px' }}>
                                                    <Phone size={14} />
                                                </a>
                                            )}
                                            <a href={`/orders?open=${item.id}`}
                                                style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(59,130,246,0.08)', color: 'var(--accent-primary)', border: '1px solid rgba(59,130,246,0.2)', fontSize: '12px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', minHeight: '34px' }}>
                                                Ver OS
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* ── Retornos ── */}
            {mainTab === 'retornos' && (
                <>
                    {/* Mini stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px' }}>
                        {[
                            { key: '', label: 'Todos', count: returns.length, color: '#94a3b8' },
                            { key: 'pendente', label: 'Pendentes', count: returnCounts.pendente, color: '#f59e0b' },
                            { key: 'em_avaliacao', label: 'Avaliação', count: returnCounts.em_avaliacao, color: '#3b82f6' },
                            { key: 'aprovada', label: 'Aprovados', count: returnCounts.aprovada, color: '#22c55e' },
                        ].map(f => (
                            <button key={f.key} onClick={() => setReturnFilter(f.key)} style={{
                                padding: '12px', borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                                background: returnFilter === f.key ? `${f.color}15` : 'var(--bg-secondary)',
                                border: `1px solid ${returnFilter === f.key ? f.color + '40' : 'var(--border-color)'}`,
                                transition: 'all 0.15s',
                            }}>
                                <div style={{ fontSize: '20px', fontWeight: 800, color: returnFilter === f.key ? f.color : '#fff' }}>{f.count}</div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>{f.label}</div>
                            </button>
                        ))}
                    </div>

                    {loadingReturns ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Carregando...
                        </div>
                    ) : filteredReturns.length === 0 ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                            <RotateCcw size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
                            <p style={{ margin: 0 }}>Nenhum retorno encontrado</p>
                            <button onClick={() => setShowCreateReturn(true)} style={{ ...btnPrimary, marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <Plus size={14} /> Criar Primeiro Retorno
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {filteredReturns.map(item => {
                                const st = RETURN_STATUS[item.status] || { label: item.status, color: '#94a3b8' };
                                return (
                                    <div key={item.id} onClick={() => setSelectedReturn(item)}
                                        style={{ background: 'var(--bg-secondary)', border: `1px solid ${st.color}20`, borderLeft: `3px solid ${st.color}`, borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', transition: 'background 0.15s' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                                <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                                                    OS #{item.originalOrder?.protocol || item.originalOrderId.slice(0, 8)}
                                                </span>
                                                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '20px', background: `${st.color}20`, color: st.color, border: `1px solid ${st.color}30` }}>{st.label}</span>
                                                {!item.isWithinWarranty && <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>⚠ Fora da garantia</span>}
                                            </div>
                                            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {item.defectDescription}
                                            </p>
                                            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                                                <Clock size={10} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                                {fmtDate(item.createdAt)} — por {item.openedByName}
                                            </p>
                                        </div>
                                        <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* ── Estornos ── */}
            {mainTab === 'estornos' && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px' }}>
                        {[
                            { label: 'Total', count: refunds.length, color: '#94a3b8' },
                            { label: 'Solicitados', count: refundCounts.solicitado, color: '#f59e0b' },
                            { label: 'Executados', count: refundCounts.executado, color: '#22c55e' },
                        ].map(f => (
                            <div key={f.label} style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '20px', fontWeight: 800, color: f.color }}>{f.count}</div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>{f.label}</div>
                            </div>
                        ))}
                    </div>

                    {loadingRefunds ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Carregando...
                        </div>
                    ) : refunds.length === 0 ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                            <DollarSign size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
                            <p style={{ margin: 0 }}>Nenhum estorno registrado</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {refunds.map(item => {
                                const st = REFUND_STATUS[item.status] || { label: item.status, color: '#94a3b8' };
                                return (
                                    <div key={item.id} onClick={() => setSelectedRefund(item)}
                                        style={{ background: 'var(--bg-secondary)', border: `1px solid ${st.color}20`, borderLeft: `3px solid ${st.color}`, borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', transition: 'background 0.15s' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                                <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: 'var(--accent-primary)' }}>OS #{item.originalProtocol || item.originalOrderId.slice(0, 8)}</span>
                                                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '20px', background: `${st.color}20`, color: st.color, border: `1px solid ${st.color}30` }}>{st.label}</span>
                                                <span style={{ fontSize: '11px', color: item.type === 'financeiro' ? '#f59e0b' : '#3b82f6', fontWeight: 600 }}>
                                                    {item.type === 'financeiro' ? '💰' : '🔧'} {item.type}
                                                </span>
                                                {item.amount != null && <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 700 }}>{fmtCurrency(item.amount)}</span>}
                                            </div>
                                            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {item.reason}
                                            </p>
                                            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                                                <Clock size={10} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                                {fmtDate(item.createdAt)} — por {item.requestedByName}
                                            </p>
                                        </div>
                                        <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* Modals */}
            {showCreateReturn && (
                <CreateReturnModal onClose={() => setShowCreateReturn(false)} onCreated={() => { setShowCreateReturn(false); loadReturns(); }} />
            )}
            {selectedReturn && (
                <ReturnDetailModal item={selectedReturn} onClose={() => setSelectedReturn(null)} onUpdated={() => { setSelectedReturn(null); loadReturns(); }} />
            )}
            {showCreateRefund && (
                <CreateRefundModal onClose={() => setShowCreateRefund(false)} onCreated={() => { setShowCreateRefund(false); loadRefunds(); }} />
            )}
            {selectedRefund && (
                <AuthorizeRefundModal item={selectedRefund} onClose={() => setSelectedRefund(null)} onUpdated={() => { setSelectedRefund(null); loadRefunds(); }} />
            )}
        </div>
    );
};
