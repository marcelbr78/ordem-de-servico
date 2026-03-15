import { useState, useEffect } from 'react';
import {
    Clock, MessageCircle, CheckCircle, XCircle, RefreshCw,
    Send, Loader2, ChevronDown, ChevronUp, Star, Truck, Zap,
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
}

// ── Helpers ────────────────────────────────────────────────────
const fmtR$ = (v: number) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;
const fmtTime = (d: string) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

// Labels e cores por tipo de qualidade
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

// ── Stars ──────────────────────────────────────────────────────
const Stars: React.FC<{ n: number }> = ({ n }) => (
    <span style={{ display: 'flex', gap: '1px' }}>
        {[1,2,3,4,5].map(i => (
            <Star key={i} size={10} fill={i <= n ? '#f59e0b' : 'none'} color={i <= n ? '#f59e0b' : 'rgba(255,255,255,0.2)'} />
        ))}
    </span>
);

// ── Opção individual de qualidade ──────────────────────────────
const QualityOption: React.FC<{
    opt: ParsedOption; isLowest: boolean; isWinner: boolean;
    onSelect: () => void; disabled: boolean; quoteCompleted: boolean;
}> = ({ opt, isLowest, isWinner, onSelect, disabled, quoteCompleted }) => {
    const q = QUALITY[opt.quality || 'padrao'] || QUALITY.padrao;
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px',
            background: isWinner ? 'rgba(34,197,94,0.15)' : isLowest ? 'rgba(34,197,94,0.07)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${isWinner ? '#22c55e' : isLowest ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: '8px', transition: 'all 0.15s',
        }}>
            {/* Badge de qualidade */}
            {q.label && (
                <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: q.bg, color: q.color, border: `1px solid ${q.color}30`, flexShrink: 0 }}>
                    {q.label}
                </span>
            )}
            {/* Descrição */}
            <span style={{ flex: 1, fontSize: '13px', color: isWinner ? '#fff' : 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {opt.description}
            </span>
            {/* Preço */}
            <span style={{ fontSize: '15px', fontWeight: 700, color: isWinner ? '#22c55e' : isLowest ? '#22c55e' : '#fff', flexShrink: 0 }}>
                {fmtR$(opt.price)}
            </span>
            {/* Tags */}
            {isLowest && !isWinner && <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: 'rgba(34,197,94,0.15)', color: '#22c55e', flexShrink: 0 }}>menor</span>}
            {isWinner && <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: '#22c55e', color: '#000', flexShrink: 0 }}>COMPRADO</span>}
            {/* Botão comprar */}
            {!isWinner && (
                <button onClick={onSelect} disabled={disabled} style={{
                    padding: '5px 10px', borderRadius: '6px', border: 'none', fontSize: '11px', fontWeight: 700,
                    background: quoteCompleted ? 'rgba(99,102,241,0.2)' : '#6366f1', color: quoteCompleted ? '#a5b4fc' : '#fff',
                    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, flexShrink: 0,
                }}>
                    {quoteCompleted ? 'Trocar' : 'Comprar'}
                </button>
            )}
        </div>
    );
};

