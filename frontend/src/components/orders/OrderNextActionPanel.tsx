import React, { useState } from 'react';
import { ArrowRight, X, FileText, Wrench, Send, Package, CheckCircle, ClipboardList, Shield } from 'lucide-react';

interface Action {
    label: string;
    icon: React.ReactNode;
    tab?: string;
    status?: string;
    variant?: 'primary' | 'secondary';
}

interface StatusConfig {
    emoji: string;
    title: string;
    description: string;
    color: string;
    actions: Action[];
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
    aberta: {
        emoji: '📋',
        title: 'OS aberta — aguardando início',
        description: 'Registre o equipamento e inicie o diagnóstico.',
        color: '#3b82f6',
        actions: [
            { label: 'Ver Equipamentos', icon: <Wrench size={14} />, tab: 'Equipamentos', variant: 'secondary' },
            { label: 'Iniciar Diagnóstico', icon: <ArrowRight size={14} />, status: 'em_diagnostico', variant: 'primary' },
        ],
    },
    em_diagnostico: {
        emoji: '🔍',
        title: 'Em diagnóstico',
        description: 'Registre o laudo técnico e as peças necessárias.',
        color: '#f59e0b',
        actions: [
            { label: 'Preencher Laudo', icon: <FileText size={14} />, tab: 'Laudo Técnico', variant: 'secondary' },
            { label: 'Adicionar Peças', icon: <Package size={14} />, tab: 'Peças/Serviços', variant: 'secondary' },
            { label: 'Aguardar Aprovação', icon: <ArrowRight size={14} />, status: 'aguardando_aprovacao', variant: 'primary' },
        ],
    },
    aguardando_aprovacao: {
        emoji: '⏳',
        title: 'Aguardando aprovação do cliente',
        description: 'Envie o orçamento e aguarde a confirmação.',
        color: '#8b5cf6',
        actions: [
            { label: 'Ver Orçamento', icon: <ClipboardList size={14} />, tab: 'Orçamento 📝', variant: 'secondary' },
            { label: 'Enviar por WhatsApp', icon: <Send size={14} />, tab: 'Histórico', variant: 'secondary' },
            { label: 'Aprovado — Iniciar Reparo', icon: <ArrowRight size={14} />, status: 'em_reparo', variant: 'primary' },
        ],
    },
    aguardando_peca: {
        emoji: '📦',
        title: 'Aguardando peça',
        description: 'Quando a peça chegar, retome o reparo.',
        color: '#f97316',
        actions: [
            { label: 'Gerenciar Peças', icon: <Package size={14} />, tab: 'Peças/Serviços', variant: 'secondary' },
            { label: 'Iniciar Reparo', icon: <ArrowRight size={14} />, status: 'em_reparo', variant: 'primary' },
        ],
    },
    em_reparo: {
        emoji: '🔧',
        title: 'Em reparo',
        description: 'Registre as peças utilizadas e finalize quando concluído.',
        color: '#06b6d4',
        actions: [
            { label: 'Peças Utilizadas', icon: <Package size={14} />, tab: 'Peças/Serviços', variant: 'secondary' },
            { label: 'Ir para Testes', icon: <ArrowRight size={14} />, status: 'testes', variant: 'primary' },
        ],
    },
    testes: {
        emoji: '🧪',
        title: 'Em testes',
        description: 'Execute o checklist de saída antes de finalizar.',
        color: '#ec4899',
        actions: [
            { label: 'Finalizar OS', icon: <CheckCircle size={14} />, status: 'finalizada', variant: 'primary' },
        ],
    },
    finalizada: {
        emoji: '✅',
        title: 'OS finalizada — aguardando entrega',
        description: 'Avise o cliente e registre a entrega quando retirar.',
        color: '#10b981',
        actions: [
            { label: 'Ver Financeiro', icon: <FileText size={14} />, tab: 'Financeiro 💰', variant: 'secondary' },
            { label: 'Registrar Entrega', icon: <ArrowRight size={14} />, status: 'entregue', variant: 'primary' },
        ],
    },
    entregue: {
        emoji: '🏁',
        title: 'OS entregue',
        description: 'Serviço concluído. Garantia ativa conforme configuração.',
        color: '#22c55e',
        actions: [
            { label: 'Ver Garantia', icon: <Shield size={14} />, tab: 'Garantia 🛡️', variant: 'secondary' },
            { label: 'Ver Financeiro', icon: <FileText size={14} />, tab: 'Financeiro 💰', variant: 'secondary' },
        ],
    },
    cancelada: {
        emoji: '❌',
        title: 'OS cancelada',
        description: 'Esta ordem foi cancelada.',
        color: '#ef4444',
        actions: [
            { label: 'Ver Histórico', icon: <FileText size={14} />, tab: 'Histórico', variant: 'secondary' },
        ],
    },
};

interface OrderNextActionPanelProps {
    order: any;
    onChangeStatus: (status: string) => void;
    onNavigateTab: (tab: string) => void;
}

export const OrderNextActionPanel: React.FC<OrderNextActionPanelProps> = ({
    order,
    onChangeStatus,
    onNavigateTab,
}) => {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    const config = STATUS_CONFIG[order.status];
    if (!config) return null;

    return (
        <div style={{
            margin: '0 0 20px',
            padding: '14px 16px',
            borderRadius: '12px',
            background: `${config.color}0d`,
            border: `1px solid ${config.color}30`,
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap',
        }}>
            {/* Ícone + texto */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '200px' }}>
                <span style={{ fontSize: '20px', flexShrink: 0 }}>{config.emoji}</span>
                <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: config.color }}>{config.title}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>{config.description}</p>
                </div>
            </div>

            {/* Botões de ação */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {config.actions.map((action, i) => (
                    <button
                        key={i}
                        onClick={() => {
                            if (action.tab) onNavigateTab(action.tab);
                            if (action.status) onChangeStatus(action.status);
                        }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                            cursor: 'pointer', whiteSpace: 'nowrap',
                            border: action.variant === 'primary'
                                ? 'none'
                                : `1px solid ${config.color}40`,
                            background: action.variant === 'primary'
                                ? config.color
                                : `${config.color}12`,
                            color: action.variant === 'primary'
                                ? '#fff'
                                : config.color,
                        }}
                    >
                        {action.icon}
                        {action.label}
                    </button>
                ))}

                {/* Botão fechar */}
                <button
                    onClick={() => setDismissed(true)}
                    style={{
                        background: 'transparent', border: 'none',
                        color: 'rgba(255,255,255,0.25)', cursor: 'pointer',
                        padding: '4px', borderRadius: '6px', display: 'flex',
                    }}
                    title="Fechar"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};
