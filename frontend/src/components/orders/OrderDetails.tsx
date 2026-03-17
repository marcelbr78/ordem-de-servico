import { DeliveryReceiptModal } from './DeliveryReceiptModal';
import { QuoteTab } from './QuoteTab';
import React, { useState } from 'react';
import { X, Clock, Settings, Printer, FileText, FileCheck, ChevronDown, Timer, ArrowRight, Share2, MessageCircle, Mail, User, RefreshCw, Send, Save, Package, Trash2, Search, DollarSign, CreditCard, Landmark, Plus, CheckCircle } from 'lucide-react';
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
import { PhotoGallery } from '../common/PhotoGallery';
import { FiscalTab } from '../fiscal/FiscalTab';
import { CurrencyInput } from '../common/CurrencyInput';

interface OrderDetailsProps {
    order: Order;
    onClose: () => void;
    onUpdate: () => void;
    initialTab?: string;
    startWithStatusOpen?: boolean;
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

export const OrderDetails: React.FC<OrderDetailsProps> = ({ order, onClose, onUpdate, initialTab, startWithStatusOpen }) => {
    const [showDeliveryReceipt, setShowDeliveryReceipt] = useState(false);
    const [activeTab, setActiveTab] = useState(initialTab === 'Impressão' ? 'Histórico' : (initialTab || 'Histórico'));
    const { toasts, show: showToast, dismiss: dismissToast } = useToast();
    const { user } = useAuth();
    const isAdmin = ['admin', 'super_admin'].includes(user?.role || '');
    const [waModalOpen, setWaModalOpen] = useState(false);
    const [waModalStatus, setWaModalStatus] = useState('');
    const [waModalStatusLabel, setWaModalStatusLabel] = useState('');

    // ─── Financeiro State ─────────────────────────────
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loadingTx, setLoadingTx] = useState(false);
    const [showAddPayment, setShowAddPayment] = useState(false);
    const [newPayment, setNewPayment] = useState({ method: 'Dinheiro', amount: '', description: '', bankAccountId: '' });
    const [savingPayment, setSavingPayment] = useState(false);

    const fetchTransactions = async () => {
        setLoadingTx(true);
        try {
            const res = await api.get(`/finance/order/${order.id}`);
            setTransactions(res.data || []);
        } catch (e) {
            console.error('Erro ao carregar transações', e);
        } finally {
            setLoadingTx(false);
        }
    };

    React.useEffect(() => {
        if (activeTab === 'Financeiro 💰') {
            fetchTransactions();
            api.get('/bank-accounts').then(res => setBankAccounts(res.data || []));
        }
        if (activeTab === 'Peças/Serviços') {
            loadServiceItems();
            loadSvcCatalog();
        }
    }, [activeTab]);

    const handleAddPayment = async () => {
        if (!newPayment.amount || isNaN(parseFloat(newPayment.amount))) {
            alert('Informe um valor válido.');
            return;
        }
        setSavingPayment(true);
        try {
            await api.post('/finance', {
                type: 'INCOME',
                amount: parseFloat(newPayment.amount),
                paymentMethod: newPayment.method,
                category: 'OS Payment',
                description: newPayment.description || `Pagamento OS #${order.protocol}`,
                orderId: order.id,
                bankAccountId: newPayment.bankAccountId || undefined,
            });
            setNewPayment({ method: 'Dinheiro', amount: '', description: '', bankAccountId: '' });
            setShowAddPayment(false);
            fetchTransactions();
        } catch (e: any) {
            alert('Erro ao registrar pagamento: ' + (e?.response?.data?.message || e.message));
        } finally {
            setSavingPayment(false);
        }
    };
    const [showStatusDropdown, setShowStatusDropdown] = useState(!!startWithStatusOpen);
    const [changingStatus, setChangingStatus] = useState(false);
    const [printMenuOpen, setPrintMenuOpen] = useState(false);
    const [shareMenuOpen, setShareMenuOpen] = useState(false);
    const [technicalReport, setTechnicalReport] = useState(order.technicalReport || '');
    const [savingReport, setSavingReport] = useState(false);
    const { settings } = useSystemSettings();

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

