import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
    FileText, Plus, Trash2, Save, Send, CheckCircle, XCircle,
    Download, RefreshCw, Edit3, AlertCircle, Clock, Ban,
    ChevronDown, ChevronUp, Zap, Copy,
} from 'lucide-react';
import type { Order } from '../../types';

// ── Tipos ────────────────────────────────────────────────────
interface QuoteItem {
    id: string; type: 'service' | 'part' | 'other';
    description: string; quantity: number; unitPrice: number; total: number; warranty?: string;
}
interface QuoteDoc {
    id: string; orderId: string; version: number;
    status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired' | 'canceled';
    subtotal: number; discountPercent: number; discountValue: number; total: number;
    paymentCondition?: string; deliveryDays?: number; warrantyDays?: number;
    validUntil?: string; notes?: string;
    approvedAt?: string; approvedByName?: string;
    rejectedAt?: string; rejectionReason?: string;
    sentAt?: string; itemsJson: string; createdAt: string;
}

// ── Utils ────────────────────────────────────────────────────
const R$ = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    draft:    { label: 'Rascunho',  color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: Edit3 },
    sent:     { label: 'Enviado',   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  icon: Send },
    approved: { label: 'Aprovado',  color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   icon: CheckCircle },
    rejected: { label: 'Rejeitado', color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: XCircle },
    expired:  { label: 'Expirado',  color: '#f97316', bg: 'rgba(249,115,22,0.12)',  icon: Clock },
    canceled: { label: 'Cancelado', color: '#6b7280', bg: 'rgba(107,114,128,0.1)',  icon: Ban },
};

const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' };

// ── Item row ─────────────────────────────────────────────────
const ItemRow: React.FC<{
    item: QuoteItem; onChange: (item: QuoteItem) => void; onDelete: () => void; readOnly?: boolean;
}> = ({ item, onChange, onDelete, readOnly }) => {
    const set = (k: keyof QuoteItem, v: any) => {
        const updated = { ...item, [k]: v };
        if (k === 'quantity' || k === 'unitPrice') {
            updated.total = Number(updated.quantity) * Number(updated.unitPrice);
        }
        onChange(updated);
    };
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.7fr 1fr 1fr auto', gap: '8px', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div>
                <select value={item.type} onChange={e => set('type', e.target.value)} disabled={readOnly} style={{ ...inp, width: 'auto', marginBottom: '5px', fontSize: '11px', padding: '4px 8px', color: item.type === 'service' ? '#60a5fa' : item.type === 'part' ? '#a78bfa' : '#94a3b8' }}>
                    <option value="service">Serviço</option>
                    <option value="part">Peça</option>
                    <option value="other">Outro</option>
                </select>
                <input value={item.description} onChange={e => set('description', e.target.value)} readOnly={readOnly} placeholder="Descrição do item..." style={{ ...inp, fontSize: '13px' }} />
            </div>
            <input type="number" min="1" value={item.quantity} onChange={e => set('quantity', Number(e.target.value))} readOnly={readOnly} style={{ ...inp, textAlign: 'center' }} />
            <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>R$</span>
                <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => set('unitPrice', Number(e.target.value))} readOnly={readOnly} style={{ ...inp, paddingLeft: '28px' }} />
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#22c55e', textAlign: 'right', paddingRight: '4px' }}>{R$(item.total)}</div>
            {!readOnly && (
                <button onClick={onDelete} style={{ padding: '7px', borderRadius: '7px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={13}/>
                </button>
            )}
        </div>
    );
};

