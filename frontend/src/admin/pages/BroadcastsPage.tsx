import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Megaphone, Plus, Send, Users, Clock, CheckCircle, X, Save } from 'lucide-react';

const inp: React.CSSProperties = { width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#fff', fontSize:'14px', outline:'none', boxSizing:'border-box' };
const CHANNELS = [ { key:'in_app', label:'In-App Banner', icon:'🔔' }, { key:'email', label:'E-mail', icon:'✉️' }, { key:'whatsapp', label:'WhatsApp', icon:'📱' } ];
const TARGETS = [ { key:'all', label:'Todos os tenants' }, { key:'trial', label:'Em trial' }, { key:'active', label:'Ativos' }, { key:'past_due', label:'Inadimplentes' }, { key:'suspended', label:'Suspensos' } ];

interface Broadcast { id:string; title:string; body:string; channel:string; target:string; status:string; recipientCount:number; sentAt?:string; createdAt:string; }

export const BroadcastsPage: React.FC = () => {
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNew, setShowNew] = useState(false);
    const [form, setForm] = useState({ title:'', body:'', channel:'in_app', target:'all' });
    const [preview, setPreview] = useState<number|null>(null);
    const [sending, setSending] = useState<string|null>(null);

    const load = async () => { setLoading(true); try { const r = await api.get('/admin/broadcasts'); setBroadcasts(r.data); } catch {} finally { setLoading(false); } };
    useEffect(() => { load(); }, []);

    const getPreview = async (target: string) => {
        try { const r = await api.get(`/admin/broadcasts/preview/${target}`); setPreview(r.data.count); } catch {}
    };

    const handleCreate = async () => {
        try { await api.post('/admin/broadcasts', form); setShowNew(false); setForm({ title:'', body:'', channel:'in_app', target:'all' }); load(); } catch {}
    };

    const handleSend = async (id: string) => {
        if (!confirm('Enviar este comunicado agora?')) return;
        setSending(id);
        try { await api.post(`/admin/broadcasts/${id}/send`); load(); } catch {} finally { setSending(null); }
    };

    const STATUS_CFG: Record<string, { label:string; color:string }> = {
        draft: { label:'Rascunho', color:'#94a3b8' },
        sent: { label:'Enviado', color:'#22c55e' },
        scheduled: { label:'Agendado', color:'#f59e0b' },
    };

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'10px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'rgba(249,115,22,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Megaphone size={18} color="#f97316" />
                    </div>
                    <div>
                        <h1 style={{ fontSize:'18px', fontWeight:800, color:'#fff', margin:0 }}>Comunicados</h1>
                        <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', margin:0 }}>Envie mensagens para todos os tenants ou segmentos</p>
                    </div>
                </div>
                <button onClick={() => setShowNew(true)} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', borderRadius:'8px', background:'#f97316', color:'#fff', border:'none', fontWeight:700, fontSize:'13px', cursor:'pointer' }}>
                    <Plus size={14} /> Novo Comunicado
                </button>
            </div>

            {/* Lista */}
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {loading ? <div style={{ padding:'32px', textAlign:'center', color:'rgba(255,255,255,0.3)' }}>Carregando...</div>
                : broadcasts.length === 0 ? (
                    <div style={{ padding:'48px', textAlign:'center', color:'rgba(255,255,255,0.3)', display:'flex', flexDirection:'column', alignItems:'center', gap:'10px' }}>
                        <Megaphone size={32} style={{ opacity:0.2 }} />
                        <span>Nenhum comunicado enviado ainda</span>
                    </div>
                ) : broadcasts.map(b => {
                    const s = STATUS_CFG[b.status] || STATUS_CFG.draft;
                    return (
                        <div key={b.id} style={{ padding:'14px 16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'10px', display:'flex', alignItems:'center', gap:'14px', flexWrap:'wrap' }}>
                            <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px', flexWrap:'wrap' }}>
                                    <span style={{ fontSize:'14px', fontWeight:700, color:'#fff' }}>{b.title}</span>
                                    <span style={{ fontSize:'10px', fontWeight:700, padding:'1px 7px', borderRadius:'20px', background:`${s.color}15`, color:s.color }}>{s.label}</span>
                                    <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)' }}>{CHANNELS.find(c=>c.key===b.channel)?.icon} {CHANNELS.find(c=>c.key===b.channel)?.label}</span>
                                    <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)' }}><Users size={10} style={{ display:'inline', marginRight:'3px' }} />{TARGETS.find(t=>t.key===b.target)?.label}</span>
                                </div>
                                <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.body}</p>
                            </div>
                            <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
                                {b.status === 'sent'
                                    ? <div style={{ textAlign:'right' }}>
                                        <div style={{ fontSize:'13px', fontWeight:700, color:'#22c55e' }}>{b.recipientCount} enviados</div>
                                        <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)' }}>{b.sentAt ? new Date(b.sentAt).toLocaleDateString('pt-BR') : ''}</div>
                                      </div>
                                    : <button onClick={() => handleSend(b.id)} disabled={sending===b.id} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'8px', background:sending===b.id ? 'rgba(249,115,22,0.3)':'rgba(249,115,22,0.12)', border:'1px solid rgba(249,115,22,0.3)', color:'#f97316', fontSize:'12px', fontWeight:700, cursor:'pointer' }}>
                                        <Send size={12} /> {sending===b.id ? 'Enviando...' : 'Enviar Agora'}
                                      </button>
                                }
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal novo comunicado */}
            {showNew && (
                <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'16px' }}>
                    <div style={{ background:'#0f0f18', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'16px', width:'100%', maxWidth:'520px', padding:'24px', display:'flex', flexDirection:'column', gap:'16px' }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                            <h3 style={{ fontSize:'16px', fontWeight:800, color:'#fff', margin:0 }}>Novo Comunicado</h3>
                            <button onClick={()=>setShowNew(false)} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.5)', borderRadius:'7px', padding:'6px', cursor:'pointer', display:'flex' }}><X size={15} /></button>
                        </div>

                        {/* Canal */}
                        <div>
                            <label style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)', display:'block', marginBottom:'6px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>Canal de envio</label>
                            <div style={{ display:'flex', gap:'6px' }}>
                                {CHANNELS.map(c => (
                                    <button key={c.key} onClick={()=>setForm(p=>({...p,channel:c.key}))} style={{ flex:1, padding:'9px', borderRadius:'8px', background:form.channel===c.key?'rgba(249,115,22,0.15)':'rgba(255,255,255,0.04)', border:`1px solid ${form.channel===c.key?'rgba(249,115,22,0.4)':'rgba(255,255,255,0.08)'}`, color:form.channel===c.key?'#f97316':'rgba(255,255,255,0.5)', fontSize:'12px', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px' }}>
                                        {c.icon} {c.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Alvo */}
                        <div>
                            <label style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)', display:'block', marginBottom:'6px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>Público-alvo</label>
                            <select value={form.target} onChange={e=>{setForm(p=>({...p,target:e.target.value})); getPreview(e.target.value);}} style={inp}>
                                {TARGETS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                            </select>
                            {preview !== null && <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)', margin:'4px 0 0', display:'flex', alignItems:'center', gap:'4px' }}><Users size={10} />{preview} tenants serão notificados</p>}
                        </div>

                        <div><label style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)', display:'block', marginBottom:'5px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>Título</label><input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} style={inp} placeholder="Ex: Nova funcionalidade disponível!" /></div>
                        <div><label style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)', display:'block', marginBottom:'5px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>Mensagem</label><textarea value={form.body} onChange={e=>setForm(p=>({...p,body:e.target.value}))} style={{ ...inp, minHeight:'100px', resize:'vertical' }} placeholder="Conteúdo do comunicado..." /></div>

                        <div style={{ display:'flex', gap:'10px' }}>
                            <button onClick={()=>setShowNew(false)} style={{ flex:1, padding:'11px', borderRadius:'10px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', fontWeight:600, cursor:'pointer' }}>Cancelar</button>
                            <button onClick={handleCreate} style={{ flex:2, padding:'11px', borderRadius:'10px', background:'#f97316', color:'#fff', border:'none', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}><Save size={14} />Salvar Rascunho</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
