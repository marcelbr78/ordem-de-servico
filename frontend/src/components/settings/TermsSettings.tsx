import React, { useState } from 'react';
import { FileText, Save } from 'lucide-react';

const lbl: React.CSSProperties = { display:'block', fontSize:'12px', fontWeight:600, color:'rgba(255,255,255,0.6)', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.5px' };
const ta: React.CSSProperties = { width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#fff', fontSize:'13px', outline:'none', resize:'vertical', minHeight:'120px', fontFamily:'inherit', lineHeight:'1.6', boxSizing:'border-box' };

const Toggle: React.FC<{ label:string; sub?:string; value:boolean; onChange:(v:boolean)=>void }> = ({ label, sub, value, onChange }) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div><div style={{ fontSize:'14px', fontWeight:500, color:'#fff' }}>{label}</div>{sub && <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', marginTop:'2px' }}>{sub}</div>}</div>
        <button onClick={() => onChange(!value)} style={{ width:'44px', height:'24px', borderRadius:'12px', border:'none', cursor:'pointer', background:value?'#3b82f6':'rgba(255,255,255,0.1)', position:'relative', transition:'all 0.2s', flexShrink:0 }}>
            <div style={{ position:'absolute', top:'3px', left:value?'23px':'3px', width:'18px', height:'18px', borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
        </button>
    </div>
);

export const TermsSettings: React.FC<{ settings:Record<string,string>; onSave:(k:string,v:string)=>Promise<void> }> = ({ settings, onSave }) => {
    const [data, setData] = useState({
        terms_general:               settings.terms_general || settings.service_terms || '',
        terms_warranty:              settings.terms_warranty || '',
        terms_delivery:              settings.terms_delivery || '',
        terms_require_digital_sign:  settings.terms_require_digital_sign === 'true',
    });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string|null>(null);

    const save = async () => {
        setSaving(true);
        try { for (const [k,v] of Object.entries(data)) await onSave(k, String(v)); setMsg('Termos salvos!'); }
        catch { setMsg('Erro'); } finally { setSaving(false); setTimeout(()=>setMsg(null),3000); }
    };

    const DEFAULTS = {
        terms_general: `O orçamento tem validade de 7 (sete) dias a partir da data de emissão.\n\nAo autorizar o serviço, o cliente declara estar ciente dos valores informados.\n\nEquipamentos não retirados no prazo de 60 dias após a conclusão do serviço poderão ser descartados conforme legislação vigente.`,
        terms_warranty: `A garantia cobre exclusivamente o defeito reparado.\n\nA garantia é anulada em caso de danos por mau uso, quedas, contato com líquidos, abertura por terceiros ou danos elétricos.\n\nEquipamentos com violação de lacre não são cobertos pela garantia.`,
        terms_delivery: `O cliente é responsável por verificar o funcionamento do equipamento no momento da retirada.\n\nNão nos responsabilizamos por dados perdidos durante o reparo. Recomendamos backup prévio.\n\nO pagamento deve ser realizado no ato da entrega do equipamento.`,
    };

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'20px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
                    <FileText size={18} color="#06b6d4" />
                    <h3 style={{ fontSize:'15px', fontWeight:700, color:'#fff', margin:0 }}>Termos & Condições</h3>
                    <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', marginLeft:'auto' }}>Aparecem no PDF da OS e no status público</span>
                </div>
                <div style={{ background:'rgba(255,255,255,0.02)', borderRadius:'10px', padding:'0 14px', marginBottom:'16px' }}>
                    <Toggle label="Exigir aceite digital" sub="Cliente deve confirmar os termos no status público antes da aprovação" value={data.terms_require_digital_sign} onChange={v=>setData(p=>({...p,terms_require_digital_sign:v}))} />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                    {([
                        { key:'terms_general', label:'Termos Gerais de Serviço', hint:'Exibido em todas as OS' },
                        { key:'terms_warranty', label:'Termos de Garantia', hint:'Exibido junto à OS finalizada' },
                        { key:'terms_delivery', label:'Termos de Entrega', hint:'Exibido na via de entrega ao cliente' },
                    ] as const).map(({ key, label, hint }) => (
                        <div key={key}>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'5px' }}>
                                <label style={lbl}>{label}</label>
                                <button onClick={()=>setData(p=>({...p,[key]:DEFAULTS[key]}))} style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)', background:'transparent', border:'none', cursor:'pointer', textDecoration:'underline' }}>Usar padrão</button>
                            </div>
                            <textarea value={data[key]} onChange={e=>setData(p=>({...p,[key]:e.target.value}))} style={ta} placeholder={`${hint}...`} />
                            <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', margin:'3px 0 0' }}>{hint}</p>
                        </div>
                    ))}
                </div>
            </div>

            {msg && <div style={{ padding:'10px 16px', borderRadius:'10px', background:msg.includes('Erro')?'rgba(239,68,68,0.1)':'rgba(34,197,94,0.1)', color:msg.includes('Erro')?'#ef4444':'#22c55e', fontSize:'13px' }}>{msg}</div>}
            <button onClick={save} disabled={saving} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 24px', borderRadius:'10px', background:'linear-gradient(135deg, #06b6d4, #0891b2)', color:'#fff', border:'none', fontWeight:700, fontSize:'14px', cursor:'pointer', alignSelf:'flex-start', minHeight:'44px' }}>
                <Save size={16}/>{saving?'Salvando...':'Salvar Termos'}
            </button>
        </div>
    );
};
