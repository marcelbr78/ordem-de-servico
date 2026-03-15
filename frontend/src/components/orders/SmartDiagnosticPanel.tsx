import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
    Brain, Clock, Wrench, ExternalLink, ChevronDown, ChevronUp,
    Zap, TrendingUp, Package, BookOpen, AlertCircle, Loader2,
} from 'lucide-react';

interface DiagSuggestion { id: string; diagnosis: string; frequency: number; avg_price: number; avg_repair_time: number; }
interface PriceSuggestion { diagnosis: string; avg_price: number; min_price: number; max_price: number; avg_repair_time: number; repair_count: number; }
interface ExternalLink { source: string; sourceUrl: string; title: string; snippet: string; url?: string; confidence: string; }
interface Estimate { estimatedTime: string; difficulty: string; commonParts: string[]; tips: string[]; externalLinks: ExternalLink[]; }

const fmtCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const fmtTime = (m: number) => m >= 60 ? `${Math.floor(m / 60)}h${m % 60 > 0 ? `${m % 60}min` : ''}` : `${m}min`;
const DIFF_COLOR: Record<string, string> = { baixa: '#22c55e', média: '#f59e0b', alta: '#ef4444' };

interface Props {
    model: string;
    symptom: string;
    diagnosis: string;
    onApplySuggestion?: (text: string) => void;
    onApplyPrice?: (price: number) => void;
}

