import React from 'react';
import { Database, Globe, Cpu } from 'lucide-react';

export const MasterInfra: React.FC = () => {
    return (
        <div style={{ color: '#fff' }}>
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>Infraestrutura e Saúde</h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px' }}>Monitoramento em tempo real dos servidores e serviços OS4U.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '24px', padding: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <Database style={{ color: '#3b82f6' }} />
                            <span style={{ fontWeight: '600' }}>Banco de Dados (PostgreSQL)</span>
                        </div>
                        <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '4px 8px', borderRadius: '20px', fontWeight: '800' }}>ESTÁVEL</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginBottom: '10px' }}>
                        <div style={{ width: '15%', height: '100%', background: '#3b82f6' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                        <span>Uso de Disco</span>
                        <span>1.2 GB / 10 GB</span>
                    </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '24px', padding: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <Cpu style={{ color: '#8b5cf6' }} />
                            <span style={{ fontWeight: '600' }}>Carga da API (Node.js)</span>
                        </div>
                        <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '4px 8px', borderRadius: '20px', fontWeight: '800' }}>LATÊNCIA BAIXA</span>
                    </div>
                    <div style={{ height: '40px', display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
                        {[40, 30, 45, 60, 55, 40, 35, 50, 45, 30, 25, 40, 50].map((h, i) => (
                            <div key={i} style={{ flex: 1, background: '#8b5cf6', height: `${h}%`, borderRadius: '2px', opacity: 0.6 }} />
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '30px' }}>
                    <h3 style={{ margin: '0 0 20px', fontSize: '18px' }}>Atividades da Infra</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {[
                            { time: '10 min atrás', msg: 'Backup automático concluído com sucesso.' },
                            { time: '1h atrás', msg: 'Limpeza de cache Redis finalizada.' },
                            { time: '3h atrás', msg: 'Novo nó SSL adicionado ao cluster.' },
                        ].map((log, idx) => (
                            <div key={idx} style={{ padding: '12px', borderLeft: '2px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.01)' }}>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '4px' }}>{log.time}</div>
                                <div style={{ fontSize: '13px' }}>{log.msg}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '30px' }}>
                    <h3 style={{ margin: '0 0 20px', fontSize: '18px' }}>Geo-Localização de Tráfego</h3>
                    <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <div style={{ textAlign: 'center' }}>
                            <Globe size={40} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '10px' }} />
                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Mapa de Tráfego Global Indisponível</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
