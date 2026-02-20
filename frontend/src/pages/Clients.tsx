import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
    Plus, Search, X, User, Building2, Phone, MessageCircle,
    Edit3, Trash2, Eye, UserCheck, UserX, Star, History, MapPin
} from 'lucide-react';
import ClientForm from '../components/ClientForm';
import { OrderDetails } from '../components/orders/OrderDetails';
import { CountrySelect, DDIS } from '../components/CountrySelect';
import { CustomSelect } from '../components/CustomSelect';

// ─── Types ────────────────────────────────────────────
interface Contact {
    id: string;
    tipo: 'whatsapp' | 'telefone' | 'recados';
    numero: string;
    principal: boolean;
}

interface ClientData {
    id: string;
    tipo: 'PF' | 'PJ';
    nome: string;
    nomeFantasia?: string;
    cpfCnpj: string;
    cpfCnpjMasked?: string;
    email?: string;
    cep?: string;
    rua?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    endereco?: string;
    observacoes?: string;
    status: string;
    contatos: Contact[];
    osHistorico?: any[];
    createdAt: string;
    updatedAt: string;
}

interface OsHistoryItem {
    id: string;
    osNumero: string;
    status: string;
    tipo: string;
    dataAbertura: string;
}

// ─── Styles ─────────────────────────────────────────
const glassBg: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px',
};
const badge = (color: string): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
    background: `${color}18`, color, border: `1px solid ${color}30`,
});
const modalOverlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
};

const splitPhone = (fullNumber: string) => {
    const clean = fullNumber.replace(/[^\d+]/g, '');
    if (!clean) return { ddi: '+55', number: '' };
    if (!clean.includes('+')) return { ddi: '+55', number: clean };

    const sortedDDIS = [...DDIS].sort((a, b) => b.code.length - a.code.length);
    const ddiMatch = sortedDDIS.find(d => clean.startsWith(d.code));

    if (ddiMatch) return { ddi: ddiMatch.code, number: clean.slice(ddiMatch.code.length) };
    return { ddi: '+55', number: clean.replace('+55', '') };
};

const formatPhone = (v: string): string => {
    const d = v.replace(/\D/g, '');
    if (!d) return '';
    return d; // Formatação visual simples, o DDI é separado
};

const formatAddress = (c: ClientData): string => {
    const parts = [c.rua, c.numero, c.complemento, c.bairro, c.cidade, c.estado].filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
    return c.endereco || '';
};

