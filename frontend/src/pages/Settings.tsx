import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { OSSettings } from '../components/settings/OSSettings';
import { PrintingSettings } from '../components/settings/PrintingSettings';
import { CompanySettings } from '../components/settings/CompanySettings';
import { CustomSelect } from '../components/CustomSelect';
import { Shield, Smartphone, Users, RefreshCw, Edit3, UserX, UserCheck, Wifi, Send, MessageCircle, Trash2, ClipboardList, Printer, Building2 } from 'lucide-react';

interface SettingsMap { [key: string]: string; }
interface User {
    id: string; name: string; email: string;
    role: 'admin' | 'technician' | 'attendant';
    isActive: boolean; lastLogin?: string;
}

// ─── Styles ─────────────────────────────────────────
const glassBg: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px',
};
const badge = (color: string): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
    background: `${color}18`, color, border: `1px solid ${color}30`,
});
const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
    color: '#fff', fontSize: '14px', outline: 'none',
};
const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '6px'
};
const modalOverlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
};
const modalBox: React.CSSProperties = {
    ...glassBg, background: 'rgba(20,20,35,0.95)', padding: '28px', width: '100%',
    maxWidth: '800px', overflow: 'hidden',
};

const getTabStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
    border: active ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
    background: active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
    color: active ? 'var(--primary)' : 'rgba(255,255,255,0.6)',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap'
});

