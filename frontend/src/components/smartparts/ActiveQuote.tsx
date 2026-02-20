import { useState, useEffect } from 'react';
import { Clock, MessageCircle, CheckCircle, XCircle, RefreshCw, Send, Loader2 } from 'lucide-react';
import api from '../../services/api';

interface Quote {
    id: string;
    productName: string;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
    expiresAt: string;
    bestPrice: number | null;
    winnerId?: string;
    winner?: { name: string };
}

interface SupplierStatus {
    id: string;
    name: string;
    phone: string;
    responded: boolean;
    price: number | null;
    message: string | null;
    receivedAt: string | null;
}

interface ActiveQuoteProps {
    orderId: string;
}

export function ActiveQuote({ orderId }: ActiveQuoteProps) {
    const [quote, setQuote] = useState<Quote | null>(null);
    const [supplierStatuses, setSupplierStatuses] = useState<SupplierStatus[]>([]);
    const [loading, setLoading] = useState(false);
    const [productName, setProductName] = useState('');
    const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
    const [selectionModalOpen, setSelectionModalOpen] = useState(false);
    const [selectedSupplierForApproval, setSelectedSupplierForApproval] = useState<{ id: string, name: string, message: string } | null>(null);
    const [parsedOptions, setParsedOptions] = useState<{ description: string, price: number }[]>([]);
    const [viewingHistory, setViewingHistory] = useState(false);

    // Function to parse options from message
    const extractOptions = (message: string) => {
        if (!message) return [];
        const results: { description: string, price: number }[] = [];
        const lines = message.split(/\r?\n/);
        for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine) continue;
            const priceMatch = cleanLine.match(/^(.+?)(?:[-–:]\s*)?(?:R\$|r\$)?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?)$/i);
            if (priceMatch) {
                const desc = priceMatch[1].trim();
                const priceStr = priceMatch[2];
                const price = parseFloat(priceStr.replace(/\./g, '').replace(',', '.'));
                if (price > 0 && desc.length > 2) {
                    results.push({ description: desc, price });
                }
            }
        }
        return results;
    };

    useEffect(() => {
        fetchQuote();
        const interval = setInterval(fetchQuote, 8000);
        return () => clearInterval(interval);
    }, [orderId]);

    const fetchQuote = async () => {
        try {
            const res = await api.get(`/smartparts/quotes/order/${orderId}`);
            if (res.data) {
                setQuote(res.data);
                if (res.data) {
                    setQuote(res.data);
                    // Always fetch supplier status to show history even if expired
                    fetchSupplierStatus(res.data.id);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchSupplierStatus = async (quoteId: string) => {
        try {
            const res = await api.get(`/smartparts/quotes/${quoteId}/supplier-status`);
            if (res.data.suppliers) {
                setSupplierStatuses(res.data.suppliers);
            } else {
                setSupplierStatuses(res.data);
            }
            if (res.data.quoteStatus && res.data.quoteStatus !== quote?.status) {
                fetchQuote();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleApprove = async (supplierId: string, supplierName: string, details: { price: number, description: string } | null) => {
        let confirmMsg = `Confirmar compra com ${supplierName}?`;
        if (details) {
            confirmMsg += `\nItem: ${details.description}\nValor: R$ ${details.price.toFixed(2)}`;
        }
        if (!confirm(confirmMsg)) return;
        setLoading(true);
        try {
            await api.post(`/smartparts/quotes/${quote!.id}/approve/${supplierId}`, details || {});
            fetchQuote();
            fetchSupplierStatus(quote!.id);
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || error.message || 'Erro desconhecido';
            alert(`Erro ao aprovar cotação: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const startQuote = async () => {
        if (!productName) return alert('Informe o nome da peça');
        setLoading(true);
        try {
            await api.post('/smartparts/quotes/start', { orderId, productName });
            fetchQuote();
        } catch (error) {
            alert('Erro ao iniciar cotação');
        } finally {
            setLoading(false);
        }
    };

    const showForm = !quote || ((quote.status === 'EXPIRED' || quote.status === 'CANCELLED') && !viewingHistory);

    if (showForm) {
        return (
            <div style={{ padding: '24px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '12px', border: '1px dashed rgba(99, 102, 241, 0.3)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Send size={16} color="#6366f1" />
                    Cotação Automática
                </h3>
                {quote?.status === 'EXPIRED' && (
                    <div style={{ padding: '12px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.2)', marginBottom: '16px' }}>
                        <p style={{ fontSize: '14px', color: '#fbbf24', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={16} />
                            <strong>A cotação anterior expirou.</strong>
                        </p>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '12px' }}>
                            Você pode visualizar os resultados anteriores ou iniciar uma nova cotação agora.
                        </p>
                        <button
                            onClick={() => setViewingHistory(true)}
                            style={{
                                padding: '8px 16px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '13px', cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: '6px'
                            }}
                        >
                            <Clock size={14} /> Ver Resultados Anteriores
                        </button>
                    </div>
                )}
                {quote?.status === 'CANCELLED' && (
                    <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '16px' }}>
                        <p style={{ fontSize: '14px', color: '#ef4444', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <XCircle size={16} />
                            <strong>A cotação anterior foi cancelada.</strong>
                        </p>
                        <button
                            onClick={() => setViewingHistory(true)}
                            style={{
                                padding: '8px 16px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '13px', cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: '6px'
                            }}
                        >
                            <Clock size={14} /> Ver Resultados Anteriores
                        </button>
                    </div>
                )}
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
                    Envie mensagens via WhatsApp para seus fornecedores e compare preços automaticamente.
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                        value={productName}
                        onChange={e => setProductName(e.target.value)}
                        placeholder="Nome da peça (ex: Tela iPhone 11)"
                        style={{
                            flex: 1, padding: '10px 14px', borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)',
                            color: '#fff', fontSize: '14px', outline: 'none',
                        }}
                        onKeyDown={e => e.key === 'Enter' && startQuote()}
                    />
                    <button
                        onClick={startQuote}
                        disabled={loading}
                        style={{
                            padding: '10px 20px', borderRadius: '8px', border: 'none',
                            background: loading ? 'rgba(99,102,241,0.5)' : '#6366f1',
                            color: '#fff', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                        }}
                    >
                        {loading ? <><Loader2 size={14} className="animate-spin" /> Enviando...</> : <><Send size={14} /> Enviar Cotação</>}
                    </button>
                </div>
            </div>
        );
    }

    const timeRemaining = Math.max(0, Math.floor((new Date(quote.expiresAt).getTime() - new Date().getTime()) / 60000));

    // === Smart categorization (4 groups) ===
    const withPrice = supplierStatuses.filter(s => s.responded && s.price !== null && Number(s.price) > 0);
    const noStock = supplierStatuses.filter(s => s.responded && s.price !== null && Number(s.price) === 0);
    const acknowledged = supplierStatuses.filter(s => s.responded && (s.price === null || Number(s.price) < 0)); // price = -1 means greeting/acknowledged, null = responded but no price parsed
    const waiting = supplierStatuses.filter(s => !s.responded);
    const totalSuppliers = supplierStatuses.length;
    const isCompleted = quote.status === 'COMPLETED';

    // Best price only from suppliers who actually sent a price
    const bestPriceValue = withPrice.length > 0
        ? Math.min(...withPrice.map(s => Number(s.price)))
        : null;

    return (
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
                padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: isCompleted ? 'rgba(52, 211, 153, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        {quote.status === 'PENDING' && (
                            <RefreshCw size={15} style={{ animation: 'spin 2s linear infinite' }} color="#6366f1" />
                        )}
                        {quote.status === 'COMPLETED' && (
                            <CheckCircle size={15} color="#34d399" />
                        )}
                        Cotação: {quote.productName}
                        {isCompleted && <span style={{ fontSize: '12px', background: '#34d399', color: '#000', padding: '2px 8px', borderRadius: '10px', marginLeft: '8px' }}>FINALIZADA</span>}
                        {quote.status === 'EXPIRED' && <span style={{ fontSize: '12px', background: '#fbbf24', color: '#000', padding: '2px 8px', borderRadius: '10px', marginLeft: '8px' }}>EXPIRADA</span>}
                        {quote.status === 'CANCELLED' && <span style={{ fontSize: '12px', background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: '10px', marginLeft: '8px' }}>CANCELADA</span>}
                    </h3>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} />
                            {quote.status === 'PENDING' ? `Expira em ${timeRemaining} min` : quote.status}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MessageCircle size={12} />
                            {withPrice.length} com preço | {noStock.length} sem estoque | {acknowledged.length} recebeu | {waiting.length} aguardando
                        </span>
                    </div>
                </div>
                {/* Best Price Display */}
                {bestPriceValue && bestPriceValue > 0 && (
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Melhor Preço</div>
                        <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#34d399' }}>
                            R$ {bestPriceValue.toFixed(2)}
                        </div>
                    </div>
                )}
                {/* New Quote Button */}
                {(quote.status === 'EXPIRED' || quote.status === 'CANCELLED' || isCompleted) && (
                    <button
                        onClick={() => setViewingHistory(false)}
                        style={{
                            marginLeft: '16px', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '13px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                    >
                        <RefreshCw size={14} /> Nova Cotação
                    </button>
                )}
            </div>

            {/* Supplier List */}
            <div style={{ padding: '12px' }}>

                {/* === GROUP 1: With Price (green) === */}
                {withPrice.length > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(52, 211, 153, 0.7)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 8px', marginBottom: '4px' }}>
                            💰 Com Preço ({withPrice.length})
                        </div>
                        {withPrice.sort((a, b) => Number(a.price) - Number(b.price)).map(supplier => {
                            const price = Number(supplier.price);
                            const isBestPrice = price === bestPriceValue;
                            const isWinner = isCompleted && (quote.winnerId === supplier.id || (isBestPrice && !quote.winnerId));

                            return (
                                <div
                                    key={supplier.id}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '10px 12px',
                                        background: isWinner ? 'rgba(52, 211, 153, 0.2)' : isBestPrice ? 'rgba(52, 211, 153, 0.1)' : 'rgba(52, 211, 153, 0.04)',
                                        borderRadius: '8px', marginBottom: '4px', cursor: supplier.message ? 'pointer' : 'default',
                                        border: isWinner ? '1px solid #34d399' : isBestPrice ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(52, 211, 153, 0.08)',
                                        transition: 'all 0.2s',
                                    }}
                                    onClick={() => supplier.message && setExpandedMessage(expandedMessage === supplier.id ? null : supplier.id)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: '34px', height: '34px', borderRadius: '50%',
                                            background: isWinner ? '#34d399' : isBestPrice ? 'linear-gradient(135deg, #34d399, #059669)' : 'rgba(52,211,153,0.2)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '14px', fontWeight: 'bold', color: isWinner || isBestPrice ? '#000' : '#34d399',
                                        }}>
                                            {isWinner ? '🏆' : isBestPrice ? '⭐' : supplier.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                                                {supplier.name}
                                                {isWinner && <span style={{ fontSize: '10px', background: '#34d399', color: '#000', padding: '1px 4px', borderRadius: '4px', marginLeft: '6px', verticalAlign: 'middle' }}>VENCEDOR</span>}
                                                {isBestPrice && !isWinner && !isCompleted && <span style={{ fontSize: '10px', background: 'rgba(52,211,153,0.3)', color: '#34d399', padding: '1px 4px', borderRadius: '4px', marginLeft: '6px', verticalAlign: 'middle' }}>MENOR PREÇO</span>}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                                                {supplier.receivedAt ? new Date(supplier.receivedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                {supplier.message && ' • Clique para ver'}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                                        <div style={{ fontSize: '16px', fontWeight: 700, color: isBestPrice ? '#34d399' : '#fff' }}>
                                            R$ {price.toFixed(2)}
                                        </div>
                                        {(quote.status === 'PENDING' || quote.status === 'COMPLETED' || quote.status === 'EXPIRED') && !isWinner && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const options = extractOptions(supplier.message || '');
                                                    if (options.length > 1) {
                                                        setParsedOptions(options);
                                                        setSelectedSupplierForApproval({ ...supplier, message: supplier.message || '' });
                                                        setSelectionModalOpen(true);
                                                    } else {
                                                        handleApprove(supplier.id, supplier.name, null);
                                                    }
                                                }}
                                                disabled={loading}
                                                style={{
                                                    background: '#6366f1', color: 'white', border: 'none', borderRadius: '4px',
                                                    padding: '4px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: 600,
                                                    opacity: loading ? 0.5 : 1
                                                }}
                                            >
                                                {isCompleted ? 'MUDAR PARA ESTE' : 'COMPRAR'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {withPrice.map(supplier => (
                            expandedMessage === supplier.id && supplier.message && (
                                <div key={`msg-${supplier.id}`} style={{
                                    padding: '10px 14px', margin: '-2px 0 6px 0',
                                    background: 'rgba(255,255,255,0.03)', borderRadius: '0 0 8px 8px',
                                    border: '1px solid rgba(255,255,255,0.06)', borderTop: 'none',
                                    fontSize: '12px', color: 'rgba(255,255,255,0.7)',
                                    whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: '1.6',
                                }}>
                                    {supplier.message}
                                </div>
                            )
                        ))}
                    </div>
                )}

                {/* === GROUP 2: No Stock (red) === */}
                {noStock.length > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(239, 68, 68, 0.7)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 8px', marginBottom: '4px' }}>
                            🚫 Sem Estoque ({noStock.length})
                        </div>
                        {noStock.map(supplier => (
                            <div
                                key={supplier.id}
                                style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '10px 12px', background: 'rgba(239, 68, 68, 0.05)',
                                    borderRadius: '8px', marginBottom: '4px', cursor: supplier.message ? 'pointer' : 'default',
                                    border: '1px solid rgba(239, 68, 68, 0.1)',
                                }}
                                onClick={() => supplier.message && setExpandedMessage(expandedMessage === supplier.id ? null : supplier.id)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                        width: '34px', height: '34px', borderRadius: '50%',
                                        background: 'rgba(239, 68, 68, 0.15)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '14px', color: '#ef4444',
                                    }}>
                                        ✗
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>
                                            {supplier.name}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                                            {supplier.receivedAt ? new Date(supplier.receivedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                            {supplier.message && ' • Clique para ver'}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: 500 }}>
                                    Sem estoque
                                </div>
                            </div>
                        ))}
                        {noStock.map(supplier => (
                            expandedMessage === supplier.id && supplier.message && (
                                <div key={`msg-${supplier.id}`} style={{
                                    padding: '10px 14px', margin: '-2px 0 6px 0',
                                    background: 'rgba(255,255,255,0.03)', borderRadius: '0 0 8px 8px',
                                    border: '1px solid rgba(239, 68, 68, 0.08)', borderTop: 'none',
                                    fontSize: '12px', color: 'rgba(255,255,255,0.5)',
                                    whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: '1.6',
                                }}>
                                    {supplier.message}
                                </div>
                            )
                        ))}
                    </div>
                )}

                {/* === GROUP 3: Acknowledged/Received (blue/yellow) === */}
                {acknowledged.length > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(251, 191, 36, 0.7)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 8px', marginBottom: '4px' }}>
                            👋 Recebeu ({acknowledged.length})
                        </div>
                        {acknowledged.map(supplier => (
                            <div
                                key={supplier.id}
                                style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '10px 12px', background: 'rgba(251, 191, 36, 0.05)',
                                    borderRadius: '8px', marginBottom: '4px', cursor: supplier.message ? 'pointer' : 'default',
                                    border: '1px solid rgba(251, 191, 36, 0.1)',
                                }}
                                onClick={() => supplier.message && setExpandedMessage(expandedMessage === supplier.id ? null : supplier.id)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                        width: '34px', height: '34px', borderRadius: '50%',
                                        background: 'rgba(251, 191, 36, 0.15)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '14px', color: '#fbbf24',
                                    }}>
                                        👋
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>
                                            {supplier.name}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                                            {supplier.receivedAt ? new Date(supplier.receivedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                            {supplier.message && ' • Clique para ver'}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 500 }}>
                                    Aguardando resposta
                                </div>
                            </div>
                        ))}
                        {acknowledged.map(supplier => (
                            expandedMessage === supplier.id && supplier.message && (
                                <div key={`msg-${supplier.id}`} style={{
                                    padding: '10px 14px', margin: '-2px 0 6px 0',
                                    background: 'rgba(255,255,255,0.03)', borderRadius: '0 0 8px 8px',
                                    border: '1px solid rgba(251, 191, 36, 0.08)', borderTop: 'none',
                                    fontSize: '12px', color: 'rgba(255,255,255,0.5)',
                                    whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: '1.6',
                                }}>
                                    {supplier.message}
                                </div>
                            )
                        ))}
                    </div>
                )}

                {/* === GROUP 4: Waiting (gray) === */}
                {waiting.length > 0 && (
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 8px', marginBottom: '4px' }}>
                            ⏳ Aguardando ({waiting.length})
                        </div>
                        {waiting.map(supplier => (
                            <div
                                key={supplier.id}
                                style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '10px 12px', background: 'rgba(255,255,255,0.02)',
                                    borderRadius: '8px', marginBottom: '4px',
                                    border: '1px solid rgba(255,255,255,0.04)',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                        width: '34px', height: '34px', borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '14px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)',
                                    }}>
                                        {supplier.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>{supplier.name}</div>
                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{supplier.phone}</div>
                                    </div>
                                </div>
                                <div style={{
                                    fontSize: '11px', color: 'rgba(255,255,255,0.3)',
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                }}>
                                    <Loader2 size={12} style={{ animation: 'spin 2s linear infinite' }} />
                                    Aguardando...
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* No suppliers at all */}
                {totalSuppliers === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                        <Loader2 size={20} style={{ animation: 'spin 2s linear infinite', margin: '0 auto 8px' }} />
                        Enviando cotações para fornecedores...
                    </div>
                )}
            </div>

            {/* Modal de Seleção */}
            {selectionModalOpen && selectedSupplierForApproval && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#1e1e1e', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h3 style={{ marginBottom: '16px', color: '#fff', fontSize: '16px' }}>Selecione a opção de {selectedSupplierForApproval.name}:</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {parsedOptions.map((opt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        handleApprove(selectedSupplierForApproval.id, selectedSupplierForApproval.name, opt);
                                        setSelectionModalOpen(false);
                                        setSelectedSupplierForApproval(null);
                                    }}
                                    style={{
                                        padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(255,255,255,0.05)', color: '#fff', textAlign: 'left',
                                        display: 'flex', justifyContent: 'space-between', cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                >
                                    <span style={{ flex: 1, marginRight: '8px' }}>{opt.description}</span>
                                    <span style={{ fontWeight: 600, color: '#34d399' }}>R$ {opt.price.toFixed(2)}</span>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                setSelectionModalOpen(false);
                                setSelectedSupplierForApproval(null);
                            }}
                            style={{ marginTop: '16px', padding: '10px', width: '100%', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer' }}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* CSS for spin animation */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
