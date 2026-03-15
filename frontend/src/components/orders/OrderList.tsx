import React, { useState, useEffect } from 'react';
import {
    Eye, Clock, CheckCircle, AlertTriangle, Smartphone, Laptop,
    Wrench, XCircle, Trash2, DollarSign, Printer, Package, Settings,
    ChevronRight, User,
} from 'lucide-react';
import type { Order } from '../../types';

interface OrderListProps {
    orders: Order[];
    loading: boolean;
    onViewOrder: (order: Order, tab?: string, openStatus?: boolean) => void;
    onDelete?: (id: string) => void;
    showDeleted?: boolean;
}

const STATUS: Record<string, { label: string; color: string; icon: any }> = {
    aberta:               { label: 'Aberta',         color: '#9ca3af', icon: Clock },
    em_diagnostico:       { label: 'Diagnóstico',    color: '#3b82f6', icon: Settings },
    aguardando_aprovacao: { label: 'Ag. Aprovação',  color: '#eab308', icon: AlertTriangle },
    aguardando_peca:      { label: 'Ag. Peça',       color: '#f97316', icon: Package },
    em_reparo:            { label: 'Em Reparo',      color: '#a855f7', icon: Wrench },
    testes:               { label: 'Testes',         color: '#06b6d4', icon: Settings },
    finalizada:           { label: 'Finalizada',     color: '#22c55e', icon: CheckCircle },
    entregue:             { label: 'Entregue',       color: '#10b981', icon: CheckCircle },
    cancelada:            { label: 'Cancelada',      color: '#ef4444', icon: XCircle },
};

const PRIORITY_COLOR: Record<string, string> = {
    baixa: '#22c55e', normal: '#3b82f6', alta: '#f59e0b', urgente: '#ef4444',
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
const fmtCurrency = (v?: number) => v ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) : null;

