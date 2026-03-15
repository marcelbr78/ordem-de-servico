import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Users,
    Building2,
    Activity,
    Zap,
    TrendingUp,
    ShieldCheck,
    Cpu,
    Clock
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

const growthData = [
    { name: 'Jan', value: 4000, active: 2400 },
    { name: 'Fev', value: 3000, active: 1398 },
    { name: 'Mar', value: 5000, active: 9800 },
    { name: 'Abr', value: 4500, active: 3908 },
    { name: 'Mai', value: 6000, active: 4800 },
    { name: 'Jun', value: 8500, active: 3800 },
];

export const MasterDashboard: React.FC = () => {
    const [metrics, setMetrics] = useState<Record<string, number> | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await api.get('/tenants/metrics');
                setMetrics(res.data);
            } catch (e) {
                console.error('Erro ao buscar métricas', e);
            } finally {
                setLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    if (loading) return (
        <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%' }} />
            <div style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '1px' }}>SINCRONIZANDO INTELIGÊNCIA SaaS...</div>
        </div>
    );

    const stats = [
        { label: 'Ecosystem Growth', value: metrics?.totalTenants || 0, icon: Building2, color: '#3b82f6', trend: '+12.5%', sub: 'Novas Lojas este mês' },
        { label: 'Active Sessions', value: metrics?.activeNow || 0, icon: Users, color: '#10b981', trend: '+5.2%', sub: 'Usuários em tempo real' },
        { label: 'Projected MRR', value: ((metrics?.totalTenants || 0) * 99.90).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: Zap, color: '#f59e0b', trend: '+24.1%', sub: 'Receita Mensal Recorrente' },
        { label: 'Network Uptime', value: '99.99%', icon: Activity, color: '#8b5cf6', trend: 'Optimal', sub: 'Status dos Servidores' },
    ];

    return (
        <div className="animate-fade" style={{ position: 'relative' }}>
            {/* Background Glows */}
            <div className="accent-glow" style={{ top: '-100px', right: '-50px', width: '400px', height: '400px', background: 'var(--accent-primary)' }} />
            <div className="accent-glow" style={{ bottom: '100px', left: '-100px', width: '300px', height: '300px', background: 'var(--accent-secondary)' }} />

            <div style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
                        <ShieldCheck size={16} /> Central de Comando OS4U
                    </div>
                    <h1 className="gradient-text" style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '-1px', margin: 0 }}>Strategic Overview</h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '18px', marginTop: '4px' }}>Análise de performance global da infraestrutura multitenant.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontWeight: 600 }}>ULTRA SYNC ACTIVE</div>
                        <div style={{ color: '#10b981', fontSize: '14px', fontWeight: 700 }}>2ms Latency</div>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px', position: 'relative', zIndex: 1 }}>
                {stats.map((stat, idx) => (
                    <div key={idx} className="glass-card" style={{ padding: '28px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                            <div style={{
                                width: '52px',
                                height: '52px',
                                background: `${stat.color}15`,
                                color: stat.color,
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: `inset 0 0 10px ${stat.color}10`
                            }}>
                                <stat.icon size={26} />
                            </div>
                            <div style={{
                                color: stat.trend.includes('+') ? '#10b981' : '#fff',
                                background: stat.trend.includes('+') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                                padding: '6px 12px',
                                borderRadius: '10px',
                                fontSize: '13px',
                                fontWeight: '800',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                {stat.trend} <TrendingUp size={14} />
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: '38px', fontWeight: '900', color: '#fff', marginBottom: '4px', letterSpacing: '-1px' }}>{stat.value}</div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', fontWeight: '600' }}>{stat.label}</div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '8px' }}>{stat.sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Multi-Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', position: 'relative', zIndex: 1 }}>
                {/* Visual Intelligence Section */}
                <div className="glass-card" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>Crescimento de Lojas SaaS</h3>
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', margin: '4px 0 0' }}>Série temporal de novos clientes e atividade.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button style={{ padding: '8px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600 }}>Exportar PDF</button>
                            <button style={{ padding: '8px 16px', borderRadius: '10px', background: 'var(--accent-primary)', color: '#fff', fontSize: '12px', fontWeight: 700 }}>Full Report</button>
                        </div>
                    </div>

                    <div style={{ height: '340px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={growthData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.15)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="rgba(255,255,255,0.15)" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                                <Tooltip
                                    contentStyle={{ background: '#1c1c24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="var(--accent-primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Infrastructure Monitor Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="glass-card" style={{ padding: '24px', flex: 1 }}>
                        <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Cpu size={18} color="var(--accent-primary)" /> Infra Status
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {[
                                { label: 'CPU Cluster Alpha', val: 12, color: '#10b981' },
                                { label: 'DB Connections', val: 45, color: '#3b82f6' },
                                { label: 'Memory Usage', val: 68, color: '#f59e0b' },
                                { label: 'Storage (SaaS)', val: 24, color: '#8b5cf6' },
                            ].map((item, i) => (
                                <div key={i}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                                        <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{item.label}</span>
                                        <span style={{ fontWeight: 800 }}>{item.val}%</span>
                                    </div>
                                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', overflow: 'hidden' }}>
                                        <div style={{ width: `${item.val}%`, height: '100%', background: item.color, borderRadius: '10px' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                            <span style={{ fontWeight: '800', fontSize: '14px', letterSpacing: '0.5px' }}>OS4U Intelligence</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' }}>
                            A rede está operando em alta eficiência. Não foram detectados gargalos estruturais nos novos bancos de dados isolados.
                        </p>
                    </div>
                </div>
            </div>

            {/* Recent Activity Mini-Table */}
            <div className="glass-card" style={{ marginTop: '24px', padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Clock size={20} color="var(--accent-primary)" /> Atividade das Lojas
                    </h3>
                    <button style={{ color: 'var(--accent-primary)', fontSize: '13px', fontWeight: 600 }}>Ver Todas Lojas</button>
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Building2 size={20} color="rgba(255,255,255,0.5)" />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '14px' }}>Store Alpha {i}</div>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Criou 12 novas ordens hoje</div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '13px', fontWeight: 700 }}>+ R$ 1.250,00</div>
                                <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>Active Now</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
