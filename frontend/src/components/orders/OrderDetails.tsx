import React, { useState } from 'react';
import { X, Clock, Settings, Printer, FileText, FileCheck, ChevronDown, Timer, ArrowRight, Share2, MessageCircle, Mail, User, RefreshCw, Send } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { OrderPrint } from '../printing/OrderPrint';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import type { Order } from '../../types';
import api from '../../services/api';
import { ActiveQuote } from '../smartparts/ActiveQuote';
import { PhotoGallery } from '../common/PhotoGallery';

interface OrderDetailsProps {
    order: Order;
    onClose: () => void;
    onUpdate: () => void;
}

// ─── Styles ─────────────────────────────────────────
const glassBg: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px',
};
const modalOverlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000,
    padding: '20px', overflowY: 'auto'
};
const modalBox: React.CSSProperties = {
    ...glassBg, background: 'rgba(20,20,35,0.95)', padding: '0', width: '100%',
    maxWidth: '900px', height: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
    margin: 'auto'
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

export const OrderDetails: React.FC<OrderDetailsProps> = ({ order, onClose, onUpdate }) => {
    const [activeTab, setActiveTab] = useState('Histórico');
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [changingStatus, setChangingStatus] = useState(false);
    const [printMenuOpen, setPrintMenuOpen] = useState(false);
    const [shareMenuOpen, setShareMenuOpen] = useState(false); // New state

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
    const { settings } = useSystemSettings();
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

    const generateStatusMessage = (newStatus: string, currentComment: string) => {
        const clientName = (order.client?.nome || 'Cliente').split(' ')[0];
        const device = order.equipments?.[0] ? `${order.equipments[0].type} ${order.equipments[0].model}` : 'seu equipamento';
        const base = window.location.origin;
        const statusUrl = `${base}/status/${order.id}`;
        const statusLabel = getDynamicStatusLabel(newStatus);

        let intro = '';
        if (newStatus === 'finalizada' || newStatus === 'entregue') {
            const total = order.finalValue || order.estimatedValue || 0;
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
        if (!targetStatus || !statusComment.trim()) return;

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
            // 1. Update status
            await api.patch(`/orders/${order.id}/status`, {
                status: targetStatus,
                comments: statusComment
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
                        origin: window.location.origin,
                        message: customWaMessage
                    });
                } catch (waError) {
                    console.error("Failed to send automatic WhatsApp", waError);
                    alert("Status atualizado, mas houve um erro ao enviar o WhatsApp.");
                }
            }

            setStatusModalOpen(false);
            setWhatsappPreviewOpen(false);
            onUpdate();
        } catch (error) {
            console.error(error);
            alert('Erro ao atualizar status');
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

    const handleShare = async (type: 'whatsapp_entry' | 'whatsapp_exit' | 'email') => {
        // Email sharing remains manual for now (mailto)
        if (type === 'email') {
            const base = window.location.origin;
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
            const shareType = type === 'whatsapp_entry' ? 'entry' : 'exit';

            // Show loading state/toast if possible, or just optimistic UI
            // Assuming we want to give feedback
            // For now, utilizing alert/console or if there's a toast hook available.
            // checking imports... no toast hook imported. using browser alert or console for now, user asked for automation.

            await api.post(`/orders/${order.id}/share`, {
                type: shareType,
                origin: window.location.origin
            });
            alert('Mensagem enviada com sucesso pelo WhatsApp!');
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
                        const shareType = type === 'whatsapp_entry' ? 'entry' : 'exit'; // Re-declare shareType for this scope
                        await api.post(`/orders/${order.id}/share`, {
                            type: shareType, // reused from outer scope
                            origin: window.location.origin,
                            customNumber: manualNumber
                        });
                        alert(`Mensagem enviada com sucesso para ${manualNumber}!`);
                        setShareMenuOpen(false);
                        return;
                    } catch (retryErr) {
                        console.error('Erro no envio manual:', retryErr);
                        alert('Falha ao enviar para o n\u00famero informado. Abrindo WhatsApp Web...');
                    }
                }
            }

            // 2. Fallback to opening WhatsApp Web manually
            const base = window.location.origin;
            const statusUrl = `${base}/status/${order.id}`;
            let message = '';
            const clientName = (order.client?.nome || 'Cliente').split(' ')[0];
            const device = order.equipments?.[0] ? `${order.equipments[0].type} ${order.equipments[0].model}` : 'seu equipamento';
            const storeName = settings.storeName || 'nossa loja';

            if (type.startsWith('whatsapp_entry')) {
                const defect = order.equipments?.[0]?.reportedDefect || order.initialObservations || 'Não informado';
                message = `Olá ${clientName}, confirmamos a entrada do ${device} na ${storeName}.\n\n📄 *Protocolo:* ${order.protocol}\n🛠 *Defeito:* ${defect}\n\nAcompanhe o status em tempo real aqui: ${statusUrl}`;
            } else {
                const total = order.finalValue || 0;
                const totalFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total);
                message = `Olá ${clientName}, o serviço no ${device} foi finalizado!\n\n📄 *Protocolo:* ${order.protocol}\n✅ *Status:* ${getDynamicStatusLabel(order.status)}\n💰 *Total:* ${totalFormatted}\n\nConfira os detalhes e o laudo técnico aqui: ${statusUrl}`;
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

    const currentColor = STATUS_COLORS[order.status] || '#3b82f6';

    return (
        <div style={modalOverlay} onClick={onClose}>
            <div style={modalBox} onClick={e => e.stopPropagation()}>
                {/* Hidden Print Component */}
                <div style={{ display: 'none' }}>
                    <OrderPrint ref={printRef} order={order} settings={settings} type={printType} />
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
                        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>{order.protocol}</h2>

                                    {/* ─── QUICK STATUS DROPDOWN ─── */}
                                    <div style={{ position: 'relative' }}>
                                        <button
                                            onClick={() => nextStatuses.length > 0 && setShowStatusDropdown(!showStatusDropdown)}
                                            disabled={nextStatuses.length === 0}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                padding: '5px 12px', borderRadius: '8px', fontSize: '12px',
                                                fontWeight: 700, border: `1px solid ${currentColor}40`,
                                                background: `${currentColor}15`, color: currentColor,
                                                cursor: nextStatuses.length > 0 ? 'pointer' : 'default',
                                                textTransform: 'uppercase', letterSpacing: '0.5px',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <span>{STATUS_ICONS[order.status]} {getDynamicStatusLabel(order.status)}</span>
                                            {nextStatuses.length > 0 && <ChevronDown size={14} />}
                                        </button>

                                        {showStatusDropdown && (
                                            <div style={{
                                                position: 'absolute', left: 0, top: '100%', marginTop: '4px',
                                                background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.12)',
                                                borderRadius: '10px', minWidth: '220px', boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                                                zIndex: 100, overflow: 'hidden',
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
                                            minWidth: '160px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 51, overflow: 'hidden'
                                        }}>
                                            <button onClick={() => triggerPrint('client')} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', color: '#fff', textAlign: 'left', cursor: 'pointer', fontSize: '13px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                                <FileText size={14} /> Via Cliente
                                            </button>
                                            <button onClick={() => triggerPrint('store')} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', color: '#fff', textAlign: 'left', cursor: 'pointer', fontSize: '13px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                                <FileText size={14} /> Via Loja
                                            </button>
                                            <button onClick={() => triggerPrint('term')} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', color: '#fff', textAlign: 'left', cursor: 'pointer', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                                <FileCheck size={14} /> Termo Entrega
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'background 0.2s' }}>
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 24px', background: 'rgba(0,0,0,0.2)' }}>
                            {['Histórico', 'Equipamentos', 'Cotações', 'Fotos', 'Detalhes'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        padding: '16px 24px', background: 'transparent', border: 'none',
                                        borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                                        color: activeTab === tab ? 'var(--primary)' : 'rgba(255,255,255,0.5)',
                                        fontWeight: 600, fontSize: '14px', cursor: 'pointer', marginBottom: '-1px'
                                    }}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                            {activeTab === 'Histórico' && (
                                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>Linha do Tempo</h3>
                                    </div>

                                    <div style={{ position: 'relative', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '32px', marginLeft: '10px' }}>
                                        {historyWithDurations
                                            .filter((hist: any) => {
                                                // Filter out purely integration logs if they were merged or are redundant
                                                if (hist.actionType === 'INTEGRATION' && (hist.comments?.includes('WhatsApp') || hist.waMsgSent)) {
                                                    return false;
                                                }
                                                return true;
                                            })
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
                                                                                    <span style={{
                                                                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                                        padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                                                                                        background: 'rgba(37,211,102,0.15)', color: '#25d366',
                                                                                        border: '1px solid rgba(37,211,102,0.2)'
                                                                                    }} title={hist.waMsgContent}>
                                                                                        <MessageCircle size={12} /> WhatsApp Enviado
                                                                                    </span>
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
                                                                                <span>{hist.actionType}</span>
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
                                                                    <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{hist.comments}</p>
                                                                )}
                                                                {hist.waMsgSent && hist.waMsgContent && hist.waMsgContent !== hist.comments && (
                                                                    <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(37,211,102,0.05)', borderRadius: '6px', borderLeft: '3px solid #25d366', fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
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
                                <div style={{ display: 'grid', gap: '16px' }}>
                                    {order.equipments?.map((eq, index) => (
                                        <div key={eq.id || index} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px', display: 'flex', gap: '24px' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                                    <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
                                                        <Settings size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>{eq.brand} {eq.model}</h4>
                                                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{eq.type} • {eq.serialNumber || 'Sem Serial'}</div>
                                                    </div>
                                                    {eq.isMain && <span style={{ marginLeft: 'auto', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', fontSize: '11px', padding: '4px 8px', borderRadius: '6px', fontWeight: 700 }}>PRINCIPAL</span>}
                                                </div>

                                                <div style={{ display: 'grid', gap: '12px' }}>
                                                    <div>
                                                        <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>Defeito Relatado</span>
                                                        <p style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)', fontSize: '14px', margin: '4px 0 0' }}>{eq.reportedDefect}</p>
                                                    </div>
                                                    {eq.condition && (
                                                        <div>
                                                            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>Condição Estética</span>
                                                            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', margin: '4px 0 0' }}>{eq.condition}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'Cotações' && (
                                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                                    <ActiveQuote orderId={order.id} />
                                </div>
                            )}

                            {activeTab === 'Fotos' && (
                                <div style={{ padding: '0 24px' }}>
                                    <PhotoGallery
                                        mode="direct"
                                        orderId={order.id}
                                        existingPhotos={order.photos || []}
                                        onPhotoAdded={onUpdate}
                                        onPhotoDeleted={() => onUpdate()}
                                    />
                                </div>
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
                        </div>
                    </>
                )}

                {/* Click outside to close status dropdown */}
                {showStatusDropdown && (
                    <div
                        style={{ position: 'fixed', inset: 0, zIndex: 40 }}
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
                                        padding: '12px', color: '#fff', fontSize: '14px', resize: 'vertical'
                                    }}
                                    autoFocus
                                />
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
                                    disabled={!statusComment.trim()}
                                    style={{
                                        padding: '10px 20px', borderRadius: '8px', border: 'none',
                                        background: !statusComment.trim() ? 'rgba(255,255,255,0.1)' : '#3b82f6',
                                        color: !statusComment.trim() ? 'rgba(255,255,255,0.3)' : '#fff',
                                        cursor: !statusComment.trim() ? 'not-allowed' : 'pointer',
                                        fontWeight: 600
                                    }}
                                >
                                    Confirmar Alteração
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* WhatsApp Preview Modal */}
                {whatsappPreviewOpen && (
                    <div style={modalOverlay}>
                        <div style={{ ...modalBox, maxWidth: '500px', height: 'auto', padding: '24px', overflow: 'visible' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '32px', height: '32px', background: 'rgba(37,211,102,0.15)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25d366' }}>
                                        <MessageCircle size={18} />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>Prévia da Mensagem</h3>
                                </div>
                                <button onClick={() => setWhatsappPreviewOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '12px' }}>
                                    Esta mensagem será enviada ao cliente. Você pode editá-la se desejar:
                                </p>
                                <textarea
                                    value={whatsappMessage}
                                    onChange={(e) => setWhatsappMessage(e.target.value)}
                                    style={{
                                        width: '100%', minHeight: '200px', background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(37,211,102,0.3)', borderRadius: '12px',
                                        padding: '16px', color: '#fff', fontSize: '14px', resize: 'vertical',
                                        lineHeight: '1.5', fontFamily: 'inherit'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'end', gap: '12px' }}>
                                <button
                                    onClick={() => setWhatsappPreviewOpen(false)}
                                    style={{
                                        padding: '10px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'transparent', color: 'rgba(255,255,255,0.7)', cursor: 'pointer'
                                    }}
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={() => proceedWithStatusChange(whatsappMessage)}
                                    disabled={changingStatus}
                                    style={{
                                        padding: '10px 24px', borderRadius: '8px', border: 'none',
                                        background: '#25d366', color: '#fff', cursor: 'pointer',
                                        fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                                        boxShadow: '0 4px 12px rgba(37,211,102,0.25)'
                                    }}
                                >
                                    {changingStatus ? <RefreshCw size={18} className="animate-spin" /> : <><Send size={18} /> Confirmar e Enviar</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
