import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { BarChart3, TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Clock } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const fmtR$ = (v: number) => new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(v||0);

const COLORS = ['#3b82f6','#22c55e','#f59e0b','#a855f7','#ef4444','#06b6d4'];

const Tooltip$ = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background:'rgba(15,23,42,0.97)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', padding:'10px 14px' }}>
            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)', marginBottom:'6px' }}>{label}</div>
            {payload.map((p: any, i: number) => (
                <div key={i} style={{ fontSize:'12px', fontWeight:700, color:p.color || '#fff' }}>
                    {p.name}: {p.name === 'revenue' ? fmtR$(p.value) : p.value}
                </div>
            ))}
        </div>
    );
};

export const AnalyticsPage: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/dashboard/analytics').then(r => setData(r.data)).catch(()=>{}).finally(()=>setLoading(false));
    }, []);

    if (loading) return <div style={{ padding:'48px', textAlign:'center', color:'rgba(255,255,255,0.3)' }}>Carregando analytics...</div>;
    if (!data) return <div style={{ padding:'48px', textAlign:'center', color:'rgba(255,255,255,0.3)' }}>Sem dados disponíveis</div>;

    const { months = [], planDistribution = [], hourlyActivity = [] } = data;

    // Calcular tendências
    const lastMonth = months[months.length-1];
    const prevMonth = months[months.length-2];
    const revTrend = prevMonth?.revenue > 0 ? Math.round(((lastMonth?.revenue - prevMonth?.revenue)/prevMonth?.revenue)*100) : 0;
    const tenantTrend = months.reduce((s: number, m: any) => s + m.newTenants, 0);
    const churnTotal = months.reduce((s: number, m: any) => s + m.churned, 0);

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'rgba(168,85,247,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}><BarChart3 size={18} color="#a855f7" /></div>
                <div>
                    <h1 style={{ fontSize:'18px', fontWeight:800, color:'#fff', margin:0 }}>Analytics Avançado</h1>
                    <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', margin:0 }}>Últimos 6 meses · Dados em tempo real</p>
                </div>
            </div>

            {/* KPIs rápidos */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px,1fr))', gap:'8px' }}>
                {[
                    { label:'MRR atual', value:fmtR$(lastMonth?.revenue||0), icon:DollarSign, color:'#22c55e', trend:revTrend },
                    { label:'Novos (6m)', value:tenantTrend, icon:Users, color:'#3b82f6' },
                    { label:'Churn (6m)', value:churnTotal, icon:TrendingDown, color:churnTotal>0?'#ef4444':'#22c55e' },
                    { label:'OS este mês', value:lastMonth?.orders||0, icon:ShoppingCart, color:'#f59e0b' },
                ].map(k => (
                    <div key={k.label} style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${k.color}20`, borderRadius:'10px', padding:'12px 14px' }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
                            <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{k.label}</span>
                            <k.icon size={14} color={k.color} />
                        </div>
                        <div style={{ fontSize:'20px', fontWeight:800, color:'#fff' }}>{k.value}</div>
                        {'trend' in k && k.trend !== 0 && (
                            <div style={{ fontSize:'11px', color:(k as any).trend>0?'#22c55e':'#ef4444', marginTop:'3px', display:'flex', alignItems:'center', gap:'3px' }}>
                                {(k as any).trend>0?<TrendingUp size={10}/>:<TrendingDown size={10}/>} {Math.abs((k as any).trend)}% vs mês anterior
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Gráfico MRR + Tenants */}
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'12px', padding:'18px' }}>
                <h3 style={{ fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.6)', margin:'0 0 16px', textTransform:'uppercase', letterSpacing:'0.5px' }}>Receita & Crescimento</h3>
                <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={months}>
                        <defs>
                            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="tenGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="month" tick={{ fill:'rgba(255,255,255,0.4)', fontSize:11 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="rev" tick={{ fill:'rgba(255,255,255,0.4)', fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`} />
                        <YAxis yAxisId="ten" orientation="right" tick={{ fill:'rgba(255,255,255,0.4)', fontSize:10 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<Tooltip$ />} />
                        <Area yAxisId="rev" type="monotone" dataKey="revenue" name="revenue" stroke="#22c55e" fill="url(#revGrad)" strokeWidth={2} />
                        <Area yAxisId="ten" type="monotone" dataKey="newTenants" name="newTenants" stroke="#3b82f6" fill="url(#tenGrad)" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
                {/* Distribuição de planos */}
                <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'12px', padding:'16px' }}>
                    <h3 style={{ fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.6)', margin:'0 0 14px', textTransform:'uppercase', letterSpacing:'0.5px' }}>Distribuição por Plano</h3>
                    {planDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                                <Pie data={planDistribution} dataKey="count" nameKey="plan" cx="50%" cy="50%" outerRadius={60} label={({name, percent}) => `${name}: ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                                    {planDistribution.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <div style={{ padding:'32px', textAlign:'center', color:'rgba(255,255,255,0.2)', fontSize:'12px' }}>Sem dados de planos</div>}
                </div>

                {/* Atividade por hora */}
                <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'12px', padding:'16px' }}>
                    <h3 style={{ fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.6)', margin:'0 0 14px', textTransform:'uppercase', letterSpacing:'0.5px' }}>
                        <Clock size={12} style={{ display:'inline', marginRight:'5px' }} />Pico de Atividade (OS por hora)
                    </h3>
                    {hourlyActivity.length > 0 ? (
                        <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={hourlyActivity.map((h: any) => ({ hour:`${h.hour}h`, count: parseInt(h.count) }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="hour" tick={{ fill:'rgba(255,255,255,0.3)', fontSize:9 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill:'rgba(255,255,255,0.3)', fontSize:9 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<Tooltip$ />} />
                                <Bar dataKey="count" name="OS" fill="#a855f7" radius={[3,3,0,0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <div style={{ padding:'32px', textAlign:'center', color:'rgba(255,255,255,0.2)', fontSize:'12px' }}>Sem dados de atividade</div>}
                </div>
            </div>

            {/* Tabela mensal detalhada */}
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'12px', overflow:'hidden' }}>
                <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                    <h3 style={{ fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.6)', margin:0, textTransform:'uppercase', letterSpacing:'0.5px' }}>Histórico Mensal</h3>
                </div>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead><tr style={{ background:'rgba(255,255,255,0.02)' }}>
                        {['Mês','Novos Tenants','Churn','OS Criadas','Receita'].map(h => (
                            <th key={h} style={{ padding:'9px 14px', fontSize:'11px', fontWeight:700, color:'rgba(255,255,255,0.4)', textAlign:'left', textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</th>
                        ))}
                    </tr></thead>
                    <tbody>
                        {[...months].reverse().map((m: any, i: number) => (
                            <tr key={i} style={{ borderTop:'1px solid rgba(255,255,255,0.04)' }}>
                                <td style={{ padding:'9px 14px', fontSize:'13px', color:'#fff', fontWeight:600 }}>{m.month}</td>
                                <td style={{ padding:'9px 14px', fontSize:'13px', color:m.newTenants>0?'#22c55e':'rgba(255,255,255,0.4)' }}>+{m.newTenants}</td>
                                <td style={{ padding:'9px 14px', fontSize:'13px', color:m.churned>0?'#ef4444':'rgba(255,255,255,0.4)' }}>{m.churned>0?`-${m.churned}`:'-'}</td>
                                <td style={{ padding:'9px 14px', fontSize:'13px', color:'rgba(255,255,255,0.7)' }}>{m.orders}</td>
                                <td style={{ padding:'9px 14px', fontSize:'13px', color:'#22c55e', fontWeight:700 }}>{fmtR$(m.revenue)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
