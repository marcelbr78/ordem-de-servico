import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import {
    Plus, Search, X, User, Building2, Phone, MessageCircle,
    Edit3, Trash2, Eye, Star, History, MapPin, Download,
    TrendingUp, DollarSign, Clock, Tag, ChevronDown, ChevronUp,
    CheckCircle, Cpu, EyeOff, Store, Mail, Lock, ArrowRight, AlertCircle, Filter, RefreshCw,
} from 'lucide-react';
import ClientForm from '../components/ClientForm';
import { OrderDetails } from '../components/orders/OrderDetails';
import { CountrySelect, DDIS } from '../components/CountrySelect';

// ── Tipos ─────────────────────────────────────────────────────
interface Contact { id: string; tipo: 'whatsapp'|'telefone'|'recados'; numero: string; principal: boolean; }
interface ClientData {
    id: string; tipo: 'PF'|'PJ'; nome: string; nomeFantasia?: string;
    cpfCnpj: string; email?: string; cep?: string; rua?: string;
    numero?: string; complemento?: string; bairro?: string;
    cidade?: string; estado?: string; endereco?: string;
    observacoes?: string; internalNotes?: string;
    birthday?: string; tags?: string;
    status: string; contatos: Contact[]; createdAt: string;
    osHistorico?: any[];
}
interface ClientStats {
    totalOS: number; deliveredOS: number; totalSpent: number;
    avgTicket: number; lastOrderDate: string | null;
}

// ── Utils ─────────────────────────────────────────────────────
const R$ = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
const parseTags = (raw?: string): string[] => { try { return raw ? JSON.parse(raw) : []; } catch { return []; } };
const TAG_CFG: Record<string, { color: string; bg: string; icon: string }> = {
    'VIP':         { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: '⭐' },
    'Corporativo': { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', icon: '🏢' },
    'Inadimplente':{ color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: '⚠️' },
    'Fidelidade':  { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  icon: '💚' },
    'Recorrente':  { color: '#a855f7', bg: 'rgba(168,85,247,0.12)', icon: '🔄' },
    'Novo':        { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',  icon: '🆕' },
};
const ALL_TAGS = Object.keys(TAG_CFG);
const splitPhone = (fullNumber: string) => {
    const clean = fullNumber.replace(/[^\d+]/g, '');
    if (!clean) return { ddi: '+55', number: '' };
    if (!clean.includes('+')) return { ddi: '+55', number: clean };
    const ddiMatch = [...DDIS].sort((a, b) => b.code.length - a.code.length).find(d => clean.startsWith(d.code));
    return ddiMatch ? { ddi: ddiMatch.code, number: clean.slice(ddiMatch.code.length) } : { ddi: '+55', number: clean.replace('+55', '') };
};

const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' };

// ── TagBadge ──────────────────────────────────────────────────
const TagBadge: React.FC<{ tag: string; small?: boolean }> = ({ tag, small }) => {
    const cfg = TAG_CFG[tag] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', icon: '🏷' };
    return (
        <span style={{ fontSize: small ? '10px' : '11px', fontWeight: 700, padding: small ? '1px 6px' : '2px 8px', borderRadius: '20px', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}20`, display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
            {cfg.icon} {tag}
        </span>
    );
};

// ── Tag Editor ────────────────────────────────────────────────
const TagEditor: React.FC<{ clientId: string; current: string[]; onUpdate: () => void }> = ({ clientId, current, onUpdate }) => {
    const [saving, setSaving] = useState(false);
    const toggle = async (tag: string) => {
        const next = current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag];
        setSaving(true);
        try { await api.patch(`/clients/${clientId}/tags`, { tags: next }); onUpdate(); }
        catch { alert('Erro ao salvar tags'); }
        finally { setSaving(false); }
    };
    return (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {ALL_TAGS.map(tag => {
                const active = current.includes(tag);
                const cfg = TAG_CFG[tag];
                return (
                    <button key={tag} onClick={() => toggle(tag)} disabled={saving} style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: active ? cfg.bg : 'rgba(255,255,255,0.04)', color: active ? cfg.color : 'rgba(255,255,255,0.4)', border: `1px solid ${active ? cfg.color + '40' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {cfg.icon} {tag}
                    </button>
                );
            })}
        </div>
    );
};

