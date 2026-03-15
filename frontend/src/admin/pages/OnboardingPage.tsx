import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { BarChart3, RefreshCw, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

interface Step { key:string; label:string; done:boolean; points:number; }
interface TenantScore { tenantId:string; tenantName:string; status:string; score:number; maxScore:number; steps:Step[]; createdAt:string; }

const STATUS_COLORS: Record<string,string> = { active:'#22c55e', trial:'#f59e0b', suspended:'#ef4444', past_due:'#f97316', inactive:'#6b7280' };

const ScoreBar: React.FC<{ score:number; max:number }> = ({ score, max }) => {
    const pct = max > 0 ? Math.round((score/max)*100) : 0;
    const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
    return (
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{ flex:1, height:'6px', background:'rgba(255,255,255,0.06)', borderRadius:'20px', overflow:'hidden' }}>
                <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:'20px', transition:'width 0.4s ease' }} />
            </div>
            <span style={{ fontSize:'12px', fontWeight:700, color, minWidth:'35px', textAlign:'right' }}>{pct}%</span>
        </div>
    );
};

export const OnboardingPage: React.FC = () => {
    const [scores, setScores] = useState<TenantScore[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string|null>(null);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        api.get('/admin/dashboard/onboarding').then(r => setScores(r.data)).catch(()=>{}).finally(()=>setLoading(false));
    }, []);

    const filtered = scores.filter(s => {
        if (filter === 'low') return (s.score / s.maxScore) < 0.5;
        if (filter === 'mid') return (s.score / s.maxScore) >= 0.5 && (s.score / s.maxScore) < 0.8;
        if (filter === 'high') return (s.score / s.maxScore) >= 0.8;
        return true;
    });

    const avg = scores.length > 0 ? Math.round(scores.reduce((a,s) => a + (s.score/s.maxScore)*100, 0) / scores.length) : 0;
    const fullyOnboarded = scores.filter(s => s.score === s.maxScore).length;
    const atRisk = scores.filter(s => (s.score/s.maxScore) < 0.4).length;

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'rgba(59,130,246,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <BarChart3 size={18} color="#3b82f6" />
                </div>
                <div>
                    <h1 style={{ fontSize:'18px', fontWeight:800, color:'#fff', margin:0 }}>Onboarding Score</h1>
                    <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', margin:0 }}>Progresso de configuração de cada tenant</p>
                </div>
                {loading && <RefreshCw size={14} color="rgba(255,255,255,0.3)" style={{ animation:'spin 1s linear infinite', marginLeft:'auto' }} />}
            </div>

            {/* KPIs */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px,1fr))', gap:'8px' }}>
                {[
                    { label:'Média geral', value:`${avg}%`, color:'#3b82f6' },
                    { label:'Completos', value:fullyOnboarded, color:'#22c55e' },
                    { label:'Em risco', value:atRisk, color:'#ef4444' },
                    { label:'Total', value:scores.length, color:'#94a3b8' },
                ].map(k => (
                    <div key={k.label} style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${k.color}20`, borderRadius:'10px', padding:'12px 14px', textAlign:'center' }}>
                        <div style={{ fontSize:'22px', fontWeight:800, color:k.color }}>{k.value}</div>
                        <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)', marginTop:'2px' }}>{k.label}</div>
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div style={{ display:'flex', gap:'5px' }}>
                {[['all','Todos'],['high','Alto (80%+)'],['mid','Médio (50-80%)'],['low','Baixo (<50%)']].map(([k,l]) => (
                    <button key={k} onClick={()=>setFilter(k)} style={{ padding:'6px 12px', borderRadius:'20px', background:filter===k?'rgba(59,130,246,0.15)':'rgba(255,255,255,0.04)', border:`1px solid ${filter===k?'rgba(59,130,246,0.3)':'rgba(255,255,255,0.08)'}`, color:filter===k?'#60a5fa':'rgba(255,255,255,0.5)', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>{l}</button>
                ))}
            </div>

            {/* Lista */}
            <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                {filtered.map(s => {
                    const pct = Math.round((s.score/s.maxScore)*100);
                    const statusColor = STATUS_COLORS[s.status] || '#94a3b8';
                    const isExpanded = expanded === s.tenantId;
                    return (
                        <div key={s.tenantId} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'10px', overflow:'hidden' }}>
                            <div onClick={()=>setExpanded(isExpanded ? null : s.tenantId)} style={{ padding:'12px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:'12px' }}>
                                <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:`${statusColor}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:800, color:statusColor, flexShrink:0 }}>
                                    {s.tenantName.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                                        <span style={{ fontSize:'13px', fontWeight:700, color:'#fff' }}>{s.tenantName}</span>
                                        <span style={{ fontSize:'10px', padding:'1px 6px', borderRadius:'20px', background:`${statusColor}15`, color:statusColor }}>{s.status}</span>
                                    </div>
                                    <ScoreBar score={s.score} max={s.maxScore} />
                                </div>
                                <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.3)', flexShrink:0 }}>{isExpanded?'▲':'▼'}</div>
                            </div>
                            {isExpanded && (
                                <div style={{ padding:'0 16px 14px', borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:'10px', display:'flex', flexDirection:'column', gap:'6px' }}>
                                    {s.steps.map(step => (
                                        <div key={step.key} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'6px 10px', background:step.done?'rgba(34,197,94,0.06)':'rgba(255,255,255,0.02)', borderRadius:'7px', border:`1px solid ${step.done?'rgba(34,197,94,0.15)':'rgba(255,255,255,0.05)'}` }}>
                                            {step.done ? <CheckCircle size={13} color="#22c55e" /> : <XCircle size={13} color="rgba(255,255,255,0.2)" />}
                                            <span style={{ flex:1, fontSize:'12px', color:step.done?'#fff':'rgba(255,255,255,0.4)' }}>{step.label}</span>
                                            <span style={{ fontSize:'11px', fontWeight:700, color:step.done?'#22c55e':'rgba(255,255,255,0.2)' }}>+{step.points}pts</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
};
