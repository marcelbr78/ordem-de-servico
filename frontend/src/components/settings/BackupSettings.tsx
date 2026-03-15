import React, { useState } from 'react';
import { Download, Database, FileText, Users, Package, DollarSign, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const EXPORT_OPTIONS = [
    { key: 'clients',  label: 'Clientes',         icon: Users,     color: '#3b82f6', endpoint: '/clients' },
    { key: 'orders',   label: 'Ordens de Serviço', icon: FileText,  color: '#a855f7', endpoint: '/orders' },
    { key: 'inventory',label: 'Estoque',           icon: Package,   color: '#10b981', endpoint: '/inventory' },
    { key: 'finance',  label: 'Financeiro',        icon: DollarSign,color: '#f59e0b', endpoint: '/finance' },
];

const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    a.click(); URL.revokeObjectURL(url);
};

const downloadCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const rows = [keys.join(','), ...data.map(row => keys.map(k => {
        const v = String(row[k] ?? '').replace(/"/g, '""');
        return v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v}"` : v;
    }).join(','))];
    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    a.click(); URL.revokeObjectURL(url);
};

export const BackupSettings: React.FC = () => {
    const [loading, setLoading] = useState<string | null>(null);
    const [msg, setMsg] = useState<{ type: 'success'|'error'; text: string } | null>(null);

    const exportData = async (opt: typeof EXPORT_OPTIONS[0], format: 'json'|'csv') => {
        setLoading(opt.key);
        try {
            const res = await api.get(opt.endpoint);
            const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
            const date = new Date().toISOString().slice(0, 10);
            const filename = `${opt.key}_${date}.${format}`;
            if (format === 'json') downloadJSON(data, filename);
            else downloadCSV(data, filename);
            setMsg({ type: 'success', text: `${opt.label} exportado com sucesso (${data.length} registros)` });
        } catch {
            setMsg({ type: 'error', text: `Erro ao exportar ${opt.label}` });
        } finally {
            setLoading(null);
            setTimeout(() => setMsg(null), 4000);
        }
    };

    const exportAll = async () => {
        setLoading('all');
        try {
            const backup: Record<string, any> = { exportedAt: new Date().toISOString(), version: '1.0' };
            for (const opt of EXPORT_OPTIONS) {
                try {
                    const res = await api.get(opt.endpoint);
                    backup[opt.key] = Array.isArray(res.data) ? res.data : res.data?.data || [];
                } catch { backup[opt.key] = []; }
            }
            downloadJSON(backup, `backup_completo_${new Date().toISOString().slice(0, 10)}.json`);
            setMsg({ type: 'success', text: 'Backup completo exportado!' });
        } catch { setMsg({ type: 'error', text: 'Erro ao gerar backup' }); }
        finally { setLoading(null); setTimeout(() => setMsg(null), 4000); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Alerta */}
            <div style={{ padding: '12px 16px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <AlertCircle size={16} color="#60a5fa" style={{ marginTop: '1px', flexShrink: 0 }} />
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                    Os dados exportados contêm todas as informações do sistema no momento da exportação. Mantenha os arquivos em local seguro. Recomendamos fazer backup semanal.
                </div>
            </div>

            {/* Backup completo */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Database size={20} color="#a78bfa" />
                    </div>
                    <div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>Backup Completo</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Exporta todos os dados em um arquivo JSON</div>
                    </div>
                </div>
                <button onClick={exportAll} disabled={loading === 'all'} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 22px', borderRadius: '10px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer', minHeight: '44px' }}>
                    {loading === 'all' ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Gerando...</> : <><Download size={15} /> Exportar Backup Completo</>}
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </button>
            </div>

            {/* Exportação por módulo */}
            <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Exportar por módulo</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
                    {EXPORT_OPTIONS.map(opt => {
                        const Icon = opt.icon;
                        return (
                            <div key={opt.key} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: `${opt.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Icon size={18} color={opt.color} />
                                    </div>
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{opt.label}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => exportData(opt, 'csv')} disabled={loading === opt.key} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: `${opt.color}10`, border: `1px solid ${opt.color}30`, color: opt.color, fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', minHeight: '36px' }}>
                                        {loading === opt.key ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={12} />} CSV
                                    </button>
                                    <button onClick={() => exportData(opt, 'json')} disabled={loading === opt.key} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', minHeight: '36px' }}>
                                        <Download size={12} /> JSON
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {msg && <div style={{ padding: '10px 16px', borderRadius: '10px', background: msg.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: msg.type === 'error' ? '#ef4444' : '#22c55e', fontSize: '13px' }}>{msg.text}</div>}
        </div>
    );
};
