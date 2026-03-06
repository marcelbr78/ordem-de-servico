import React, { useEffect, useState } from 'react';
import { marketplaceService } from '../services/marketplaceService';
import type { MarketplaceModule } from '../services/marketplaceService';
import { Blocks, CheckCircle, Package, Zap, BarChart, Settings, Loader } from 'lucide-react';

export const Marketplace: React.FC = () => {
    const [modules, setModules] = useState<MarketplaceModule[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        try {
            setLoading(true);
            const data = await marketplaceService.getAvailableModules();
            setModules(data);
        } catch (error) {
            console.error('Error fetching modules:', error);
            alert('Erro ao carregar aplicativos');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleInstall = async (mod: MarketplaceModule) => {
        if (mod.isCore) return;

        setActionLoading(prev => ({ ...prev, [mod.id]: true }));
        try {
            if (mod.isInstalled) {
                await marketplaceService.uninstallModule(mod.id);
                // alert(`Módulo ${getFriendlyName(mod.name)} desativado.`);
            } else {
                await marketplaceService.installModule(mod.id);
                // alert(`Módulo ${getFriendlyName(mod.name)} ativado com sucesso!`);
            }
            await fetchModules();
        } catch (error) {
            console.error('Error toggling module:', error);
            alert('Erro ao alterar aplicativo');
        } finally {
            setActionLoading(prev => ({ ...prev, [mod.id]: false }));
        }
    };

    const getIconForModule = (name: string) => {
        switch (name) {
            case 'core_os': return <Package size={24} color="#60a5fa" />;
            case 'inventory': return <Package size={24} color="#f59e0b" />;
            case 'whatsapp': return <Zap size={24} color="#10b981" />;
            case 'smartparts': return <Settings size={24} color="#a78bfa" />;
            case 'reports': return <BarChart size={24} color="#ec4899" />;
            default: return <Blocks size={24} color="#94a3b8" />;
        }
    };

    const getFriendlyName = (name: string) => {
        switch (name) {
            case 'core_os': return 'Ordens de Serviço (Core)';
            case 'inventory': return 'Estoque e Peças';
            case 'whatsapp': return 'Integração WhatsApp';
            case 'smartparts': return 'Cotações SmartParts';
            case 'reports': return 'Relatórios Avançados';
            default: return name;
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', color: 'rgba(255,255,255,0.4)' }}>
                <Loader style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} size={24} />
                Carregando App Store...
            </div>
        );
    }

    return (
        <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '12px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <Blocks size={32} color="#60a5fa" />
                </div>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>App Store</h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', margin: '4px 0 0', fontSize: '15px' }}>
                        Expanda as funcionalidades da sua assistência instalando novos módulos.
                    </p>
                </div>
            </div>

            {/* Modules Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {modules.map(mod => (
                    <div key={mod.id} style={{
                        background: mod.isInstalled ? 'rgba(59,130,246,0.03)' : 'var(--glass)',
                        border: mod.isInstalled ? '1px solid rgba(59,130,246,0.2)' : '1px solid var(--glass-border)',
                        borderRadius: '20px',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
                        transition: 'transform 0.2s',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                    >
                        {mod.isCore && (
                            <div style={{ position: 'absolute', top: '16px', right: '16px', padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                                Core
                            </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '12px',
                                background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {getIconForModule(mod.name)}
                            </div>
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{getFriendlyName(mod.name)}</h3>
                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                    {mod.price === 0 ? 'Grátis' : `R$ ${Number(mod.price).toFixed(2)}/mês`}
                                </div>
                            </div>
                        </div>

                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, flex: 1, margin: 0 }}>
                            {mod.description}
                        </p>

                        <div style={{ marginTop: 'auto' }}>
                            {mod.isCore ? (
                                <button disabled style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'not-allowed' }}>
                                    <CheckCircle size={16} /> Sempre Ativo
                                </button>
                            ) : mod.isInstalled ? (
                                <button
                                    onClick={() => handleToggleInstall(mod)}
                                    disabled={actionLoading[mod.id]}
                                    style={{ width: '100%', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: actionLoading[mod.id] ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
                                    onMouseEnter={e => { if (!actionLoading[mod.id]) e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; }}
                                    onMouseLeave={e => { if (!actionLoading[mod.id]) e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                                >
                                    {actionLoading[mod.id] ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Desinstalar'}
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleToggleInstall(mod)}
                                    disabled={actionLoading[mod.id]}
                                    style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: actionLoading[mod.id] ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s' }}
                                    onMouseEnter={e => { if (!actionLoading[mod.id]) e.currentTarget.style.opacity = '0.9'; }}
                                    onMouseLeave={e => { if (!actionLoading[mod.id]) e.currentTarget.style.opacity = '1'; }}
                                >
                                    {actionLoading[mod.id] ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Instalar Módulo'}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};
