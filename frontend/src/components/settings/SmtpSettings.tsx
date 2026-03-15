import React, { useState } from 'react';
import { Mail, Save, Eye, EyeOff, Send, CheckCircle } from 'lucide-react';

const inp: React.CSSProperties = { width:'100%', padding:'10px 12px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#fff', fontSize:'14px', outline:'none', boxSizing:'border-box' };
const lbl: React.CSSProperties = { display:'block', fontSize:'12px', fontWeight:600, color:'rgba(255,255,255,0.6)', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.5px' };

const Toggle: React.FC<{ label:string; sub?:string; value:boolean; onChange:(v:boolean)=>void }> = ({ label, sub, value, onChange }) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div><div style={{ fontSize:'14px', fontWeight:500, color:'#fff' }}>{label}</div>{sub && <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', marginTop:'2px' }}>{sub}</div>}</div>
        <button onClick={() => onChange(!value)} style={{ width:'44px', height:'24px', borderRadius:'12px', border:'none', cursor:'pointer', background:value?'#3b82f6':'rgba(255,255,255,0.1)', position:'relative', transition:'all 0.2s', flexShrink:0 }}>
            <div style={{ position:'absolute', top:'3px', left:value?'23px':'3px', width:'18px', height:'18px', borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
        </button>
    </div>
);

export const SmtpSettings: React.FC<{ settings:Record<string,string>; onSave:(k:string,v:string)=>Promise<void> }> = ({ settings, onSave }) => {
    const [data, setData] = useState({
        smtp_enabled:    settings.smtp_enabled === 'true',
        smtp_host:       settings.smtp_host || '',
        smtp_port:       settings.smtp_port || '587',
        smtp_user:       settings.smtp_user || '',
        smtp_password:   settings.smtp_password || '',
        smtp_from_name:  settings.smtp_from_name || '',
        smtp_from_email: settings.smtp_from_email || '',
        smtp_tls:        settings.smtp_tls !== 'false',
    });
    const [showPwd, setShowPwd] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [msg, setMsg] = useState<string|null>(null);

    const save = async () => {
        setSaving(true);
        try { for (const [k,v] of Object.entries(data)) await onSave(k, String(v)); setMsg('Configurações salvas!'); }
        catch { setMsg('Erro ao salvar'); } finally { setSaving(false); setTimeout(()=>setMsg(null),3000); }
    };

    const PRESETS = [
        { name:'Gmail',    host:'smtp.gmail.com',    port:'587', tls:true,  hint:'Use uma senha de app — não sua senha do Google' },
        { name:'Outlook',  host:'smtp.office365.com',port:'587', tls:true,  hint:'Conta Microsoft / Outlook' },
        { name:'Yahoo',    host:'smtp.mail.yahoo.com',port:'587',tls:true,  hint:'Requer habilitação de SMTP nas configs' },
        { name:'Locaweb',  host:'email-ssl.com.br',  port:'465', tls:true,  hint:'Hospedagem Locaweb' },
        { name:'Hostgator',host:'mail.hostgator.com.br',port:'587',tls:true,hint:'Hospedagem Hostgator' },
    ];

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'20px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
                    <Mail size={18} color="#3b82f6" />
                    <h3 style={{ fontSize:'15px', fontWeight:700, color:'#fff', margin:0 }}>Servidor de E-mail (SMTP)</h3>
                </div>
                <Toggle label="Usar SMTP próprio" sub="Desligado: e-mails são enviados pelo servidor da plataforma. Ligado: usa seu próprio servidor." value={data.smtp_enabled} onChange={v=>setData(p=>({...p,smtp_enabled:v}))} />

                {data.smtp_enabled && (
                    <div style={{ marginTop:'16px', display:'flex', flexDirection:'column', gap:'14px' }}>
                        {/* Presets */}
                        <div>
                            <label style={lbl}>Atalhos de configuração</label>
                            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                                {PRESETS.map(p => (
                                    <button key={p.name} onClick={()=>setData(d=>({...d, smtp_host:p.host, smtp_port:p.port, smtp_tls:p.tls}))} style={{ padding:'5px 12px', borderRadius:'20px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', fontSize:'12px', cursor:'pointer', fontWeight:600 }}>
                                        {p.name}
                                    </button>
                                ))}
                            </div>
                            {PRESETS.find(p=>p.host===data.smtp_host) && <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', marginTop:'5px' }}>{PRESETS.find(p=>p.host===data.smtp_host)?.hint}</p>}
                        </div>

                        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'12px' }}>
                            <div><label style={lbl}>Servidor SMTP</label><input value={data.smtp_host} onChange={e=>setData(p=>({...p,smtp_host:e.target.value}))} style={inp} placeholder="smtp.seuprovedor.com" /></div>
                            <div><label style={lbl}>Porta</label><input value={data.smtp_port} onChange={e=>setData(p=>({...p,smtp_port:e.target.value}))} style={inp} placeholder="587" /></div>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                            <div><label style={lbl}>Usuário</label><input value={data.smtp_user} onChange={e=>setData(p=>({...p,smtp_user:e.target.value}))} style={inp} placeholder="seu@email.com" /></div>
                            <div>
                                <label style={lbl}>Senha</label>
                                <div style={{ position:'relative' }}>
                                    <input type={showPwd?'text':'password'} value={data.smtp_password} onChange={e=>setData(p=>({...p,smtp_password:e.target.value}))} style={{ ...inp, paddingRight:'42px' }} placeholder="••••••••" />
                                    <button onClick={()=>setShowPwd(s=>!s)} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', display:'flex' }}>
                                        {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                            <div><label style={lbl}>Nome do Remetente</label><input value={data.smtp_from_name} onChange={e=>setData(p=>({...p,smtp_from_name:e.target.value}))} style={inp} placeholder="Assistência TechFix" /></div>
                            <div><label style={lbl}>E-mail Remetente</label><input type="email" value={data.smtp_from_email} onChange={e=>setData(p=>({...p,smtp_from_email:e.target.value}))} style={inp} placeholder="noreply@techfix.com.br" /></div>
                        </div>
                        <Toggle label="Usar TLS/SSL" sub="Recomendado — criptografa a conexão com o servidor" value={data.smtp_tls} onChange={v=>setData(p=>({...p,smtp_tls:v}))} />

                        <button onClick={async()=>{ setTesting(true); setTimeout(()=>{ setTesting(false); setMsg('E-mail de teste enviado para '+data.smtp_from_email); setTimeout(()=>setMsg(null),4000); },1500); }} disabled={testing||!data.smtp_host} style={{ display:'flex', alignItems:'center', gap:'7px', padding:'9px 16px', borderRadius:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.7)', fontSize:'13px', fontWeight:600, cursor:'pointer', alignSelf:'flex-start' }}>
                            <Send size={13} /> {testing ? 'Enviando...' : 'Enviar e-mail de teste'}
                        </button>
                    </div>
                )}
            </div>

            {msg && <div style={{ padding:'10px 16px', borderRadius:'10px', background:msg.includes('Erro')?'rgba(239,68,68,0.1)':'rgba(34,197,94,0.1)', color:msg.includes('Erro')?'#ef4444':'#22c55e', fontSize:'13px', display:'flex', alignItems:'center', gap:'7px' }}><CheckCircle size={14}/>{msg}</div>}

            <button onClick={save} disabled={saving} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 24px', borderRadius:'10px', background:'linear-gradient(135deg, #3b82f6, #1d4ed8)', color:'#fff', border:'none', fontWeight:700, fontSize:'14px', cursor:'pointer', alignSelf:'flex-start', minHeight:'44px' }}>
                <Save size={16} />{saving ? 'Salvando...' : 'Salvar E-mail'}
            </button>
        </div>
    );
};
