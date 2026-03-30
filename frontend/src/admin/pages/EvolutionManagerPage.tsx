import React, { useEffect, useState } from 'react';
import { MessageCircle, RefreshCw, Trash2, Plus, Wifi, WifiOff, QrCode, Link2 } from 'lucide-react';
import api from '../../services/api';

interface Instance {
    instanceName: string;
    status: string;
    ownerJid?: string;
    profileName?: string;
    qrcode?: { base64?: string; count?: number };
}

export const EvolutionManagerPage: React.FC = () => {
    const [instances, setInstances] = useState<Instance[]>([]);
    const [loading, setLoading] = useState(true);
    const [qrInstance, setQrInstance] = useState<string | null>(null);
    const [qrBase64, setQrBase64] = useState<string | null>(null);
    const [qrLoading, setQrLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const r = await api.get('/whatsapp/instances');
            setInstances(r.data || []);
        } catch {
            setInstances([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const getQr = async (name: string) => {
        setQrInstance(name);
        setQrBase64(null);
        setQrLoading(true);
        try {
            const r = await api.get(`/whatsapp/qrcode?instance=${name}`);
            setQrBase64(r.data?.base64 || null);
        } catch {
            setQrBase64(null);
        } finally {
            setQrLoading(false);
        }
    };

    const deleteInstance = async (name: string) => {
        if (!confirm(`Deletar instância "${name}"?`)) return;
        try {
            await api.delete(`/whatsapp/instance/${name}`);
            load();
        } catch { /* ignore */ }
    };

    const configWebhook = async (name: string) => {
        try {
            const r = await api.post(`/whatsapp/instance/${name}/webhook`);
            alert(r.data?.message || 'Webhook configurado!');
        } catch (e: any) {
            alert('Erro: ' + (e?.response?.data?.message || e.message));
        }
    };

    const createInstance = async () => {
        const name = prompt('Nome da instância (ex: loja_cliente):');
        if (!name) return;
        try {
            await api.post('/whatsapp/instance', { instanceName: name });
            load();
        } catch { /* ignore */ }
    };

    const isConnected = (s: string) => s === 'open' || s === 'connected';

    return (
        <div style={{ padding: '28px', maxWidth: '900px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MessageCircle size={20} color="#60a5fa" />
                    <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>Evolution Manager</h1>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={load} style={btnStyle('#1e293b')}>
                        <RefreshCw size={13} /> Atualizar
                    </button>
                    <button onClick={createInstance} style={btnStyle('#2563eb')}>
                        <Plus size={13} /> Nova Instância
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Carregando...</div>
            ) : instances.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', padding: '40px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '10px' }}>
                    Nenhuma instância encontrada
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {instances.map(inst => (
                        <div key={inst.instanceName} style={{ background: '#0f1623', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {isConnected(inst.status)
                                        ? <Wifi size={16} color="#22c55e" />
                                        : <WifiOff size={16} color="#ef4444" />}
                                    <div>
                                        <div style={{ color: '#fff', fontWeight: 600, fontSize: '13px' }}>{inst.instanceName}</div>
                                        <div style={{ color: isConnected(inst.status) ? '#22c55e' : '#ef4444', fontSize: '11px', marginTop: '2px' }}>
                                            {isConnected(inst.status) ? `Conectado${inst.profileName ? ` · ${inst.profileName}` : ''}` : 'Desconectado'}
                                        </div>
                                        {inst.ownerJid && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>{inst.ownerJid.split('@')[0]}</div>}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {!isConnected(inst.status) && (
                                        <button onClick={() => getQr(inst.instanceName)} style={btnStyle('#7c3aed')}>
                                            <QrCode size={12} /> QR Code
                                        </button>
                                    )}
                                    <button onClick={() => configWebhook(inst.instanceName)} style={btnStyle('#065f46')} title="Configurar webhook para receber mensagens">
                                        <Link2 size={12} /> Webhook
                                    </button>
                                    <button onClick={() => deleteInstance(inst.instanceName)} style={btnStyle('#7f1d1d')}>
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>

                            {qrInstance === inst.instanceName && (
                                <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', textAlign: 'center' }}>
                                    {qrLoading ? (
                                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Gerando QR Code...</div>
                                    ) : qrBase64 ? (
                                        <>
                                            <img src={qrBase64} alt="QR Code" style={{ width: '180px', height: '180px', borderRadius: '8px' }} />
                                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '8px' }}>Escaneie com o WhatsApp</div>
                                        </>
                                    ) : (
                                        <div style={{ color: '#ef4444', fontSize: '12px' }}>Não foi possível gerar o QR Code</div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const btnStyle = (bg: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '6px 12px', borderRadius: '6px', border: 'none',
    background: bg, color: '#fff', fontSize: '12px',
    cursor: 'pointer', fontWeight: 500,
});
