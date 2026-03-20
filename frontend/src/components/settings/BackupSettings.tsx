import React, { useState, useRef } from 'react';
import { Download, Upload, Database, FileText, Users, Package, DollarSign, RefreshCw, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import api from '../../services/api';

// ── Configuração dos módulos ────────────────────────────────────
const MODULES = [
    {
        key: 'clients',
        label: 'Clientes',
        icon: Users,
        color: '#3b82f6',
        exportEndpoint: '/clients/export/csv',
        importEndpoint: '/clients/import',
        template: [
            { name: 'nome', example: 'João Silva', required: true },
            { name: 'telefone', example: '47999999999', required: true },
            { name: 'email', example: 'joao@email.com', required: false },
            { name: 'cpf', example: '000.000.000-00', required: false },
            { name: 'endereco', example: 'Rua das Flores, 123', required: false },
            { name: 'cidade', example: 'Blumenau', required: false },
            { name: 'observacoes', example: 'Cliente VIP', required: false },
        ],
    },
    {
        key: 'inventory',
        label: 'Estoque',
        icon: Package,
        color: '#10b981',
        exportEndpoint: '/inventory',
        importEndpoint: '/inventory/import',
        template: [
            { name: 'nome', example: 'Tela iPhone 13', required: true },
            { name: 'sku', example: 'APL-TEL-001', required: false },
            { name: 'marca', example: 'Apple', required: false },
            { name: 'categoria', example: 'Tela', required: false },
            { name: 'precoCusto', example: '250.00', required: false },
            { name: 'precoVenda', example: '550.00', required: false },
            { name: 'quantidade', example: '5', required: false },
            { name: 'estoqueMinimo', example: '2', required: false },
        ],
    },
    {
        key: 'orders',
        label: 'Ordens de Serviço',
        icon: FileText,
        color: '#a855f7',
        exportEndpoint: '/orders',
        importEndpoint: null, // OS não tem import (muito complexo)
        template: [],
    },
    {
        key: 'finance',
        label: 'Financeiro',
        icon: DollarSign,
        color: '#f59e0b',
        exportEndpoint: '/finance',
        importEndpoint: '/finance/import',
        template: [
            { name: 'tipo', example: 'INCOME ou EXPENSE', required: true },
            { name: 'valor', example: '150.00', required: true },
            { name: 'descricao', example: 'Serviço de reparo', required: true },
            { name: 'categoria', example: 'Serviços', required: false },
            { name: 'data', example: '2026-03-17', required: false },
            { name: 'metodoPagamento', example: 'PIX', required: false },
        ],
    },
];

// ── Helpers ──────────────────────────────────────────────────────
const downloadBlob = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    a.click(); URL.revokeObjectURL(url);
};

const toCSV = (data: any[]): string => {
    if (!data.length) return '';
    const keys = Object.keys(data[0]);
    const rows = [
        keys.join(','),
        ...data.map(row => keys.map(k => {
            const v = String(row[k] ?? '').replace(/"/g, '""');
            return v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v}"` : v;
        }).join(','))
    ];
    return '\uFEFF' + rows.join('\n');
};

const generateTemplate = (mod: typeof MODULES[0]): string => {
    const headers = mod.template.map(f => f.name).join(',');
    const example = mod.template.map(f => f.example).join(',');
    return '\uFEFF' + headers + '\n' + example + '\n';
};