    // ── Itens de Serviço (mão de obra) ──────────────────────────
    const [serviceItems, setServiceItems] = useState<any[]>([]);
    const [newSvcName, setNewSvcName] = useState('');
    const [newSvcDesc, setNewSvcDesc] = useState('');
    const [newSvcPrice, setNewSvcPrice] = useState('');
    const [editingSvcId, setEditingSvcId] = useState<string | null>(null);
    const [editSvcData, setEditSvcData] = useState<any>({});
    const [svcCatalog, setSvcCatalog] = useState<any[]>([]);
    const [svcSearch, setSvcSearch] = useState('');

    const loadServiceItems = async () => {
        try {
            const r = await api.get(`/orders/${order.id}/service-items`);
            setServiceItems(r.data);
        } catch {}
    };

    const loadSvcCatalog = async () => {
        try {
            const r = await api.get('/inventory?type=service');
            setSvcCatalog(r.data.filter((p: any) => p.type === 'service'));
        } catch {}
    };

    const handleAddServiceItem = async (fromCatalog?: any) => {
        const name = fromCatalog?.name || newSvcName.trim();
        const price = fromCatalog ? fromCatalog.priceSell : parseFloat(newSvcPrice.replace(',', '.'));
        if (!name || !price) return;
        try {
            await api.post(`/orders/${order.id}/service-items`, {
                name,
                description: fromCatalog?.description || newSvcDesc.trim() || undefined,
                price,
                catalogId: fromCatalog?.id || undefined,
            });
            setNewSvcName(''); setNewSvcDesc(''); setNewSvcPrice(''); setSvcSearch('');
            await loadServiceItems();
            onUpdate();
        } catch {}
    };

    const handleUpdateServiceItem = async (itemId: string) => {
        try {
            await api.patch(`/orders/${order.id}/service-items/${itemId}`, editSvcData);
            setEditingSvcId(null);
            await loadServiceItems();
            onUpdate();
        } catch {}
    };

    const handleRemoveServiceItem = async (itemId: string) => {
        try {
            await api.delete(`/orders/${order.id}/service-items/${itemId}`);
            await loadServiceItems();
            onUpdate();
        } catch {}
    };

    // Peças e Serviços State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [editingEqId, setEditingEqId] = useState<string | null>(null);
    const [editEqData, setEditEqData] = useState<any>(null);
    const [savingEq, setSavingEq] = useState(false);