// ── Componente principal ──────────────────────────────────────
export const QuoteTab: React.FC<{ order: Order }> = ({ order }) => {
    const [quotes, setQuotes]       = useState<QuoteDoc[]>([]);
    const [loading, setLoading]     = useState(true);
    const [saving, setSaving]       = useState(false);
    const [downloading, setDl]      = useState(false);
    const [editing, setEditing]     = useState(false);
    const [msg, setMsg]             = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
    const [actionLoading, setAct]   = useState<string | null>(null);

    // Form state
    const [items, setItems]         = useState<QuoteItem[]>([]);
    const [discount, setDiscount]   = useState('0');
    const [payment, setPayment]     = useState('À vista ou 2x sem juros no cartão');
    const [warranty, setWarranty]   = useState('90');
    const [delivery, setDelivery]   = useState('');
    const [validDays, setValidDays] = useState('7');
    const [notes, setNotes]         = useState('');

    const showMsg = (type: 'ok' | 'err', text: string) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 4000); };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await api.get(`/quotes/order/${order.id}`);
            setQuotes(r.data || []);
            // Preencher form com o mais recente se for draft
            const latest = r.data?.[0];
            if (latest && latest.status === 'draft') {
                try {
                    setItems(JSON.parse(latest.itemsJson || '[]'));
                    setDiscount(String(latest.discountPercent || 0));
                    setPayment(latest.paymentCondition || 'À vista ou 2x sem juros no cartão');
                    setWarranty(String(latest.warrantyDays || 90));
                    setDelivery(String(latest.deliveryDays || ''));
                    setValidDays('7');
                    setNotes(latest.notes || '');
                } catch {}
            }
        } catch { }
        finally { setLoading(false); }
    }, [order.id]);

    useEffect(() => { load(); }, [load]);

    const addItem = (type: 'service' | 'part' | 'other' = 'service') => {
        setItems(prev => [...prev, { id: Date.now().toString(), type, description: '', quantity: 1, unitPrice: 0, total: 0 }]);
    };

    const autoFill = async () => {
        try {
            const r = await api.get(`/quotes/order/${order.id}/auto-fill`);
            setItems(r.data || []);
            showMsg('ok', 'Itens preenchidos automaticamente das peças da OS');
        } catch { showMsg('err', 'Erro ao preencher automaticamente'); }
    };

    const subtotal = items.reduce((s, i) => s + i.total, 0);
    const discountVal = subtotal * (Number(discount) / 100);
    const total = subtotal - discountVal;

    const save = async () => {
        if (items.length === 0) { showMsg('err', 'Adicione pelo menos um item'); return; }
        setSaving(true);
        try {
            await api.post(`/quotes/order/${order.id}`, {
                items, discountPercent: Number(discount),
                paymentCondition: payment, warrantyDays: Number(warranty),
                deliveryDays: delivery ? Number(delivery) : undefined,
                validDays: Number(validDays), notes,
            });
            showMsg('ok', 'Orçamento salvo!');
            setEditing(false);
            load();
        } catch { showMsg('err', 'Erro ao salvar orçamento'); }
        finally { setSaving(false); }
    };

    const sendQuote = async (id: string) => {
        setAct('send-' + id);
        try {
            await api.patch(`/quotes/${id}/send`);
            showMsg('ok', 'Orçamento marcado como enviado');
            load();
        } catch { showMsg('err', 'Erro'); }
        finally { setAct(null); }
    };

    const downloadPdf = async (id: string, version: number) => {
        setDl(true);
        try {
            const token = localStorage.getItem('@OS:token');
            const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3005';
            const res = await fetch(`${apiUrl}/quotes/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error('PDF indisponível');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `Orcamento-${order.protocol}-v${version}.pdf`; a.click();
            URL.revokeObjectURL(url);
        } catch { showMsg('err', 'Erro ao gerar PDF'); }
        finally { setDl(false); }
    };

    const changeStatus = async (id: string, action: 'approve' | 'reject' | 'cancel', body?: any) => {
        setAct(action + '-' + id);
        try {
            await api.patch(`/quotes/${id}/${action}`, body || {});
            showMsg('ok', 'Status atualizado');
            load();
        } catch { showMsg('err', 'Erro'); }
        finally { setAct(null); }
    };

    const latest = quotes[0];
    const isReadOnly = (latest && latest.status !== 'draft') || order.status === 'finalizada' || order.status === 'entregue';
    const canEdit = (!latest || latest.status === 'draft') && order.status !== 'finalizada' && order.status !== 'entregue';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} color="#3b82f6"/>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>Orçamento Formal</span>
                    {latest && (
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', background: STATUS_CFG[latest.status].bg, color: STATUS_CFG[latest.status].color }}>
                            {STATUS_CFG[latest.status].label} · v{latest.version}
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {canEdit && !editing && (
                        <button onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#3b82f6', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                            <Edit3 size={13}/> {latest ? 'Editar' : 'Criar Orçamento'}
                        </button>
                    )}
                    {!editing && items.length > 0 && (
                        <button onClick={autoFill} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                            <Zap size={13}/> Auto-preencher
                        </button>
                    )}
                    {latest && (
                        <button onClick={() => downloadPdf(latest.id, latest.version)} disabled={downloading} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                            {downloading ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }}/> : <Download size={13}/>} PDF
                        </button>
                    )}
                </div>
            </div>

            {msg && (
                <div style={{ padding: '10px 14px', borderRadius: '9px', background: msg.type === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${msg.type === 'ok' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`, color: msg.type === 'ok' ? '#22c55e' : '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                    {msg.type === 'ok' ? <CheckCircle size={14}/> : <AlertCircle size={14}/>} {msg.text}
                </div>
            )}

            {/* Form de edição */}
            {(editing || (!latest && items.length === 0)) && (
                <div style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '12px', padding: '16px' }}>
                    {/* Botões de adicionar item */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Itens do Orçamento</span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={autoFill} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '7px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                                <Zap size={12}/> Importar peças da OS
                            </button>
                            <button onClick={() => addItem('service')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '7px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                                <Plus size={12}/> Serviço
                            </button>
                            <button onClick={() => addItem('part')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '7px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                                <Plus size={12}/> Peça
                            </button>
                        </div>
                    </div>

                    {/* Cabeçalho da tabela */}
                    {items.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.7fr 1fr 1fr auto', gap: '8px', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '4px' }}>
                            {['Descrição', 'Qtd', 'Valor unit.', 'Total', ''].map((h, i) => (
                                <span key={i} style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: i === 3 ? 'right' : 'left' }}>{h}</span>
                            ))}
                        </div>
                    )}

                    {items.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                            <FileText size={28} style={{ opacity: 0.2 }}/>
                            Nenhum item. Use os botões acima ou importe as peças da OS.
                        </div>
                    ) : (
                        items.map((item, i) => (
                            <ItemRow key={item.id} item={item} onChange={updated => setItems(prev => prev.map((it, idx) => idx === i ? updated : it))} onDelete={() => setItems(prev => prev.filter((_, idx) => idx !== i))} />
                        ))
                    )}

                    {/* Totais */}
                    {items.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                            <div style={{ minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                                    <span>Subtotal:</span><span>{R$(subtotal)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Desconto:</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <input type="number" min="0" max="100" value={discount} onChange={e => setDiscount(e.target.value)} style={{ ...inp, width: '60px', textAlign: 'center', fontSize: '12px', padding: '5px 8px' }} />
                                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>%</span>
                                        <span style={{ fontSize: '12px', color: '#ef4444', minWidth: '80px', textAlign: 'right' }}>-{R$(discountVal)}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, color: '#22c55e', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                                    <span>TOTAL:</span><span>{R$(total)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Condições */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                        <div><label style={lbl}>Pagamento</label><input value={payment} onChange={e => setPayment(e.target.value)} style={inp} placeholder="Ex: À vista ou 2x" /></div>
                        <div><label style={lbl}>Garantia (dias)</label><input type="number" value={warranty} onChange={e => setWarranty(e.target.value)} style={inp} placeholder="90" /></div>
                        <div><label style={lbl}>Prazo entrega (dias)</label><input type="number" value={delivery} onChange={e => setDelivery(e.target.value)} style={inp} placeholder="3" /></div>
                        <div><label style={lbl}>Validade orçamento (dias)</label><input type="number" value={validDays} onChange={e => setValidDays(e.target.value)} style={inp} placeholder="7" /></div>
                        <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Observações</label><textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ ...inp, minHeight: '60px', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} placeholder="Informações adicionais, exclusões de garantia..." /></div>
                    </div>

                    {/* Ações do form */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                        <button onClick={() => setEditing(false)} style={{ padding: '10px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
                        <button onClick={save} disabled={saving || items.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '8px', background: items.length > 0 ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontWeight: 700, cursor: items.length > 0 ? 'pointer' : 'not-allowed', fontSize: '13px', opacity: saving ? 0.7 : 1 }}>
                            {saving ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }}/> : <Save size={14}/>}
                            {saving ? 'Salvando...' : 'Salvar Rascunho'}
                        </button>
                    </div>
                </div>
            )}

            {/* Lista de orçamentos */}
            {loading ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }}/> Carregando...
                </div>
            ) : quotes.length === 0 && !editing ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <FileText size={32} style={{ opacity: 0.2 }}/>
                    <p style={{ margin: 0, fontSize: '14px' }}>Nenhum orçamento gerado ainda</p>
                    <button onClick={() => { setEditing(true); autoFill(); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '9px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#3b82f6', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                        <Plus size={14}/> Criar orçamento
                    </button>
                </div>
            ) : (
                quotes.map((q, qi) => {
                    const cfg = STATUS_CFG[q.status] || STATUS_CFG.draft;
                    const Icon = cfg.icon;
                    const qItems: QuoteItem[] = (() => { try { return JSON.parse(q.itemsJson); } catch { return []; } })();
                    const [expanded, setExpanded] = React.useState(qi === 0);

                    return (
                        <div key={q.id} style={{ background: 'var(--bg-secondary)', border: `1px solid ${qi === 0 ? cfg.color + '30' : 'var(--border-color)'}`, borderRadius: '12px', overflow: 'hidden' }}>
                            {/* Header do orçamento */}
                            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>
                                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Icon size={14} color={cfg.color}/>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Versão {q.version}</span>
                                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                                        {q.validUntil && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Válido até {fmtDate(q.validUntil)}</span>}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                        {qItems.length} item{qItems.length !== 1 ? 's' : ''} · {fmtDate(q.createdAt)}
                                        {q.sentAt && ` · Enviado em ${fmtDate(q.sentAt)}`}
                                        {q.approvedAt && ` · Aprovado por ${q.approvedByName} em ${fmtDate(q.approvedAt)}`}
                                    </div>
                                </div>
                                <div style={{ fontSize: '18px', fontWeight: 900, color: cfg.color, letterSpacing: '-0.5px' }}>{R$(q.total)}</div>
                                {expanded ? <ChevronUp size={16} color="rgba(255,255,255,0.3)"/> : <ChevronDown size={16} color="rgba(255,255,255,0.3)"/>}
                            </div>

                            {/* Conteúdo expandido */}
                            {expanded && (
                                <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                    {/* Itens */}
                                    <div style={{ marginTop: '14px' }}>
                                        {qItems.map(item => (
                                            <ItemRow key={item.id} item={item} onChange={() => {}} onDelete={() => {}} readOnly />
                                        ))}
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '13px' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Subtotal: {R$(q.subtotal)}</span>
                                            {Number(q.discountPercent) > 0 && <span style={{ color: '#ef4444' }}>Desconto {q.discountPercent}%: -{R$(q.discountValue)}</span>}
                                            <span style={{ fontSize: '15px', fontWeight: 800, color: '#22c55e' }}>Total: {R$(q.total)}</span>
                                        </div>
                                    </div>

                                    {/* Condições */}
                                    {(q.paymentCondition || q.warrantyDays || q.deliveryDays) && (
                                        <div style={{ display: 'flex', gap: '14px', marginTop: '12px', flexWrap: 'wrap', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                            {q.paymentCondition && <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>💳 {q.paymentCondition}</span>}
                                            {q.warrantyDays && <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>🛡️ {q.warrantyDays} dias de garantia</span>}
                                            {q.deliveryDays && <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>📅 Prazo: {q.deliveryDays} dias</span>}
                                        </div>
                                    )}

                                    {/* Aprovação/Rejeição */}
                                    {q.status === 'approved' && (
                                        <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '9px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <CheckCircle size={14} color="#22c55e"/>
                                            <span style={{ fontSize: '13px', color: '#22c55e', fontWeight: 600 }}>Aprovado por {q.approvedByName} em {fmtDate(q.approvedAt)}</span>
                                        </div>
                                    )}
                                    {q.status === 'rejected' && q.rejectionReason && (
                                        <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '9px' }}>
                                            <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 700, marginBottom: '4px' }}>Motivo da rejeição:</div>
                                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{q.rejectionReason}</div>
                                        </div>
                                    )}

                                    {/* Ações */}
                                    <div style={{ display: 'flex', gap: '7px', marginTop: '14px', flexWrap: 'wrap' }}>
                                        <button onClick={() => downloadPdf(q.id, q.version)} disabled={downloading} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', minHeight: '36px' }}>
                                            <Download size={13}/> Baixar PDF
                                        </button>
                                        {q.status === 'draft' && (
                                            <button onClick={() => sendQuote(q.id)} disabled={actionLoading === 'send-' + q.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#3b82f6', fontSize: '12px', fontWeight: 600, cursor: 'pointer', minHeight: '36px' }}>
                                                <Send size={13}/> Marcar como Enviado
                                            </button>
                                        )}
                                        {(q.status === 'draft' || q.status === 'sent') && (
                                            <>
                                                <button onClick={() => changeStatus(q.id, 'approve', { clientName: 'Aprovado internamente' })} disabled={actionLoading === 'approve-' + q.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', borderRadius: '8px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e', fontSize: '12px', fontWeight: 600, cursor: 'pointer', minHeight: '36px' }}>
                                                    <CheckCircle size={13}/> Aprovar
                                                </button>
                                                <button onClick={() => { const reason = prompt('Motivo da rejeição:'); if (reason !== null) changeStatus(q.id, 'reject', { reason }); }} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer', minHeight: '36px' }}>
                                                    <XCircle size={13}/> Rejeitar
                                                </button>
                                            </>
                                        )}
                                        {q.status !== 'canceled' && q.status !== 'approved' && (
                                            <button onClick={() => changeStatus(q.id, 'cancel')} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(107,114,128,0.08)', border: '1px solid rgba(107,114,128,0.15)', color: '#9ca3af', fontSize: '12px', cursor: 'pointer', minHeight: '36px' }}>
                                                <Ban size={13}/> Cancelar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
};
