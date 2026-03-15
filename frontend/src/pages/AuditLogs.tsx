import React, { useState, useEffect } from 'react';
import { Shield, Clock, User, Search, Activity, RefreshCw, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import api from '../services/api';

const ACTION_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
    CREATE: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: Plus },
    UPDATE: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: Edit },
    DELETE: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: Trash2 },
    LOGIN:  { color: '#a855f7', bg: 'rgba(168,85,247,0.12)', icon: User },
};
const getActionCfg = (action: string) => {
    const key = Object.keys(ACTION_CONFIG).find(k => action?.toUpperCase().includes(k));
    return key ? ACTION_CONFIG[key] : { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', icon: Activity };
};

const fmtDate = (d: string) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

export const AuditLogs: React.FC<{ isGlobal?: boolean }> = ({ isGlobal }) => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try { const res = await api.get(isGlobal ? '/audit/global' : '/audit'); setLogs(res.data); }
        catch { } finally { setLoading(false); }
    };
    useEffect(() => { fetchLogs(); }, []);

    const filtered = logs.filter(log =>
        !search ||
        log.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        log.action?.toLowerCase().includes(search.toLowerCase()) ||
        log.resource?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Shield size={18} color="#a855f7" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>{isGlobal ? 'Auditoria Global' : 'Auditoria'}</h1>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>{filtered.length} registros</p>
                    </div>
                </div>
                <button onClick={fetchLogs} style={{ padding: '9px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Busca */}
            <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                <input placeholder="Buscar usuário, ação ou recurso..." value={search} onChange={e => setSearch(e.target.value)}
                    style={{ width: '100%', padding: '11px 12px 11px 38px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '16px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {/* Lista */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Carregando...
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.35)' }}>
                        <AlertCircle size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
                        <p style={{ margin: 0 }}>Nenhum registro encontrado</p>
                    </div>
                ) : filtered.map(log => {
                    const cfg = getActionCfg(log.action);
                    const Icon = cfg.icon;
                    return (
                        <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', transition: 'border-color 0.15s' }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-color)')}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon size={16} color={cfg.color} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: 700, fontSize: '13px', color: cfg.color }}>{log.action}</span>
                                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>em</span>
                                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>{log.resource}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                        <Clock size={11} /> {fmtDate(log.createdAt)}
                                    </div>
                                </div>
                                {log.details && (
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: '0 0 6px', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {JSON.stringify(log.details).slice(0, 120)}{JSON.stringify(log.details).length > 120 && '…'}
                                    </p>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                                    <User size={11} />
                                    <span>{log.user?.name || log.user?.email || 'Sistema'}</span>
                                    {log.ip && <><span>·</span><span>{log.ip}</span></>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
