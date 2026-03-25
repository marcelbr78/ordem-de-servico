import React, { useState } from 'react';
import { Save, CheckCircle, XCircle, ExternalLink, Eye, EyeOff, AlertCircle } from 'lucide-react';

const inp: React.CSSProperties = { width:'100%', padding:'10px 12px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#fff', fontSize:'14px', outline:'none', boxSizing:'border-box' };
const lbl: React.CSSProperties = { display:'block', fontSize:'12px', fontWeight:600, color:'rgba(255,255,255,0.6)', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.5px' };

const Toggle: React.FC<{ label:string; sub?:string; value:boolean; onChange:(v:boolean)=>void; color?:string }> = ({ label, sub, value, onChange, color='#3b82f6' }) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0' }}>
        <div><div style={{ fontSize:'14px', fontWeight:500, color:'#fff' }}>{label}</div>{sub && <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', marginTop:'2px' }}>{sub}</div>}</div>
        <button onClick={() => onChange(!value)} style={{ width:'44px', height:'24px', borderRadius:'12px', border:'none', cursor:'pointer', background:value?color:'rgba(255,255,255,0.1)', position:'relative', transition:'all 0.2s', flexShrink:0 }}>
            <div style={{ position:'absolute', top:'3px', left:value?'23px':'3px', width:'18px', height:'18px', borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
        </button>
    </div>
);

interface SecretField { label: string; fkey: string; placeholder?: string; link?: string; }
const SecretInput: React.FC<{ label:string; value:string; onChange:(v:string)=>void; placeholder?:string }> = ({ label, value, onChange, placeholder }) => {
    const [show, setShow] = useState(false);
    return (
        <div>
            <label style={lbl}>{label}</label>
            <div style={{ position:'relative' }}>
                <input type={show?'text':'password'} value={value} onChange={e=>onChange(e.target.value)} style={{ ...inp, paddingRight:'42px' }} placeholder={placeholder||'••••••••••••'} />
                <button onClick={()=>setShow(s=>!s)} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', display:'flex' }}>
                    {show ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
            </div>
        </div>
    );
};

interface IntegCard { key:string; title:string; logo:string; color:string; enabled:boolean; fields:{ label:string; fkey:string; placeholder?:string; secret?:boolean; link?:string; type?:string }[]; extras?: React.ReactNode; }

export const IntegrationsSettings: React.FC<{ settings:Record<string,string>; onSave:(k:string,v:string)=>Promise<void> }> = ({ settings, onSave }) => {
    const [data, setData] = useState<Record<string,string|boolean>>({
        integration_pagbank_token:    settings.integration_pagbank_token || '',
        integration_pagbank_sandbox:  settings.integration_pagbank_sandbox !== 'false',
        integration_mp_access_token:  settings.integration_mp_access_token || '',
        integration_mp_public_key:    settings.integration_mp_public_key || '',
        integration_imei_provider:    settings.integration_imei_provider || 'imeicheck',
        integration_imei_token:       settings.integration_imei_token || '',
        integration_google_maps_key:  settings.integration_google_maps_key || '',
        integration_viacep_enabled:   settings.integration_viacep_enabled !== 'false',
    });
    const [saving, setSaving] = useState<string|null>(null);
    const [msg, setMsg] = useState<string|null>(null);

    const get = (k:string) => data[k] as string || '';
    const set = (k:string, v:string|boolean) => setData(p=>({...p,[k]:v}));

    const saveSection = async (keys: string[]) => {
        setSaving(keys[0]);
        try {
            for (const k of keys) await onSave(k, String(data[k]));
            setMsg('Salvo!');
        } catch { setMsg('Erro ao salvar'); }
        finally { setSaving(null); setTimeout(()=>setMsg(null),3000); }
    };

    const Section: React.FC<{ title:string; logo:string; color:string; keys:string[]; children:React.ReactNode; link?:string; status?:'ok'|'error'|'off' }> = ({ title, logo, color, keys, children, link, status='off' }) => (
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
                <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }}>{logo}</div>
                <div style={{ flex:1 }}>
                    <div style={{ fontSize:'15px', fontWeight:700, color:'#fff', display:'flex', alignItems:'center', gap:'8px' }}>
                        {title}
                        {status==='ok' && <CheckCircle size={13} color="#22c55e" />}
                        {status==='error' && <XCircle size={13} color="#ef4444" />}
                    </div>
                    {link && <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', display:'flex', alignItems:'center', gap:'3px', textDecoration:'none', marginTop:'2px' }}><ExternalLink size={10} /> {link}</a>}
                </div>
                <button onClick={()=>saveSection(keys)} disabled={saving===keys[0]} style={{ padding:'7px 14px', borderRadius:'8px', background:saving===keys[0]?'rgba(255,255,255,0.05)':`${color}20`, border:`1px solid ${color}30`, color:color, fontSize:'12px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'5px' }}>
                    <Save size={12} />{saving===keys[0]?'Salvando...':'Salvar'}
                </button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {children}
            </div>
        </div>
    );

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            {msg && <div style={{ padding:'10px 16px', borderRadius:'10px', background:msg.includes('Erro')?'rgba(239,68,68,0.1)':'rgba(34,197,94,0.1)', color:msg.includes('Erro')?'#ef4444':'#22c55e', fontSize:'13px' }}>{msg}</div>}

            {/* PagBank */}
            <Section title="PagBank" logo="💳" color="#22c55e" keys={['integration_pagbank_token','integration_pagbank_sandbox']} link="https://dev.pagbank.com.br">
                <SecretInput label="Token da API" value={get('integration_pagbank_token')} onChange={v=>set('integration_pagbank_token',v)} placeholder="Seu token PagBank" />
                <Toggle label="Modo Sandbox (testes)" sub="Desative para processar pagamentos reais" value={!!data.integration_pagbank_sandbox} onChange={v=>set('integration_pagbank_sandbox',v)} color="#f59e0b" />
            </Section>

            {/* Mercado Pago */}
            <Section title="Mercado Pago" logo="🟡" color="#f59e0b" keys={['integration_mp_access_token','integration_mp_public_key']} link="https://www.mercadopago.com.br/developers">
                <SecretInput label="Access Token" value={get('integration_mp_access_token')} onChange={v=>set('integration_mp_access_token',v)} />
                <div><label style={lbl}>Public Key</label><input value={get('integration_mp_public_key')} onChange={e=>set('integration_mp_public_key',e.target.value)} style={inp} placeholder="APP_USR-..." /></div>
            </Section>

            {/* IMEI API */}
            <Section title="IMEI Check API" logo="📱" color="#3b82f6" keys={['integration_imei_provider','integration_imei_token']} link="https://imeicheck.net/promo-api">
                <div>
                    <label style={lbl}>Provedor</label>
                    <select value={get('integration_imei_provider')} onChange={e=>set('integration_imei_provider',e.target.value)} style={inp}>
                        <option value="imeicheck">imeicheck.net (5 grátis/dia — Recomendado)</option>
                        <option value="imei.org">IMEI.org</option>
                        <option value="zylalabs">Zyla Labs</option>
                    </select>
                </div>
                <SecretInput label="Token da API" value={get('integration_imei_token')} onChange={v=>set('integration_imei_token',v)} placeholder="Cole seu token aqui" />
                <div style={{ padding:'14px', background:'rgba(59,130,246,0.05)', border:'1px solid rgba(59,130,246,0.18)', borderRadius:'10px', fontSize:'12px', color:'rgba(255,255,255,0.55)', display:'flex', flexDirection:'column', gap:'10px' }}>
                    <div style={{ fontWeight:700, color:'rgba(255,255,255,0.8)', fontSize:'12px', display:'flex', alignItems:'center', gap:'6px' }}>
                        <AlertCircle size={13} color="#60a5fa" style={{ flexShrink:0 }} />
                        Como o sistema identifica o aparelho (3 camadas)
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                        <div style={{ padding:'8px 10px', background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:'7px' }}>
                            <div style={{ color:'#22c55e', fontWeight:700, fontSize:'11px', marginBottom:'2px' }}>🆓 Camada 1 — Banco local (ilimitado)</div>
                            <div style={{ color:'rgba(255,255,255,0.4)', fontSize:'11px' }}>Aparelhos que já passaram pela loja são identificados instantaneamente, sem nenhuma API.</div>
                        </div>
                        <div style={{ padding:'8px 10px', background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:'7px' }}>
                            <div style={{ color:'#22c55e', fontWeight:700, fontSize:'11px', marginBottom:'2px' }}>🆓 Camada 2 — Gratuito automático (sem token)</div>
                            <div style={{ color:'rgba(255,255,255,0.4)', fontSize:'11px' }}>
                                • <strong style={{ color:'rgba(255,255,255,0.6)' }}>IMEI (15 dígitos)</strong>: consulta TAC gratuito via Osmocom DB — identifica marca + modelo de qualquer Android e iPhone.<br/>
                                • <strong style={{ color:'rgba(255,255,255,0.6)' }}>Serial Apple (10-12 chars)</strong>: decoder local offline — identifica iPhone 4 até 12, iPad, MacBook, Apple Watch sem internet.
                            </div>
                        </div>
                        <div style={{ padding:'8px 10px', background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:'7px' }}>
                            <div style={{ color:'#60a5fa', fontWeight:700, fontSize:'11px', marginBottom:'2px' }}>💳 Camada 3 — API paga (token abaixo)</div>
                            <div style={{ color:'rgba(255,255,255,0.4)', fontSize:'11px' }}>Só usada quando as camadas gratuitas não identificam (ex: iPhone 13+). Limite de <strong style={{ color:'rgba(255,255,255,0.6)' }}>5/dia</strong> no plano promo.</div>
                        </div>
                    </div>
                    <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:'8px' }}>
                        <div style={{ fontWeight:600, color:'rgba(255,255,255,0.6)', fontSize:'11px', marginBottom:'4px' }}>Como obter o token (imeicheck.net)</div>
                        <ol style={{ margin:0, paddingLeft:'16px', display:'flex', flexDirection:'column', gap:'3px', lineHeight:'1.6', color:'rgba(255,255,255,0.4)', fontSize:'11px' }}>
                            <li>Acesse <a href="https://imeicheck.net/promo-api" target="_blank" rel="noopener noreferrer" style={{ color:'#60a5fa', textDecoration:'none' }}>imeicheck.net/promo-api</a> → clique em <strong style={{ color:'rgba(255,255,255,0.6)' }}>Get Free API Key</strong></li>
                            <li>Crie uma conta gratuita (só e-mail e senha)</li>
                            <li>Copie o token e cole no campo acima</li>
                        </ol>
                    </div>
                </div>
            </Section>

            {/* ViaCEP */}
            <Section title="ViaCEP / Busca de Endereço" logo="📍" color="#a855f7" keys={['integration_viacep_enabled']}>
                <Toggle label="Busca automática por CEP" sub="Preenche endereço automaticamente ao digitar o CEP (gratuito)" value={!!data.integration_viacep_enabled} onChange={v=>set('integration_viacep_enabled',v)} color="#a855f7" />
            </Section>

            {/* Google Maps */}
            <Section title="Google Maps" logo="🗺️" color="#34a853" keys={['integration_google_maps_key']} link="https://console.cloud.google.com">
                <SecretInput label="API Key do Google Maps" value={get('integration_google_maps_key')} onChange={v=>set('integration_google_maps_key',v)} placeholder="AIza..." />
                <div style={{ padding:'9px 12px', background:'rgba(59,130,246,0.07)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:'8px', fontSize:'12px', color:'rgba(255,255,255,0.5)', display:'flex', alignItems:'flex-start', gap:'6px' }}>
                    <AlertCircle size={13} color="#60a5fa" style={{ flexShrink:0, marginTop:'1px' }} />
                    Opcional. Usado para abrir o endereço do cliente no mapa direto da OS.
                </div>
            </Section>
        </div>
    );
};
