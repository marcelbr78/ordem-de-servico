import React, { useState } from 'react';
import { Palette, Save, Monitor, Moon, Sun } from 'lucide-react';

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

const PRESET_COLORS = [
    { name:'Azul (padrão)', primary:'#3b82f6', secondary:'#7c3aed' },
    { name:'Verde',          primary:'#10b981', secondary:'#059669' },
    { name:'Laranja',        primary:'#f97316', secondary:'#ea580c' },
    { name:'Roxo',           primary:'#8b5cf6', secondary:'#7c3aed' },
    { name:'Rosa',           primary:'#ec4899', secondary:'#db2777' },
    { name:'Ciano',          primary:'#06b6d4', secondary:'#0891b2' },
];

export const AppearanceSettings: React.FC<{ settings:Record<string,string>; onSave:(k:string,v:string)=>Promise<void> }> = ({ settings, onSave }) => {
    const [data, setData] = useState({
        ui_primary_color:    settings.ui_primary_color || '#3b82f6',
        ui_secondary_color:  settings.ui_secondary_color || '#7c3aed',
        ui_theme:            settings.ui_theme || 'dark',
        ui_language:         settings.ui_language || 'pt-BR',
        ui_date_format:      settings.ui_date_format || 'DD/MM/YYYY',
        ui_currency:         settings.ui_currency || 'BRL',
        ui_sidebar_collapsed: settings.ui_sidebar_collapsed === 'true',
        ui_compact_mode:     settings.ui_compact_mode === 'true',
        ui_show_kanban_default: settings.ui_show_kanban_default === 'true',
        ui_default_page:     settings.ui_default_page || 'dashboard',
        ui_items_per_page:   settings.ui_items_per_page || '20',
    });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string|null>(null);

    const save = async () => {
        setSaving(true);
        try { for (const [k,v] of Object.entries(data)) await onSave(k, String(v)); setMsg('Aparência salva!'); }
        catch { setMsg('Erro'); } finally { setSaving(false); setTimeout(()=>setMsg(null),3000); }
    };

    const gradient = `linear-gradient(135deg, ${data.ui_primary_color}, ${data.ui_secondary_color})`;

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
            {/* Cores */}
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'20px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
                    <Palette size={18} color="#a855f7" />
                    <h3 style={{ fontSize:'15px', fontWeight:700, color:'#fff', margin:0 }}>Cores do Sistema</h3>
                </div>

                {/* Presets */}
                <div style={{ marginBottom:'16px' }}>
                    <label style={lbl}>Paletas prontas</label>
                    <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                        {PRESET_COLORS.map(c => (
                            <button key={c.name} onClick={()=>setData(p=>({...p, ui_primary_color:c.primary, ui_secondary_color:c.secondary}))} style={{ display:'flex', alignItems:'center', gap:'7px', padding:'7px 12px', borderRadius:'20px', background:data.ui_primary_color===c.primary?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.04)', border:`1px solid ${data.ui_primary_color===c.primary?'rgba(255,255,255,0.3)':'rgba(255,255,255,0.08)'}`, cursor:'pointer', fontSize:'12px', color:data.ui_primary_color===c.primary?'#fff':'rgba(255,255,255,0.5)' }}>
                                <div style={{ width:'14px', height:'14px', borderRadius:'50%', background:`linear-gradient(135deg, ${c.primary}, ${c.secondary})` }} />
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'14px' }}>
                    <div>
                        <label style={lbl}>Cor principal</label>
                        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                            <input type="color" value={data.ui_primary_color} onChange={e=>setData(p=>({...p, ui_primary_color:e.target.value}))} style={{ width:'44px', height:'40px', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.1)', background:'none', cursor:'pointer', padding:'2px' }} />
                            <input value={data.ui_primary_color} onChange={e=>setData(p=>({...p, ui_primary_color:e.target.value}))} style={{ ...inp, fontFamily:'monospace' }} />
                        </div>
                    </div>
                    <div>
                        <label style={lbl}>Cor secundária</label>
                        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                            <input type="color" value={data.ui_secondary_color} onChange={e=>setData(p=>({...p, ui_secondary_color:e.target.value}))} style={{ width:'44px', height:'40px', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.1)', background:'none', cursor:'pointer', padding:'2px' }} />
                            <input value={data.ui_secondary_color} onChange={e=>setData(p=>({...p, ui_secondary_color:e.target.value}))} style={{ ...inp, fontFamily:'monospace' }} />
                        </div>
                    </div>
                </div>

                {/* Preview gradiente */}
                <div style={{ height:'36px', borderRadius:'10px', background:gradient, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:700, color:'#fff', marginBottom:'8px' }}>
                    Prévia do gradiente do sistema
                </div>
            </div>

            {/* Interface */}
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'20px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
                    <Monitor size={18} color="#3b82f6" />
                    <h3 style={{ fontSize:'15px', fontWeight:700, color:'#fff', margin:0 }}>Interface</h3>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'14px' }}>
                    <div>
                        <label style={lbl}>Página inicial</label>
                        <select value={data.ui_default_page} onChange={e=>setData(p=>({...p, ui_default_page:e.target.value}))} style={inp}>
                            <option value="dashboard">Dashboard</option>
                            <option value="orders">Ordens de Serviço</option>
                            <option value="kanban">Kanban</option>
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Itens por página</label>
                        <select value={data.ui_items_per_page} onChange={e=>setData(p=>({...p, ui_items_per_page:e.target.value}))} style={inp}>
                            {['10','15','20','30','50'].map(v=><option key={v} value={v}>{v} itens</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Idioma</label>
                        <select value={data.ui_language} onChange={e=>setData(p=>({...p, ui_language:e.target.value}))} style={inp}>
                            <option value="pt-BR">Português (BR)</option>
                            <option value="en">English</option>
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Formato de data</label>
                        <select value={data.ui_date_format} onChange={e=>setData(p=>({...p, ui_date_format:e.target.value}))} style={inp}>
                            <option value="DD/MM/YYYY">DD/MM/AAAA</option>
                            <option value="MM/DD/YYYY">MM/DD/AAAA</option>
                            <option value="YYYY-MM-DD">AAAA-MM-DD</option>
                        </select>
                    </div>
                </div>
                <div style={{ background:'rgba(255,255,255,0.02)', borderRadius:'10px', padding:'0 14px' }}>
                    <Toggle label="Sidebar recolhida por padrão" sub="Mais espaço na tela principal" value={data.ui_sidebar_collapsed} onChange={v=>setData(p=>({...p, ui_sidebar_collapsed:v}))} />
                    <Toggle label="Modo compacto" sub="Reduz o espaçamento entre elementos" value={data.ui_compact_mode} onChange={v=>setData(p=>({...p, ui_compact_mode:v}))} />
                    <Toggle label="Abrir Kanban por padrão" sub="Exibe o Kanban como tela inicial das OS" value={data.ui_show_kanban_default} onChange={v=>setData(p=>({...p, ui_show_kanban_default:v}))} />
                </div>
            </div>

            {msg && <div style={{ padding:'10px 16px', borderRadius:'10px', background:msg.includes('Erro')?'rgba(239,68,68,0.1)':'rgba(34,197,94,0.1)', color:msg.includes('Erro')?'#ef4444':'#22c55e', fontSize:'13px' }}>{msg}</div>}
            <button onClick={save} disabled={saving} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 24px', borderRadius:'10px', background:gradient, color:'#fff', border:'none', fontWeight:700, fontSize:'14px', cursor:'pointer', alignSelf:'flex-start', minHeight:'44px' }}>
                <Save size={16}/>{saving?'Salvando...':'Salvar Aparência'}
            </button>
        </div>
    );
};
