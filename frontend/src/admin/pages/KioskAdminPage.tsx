import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Monitor, ExternalLink, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';

interface TenantKiosk {
    id: string;
    storeName: string;
    subdomain: string;
    kioskEnabled: boolean;
    kioskUrl: string | null;
}

export const KioskAdminPage: React.FC = () => {
    const [tenants, setTenants] = useState<TenantKiosk[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const res = await api.get('/kiosk/admin/tenants');
            setTenants(res.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const toggle = async (tenant: TenantKiosk) => {
        setToggling(tenant.id);
        try {
            await api.patch(`/kiosk/admin/tenants/${tenant.id}`, { enabled: !tenant.kioskEnabled });
            setTenants(prev => prev.map(t =>
                t.id === tenant.id ? { ...t, kioskEnabled: !t.kioskEnabled } : t
            ));
        } finally {
            setToggling(null);
        }
    };

    const fullUrl = (path: string) => `${window.location.origin}${path}`;

    return (
        <div style={{ padding: '32px', maxWidth: '900px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                        width: '44px', height: '44px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Monitor size={22} color="#fff" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                            Kiosk Autoatendimento
                        </h1>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                            Gerencie o módulo kiosk por loja
                        </p>
                    </div>
                </div>
                <button
                    onClick={load}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 16px', borderRadius: '10px',
                        background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer',
                    }}
                >
                    <RefreshCw size={15} /> Atualizar
                </button>
            </div>

            {/* Info banner */}
            <div style={{
                padding: '16px 20px', borderRadius: '12px', marginBottom: '24px',
                background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6,
            }}>
                <strong style={{ color: 'var(--text-primary)' }}>Como funciona:</strong> Habilite o kiosk para uma loja para que ela possa usar o autoatendimento.
                O cliente acessa a URL da loja, informa os dados e abre a OS automaticamente — sem precisar de login.
            </div>

            {/* Table */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Carregando...</div>
            ) : (
                <div style={{
                    background: 'var(--bg-secondary)', borderRadius: '16px',
                    border: '1px solid var(--border-color)', overflow: 'hidden',
                }}>
                    {tenants.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            Nenhuma loja encontrada
                        </div>
                    ) : tenants.map((t, i) => (
                        <div key={t.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '20px 24px', gap: '16px',
                            borderBottom: i < tenants.length - 1 ? '1px solid var(--border-color)' : 'none',
                        }}>
                            {/* Store info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
                                    {t.storeName}
                                </div>
                                {t.kioskUrl ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                        <code style={{
                                            fontSize: '13px', color: 'var(--text-secondary)',
                                            background: 'var(--bg-tertiary)', padding: '2px 8px',
                                            borderRadius: '6px', overflow: 'hidden', textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap', maxWidth: '300px', display: 'block',
                                        }}>
                                            {fullUrl(t.kioskUrl)}
                                        </code>
                                        {t.kioskEnabled && (
                                            <a
                                                href={t.kioskUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{ color: '#6366f1', display: 'flex', alignItems: 'center' }}
                                                title="Abrir kiosk"
                                            >
                                                <ExternalLink size={14} />
                                            </a>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                        Sem subdomain cadastrado
                                    </div>
                                )}
                            </div>

                            {/* Status badge */}
                            <div style={{
                                padding: '4px 12px', borderRadius: '100px', fontSize: '13px', fontWeight: 600,
                                background: t.kioskEnabled ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
                                color: t.kioskEnabled ? '#4ade80' : 'var(--text-tertiary)',
                                border: `1px solid ${t.kioskEnabled ? 'rgba(34,197,94,0.25)' : 'var(--border-color)'}`,
                                whiteSpace: 'nowrap',
                            }}>
                                {t.kioskEnabled ? '● Ativo' : '○ Inativo'}
                            </div>

                            {/* Toggle button */}
                            <button
                                onClick={() => toggle(t)}
                                disabled={toggling === t.id || !t.kioskUrl}
                                title={!t.kioskUrl ? 'Loja sem subdomain — não é possível habilitar' : undefined}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '10px 18px', borderRadius: '10px', border: 'none',
                                    background: t.kioskEnabled ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.15)',
                                    color: t.kioskEnabled ? '#f87171' : '#818cf8',
                                    fontSize: '14px', fontWeight: 600, cursor: (!t.kioskUrl || toggling === t.id) ? 'not-allowed' : 'pointer',
                                    opacity: toggling === t.id ? 0.5 : 1,
                                    transition: 'all 0.15s', whiteSpace: 'nowrap',
                                }}
                            >
                                {t.kioskEnabled
                                    ? <><ToggleRight size={16} /> Desativar</>
                                    : <><ToggleLeft size={16} /> Ativar</>
                                }
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
