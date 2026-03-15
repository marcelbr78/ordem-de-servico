import React, { useState } from 'react';
import { Globe, Save, Eye } from 'lucide-react';

const inp: React.CSSProperties = { width:'100%', padding:'10px 12px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#fff', fontSize:'14px', outline:'none', boxSizing:'border-box' };
const lbl: React.CSSProperties = { display:'block', fontSize:'12px', fontWeight:600, color:'rgba(255,255,255,0.6)', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.5px' };

const Toggle: React.FC<{ label:string; sub?:string; value:boolean; onChange:(v:boolean)=>void; color?:string }> = ({ label, sub, value, onChange, color='#3b82f6' }) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div><div style={{ fontSize:'14px', fontWeight:500, color:'#fff' }}>{label}</div>{sub && <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', marginTop:'2px' }}>{sub}</div>}</div>
        <button onClick={() => onChange(!value)} style={{ width:'44px', height:'24px', borderRadius:'12px', border:'none', cursor:'pointer', background:value?color:'rgba(255,255,255,0.1)', position:'relative', transition:'all 0.2s', flexShrink:0 }}>
            <div style={{ position:'absolute', top:'3px', left:value?'23px':'3px', width:'18px', height:'18px', borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
        </button>
    </div>
);

export const PublicStatusSettings: React.FC<{ settings:Record<string,string>; onSave:(k:string,v:string)=>Promise<void> }> = ({ settings, onSave }) => {
    const [data, setData] = useState({
        public_status_show_technician: settings.public_status_show_technician === 'true',
        public_status_show_price:      settings.public_status_show_price === 'true',
        public_status_show_timeline:   settings.public_status_show_timeline !== 'false',
        public_status_custom_message:  settings.public_status_custom_message || '',
        public_status_accent_color:    settings.public_status_accent_color || '#3b82f6',
    });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string|null>(null);

    const save = async () => {
        setSaving(true);
        try { for (const [k,v] of Object.entries(data)) await onSave(k, String(v)); setMsg('Salvo!'); }
        catch { setMsg('Erro'); } finally { setSaving(false); setTimeout(()=>setMsg(null),3000); }
    };

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'20px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
                    <Globe size={18} color="#6366f1" />
                    <h3 style={{ fontSize:'15px', fontWeight:700, color:'#fff', margin:0 }}>Página de Status Público</h3>
                    <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)', marginLeft:'auto' }}>Visível para o cliente pelo link da OS</span>
                </div>

                {/* Preview */}
                <div style={{ background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:'10px', padding:'14px', marginBottom:'16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                        <Eye size={13} color="#a5b4fc" />
                        <span style={{ fontSize:'12px', color:'#a5b4fc', fontWeight:600 }}>PREVIEW</span>
                    </div>
                    <div style={{ background:'#0f0f18', borderRadius:'8px', padding:'12px', fontSize:'12px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
                            <div style={{ width:'22px', height:'22px', borderRadius:'5px', background:data.public_status_accent_color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px' }}>🔧</div>
                            <span style={{ color:'#fff', fontWeight:700, fontSize:'13px' }}>AssistênciaTech</span>
                        </div>
                        {data.public_status_custom_message && <div style={{ padding:'7px 10px', background:'rgba(255,255,255,0.04)', borderRadius:'6px', color:'rgba(255,255,255,0.7)', marginBottom:'8px', fontSize:'11px', fontStyle:'italic' }}>"{data.public_status_custom_message}"</div>}
                        <div style={{ display:'flex', gap:'8px', fontSize:'11px', color:'rgba(255,255,255,0.5)' }}>
                            <span>📱 Galaxy A54</span>
                            <span>• Em Reparo</span>
                            {data.public_status_show_technician && <span>• Técnico: João</span>}
                            {data.public_status_show_price && <span>• R$ 185,00</span>}
                        </div>
                    </div>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:'12px', background:'rgba(255,255,255,0.02)', borderRadius:'10px', padding:'0 14px' }}>
                    <Toggle label="Mostrar nome do técnico" sub="Exibir quem está realizando o reparo" value={data.public_status_show_technician} onChange={v=>setData(p=>({...p,public_status_show_technician:v}))} />
                    <Toggle label="Mostrar valor do serviço" sub="Exibir o valor cobrado na página pública" value={data.public_status_show_price} onChange={v=>setData(p=>({...p,public_status_show_price:v}))} />
                    <Toggle label="Mostrar timeline completa" sub="Histórico de todas as mudanças de status" value={data.public_status_show_timeline} onChange={v=>setData(p=>({...p,public_status_show_timeline:v}))} />
                </div>

                <div style={{ marginTop:'16px', display:'grid', gridTemplateColumns:'2fr 1fr', gap:'12px' }}>
                    <div>
                        <label style={lbl}>Mensagem personalizada (opcional)</label>
                        <input value={data.public_status_custom_message} onChange={e=>setData(p=>({...p,public_status_custom_message:e.target.value}))} style={inp} placeholder="Ex: Obrigado pela confiança! Qualquer dúvida nos chame." />
                    </div>
                    <div>
                        <label style={lbl}>Cor de destaque</label>
                        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                            <input type="color" value={data.public_status_accent_color} onChange={e=>setData(p=>({...p,public_status_accent_color:e.target.value}))} style={{ width:'44px', height:'40px', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.1)', background:'none', cursor:'pointer', padding:'2px' }} />
                            <input value={data.public_status_accent_color} onChange={e=>setData(p=>({...p,public_status_accent_color:e.target.value}))} style={{ ...inp, fontFamily:'monospace' }} />
                        </div>
                    </div>
                </div>
            </div>

            {msg && <div style={{ padding:'10px 16px', borderRadius:'10px', background:msg.includes('Erro')?'rgba(239,68,68,0.1)':'rgba(34,197,94,0.1)', color:msg.includes('Erro')?'#ef4444':'#22c55e', fontSize:'13px' }}>{msg}</div>}
            <button onClick={save} disabled={saving} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 24px', borderRadius:'10px', background:'linear-gradient(135deg, #6366f1, #7c3aed)', color:'#fff', border:'none', fontWeight:700, fontSize:'14px', cursor:'pointer', alignSelf:'flex-start', minHeight:'44px' }}>
                <Save size={16}/>{saving?'Salvando...':'Salvar Status Público'}
            </button>
        </div>
    );
};
