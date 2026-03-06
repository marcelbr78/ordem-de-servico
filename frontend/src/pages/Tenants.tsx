import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Plus,
    Building2,
    Mail,
    Copy,
    ExternalLink,
    Search,
    Filter,
    MoreVertical,
    CheckCircle2,
    Ban,
    UserCircle,
    Server,
    Database
} from 'lucide-react';

export const Tenants: React.FC = () => {
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        storeName: '',
        ownerName: '',
        ownerEmail: '',
        cnpj: ''
    });
    const [createdResult, setCreatedResult] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchTenants = async () => {
        try {
            const res = await api.get('/tenants');
            setTenants(res.data);
        } catch (e) {
            console.error('Erro ao buscar tenants', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/tenants/register', formData);
            setCreatedResult(res.data);
            fetchTenants();
        } catch (e: any) {
            alert('Erro ao cadastrar loja: ' + (e.response?.data?.message || 'Erro desconhecido'));
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copiado para a área de transferência!');
    };

    const handleSuspend = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja SUSPENDER esta loja? O acesso será bloqueado imediatamente.')) return;
        try {
            await api.patch(`/tenants/${id}/suspend`);
            alert('Loja suspensa com sucesso!');
            fetchTenants();
        } catch (e: any) {
            alert('Erro ao suspender loja: ' + (e.response?.data?.message || 'Erro desconhecido'));
        }
    };

    const handleShadowing = (tenantId: string) => {
        // Implementação do Shadowing: Salvar o tenantId no localStorage e redirecionar
        localStorage.setItem('shadow_tenant_id', tenantId);
        window.open('/dashboard', '_blank');
        alert('Modo Shadowing ativado em uma nova aba!');
    };

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.cnpj && t.cnpj.includes(searchQuery))
    );

    if (loading) return (
        <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="animate-fade" style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '2px' }}>ORQUESTRANDO ECOSSISTEMA SaaS...</div>
        </div>
    );

    return (
        <div className="animate-fade" style={{ position: 'relative' }}>
            {/* Ambient Background Light */}
            <div className="accent-glow" style={{ top: '-150px', left: '10%', width: '600px', height: '600px', background: 'var(--accent-primary)' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', position: 'relative', zIndex: 1 }}>
                <div>
                    <h1 className="gradient-text" style={{ margin: 0, fontSize: '36px', fontWeight: 900, letterSpacing: '-1px' }}>
                        Enterprise Store Management
                    </h1>
                    <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Server size={18} /> Orquestração de bancos de dados isolados e infraestrutura de clientes.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setIsModalOpen(true);
                        setCreatedResult(null);
                        setFormData({ storeName: '', ownerName: '', ownerEmail: '', cnpj: '' });
                    }}
                    style={{
                        background: 'var(--accent-primary)',
                        color: '#fff',
                        border: 'none',
                        padding: '16px 28px',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 8px 30px rgba(59,130,246,0.3)',
                        fontSize: '15px'
                    }}
                >
                    <Plus size={22} /> Provisionar Nova Loja
                </button>
            </div>

            {/* Premium Metrics Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px', position: 'relative', zIndex: 1 }}>
                <div className="glass-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ width: '40px', height: '40px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Building2 size={20} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Lojas</span>
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: 900 }}>{tenants.length}</div>
                    <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 700, marginTop: '4px' }}>+3 este mês</div>
                </div>

                <div className="glass-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ width: '40px', height: '40px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle2 size={20} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px' }}>Operação Ativa</span>
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: 900 }}>{tenants.filter(t => t.status === 'active').length}</div>
                </div>

                <div className="glass-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ width: '40px', height: '40px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Database size={20} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px' }}>DBs Provisionados</span>
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: 900 }}>{tenants.length}</div>
                </div>
            </div>

            {/* Advanced Table UI */}
            <div className="glass-card" style={{ overflow: 'hidden', position: 'relative', zIndex: 1 }}>
                <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Pesquisar loja, CNPJ ou e-mail..."
                            style={{
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                padding: '14px 14px 14px 48px',
                                borderRadius: '14px',
                                color: '#fff',
                                fontSize: '14px',
                                width: '380px',
                                transition: 'all 0.2s',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                            <Filter size={18} /> Filtros Dinâmicos
                        </button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <th style={{ padding: '20px 24px', fontSize: '12px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>Assistência / ID</th>
                                <th style={{ padding: '20px 24px', fontSize: '12px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>Infra Status</th>
                                <th style={{ padding: '20px 24px', fontSize: '12px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>Admin / Contato</th>
                                <th style={{ padding: '20px 24px', fontSize: '12px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>Provisionamento</th>
                                <th style={{ padding: '20px 24px', fontSize: '12px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, textAlign: 'right' }}>Controles SaaS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTenants.map(tenant => (
                                <tr key={tenant.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} className="hover:bg-white/[0.01]">
                                    <td style={{ padding: '24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <Building2 size={22} color="rgba(255,255,255,0.5)" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: '16px', color: '#fff' }}>{tenant.name}</div>
                                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{tenant.id.slice(0, 8)} | {tenant.cnpj || 'Sem CNPJ'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: tenant.status === 'active' ? '#10b981' : '#ef4444', boxShadow: `0 0 10px ${tenant.status === 'active' ? '#10b981' : '#ef4444'}` }} />
                                            <span style={{
                                                fontSize: '12px', fontWeight: 800,
                                                color: tenant.status === 'active' ? '#10b981' : '#ef4444'
                                            }}>
                                                {tenant.status === 'active' ? 'ONLINE' : 'SUSPENSO'}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <UserCircle size={20} color="rgba(255,255,255,0.2)" />
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: 700 }}>{tenant.ownerName || 'Responsável'}</div>
                                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{tenant.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '24px' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{new Date(tenant.createdAt).toLocaleDateString('pt-BR')}</div>
                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>DB Isolated (SQLite)</div>
                                    </td>
                                    <td style={{ padding: '24px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => handleShadowing(tenant.id)}
                                                style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', border: 'none', padding: '10px 18px', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <ExternalLink size={16} /> Shadowing
                                            </button>
                                            <button
                                                onClick={() => handleSuspend(tenant.id)}
                                                style={{ background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}
                                            >
                                                <Ban size={18} />
                                            </button>
                                            <button style={{ background: 'rgba(255, 255, 255, 0.03)', color: 'rgba(255,255,255,0.4)', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}>
                                                <MoreVertical size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Premium Registration Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
                    <div className="glass-card animate-fade" style={{ background: '#0a0a0c', width: '100%', maxWidth: '550px', padding: '40px', position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h2 className="gradient-text" style={{ margin: '0 0 12px', fontSize: '28px', fontWeight: 900 }}>Provisionar Ecossistema</h2>
                        <p style={{ margin: '0 0 32px', color: 'rgba(255,255,255,0.4)', fontSize: '15px', lineHeight: '1.6' }}>
                            O sistema irá inicializar um banco de dados isolado e configurar o usuário administrador para a nova assistência técnica.
                        </p>

                        {!createdResult ? (
                            <form onSubmit={handleRegister} style={{ display: 'grid', gap: '24px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Nome Fantasia</label>
                                    <div style={{ position: 'relative' }}>
                                        <Building2 size={20} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }} />
                                        <input required value={formData.storeName} onChange={e => setFormData({ ...formData, storeName: e.target.value })} placeholder="Ex: Master Cell Assistência" style={{ width: '100%', padding: '14px 14px 14px 48px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: '#fff', fontSize: '16px' }} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Admin Full Name</label>
                                        <input required value={formData.ownerName} onChange={e => setFormData({ ...formData, ownerName: e.target.value })} placeholder="Ex: Rodrigo Mendonça" style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: '#fff', fontSize: '16px' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>CNPJ Corporativo</label>
                                        <input value={formData.cnpj} onChange={e => setFormData({ ...formData, cnpj: e.target.value })} placeholder="Opcional" style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: '#fff', fontSize: '16px' }} />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Login Administrativo</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={20} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }} />
                                        <input required type="email" value={formData.ownerEmail} onChange={e => setFormData({ ...formData, ownerEmail: e.target.value })} placeholder="admin@assistencia.com.br" style={{ width: '100%', padding: '14px 14px 14px 48px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: '#fff', fontSize: '16px' }} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
                                    <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontWeight: 700 }}>Interromper</button>
                                    <button type="submit" style={{ flex: 1, padding: '16px', borderRadius: '14px', border: 'none', background: 'var(--accent-primary)', color: '#fff', cursor: 'pointer', fontWeight: 800, boxShadow: '0 10px 30px rgba(59,130,246,0.3)' }}>Confirmar Provisionamento</button>
                                </div>
                            </form>
                        ) : (
                            <div style={{ textAlign: 'center' }} className="animate-fade">
                                <div style={{ width: '72px', height: '72px', background: 'rgba(16,185,129,0.1)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', margin: '0 auto 24px', border: '1px solid rgba(16,185,129,0.2)' }}>
                                    <CheckCircle2 size={36} />
                                </div>
                                <h3 style={{ margin: '0 0 12px', fontSize: '22px', fontWeight: 900 }}>Ambiente Isolado Pronto!</h3>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', marginBottom: '32px' }}>
                                    O banco de dados foi criado e o acesso administrativo está ativo.
                                </p>

                                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px', textAlign: 'left', marginBottom: '32px' }}>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontWeight: 800, display: 'block', marginBottom: '6px', letterSpacing: '1px' }}>Credencial de Acesso</label>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <code style={{ color: '#fff', fontSize: '16px', fontWeight: 700 }}>{createdResult.admin.email}</code>
                                            <button onClick={() => copyToClipboard(createdResult.admin.email)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', width: '32px', height: '32px', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Copy size={16} /></button>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontWeight: 800, display: 'block', marginBottom: '6px', letterSpacing: '1px' }}>Senha de Provisionamento</label>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <code style={{ color: 'var(--accent-primary)', fontSize: '24px', fontWeight: 900 }}>{createdResult.initialPassword}</code>
                                            <button onClick={() => copyToClipboard(createdResult.initialPassword)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', width: '32px', height: '32px', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Copy size={16} /></button>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setCreatedResult(null);
                                    }}
                                    style={{ width: '100%', padding: '18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Concluir e Voltar ao Dashboard
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

