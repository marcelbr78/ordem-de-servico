import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

// Fixed keys from backend enum
const STATUS_KEYS = [
    'aberta',
    'em_diagnostico',
    'aguardando_aprovacao',
    'aguardando_peca',
    'em_reparo',
    'testes',
    'finalizada',
    'entregue',
    'cancelada'
];

const DEFAULT_LABELS: Record<string, string> = {
    'aberta': 'Aberta',
    'em_diagnostico': 'Em Diagnóstico',
    'aguardando_aprovacao': 'Aguardando Aprovação',
    'aguardando_peca': 'Aguardando Peça',
    'em_reparo': 'Em Reparo',
    'testes': 'Testes',
    'finalizada': 'Finalizada',
    'entregue': 'Entregue',
    'cancelada': 'Cancelada',
};

// Default flow for reset
const DEFAULT_FLOW: Record<string, string[]> = {
    'aberta': ['em_diagnostico', 'cancelada'],
    'em_diagnostico': ['aguardando_aprovacao', 'aguardando_peca', 'cancelada'],
    'aguardando_aprovacao': ['aguardando_peca', 'em_reparo', 'cancelada'],
    'aguardando_peca': ['em_reparo', 'aguardando_aprovacao'],
    'em_reparo': ['testes', 'aguardando_peca'],
    'testes': ['finalizada', 'em_reparo'],
    'finalizada': ['entregue', 'em_reparo'],
    'entregue': [],
    'cancelada': []
};

interface OSSettingsProps {
    initialJson?: string;
    onSave: (json: string) => Promise<void>;
}

export const OSSettings: React.FC<OSSettingsProps> = ({ initialJson, onSave }) => {
    const [labels, setLabels] = useState<Record<string, string>>(DEFAULT_LABELS);
    const [flow, setFlow] = useState<Record<string, string[]>>(DEFAULT_FLOW);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (initialJson) {
            try {
                const parsed = JSON.parse(initialJson);
                if (parsed.labels) setLabels({ ...DEFAULT_LABELS, ...parsed.labels });
                if (parsed.flow) setFlow({ ...DEFAULT_FLOW, ...parsed.flow });
            } catch (e) {
                console.error("Failed to parse OS settings", e);
            }
        }
    }, [initialJson]);

    const handleLabelChange = (key: string, value: string) => {
        setLabels(prev => ({ ...prev, [key]: value }));
    };

    const toggleFlow = (from: string, to: string) => {
        setFlow(prev => {
            const current = prev[from] || [];
            const exists = current.includes(to);
            let next;
            if (exists) {
                next = current.filter(s => s !== to);
            } else {
                next = [...current, to];
            }
            return { ...prev, [from]: next };
        });
    };

    const handleSaveLocal = async () => {
        try {
            setLoading(true);
            const json = JSON.stringify({ labels, flow });
            await onSave(json);
            setMessage({ type: 'success', text: 'Configurações de OS salvas com sucesso!' });
            setTimeout(() => setMessage(null), 3000);
        } catch {
            setMessage({ type: 'error', text: 'Erro ao salvar configurações.' });
        } finally {
            setLoading(false);
        }
    };

    const glassBg = {
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
    };

    return (
        <div style={{ ...glassBg, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0 }}>Fluxo e Nomes dos Status</h3>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>
                        Personalize os nomes e as transições permitidas para cada etapa.
                    </p>
                </div>
                <button
                    onClick={handleSaveLocal}
                    disabled={loading}
                    style={{
                        padding: '10px 20px', borderRadius: '10px', border: 'none',
                        background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
                        color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    <Save size={16} /> {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
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

            <div style={{ display: 'grid', gap: '24px' }}>
                {STATUS_KEYS.map(key => (
                    <div key={key} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-start' }}>
                            {/* Label Configuration */}
                            <div style={{ flex: '0 0 250px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Nome Interno: <span style={{ fontFamily: 'monospace', color: '#fff' }}>{key}</span>
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>Rótulo de Exibição</label>
                                    <input
                                        type="text"
                                        value={labels[key] || DEFAULT_LABELS[key]}
                                        onChange={(e) => handleLabelChange(key, e.target.value)}
                                        style={{
                                            width: '100%', padding: '10px 12px', borderRadius: '8px',
                                            border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                                            color: '#fff', fontSize: '14px', outline: 'none'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Flow Configuration */}
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '10px' }}>
                                    Próximos status permitidos (para onde pode ir):
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {STATUS_KEYS.filter(k => k !== key).map(targetKey => {
                                        const isChecked = (flow[key] || []).includes(targetKey);
                                        return (
                                            <label
                                                key={targetKey}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '8px',
                                                    padding: '8px 12px', borderRadius: '8px',
                                                    background: isChecked ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                                                    border: isChecked ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.05)',
                                                    cursor: 'pointer', transition: 'all 0.2s'
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => toggleFlow(key, targetKey)}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                <span style={{ fontSize: '13px', color: isChecked ? '#60a5fa' : 'rgba(255,255,255,0.6)' }}>
                                                    {labels[targetKey] || DEFAULT_LABELS[targetKey]}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
