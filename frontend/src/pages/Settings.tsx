import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { CompanySettings } from '../components/settings/CompanySettings';
import { OSSettings } from '../components/settings/OSSettings';
import { PrintingSettings } from '../components/settings/PrintingSettings';
import { FiscalSettings } from '../components/settings/FiscalSettings';
import { NotificationsSettings } from '../components/settings/NotificationsSettings';
import { ServiceCatalogSettings } from '../components/settings/ServiceCatalogSettings';
import { WhatsAppTemplates } from '../components/settings/WhatsAppTemplates';
import { PermissionsSettings } from '../components/settings/PermissionsSettings';
import { BackupSettings } from '../components/settings/BackupSettings';
import { ThermalPrinterSettings } from '../components/settings/ThermalPrinterSettings';
import { IntegrationsSettings } from '../components/settings/IntegrationsSettings';
import { SmtpSettings } from '../components/settings/SmtpSettings';
import { AutomationsSettings } from '../components/settings/AutomationsSettings';
import { PublicStatusSettings } from '../components/settings/PublicStatusSettings';
import { AppearanceSettings } from '../components/settings/AppearanceSettings';
import { TermsSettings } from '../components/settings/TermsSettings';
import {
    Building2, Shield, Users, ClipboardList, Printer, Receipt,
    Bell, Tag, MessageCircle, Database, Wifi, RefreshCw,
    Plus, Edit3, UserX, UserCheck, Send, Trash2, X, Save,
    DollarSign, Palette, CreditCard, MapPin, ChevronRight, Menu,
} from 'lucide-react';

interface SettingsMap { [key: string]: string; }
interface User {
    id: string; name: string; email: string;
    role: 'admin' | 'technician' | 'attendant'; isActive: boolean; lastLogin?: string;
}

type TabKey = 'company' | 'os' | 'printing' | 'thermal' | 'services' | 'appearance' |
    'users' | 'permissions' |
    'finance_config' |
    'notifications' | 'whatsapp' | 'wa_templates' | 'smtp' |
    'integrations' | 'automations' |
    'fiscal' | 'terms' | 'public_status' | 'backup';

const TABS: { key: TabKey; label: string; icon: React.ElementType; group: string }[] = [
    // ── Geral ──────────────────────────────────────────────────
    { key: 'company',       label: 'Empresa',              icon: Building2,    group: 'Geral' },
    { key: 'os',            label: 'Fluxo de OS',          icon: ClipboardList,group: 'Geral' },
    { key: 'printing',      label: 'Impressão & PDF',      icon: Printer,      group: 'Geral' },
    { key: 'thermal',       label: 'Impressora Térmica',   icon: Printer,      group: 'Geral' },
    { key: 'services',      label: 'Catálogo de Serviços', icon: Tag,          group: 'Geral' },
    { key: 'appearance',    label: 'Aparência',            icon: Palette,      group: 'Geral' },
    // ── Acesso ─────────────────────────────────────────────────
    { key: 'users',         label: 'Usuários',             icon: Users,        group: 'Acesso' },
    { key: 'permissions',   label: 'Permissões',           icon: Shield,       group: 'Acesso' },
    // ── Financeiro ─────────────────────────────────────────────
    { key: 'finance_config',label: 'Financeiro',           icon: DollarSign,   group: 'Financeiro' },
    // ── Comunicação ────────────────────────────────────────────
    { key: 'notifications', label: 'Notificações',         icon: Bell,         group: 'Comunicação' },
    { key: 'whatsapp',      label: 'WhatsApp',             icon: Wifi,         group: 'Comunicação' },
    { key: 'wa_templates',  label: 'Templates WA',         icon: MessageCircle,group: 'Comunicação' },
    { key: 'smtp',          label: 'E-mail / SMTP',        icon: Bell,         group: 'Comunicação' },
    // ── Integrações ────────────────────────────────────────────
    { key: 'integrations',  label: 'Integrações',          icon: Wifi,         group: 'Integrações' },
    { key: 'automations',   label: 'Automações',           icon: ChevronRight, group: 'Integrações' },
    // ── Fiscal & Legal ─────────────────────────────────────────
    { key: 'fiscal',        label: 'Fiscal / NF-e',        icon: Receipt,      group: 'Fiscal & Legal' },
    { key: 'terms',         label: 'Termos & Contratos',   icon: ClipboardList,group: 'Fiscal & Legal' },
    { key: 'public_status', label: 'Status Público',       icon: MapPin,       group: 'Fiscal & Legal' },
    // ── Sistema ────────────────────────────────────────────────
    { key: 'backup',        label: 'Backup & Export',      icon: Database,     group: 'Sistema' },
];

