import React, { useState } from 'react';
import { MessageCircle, Save, RefreshCw, Eye } from 'lucide-react';

const TEMPLATES = [
    { key: 'tpl_wa_os_created',    label: 'OS Criada',            desc: 'Enviada ao cliente quando a OS é aberta', vars: ['{protocolo}', '{equipamento}', '{empresa}', '{link_status}'] },
    { key: 'tpl_wa_em_diagnostico', label: 'Em Diagnóstico',      desc: 'Quando inicia o diagnóstico', vars: ['{protocolo}', '{empresa}'] },
    { key: 'tpl_wa_budget_ready',  label: 'Orçamento Pronto',     desc: 'Quando orçamento aguarda aprovação', vars: ['{protocolo}', '{valor}', '{link_aprovacao}', '{empresa}'] },
    { key: 'tpl_wa_approved',      label: 'Orçamento Aprovado',   desc: 'Confirmação de aprovação', vars: ['{protocolo}', '{empresa}'] },
    { key: 'tpl_wa_em_reparo',     label: 'Em Reparo',            desc: 'Quando inicia o reparo', vars: ['{protocolo}', '{empresa}'] },
    { key: 'tpl_wa_finalizada',    label: 'Pronto para Retirada', desc: 'Quando finaliza e está pronto', vars: ['{protocolo}', '{empresa}', '{link_status}'] },
    { key: 'tpl_wa_entregue',      label: 'Entregue',             desc: 'Confirmação de entrega', vars: ['{protocolo}', '{empresa}'] },
];

const DEFAULT_TEMPLATES: Record<string, string> = {
    tpl_wa_os_created:    '📋 *OS ABERTA* — #{protocolo}\n\nOlá! Recebemos seu *{equipamento}* para análise.\n\nVocê será avisado por aqui sobre cada atualização.\n\n🔗 Acompanhe: {link_status}\n\n_{empresa}_',
    tpl_wa_em_diagnostico:'🔍 *Em Diagnóstico* — #{protocolo}\n\nNossos técnicos estão analisando seu equipamento. Em breve teremos novidades!\n\n_{empresa}_',
    tpl_wa_budget_ready:  '💬 *Orçamento Pronto!* — #{protocolo}\n\nO diagnóstico foi concluído. Valor: *{valor}*\n\n📋 Acesse para aprovar ou rejeitar:\n{link_aprovacao}\n\n_{empresa}_',
    tpl_wa_approved:      '✅ *Orçamento Aprovado!* — #{protocolo}\n\nObrigado! Iniciaremos o reparo em breve.\n\n_{empresa}_',
    tpl_wa_em_reparo:     '🔧 *Em Reparo* — #{protocolo}\n\nSeu equipamento está sendo reparado por nossos técnicos.\n\n_{empresa}_',
    tpl_wa_finalizada:    '✅ *Pronto para Retirada!* — #{protocolo}\n\nSeu equipamento está pronto! Você já pode vir buscá-lo.\n\n🔗 {link_status}\n\n_{empresa}_',
    tpl_wa_entregue:      '🎉 *Entregue!* — #{protocolo}\n\nObrigado por confiar em nossos serviços!\nQualquer problema na garantia, estamos à disposição.\n\n_{empresa}_',
};

const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '13px', outline: 'none', resize: 'vertical', minHeight: '100px', boxSizing: 'border-box', lineHeight: 1.6, fontFamily: 'system-ui' };

export const WhatsAppTemplates: React.FC<{ settings: Record<string, string>; onSave: (k: string, v: string) => Promise<void> }> = ({ settings, onSave }) => {
    const [values, setValues] = useState<Record<string, string>>(() => {
        const init: Record<string, string> = {};
        TEMPLATES.forEach(t => { init[t.key] = settings[t.key] || DEFAULT_TEMPLATES[t.key] || ''; });
        return init;
    });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [active, setActive] = useState(TEMPLATES[0].key);

    const saveAll = async () => {
        setSaving(true);
        try {
            for (const [k, v] of Object.entries(values)) await onSave(k, v);
            setMsg('Templates salvos!');
        } catch { setMsg('Erro ao salvar'); }
        finally { setSaving(false); setTimeout(() => setMsg(null), 3000); }
    };

    const resetTemplate = (key: string) => {
        setValues(p => ({ ...p, [key]: DEFAULT_TEMPLATES[key] || '' }));
    };

    const showPreview = (key: string) => {
        let text = values[key] || '';
        text = text.replace(/{protocolo}/g, '202501-0042');
        text = text.replace(/{equipamento}/g, 'iPhone 14 Pro');
        text = text.replace(/{empresa}/g, 'Assistência XYZ');
        text = text.replace(/{valor}/g, 'R$ 350,00');
        text = text.replace(/{link_status}/g, 'https://os4u.com.br/status/202501-0042');
        text = text.replace(/{link_aprovacao}/g, 'https://os4u.com.br/status/202501-0042');
        setPreview(text);
    };

    const currentTpl = TEMPLATES.find(t => t.key === active)!;

    return (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {/* Lista de templates */}
            <div style={{ width: '200px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {TEMPLATES.map(t => (
                    <button key={t.key} onClick={() => { setActive(t.key); setPreview(null); }} style={{ padding: '10px 12px', borderRadius: '9px', textAlign: 'left', border: `1px solid ${active === t.key ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.06)'}`, background: active === t.key ? 'rgba(59,130,246,0.1)' : 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: active === t.key ? 'var(--accent-primary)' : '#fff' }}>{t.label}</div>
                    </button>
                ))}
            </div>

            {/* Editor */}
            <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{currentTpl.label}</div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{currentTpl.desc}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => showPreview(active)} style={{ padding: '7px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Eye size={13} /> Preview
                            </button>
                            <button onClick={() => resetTemplate(active)} style={{ padding: '7px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <RefreshCw size={13} /> Restaurar
                            </button>
                        </div>
                    </div>
                    <textarea value={values[active]} onChange={e => setValues(p => ({ ...p, [active]: e.target.value }))} style={inp} />
                </div>

                {/* Variáveis disponíveis */}
                <div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Variáveis disponíveis</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {currentTpl.vars.map(v => (
                            <button key={v} onClick={() => setValues(p => ({ ...p, [active]: (p[active] || '') + v }))} style={{ padding: '3px 8px', borderRadius: '5px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa', fontSize: '11px', fontFamily: 'monospace', cursor: 'pointer' }}>
                                {v}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Preview */}
                {preview && (
                    <div style={{ padding: '14px', background: '#1a1e2e', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Preview</div>
                        <pre style={{ fontSize: '13px', color: '#fff', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0, fontFamily: 'system-ui' }}>{preview}</pre>
                    </div>
                )}

                {msg && <div style={{ padding: '10px 14px', borderRadius: '9px', background: msg.includes('Erro') ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: msg.includes('Erro') ? '#ef4444' : '#22c55e', fontSize: '13px' }}>{msg}</div>}

                <button onClick={saveAll} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 22px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer', alignSelf: 'flex-start', minHeight: '44px' }}>
                    <Save size={15} />{saving ? 'Salvando...' : 'Salvar templates'}
                </button>
            </div>
        </div>
    );
};