export const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'general' | 'integrations' | 'users' | 'os' | 'printing' | 'company'>('general');
    const [settings, setSettings] = useState<SettingsMap>({});
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // WhatsApp — only 3 simple states
    const [waStep, setWaStep] = useState<'loading' | 'disconnected' | 'qrcode' | 'connected'>('loading');
    const [waQrCode, setWaQrCode] = useState<string | null>(null);
    const [waConnecting, setWaConnecting] = useState(false);
    const [testNumber, setTestNumber] = useState('');
    const [sendingTest, setSendingTest] = useState(false);
    const qrPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (activeTab === 'general' || activeTab === 'integrations' || activeTab === 'company' || activeTab === 'printing') fetchSettings();
        if (activeTab === 'integrations') checkWhatsapp();
        if (activeTab === 'users') fetchUsers();
        return () => { if (qrPollRef.current) clearInterval(qrPollRef.current); };
    }, [activeTab]);

    // ─── WhatsApp (super simple) ────────────────────
    const checkWhatsapp = async () => {
        try {
            const res = await api.get('/whatsapp/status');
            setWaStep(res.data.connected ? 'connected' : 'disconnected');
        } catch {
            setWaStep('disconnected');
        }
    };

    const handleConnect = async () => {
        try {
            setWaConnecting(true);
            setMessage({ type: 'success', text: 'Conectando ao servidor WhatsApp...' });
            // Check if API is configured
            const configRes = await api.get('/whatsapp/config');
            if (!configRes.data.configured) {
                setMessage({ type: 'error', text: 'WhatsApp não está disponível. Entre em contato com o suporte técnico.' });
                setTimeout(() => setMessage(null), 5000);
                return;
            }

            let qrCode: string | null = null;

            if (!configRes.data.hasInstance) {
                setMessage({ type: 'success', text: 'Criando conexão WhatsApp...' });
                const instanceName = `loja-${Date.now()}`;
                const createRes = await api.post('/whatsapp/instance', { instanceName });
                if (!createRes.data.success) {
                    setMessage({ type: 'error', text: createRes.data.error || 'Erro ao criar instância' });
                    setTimeout(() => setMessage(null), 5000);
                    return;
                }
                // v2.2.3: QR code comes in create response
                qrCode = createRes.data.qrcode || null;
            }

            // If no QR from create, try dedicated endpoint
            if (!qrCode) {
                setMessage({ type: 'success', text: 'Gerando QR Code...' });
                const qrRes = await api.get('/whatsapp/qrcode');
                qrCode = qrRes.data.qrcode || null;
            }

            if (qrCode) {
                // If it's not a data URL, make it one
                if (!qrCode.startsWith('data:')) {
                    qrCode = `data:image/png;base64,${qrCode}`;
                }
                setWaQrCode(qrCode);
                setWaStep('qrcode');
                startPolling();
                setMessage(null);
            } else {
                // Maybe already connected
                await checkWhatsapp();
                setMessage(null);
            }
        } catch (err: unknown) {
            console.error('WhatsApp connect error:', err);
            const error = err as { response?: { data?: { message?: string } }; message?: string };
            const errorMsg = error?.response?.data?.message || error?.message || 'Erro desconhecido';
            setMessage({ type: 'error', text: `Erro ao conectar: ${errorMsg}. O servidor pode estar iniciando, tente novamente em 1 minuto.` });
            setTimeout(() => setMessage(null), 8000);
        } finally {
            setWaConnecting(false);
        }
    };

    const startPolling = () => {
        if (qrPollRef.current) clearInterval(qrPollRef.current);
        qrPollRef.current = setInterval(async () => {
            try {
                const res = await api.get('/whatsapp/status');
                if (res.data.connected) {
                    setWaStep('connected');
                    setWaQrCode(null);
                    if (qrPollRef.current) clearInterval(qrPollRef.current);
                    setMessage({ type: 'success', text: 'WhatsApp conectado com sucesso! 🎉' });
                    setTimeout(() => setMessage(null), 4000);
                }
            } catch { /* ignore */ }
        }, 4000);
    };

    const handleRefreshQR = async () => {
        try {
            const res = await api.get('/whatsapp/qrcode');
            if (res.data.qrcode) setWaQrCode(res.data.qrcode);
        } catch {
            setMessage({ type: 'error', text: 'Erro ao atualizar QR Code' });
        }
    };

    const handleDisconnect = async () => {
        if (!window.confirm('Deseja desconectar o WhatsApp?')) return;
        try {
            await api.delete('/whatsapp/disconnect');
            setWaStep('disconnected');
            setMessage({ type: 'success', text: 'WhatsApp desconectado' });
            setTimeout(() => setMessage(null), 3000);
        } catch {
            setMessage({ type: 'error', text: 'Erro ao desconectar' });
        }
    };

    const handleSendTest = async () => {
        if (!testNumber) return;
        try {
            setSendingTest(true);
            const res = await api.post('/whatsapp/test', { number: testNumber });
            setMessage({ type: res.data.success ? 'success' : 'error', text: res.data.success ? '✅ Mensagem enviada!' : (res.data.error || 'Falha ao enviar') });
            setTimeout(() => setMessage(null), 3000);
        } catch {
            setMessage({ type: 'error', text: 'Erro ao enviar' });
        } finally {
            setSendingTest(false);
        }
    };

    // ─── Data ───────────────────────────────────────
    const fetchSettings = async () => {
        try {
            setLoading(true);
            const r = await api.get('/settings');
            const m: SettingsMap = {};
            r.data.forEach((s: any) => { m[s.key] = s.value; });
            setSettings(m);
        } catch {
            setMessage({ type: 'error', text: 'Erro ao carregar configurações' });
        } finally { setLoading(false); }
    };
    const fetchUsers = async () => {
        try {
            setLoading(true);
            setUsers((await api.get('/users')).data);
        } catch {
            setMessage({ type: 'error', text: 'Erro ao carregar usuários' });
        } finally { setLoading(false); }
    };
    const handleSave = async (key: string, value: string) => {
        try {
            setLoading(true);
            await api.put(`/settings/${key}`, { value });
            setSettings(p => ({ ...p, [key]: value }));
            setMessage({ type: 'success', text: 'Salvo!' });
            setTimeout(() => setMessage(null), 2000);
        } catch {
            setMessage({ type: 'error', text: 'Erro ao salvar' });
        } finally { setLoading(false); }
    };
    const handleUpdateUser = async (userId: string, data: Partial<User>) => {
        try {
            setLoading(true);
            await api.patch(`/users/${userId}`, data);
            setMessage({ type: 'success', text: 'Usuário atualizado!' });
            fetchUsers(); setShowEditModal(false); setEditingUser(null);
            setTimeout(() => setMessage(null), 3000);
        } catch {
            setMessage({ type: 'error', text: 'Erro ao atualizar' });
        } finally { setLoading(false); }
    };

    // ─── General Tab ────────────────────────────────
    const renderGeneralTab = () => (
        <div style={{ ...glassBg, padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '20px' }}>Aparência da OS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                <div>
                    <label style={labelStyle}>Cor Primária</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                        <input type="color" value={settings.os_primary_color || '#000000'} onChange={(e) => handleSave('os_primary_color', e.target.value)}
                            style={{ width: '50px', height: '40px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'none' }} />
                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>{settings.os_primary_color}</span>
                    </div>
                    <p style={{ marginTop: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Usada em cabeçalhos e destaques nos PDFs.</p>
                </div>
                <div>
                    <label style={labelStyle}>Nome da Empresa</label>
                    <input type="text" value={settings.company_name || ''} onBlur={(e) => handleSave('company_name', e.target.value)}
                        onChange={(e) => setSettings({ ...settings, company_name: e.target.value })} style={inputStyle} />
                </div>
            </div>
        </div>
    );

    // ─── Integrations Tab ───────────────────────────
    const renderIntegrationsTab = () => {

        // Loading
        if (waStep === 'loading') return (
            <div style={{ ...glassBg, padding: '60px', textAlign: 'center' }}>
                <RefreshCw size={32} className="animate-spin" style={{ color: 'rgba(255,255,255,0.3)', margin: '0 auto 16px', display: 'block' }} />
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>Verificando WhatsApp...</p>
            </div>
        );

        // ✅ Connected
        if (waStep === 'connected') return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Green banner */}
                <div style={{
                    ...glassBg, padding: '28px',
                    background: 'linear-gradient(135deg, rgba(37,211,102,0.12), rgba(18,140,126,0.08))',
                    border: '1px solid rgba(37,211,102,0.25)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '56px', height: '56px', borderRadius: '16px',
                                background: 'linear-gradient(135deg, #25d366, #128c7e)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 8px 24px rgba(37,211,102,0.3)',
                            }}>
                                <Wifi size={26} color="#fff" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, color: '#fff', fontSize: '18px' }}>WhatsApp Conectado</div>
                                <div style={{ fontSize: '13px', color: '#25d366', marginTop: '3px' }}>🟢 Pronto para enviar mensagens aos clientes</div>
                            </div>
                        </div>
                        <button onClick={handleDisconnect} style={{
                            padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)',
                            background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer',
                            fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
                        }}>
                            <Trash2 size={14} /> Desconectar
                        </button>
                    </div>
                </div>

                {/* Test message */}
                <div style={{ ...glassBg, padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Send size={18} color="#3b82f6" /> Testar Envio
                    </h3>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>
                        Envie uma mensagem de teste para verificar se está tudo funcionando.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', maxWidth: '460px' }}>
                        <input type="text" value={testNumber} onChange={(e) => setTestNumber(e.target.value)}
                            placeholder="Número com DDD (ex: 5511999999999)"
                            style={{ ...inputStyle, flex: 1 }} />
                        <button onClick={handleSendTest} disabled={sendingTest || !testNumber}
                            style={{
                                padding: '10px 20px', borderRadius: '10px', border: 'none',
                                background: sendingTest || !testNumber ? 'rgba(37,211,102,0.3)' : 'linear-gradient(135deg, #25d366, #128c7e)',
                                color: '#fff', cursor: sendingTest || !testNumber ? 'not-allowed' : 'pointer',
                                fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
                                whiteSpace: 'nowrap',
                            }}>
                            {sendingTest ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                            {sendingTest ? '...' : 'Enviar'}
                        </button>
                    </div>
                </div>
            </div>
        );

        // 📱 QR Code
        if (waStep === 'qrcode') return (
            <div style={{ ...glassBg, padding: '40px 32px', textAlign: 'center' }}>
                <div style={{
                    width: '64px', height: '64px', borderRadius: '18px', margin: '0 auto 24px',
                    background: 'linear-gradient(135deg, #25d366, #128c7e)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(37,211,102,0.3)',
                }}>
                    <Smartphone size={30} color="#fff" />
                </div>

                <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
                    Escaneie com seu WhatsApp
                </h3>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', maxWidth: '380px', margin: '0 auto 24px', lineHeight: '1.6' }}>
                    No celular, abra o <strong style={{ color: '#25d366' }}>WhatsApp</strong> → toque nos <strong style={{ color: '#fff' }}>três pontinhos (⋮)</strong> → <strong style={{ color: '#fff' }}>Aparelhos conectados</strong> → <strong style={{ color: '#fff' }}>Conectar aparelho</strong>
                </p>

                {waQrCode ? (
                    <div style={{
                        display: 'inline-block', padding: '16px', borderRadius: '20px',
                        background: '#fff', marginBottom: '24px',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                    }}>
                        <img src={waQrCode} alt="QR Code" style={{ width: '260px', height: '260px', display: 'block' }} />
                    </div>
                ) : (
                    <div style={{
                        width: '292px', height: '292px', margin: '0 auto 24px',
                        borderRadius: '20px', background: 'rgba(255,255,255,0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <RefreshCw size={32} className="animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />
                    </div>
                )}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button onClick={handleRefreshQR} style={{
                        padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)',
                        background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer',
                        fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                        <RefreshCw size={14} /> Atualizar QR Code
                    </button>
                    <button onClick={() => { setWaStep('disconnected'); setWaQrCode(null); if (qrPollRef.current) clearInterval(qrPollRef.current); }}
                        style={{
                            padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)',
                            background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                            fontSize: '13px', fontWeight: 500,
                        }}>
                        Cancelar
                    </button>
                </div>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '20px' }}>
                    Aguardando leitura do QR Code... A tela atualiza automaticamente.
                </p>
            </div>
        );

        // 🔌 Disconnected — Connect Button & Manual Config
        return (
            <div style={{ ...glassBg, padding: '32px', textAlign: 'center' }}>
                <div style={{
                    width: '80px', height: '80px', borderRadius: '24px', margin: '0 auto 24px',
                    background: 'linear-gradient(135deg, rgba(37,211,102,0.15), rgba(18,140,126,0.1))',
                    border: '1px solid rgba(37,211,102,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <MessageCircle size={36} color="#25d366" />
                </div>

                <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
                    WhatsApp
                </h3>
                <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', maxWidth: '400px', margin: '0 auto 32px', lineHeight: '1.6' }}>
                    Conecte o WhatsApp para enviar notificações automáticas aos clientes.
                </p>

                {/* Manual Config Section */}
                <div style={{ maxWidth: '400px', margin: '0 auto 32px', textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px' }}>

                    {/* Local Server Info */}
                    <div style={{ marginBottom: '16px', padding: '10px', background: 'rgba(37,211,102,0.1)', borderRadius: '8px', border: '1px solid rgba(37,211,102,0.2)' }}>
                        <p style={{ margin: 0, fontSize: '13px', color: '#25d366', fontWeight: 600 }}>Servidor Local Ativo</p>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                            O sistema está configurado para usar o Evolution API local (Docker).
                            Não é necessário alterar as configurações abaixo a menos que deseje usar um servidor externo.
                        </p>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <label style={labelStyle}>API URL</label>
                        <input
                            type="text"
                            value={settings.whatsapp_api_url || ''}
                            onChange={(e) => setSettings({ ...settings, whatsapp_api_url: e.target.value })}
                            onBlur={(e) => handleSave('whatsapp_api_url', e.target.value)}
                            style={inputStyle}
                            placeholder="Padrão: http://localhost:8080"
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>API Token</label>
                        <input
                            type="password"
                            value={settings.whatsapp_api_token || ''}
                            onChange={(e) => setSettings({ ...settings, whatsapp_api_token: e.target.value })}
                            onBlur={(e) => handleSave('whatsapp_api_token', e.target.value)}
                            style={inputStyle}
                            placeholder="Padrão: B8D6F5E4C3A2910G7"
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={handleConnect}
                        disabled={waConnecting}
                        style={{
                            padding: '16px 40px', borderRadius: '14px', border: 'none',
                            background: waConnecting ? 'rgba(37,211,102,0.4)' : 'linear-gradient(135deg, #25d366, #128c7e)',
                            color: '#fff', cursor: waConnecting ? 'not-allowed' : 'pointer',
                            fontSize: '16px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '10px',
                            boxShadow: waConnecting ? 'none' : '0 8px 32px rgba(37,211,102,0.35)',
                            transition: 'all 0.3s ease',
                        }}
                    >
                        {waConnecting
                            ? <><RefreshCw size={20} className="animate-spin" /> Conectando (aguarde)...</>
                            : <><Smartphone size={20} /> Conectar WhatsApp</>}
                    </button>

                    <button
                        onClick={handleDisconnect}
                        style={{
                            background: 'transparent', border: 'none', color: 'rgba(239,68,68,0.7)',
                            fontSize: '13px', cursor: 'pointer', textDecoration: 'underline'
                        }}
                    >
                        Resetar Instância (Problemas de conexão?)
                    </button>
                </div>
                {waConnecting && (
                    <p style={{ marginTop: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                        Se o servidor estiver "dormindo", isso pode levar até 2 minutos...
                    </p>
                )}
            </div>
        );
    };

    // ─── Users Tab ──────────────────────────────────
    const renderUsersTab = () => (
        <div style={{ ...glassBg, overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>Gerenciamento de Usuários</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        {['Nome', 'Email', 'Role', 'Status'].map(h => (
                            <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                        <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            <td style={{ padding: '12px 16px', color: '#fff', fontSize: '14px', fontWeight: 500 }}>{u.name}</td>
                            <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{u.email}</td>
                            <td style={{ padding: '12px 16px' }}>
                                <span style={badge(u.role === 'admin' ? '#a855f7' : u.role === 'technician' ? '#3b82f6' : '#10b981')}>{u.role}</span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                                <span style={badge(u.isActive ? '#10b981' : '#ef4444')}>{u.isActive ? 'Ativo' : 'Inativo'}</span>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                    <button onClick={() => { setEditingUser(u); setShowEditModal(true); }}
                                        style={{ padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', color: 'var(--primary)', cursor: 'pointer' }}>
                                        <Edit3 size={16} />
                                    </button>
                                    <button onClick={() => { if (window.confirm('Desativar/ativar este usuário?')) handleUpdateUser(u.id, { isActive: !u.isActive }); }}
                                        style={{ padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', color: u.isActive ? 'var(--danger)' : '#10b981', cursor: 'pointer' }}>
                                        {u.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {showEditModal && editingUser && (
                <div style={modalOverlay} onClick={() => setShowEditModal(false)}>
                    <div style={modalBox} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '20px' }}>Editar Usuário</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={labelStyle}>Nome</label>
                                <input type="text" value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Role</label>
                                <CustomSelect
                                    value={editingUser.role}
                                    onChange={(val) => setEditingUser({ ...editingUser, role: val as any })}
                                    options={[
                                        { label: 'Administrador', value: 'admin' },
                                        { label: 'Técnico', value: 'technician' },
                                        { label: 'Atendente', value: 'attendant' }
                                    ]}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                                <button onClick={() => setShowEditModal(false)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Cancelar</button>
                                <button onClick={() => handleUpdateUser(editingUser.id, { name: editingUser.name, role: editingUser.role })} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, var(--primary), #7c3aed)', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Salvar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#fff' }}>Configurações</h1>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>Gerencie as preferências do sistema e integrações.</p>
            </div>

            {message && (
                <div style={{
                    marginBottom: '20px', padding: '12px 16px', borderRadius: '10px', fontSize: '14px',
                    background: message.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: message.type === 'success' ? '#10b981' : '#ef4444',
                    border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}30`
                }}>
                    {message.text}
                </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
                <button
                    onClick={() => setActiveTab('general')}
                    style={getTabStyle(activeTab === 'general')}
                >
                    <Shield size={16} /> Geral
                </button>
                <button
                    onClick={() => setActiveTab('company')}
                    style={getTabStyle(activeTab === 'company')}
                >
                    <Building2 size={16} /> Empresa
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    style={getTabStyle(activeTab === 'users')}
                >
                    <Users size={16} /> Usuários
                </button>
                <button
                    onClick={() => setActiveTab('os')}
                    style={getTabStyle(activeTab === 'os')}
                >
                    <ClipboardList size={16} /> OS
                </button>
                <button
                    onClick={() => setActiveTab('printing')}
                    style={getTabStyle(activeTab === 'printing')}
                >
                    <Printer size={16} /> Impressão
                </button>
                <button
                    onClick={() => setActiveTab('integrations')}
                    style={getTabStyle(activeTab === 'integrations')}
                >
                    <Smartphone size={16} /> Integ.
                </button>
            </div>

            {loading && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RefreshCw className="animate-spin text-white" size={32} />
                </div>
            )}

            {activeTab === 'general' && renderGeneralTab()}
            {activeTab === 'company' && (
                <CompanySettings settings={settings} onSave={handleSave} />
            )}
            {activeTab === 'integrations' && renderIntegrationsTab()}
            {activeTab === 'os' && <OSSettings initialJson={settings.os_custom_workflow} onSave={(json) => handleSave('os_custom_workflow', json)} />}
            {activeTab === 'printing' && <PrintingSettings settings={settings} onSave={handleSave} />}
            {activeTab === 'users' && renderUsersTab()}
        </div>
    );
};