// ── Componente principal ───────────────────────────────────────
export function ActiveQuote({ orderId }: { orderId: string }) {
    const [quote, setQuote] = useState<Quote | null>(null);
    const [supplierStatuses, setSupplierStatuses] = useState<SupplierStatus[]>([]);
    const [loading, setLoading] = useState(false);
    const [productName, setProductName] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [viewHistory, setViewHistory] = useState(false);
    const [approving, setApproving] = useState<string | null>(null);

    useEffect(() => {
        fetchQuote();
        const iv = setInterval(fetchQuote, 8000);
        return () => clearInterval(iv);
    }, [orderId]);

    const fetchQuote = async () => {
        try {
            const res = await api.get(`/smartparts/quotes/order/${orderId}`);
            if (res.data) {
                setQuote(res.data);
                fetchSupplierStatus(res.data.id);
            }
        } catch {}
    };

    const fetchSupplierStatus = async (quoteId: string) => {
        try {
            const res = await api.get(`/smartparts/quotes/${quoteId}/supplier-status`);
            setSupplierStatuses(res.data.suppliers || res.data || []);
        } catch {}
    };

    const handleApprove = async (supplierId: string, supplierName: string, opt: ParsedOption) => {
        if (!confirm(`Confirmar compra de "${opt.description}" com ${supplierName} por ${fmtR$(opt.price)}?`)) return;
        setApproving(supplierId + opt.price);
        try {
            await api.post(`/smartparts/quotes/${quote!.id}/approve/${supplierId}`, {
                price: opt.price, description: opt.description,
            });
            fetchQuote();
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Erro ao aprovar.');
        } finally { setApproving(null); }
    };

    const startQuote = async () => {
        if (!productName.trim()) return alert('Informe o nome da peça');
        setLoading(true);
        try {
            await api.post('/smartparts/quotes/start', { orderId, productName });
            setProductName('');
            fetchQuote();
        } catch { alert('Erro ao iniciar cotação.'); }
        finally { setLoading(false); }
    };

    const showForm = !quote || (['EXPIRED','CANCELLED'].includes(quote.status) && !viewHistory);
    if (showForm) return (
        <div style={{ padding: '20px', background: 'rgba(99,102,241,0.07)', borderRadius: '12px', border: '1px dashed rgba(99,102,241,0.3)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={15} color="#6366f1" /> Cotação Automática via WhatsApp
            </h3>
            {quote?.status === 'EXPIRED' && (
                <div style={{ padding: '10px 14px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '8px', marginBottom: '14px' }}>
                    <p style={{ fontSize: '13px', color: '#fbbf24', margin: '0 0 8px' }}>A cotação anterior expirou.</p>
                    <button onClick={() => setViewHistory(true)} style={{ fontSize: '12px', color: '#fff', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer' }}>
                        Ver resultados anteriores
                    </button>
                </div>
            )}
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '14px' }}>
                Envie cotações para todos os fornecedores ativos de uma vez. As respostas chegam automaticamente pelo WhatsApp.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
                <input value={productName} onChange={e => setProductName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && startQuote()}
                    placeholder="Nome da peça (ex: Tela Samsung Galaxy A54)"
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.25)', color: '#fff', fontSize: '14px', outline: 'none' }}
                />
                <button onClick={startQuote} disabled={loading} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: loading ? 'rgba(99,102,241,0.5)' : '#6366f1', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                    {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />Enviando...</> : <><Send size={14} />Cotar</>}
                </button>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    const isCompleted = quote.status === 'COMPLETED';
    const timeLeft = Math.max(0, Math.floor((new Date(quote.expiresAt).getTime() - Date.now()) / 60000));

    const withPrice = supplierStatuses.filter(s => s.responded && s.price !== null && Number(s.price) > 0);
    const noStock = supplierStatuses.filter(s => s.responded && Number(s.price) === 0 && s.responseType === 'no_stock');
    const greeted = supplierStatuses.filter(s => s.responded && (s.responseType === 'greeting' || (s.price !== null && Number(s.price) < 0)));
    const waiting = supplierStatuses.filter(s => !s.responded);

    const allPrices = withPrice.flatMap(s => s.parsedOptions?.length ? s.parsedOptions.map(o => o.price) : [Number(s.price)]);
    const bestPrice = allPrices.length > 0 ? Math.min(...allPrices) : null;

    return (
        <div style={{ background: 'rgba(0,0,0,0.18)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isCompleted ? 'rgba(34,197,94,0.12)' : 'rgba(99,102,241,0.1)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 4px' }}>
                        {quote.status === 'PENDING' && <RefreshCw size={13} style={{ animation: 'spin 2s linear infinite' }} color="#6366f1" />}
                        {isCompleted && <CheckCircle size={13} color="#22c55e" />}
                        Cotação: {quote.productName}
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', background: isCompleted ? '#22c55e' : quote.status === 'EXPIRED' ? '#f59e0b' : '#6366f1', color: isCompleted || quote.status === 'EXPIRED' ? '#000' : '#fff' }}>
                            {isCompleted ? 'FINALIZADA' : quote.status === 'EXPIRED' ? 'EXPIRADA' : quote.status === 'CANCELLED' ? 'CANCELADA' : 'ABERTA'}
                        </span>
                    </h3>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'rgba(255,255,255,0.45)', flexWrap: 'wrap' }}>
                        {quote.status === 'PENDING' && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={10} /> {timeLeft}min restantes</span>}
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><MessageCircle size={10} /> {withPrice.length} com preço · {noStock.length} sem estoque · {greeted.length} só respondeu · {waiting.length} aguardando</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {bestPrice && <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Menor preço</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#22c55e' }}>{fmtR$(bestPrice)}</div>
                    </div>}
                    {(isCompleted || quote.status === 'EXPIRED') && (
                        <button onClick={() => setViewHistory(false)} style={{ padding: '7px 12px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <RefreshCw size={12} /> Nova
                        </button>
                    )}
                </div>
            </div>

            {/* Body */}
            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>

                {/* COM PREÇO */}
                {withPrice.length > 0 && (
                    <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(34,197,94,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 6px', marginBottom: '4px' }}>
                            💰 Com preço ({withPrice.length})
                        </div>
                        {withPrice
                            .sort((a, b) => {
                                const pa = a.parsedOptions?.length ? Math.min(...a.parsedOptions.map(o => o.price)) : Number(a.price);
                                const pb = b.parsedOptions?.length ? Math.min(...b.parsedOptions.map(o => o.price)) : Number(b.price);
                                return pa - pb;
                            })
                            .map(s => {
                            const isWinner = isCompleted && quote.winnerId === s.id;
                            const hasMultiple = s.parsedOptions?.length > 1;
                            const expanded = expandedId === s.id;

                            // Preço exibido no card principal
                            const displayPrice = s.parsedOptions?.length
                                ? Math.min(...s.parsedOptions.map(o => o.price))
                                : Number(s.price);

                            return (
                                <div key={s.id} style={{ marginBottom: '6px' }}>
                                    {/* Card do fornecedor */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                                        background: isWinner ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.05)',
                                        border: `1px solid ${isWinner ? '#22c55e' : 'rgba(34,197,94,0.15)'}`,
                                        borderRadius: expanded ? '10px 10px 0 0' : '10px', cursor: 'pointer',
                                    }} onClick={() => setExpandedId(expanded ? null : s.id)}>
                                        {/* Avatar */}
                                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: isWinner ? '#22c55e' : 'rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: isWinner ? '#000' : '#22c55e', flexShrink: 0 }}>
                                            {isWinner ? '🏆' : s.name.charAt(0).toUpperCase()}
                                        </div>
                                        {/* Info */}
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
                                        {/* Preço */}
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#22c55e' }}>{fmtR$(displayPrice)}</div>
                                            {hasMultiple && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>a partir de</div>}
                                        </div>
                                        {expanded ? <ChevronUp size={14} color="rgba(255,255,255,0.4)" /> : <ChevronDown size={14} color="rgba(255,255,255,0.4)" />}
                                    </div>

                                    {/* Opções expandidas */}
                                    {expanded && (
                                        <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(34,197,94,0.1)', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {/* Múltiplas opções de qualidade */}
                                            {hasMultiple && s.parsedOptions.map((opt, i) => {
                                                const lowestP = Math.min(...s.parsedOptions.map(o => o.price));
                                                const isLowest = opt.price === lowestP;
                                                const isWinnerOpt = isWinner && i === 0;
                                                return (
                                                    <QualityOption key={i} opt={opt} isLowest={isLowest} isWinner={isWinnerOpt}
                                                        disabled={!!approving} quoteCompleted={isCompleted}
                                                        onSelect={() => handleApprove(s.id, s.name, opt)} />
                                                );
                                            })}
                                            {/* Opção única sem múltiplas */}
                                            {!hasMultiple && !isWinner && (
                                                <QualityOption opt={{ description: quote.productName, price: Number(s.price), quality: 'padrao' }}
                                                    isLowest={Number(s.price) === bestPrice} isWinner={false}
                                                    disabled={!!approving} quoteCompleted={isCompleted}
                                                    onSelect={() => handleApprove(s.id, s.name, { description: quote.productName, price: Number(s.price) })} />
                                            )}
                                            {/* Mensagem original */}
                                            {s.message && (
                                                <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '11px', color: 'rgba(255,255,255,0.5)', whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: 1.5, marginTop: '4px' }}>
                                                    {s.message}
                                                </div>
                                            )}
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
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(239,68,68,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 6px', marginBottom: '4px' }}>
                            🚫 Sem estoque ({noStock.length})
                        </div>
                        {noStock.map(s => (
                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: '8px', marginBottom: '4px', cursor: s.message ? 'pointer' : 'default' }}
                                onClick={() => s.message && setExpandedId(expandedId === s.id ? null : s.id)}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: '14px', flexShrink: 0 }}>✗</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>{s.name}</div>
                                    <Stars n={s.reliability} />
                                </div>
                                <span style={{ fontSize: '11px', color: '#ef4444' }}>Sem estoque</span>
                                {s.message && (expandedId === s.id ? <ChevronUp size={12} color="rgba(255,255,255,0.3)" /> : <ChevronDown size={12} color="rgba(255,255,255,0.3)" />)}
                            </div>
                        ))}
                        {noStock.map(s => expandedId === s.id && s.message && (
                            <div key={`msg-${s.id}`} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(239,68,68,0.08)', borderTop: 'none', borderRadius: '0 0 8px 8px', fontSize: '11px', color: 'rgba(255,255,255,0.45)', whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: 1.5, marginTop: '-4px', marginBottom: '4px' }}>
                                {s.message}
                            </div>
                        ))}
                    </div>
                )}

                {/* SÓ RESPONDEU */}
                {greeted.length > 0 && (
                    <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(251,191,36,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 6px', marginBottom: '4px' }}>
                            👋 Respondeu, sem preço ({greeted.length})
                        </div>
                        {greeted.map(s => (
                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.1)', borderRadius: '8px', marginBottom: '4px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(251,191,36,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', fontSize: '12px', flexShrink: 0 }}>👋</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>{s.name}</div>
                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{s.receivedAt ? fmtTime(s.receivedAt) : ''} · aguardando preço</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* AGUARDANDO */}
                {waiting.length > 0 && (
                    <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 6px', marginBottom: '4px' }}>
                            ⏳ Aguardando ({waiting.length})
                        </div>
                        {waiting.map(s => (
                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', marginBottom: '4px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{s.name.charAt(0).toUpperCase()}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>{s.name}</div>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><Stars n={s.reliability} /><span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{s.responseRatePercent}% resposta</span></div>
                                </div>
                                <Loader2 size={13} color="rgba(255,255,255,0.2)" style={{ animation: 'spin 2s linear infinite' }} />
                            </div>
                        ))}
                    </div>
                )}

                {supplierStatuses.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.35)', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <Loader2 size={20} style={{ animation: 'spin 2s linear infinite' }} />
                        Enviando cotações para os fornecedores...
                    </div>
                )}
            </div>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
    );
}
