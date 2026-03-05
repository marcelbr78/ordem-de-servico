import React from 'react';
import { Settings, Shield, Bell, Zap, Cloud, Smartphone } from 'lucide-react';

export const MasterSettings: React.FC = () => {
    return (
        <div style={{ color: '#fff' }}>
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>Configurações do Ecossistema</h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px' }}>Definições globais que afetam todas as lojas e o comportamento do SaaS.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                        { label: 'Geral', icon: Settings, active: true },
                        { label: 'Segurança & Auth', icon: Shield },
                        { label: 'Notificações Globais', icon: Bell },
                        { label: 'Integrações (Webhooks)', icon: Zap },
                        { label: 'Configurações de Cloud', icon: Cloud },
                        { label: 'App Mobile Master', icon: Smartphone },
                    ].map((item, idx) => (
                        <div key={idx} style={{
                            display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '12px',
                            background: item.active ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                            color: item.active ? '#3b82f6' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontWeight: '600'
                        }}>
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '40px' }}>
                    <h3 style={{ margin: '0 0 30px' }}>Configurações Gerais</h3>

                    <div style={{ display: 'grid', gap: '30px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Nome da Plataforma (Branding)</label>
                            <input defaultValue="OS4U - Smart OS Management" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '10px', color: '#fff' }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
                            <div>
                                <div style={{ fontWeight: '700' }}>Permitir Auto-Cadastro</div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Novas lojas podem se cadastrar sem sua aprovação manual.</div>
                            </div>
                            <div style={{ width: '40px', height: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', position: 'relative' }}>
                                <div style={{ width: '16px', height: '16px', background: '#3b82f6', borderRadius: '50%', position: 'absolute', right: '2px', top: '2px' }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
                            <div>
                                <div style={{ fontWeight: '700' }}>Modo de Manutenção Global</div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Bloqueia o acesso a todas as lojas para manutenção.</div>
                            </div>
                            <div style={{ width: '40px', height: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', position: 'relative' }}>
                                <div style={{ width: '16px', height: '16px', background: 'rgba(255,255,255,0.3)', borderRadius: '50%', position: 'absolute', left: '2px', top: '2px' }} />
                            </div>
                        </div>

                        <button style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '700', marginTop: '10px', cursor: 'pointer' }}>Salvar Alterações Master</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
