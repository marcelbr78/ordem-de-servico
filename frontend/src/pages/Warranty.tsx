import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw, Phone, Smartphone, Calendar } from 'lucide-react';

interface WarrantyOrder {
    id: string; protocol: string; clientName: string; clientPhone: string;
    equipment: string; exitDate: string; warrantyExpiresAt: string;
    warrantyDays: number; daysLeft: number; isExpired: boolean; isExpiringSoon: boolean;
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const Warranty: React.FC = () => {
    const [items, setItems] = useState<WarrantyOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');

    const load = async () => {
        setLoading(true);
        try { const r = await api.get('/orders/warranty'); setItems(r.data); }
        catch { } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const filtered = items.filter(i => {
        if (filter === 'active') return !i.isExpired && !i.isExpiringSoon;
        if (filter === 'expiring') return i.isExpiringSoon;
        if (filter === 'expired') return i.isExpired;
        return true;
    });

    const counts = {
        active: items.filter(i => !i.isExpired && !i.isExpiringSoon).length,
        expiring: items.filter(i => i.isExpiringSoon).length,
        expired: items.filter(i => i.isExpired).length,
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
                        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Controle de Garantia</h1>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>{items.length} equipamentos em garantia</p>
                    </div>
                </div>
                <button onClick={load} style={{ padding: '9px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: loading ? '#22c55e' : 'rgba(255,255,255,0.6)', cursor: 'pointer', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                </button>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

            {/* Filtros */}
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

            {/* Lista */}
            {loading ? (
                <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Carregando...
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                    <Shield size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
                    <p style={{ margin: 0 }}>Nenhuma garantia encontrada</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filtered.map(item => {
                        const color = item.isExpired ? '#ef4444' : item.isExpiringSoon ? '#f59e0b' : '#22c55e';
                        const Icon = item.isExpired ? XCircle : item.isExpiringSoon ? AlertTriangle : CheckCircle;
                        return (
                            <div key={item.id} style={{ background: 'var(--bg-secondary)', border: `1px solid ${color}25`, borderLeft: `3px solid ${color}`, borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
                                {/* Ícone + status */}
                                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Icon size={18} color={color} />
                                </div>

                                {/* Infos */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                        <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: 'var(--accent-primary)' }}>#{item.protocol}</span>
                                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: `${color}15`, color, border: `1px solid ${color}30` }}>
                                            {item.isExpired ? 'Vencida' : item.isExpiringSoon ? `Vence em ${item.daysLeft}d` : `${item.daysLeft} dias restantes`}
                                        </span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>Cliente</span>
                                            <span style={{ fontWeight: 500 }}>{item.clientName}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                                            <Smartphone size={12} color="rgba(255,255,255,0.3)" />
                                            {item.equipment}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                                            <Calendar size={12} />
                                            Entregue: {fmtDate(item.exitDate)}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: item.isExpired ? '#ef4444' : 'rgba(255,255,255,0.4)' }}>
                                            <Shield size={12} />
                                            Vence: {fmtDate(item.warrantyExpiresAt)}
                                        </div>
                                    </div>
                                </div>

                                {/* Ações */}
                                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                    {item.clientPhone && (
                                        <a href={`https://wa.me/${item.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${item.clientName}! Referente à OS #${item.protocol} (${item.equipment})`)}`}
                                            target="_blank" rel="noopener noreferrer"
                                            style={{ padding: '8px', borderRadius: '8px', background: 'rgba(37,211,102,0.1)', color: '#25d366', border: '1px solid rgba(37,211,102,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '34px', minHeight: '34px' }}
                                            title="Contatar via WhatsApp">
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
        </div>
    );
};
