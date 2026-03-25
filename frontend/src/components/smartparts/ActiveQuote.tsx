import { useState, useEffect, useMemo } from 'react';
import {
    Clock, MessageCircle, CheckCircle, RefreshCw,
    Send, Loader2, ChevronDown, ChevronUp, Star, Truck, Plus, Search, X,
} from 'lucide-react';
import api from '../../services/api';

// ── Tipos ──────────────────────────────────────────────────────
interface ParsedOption { description: string; price: number; quality?: string; }
interface SupplierStatus {
    id: string; name: string; phone: string; reliability: number;
    deliveryDays: number; responseRatePercent: number;
    responded: boolean; price: number | null; message: string | null;
    responseType: 'single' | 'multiple' | 'no_stock' | 'greeting';
    parsedOptions: ParsedOption[];
    deliveryDaysResponse: number | null;
    receivedAt: string | null;
}
interface Quote {
    id: string; productName: string;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
    expiresAt: string; bestPrice: number | null; winnerId?: string;
    winner?: { name: string };
    createdAt: string;
}
interface SupplierInfo { id: string; name: string; phone: string; active: boolean; reliability: number; }

// ── Helpers ────────────────────────────────────────────────────
const fmtR$ = (v: number) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;
const fmtTime = (d: string) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const QUALITY: Record<string, { label: string; color: string; bg: string }> = {
    original:   { label: 'Original',    color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    oled:       { label: 'OLED',        color: '#60a5fa', bg: 'rgba(59,130,246,0.12)' },
    oled_china: { label: 'OLED China',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    amoled:     { label: 'AMOLED',      color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
    incell:     { label: 'Incell',      color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
    nacional:   { label: 'Nacional',    color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    premium:    { label: 'Premium',     color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
    generico:   { label: 'Genérico',    color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
    padrao:     { label: '',            color: '#94a3b8', bg: 'rgba(255,255,255,0.06)' },
};

const Stars: React.FC<{ n: number }> = ({ n }) => (
    <span style={{ display: 'flex', gap: '1px' }}>
        {[1,2,3,4,5].map(i => (
            <Star key={i} size={10} fill={i <= n ? '#f59e0b' : 'none'} color={i <= n ? '#f59e0b' : 'rgba(255,255,255,0.2)'} />
        ))}
    </span>
);

const QualityOption: React.FC<{
    opt: ParsedOption; isLowest: boolean; isWinner: boolean;
    onSelect: () => void; disabled: boolean; quoteCompleted: boolean;
}> = ({ opt, isLowest, isWinner, onSelect, disabled, quoteCompleted }) => {
    const q = QUALITY[opt.quality || 'padrao'] || QUALITY.padrao;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', background: isWinner ? 'rgba(34,197,94,0.15)' : isLowest ? 'rgba(34,197,94,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isWinner ? '#22c55e' : isLowest ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '8px' }}>
            {q.label && <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: q.bg, color: q.color, border: `1px solid ${q.color}30`, flexShrink: 0 }}>{q.label}</span>}
            <span style={{ flex: 1, fontSize: '13px', color: isWinner ? '#fff' : 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.description}</span>
            <span style={{ fontSize: '15px', fontWeight: 700, color: isWinner ? '#22c55e' : isLowest ? '#22c55e' : '#fff', flexShrink: 0 }}>{fmtR$(opt.price)}</span>
            {isLowest && !isWinner && <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: 'rgba(34,197,94,0.15)', color: '#22c55e', flexShrink: 0 }}>menor</span>}
            {isWinner && <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: '#22c55e', color: '#000', flexShrink: 0 }}>COMPRADO</span>}
            {!isWinner && (
                <button onClick={onSelect} disabled={disabled} style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', fontSize: '11px', fontWeight: 700, background: quoteCompleted ? 'rgba(99,102,241,0.2)' : '#6366f1', color: quoteCompleted ? '#a5b4fc' : '#fff', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, flexShrink: 0 }}>
                    {quoteCompleted ? 'Trocar' : 'Comprar'}
                </button>
            )}
        </div>
    );
};