// ── Badge de status ────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string; onClick?: (e: React.MouseEvent) => void }> = ({ status, onClick }) => {
    const cfg = STATUS[status] || { label: status, color: '#9ca3af', icon: Clock };
    const Icon = cfg.icon;
    return (
        <button onClick={onClick} style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
            background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}30`,
            cursor: onClick ? 'pointer' : 'default', whiteSpace: 'nowrap',
        }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
            {cfg.label}
        </button>
    );
};

// ── Card mobile ────────────────────────────────────────────────
const OrderCard: React.FC<{
    order: Order;
    onView: () => void;
    onStatus: (e: React.MouseEvent) => void;
    onFinance: (e: React.MouseEvent) => void;
    onPrint: (e: React.MouseEvent) => void;
    onDelete?: (e: React.MouseEvent) => void;
    showDeleted?: boolean;
}> = ({ order, onView, onStatus, onFinance, onPrint, onDelete, showDeleted }) => {
    const eq = order.equipments?.find(e => e.isMain) || order.equipments?.[0];
    const pColor = PRIORITY_COLOR[order.priority] || '#3b82f6';
    const total = fmtCurrency(order.totalValue);

    return (
        <div onClick={onView} style={{
            padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
            cursor: 'pointer', transition: 'background 0.15s',
        }}
            onTouchStart={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            onTouchEnd={e => (e.currentTarget.style.background = 'transparent')}
        >
            {/* Linha 1: protocolo + data + seta */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                        fontFamily: 'monospace', fontSize: '13px', fontWeight: 700,
                        color: 'var(--accent-primary)', letterSpacing: '0.5px',
                    }}>#{order.protocol}</span>
                    <span style={{
                        fontSize: '10px', fontWeight: 700, color: pColor,
                        background: `${pColor}18`, padding: '2px 6px', borderRadius: '6px',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>{order.priority}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{fmtDate(order.entryDate)}</span>
                    <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
                </div>
            </div>

            {/* Linha 2: cliente */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <User size={13} color="rgba(255,255,255,0.3)" />
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {order.client?.nome || 'Cliente não identificado'}
                </span>
            </div>

            {/* Linha 3: equipamento */}
            {eq && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                    <Smartphone size={13} color="rgba(255,255,255,0.3)" />
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {eq.brand} {eq.model}
                    </span>
                </div>
            )}

            {/* Linha 4: status + valor + ações */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <StatusBadge status={order.status} onClick={onStatus} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                    {total && <span style={{ fontSize: '13px', fontWeight: 600, color: '#22c55e', marginRight: '8px' }}>{total}</span>}
                    <button onClick={onFinance} title="Financeiro" style={{ padding: '8px', color: '#10b981', minWidth: '36px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DollarSign size={16} />
                    </button>
                    <button onClick={onPrint} title="Imprimir" style={{ padding: '8px', color: '#a855f7', minWidth: '36px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Printer size={16} />
                    </button>
                    {onDelete && !showDeleted && (
                        <button onClick={onDelete} title="Excluir" style={{ padding: '8px', color: '#ef4444', minWidth: '36px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Linha de tabela desktop ────────────────────────────────────
const OrderRow: React.FC<{
    order: Order;
    onView: () => void;
    onStatus: (e: React.MouseEvent) => void;
    onFinance: (e: React.MouseEvent) => void;
    onPrint: (e: React.MouseEvent) => void;
    onDelete?: (e: React.MouseEvent) => void;
    showDeleted?: boolean;
}> = ({ order, onView, onStatus, onFinance, onPrint, onDelete, showDeleted }) => {
    const eq = order.equipments?.find(e => e.isMain) || order.equipments?.[0];
    const pColor = PRIORITY_COLOR[order.priority] || '#3b82f6';
    const total = fmtCurrency(order.totalValue);

    return (
        <tr onClick={onView} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
            <td style={{ padding: '13px 16px' }}>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-primary)', fontSize: '13px' }}>{order.protocol}</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: pColor, textTransform: 'uppercase', marginTop: '2px', letterSpacing: '0.5px' }}>{order.priority}</div>
            </td>
            <td style={{ padding: '13px 16px' }}>
                <div style={{ fontWeight: 500, color: '#fff', fontSize: '14px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {order.client?.nome || '—'}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{order.client?.email || ''}</div>
            </td>
            <td style={{ padding: '13px 16px' }}>
                {eq ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                        <Smartphone size={13} color="rgba(255,255,255,0.3)" />
                        <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {eq.brand} {eq.model}
                        </span>
                    </div>
                ) : <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px', fontStyle: 'italic' }}>—</span>}
            </td>
            <td style={{ padding: '13px 16px' }}>
                <StatusBadge status={order.status} onClick={onStatus} />
            </td>
            <td style={{ padding: '13px 16px', fontSize: '13px', color: '#22c55e', fontWeight: total ? 600 : 400 }}>
                {total || <span style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>}
            </td>
            <td style={{ padding: '13px 16px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
                {fmtDate(order.entryDate)}
            </td>
            <td style={{ padding: '13px 12px', textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                    <button onClick={onFinance} title="Financeiro" style={{ padding: '7px', color: '#10b981', minWidth: '34px', minHeight: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '7px', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.1)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <DollarSign size={15} />
                    </button>
                    <button onClick={onPrint} title="Imprimir" style={{ padding: '7px', color: '#a855f7', minWidth: '34px', minHeight: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '7px', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(168,85,247,0.1)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <Printer size={15} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); onView(); }} title="Abrir" style={{ padding: '7px', color: 'var(--accent-primary)', minWidth: '34px', minHeight: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '7px', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.1)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <Eye size={15} />
                    </button>
                    {onDelete && !showDeleted && (
                        <button onClick={onDelete} title="Excluir" style={{ padding: '7px', color: '#ef4444', minWidth: '34px', minHeight: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '7px', transition: 'background 0.15s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            <Trash2 size={15} />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};

// ── Componente principal ───────────────────────────────────────
export const OrderList: React.FC<OrderListProps> = ({ orders, loading, onViewOrder, onDelete, showDeleted }) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handle = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handle);
        return () => window.removeEventListener('resize', handle);
    }, []);

    if (loading) return (
        <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '24px', height: '24px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Carregando ordens...
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (orders.length === 0) return (
        <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <Wrench size={36} style={{ opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: '14px' }}>Nenhuma ordem encontrada</p>
        </div>
    );

    // Mobile: lista de cards
    if (isMobile) return (
        <div>
            {orders.map(order => (
                <OrderCard
                    key={order.id}
                    order={order}
                    onView={() => onViewOrder(order)}
                    onStatus={e => { e.stopPropagation(); onViewOrder(order, undefined, true); }}
                    onFinance={e => { e.stopPropagation(); onViewOrder(order, 'Financeiro 💰'); }}
                    onPrint={e => { e.stopPropagation(); onViewOrder(order, 'Impressão'); }}
                    onDelete={onDelete ? e => { e.stopPropagation(); onDelete(order.id); } : undefined}
                    showDeleted={showDeleted}
                />
            ))}
        </div>
    );

    // Tablet/Desktop: tabela
    return (
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '680px' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        {['Protocolo', 'Cliente', 'Equipamento', 'Status', 'Valor', 'Data', ''].map(h => (
                            <th key={h} style={{
                                padding: '12px 16px', textAlign: h === '' ? 'right' : 'left',
                                fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.35)',
                                textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap',
                            }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <OrderRow
                            key={order.id}
                            order={order}
                            onView={() => onViewOrder(order)}
                            onStatus={e => { e.stopPropagation(); onViewOrder(order, undefined, true); }}
                            onFinance={e => { e.stopPropagation(); onViewOrder(order, 'Financeiro 💰'); }}
                            onPrint={e => { e.stopPropagation(); onViewOrder(order, 'Impressão'); }}
                            onDelete={onDelete ? e => { e.stopPropagation(); onDelete(order.id); } : undefined}
                            showDeleted={showDeleted}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};
