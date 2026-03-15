import React, { useState, useEffect } from 'react';
import { Bell, Save, MessageCircle, Mail, Smartphone } from 'lucide-react';
import api from '../../services/api';

const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' };

interface ToggleProps { label: string; sub: string; value: boolean; onChange: (v: boolean) => void; color?: string; }
const Toggle: React.FC<ToggleProps> = ({ label, sub, value, onChange, color = '#3b82f6' }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#fff' }}>{label}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{sub}</div>
        </div>
        <button onClick={() => onChange(!value)} style={{
            width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
            background: value ? color : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'all 0.2s', flexShrink: 0,
        }}>
            <div style={{ position: 'absolute', top: '3px', left: value ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
        </button>
    </div>
);

export const NotificationsSettings: React.FC<{ settings: Record<string, string>; onSave: (k: string, v: string) => Promise<void> }> = ({ settings, onSave }) => {
    const bool = (k: string, def = 'true') => (settings[k] ?? def) === 'true';
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [data, setData] = useState({
        notif_wa_os_created:    bool('notif_wa_os_created'),
        notif_wa_status_change: bool('notif_wa_status_change'),
        notif_wa_budget_ready:  bool('notif_wa_budget_ready'),
        notif_wa_ready_pickup:  bool('notif_wa_ready_pickup'),
        notif_wa_warranty:      bool('notif_wa_warranty', 'false'),
        notif_email_enabled:    bool('notif_email_enabled', 'false'),
        notif_email_recipient:  settings.notif_email_recipient || '',
        notif_warranty_days_alert: settings.notif_warranty_days_alert || '7',
    });

    const toggle = (k: keyof typeof data) => setData(p => ({ ...p, [k]: !p[k] }));
    const set = (k: string, v: string) => setData(p => ({ ...p, [k]: v }));

    const save = async () => {
        setSaving(true);
        try {
            for (const [k, v] of Object.entries(data)) {
                await onSave(k, String(v));
            }
            setMsg('Configurações salvas!');
        } catch { setMsg('Erro ao salvar'); }
        finally { setSaving(false); setTimeout(() => setMsg(null), 3000); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <MessageCircle size={18} color="#25d366" />
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>WhatsApp automático</h3>
                </div>
                <Toggle label="OS criada" sub="Notifica o cliente ao abrir a OS" value={data.notif_wa_os_created} onChange={() => toggle('notif_wa_os_created')} color="#25d366" />
                <Toggle label="Mudança de status" sub="Notifica cada alteração de status" value={data.notif_wa_status_change} onChange={() => toggle('notif_wa_status_change')} color="#25d366" />
                <Toggle label="Orçamento pronto" sub="Avisa que o orçamento aguarda aprovação" value={data.notif_wa_budget_ready} onChange={() => toggle('notif_wa_budget_ready')} color="#25d366" />
                <Toggle label="Pronto para retirada" sub="Avisa quando a OS é finalizada" value={data.notif_wa_ready_pickup} onChange={() => toggle('notif_wa_ready_pickup')} color="#25d366" />
                <Toggle label="Alerta de garantia" sub="Avisa cliente quando garantia está próxima de vencer" value={data.notif_wa_warranty} onChange={() => toggle('notif_wa_warranty')} color="#25d366" />
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Mail size={18} color="#3b82f6" />
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>E-mail interno</h3>
                </div>
                <Toggle label="Notificações por e-mail" sub="Receber resumo diário e alertas críticos" value={data.notif_email_enabled} onChange={() => toggle('notif_email_enabled')} />
                {data.notif_email_enabled && (
                    <div style={{ marginTop: '14px' }}>
                        <label style={lbl}>E-mail para notificações</label>
                        <input value={data.notif_email_recipient} onChange={e => set('notif_email_recipient', e.target.value)} placeholder="seu@email.com" style={inp} />
                    </div>
                )}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Bell size={18} color="#f59e0b" />
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>Alertas internos</h3>
                </div>
                <div>
                    <label style={lbl}>Alertar garantias que vencem em (dias)</label>
                    <input type="number" min="1" max="90" value={data.notif_warranty_days_alert}
                        onChange={e => set('notif_warranty_days_alert', e.target.value)} style={{ ...inp, width: '120px' }} />
                </div>
            </div>

            {msg && <div style={{ padding: '10px 16px', borderRadius: '10px', background: msg.includes('Erro') ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: msg.includes('Erro') ? '#ef4444' : '#22c55e', fontSize: '13px' }}>{msg}</div>}

            <button onClick={save} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer', alignSelf: 'flex-start', minHeight: '44px' }}>
                <Save size={16} />{saving ? 'Salvando...' : 'Salvar notificações'}
            </button>
        </div>
    );
};