    const handleSearchProducts = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await api.get(`/inventory?search=${query}`);
            setSearchResults(response.data);
        } catch (error) {
            console.error('Error searching products:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddPart = async (product: any) => {
        try {
            const payload = {
                productId: product.id,
                quantity: 1,
                unitPrice: parseFloat(product.priceSell) || 0,
                unitCost: parseFloat(product.priceCost) || 0,
            };
            await api.post(`/orders/${order.id}/parts`, payload);
            onUpdate();
        } catch (error: any) {
            console.error('Error adding part:', error?.response?.data || error);
            const msg = error?.response?.data?.message;
            if (Array.isArray(msg)) {
                alert('Erro ao adicionar peça/serviço:\n' + msg.join('\n'));
            } else {
                alert('Erro ao adicionar peça/serviço: ' + (msg || 'Verifique o console do navegador.'));
            }
        } finally {
            setIsSearching(false);
            setSearchQuery('');
            setSearchResults([]);
        }
    };

    const handleRemovePart = async (partId: string) => {
        if (!confirm('Deseja remover este item?')) return;
        try {
            await api.delete(`/orders/parts/${partId}`);
            onUpdate();
        } catch (error) {
            console.error('Error removing part:', error);
            alert('Erro ao remover peça/serviço');
        }
    };

    const handleEditEq = (eq: any) => {
        setEditingEqId(eq.id);
        setEditEqData({ ...eq });
    };

    const handleSaveEq = async () => {
        if (!editingEqId || !editEqData) return;
        setSavingEq(true);
        try {
            await api.patch(`/orders/equipment/${editingEqId}`, editEqData);
            setEditingEqId(null);
            setEditEqData(null);
            onUpdate();
        } catch (error) {
            console.error('Error saving equipment:', error);
            alert('Erro ao salvar alterações do equipamento');
        } finally {
            setSavingEq(false);
        }
    };

    const totalPartsOnly = (order.parts || []).reduce((acc, part) => acc + (Number(part.unitPrice) * part.quantity), 0);
    const totalServiceItems = serviceItems.reduce((acc, s) => acc + Number(s.price), 0);
    const totalParts = totalPartsOnly + totalServiceItems;

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
                comments: statusComment?.trim() || 'Status atualizado',
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
            await api.patch(`/orders/${order.id}`, { technicalReport });
            onUpdate();
            alert('Laudo técnico salvo com sucesso!');
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar laudo técnico');
        } finally {
            setSavingReport(false);
        }
    };

    const currentColor = STATUS_COLORS[order.status] || '#3b82f6';

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#1a1b26', overflow: 'hidden' }}>
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
                                            <FileText size={14} /> Via Cliente
                                        </button>
                                        <button onClick={() => triggerPrint('store')} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', color: '#fff', textAlign: 'left', cursor: 'pointer', fontSize: '13px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                            <FileText size={14} /> Via Loja
                                        </button>
                                        <button onClick={() => triggerPrint('term')} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', color: '#fff', textAlign: 'left', cursor: 'pointer', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
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

                    {/* Tabs — scroll horizontal no mobile */}
                    <div style={{
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        WebkitOverflowScrolling: 'touch',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(0,0,0,0.2)',
                        scrollbarWidth: 'none',
                    }}>
                        <div style={{ display: 'flex', padding: '0 16px', minWidth: 'max-content' }}>
                        {[
                            'Histórico', 'Laudo Técnico', 'Peças/Serviços',
                            'Equipamentos', 'Cotações', 'Fotos',
                            'Orçamento 📝', 'Financeiro 💰', 'Nota Fiscal 🧾', 'Detalhes',
                            ...(isAdmin ? ['Conversa 🔒'] : []),
                        ].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    padding: '14px 16px',
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                                    color: activeTab === tab ? 'var(--primary)' : 'rgba(255,255,255,0.5)',
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    marginBottom: '-1px',
                                    whiteSpace: 'nowrap',
                                    minHeight: '44px',
                                    WebkitTapHighlightColor: 'transparent',
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                        {activeTab === 'Orçamento 📝' && (
                        <QuoteTab order={order} />
                    )}
                        {activeTab === 'Orçamento 📝' && (
                        <QuoteTab order={order} />
                    )}
                        {/* Botão Recibo de Entrega — aparece quando OS está finalizada ou entregue */}
                        {(order.status === 'finalizada' || order.status === 'entregue') && activeTab === 'Financeiro 💰' && (
                            <div style={{ marginTop: '14px' }}>
                                <button
                                    onClick={() => setShowDeliveryReceipt(true)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '10px', background: 'linear-gradient(135deg,#22c55e,#16a34a)', border: 'none', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                                >
                                    📄 Gerar Recibo de Entrega Digital
                                </button>
                            </div>
                        )}
                        {activeTab === 'Nota Fiscal 🧾' && (
                            <FiscalTab order={order} />
                        )}

                        {activeTab === 'Financeiro 💰' && (() => {
                            const totalPago = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + parseFloat(t.amount), 0);
                            const valorOS = totalParts || parseFloat(String(order.finalValue ?? 0)) || parseFloat(String(order.estimatedValue ?? 0)) || 0;
                            const saldo = valorOS - totalPago;
                            const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
                            const PAYMENT_ICONS: Record<string, React.ReactNode> = {
                                'Dinheiro': <DollarSign size={14} />,
                                'PIX': <CheckCircle size={14} />,
                                'Cartão de Crédito': <CreditCard size={14} />,
                                'Cartão de Débito': <CreditCard size={14} />,
                                'Transferência': <Landmark size={14} />,
                                'Boleto': <FileText size={14} />,
                            };
                            return (
                                <div style={{ maxWidth: '860px', margin: '0 auto' }}>
                                    {/* Resumo financeiro */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
                                        {[
                                            { label: 'Valor Total da OS', value: fmt(valorOS), color: '#fff', icon: <FileText size={18} /> },
                                            { label: 'Total Recebido', value: fmt(totalPago), color: '#10b981', icon: <CheckCircle size={18} /> },
                                            { label: saldo > 0 ? 'Saldo Pendente' : 'Pago Integralmente', value: fmt(Math.abs(saldo)), color: saldo > 0 ? '#f59e0b' : '#10b981', icon: <DollarSign size={18} /> },
                                        ].map(card => (
                                            <div key={card.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '10px' }}>
                                                    {card.icon} {card.label}
                                                </div>
                                                <div style={{ fontSize: '22px', fontWeight: 700, color: card.color }}>{card.value}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Cabeçalho lançamentos */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#fff' }}>Lançamentos desta OS</h3>
                                        <button
                                            onClick={() => setShowAddPayment(!showAddPayment)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', background: 'var(--primary)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                                        >
                                            <Plus size={15} /> Registrar Pagamento
                                        </button>
                                    </div>

                                    {/* Formulário inline de novo pagamento */}
                                    {showAddPayment && (
                                        <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
                                            <h4 style={{ margin: '0 0 16px', color: '#c7d2fe', fontSize: '14px' }}>Novo Lançamento</h4>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                                <div>
                                                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>Forma de Pagamento</label>
                                                    <select
                                                        value={newPayment.method}
                                                        onChange={e => setNewPayment(p => ({ ...p, method: e.target.value }))}
                                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px' }}
                                                    >
                                                        {['Dinheiro', 'PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Transferência', 'Boleto'].map(m => (
                                                            <option key={m} value={m} style={{ background: '#1a1b26' }}>{m}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>Valor (R$)</label>
                                                    <CurrencyInput
                                                        value={newPayment.amount}
                                                        onChange={val => setNewPayment(p => ({ ...p, amount: val }))}
                                                        placeholder="R$ 0,00"
                                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                                                    />
                                                </div>
                                                {bankAccounts.length > 0 && (
                                                    <div>
                                                        <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>Conta Bancária</label>
                                                        <select
                                                            value={newPayment.bankAccountId}
                                                            onChange={e => setNewPayment(p => ({ ...p, bankAccountId: e.target.value }))}
                                                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px' }}
                                                        >
                                                            <option value="" style={{ background: '#1a1b26' }}>Sem conta específica</option>
                                                            {bankAccounts.map((acc: any) => (
                                                                <option key={acc.id} value={acc.id} style={{ background: '#1a1b26' }}>{acc.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                                <div>
                                                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>Observação (opcional)</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Ex: Entrada 50%"
                                                        value={newPayment.description}
                                                        onChange={e => setNewPayment(p => ({ ...p, description: e.target.value }))}
                                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }}
                                                    />
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => setShowAddPayment(false)} style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
                                                <button onClick={handleAddPayment} disabled={savingPayment} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 20px', borderRadius: '8px', background: '#10b981', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                                                    {savingPayment ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Salvar
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Lista de transações */}
                                    {loadingTx ? (
                                        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>Carregando...</div>
                                    ) : transactions.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.08)' }}>
                                            <DollarSign size={32} style={{ color: 'rgba(255,255,255,0.2)', marginBottom: '12px' }} />
                                            <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>Nenhum pagamento registrado ainda.</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {transactions.map((tx: any) => (
                                                <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px 18px' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: tx.type === 'INCOME' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tx.type === 'INCOME' ? '#10b981' : '#ef4444', flexShrink: 0 }}>
                                                        {PAYMENT_ICONS[tx.paymentMethod] || <DollarSign size={14} />}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: 600, color: '#fff', fontSize: '14px' }}>{tx.paymentMethod}</div>
                                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>{tx.description || tx.category}{tx.bankAccount?.name ? ` • ${tx.bankAccount.name}` : ''}</div>
                                                    </div>
                                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                        <div style={{ fontWeight: 700, fontSize: '15px', color: tx.type === 'INCOME' ? '#10b981' : '#ef4444' }}>{tx.type === 'INCOME' ? '+' : '-'}{fmt(parseFloat(tx.amount))}</div>
                                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{new Date(tx.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {activeTab === 'Peças/Serviços' && (
                            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>Peças e Serviços</h3>
                                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Gerencie os itens e mão de obra desta ordem.</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total de Peças/Serviços</div>
                                        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary)' }}>
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalParts)}
                                        </div>
                                    </div>
                                </div>

                                {/* ── Serviços de Mão de Obra ─────────────────── */}
                                <div style={{ marginBottom: '28px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                        <DollarSign size={15} color="#a855f7" />
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Serviços de Mão de Obra</span>
                                        <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#a855f7', fontWeight: 600 }}>
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalServiceItems)}
                                        </span>
                                    </div>

                                    {/* Lista de serviços já adicionados */}
                                    {serviceItems.map(svc => (
                                        <div key={svc.id} style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: '10px', padding: '12px 14px', marginBottom: '8px' }}>
                                            {editingSvcId === svc.id ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <input value={editSvcData.name ?? svc.name} onChange={e => setEditSvcData((p: any) => ({ ...p, name: e.target.value }))}
                                                        placeholder="Nome do serviço" style={{ padding: '8px 10px', borderRadius: '7px', border: '1px solid rgba(168,85,247,0.3)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '13px', outline: 'none' }} />
                                                    <input value={editSvcData.description ?? svc.description ?? ''} onChange={e => setEditSvcData((p: any) => ({ ...p, description: e.target.value }))}
                                                        placeholder="Descrição (opcional)" style={{ padding: '8px 10px', borderRadius: '7px', border: '1px solid rgba(168,85,247,0.3)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '13px', outline: 'none' }} />
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <input type="number" value={editSvcData.price ?? svc.price} onChange={e => setEditSvcData((p: any) => ({ ...p, price: e.target.value }))}
                                                            placeholder="Valor R$" style={{ flex: 1, padding: '8px 10px', borderRadius: '7px', border: '1px solid rgba(168,85,247,0.3)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '13px', outline: 'none' }} />
                                                        <button onClick={() => handleUpdateServiceItem(svc.id)} style={{ padding: '8px 16px', borderRadius: '7px', background: '#a855f7', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Salvar</button>
                                                        <button onClick={() => setEditingSvcId(null)} style={{ padding: '8px 12px', borderRadius: '7px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer' }}>✕</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{svc.name}</div>
                                                        {svc.description && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>{svc.description}</div>}
                                                    </div>
                                                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#a855f7', whiteSpace: 'nowrap' }}>
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(svc.price)}
                                                    </div>
                                                    <button onClick={() => { setEditingSvcId(svc.id); setEditSvcData({}); }}
                                                        style={{ background: 'rgba(168,85,247,0.1)', border: 'none', color: '#a855f7', cursor: 'pointer', padding: '5px 8px', borderRadius: '6px', fontSize: '12px' }}>✏️</button>
                                                    <button onClick={() => handleRemoveServiceItem(svc.id)}
                                                        style={{ background: 'rgba(244,63,94,0.08)', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '5px 8px', borderRadius: '6px' }}><Trash2 size={13} /></button>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Formulário para adicionar serviço */}
                                    <div style={{ background: 'rgba(168,85,247,0.04)', border: '1px dashed rgba(168,85,247,0.25)', borderRadius: '10px', padding: '12px 14px' }}>
                                        {/* Busca rápida no catálogo */}
                                        {svcCatalog.length > 0 && (
                                            <div style={{ marginBottom: '10px', position: 'relative' }}>
                                                <select onChange={e => { const s = svcCatalog.find((c: any) => c.id === e.target.value); if (s) handleAddServiceItem(s); e.target.value = ''; }}
                                                    style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid rgba(168,85,247,0.25)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
                                                    <option value="">⚡ Adicionar do catálogo...</option>
                                                    {svcCatalog.map((s: any) => (
                                                        <option key={s.id} value={s.id}>{s.name} — {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.priceSell)}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <input value={newSvcName} onChange={e => setNewSvcName(e.target.value)} placeholder="Nome do serviço *"
                                                style={{ flex: 2, minWidth: '140px', padding: '8px 10px', borderRadius: '7px', border: '1px solid rgba(168,85,247,0.25)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '13px', outline: 'none' }} />
                                            <input value={newSvcDesc} onChange={e => setNewSvcDesc(e.target.value)} placeholder="Descrição (opcional)"
                                                style={{ flex: 3, minWidth: '140px', padding: '8px 10px', borderRadius: '7px', border: '1px solid rgba(168,85,247,0.25)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '13px', outline: 'none' }} />
                                            <input type="number" value={newSvcPrice} onChange={e => setNewSvcPrice(e.target.value)} placeholder="R$ Valor *"
                                                style={{ width: '100px', padding: '8px 10px', borderRadius: '7px', border: '1px solid rgba(168,85,247,0.25)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '13px', outline: 'none' }} />
                                            <button onClick={() => handleAddServiceItem()} disabled={!newSvcName.trim() || !newSvcPrice}
                                                style={{ padding: '8px 14px', borderRadius: '7px', background: newSvcName.trim() && newSvcPrice ? '#a855f7' : 'rgba(168,85,247,0.2)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Plus size={14} /> Adicionar
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Divisor */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '5px' }}><Package size={12} /> Peças do Estoque</span>
                                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                                </div>

                                {/* Product Search */}
                                <div style={{ position: 'relative', marginBottom: '24px' }}>
                                    <div style={{ position: 'relative' }}>
                                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => handleSearchProducts(e.target.value)}
                                            placeholder="Buscar peça no estoque (mín. 2 letras)..."
                                            style={{
                                                width: '100%', padding: '12px 12px 12px 42px', borderRadius: '10px',
                                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                                color: '#fff', fontSize: '14px', outline: 'none'
                                            }}
                                        />
                                        {isSearching && (
                                            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                                                <RefreshCw size={16} className="animate-spin" style={{ color: 'var(--primary)' }} />
                                            </div>
                                        )}
                                    </div>

                                    {searchResults.length > 0 && (
                                        <div style={{
                                            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                                            background: '#2a2a35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 100, overflow: 'hidden'
                                        }}>
                                            {searchResults.slice(0, 5).map(product => (
                                                <div
                                                    key={product.id}
                                                    onClick={() => handleAddPart(product)}
                                                    style={{
                                                        padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                        cursor: 'pointer', transition: 'background 0.2s', display: 'flex',
                                                        justifyContent: 'space-between', alignItems: 'center'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <div>
                                                        <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>{product.name}</div>
                                                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{product.sku || 'Sem SKU'} • {product.brand || 'Sem marca'}</div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ color: 'var(--primary)', fontWeight: 600 }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.priceSell)}</div>
                                                        <div style={{ color: (product.balance?.quantity || 0) > 0 ? '#10b981' : '#f43f5e', fontSize: '11px' }}>
                                                            {product.type === 'service' ? 'Serviço' : `Estoque: ${product.balance?.quantity || 0}`}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Items List */}
                                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Item</th>
                                                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', textAlign: 'center' }}>Qtd</th>
                                                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', textAlign: 'right' }}>Unitário</th>
                                                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', textAlign: 'right' }}>Subtotal</th>
                                                <th style={{ padding: '12px 16px', width: '50px' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(order.parts || []).length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
                                                        <Package size={32} style={{ opacity: 0.2, marginBottom: '8px' }} />
                                                        <div>Nenhuma peça ou serviço adicionado.</div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                (order.parts || []).map(part => (
                                                    <tr key={part.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                        <td style={{ padding: '12px 16px' }}>
                                                            <div style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}>{part.product?.name}</div>
                                                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{part.product?.sku}</div>
                                                        </td>
                                                        <td style={{ padding: '12px 16px', textAlign: 'center', color: '#fff' }}>{part.quantity}</td>
                                                        <td style={{ padding: '12px 16px', textAlign: 'right', color: '#fff' }}>
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(part.unitPrice)}
                                                        </td>
                                                        <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--primary)', fontWeight: 600 }}>
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(part.unitPrice * part.quantity)}
                                                        </td>
                                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                                            <button
                                                                onClick={() => handleRemovePart(part.id)}
                                                                style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(244,63,94,0.1)'}
                                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Laudo Técnico' && (() => {
                            const eq = order.equipments?.find((e: any) => e.isMain) || order.equipments?.[0];
                            const model = eq ? `${eq.brand} ${eq.model}` : '';
                            const symptom = order.reportedDefect || eq?.reportedDefect || '';
                            return (
                            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>Laudo Técnico</h3>
                                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Relatório detalhado do diagnóstico e solução aplicada.</p>
                                    </div>
                                    <button
                                        onClick={handleSaveReport}
                                        disabled={savingReport || technicalReport === order.technicalReport}
                                        style={{
                                            padding: '8px 16px', borderRadius: '8px', border: 'none',
                                            background: 'var(--primary)', color: '#fff', fontWeight: 600, fontSize: '13px',
                                            cursor: (savingReport || technicalReport === order.technicalReport) ? 'not-allowed' : 'pointer',
                                            opacity: (savingReport || technicalReport === order.technicalReport) ? 0.6 : 1,
                                            display: 'flex', alignItems: 'center', gap: '8px'
                                        }}
                                    >
                                        {savingReport ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                        Salvar Laudo
                                    </button>
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

                                <textarea
                                    value={technicalReport}
                                    onChange={(e) => setTechnicalReport(e.target.value)}
                                    placeholder="Descreva aqui o diagnóstico técnico, peças trocadas e a solução do problema..."
                                    style={{
                                        width: '100%', height: '320px', padding: '16px', borderRadius: '12px',
                                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                        color: '#fff', fontSize: '14px', lineHeight: '1.6', outline: 'none',
                                        resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
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
                            <div style={{ display: 'grid', gap: '16px' }}>
                                {order.equipments?.map((eq, index) => {
                                    const isEditing = editingEqId === eq.id;
                                    return (
                                        <div key={eq.id || index} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px', display: 'flex', gap: '24px', position: 'relative' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                                    <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
                                                        <Settings size={20} />
                                                    </div>
                                                    {isEditing ? (
                                                        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                                                            <input
                                                                value={editEqData.brand}
                                                                onChange={e => setEditEqData({ ...editEqData, brand: e.target.value })}
                                                                placeholder="Marca"
                                                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '4px 8px', borderRadius: '4px', flex: 1 }}
                                                            />
                                                            <input
                                                                value={editEqData.model}
                                                                onChange={e => setEditEqData({ ...editEqData, model: e.target.value })}
                                                                placeholder="Modelo"
                                                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '4px 8px', borderRadius: '4px', flex: 1 }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>{eq.brand} {eq.model}</h4>
                                                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{eq.type} • {eq.serialNumber || 'Sem Serial / IMEI'}</div>
                                                        </div>
                                                    )}

                                                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {eq.isMain && <span style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', fontSize: '11px', padding: '4px 8px', borderRadius: '6px', fontWeight: 700 }}>PRINCIPAL</span>}
                                                        {isEditing ? (
                                                            <>
                                                                <button onClick={handleSaveEq} disabled={savingEq} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                                                    {savingEq ? 'Salvando...' : 'Salvar'}
                                                                </button>
                                                                <button onClick={() => setEditingEqId(null)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                                                    Cancelar
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button onClick={() => handleEditEq(eq)} style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                                                Editar
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div style={{ display: 'grid', gap: '12px' }}>
                                                    {isEditing && (
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                            <div>
                                                                <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>Tipo</span>
                                                                <input
                                                                    value={editEqData.type}
                                                                    onChange={e => setEditEqData({ ...editEqData, type: e.target.value })}
                                                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '6px', marginTop: '4px' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>Serial / IMEI</span>
                                                                <input
                                                                    value={editEqData.serialNumber || ''}
                                                                    onChange={e => setEditEqData({ ...editEqData, serialNumber: e.target.value })}
                                                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '6px', marginTop: '4px' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {!isEditing && eq.functionalChecklist && (
                                                        <div style={{ background: 'rgba(0,0,0,0.15)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.5px', display: 'block', marginBottom: '10px' }}>
                                                                Checklist de Entrada
                                                            </span>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                                                                {(() => {
                                                                    try {
                                                                        const checklist = JSON.parse(eq.functionalChecklist);
                                                                        const items = [
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
                                                                        return items.map(item => (
                                                                            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: checklist[item.id] ? '#10b981' : 'rgba(255,255,255,0.3)' }}>
                                                                                {checklist[item.id] ? <FileCheck size={14} /> : <X size={14} />}
                                                                                <span>{item.label}</span>
                                                                            </div>
                                                                        ));
                                                                    } catch (e) {
                                                                        return <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Erro ao carregar checklist</span>;
                                                                    }
                                                                })()}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>Defeito Relatado</span>
                                                        {isEditing ? (
                                                            <textarea
                                                                value={editEqData.reportedDefect}
                                                                onChange={e => setEditEqData({ ...editEqData, reportedDefect: e.target.value })}
                                                                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', margin: '4px 0 0', minHeight: '80px', outline: 'none' }}
                                                            />
                                                        ) : (
                                                            <p style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)', fontSize: '14px', margin: '4px 0 0' }}>{eq.reportedDefect}</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>Condição Estética / Acessórios</span>
                                                        {isEditing ? (
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
                                                                <input
                                                                    value={editEqData.condition || ''}
                                                                    onChange={e => setEditEqData({ ...editEqData, condition: e.target.value })}
                                                                    placeholder="Condição"
                                                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                                                                />
                                                                <input
                                                                    value={editEqData.accessories || ''}
                                                                    onChange={e => setEditEqData({ ...editEqData, accessories: e.target.value })}
                                                                    placeholder="Acessórios"
                                                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', margin: '4px 0 0' }}>
                                                                {eq.condition || 'Sem observação de condição'} {eq.accessories ? ` | Acessórios: ${eq.accessories}` : ''}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
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
                        {activeTab === 'Conversa 🔒' && (
                            <ConversationTab orderId={order.id} order={order} />
                        )}

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
                    onClose={() => setShowDeliveryReceipt(false)}
                    onSuccess={() => { setShowDeliveryReceipt(false); }}
                />
            )}
        </div>
    );
};
