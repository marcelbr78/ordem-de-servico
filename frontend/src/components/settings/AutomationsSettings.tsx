import React, { useState } from 'react';
import { Zap, Plus, Trash2, Save, AlertCircle } from 'lucide-react';

const inp: React.CSSProperties = { width:'100%', padding:'9px 12px', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'#fff', fontSize:'13px', outline:'none', boxSizing:'border-box' };
const lbl: React.CSSProperties = { display:'block', fontSize:'11px', fontWeight:600, color:'rgba(255,255,255,0.5)', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.5px' };

const TRIGGERS = [
    { key:'os_created',          label:'OS criada' },
    { key:'status_changed',      label:'Status mudou' },
    { key:'os_idle_days',        label:'OS parada por X dias' },
    { key:'budget_not_approved', label:'Orçamento não aprovado em X dias' },
    { key:'warranty_expiring',   label:'Garantia vencendo em X dias' },
    { key:'payment_overdue',     label:'Pagamento atrasado' },
];
const ACTIONS = [
    { key:'send_whatsapp',       label:'Enviar WhatsApp' },
    { key:'send_email',          label:'Enviar E-mail' },
    { key:'create_task',         label:'Criar tarefa interna' },
    { key:'change_priority',     label:'Mudar prioridade da OS' },
    { key:'notify_admin',        label:'Notificar administrador' },
];
const STATUS_OPTIONS = ['aberta','em_diagnostico','aguardando_aprovacao','aguardando_peca','em_reparo','testes','finalizada','entregue','cancelada'];

interface Rule { id:string; name:string; trigger:string; triggerValue?:string; triggerStatus?:string; action:string; actionMessage?:string; enabled:boolean; }

export const AutomationsSettings: React.FC<{ settings:Record<string,string>; onSave:(k:string,v:string)=>Promise<void> }> = ({ settings, onSave }) => {
    const [rules, setRules] = useState<Rule[]>(() => {
        try { return JSON.parse(settings.automation_rules || '[]'); } catch { return []; }
    });
    const [followUp, setFollowUp] = useState(settings.automation_follow_up_days || '3');
    const [abandoned, setAbandoned] = useState(settings.automation_abandoned_days || '30');
    const [showNew, setShowNew] = useState(false);
    const [newRule, setNewRule] = useState<Partial<Rule>>({ trigger:'os_created', action:'send_whatsapp', enabled:true });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string|null>(null);

    const save = async () => {
        setSaving(true);
        try {
            await onSave('automation_rules', JSON.stringify(rules));
            await onSave('automation_follow_up_days', followUp);
            await onSave('automation_abandoned_days', abandoned);
            setMsg('Automações salvas!');
        } catch { setMsg('Erro'); } finally { setSaving(false); setTimeout(()=>setMsg(null),3000); }
    };

    const addRule = () => {
        if (!newRule.name || !newRule.trigger || !newRule.action) return;
        setRules(r => [...r, { ...newRule as Rule, id: Date.now().toString() }]);
        setNewRule({ trigger:'os_created', action:'send_whatsapp', enabled:true });
        setShowNew(false);
    };

    const toggle = (id:string) => setRules(r => r.map(rule => rule.id===id ? {...rule, enabled:!rule.enabled} : rule));
    const remove = (id:string) => setRules(r => r.filter(rule => rule.id!==id));

    const TRIGGER_NEEDS_VALUE = (t:string) => ['os_idle_days','budget_not_approved','warranty_expiring'].includes(t);
    const TRIGGER_NEEDS_STATUS = (t:string) => t === 'status_changed';

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
            {/* Automações rápidas */}
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'20px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
                    <Zap size={18} color="#f59e0b" />
                    <h3 style={{ fontSize:'15px', fontWeight:700, color:'#fff', margin:0 }}>Alertas Rápidos</h3>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
                    <div>
                        <label style={lbl}>Follow-up de orçamento (dias)</label>
                        <input type="number" min="1" max="30" value={followUp} onChange={e=>setFollowUp(e.target.value)} style={inp} />
                        <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', margin:'4px 0 0' }}>Enviar WA se cliente não respondeu ao orçamento em X dias</p>
                    </div>
                    <div>
                        <label style={lbl}>OS abandonada (dias)</label>
                        <input type="number" min="7" max="90" value={abandoned} onChange={e=>setAbandoned(e.target.value)} style={inp} />
                        <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', margin:'4px 0 0' }}>Alertar internamente se OS ficou parada por X dias</p>
                    </div>
                </div>
            </div>

            {/* Regras personalizadas */}
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'20px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
                    <h3 style={{ fontSize:'15px', fontWeight:700, color:'#fff', margin:0 }}>Regras Personalizadas</h3>
                    <button onClick={()=>setShowNew(s=>!s)} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 12px', borderRadius:'7px', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.25)', color:'#f59e0b', fontSize:'12px', fontWeight:700, cursor:'pointer' }}>
                        <Plus size={13}/> Nova Regra
                    </button>
                </div>

                {/* Form nova regra */}
                {showNew && (
                    <div style={{ background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'10px', padding:'14px', marginBottom:'14px' }}>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px' }}>
                            <div style={{ gridColumn:'1/-1' }}>
                                <label style={lbl}>Nome da regra</label>
                                <input value={newRule.name||''} onChange={e=>setNewRule(p=>({...p,name:e.target.value}))} style={inp} placeholder="Ex: Lembrar orçamento pendente" />
                            </div>
                            <div>
                                <label style={lbl}>Gatilho (quando)</label>
                                <select value={newRule.trigger} onChange={e=>setNewRule(p=>({...p,trigger:e.target.value}))} style={inp}>
                                    {TRIGGERS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                                </select>
                            </div>
                            {TRIGGER_NEEDS_VALUE(newRule.trigger||'') && (
                                <div><label style={lbl}>Após quantos dias</label><input type="number" value={newRule.triggerValue||'3'} onChange={e=>setNewRule(p=>({...p,triggerValue:e.target.value}))} style={inp} min="1" /></div>
                            )}
                            {TRIGGER_NEEDS_STATUS(newRule.trigger||'') && (
                                <div><label style={lbl}>Status alvo</label><select value={newRule.triggerStatus||''} onChange={e=>setNewRule(p=>({...p,triggerStatus:e.target.value}))} style={inp}><option value="">Qualquer</option>{STATUS_OPTIONS.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
                            )}
                            <div>
                                <label style={lbl}>Ação (então)</label>
                                <select value={newRule.action} onChange={e=>setNewRule(p=>({...p,action:e.target.value}))} style={inp}>
                                    {ACTIONS.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
                                </select>
                            </div>
                            {['send_whatsapp','send_email'].includes(newRule.action||'') && (
                                <div style={{ gridColumn:'1/-1' }}>
                                    <label style={lbl}>Mensagem</label>
                                    <textarea value={newRule.actionMessage||''} onChange={e=>setNewRule(p=>({...p,actionMessage:e.target.value}))} style={{ ...inp, minHeight:'60px', resize:'vertical' }} placeholder="Use {nome}, {protocolo}, {equipamento}..." />
                                </div>
                            )}
                        </div>
                        <div style={{ display:'flex', gap:'8px' }}>
                            <button onClick={()=>setShowNew(false)} style={{ padding:'7px 14px', borderRadius:'7px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', fontSize:'12px', cursor:'pointer' }}>Cancelar</button>
                            <button onClick={addRule} style={{ padding:'7px 14px', borderRadius:'7px', background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)', color:'#f59e0b', fontSize:'12px', fontWeight:700, cursor:'pointer' }}>Adicionar Regra</button>
                        </div>
                    </div>
                )}

                {/* Lista de regras */}
                {rules.length === 0 ? (
                    <div style={{ padding:'24px', textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:'13px', display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}>
                        <Zap size={24} style={{ opacity:0.2 }} />
                        Nenhuma regra criada ainda
                    </div>
                ) : rules.map(rule => (
                    <div key={rule.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'11px 14px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'9px', marginBottom:'6px', opacity:rule.enabled?1:0.5 }}>
                        <button onClick={()=>toggle(rule.id)} style={{ width:'38px', height:'22px', borderRadius:'11px', border:'none', cursor:'pointer', background:rule.enabled?'#f59e0b':'rgba(255,255,255,0.1)', position:'relative', transition:'all 0.2s', flexShrink:0 }}>
                            <div style={{ position:'absolute', top:'2px', left:rule.enabled?'18px':'2px', width:'18px', height:'18px', borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
                        </button>
                        <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:'13px', fontWeight:600, color:'#fff' }}>{rule.name}</div>
                            <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)', marginTop:'2px' }}>
                                {TRIGGERS.find(t=>t.key===rule.trigger)?.label}
                                {rule.triggerValue && ` · ${rule.triggerValue} dias`}
                                {' → '}
                                {ACTIONS.find(a=>a.key===rule.action)?.label}
                            </div>
                        </div>
                        <button onClick={()=>remove(rule.id)} style={{ padding:'5px', background:'transparent', border:'none', color:'rgba(239,68,68,0.5)', cursor:'pointer', display:'flex' }}><Trash2 size={13}/></button>
                    </div>
                ))}
            </div>

            {/* Aviso */}
            <div style={{ padding:'10px 14px', background:'rgba(59,130,246,0.07)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:'10px', fontSize:'12px', color:'rgba(255,255,255,0.5)', display:'flex', alignItems:'flex-start', gap:'7px' }}>
                <AlertCircle size={13} color="#60a5fa" style={{ flexShrink:0, marginTop:'1px' }} />
                Automações que enviam WhatsApp requerem Evolution API configurada. Automações de e-mail requerem SMTP configurado ou o servidor padrão da plataforma.
            </div>

            {msg && <div style={{ padding:'10px 16px', borderRadius:'10px', background:msg.includes('Erro')?'rgba(239,68,68,0.1)':'rgba(34,197,94,0.1)', color:msg.includes('Erro')?'#ef4444':'#22c55e', fontSize:'13px' }}>{msg}</div>}
            <button onClick={save} disabled={saving} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 24px', borderRadius:'10px', background:'linear-gradient(135deg, #f59e0b, #d97706)', color:'#fff', border:'none', fontWeight:700, fontSize:'14px', cursor:'pointer', alignSelf:'flex-start', minHeight:'44px' }}>
                <Save size={16}/>{saving?'Salvando...':'Salvar Automações'}
            </button>
        </div>
    );
};
