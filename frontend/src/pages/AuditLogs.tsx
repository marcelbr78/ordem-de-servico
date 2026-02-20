import React, { useState, useEffect } from 'react';
import { Shield, Clock, User, Search, Activity } from 'lucide-react';
import api from '../services/api';

export const AuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/audit');
            setLogs(res.data);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: string) => new Date(date).toLocaleString('pt-BR');

    const filteredLogs = logs.filter(log =>
        log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getActionColor = (action: string) => {
        if (action.includes('CREATE')) return 'text-green-400';
        if (action.includes('UPDATE')) return 'text-blue-400';
        if (action.includes('DELETE')) return 'text-red-400';
        return 'text-gray-400';
    };

    return (
        <div className="animate-fade">
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Shield size={28} className="text-purple-500" />
                Auditoria do Sistema
            </h1>

            <div className="glass-panel" style={{ padding: '24px' }}>
                {/* Search */}
                <div style={{ marginBottom: '24px', position: 'relative' }}>
                    <Search size={20} style={{ position: 'absolute', left: '12px', top: '12px', color: 'rgba(255,255,255,0.4)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por usuário, ação ou recurso..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', padding: '12px 12px 12px 42px', borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                            color: '#fff', outline: 'none'
                        }}
                    />
                </div>

                {/* List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {loading ? (
                        <p className="text-gray-500 text-center py-8">Carregando logs...</p>
                    ) : filteredLogs.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Nenhum registro encontrado.</p>
                    ) : (
                        filteredLogs.map((log) => (
                            <div key={log.id} style={{
                                display: 'flex', alignItems: 'start', gap: '16px',
                                padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'rgba(255,255,255,0.6)'
                                }}>
                                    <Activity size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span className={`font-bold ${getActionColor(log.action)}`}>{log.action}</span>
                                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>em</span>
                                            <span style={{ color: '#fff', fontWeight: 500 }}>{log.resource}</span>
                                        </div>
                                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={12} /> {formatDate(log.createdAt)}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                                        {JSON.stringify(log.details || {}).slice(0, 100)}
                                        {JSON.stringify(log.details || {}).length > 100 && '...'}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                                        <User size={12} />
                                        <span>{log.user?.email || 'Sistema'}</span>
                                        {log.ip && <span>({log.ip})</span>}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