// ── Stats Panel ───────────────────────────────────────────────
const StatsPanel: React.FC<{ clientId: string }> = ({ clientId }) => {
    const [stats, setStats] = useState<ClientStats | null>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        api.get(`/clients/${clientId}/stats`)
            .then(r => setStats(r.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [clientId]);

    if (loading) return <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Carregando stats...</div>;
    if (!stats) return null;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '9px' }}>
            {[
                { l: 'Total de OS', v: stats.totalOS, color: '#3b82f6', icon: '📋' },
                { l: 'OS Entregues', v: stats.deliveredOS, color: '#22c55e', icon: '✅' },
                { l: 'Total Gasto (LTV)', v: R$(stats.totalSpent), color: '#f59e0b', icon: '💰' },
                { l: 'Ticket Médio', v: R$(stats.avgTicket), color: '#a855f7', icon: '🎫' },
                { l: 'Última OS', v: stats.lastOrderDate ? fmtDate(stats.lastOrderDate) : '—', color: '#06b6d4', icon: '🕐' },
            ].map(({ l, v, color, icon }) => (
                <div key={l} style={{ padding: '11px 13px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}20`, borderRadius: '10px' }}>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>{icon}</span>{l}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color, letterSpacing: '-0.5px' }}>{v}</div>
                </div>
            ))}
        </div>
    );
};

