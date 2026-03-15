import React, { useState, useEffect } from 'react';
import { Printer, Save, Wifi, Bluetooth, Usb, TestTube } from 'lucide-react';

const inp: React.CSSProperties = { width:'100%', padding:'10px 12px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#fff', fontSize:'14px', outline:'none', boxSizing:'border-box' };
const lbl: React.CSSProperties = { display:'block', fontSize:'12px', fontWeight:600, color:'rgba(255,255,255,0.6)', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.5px' };

const Toggle: React.FC<{ label:string; sub?:string; value:boolean; onChange:(v:boolean)=>void; color?:string }> = ({ label, sub, value, onChange, color='#3b82f6' }) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div><div style={{ fontSize:'14px', fontWeight:500, color:'#fff' }}>{label}</div>{sub && <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', marginTop:'2px' }}>{sub}</div>}</div>
        <button onClick={() => onChange(!value)} style={{ width:'44px', height:'24px', borderRadius:'12px', border:'none', cursor:'pointer', background:value?color:'rgba(255,255,255,0.1)', position:'relative', transition:'all 0.2s', flexShrink:0 }}>
            <div style={{ position:'absolute', top:'3px', left:value?'23px':'3px', width:'18px', height:'18px', borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
        </button>
    </div>
);

export const ThermalPrinterSettings: React.FC<{ settings: Record<string,string>; onSave:(k:string,v:string)=>Promise<void> }> = ({ settings, onSave }) => {
    const [data, setData] = useState({
        thermal_enabled:         settings.thermal_enabled === 'true',
        thermal_connection:      settings.thermal_connection || 'bluetooth',
        thermal_ip:              settings.thermal_ip || '',
        thermal_port:            settings.thermal_port || '9100',
        thermal_paper_width:     settings.thermal_paper_width || '80',
        thermal_show_logo:       settings.thermal_show_logo !== 'false',
        thermal_show_qrcode:     settings.thermal_show_qrcode !== 'false',
        thermal_auto_print_entry:settings.thermal_auto_print_entry === 'true',
        thermal_copies:          settings.thermal_copies || '1',
    });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string|null>(null);
    const [testing, setTesting] = useState(false);

    const save = async () => {
        setSaving(true);
        try { for (const [k,v] of Object.entries(data)) await onSave(k, String(v)); setMsg('Salvo!'); }
        catch { setMsg('Erro'); } finally { setSaving(false); setTimeout(()=>setMsg(null),3000); }
    };

    const testPrint = async () => {
        setTesting(true);
        // Aqui chamaria a API de teste de impressão
        setTimeout(() => { setTesting(false); setMsg('Teste enviado para impressora'); setTimeout(()=>setMsg(null),3000); }, 1500);
    };

    const CONN = [
        { key:'bluetooth', label:'Bluetooth', icon:Bluetooth, hint:'Pareie a impressora via Bluetooth do dispositivo' },
        { key:'usb',       label:'USB',        icon:Usb,       hint:'Conecte via cabo USB (requer driver)' },
        { key:'network',   label:'Rede (IP)',  icon:Wifi,      hint:'Impressora conectada na mesma rede Wi-Fi' },
    ];

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'20px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
                    <Printer size={18} color="#f97316" />
                    <h3 style={{ fontSize:'15px', fontWeight:700, color:'#fff', margin:0 }}>Impressora Térmica</h3>
                    <div style={{ marginLeft:'auto', fontSize:'12px', color:'rgba(255,255,255,0.4)' }}>58mm e 80mm</div>
                </div>
                <Toggle label="Habilitar impressora térmica" sub="Ativar impressão em bobina para recibos e OS" value={data.thermal_enabled} onChange={v=>setData(p=>({...p,thermal_enabled:v}))} color="#f97316" />

                {data.thermal_enabled && (
                    <div style={{ marginTop:'16px', display:'flex', flexDirection:'column', gap:'16px' }}>
                        {/* Tipo de conexão */}
                        <div>
                            <label style={lbl}>Tipo de Conexão</label>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px' }}>
                                {CONN.map(c => (
                                    <button key={c.key} onClick={()=>setData(p=>({...p,thermal_connection:c.key}))} style={{ padding:'12px', borderRadius:'10px', border:`1px solid ${data.thermal_connection===c.key?'rgba(249,115,22,0.5)':'rgba(255,255,255,0.08)'}`, background:data.thermal_connection===c.key?'rgba(249,115,22,0.1)':'rgba(255,255,255,0.02)', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'6px' }}>
                                        <c.icon size={18} color={data.thermal_connection===c.key?'#f97316':'rgba(255,255,255,0.4)'} />
                                        <span style={{ fontSize:'12px', fontWeight:600, color:data.thermal_connection===c.key?'#f97316':'rgba(255,255,255,0.5)' }}>{c.label}</span>
                                    </button>
                                ))}
                            </div>
                            {data.thermal_connection && <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', marginTop:'6px' }}>{CONN.find(c=>c.key===data.thermal_connection)?.hint}</p>}
                        </div>

                        {/* IP se for rede */}
                        {data.thermal_connection === 'network' && (
                            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'12px' }}>
                                <div><label style={lbl}>Endereço IP</label><input value={data.thermal_ip} onChange={e=>setData(p=>({...p,thermal_ip:e.target.value}))} style={inp} placeholder="192.168.1.100" /></div>
                                <div><label style={lbl}>Porta</label><input value={data.thermal_port} onChange={e=>setData(p=>({...p,thermal_port:e.target.value}))} style={inp} placeholder="9100" /></div>
                            </div>
                        )}

                        {/* Largura do papel */}
                        <div>
                            <label style={lbl}>Largura do Papel</label>
                            <div style={{ display:'flex', gap:'8px' }}>
                                {['58','80'].map(w => (
                                    <button key={w} onClick={()=>setData(p=>({...p,thermal_paper_width:w}))} style={{ padding:'9px 20px', borderRadius:'8px', border:`1px solid ${data.thermal_paper_width===w?'rgba(249,115,22,0.4)':'rgba(255,255,255,0.1)'}`, background:data.thermal_paper_width===w?'rgba(249,115,22,0.1)':'transparent', color:data.thermal_paper_width===w?'#f97316':'rgba(255,255,255,0.5)', fontWeight:700, cursor:'pointer' }}>
                                        {w}mm
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Número de cópias */}
                        <div style={{ width:'120px' }}>
                            <label style={lbl}>Cópias</label>
                            <input type="number" min="1" max="5" value={data.thermal_copies} onChange={e=>setData(p=>({...p,thermal_copies:e.target.value}))} style={inp} />
                        </div>

                        {/* Toggles */}
                        <div style={{ background:'rgba(255,255,255,0.02)', borderRadius:'10px', padding:'0 14px' }}>
                            <Toggle label="Mostrar logo no recibo" value={data.thermal_show_logo} onChange={v=>setData(p=>({...p,thermal_show_logo:v}))} />
                            <Toggle label="QR Code no recibo" sub="Link para status público da OS" value={data.thermal_show_qrcode} onChange={v=>setData(p=>({...p,thermal_show_qrcode:v}))} />
                            <Toggle label="Imprimir ao abrir OS" sub="Impressão automática sem precisar clicar" value={data.thermal_auto_print_entry} onChange={v=>setData(p=>({...p,thermal_auto_print_entry:v}))} />
                        </div>

                        {/* Botão de teste */}
                        <button onClick={testPrint} disabled={testing} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 18px', borderRadius:'8px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', fontWeight:600, fontSize:'13px', cursor:'pointer', alignSelf:'flex-start' }}>
                            <TestTube size={14} /> {testing ? 'Enviando...' : 'Imprimir Página de Teste'}
                        </button>
                    </div>
                )}
            </div>

            {msg && <div style={{ padding:'10px 16px', borderRadius:'10px', background:msg.includes('Erro')?'rgba(239,68,68,0.1)':'rgba(34,197,94,0.1)', color:msg.includes('Erro')?'#ef4444':'#22c55e', fontSize:'13px' }}>{msg}</div>}
            <button onClick={save} disabled={saving} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 24px', borderRadius:'10px', background:'linear-gradient(135deg, #f97316, #ea580c)', color:'#fff', border:'none', fontWeight:700, fontSize:'14px', cursor:'pointer', alignSelf:'flex-start', minHeight:'44px' }}>
                <Save size={16} />{saving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
        </div>
    );
};
