import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import type { SubscriptionAdminDto } from '../../services/adminService';
import { CreditCard, Calendar, RefreshCcw } from 'lucide-react';

export const BillingPage: React.FC = () => {
    const [subscriptions, setSubscriptions] = useState<SubscriptionAdminDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSubscriptions();
    }, []);

    const loadSubscriptions = async () => {
        try {
            setLoading(true);
            const data = await adminService.getSubscriptions();
            setSubscriptions(data);
        } catch (error) {
            console.error('Failed to load subscriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="animate-fade" style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '2px' }}>VERIFICANDO ASSINATURAS...</div>
            </div>
        );
    }

    return (
        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <header>
                <h1 className="gradient-text" style={{ fontSize: '32px', fontWeight: 900, margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CreditCard color="#10b981" size={28} />
                    Faturamento & Planos
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', marginTop: '8px' }}>Gestão global de cobranças MRR e limites operacionais SaaS.</p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {subscriptions.map((subs) => (
                    <div key={subs.tenantId} className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                <CreditCard size={24} color="#10b981" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>{subs.tenantName}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                        <RefreshCcw size={14} color="var(--accent-primary)" />
                                        Plano {subs.planName}
                                    </span>
                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                        <Calendar size={14} color="#f59e0b" />
                                        Renovação: {subs.nextBillingDate ? new Date(subs.nextBillingDate).toLocaleDateString('pt-BR') : '—'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontWeight: 800, letterSpacing: '1px', marginBottom: '4px' }}>MRR Valor</span>
                                <span style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>R$ {(subs.monthlyPrice ?? 0).toFixed(2)}</span>
                            </div>

                            <div style={{ height: '40px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />

                            <div style={{ minWidth: '140px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <span style={{
                                    fontSize: '11px', fontWeight: 800, letterSpacing: '1px', padding: '6px 14px', borderRadius: '100px', textAlign: 'center',
                                    background: subs.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: subs.status === 'ACTIVE' ? '#10b981' : '#ef4444',
                                    border: `1px solid ${subs.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                                }}>
                                    {subs.status === 'ACTIVE' ? 'ATIVO' : 'ATRASADA'}
                                </span>
                            </div>

                            <button style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                                Alterar Plano
                            </button>
                        </div>
                    </div>
                ))}

                {subscriptions.length === 0 && (
                    <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                        Não existem assinaturas SaaS ativas ou processadas no momento.
                    </div>
                )}
            </div>
        </div>
    );
};