// ── Modal de confirmação de compra ─────────────────────────────
const BuyModal: React.FC<{
    supplierName: string;
    opt: ParsedOption;
    onConfirm: (message: string) => Promise<void>;
    onClose: () => void;
}> = ({ supplierName, opt, onConfirm, onClose }) => {
    const priceStr = Number(opt.price).toFixed(2).replace('.', ',');
    const defaultMsg = `✅ *PEDIDO APROVADO!*\n\nOlá ${supplierName}, pode confirmar o pedido da peça:\n\n*${opt.description}* (R$ ${priceStr})\n\nQual o prazo de entrega? 📦\n\nMuito obrigado! 🙏`;
    const [msg, setMsg] = useState(defaultMsg);
    const [sending, setSending] = useState(false);

    const handleConfirm = async () => {
        setSending(true);
        try { await onConfirm(msg); }
        finally { setSending(false); }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}>
            <div style={{ background: '#1a1b26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>Confirmar Compra</span>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ padding: '12px 14px', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '10px' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>Fornecedor</div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{supplierName}</div>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', marginTop: '4px' }}>{opt.description}</div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#22c55e', marginTop: '4px' }}>R$ {priceStr}</div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Mensagem que será enviada ao fornecedor</label>
                        <textarea
                            value={msg}
                            onChange={e => setMsg(e.target.value)}
                            rows={8}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'rgba(255,255,255,0.8)', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }}
                        />
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>Você pode editar a mensagem antes de enviar.</div>
                    </div>
                </div>
                <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} disabled={sending} style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer' }}>Cancelar</button>
                    <button onClick={handleConfirm} disabled={sending} style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: sending ? 'rgba(34,197,94,0.5)' : '#22c55e', color: '#000', fontWeight: 700, fontSize: '13px', cursor: sending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {sending ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Enviando...</> : <><Send size={13} />Confirmar e Enviar</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Modal de nova cotação ──────────────────────────────────────
const StartModal: React.FC<{
    onClose: () => void;
    onSend: (productName: string, supplierIds: string[], message: string) => Promise<void>;
}> = ({ onClose, onSend }) => {
    const [productName, setProductName] = useState('');
    const [suppliers, setSuppliers] = useState<SupplierInfo[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState('');
    const [sending, setSending] = useState(false);
    const [msgPreview, setMsgPreview] = useState('');

    useEffect(() => {
        api.get('/smartparts/suppliers').then(r => {
            const active = (r.data || []).filter((s: SupplierInfo) => s.active);
            setSuppliers(active);
            setSelected(new Set(active.map((s: SupplierInfo) => s.id)));
        }).catch(() => {});
    }, []);

    useEffect(() => {
        const name = productName.trim() || '[nome da peça]';
        setMsgPreview(`Olá [Fornecedor], tudo bem? 😊\n\nEstamos precisando de uma peça:\n\n*${name}*\n\nVocê tem disponível? Qual o valor?\n\nObrigado! 🙏`);
    }, [productName]);

    const filtered = suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search));

    const toggleAll = () => {
        if (selected.size === filtered.length && filtered.every(s => selected.has(s.id))) {
            setSelected(prev => { const n = new Set(prev); filtered.forEach(s => n.delete(s.id)); return n; });
        } else {
            setSelected(prev => { const n = new Set(prev); filtered.forEach(s => n.add(s.id)); return n; });
        }
    };

    const handleSend = async () => {
        if (!productName.trim()) return alert('Informe o nome da peça');
        if (selected.size === 0) return alert('Selecione ao menos um fornecedor');
        setSending(true);
        try { await onSend(productName.trim(), [...selected], msgPreview); }
        finally { setSending(false); }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}>
            <div style={{ background: '#1a1b26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Send size={15} color="#6366f1" />
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>Nova Cotação</span>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={18} /></button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Nome da peça */}
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Peça / Produto</label>
                        <input
                            autoFocus
                            value={productName}
                            onChange={e => setProductName(e.target.value)}
                            placeholder="Ex: Tela Samsung Galaxy A54"
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>

                    {/* Preview da mensagem */}
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Prévia da mensagem</label>
                        <textarea
                            value={msgPreview}
                            onChange={e => setMsgPreview(e.target.value)}
                            rows={6}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'rgba(255,255,255,0.75)', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }}
                        />
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>Você pode editar a mensagem antes de enviar.</div>
                    </div>

                    {/* Fornecedores */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Fornecedores ({selected.size}/{suppliers.length} selecionados)
                            </label>
                            <button onClick={toggleAll} style={{ fontSize: '11px', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                {selected.size === filtered.length && filtered.length > 0 ? 'Desmarcar todos' : 'Marcar todos'}
                            </button>
                        </div>
                        {/* Busca */}
                        <div style={{ position: 'relative', marginBottom: '8px' }}>
                            <Search size={13} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar fornecedor..."
                                style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                            />
                        </div>
                        {/* Lista */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                            {filtered.length === 0 && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', padding: '12px', textAlign: 'center' }}>Nenhum fornecedor encontrado</div>}
                            {filtered.map(s => (
                                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', background: selected.has(s.id) ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${selected.has(s.id) ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
                                    <input
                                        type="checkbox"
                                        checked={selected.has(s.id)}
                                        onChange={() => setSelected(prev => { const n = new Set(prev); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n; })}
                                        style={{ width: '15px', height: '15px', accentColor: '#6366f1', flexShrink: 0 }}
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: selected.has(s.id) ? '#fff' : 'rgba(255,255,255,0.5)' }}>{s.name}</div>
                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{s.phone}</div>
                                    </div>
                                    <Stars n={s.reliability} />
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer' }}>Cancelar</button>
                    <button onClick={handleSend} disabled={sending || !productName.trim() || selected.size === 0} style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: sending ? 'rgba(99,102,241,0.5)' : '#6366f1', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: sending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {sending ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Enviando...</> : <><Send size={13} />Enviar para {selected.size} fornecedor{selected.size !== 1 ? 'es' : ''}</>}
                    </button>
                </div>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
};

// ── Card de uma cotação ────────────────────────────────────────
const QuoteCard: React.FC<{ quote: Quote; orderId: string; onRefresh: () => void }> = ({ quote, onRefresh }) => {
    const [supplierStatuses, setSupplierStatuses] = useState<SupplierStatus[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [approving, setApproving] = useState<string | null>(null);
    const [collapsed, setCollapsed] = useState(quote.status !== 'PENDING');
    const [buyModal, setBuyModal] = useState<{ supplierId: string; supplierName: string; opt: ParsedOption } | null>(null);

    useEffect(() => {
        fetchStatus();
        if (quote.status === 'PENDING') {
            const iv = setInterval(fetchStatus, 8000);
            return () => clearInterval(iv);
        }
    }, [quote.id, quote.status]);

    const fetchStatus = async () => {
        try {
            const res = await api.get(`/smartparts/quotes/${quote.id}/supplier-status`);
            setSupplierStatuses(res.data.suppliers || res.data || []);
        } catch {}
    };

    const handleApprove = (supplierId: string, supplierName: string, opt: ParsedOption) => {
        setBuyModal({ supplierId, supplierName, opt });
    };

    const doApprove = async (approvalMessage: string) => {
        if (!buyModal) return;
        setApproving(buyModal.supplierId + buyModal.opt.price);
        try {
            await api.post(`/smartparts/quotes/${quote.id}/approve/${buyModal.supplierId}`, {
                price: buyModal.opt.price,
                description: buyModal.opt.description,
                approvalMessage,
            });
            setBuyModal(null);
            onRefresh();
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Erro ao aprovar.');
        } finally { setApproving(null); }
    };

    const isCompleted = quote.status === 'COMPLETED';
    const isPending = quote.status === 'PENDING';
    const timeLeft = Math.max(0, Math.floor((new Date(quote.expiresAt).getTime() - Date.now()) / 60000));

    const withPrice = supplierStatuses.filter(s => s.responded && s.price !== null && Number(s.price) > 0);
    const noStock = supplierStatuses.filter(s => s.responded && Number(s.price) === 0 && s.responseType === 'no_stock');
    const greeted = supplierStatuses.filter(s => s.responded && (s.responseType === 'greeting' || (s.price !== null && Number(s.price) < 0)));
    const waiting = supplierStatuses.filter(s => !s.responded);
    const allPrices = withPrice.flatMap(s => s.parsedOptions?.length ? s.parsedOptions.map(o => o.price) : [Number(s.price)]);
    const bestPrice = allPrices.length > 0 ? Math.min(...allPrices) : null;

    const statusColor = isCompleted ? '#22c55e' : isPending ? '#6366f1' : quote.status === 'EXPIRED' ? '#f59e0b' : '#6b7280';
    const statusLabel = isCompleted ? 'FINALIZADA' : isPending ? 'ABERTA' : quote.status === 'EXPIRED' ? 'EXPIRADA' : 'CANCELADA';

    return (
        <div style={{ background: 'rgba(0,0,0,0.18)', borderRadius: '12px', border: `1px solid ${isPending ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.07)'}`, overflow: 'hidden' }}>
            {/* Header do card */}
            <div
                onClick={() => setCollapsed(c => !c)}
                style={{ padding: '13px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isCompleted ? 'rgba(34,197,94,0.08)' : isPending ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)', borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    {isPending && <RefreshCw size={13} style={{ animation: 'spin 2s linear infinite', flexShrink: 0 }} color="#6366f1" />}
                    {isCompleted && <CheckCircle size={13} color="#22c55e" style={{ flexShrink: 0 }} />}
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {quote.productName}
                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', background: statusColor, color: '#fff' }}>{statusLabel}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px', flexWrap: 'wrap' }}>
                            {isPending && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={10} /> {timeLeft}min restantes</span>}
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><MessageCircle size={10} /> {withPrice.length} com preço · {waiting.length} aguardando</span>
                            <span>{fmtTime(quote.createdAt)}</span>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {bestPrice && <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Menor</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#22c55e' }}>{fmtR$(bestPrice)}</div>
                    </div>}
                    {collapsed ? <ChevronDown size={15} color="rgba(255,255,255,0.4)" /> : <ChevronUp size={15} color="rgba(255,255,255,0.4)" />}
                </div>
            </div>

            {/* Body do card */}
            {!collapsed && (
                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {/* COM PREÇO */}
                    {withPrice.length > 0 && (
                        <div>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(34,197,94,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 6px', marginBottom: '4px' }}>💰 Com preço ({withPrice.length})</div>
                            {withPrice.sort((a, b) => {
                                const pa = a.parsedOptions?.length ? Math.min(...a.parsedOptions.map(o => o.price)) : Number(a.price);
                                const pb = b.parsedOptions?.length ? Math.min(...b.parsedOptions.map(o => o.price)) : Number(b.price);
                                return pa - pb;
                            }).map(s => {
                                const isWinner = isCompleted && quote.winnerId === s.id;
                                const hasMultiple = s.parsedOptions?.length > 1;
                                const expanded = expandedId === s.id;
                                const displayPrice = s.parsedOptions?.length ? Math.min(...s.parsedOptions.map(o => o.price)) : Number(s.price);
                                return (
                                    <div key={s.id} style={{ marginBottom: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: isWinner ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.05)', border: `1px solid ${isWinner ? '#22c55e' : 'rgba(34,197,94,0.15)'}`, borderRadius: expanded ? '10px 10px 0 0' : '10px', cursor: 'pointer' }}
                                            onClick={() => setExpandedId(expanded ? null : s.id)}>
                                            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: isWinner ? '#22c55e' : 'rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: isWinner ? '#000' : '#22c55e', flexShrink: 0 }}>
                                                {isWinner ? '🏆' : s.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                    {s.name}
                                                    {isWinner && <span style={{ fontSize: '9px', background: '#22c55e', color: '#000', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>VENCEDOR</span>}
                                                    {hasMultiple && <span style={{ fontSize: '9px', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', padding: '1px 5px', borderRadius: '4px' }}>{s.parsedOptions.length} opções</span>}
                                                </div>
                                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                                                    <Stars n={s.reliability} />
                                                    {s.deliveryDaysResponse && <span style={{ fontSize: '10px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '2px' }}><Truck size={9} />{s.deliveryDaysResponse}d</span>}
                                                    {s.receivedAt && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{fmtTime(s.receivedAt)}</span>}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                <div style={{ fontSize: '16px', fontWeight: 800, color: '#22c55e' }}>{fmtR$(displayPrice)}</div>
                                                {hasMultiple && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>a partir de</div>}
                                            </div>
                                            {expanded ? <ChevronUp size={14} color="rgba(255,255,255,0.4)" /> : <ChevronDown size={14} color="rgba(255,255,255,0.4)" />}
                                        </div>
                                        {expanded && (
                                            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(34,197,94,0.1)', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                {hasMultiple && s.parsedOptions.map((opt, i) => {
                                                    const lowestP = Math.min(...s.parsedOptions.map(o => o.price));
                                                    return <QualityOption key={i} opt={opt} isLowest={opt.price === lowestP} isWinner={isWinner && i === 0} disabled={!!approving} quoteCompleted={isCompleted} onSelect={() => handleApprove(s.id, s.name, opt)} />;
                                                })}
                                                {!hasMultiple && !isWinner && (
                                                    <QualityOption opt={{ description: quote.productName, price: Number(s.price), quality: 'padrao' }} isLowest={Number(s.price) === bestPrice} isWinner={false} disabled={!!approving} quoteCompleted={isCompleted} onSelect={() => handleApprove(s.id, s.name, { description: quote.productName, price: Number(s.price) })} />
                                                )}
                                                {s.message && <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '11px', color: 'rgba(255,255,255,0.5)', whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: 1.5, marginTop: '4px' }}>{s.message}</div>}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* SEM ESTOQUE */}
                    {noStock.length > 0 && (
                        <div>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(239,68,68,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 6px', marginBottom: '4px' }}>🚫 Sem estoque ({noStock.length})</div>
                            {noStock.map(s => (
                                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: '8px', marginBottom: '4px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: '14px', flexShrink: 0 }}>✗</div>
                                    <div style={{ flex: 1 }}><div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>{s.name}</div><Stars n={s.reliability} /></div>
                                    <span style={{ fontSize: '11px', color: '#ef4444' }}>Sem estoque</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* SÓ RESPONDEU */}
                    {greeted.length > 0 && (
                        <div>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(251,191,36,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 6px', marginBottom: '4px' }}>👋 Respondeu, sem preço ({greeted.length})</div>
                            {greeted.map(s => (
                                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.1)', borderRadius: '8px', marginBottom: '4px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(251,191,36,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', fontSize: '12px', flexShrink: 0 }}>👋</div>
                                    <div style={{ flex: 1 }}><div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>{s.name}</div><div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{s.receivedAt ? fmtTime(s.receivedAt) : ''}</div></div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* AGUARDANDO (pendente) / NÃO RESPONDERAM (expirada/cancelada) */}
                    {waiting.length > 0 && (
                        <div>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: isPending ? 'rgba(255,255,255,0.3)' : 'rgba(245,158,11,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 6px', marginBottom: '4px' }}>
                                {isPending ? `⏳ Aguardando (${waiting.length})` : `🔕 Não responderam (${waiting.length})`}
                            </div>
                            {waiting.map(s => (
                                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', marginBottom: '4px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{s.name.charAt(0).toUpperCase()}</div>
                                    <div style={{ flex: 1 }}><div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>{s.name}</div><div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><Stars n={s.reliability} /><span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{s.responseRatePercent}% resposta</span></div></div>
                                    {isPending
                                        ? <Loader2 size={13} color="rgba(255,255,255,0.2)" style={{ animation: 'spin 2s linear infinite' }} />
                                        : <span style={{ fontSize: '10px', color: 'rgba(245,158,11,0.5)' }}>sem resposta</span>
                                    }
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Mensagem de status para cotações encerradas */}
                    {!isPending && supplierStatuses.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                            Nenhum dado de resposta disponível.
                        </div>
                    )}
                    {!isPending && quote.status === 'EXPIRED' && withPrice.length === 0 && noStock.length === 0 && waiting.length === 0 && (
                        <div style={{ padding: '14px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '8px', fontSize: '12px', color: 'rgba(245,158,11,0.8)', textAlign: 'center' }}>
                            ⏰ Cotação expirada sem respostas. Nenhum fornecedor respondeu no tempo limite.
                        </div>
                    )}

                    {supplierStatuses.length === 0 && isPending && (
                        <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.35)', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <Loader2 size={20} style={{ animation: 'spin 2s linear infinite' }} />
                            Enviando cotações...
                        </div>
                    )}
                </div>
            )}
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
            {buyModal && (
                <BuyModal
                    supplierName={buyModal.supplierName}
                    opt={buyModal.opt}
                    onConfirm={doApprove}
                    onClose={() => setBuyModal(null)}
                />
            )}
        </div>
    );
};

// ── Componente principal ───────────────────────────────────────
export function ActiveQuote({ orderId }: { orderId: string }) {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [showModal, setShowModal] = useState(false);

    const fetchQuotes = async () => {
        try {
            const res = await api.get(`/smartparts/quotes/order/${orderId}`);
            setQuotes(res.data || []);
        } catch {}
    };

    useEffect(() => {
        fetchQuotes();
    }, [orderId]);

    const handleSend = async (productName: string, supplierIds: string[], message: string) => {
        await api.post('/smartparts/quotes/start', { orderId, productName, supplierIds, message });
        setShowModal(false);
        fetchQuotes();
    };

    const hasPending = quotes.some(q => q.status === 'PENDING');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Botão nova cotação */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={() => setShowModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                >
                    <Plus size={14} /> Nova Cotação
                </button>
            </div>

            {/* Lista de cotações */}
            {quotes.length === 0 && (
                <div style={{ padding: '32px', background: 'rgba(99,102,241,0.07)', borderRadius: '12px', border: '1px dashed rgba(99,102,241,0.3)', textAlign: 'center' }}>
                    <Send size={24} color="rgba(99,102,241,0.4)" style={{ marginBottom: '10px' }} />
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 }}>Nenhuma cotação iniciada. Clique em <strong style={{ color: '#a5b4fc' }}>Nova Cotação</strong> para cotar com fornecedores via WhatsApp.</p>
                </div>
            )}
            {quotes.map(q => (
                <QuoteCard key={q.id} quote={q} orderId={orderId} onRefresh={fetchQuotes} />
            ))}

            {/* Modal */}
            {showModal && (
                <StartModal
                    onClose={() => setShowModal(false)}
                    onSend={handleSend}
                />
            )}
        </div>
    );
}
