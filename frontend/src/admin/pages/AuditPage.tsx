import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Shield, RefreshCw, Search, Filter } from 'lucide-react';

interface AuditLog { id:string; action:string; resource:string; resourceId?:string; details?:string; ipAddress?:string; createdAt:string; user?:{ name?:string; email?:string }; }

const ACTION_COLOR: Record<string,string> = {
    CREATE:'#22c55e', UPDATE:'#3b82f6', DELETE:'#ef4444', LOGIN:'#a855f7',
    IMPERSONATE:'#f97316', WEBHOOK_PAYMENT:'#06b6d4', ERROR:'#ef4444',
};

export const AuditPage: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const load = async (p = 1) => {
        setLoading(true);
        try {
            const r = await api.get('/admin/audit', { params: { page: p, search: search || undefined } });
            setLogs(r.data.data || r.data || []);
            setTotal(r.data.total || 0);
        } catch {} finally { setLoading(false); }
    };

    useEffect(() => { load(page); }, [page]);

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'rgba(239,68,68,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}><Shield size={18} color="#ef4444" /></div>
                <div>
                    <h1 style={{ fontSize:'18px', fontWeight:800, color:'#fff', margin:0 }}>Auditoria Global</h1>
                    <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', margin:0 }}>Log de todas as ações críticas da plataforma — LGPD compliance</p>
                </div>
            </div>

            <div style={{ display:'flex', gap:'8px' }}>
                <div style={{ flex:1, position:'relative' }}>
                    <Search size={13} style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.3)' }} />
                    <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load(1)} placeholder="Buscar por ação, recurso ou usuário..." style={{ width:'100%', padding:'9px 12px 9px 34px', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#fff', fontSize:'13px', outline:'none', boxSizing:'border-box' }} />
                </div>
                <button onClick={()=>load(1)} style={{ padding:'9px 14px', borderRadius:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', fontWeight:600 }}>
                    <RefreshCw size={13} style={{ animation:loading?'spin 1s linear infinite':'none' }} /> Atualizar
                </button>
            </div>

            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'12px', overflow:'hidden' }}>
                {loading && logs.length === 0 ? (
                    <div style={{ padding:'32px', textAlign:'center', color:'rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                        <RefreshCw size={14} style={{ animation:'spin 1s linear infinite' }} /> Carregando logs...
                    </div>
                ) : logs.length === 0 ? (
                    <div style={{ padding:'32px', textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:'13px' }}>Nenhum log encontrado</div>
                ) : (
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                        <thead><tr style={{ background:'rgba(255,255,255,0.03)' }}>
                            {['Quando','Ação','Recurso','Usuário','IP'].map(h => (
                                <th key={h} style={{ padding:'9px 14px', fontSize:'10px', fontWeight:700, color:'rgba(255,255,255,0.4)', textAlign:'left', textTransform:'uppercase', letterSpacing:'0.5px', whiteSpace:'nowrap' }}>{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>
                            {logs.map((l, i) => {
                                const actionColor = ACTION_COLOR[l.action] || '#94a3b8';
                                return (
                                    <tr key={l.id} style={{ borderTop:'1px solid rgba(255,255,255,0.04)', transition:'background 0.1s' }}
                                        onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.02)')}
                                        onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                                        <td style={{ padding:'9px 14px', fontSize:'11px', color:'rgba(255,255,255,0.4)', whiteSpace:'nowrap' }}>
                                            {new Date(l.createdAt).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                                        </td>
                                        <td style={{ padding:'9px 14px' }}>
                                            <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 8px', borderRadius:'20px', background:`${actionColor}15`, color:actionColor, border:`1px solid ${actionColor}25` }}>{l.action}</span>
                                        </td>
                                        <td style={{ padding:'9px 14px', fontSize:'12px', color:'rgba(255,255,255,0.7)' }}>
                                            <span style={{ fontWeight:600 }}>{l.resource}</span>
                                            {l.resourceId && <span style={{ color:'rgba(255,255,255,0.3)', marginLeft:'5px', fontFamily:'monospace', fontSize:'10px' }}>{l.resourceId.slice(0,8)}…</span>}
                                        </td>
                                        <td style={{ padding:'9px 14px', fontSize:'12px', color:'rgba(255,255,255,0.6)' }}>{l.user?.name || l.user?.email || '—'}</td>
                                        <td style={{ padding:'9px 14px', fontSize:'11px', color:'rgba(255,255,255,0.3)', fontFamily:'monospace' }}>{l.ipAddress || '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {total > 20 && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                    {page > 1 && <button onClick={()=>setPage(p=>p-1)} style={{ padding:'6px 12px', borderRadius:'7px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:'12px' }}>← Anterior</button>}
                    <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)' }}>Página {page} · {total} registros</span>
                    {page * 20 < total && <button onClick={()=>setPage(p=>p+1)} style={{ padding:'6px 12px', borderRadius:'7px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:'12px' }}>Próxima →</button>}
                </div>
            )}
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
};