const inp: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
    color: '#fff', fontSize: '16px', outline: 'none', boxSizing: 'border-box' as const,
};
const lbl: React.CSSProperties = {
    display: 'block', fontSize: '13px', fontWeight: 500,
    color: 'rgba(255,255,255,0.7)', marginBottom: '6px',
};

// ── Toggle component ───────────────────────────────────────────
const Toggle: React.FC<{ label: string; sub?: string; value: boolean; onChange: (v: boolean) => void; color?: string }> = ({ label, sub, value, onChange, color = '#3b82f6' }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#fff' }}>{label}</div>
            {sub && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{sub}</div>}
        </div>
        <button onClick={() => onChange(!value)} style={{
            width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', flexShrink: 0,
            background: value ? color : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'all 0.2s',
        }}>
            <div style={{ position: 'absolute', top: '3px', left: value ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
        </button>
    </div>
);

// ── FinanceConfig ─────────────────────────────────────────────
const FinanceConfigSettings: React.FC<{ settings: SettingsMap; onSave: (k: string, v: string) => Promise<void> }> = ({ settings, onSave }) => {
    const [payMethods, setPayMethods] = useState<string[]>(() => {
        try { return JSON.parse(settings.finance_payment_methods || '[]'); } catch { return ['Dinheiro','PIX','Cartão de Crédito','Cartão de Débito']; }
    });
    const [costCenters, setCostCenters] = useState<string[]>(() => {
        try { return JSON.parse(settings.finance_cost_centers || '[]'); } catch { return ['Serviços','Peças','Despesas Gerais']; }
    });
    const [newPay, setNewPay] = useState('');
    const [newCC, setNewCC] = useState('');
    const [pixKey, setPixKey] = useState(settings.finance_pix_key || '');
    const [pixType, setPixType] = useState(settings.finance_pix_key_type || 'cpf');
    const [defaultPay, setDefaultPay] = useState(settings.finance_default_payment || 'PIX');
    const [requirePay, setRequirePay] = useState(settings.finance_require_payment_os === 'true');
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string|null>(null);

    const save = async () => {
        setSaving(true);
        try {
            await Promise.all([
                onSave('finance_payment_methods', JSON.stringify(payMethods)),
                onSave('finance_cost_centers', JSON.stringify(costCenters)),
                onSave('finance_pix_key', pixKey),
                onSave('finance_pix_key_type', pixType),
                onSave('finance_default_payment', defaultPay),
                onSave('finance_require_payment_os', String(requirePay)),
            ]);
            setMsg('Configurações salvas!');
        } catch { setMsg('Erro ao salvar.'); }
        finally { setSaving(false); setTimeout(() => setMsg(null), 3000); }
    };

    const addItem = (list: string[], setList: (v: string[]) => void, val: string, setVal: (v: string) => void) => {
        if (!val.trim() || list.includes(val.trim())) return;
        setList([...list, val.trim()]); setVal('');
    };
    const removeItem = (list: string[], setList: (v: string[]) => void, item: string) =>
        setList(list.filter(i => i !== item));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {msg && <div style={{ padding: '12px 16px', borderRadius: '10px', background: msg.includes('Erro') ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: msg.includes('Erro') ? '#ef4444' : '#22c55e', fontSize: '13px' }}>{msg}</div>}

            {/* Formas de pagamento */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CreditCard size={15} color="#3b82f6" /> Formas de Pagamento
                </h3>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input value={newPay} onChange={e => setNewPay(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem(payMethods, setPayMethods, newPay, setNewPay)} placeholder="Nova forma de pagamento" style={{ ...inp, flex: 1, fontSize: '14px' }} />
                    <button onClick={() => addItem(payMethods, setPayMethods, newPay, setNewPay)} style={{ padding: '10px 16px', borderRadius: '10px', background: 'var(--accent-primary)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        <Plus size={15} />
                    </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {payMethods.map(m => (
                        <div key={m} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '20px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', fontSize: '12px', color: '#60a5fa' }}>
                            {m}
                            <button onClick={() => removeItem(payMethods, setPayMethods, m)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', padding: '0 2px' }}><X size={11} /></button>
                        </div>
                    ))}
                </div>
                <div style={{ marginTop: '14px' }}>
                    <label style={lbl}>Forma de pagamento padrão</label>
                    <select value={defaultPay} onChange={e => setDefaultPay(e.target.value)} style={inp}>
                        {payMethods.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
            </div>

            {/* Centros de custo */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarSign size={15} color="#10b981" /> Centros de Custo
                </h3>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input value={newCC} onChange={e => setNewCC(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem(costCenters, setCostCenters, newCC, setNewCC)} placeholder="Novo centro de custo" style={{ ...inp, flex: 1, fontSize: '14px' }} />
                    <button onClick={() => addItem(costCenters, setCostCenters, newCC, setNewCC)} style={{ padding: '10px 16px', borderRadius: '10px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                        <Plus size={15} />
                    </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {costCenters.map(c => (
                        <div key={c} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '20px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', fontSize: '12px', color: '#34d399' }}>
                            {c}
                            <button onClick={() => removeItem(costCenters, setCostCenters, c)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 2px', display: 'flex' }}><X size={11} /></button>
                        </div>
                    ))}
                </div>
            </div>

            {/* PIX */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: '0 0 16px' }}>Chave PIX</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                        <label style={lbl}>Tipo</label>
                        <select value={pixType} onChange={e => setPixType(e.target.value)} style={inp}>
                            {['cpf','cnpj','email','telefone','aleatoria'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={lbl}>Chave</label>
                        <input value={pixKey} onChange={e => setPixKey(e.target.value)} placeholder="Sua chave PIX" style={inp} />
                    </div>
                </div>
            </div>

            {/* Regras financeiras */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Regras</h3>
                <Toggle label="Exigir pagamento ao entregar OS" sub="Bloqueia entrega sem pagamento registrado" value={requirePay} onChange={setRequirePay} color="#f59e0b" />
            </div>

            <button onClick={save} disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer', minHeight: '48px' }}>
                <Save size={16} />{saving ? 'Salvando...' : 'Salvar Configurações Financeiras'}
            </button>
        </div>
    );
};

// ── Customization Settings ─────────────────────────────────────
const CustomizationSettings: React.FC<{ settings: SettingsMap; onSave: (k: string, v: string) => Promise<void> }> = ({ settings, onSave }) => {
    const [color1, setColor1] = useState(settings.os_primary_color || '#3b82f6');
    const [color2, setColor2] = useState(settings.os_secondary_color || '#7c3aed');
    const [warrantyDays, setWarrantyDays] = useState(settings.os_warranty_days || '90');
    const [protocolPrefix, setProtocolPrefix] = useState(settings.os_protocol_prefix || '');
    const [openingHours, setOpeningHours] = useState(settings.company_opening_hours || 'Seg-Sex 9h-18h');
    const [requireChecklist, setRequireChecklist] = useState(settings.os_require_checklist === 'true');
    const [requirePhotosEntry, setRequirePhotosEntry] = useState(settings.os_require_photos_entry === 'true');
    const [maxOpenDays, setMaxOpenDays] = useState(settings.os_max_open_days || '30');
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string|null>(null);

    const save = async () => {
        setSaving(true);
        try {
            await Promise.all([
                onSave('os_primary_color', color1),
                onSave('os_secondary_color', color2),
                onSave('os_warranty_days', warrantyDays),
                onSave('os_protocol_prefix', protocolPrefix),
                onSave('company_opening_hours', openingHours),
                onSave('os_require_checklist', String(requireChecklist)),
                onSave('os_require_photos_entry', String(requirePhotosEntry)),
                onSave('os_max_open_days', maxOpenDays),
            ]);
            setMsg('Salvo com sucesso!');
        } catch { setMsg('Erro ao salvar.'); }
        finally { setSaving(false); setTimeout(() => setMsg(null), 3000); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {msg && <div style={{ padding: '12px 16px', borderRadius: '10px', background: msg.includes('Erro') ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: msg.includes('Erro') ? '#ef4444' : '#22c55e', fontSize: '13px' }}>{msg}</div>}

            {/* Cores */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Palette size={15} color="#a855f7" /> Cores do Sistema
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    {[
                        { l: 'Cor Principal', v: color1, s: setColor1 },
                        { l: 'Cor Secundária', v: color2, s: setColor2 },
                    ].map(({ l, v, s }) => (
                        <div key={l}>
                            <label style={lbl}>{l}</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input type="color" value={v} onChange={e => s(e.target.value)} style={{ width: '48px', height: '40px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'none', cursor: 'pointer', padding: '2px' }} />
                                <input value={v} onChange={e => s(e.target.value)} style={{ ...inp, flex: 1, fontFamily: 'monospace', fontSize: '14px' }} />
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ padding: '16px', borderRadius: '10px', background: `linear-gradient(135deg, ${color1}, ${color2})`, textAlign: 'center', fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                    Prévia do gradiente
                </div>
            </div>

            {/* OS */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: '0 0 16px' }}>Configurações de OS</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                        <label style={lbl}>Garantia Padrão (dias)</label>
                        <input type="number" value={warrantyDays} onChange={e => setWarrantyDays(e.target.value)} style={inp} min="0" max="365" />
                    </div>
                    <div>
                        <label style={lbl}>Prefixo do Protocolo</label>
                        <input value={protocolPrefix} onChange={e => setProtocolPrefix(e.target.value.toUpperCase().slice(0,4))} placeholder="Ex: AT" style={{ ...inp, fontFamily: 'monospace', textTransform: 'uppercase' }} />
                    </div>
                    <div>
                        <label style={lbl}>Alerta OS aberta (dias)</label>
                        <input type="number" value={maxOpenDays} onChange={e => setMaxOpenDays(e.target.value)} style={inp} min="1" max="365" />
                    </div>
                    <div>
                        <label style={lbl}>Horário de Atendimento</label>
                        <input value={openingHours} onChange={e => setOpeningHours(e.target.value)} placeholder="Seg-Sex 9h-18h" style={inp} />
                    </div>
                </div>
                <Toggle label="Exigir checklist de entrada" sub="Obrigatório preencher ao criar OS" value={requireChecklist} onChange={setRequireChecklist} />
                <Toggle label="Exigir fotos na entrada" sub="Obrigatório adicionar fotos ao criar OS" value={requirePhotosEntry} onChange={setRequirePhotosEntry} />
            </div>

            <button onClick={save} disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer', minHeight: '48px' }}>
                <Save size={16} />{saving ? 'Salvando...' : 'Salvar Personalização'}
            </button>
        </div>
    );
};

// ── Settings page ──────────────────────────────────────────────
export const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabKey>('company');
    const [settings, setSettings] = useState<SettingsMap>({});
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success'|'error'; text: string } | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showNewUserModal, setShowNewUserModal] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'technician' as User['role'] });
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    // WhatsApp
    const [waStep, setWaStep] = useState<'loading'|'disconnected'|'qrcode'|'connected'>('loading');
    const [waQrCode, setWaQrCode] = useState<string | null>(null);
    const [waConnecting, setWaConnecting] = useState(false);
    const [waError, setWaError] = useState<string | null>(null);
    const [testNumber, setTestNumber] = useState('');
    const [sendingTest, setSendingTest] = useState(false);
    const qrPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        fetchSettings();
        return () => { if (qrPollRef.current) clearInterval(qrPollRef.current); };
    }, []);

    useEffect(() => {
        if (activeTab === 'whatsapp') checkWhatsapp();
        if (activeTab === 'users') fetchUsers();
        setShowMobileMenu(false);
    }, [activeTab]);

    const fetchSettings = async () => {
        try {
            const r = await api.get('/settings');
            const map: SettingsMap = {};
            r.data.forEach((s: any) => { map[s.key] = s.value; });
            setSettings(map);
        } catch {} finally { setLoading(false); }
    };

    const fetchUsers = async () => {
        try { const r = await api.get('/users'); setUsers(r.data); } catch {}
    };

    const handleSave = async (key: string, value: string) => {
        try {
            await api.post('/settings', { key, value });
            setSettings(p => ({ ...p, [key]: value }));
            setMessage({ type: 'success', text: 'Configuração salva!' });
            setTimeout(() => setMessage(null), 2500);
        } catch { throw new Error('Erro ao salvar'); }
    };

    // WhatsApp
    const checkWhatsapp = async () => {
        setWaStep('loading');
        try {
            const r = await api.get('/whatsapp/status');
            setWaStep(r.data.connected ? 'connected' : 'disconnected');
        } catch { setWaStep('disconnected'); }
    };

    const handleConnect = async () => {
        setWaConnecting(true);
        setWaError(null);
        if (qrPollRef.current) clearInterval(qrPollRef.current);

        try {
            const instName = settings.whatsapp_instance_name || 'instance';
            const r = await api.post('/whatsapp/instance', { instanceName: instName }, { timeout: 35000 });

            if (r.data.success === false) {
                setWaError(r.data.error || 'Falha ao criar instância WhatsApp.');
                setWaConnecting(false);
                return;
            }

            // Se veio QR direto, mostra já
            if (r.data.qrcode) {
                setWaQrCode(r.data.qrcode);
                setWaStep('qrcode');
                setWaConnecting(false);
                startStatusPolling();
                return;
            }

            // Sem QR imediato — inicia polling de QR (Evolution pode levar alguns segundos)
            let attempts = 0;
            const maxAttempts = 20; // 20 × 3s = 60s
            qrPollRef.current = setInterval(async () => {
                attempts++;
                try {
                    const qrRes = await api.get('/whatsapp/qrcode', { timeout: 12000 });
                    if (qrRes.data?.qrcode) {
                        clearInterval(qrPollRef.current!);
                        setWaQrCode(qrRes.data.qrcode);
                        setWaStep('qrcode');
                        setWaConnecting(false);
                        startStatusPolling();
                        return;
                    }
                    if (qrRes.data?.status === 'connected') {
                        clearInterval(qrPollRef.current!);
                        setWaStep('connected');
                        setWaConnecting(false);
                        return;
                    }
                } catch {}
                if (attempts >= maxAttempts) {
                    clearInterval(qrPollRef.current!);
                    setWaError('QR Code não apareceu em 60s. Verifique se a Evolution API está online e tente novamente.');
                    setWaConnecting(false);
                }
            }, 3000);
        } catch (e: any) {
            const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Erro ao conectar.';
            setWaError(typeof msg === 'string' ? msg : 'Erro ao conectar. Tente novamente.');
            setWaConnecting(false);
        }
    };

    const startStatusPolling = () => {
        if (qrPollRef.current) clearInterval(qrPollRef.current);
        qrPollRef.current = setInterval(async () => {
            try {
                const s = await api.get('/whatsapp/status');
                if (s.data.connected) {
                    setWaStep('connected');
                    setWaQrCode(null);
                    clearInterval(qrPollRef.current!);
                }
            } catch {}
        }, 4000);
    };

    const handleDisconnect = async () => {
        try { await api.delete('/whatsapp/disconnect'); setWaStep('disconnected'); setWaQrCode(null); } catch {}
    };

    const handleSendTest = async () => {
        if (!testNumber) return;
        setSendingTest(true);
        try { await api.post('/whatsapp/test', { number: testNumber }); setMessage({ type: 'success', text: 'Mensagem enviada!' }); }
        catch { setMessage({ type: 'error', text: 'Erro ao enviar.' }); }
        finally { setSendingTest(false); setTimeout(() => setMessage(null), 3000); }
    };

    // Users
    const handleSaveUser = async () => {
        if (!editingUser) return;
        try {
            await api.patch(`/users/${editingUser.id}`, { name: editingUser.name, role: editingUser.role });
            setShowEditModal(false); fetchUsers();
        } catch { alert('Erro ao salvar.'); }
    };

    const handleCreateUser = async () => {
        if (!newUser.name || !newUser.email || !newUser.password) { alert('Preencha todos os campos.'); return; }
        try {
            await api.post('/auth/register', newUser);
            setShowNewUserModal(false); setNewUser({ name: '', email: '', password: '', role: 'technician' });
            fetchUsers();
        } catch (e: any) { alert(e?.response?.data?.message || 'Erro ao criar usuário.'); }
    };

    const handleToggleUser = async (u: User) => {
        try { await api.patch(`/users/${u.id}`, { isActive: !u.isActive }); fetchUsers(); } catch {}
    };

    const handleDeleteUser = async (u: User) => {
        if (!window.confirm(`Excluir o usuário ${u.name}? Esta ação não pode ser desfeita.`)) return;
        try { await api.delete(`/users/${u.id}`); fetchUsers(); } catch { alert('Erro ao excluir.'); }
    };

    // ── Render WhatsApp tab ─────────────────────────────────────
    const renderWhatsAppTab = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: waStep === 'connected' ? '#22c55e' : waStep === 'qrcode' ? '#f59e0b' : '#94a3b8', boxShadow: waStep === 'connected' ? '0 0 0 3px rgba(34,197,94,0.2)' : 'none' }} />
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                        {waStep === 'connected' ? 'Conectado' : waStep === 'qrcode' ? 'Aguardando QR Code' : waStep === 'loading' ? 'Verificando...' : 'Desconectado'}
                    </span>
                </div>
                {waError && (
                    <div style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '9px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '13px' }}>
                        {waError}
                    </div>
                )}
                {waStep === 'disconnected' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button onClick={handleConnect} disabled={waConnecting} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 22px', borderRadius: '10px', background: '#25d366', color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: waConnecting ? 'default' : 'pointer', opacity: waConnecting ? 0.8 : 1, minHeight: '44px' }}>
                            <RefreshCw size={15} style={waConnecting ? { animation: 'spin 1s linear infinite' } : undefined} />
                            {waConnecting ? 'Aguardando QR Code...' : 'Conectar WhatsApp'}
                            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                        </button>
                        {waConnecting && (
                            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                                Iniciando conexão com a Evolution API. Pode levar até 30s se o servidor estiver dormindo…
                            </p>
                        )}
                    </div>
                )}
                {waStep === 'qrcode' && waQrCode && (
                    <div style={{ textAlign: 'center' }}>
                        <img src={waQrCode} alt="QR Code" style={{ width: '200px', height: '200px', borderRadius: '12px', background: '#fff', padding: '8px' }} />
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>Abra WhatsApp → Menu → Dispositivos conectados → Conectar</p>
                    </div>
                )}
                {waStep === 'connected' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <input value={testNumber} onChange={e => setTestNumber(e.target.value)} placeholder="Número para teste (5547999999999)" style={{ ...inp, flex: 1, minWidth: '200px', fontSize: '14px' }} />
                            <button onClick={handleSendTest} disabled={sendingTest || !testNumber} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '10px', background: '#25d366', color: '#fff', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer', minHeight: '44px' }}>
                                <Send size={15} />{sendingTest ? 'Enviando...' : 'Testar'}
                            </button>
                        </div>
                        <button onClick={handleDisconnect} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '9px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                            Desconectar
                        </button>
                    </div>
                )}
            </div>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Configuração</h3>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', margin: '0 0 14px' }}>
                    Defina um nome único para identificar sua loja no WhatsApp. Use apenas letras, números e hífens.
                </p>
                <div>
                    <label style={lbl}>Nome da Instância</label>
                    <input
                        value={settings['whatsapp_instance_name'] || ''}
                        onChange={e => setSettings(p => ({ ...p, whatsapp_instance_name: e.target.value }))}
                        onBlur={e => handleSave('whatsapp_instance_name', e.target.value)}
                        placeholder="minha-assistencia"
                        style={inp}
                    />
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '6px' }}>
                        Ex: assistencia-blumenau, tecinfo, reparo-cel
                    </p>
                </div>
            </div>
        </div>
    );

    // ── Render Users tab ───────────────────────────────────────
    const renderUsersTab = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>{users.length} usuário(s)</p>
                <button onClick={() => setShowNewUserModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '9px', background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: '#fff', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer', minHeight: '40px' }}>
                    <Plus size={14} /> Novo Usuário
                </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {users.map(u => {
                    const roleColors: Record<string, string> = { admin: '#ef4444', technician: '#3b82f6', attendant: '#22c55e' };
                    const c = roleColors[u.role] || '#94a3b8';
                    return (
                        <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', flexWrap: 'wrap' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: `${c}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', color: c, flexShrink: 0 }}>
                                {u.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: u.isActive ? '#fff' : 'rgba(255,255,255,0.4)' }}>{u.name}</div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{u.email}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: `${c}18`, color: c, border: `1px solid ${c}30`, textTransform: 'capitalize' }}>{u.role}</span>
                                {!u.isActive && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>Inativo</span>}
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <button onClick={() => { setEditingUser(u); setShowEditModal(true); }} style={{ padding: '7px', borderRadius: '7px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#f59e0b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '32px', minHeight: '32px' }}><Edit3 size={13} /></button>
                                <button onClick={() => handleToggleUser(u)} style={{ padding: '7px', borderRadius: '7px', background: u.isActive ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', border: `1px solid ${u.isActive ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`, color: u.isActive ? '#ef4444' : '#22c55e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '32px', minHeight: '32px' }}>
                                    {u.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                                </button>
                                <button onClick={async () => {
                                    if (!confirm(`Resetar senha de "${u.name}"?`)) return;
                                    try {
                                        const r = await api.post(`/users/${u.id}/reset-password`);
                                        alert(`Senha temporária: ${r.data.tempPassword}\n\nO usuário deverá trocar no próximo acesso.`);
                                    } catch { alert('Erro ao resetar senha'); }
                                }} title="Resetar senha" style={{ padding: '7px', borderRadius: '7px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '32px', minHeight: '32px' }}>🔑</button>
                                <button onClick={() => handleDeleteUser(u)} style={{ padding: '7px', borderRadius: '7px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '32px', minHeight: '32px' }}><Trash2 size={13} /></button>
                            </div>
                        </div>
                    );
                })}
                {users.length === 0 && (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
                        Nenhum usuário cadastrado
                    </div>
                )}
            </div>
        </div>
    );

    const groups = [...new Set(TABS.map(t => t.group))];
    const currentTab = TABS.find(t => t.key === activeTab);

    const isMobileView = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
        <div className="settings-layout" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

            {/* Menu lateral — desktop / tabs topo no mobile */}
            <div style={{ width: isMobileView ? '100%' : '200px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <style>{`
                    @media (max-width: 767px) {
                        .settings-sidebar { display: none !important; }
                        .settings-layout { flex-direction: column !important; }
                        .settings-content { width: 100% !important; }
                        .settings-mobile-tabs { display: flex !important; }
                    }
                    @media (min-width: 768px) {
                        .settings-mobile-tabs { display: none !important; }
                    }
                `}</style>

                {/* Tabs horizontais — apenas mobile */}
                <div className="settings-mobile-tabs" style={{
                    display: 'none',
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'none',
                    gap: '6px',
                    paddingBottom: '4px',
                }}>
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.key;
                        return (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 14px', borderRadius: '20px', border: 'none',
                                background: active ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)',
                                color: active ? '#60a5fa' : 'rgba(255,255,255,0.5)',
                                fontWeight: active ? 700 : 400, fontSize: '13px',
                                cursor: 'pointer', whiteSpace: 'nowrap', minHeight: '36px',
                                flexShrink: 0,
                            }}>
                                <Icon size={13} /> {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="settings-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '200px' }}>
                    {groups.map(group => (
                        <div key={group}>
                            <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', paddingLeft: '4px' }}>{group}</div>
                            {TABS.filter(t => t.group === group).map(tab => {
                                const Icon = tab.icon;
                                const active = activeTab === tab.key;
                                return (
                                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ display: 'flex', alignItems: 'center', gap: '9px', width: '100%', padding: '9px 12px', borderRadius: '9px', border: `1px solid ${active ? 'rgba(59,130,246,0.3)' : 'transparent'}`, background: active ? 'rgba(59,130,246,0.1)' : 'transparent', color: active ? 'var(--accent-primary)' : 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: '13px', fontWeight: active ? 600 : 400, textAlign: 'left', transition: 'all 0.15s', minHeight: '38px' }}
                                        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                                        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                                        <Icon size={14} style={{ flexShrink: 0 }} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Conteúdo */}
            <div className="settings-content" style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {currentTab && React.createElement(currentTab.icon, { size: 18, color: 'var(--accent-primary)' })}
                    {currentTab?.label}
                </h2>

                {message && (
                    <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', background: message.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: message.type === 'error' ? '#ef4444' : '#22c55e', fontSize: '13px' }}>
                        {message.text}
                    </div>
                )}

                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <div>Carregando configurações...</div>
                        <button onClick={fetchSettings} style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', cursor: 'pointer', fontSize: '13px' }}>Tentar novamente</button>
                    </div>
                ) : (
                    <>
                        {activeTab === 'company'       && <CompanySettings settings={settings} onSave={handleSave} />}
                        {activeTab === 'os'            && <OSSettings initialJson={settings.os_custom_workflow} onSave={(json) => handleSave('os_custom_workflow', json)} />}
                        {activeTab === 'printing'      && <PrintingSettings settings={settings} onSave={handleSave} />}
                        {activeTab === 'thermal'       && <ThermalPrinterSettings settings={settings} onSave={handleSave} />}
                        {activeTab === 'services'      && <ServiceCatalogSettings />}
                        {activeTab === 'appearance'    && <AppearanceSettings settings={settings} onSave={handleSave} />}
                        {activeTab === 'finance_config'&& <FinanceConfigSettings settings={settings} onSave={handleSave} />}
                        {activeTab === 'users'         && renderUsersTab()}
                        {activeTab === 'permissions'   && <PermissionsSettings settings={settings} onSave={handleSave} />}
                        {activeTab === 'notifications' && <NotificationsSettings settings={settings} onSave={handleSave} />}
                        {activeTab === 'whatsapp'      && renderWhatsAppTab()}
                        {activeTab === 'wa_templates'  && <WhatsAppTemplates settings={settings} onSave={handleSave} />}
                        {activeTab === 'smtp'          && <SmtpSettings settings={settings} onSave={handleSave} />}
                        {activeTab === 'integrations'  && <IntegrationsSettings settings={settings} onSave={handleSave} />}
                        {activeTab === 'automations'   && <AutomationsSettings settings={settings} onSave={handleSave} />}
                        {activeTab === 'fiscal'        && <FiscalSettings settings={settings} onSave={handleSave} />}
                        {activeTab === 'terms'         && <TermsSettings settings={settings} onSave={handleSave} />}
                        {activeTab === 'public_status' && <PublicStatusSettings settings={settings} onSave={handleSave} />}
                        {activeTab === 'backup'        && <BackupSettings />}
                    </>
                )}
            </div>

            {/* Modal drawer mobile para menu */}
            {showMobileMenu && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowMobileMenu(false)}>
                    <div style={{ width: '100%', background: 'var(--bg-secondary)', borderRadius: '16px 16px 0 0', padding: '20px', maxHeight: '70dvh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.2)', margin: '0 auto 16px' }} />
                        {groups.map(group => (
                            <div key={group} style={{ marginBottom: '16px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>{group}</div>
                                {TABS.filter(t => t.group === group).map(tab => {
                                    const Icon = tab.icon;
                                    const active = activeTab === tab.key;
                                    return (
                                        <button key={tab.key} onClick={() => { setActiveTab(tab.key); setShowMobileMenu(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: active ? 'rgba(59,130,246,0.1)' : 'transparent', color: active ? 'var(--accent-primary)' : 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '14px', fontWeight: active ? 600 : 400, minHeight: '48px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <Icon size={16} /> {tab.label}
                                            </div>
                                            {active && <ChevronRight size={14} />}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal editar usuário */}
            {showEditModal && editingUser && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', margin: 0 }}>Editar Usuário</h3>
                            <button onClick={() => setShowEditModal(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', borderRadius: '8px', padding: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                        </div>
                        <div><label style={lbl}>Nome</label><input value={editingUser.name} onChange={e => setEditingUser(p => p ? { ...p, name: e.target.value } : p)} style={inp} /></div>
                        <div><label style={lbl}>Perfil</label>
                            <select value={editingUser.role} onChange={e => setEditingUser(p => p ? { ...p, role: e.target.value as User['role'] } : p)} style={inp}>
                                <option value="admin">Administrador</option>
                                <option value="technician">Técnico</option>
                                <option value="attendant">Atendente</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: '11px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                            <button onClick={handleSaveUser} style={{ flex: 2, padding: '11px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Save size={15} /> Salvar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal novo usuário */}
            {showNewUserModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', margin: 0 }}>Novo Usuário</h3>
                            <button onClick={() => setShowNewUserModal(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', borderRadius: '8px', padding: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                        </div>
                        {[
                            { k: 'name', l: 'Nome completo', ph: 'João Silva', t: 'text' },
                            { k: 'email', l: 'E-mail / Usuário', ph: 'joao@exemplo.com', t: 'email' },
                            { k: 'password', l: 'Senha inicial', ph: '••••••••', t: 'password' },
                        ].map(f => (
                            <div key={f.k}><label style={lbl}>{f.l}</label><input type={f.t} value={(newUser as any)[f.k]} onChange={e => setNewUser(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.ph} style={inp} /></div>
                        ))}
                        <div><label style={lbl}>Perfil</label>
                            <select value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value as User['role'] }))} style={inp}>
                                <option value="admin">Administrador</option>
                                <option value="technician">Técnico</option>
                                <option value="attendant">Atendente</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setShowNewUserModal(false)} style={{ flex: 1, padding: '11px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                            <button onClick={handleCreateUser} style={{ flex: 2, padding: '11px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Plus size={15} /> Criar Usuário</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