// ── Componente principal ─────────────────────────────────────────
export const BackupSettings: React.FC = () => {
    const [loading, setLoading] = useState<string | null>(null);
    const [importing, setImporting] = useState<string | null>(null);
    const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showTemplate, setShowTemplate] = useState<string | null>(null);
    const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

    const showMsg = (type: 'success' | 'error', text: string) => {
        setMsg({ type, text });
        setTimeout(() => setMsg(null), 5000);
    };

    // ── Exportar ────────────────────────────────────────────────
    const exportModule = async (mod: typeof MODULES[0], format: 'csv' | 'json') => {
        setLoading(mod.key);
        try {
            const res = await api.get(mod.exportEndpoint);
            const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
            const date = new Date().toISOString().slice(0, 10);
            if (format === 'json') {
                downloadBlob(JSON.stringify(data, null, 2), `${mod.key}_${date}.json`, 'application/json');
            } else {
                downloadBlob(toCSV(data), `${mod.key}_${date}.csv`, 'text/csv;charset=utf-8');
            }
            showMsg('success', `${mod.label} exportado — ${data.length} registros`);
        } catch {
            showMsg('error', `Erro ao exportar ${mod.label}`);
        } finally { setLoading(null); }
    };

    const exportAll = async () => {
        setLoading('all');
        try {
            const backup: Record<string, any> = { exportedAt: new Date().toISOString(), version: '1.0' };
            for (const mod of MODULES) {
                try {
                    const res = await api.get(mod.exportEndpoint);
                    backup[mod.key] = Array.isArray(res.data) ? res.data : res.data?.data || [];
                } catch { backup[mod.key] = []; }
            }
            downloadBlob(JSON.stringify(backup, null, 2), `backup_completo_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
            showMsg('success', 'Backup completo exportado!');
        } catch { showMsg('error', 'Erro ao gerar backup'); }
        finally { setLoading(null); }
    };

    // ── Baixar template ─────────────────────────────────────────
    const downloadTemplate = (mod: typeof MODULES[0]) => {
        if (!mod.template.length) return;
        downloadBlob(generateTemplate(mod), `template_${mod.key}.csv`, 'text/csv;charset=utf-8');
        showMsg('success', `Template de ${mod.label} baixado! Preencha e importe.`);
    };

    // ── Importar ────────────────────────────────────────────────
    const handleImport = async (mod: typeof MODULES[0], file: File) => {
        if (!mod.importEndpoint) return;
        setImporting(mod.key);
        try {
            const text = await file.text();
            const lines = text.split('\n').filter(l => l.trim());
            if (lines.length < 2) { showMsg('error', 'Arquivo vazio ou inválido'); return; }

            const headers = lines[0].replace(/^\uFEFF/, '').split(',').map(h => h.trim().replace(/"/g, ''));
            const rows = lines.slice(1).map(line => {
                const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                return Object.fromEntries(headers.map((h, i) => [h, vals[i] || '']));
            }).filter(row => Object.values(row).some(v => v));

            if (!rows.length) { showMsg('error', 'Nenhum dado encontrado no arquivo'); return; }

            // Enviar para o backend
            const res = await api.post(mod.importEndpoint, { data: rows });
            const imported = res.data?.imported || rows.length;
            const errors = res.data?.errors || 0;
            showMsg('success', `${mod.label}: ${imported} importados${errors > 0 ? `, ${errors} com erro` : ''}`);
        } catch (e: any) {
            const msg = e?.response?.data?.message || 'Erro ao importar arquivo';
            showMsg('error', Array.isArray(msg) ? msg.join(', ') : msg);
        } finally {
            setImporting(null);
            if (fileInputs.current[mod.key]) fileInputs.current[mod.key]!.value = '';
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

            {/* Aviso */}
            <div style={{ padding: '12px 16px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '10px', display: 'flex', gap: '10px' }}>
                <AlertCircle size={16} color="#60a5fa" style={{ marginTop: '1px', flexShrink: 0 }} />
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                    Para importar, baixe o template CSV, preencha com seus dados e faça o upload. Recomendamos fazer backup antes de importar.
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
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Exporta todos os dados em JSON</div>
                    </div>
                </div>
                <button onClick={exportAll} disabled={loading === 'all'} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 22px', borderRadius: '10px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer', minHeight: '44px' }}>
                    {loading === 'all' ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Gerando...</> : <><Download size={15} /> Exportar Backup Completo</>}
                </button>
            </div>

            {/* Módulos */}
            <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                    Exportar / Importar por módulo
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                    {MODULES.map(mod => {
                        const Icon = mod.icon;
                        const canImport = !!mod.importEndpoint && mod.template.length > 0;
                        return (
                            <div key={mod.key} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                                {/* Header */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: `${mod.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Icon size={18} color={mod.color} />
                                        </div>
                                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{mod.label}</span>
                                    </div>
                                    {canImport && (
                                        <button onClick={() => setShowTemplate(showTemplate === mod.key ? null : mod.key)}
                                            title="Ver campos do template"
                                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '4px' }}>
                                            <HelpCircle size={15} />
                                        </button>
                                    )}
                                </div>

                                {/* Template info */}
                                {showTemplate === mod.key && (
                                    <div style={{ marginBottom: '10px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '12px' }}>
                                        <div style={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>Campos do CSV:</div>
                                        {mod.template.map(f => (
                                            <div key={f.name} style={{ display: 'flex', gap: '6px', marginBottom: '3px' }}>
                                                <span style={{ color: f.required ? '#60a5fa' : 'rgba(255,255,255,0.4)', fontWeight: f.required ? 700 : 400, minWidth: '120px' }}>
                                                    {f.name}{f.required ? ' *' : ''}
                                                </span>
                                                <span style={{ color: 'rgba(255,255,255,0.3)' }}>{f.example}</span>
                                            </div>
                                        ))}
                                        <div style={{ marginTop: '6px', color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>* campo obrigatório</div>
                                    </div>
                                )}

                                {/* Botões exportar */}
                                <div style={{ display: 'flex', gap: '6px', marginBottom: canImport ? '8px' : '0' }}>
                                    <button onClick={() => exportModule(mod, 'csv')} disabled={loading === mod.key}
                                        style={{ flex: 1, padding: '8px', borderRadius: '8px', background: `${mod.color}10`, border: `1px solid ${mod.color}30`, color: mod.color, fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', minHeight: '36px' }}>
                                        {loading === mod.key ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={12} />} CSV
                                    </button>
                                    <button onClick={() => exportModule(mod, 'json')} disabled={loading === mod.key}
                                        style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', minHeight: '36px' }}>
                                        <Download size={12} /> JSON
                                    </button>
                                </div>

                                {/* Importar — apenas módulos com suporte */}
                                {canImport && (
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', display: 'flex', gap: '6px' }}>
                                        {/* Baixar template */}
                                        <button onClick={() => downloadTemplate(mod)}
                                            style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', minHeight: '36px' }}>
                                            <Download size={12} /> Template
                                        </button>
                                        {/* Upload CSV */}
                                        <button onClick={() => fileInputs.current[mod.key]?.click()}
                                            disabled={importing === mod.key}
                                            style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', minHeight: '36px' }}>
                                            {importing === mod.key ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={12} />}
                                            {importing === mod.key ? 'Importando...' : 'Importar CSV'}
                                        </button>
                                        <input
                                            ref={el => { if (el) fileInputs.current[mod.key] = el; }}
                                            type="file" accept=".csv" style={{ display: 'none' }}
                                            onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(mod, f); }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Mensagem feedback */}
            {msg && (
                <div style={{ padding: '12px 16px', borderRadius: '10px', background: msg.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: msg.type === 'error' ? '#ef4444' : '#22c55e', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {msg.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                    {msg.text}
                </div>
            )}
        </div>
    );
};