// ── Componente principal ───────────────────────────────────────
export function Clients() {
    const exportCsv = () => {
        const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3005';
        const token = localStorage.getItem('@OS:token');
        const a = document.createElement('a');
        a.href = `${apiUrl}/clients/export/csv`;
        // via fetch para adicionar token
        fetch(a.href, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.blob())
            .then(blob => { a.href = URL.createObjectURL(blob); a.download = 'clientes.csv'; a.click(); })
            .catch(() => alert('Erro ao exportar'));
    };

    const [clients, setClients]     = useState<ClientData[]>([]);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState('');
    const [filterTipo, setFilterTipo]     = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterTag, setFilterTag]       = useState('');
    const [showModal, setShowModal]       = useState(false);
    const [searchParams] = useSearchParams();
    useEffect(() => { if (searchParams.get('new') === '1') setShowModal(true); }, []);
    const [editClient, setEditClient]     = useState<ClientData | null>(null);
    const [detailClient, setDetailClient] = useState<ClientData | null>(null);
    const [detailTab, setDetailTab]       = useState<'info'|'stats'|'tags'|'contatos'|'os'>('info');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [viewingOs, setViewingOs]       = useState<any | null>(null);
    const [showFilters, setShowFilters]   = useState(false);

    const loadSuggestions = useCallback(async (query: string) => {
        setSuggestions([]); 
    }, []);

    const handleViewOs = async (id: string) => {
        try {
            const res = await api.get(`/orders/${id}`);
            setViewingOs(res.data);
        } catch (e) {
            alert('Erro ao carregar OS');
        }
    };

    const loadClients = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (filterTipo) params.append('tipo', filterTipo);
            if (filterStatus) params.append('status', filterStatus);
            const r = await api.get(`/clients?${params}`);
            setClients(r.data || []);
        } catch { }
        finally { setLoading(false); }
    }, [search, filterTipo, filterStatus]);

    useEffect(() => { loadClients(); }, [loadClients]);

    const filtered = filterTag
        ? clients.filter(c => parseTags(c.tags).includes(filterTag))
        : clients;

    const vipCount    = clients.filter(c => parseTags(c.tags).includes('VIP')).length;
    const inadCount   = clients.filter(c => parseTags(c.tags).includes('Inadimplente')).length;
    const activeCount = clients.filter(c => c.status === 'ativo').length;

    const handleDelete = async (id: string, nome: string) => {
        if (!confirm(`Desativar cliente "${nome}"? (não será excluído)`)) return;
        try { await api.delete(`/clients/${id}`); loadClients(); }
        catch { alert('Erro ao desativar'); }
    };

    if (viewingOs) return (
        <OrderDetails order={viewingOs} onClose={() => setViewingOs(null)} onUpdate={() => {}} initialTab="Histórico" />
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={18} color="#3b82f6"/>
                    </div>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Clientes</h1>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>
                            {activeCount} ativos
                            {vipCount > 0 && <span style={{ color: '#f59e0b', marginLeft: '8px' }}>· {vipCount} VIP ⭐</span>}
                            {inadCount > 0 && <span style={{ color: '#ef4444', marginLeft: '8px' }}>· {inadCount} inadimplentes ⚠️</span>}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                    <button onClick={exportCsv} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '9px 14px', borderRadius: '9px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', minHeight: '40px' }}>
                        <Download size={14}/> Exportar CSV
                    </button>
                    <button onClick={loadClients} style={{ padding: '9px', borderRadius: '9px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: loading ? '#3b82f6' : 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '40px', minHeight: '40px' }}>
                        <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/>
                    </button>
                    <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '9px', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#fff', minHeight: '40px' }}>
                        <Plus size={16}/> Novo Cliente
                    </button>
                </div>
            </div>

            {/* KPIs rápidos de tags */}
            <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                <button onClick={() => setFilterTag('')} style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: !filterTag ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)', color: !filterTag ? '#60a5fa' : 'rgba(255,255,255,0.5)', border: `1px solid ${!filterTag ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer' }}>
                    Todos ({clients.length})
                </button>
                {ALL_TAGS.map(tag => {
                    const count = clients.filter(c => parseTags(c.tags).includes(tag)).length;
                    if (count === 0) return null;
                    const cfg = TAG_CFG[tag];
                    return (
                        <button key={tag} onClick={() => setFilterTag(filterTag === tag ? '' : tag)} style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: filterTag === tag ? cfg.bg : 'rgba(255,255,255,0.04)', color: filterTag === tag ? cfg.color : 'rgba(255,255,255,0.5)', border: `1px solid ${filterTag === tag ? cfg.color + '40' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {cfg.icon} {tag} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Busca e filtros */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <Search size={13} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}/>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar nome, CPF/CNPJ, e-mail..." style={{ ...inp, paddingLeft: '34px', fontSize: '13px' }}/>
                </div>
                <button onClick={() => setShowFilters(f => !f)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '9px 12px', borderRadius: '9px', background: showFilters ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${showFilters ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}`, color: showFilters ? '#60a5fa' : 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', minHeight: '40px' }}>
                    <Filter size={13}/> Filtros {showFilters ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                </button>
            </div>
            {showFilters && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} style={{ ...inp, width: 'auto', fontSize: '13px' }}>
                        <option value="">Tipo</option>
                        <option value="PF">Pessoa Física</option>
                        <option value="PJ">Pessoa Jurídica</option>
                    </select>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inp, width: 'auto', fontSize: '13px' }}>
                        <option value="">Status</option>
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                    </select>
                    {(filterTipo || filterStatus || filterTag) && (
                        <button onClick={() => { setFilterTipo(''); setFilterStatus(''); setFilterTag(''); }} style={{ padding: '9px 12px', borderRadius: '9px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '13px', cursor: 'pointer' }}>
                            Limpar filtros
                        </button>
                    )}
                </div>
            )}

            {/* Tabela */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }}/> Carregando...
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    {['Cliente', 'Contato', 'Cidade', 'Tags', 'Status', ''].map(h => (
                                        <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                                        <User size={28} style={{ opacity: 0.2, display: 'block', margin: '0 auto 10px' }}/>
                                        Nenhum cliente encontrado
                                    </td></tr>
                                ) : filtered.map((c, i) => {
                                    const tags = parseTags(c.tags);
                                    const whatsapp = c.contatos?.find(ct => ct.tipo === 'whatsapp' || ct.principal);
                                    const isInativo = c.status === 'inativo';
                                    return (
                                        <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', opacity: isInativo ? 0.6 : 1 }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                            <td style={{ padding: '11px 14px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: c.tipo === 'PJ' ? 'rgba(139,92,246,0.15)' : 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px', fontWeight: 700, color: c.tipo === 'PJ' ? '#a78bfa' : '#60a5fa' }}>
                                                        {c.nome.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                                                            {c.nome}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>
                                                            {c.cpfCnpj || c.email || (c.tipo === 'PJ' ? 'PJ' : 'PF')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '11px 14px' }}>
                                                {whatsapp && (
                                                    <a href={`https://wa.me/${whatsapp.numero.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#22c55e', textDecoration: 'none' }}>
                                                        <MessageCircle size={12}/>{whatsapp.numero}
                                                    </a>
                                                )}
                                                {c.email && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{c.email}</div>}
                                            </td>
                                            <td style={{ padding: '11px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                                                {c.cidade ? `${c.cidade}/${c.estado}` : '—'}
                                            </td>
                                            <td style={{ padding: '11px 14px' }}>
                                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                    {tags.map(tag => <TagBadge key={tag} tag={tag} small/>)}
                                                    {tags.length === 0 && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>—</span>}
                                                </div>
                                            </td>
                                            <td style={{ padding: '11px 14px' }}>
                                                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: c.status === 'ativo' ? 'rgba(34,197,94,0.12)' : 'rgba(107,114,128,0.1)', color: c.status === 'ativo' ? '#22c55e' : '#9ca3af', border: `1px solid ${c.status === 'ativo' ? 'rgba(34,197,94,0.2)' : 'rgba(107,114,128,0.15)'}` }}>
                                                    {c.status === 'ativo' ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '11px 10px' }}>
                                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                                    <button onClick={() => { setDetailClient(c); setDetailTab('info'); }} title="Ver detalhes" style={{ padding: '6px', borderRadius: '7px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Eye size={12}/></button>
                                                    <button onClick={() => { setEditClient(c); setShowModal(true); }} title="Editar" style={{ padding: '6px', borderRadius: '7px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Edit3 size={12}/></button>
                                                    <button onClick={() => handleDelete(c.id, c.nome)} title="Desativar" style={{ padding: '6px', borderRadius: '7px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={12}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div style={{ padding: '9px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                            <span>{filtered.length} cliente{filtered.length !== 1 ? 's' : ''}</span>
                            <span>{filterTag && `Filtro: ${filterTag}`}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* ── MODAL DETALHE ── */}
            {detailClient && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
                    <div style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: '92dvh', overflowY: 'auto' }}>
                        {/* Header */}
                        <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 800, color: '#60a5fa' }}>
                                    {detailClient.nome.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{detailClient.nome}</div>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                                        {detailClient.tipo} · {detailClient.cpfCnpj || detailClient.email || '—'}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setDetailClient(null)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', borderRadius: '8px', padding: '7px', cursor: 'pointer', display: 'flex' }}><X size={15}/></button>
                        </div>

                        {/* Tags resumo */}
                        <div style={{ padding: '10px 20px 0', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            {parseTags(detailClient.tags).map(tag => <TagBadge key={tag} tag={tag}/>)}
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid rgba(255,255,255,0.07)', margin: '12px 20px 0', paddingBottom: '0' }}>
                            {(['info','stats','tags','contatos','os'] as const).map(tab => (
                                <button key={tab} onClick={() => setDetailTab(tab)} style={{ padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: detailTab === tab ? 600 : 400, color: detailTab === tab ? '#fff' : 'rgba(255,255,255,0.4)', borderBottom: detailTab === tab ? '2px solid #3b82f6' : '2px solid transparent', marginBottom: '-1px', transition: 'all 0.15s', textTransform: 'capitalize' }}>
                                    {tab === 'info' ? '📋 Info' : tab === 'stats' ? '📊 Stats & LTV' : tab === 'tags' ? '🏷️ Tags' : tab === 'contatos' ? '📞 Contatos' : '🔧 OS'}
                                </button>
                            ))}
                        </div>

                        <div style={{ padding: '16px 20px 20px' }}>
                            {/* Info */}
                            {detailTab === 'info' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        {[
                                            ['Nome', detailClient.nome],
                                            ['Tipo', detailClient.tipo === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'],
                                            ['CPF/CNPJ', detailClient.cpfCnpj || '—'],
                                            ['E-mail', detailClient.email || '—'],
                                            ['Cidade', detailClient.cidade ? `${detailClient.cidade}/${detailClient.estado}` : '—'],
                                            ['Aniversário', detailClient.birthday ? fmtDate(detailClient.birthday) : '—'],
                                        ].map(([label, value]) => (
                                            <div key={label} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '3px' }}>{label}</div>
                                                <div style={{ fontSize: '13px', color: '#fff' }}>{value}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {detailClient.observacoes && (
                                        <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '3px' }}>Observações</div>
                                            <div style={{ fontSize: '13px', color: '#fff' }}>{detailClient.observacoes}</div>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                        <button onClick={() => { setEditClient(detailClient); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '9px 14px', borderRadius: '9px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                                            <Edit3 size={13}/> Editar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Stats LTV */}
                            {detailTab === 'stats' && <StatsPanel clientId={detailClient.id}/>}

                            {/* Tags */}
                            {detailTab === 'tags' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Selecione as tags que melhor descrevem este cliente:</p>
                                    <TagEditor clientId={detailClient.id} current={parseTags(detailClient.tags)} onUpdate={() => { loadClients(); setDetailClient(prev => prev ? { ...prev, tags: prev.tags } : null); }}/>
                                </div>
                            )}

                            {/* Contatos */}
                            {detailTab === 'contatos' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {!detailClient.contatos?.length ? (
                                        <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Nenhum contato cadastrado</div>
                                    ) : detailClient.contatos.map(ct => (
                                        <div key={ct.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: ct.principal ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.06)' }}>
                                            {ct.tipo === 'whatsapp' ? <MessageCircle size={15} color="#22c55e"/> : <Phone size={15} color="#94a3b8"/>}
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>{ct.numero}</div>
                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{ct.tipo}{ct.principal ? ' · Principal' : ''}</div>
                                            </div>
                                            {ct.tipo === 'whatsapp' && (
                                                <a href={`https://wa.me/${ct.numero.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ padding: '6px 10px', borderRadius: '7px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e', fontSize: '11px', fontWeight: 600, textDecoration: 'none' }}>
                                                    WhatsApp
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* OS */}
                            {detailTab === 'os' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {!detailClient.osHistorico?.length ? (
                                        <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Nenhuma OS encontrada</div>
                                    ) : (detailClient.osHistorico as any[]).map((os: any) => (
                                        <div key={os.id} onClick={() => handleViewOs(os.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', transition: 'background 0.12s' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#60a5fa', fontFamily: 'monospace' }}>#{os.osNumero || os.protocol}</div>
                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{fmtDate(os.dataAbertura || os.entryDate)}</div>
                                            </div>
                                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>{os.status}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal novo/editar */}
            {(showModal || editClient) && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
                    <div style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: '94dvh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#fff' }}>{editClient ? 'Editar Cliente' : 'Novo Cliente'}</h2>
                            <button onClick={() => { setShowModal(false); setEditClient(null); }} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', borderRadius: '8px', padding: '7px', display: 'flex', alignItems: 'center' }}><X size={16}/></button>
                        </div>
                        <div style={{ overflowY: 'auto', flex: 1, padding: '20px' }}>
                            <ClientForm initialData={editClient as any || undefined}
                                isEdit={!!editClient}
                                onCancel={() => { setShowModal(false); setEditClient(null); }}
                                onSubmit={async (data) => {
                                    try {
                                        if (editClient) {
                                            await api.patch(`/clients/${editClient.id}`, data);
                                        } else {
                                            await api.post('/clients', data);
                                        }
                                        setShowModal(false);
                                        setEditClient(null);
                                        loadClients();
                                    } catch (e: any) {
                                        alert('Erro ao salvar cliente: ' + (e?.response?.data?.message || 'Verifique os dados'));
                                        throw e; // To keep loading state in ClientForm if needed
                                    }
                                }}/>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