export function Clients() {
    const [clients, setClients] = useState<ClientData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterTipo, setFilterTipo] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editClient, setEditClient] = useState<ClientData | null>(null);
    const [detailClient, setDetailClient] = useState<ClientData | null>(null);
    const [detailTab, setDetailTab] = useState<'info' | 'contatos' | 'os'>('info');
    const [osHistory, setOsHistory] = useState<OsHistoryItem[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [newContact, setNewContact] = useState({ tipo: 'telefone' as string, numero: '' });

    // ─── Fetch ─────────────────────────────────────────
    const fetchClients = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (filterTipo) params.append('tipo', filterTipo);
            if (filterStatus) params.append('status', filterStatus);
            const res = await api.get(`/clients?${params}`);
            setClients(res.data);
        } catch { setClients([]); }
        setLoading(false);
    }, [search, filterTipo, filterStatus]);

    useEffect(() => { fetchClients(); }, [fetchClients]);

    const fetchDetail = async (id: string) => {
        try {
            const res = await api.get(`/clients/${id}`);
            setDetailClient(res.data);
        } catch { /* ignore */ }
    };

    const fetchOsHistory = async (id: string) => {
        try {
            const res = await api.get(`/orders/client/${id}`);
            const mapped = res.data.map((o: any) => ({
                id: o.id,
                osNumero: o.protocol,
                status: o.status,
                tipo: o.equipments?.[0]?.type || 'Equipamento',
                dataAbertura: o.entryDate
            }));
            setOsHistory(mapped);
        } catch { setOsHistory([]); }
    };

    const handleOpenOrder = async (orderId: string) => {
        try {
            const res = await api.get(`/orders/${orderId}`);
            setSelectedOrder(res.data);
        } catch { alert('Erro ao carregar detalhes da OS'); }
    };




    // ─── Handlers ──────────────────────────────────────
    const handleCreate = async (data: any) => {
        setSaving(true);
        try {
            await api.post('/clients', data);
            setShowModal(false);
            fetchClients();
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Erro ao cadastrar');
        }
        setSaving(false);
    };

    const handleEdit = async (data: any) => {
        if (!editClient) return;
        setSaving(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { tipo, cpfCnpj, ...updateData } = data;
            await api.patch(`/clients/${editClient.id}`, updateData);
            setEditClient(null);
            fetchClients();
            if (detailClient?.id === editClient.id) fetchDetail(editClient.id);
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Erro ao atualizar');
        }
        setSaving(false);
    };

    const handleToggleStatus = async (client: ClientData) => {
        try {
            if (client.status === 'ativo') {
                await api.delete(`/clients/${client.id}`);
            } else {
                await api.patch(`/clients/${client.id}/reactivate`);
            }
            fetchClients();
            if (detailClient?.id === client.id) fetchDetail(client.id);
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Erro');
        }
    };

    const openDetail = (client: ClientData) => {
        setDetailTab('info');
        fetchDetail(client.id);
        fetchOsHistory(client.id);
    };

    // ─── Contact actions in detail modal ───────────────
    const addContactToClient = async () => {
        if (!detailClient || !newContact.numero) return;
        try {
            await api.post(`/clients/${detailClient.id}/contacts`, {
                tipo: newContact.tipo,
                numero: newContact.numero.replace(/[^\d+]/g, ''),
                principal: false,
            });
            fetchDetail(detailClient.id);
            setNewContact({ tipo: 'telefone', numero: '' });
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Erro ao adicionar contato');
        }
    };

    const deleteContact = async (contactId: string) => {
        if (!detailClient) return;
        try {
            await api.delete(`/clients/${detailClient.id}/contacts/${contactId}`);
            fetchDetail(detailClient.id);
        } catch { alert('Erro ao remover contato'); }
    };

    const setPrimaryContact = async (contactId: string) => {
        if (!detailClient) return;
        try {
            await api.patch(`/clients/${detailClient.id}/contacts/${contactId}`, { principal: true });
            fetchDetail(detailClient.id);
        } catch { alert('Erro'); }
    };

    const contactTypeIcon = (t: string) => t === 'whatsapp' ? <MessageCircle size={13} /> : <Phone size={13} />;
    const contactTypeLabel = (t: string) => t === 'whatsapp' ? 'WhatsApp' : t === 'recados' ? 'Recados' : 'Telefone';

    const getPrimaryPhone = (contatos: Contact[]): string => {
        const primary = contatos?.find(c => c.principal);
        if (primary) return formatPhone(primary.numero);
        return contatos?.[0] ? formatPhone(contatos[0].numero) : '—';
    };

    const statusColor = (s: string) => s === 'ativo' ? '#10b981' : '#ef4444';

    // ─── Render ────────────────────────────────────────
    return (
        <div style={{ padding: '24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#fff' }}>Clientes</h1>
                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>{clients.length} cliente(s) cadastrado(s)</p>
                </div>
                <button onClick={() => setShowModal(true)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                        borderRadius: '10px', border: 'none', fontWeight: 600, cursor: 'pointer',
                        background: 'linear-gradient(135deg, var(--primary), #7c3aed)', color: '#fff',
                    }}>
                    <Plus size={18} /> Novo Cliente
                </button>
            </div>

            {/* Search & Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'rgba(255,255,255,0.3)' }} />
                    <input placeholder="Buscar por nome, documento, fantasia..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        style={{
                            width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                            color: '#fff', fontSize: '14px', outline: 'none',
                        }}
                    />
                </div>
                {['PF', 'PJ'].map(t => (
                    <button key={t} onClick={() => setFilterTipo(filterTipo === t ? '' : t)}
                        style={{
                            padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                            border: filterTipo === t ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                            background: filterTipo === t ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                            color: filterTipo === t ? 'var(--primary)' : 'rgba(255,255,255,0.6)',
                        }}>
                        {t === 'PF' ? '👤 PF' : '🏢 PJ'}
                    </button>
                ))}
                {['ativo', 'inativo'].map(s => (
                    <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
                        style={{
                            padding: '10px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                            border: filterStatus === s ? `1px solid ${statusColor(s)}` : '1px solid rgba(255,255,255,0.1)',
                            background: filterStatus === s ? `${statusColor(s)}15` : 'rgba(255,255,255,0.04)',
                            color: filterStatus === s ? statusColor(s) : 'rgba(255,255,255,0.6)',
                        }}>
                        {s === 'ativo' ? '✅ Ativo' : '⛔ Inativo'}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div style={{ ...glassBg, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Carregando...</div>
                ) : clients.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                        <User size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                        <p>Nenhum cliente encontrado</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                {['Tipo', 'Nome', 'CPF/CNPJ', 'Contato Principal', 'Cidade/UF', 'Status', 'Ações'].map(h => (
                                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map(client => (
                                <tr key={client.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                                            {client.tipo === 'PF' ? <User size={14} /> : <Building2 size={14} />} {client.tipo}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ fontWeight: 500, color: '#fff', fontSize: '14px' }}>{client.nome}</div>
                                        {client.nomeFantasia && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{client.nomeFantasia}</div>}
                                    </td>
                                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                                        {client.cpfCnpjMasked || '***'}
                                    </td>
                                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {client.contatos?.[0] && contactTypeIcon(client.contatos.find(c => c.principal)?.tipo || client.contatos[0].tipo)}
                                            {getPrimaryPhone(client.contatos)}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                                        {[client.cidade, client.estado].filter(Boolean).join('/') || '—'}
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={badge(statusColor(client.status))}>{client.status}</span>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button onClick={() => openDetail(client)} title="Ver detalhes"
                                                style={{ padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', color: 'var(--primary)', cursor: 'pointer' }}><Eye size={16} /></button>
                                            <button onClick={() => setEditClient(client)} title="Editar"
                                                style={{ padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', color: 'var(--warning)', cursor: 'pointer' }}><Edit3 size={16} /></button>
                                            <button onClick={() => handleToggleStatus(client)} title={client.status === 'ativo' ? 'Inativar' : 'Reativar'}
                                                style={{ padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', color: client.status === 'ativo' ? 'var(--danger)' : '#10b981', cursor: 'pointer' }}>
                                                {client.status === 'ativo' ? <UserX size={16} /> : <UserCheck size={16} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ─── Create Modal ─── */}
            {showModal && (
                <div style={modalOverlay} onClick={() => setShowModal(false)}>
                    <div className="modal-box-responsive" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' }}>Novo Cliente</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <ClientForm onSubmit={handleCreate} onCancel={() => setShowModal(false)} loading={saving} />
                    </div>
                </div>
            )}

            {/* ─── Edit Modal ─── */}
            {editClient && (
                <div style={modalOverlay} onClick={() => setEditClient(null)}>
                    <div className="modal-box-responsive" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' }}>Editar Cliente</h2>
                            <button onClick={() => setEditClient(null)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <ClientForm isEdit initialData={{
                            tipo: editClient.tipo,
                            nome: editClient.nome,
                            nomeFantasia: editClient.nomeFantasia || '',
                            cpfCnpj: editClient.cpfCnpj,
                            email: editClient.email || '',
                            contatos: editClient.contatos || [],
                            endereco: {
                                cep: editClient.cep || '', rua: editClient.rua || '',
                                numero: editClient.numero || '', complemento: editClient.complemento || '',
                                bairro: editClient.bairro || '', cidade: editClient.cidade || '',
                                estado: editClient.estado || '',
                            },
                            observacoes: editClient.observacoes || '',
                        }} onSubmit={handleEdit} onCancel={() => setEditClient(null)} loading={saving} />
                    </div>
                </div>
            )}

            {/* ─── Detail Modal ─── */}
            {detailClient && (
                <div style={modalOverlay} onClick={() => setDetailClient(null)}>
                    <div className="modal-box-responsive" style={{ maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' }}>{detailClient.nome}</h2>
                                {detailClient.nomeFantasia && <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>{detailClient.nomeFantasia}</p>}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                <span style={badge(statusColor(detailClient.status))}>{detailClient.status}</span>
                                <button onClick={() => setDetailClient(null)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0' }}>
                            {([['info', 'Informações'], ['contatos', 'Contatos'], ['os', 'Histórico OS']] as const).map(([key, label]) => (
                                <button key={key} onClick={() => { setDetailTab(key); if (key === 'os') fetchOsHistory(detailClient.id); }}
                                    style={{
                                        padding: '10px 16px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                                        background: 'transparent', borderBottom: detailTab === key ? '2px solid var(--primary)' : '2px solid transparent',
                                        color: detailTab === key ? 'var(--primary)' : 'rgba(255,255,255,0.5)', marginBottom: '-1px',
                                    }}>{label}</button>
                            ))}
                        </div>

                        <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                            {/* Info Tab */}
                            {detailTab === 'info' && (
                                <div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                                        <div><span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Tipo</span><p style={{ margin: '2px 0', color: '#fff' }}>{detailClient.tipo === 'PF' ? '👤 Pessoa Física' : '🏢 Pessoa Jurídica'}</p></div>
                                        <div><span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>CPF/CNPJ</span><p style={{ margin: '2px 0', color: '#fff', fontFamily: 'monospace' }}>{detailClient.cpfCnpj}</p></div>
                                        <div><span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>E-mail</span><p style={{ margin: '2px 0', color: '#fff' }}>{detailClient.email || '—'}</p></div>
                                        <div><span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Cadastrado em</span><p style={{ margin: '2px 0', color: '#fff' }}>{new Date(detailClient.createdAt).toLocaleDateString('pt-BR')}</p></div>
                                    </div>
                                    {/* Address */}
                                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '14px', marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--primary)', marginBottom: '8px' }}>
                                            <MapPin size={14} /> Endereço
                                        </div>
                                        <p style={{ margin: 0, fontSize: '14px', color: '#fff' }}>{formatAddress(detailClient) || 'Não informado'}</p>
                                        {detailClient.cep && <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>CEP: {detailClient.cep}</p>}
                                    </div>
                                    {detailClient.observacoes && (
                                        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '14px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>📝 Observações</span>
                                            <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#fff' }}>{detailClient.observacoes}</p>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                        <button onClick={() => { setDetailClient(null); setEditClient(detailClient); }}
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--primary)', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                                            <Edit3 size={14} /> Editar
                                        </button>
                                        <button onClick={() => handleToggleStatus(detailClient)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: `1px solid ${detailClient.status === 'ativo' ? 'var(--danger)' : '#10b981'}`, background: 'transparent', color: detailClient.status === 'ativo' ? 'var(--danger)' : '#10b981', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                                            {detailClient.status === 'ativo' ? <><UserX size={14} /> Inativar</> : <><UserCheck size={14} /> Reativar</>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Contacts Tab */}
                            {detailTab === 'contatos' && (
                                <div>
                                    {detailClient.contatos?.map(c => (
                                        <div key={c.id} style={{
                                            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                                            background: 'rgba(255,255,255,0.03)', borderRadius: '10px', marginBottom: '8px',
                                            border: c.principal ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.06)',
                                        }}>
                                            <span style={{ color: c.tipo === 'whatsapp' ? '#25d366' : 'rgba(255,255,255,0.5)' }}>{contactTypeIcon(c.tipo)}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '14px', color: '#fff' }}>{formatPhone(c.numero)}</div>
                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                                                    {contactTypeLabel(c.tipo)} {c.principal && <span style={{ color: 'var(--warning)' }}>★ Principal</span>}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                {!c.principal && (
                                                    <button onClick={() => setPrimaryContact(c.id)} title="Marcar como principal"
                                                        style={{ padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', color: 'var(--warning)', cursor: 'pointer' }}><Star size={14} /></button>
                                                )}
                                                <button onClick={() => deleteContact(c.id)} title="Remover"
                                                    style={{ padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                    {/* Add new contact */}
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                        <CustomSelect
                                            value={newContact.tipo}
                                            onChange={val => setNewContact(p => ({ ...p, tipo: val }))}
                                            options={[
                                                { label: '📱 WhatsApp', value: 'whatsapp' },
                                                { label: '☎️ Telefone', value: 'telefone' },
                                                { label: '📝 Recados', value: 'recados' }
                                            ]}
                                            width="160px"
                                        />
                                        <CountrySelect
                                            value={splitPhone(newContact.numero).ddi}
                                            onChange={val => {
                                                const { number } = splitPhone(newContact.numero);
                                                setNewContact(p => ({ ...p, numero: `${val}${number}` }));
                                            }}
                                        />
                                        <input
                                            value={splitPhone(newContact.numero).number}
                                            placeholder="Ex: 99999-9999"
                                            onChange={e => {
                                                const { ddi } = splitPhone(newContact.numero);
                                                const clean = e.target.value.replace(/\D/g, '');
                                                setNewContact(p => ({ ...p, numero: `${ddi}${clean}` }));
                                            }}
                                            style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '13px', outline: 'none' }}
                                        />
                                        <button onClick={addContactToClient}
                                            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* OS History Tab */}
                            {detailTab === 'os' && (
                                <div>
                                    {osHistory.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '32px', color: 'rgba(255,255,255,0.4)' }}>
                                            <History size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                                            <p>Nenhuma OS registrada</p>
                                        </div>
                                    ) : osHistory.map(os => (
                                        <div key={os.id} onClick={() => handleOpenOrder(os.id)} style={{
                                            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                                            background: 'rgba(255,255,255,0.03)', borderRadius: '10px', marginBottom: '8px',
                                            cursor: 'pointer', transition: 'background 0.2s',
                                        }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, color: '#fff', fontSize: '14px' }}>OS #{os.osNumero}</div>
                                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{os.tipo} • {new Date(os.dataAbertura).toLocaleDateString('pt-BR')}</div>
                                            </div>
                                            <span style={badge(os.status === 'ENTREGUE' ? '#10b981' : os.status === 'RECUSADO' ? '#ef4444' : '#6366f1')}>{os.status}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {selectedOrder && (
                <OrderDetails
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onUpdate={() => {
                        handleOpenOrder(selectedOrder.id);
                        if (detailClient) fetchOsHistory(detailClient.id);
                    }}
                />
            )}
        </div>
    );
}