export const SmartDiagnosticPanel: React.FC<Props> = ({ model, symptom, diagnosis, onApplySuggestion, onApplyPrice }) => {
    const [suggestions, setSuggestions] = useState<DiagSuggestion[]>([]);
    const [pricing, setPricing] = useState<PriceSuggestion | null>(null);
    const [estimate, setEstimate] = useState<Estimate | null>(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const [activeSection, setActiveSection] = useState<'all' | 'external'>('all');

    const load = useCallback(async () => {
        if (!model || !symptom) return;
        setLoading(true);
        try {
            const [diagRes, priceRes, estRes] = await Promise.allSettled([
                api.get('/smart-diagnostics/suggestions', { params: { model, symptom } }),
                api.get('/smart-pricing/suggestion', { params: { model, symptom } }),
                api.get('/smart-diagnostics/estimate', { params: { model, symptom, diagnosis } }),
            ]);
            if (diagRes.status === 'fulfilled') setSuggestions(diagRes.value.data || []);
            if (priceRes.status === 'fulfilled') setPricing(priceRes.value.data);
            if (estRes.status === 'fulfilled') setEstimate(estRes.value.data);
        } finally { setLoading(false); }
    }, [model, symptom, diagnosis]);

    useEffect(() => { if (model && symptom) load(); }, [model, symptom]);

    if (!model || !symptom) return null;

    return (
        <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '14px', overflow: 'hidden', marginBottom: '16px' }}>

            {/* Header */}
            <button onClick={() => setExpanded(e => !e)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Brain size={15} color="#60a5fa" />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#60a5fa' }}>Assistente de Diagnóstico</span>
                    {loading && <Loader2 size={13} color="#60a5fa" style={{ animation: 'spin 1s linear infinite' }} />}
                </div>
                {expanded ? <ChevronUp size={16} color="rgba(255,255,255,0.4)" /> : <ChevronDown size={16} color="rgba(255,255,255,0.4)" />}
            </button>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

            {expanded && (
                <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                    {/* Estimativa rápida */}
                    {estimate && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '20px', background: 'rgba(255,255,255,0.06)', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                                <Clock size={12} color="#94a3b8" /> {estimate.estimatedTime}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '20px', background: `${DIFF_COLOR[estimate.difficulty] || '#94a3b8'}15`, fontSize: '12px', color: DIFF_COLOR[estimate.difficulty] || '#94a3b8', border: `1px solid ${DIFF_COLOR[estimate.difficulty] || '#94a3b8'}30` }}>
                                <Zap size={12} /> Dificuldade: {estimate.difficulty}
                            </div>
                            {pricing && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '20px', background: 'rgba(34,197,94,0.1)', fontSize: '12px', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                                    <TrendingUp size={12} /> {pricing.repair_count}x reparado • média {fmtCurrency(pricing.avg_price)}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Sugestões de diagnóstico do histórico */}
                    {suggestions.length > 0 && (
                        <div>
                            <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>
                                Diagnósticos do histórico ({suggestions.length})
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {suggestions.map(s => (
                                    <button key={s.id} onClick={() => onApplySuggestion?.(s.diagnosis)} style={{
                                        display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px',
                                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                                        borderRadius: '10px', cursor: 'pointer', textAlign: 'left', width: '100%',
                                        transition: 'all 0.15s',
                                    }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.1)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}>
                                        <Wrench size={13} color="#60a5fa" style={{ flexShrink: 0, marginTop: '2px' }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '13px', color: '#fff', lineHeight: 1.4 }}>{s.diagnosis}</div>
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{s.frequency}× reparado</span>
                                                {s.avg_price > 0 && <span style={{ fontSize: '11px', color: '#22c55e' }}>{fmtCurrency(s.avg_price)} médio</span>}
                                                {s.avg_repair_time > 0 && <span style={{ fontSize: '11px', color: '#94a3b8' }}>{fmtTime(s.avg_repair_time)}</span>}
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '11px', color: '#60a5fa', whiteSpace: 'nowrap', flexShrink: 0, paddingTop: '2px' }}>aplicar ↗</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Precificação inteligente */}
                    {pricing && (
                        <div style={{ padding: '12px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '10px' }}>
                            <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(34,197,94,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>
                                <TrendingUp size={11} style={{ display: 'inline', marginRight: '4px' }} />
                                Precificação inteligente
                            </p>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                {[
                                    { l: 'Mínimo', v: pricing.min_price, c: '#22c55e' },
                                    { l: 'Média', v: pricing.avg_price, c: '#fff' },
                                    { l: 'Máximo', v: pricing.max_price, c: '#f59e0b' },
                                ].map(({ l, v, c }) => (
                                    <div key={l}>
                                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>{l}</div>
                                        <div style={{ fontSize: '16px', fontWeight: 700, color: c }}>{fmtCurrency(v)}</div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => onApplyPrice?.(pricing.avg_price)} style={{ padding: '7px 14px', borderRadius: '8px', background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                Aplicar valor médio ({fmtCurrency(pricing.avg_price)})
                            </button>
                        </div>
                    )}

                    {/* Peças comuns */}
                    {estimate?.commonParts && estimate.commonParts.length > 0 && (
                        <div>
                            <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>
                                <Package size={11} style={{ display: 'inline', marginRight: '4px' }} />
                                Peças frequentes
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {estimate.commonParts.map(p => (
                                    <span key={p} style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', fontSize: '12px', color: '#c084fc' }}>{p}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Dicas */}
                    {estimate?.tips && estimate.tips.length > 0 && (
                        <div style={{ padding: '12px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '10px' }}>
                            <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(245,158,11,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>
                                <BookOpen size={11} style={{ display: 'inline', marginRight: '4px' }} />
                                Dicas técnicas
                            </p>
                            {estimate.tips.map((t, i) => (
                                <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', marginBottom: i < estimate.tips.length - 1 ? '6px' : 0 }}>
                                    <span style={{ fontSize: '12px', color: '#f59e0b', flexShrink: 0, marginTop: '1px' }}>•</span>
                                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{t}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Links externos */}
                    {estimate?.externalLinks && estimate.externalLinks.length > 0 && (
                        <div>
                            <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>
                                <ExternalLink size={11} style={{ display: 'inline', marginRight: '4px' }} />
                                Referências externas
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {estimate.externalLinks.map((l, i) => (
                                    <a key={i} href={l.url || l.sourceUrl} target="_blank" rel="noopener noreferrer" style={{
                                        display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px',
                                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                        borderRadius: '10px', textDecoration: 'none', transition: 'all 0.15s',
                                    }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}>
                                        <ExternalLink size={13} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '13px', color: '#60a5fa', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{l.source} • {l.snippet.slice(0, 80)}{l.snippet.length > 80 ? '...' : ''}</div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {suggestions.length === 0 && !pricing && !estimate && !loading && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                            <AlertCircle size={14} />
                            Nenhum histórico encontrado para {model} + "{symptom}". Os dados serão acumulados conforme OS forem finalizadas.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
