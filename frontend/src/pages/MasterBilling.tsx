import React from 'react';
import { TrendingUp, Calendar } from 'lucide-react';

export const MasterBilling: React.FC = () => {
    return (
        <div style={{ color: '#fff' }}>
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>Gestão de Assinaturas</h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px' }}>Controle o faturamento global e os planos das lojas clientes.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '24px', padding: '30px' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ width: '40px', height: '40px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp size={20} />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.5)' }}>MRR (Receita Mensal Recurrente)</span>
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: '800' }}>R$ 12.450,00</div>
                    <div style={{ marginTop: '10px', color: '#10b981', fontSize: '14px', fontWeight: '600' }}>+15% em relação ao mês anterior</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '24px', padding: '30px' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ width: '40px', height: '40px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Calendar size={20} />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.5)' }}>Próximos Vencimentos</span>
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: '800' }}>42 Faturas</div>
                    <div style={{ marginTop: '10px', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Previsto para os próximos 7 dias</div>
                </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '24px', padding: '30px' }}>
                <h3 style={{ margin: '0 0 30px' }}>Planos Ativos</h3>
                <div style={{ display: 'grid', gap: '20px' }}>
                    {[
                        { name: 'Plano Smart', price: 'R$ 99', users: 45, color: '#3b82f6' },
                        { name: 'Plano Pro', price: 'R$ 199', users: 32, color: '#8b5cf6' },
                        { name: 'Plano Enterprise', price: 'Personalizado', users: 12, color: '#f59e0b' },
                    ].map((plan, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: plan.color }} />
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '16px' }}>{plan.name}</div>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{plan.users} lojas ativas</div>
                                </div>
                            </div>
                            <div style={{ fontWeight: '800', fontSize: '18px' }}>{plan.price}/mês</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
