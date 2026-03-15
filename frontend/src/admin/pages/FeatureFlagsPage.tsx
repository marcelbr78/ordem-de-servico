import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ToggleLeft, ToggleRight, RefreshCw, Beaker, Globe, Building2 } from 'lucide-react';

interface Flag {
    id:string; key:string; name:string; description?:string;
    enabledGlobally:boolean; enabledForPlans?:string; enabledForTenants?:string;
    disabledForTenants?:string; category:string; isBeta:boolean;
}

const CATEGORY_CFG: Record<string,{ label:string; color:string }> = {
    billing:    { label:'Faturamento', color:'#22c55e' },
    integration:{ label:'Integração',  color:'#3b82f6' },
    ui:         { label:'Interface',   color:'#a855f7' },
    beta:       { label:'Beta',        color:'#f59e0b' },
    general:    { label:'Geral',       color:'#94a3b8' },
    compliance: { label:'Compliance',  color:'#ef4444' },
};

export const FeatureFlagsPage: React.FC = () => {
    const [flags, setFlags] = useState<Flag[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string|null>(null);
    const [filter, setFilter] = useState('all');

    const load = async () => {
        setLoading(true);
        try { const r = await api.get('/admin/feature-flags'); setFlags(r.data); }
        catch {} finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const toggle = async (flag: Flag) => {
        setSaving(flag.id);
        try {
            const r = await api.patch(`/admin/feature-flags/${flag.id}`, { enabledGlobally: !flag.enabledGlobally });
            setFlags(prev => prev.map(f => f.id === flag.id ? r.data : f));
        } catch {} finally { setSaving(null); }
    };

    const grouped: Record<string, Flag[]> = {};
    const toShow = filter === 'all' ? flags : flags.filter(f => f.category === filter);
    toShow.forEach(f => { if (!grouped[f.category]) grouped[f.category] = []; grouped[f.category].push(f); });

    const enabledCount = flags.filter(f => f.enabledGlobally).length;

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'rgba(34,197,94,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}><ToggleRight size={18} color="#22c55e" /></div>
                <div>
                    <h1 style={{ fontSize:'18px', fontWeight:800, color:'#fff', margin:0 }}>Feature Flags</h1>
                    <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', margin:0 }}>{enabledCount}/{flags.length} funcionalidades ativas globalmente</p>
                </div>
                {loading && <RefreshCw size={14} color="rgba(255,255,255,0.3)" style={{ animation:'spin 1s linear infinite', marginLeft:'auto' }} />}
            </div>

            {/* Info */}
            <div style={{ padding:'10px 14px', background:'rgba(59,130,246,0.07)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:'10px', fontSize:'12px', color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>
                <Globe size={12} style={{ display:'inline', marginRight:'5px', color:'#60a5fa' }} />
                <strong style={{ color:'#60a5fa' }}>Global</strong> — liga para todos os tenants.
                <Building2 size={12} style={{ display:'inline', marginLeft:'10px', marginRight:'5px', color:'#a5b4fc' }} />
                <strong style={{ color:'#a5b4fc' }}>Por tenant</strong> — use os IDs no campo para controle granular.
                <Beaker size={12} style={{ display:'inline', marginLeft:'10px', marginRight:'5px', color:'#f59e0b' }} />
                <strong style={{ color:'#f59e0b' }}>Beta</strong> — funcionalidades em teste, desabilitadas por padrão.
            </div>

            {/* Filtro por categoria */}
            <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
                <button onClick={()=>setFilter('all')} style={{ padding:'5px 11px', borderRadius:'20px', background:filter==='all'?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.04)', border:`1px solid ${filter==='all'?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.08)'}`, color:filter==='all'?'#fff':'rgba(255,255,255,0.4)', fontSize:'11px', fontWeight:600, cursor:'pointer' }}>Todos</button>
                {Object.entries(CATEGORY_CFG).map(([k,v]) => (
                    <button key={k} onClick={()=>setFilter(k)} style={{ padding:'5px 11px', borderRadius:'20px', background:filter===k?`${v.color}15`:'rgba(255,255,255,0.04)', border:`1px solid ${filter===k?`${v.color}35`:'rgba(255,255,255,0.08)'}`, color:filter===k?v.color:'rgba(255,255,255,0.4)', fontSize:'11px', fontWeight:600, cursor:'pointer' }}>{v.label}</button>
                ))}
            </div>

            {/* Flags agrupadas por categoria */}
            {Object.entries(grouped).map(([cat, catFlags]) => {
                const cfg = CATEGORY_CFG[cat] || CATEGORY_CFG.general;
                return (
                    <div key={cat}>
                        <div style={{ fontSize:'10px', fontWeight:800, color:`${cfg.color}80`, textTransform:'uppercase', letterSpacing:'1px', marginBottom:'6px', display:'flex', alignItems:'center', gap:'6px' }}>
                            <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:cfg.color }} />
                            {cfg.label} ({catFlags.length})
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                            {catFlags.map(flag => {
                                const isSaving = saving === flag.id;
                                return (
                                    <div key={flag.id} style={{ padding:'12px 16px', background:'rgba(255,255,255,0.03)', border:`1px solid ${flag.enabledGlobally?`${cfg.color}20`:'rgba(255,255,255,0.06)'}`, borderRadius:'10px', display:'flex', alignItems:'center', gap:'12px', transition:'all 0.15s' }}>
                                        {/* Toggle */}
                                        <button onClick={()=>toggle(flag)} disabled={isSaving} style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', flexShrink:0, opacity:isSaving?0.5:1, transition:'opacity 0.2s' }}>
                                            {flag.enabledGlobally
                                                ? <ToggleRight size={28} color={cfg.color} />
                                                : <ToggleLeft size={28} color="rgba(255,255,255,0.2)" />}
                                        </button>
                                        <div style={{ flex:1, minWidth:0 }}>
                                            <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'2px', flexWrap:'wrap' }}>
                                                <span style={{ fontSize:'13px', fontWeight:700, color:flag.enabledGlobally?'#fff':'rgba(255,255,255,0.55)' }}>{flag.name}</span>
                                                {flag.isBeta && <span style={{ fontSize:'9px', fontWeight:700, padding:'1px 6px', borderRadius:'20px', background:'rgba(245,158,11,0.15)', color:'#f59e0b', border:'1px solid rgba(245,158,11,0.3)' }}>BETA</span>}
                                                <span style={{ fontSize:'9px', color:'rgba(255,255,255,0.25)', fontFamily:'monospace' }}>{flag.key}</span>
                                            </div>
                                            {flag.description && <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', lineHeight:1.4 }}>{flag.description}</div>}
                                        </div>
                                        <div style={{ flexShrink:0, textAlign:'right' }}>
                                            {flag.enabledGlobally
                                                ? <span style={{ fontSize:'11px', fontWeight:700, color:cfg.color }}><Globe size={10} style={{ display:'inline', marginRight:'3px' }} />Global</span>
                                                : <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.25)' }}>Desabilitado</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
};
