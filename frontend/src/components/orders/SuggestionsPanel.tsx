import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, DollarSign, TrendingUp, AlertCircle, Wrench } from 'lucide-react';
import { smartModulesService } from '../../services/smartModules';
import type { SmartDiagnosticSuggestion, SmartPricingSuggestion, SmartPartSuggestion } from '../../services/smartModules';

interface SuggestionsPanelProps {
    model: string;
    symptom: string;
}

export const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({ model, symptom }) => {
    const [diagnostics, setDiagnostics] = useState<SmartDiagnosticSuggestion[]>([]);
    const [pricing, setPricing] = useState<SmartPricingSuggestion | null>(null);
    const [parts, setParts] = useState<SmartPartSuggestion[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Trigger rules: model > 2 and symptom > 3
        if (!model || model.length <= 2 || !symptom || symptom.length <= 3) {
            setDiagnostics([]);
            setPricing(null);
            setParts([]);
            return;
        }

        setLoading(true);

        const fetchSuggestions = async () => {
            try {
                // Fetch diag and pricing parallelly first because parts needs diagnosis
                const [diagRes, pricingRes] = await Promise.all([
                    smartModulesService.getDiagnostics(model, symptom),
                    smartModulesService.getPricing(model, symptom)
                ]);

                let partsRes: SmartPartSuggestion[] = [];
                // Automatically fetch parts based on the most probable diagnosis (the top result)
                if (diagRes && diagRes.length > 0) {
                    partsRes = await smartModulesService.getParts(model, symptom, diagRes[0].diagnosis);
                }

                setDiagnostics(diagRes);
                setPricing(pricingRes);
                setParts(partsRes);
            } catch (error) {
                console.error("Erro ao carregar sugestões inteligentes", error);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(fetchSuggestions, 500);
        return () => clearTimeout(debounceTimer);

    }, [model, symptom]);

    if (!model || model.length <= 2 || !symptom || symptom.length <= 3) return null;
    if (!loading && diagnostics.length === 0 && !pricing && parts.length === 0) return null; // No suggestions found

    return (
        <div style={{
            background: 'linear-gradient(145deg, rgba(99, 102, 241, 0.05), rgba(124, 58, 237, 0.05))',
            border: '1px solid rgba(99, 102, 241, 0.15)',
            borderRadius: '12px',
            padding: '16px',
            marginTop: '16px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#818cf8', fontWeight: 600, fontSize: '13px' }}>
                <Sparkles size={16} />
                <span>SUGESTÕES INTELIGENTES DA IA</span>
            </div>

            {loading ? (
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#818cf8', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    Analisando histórico de OS para {model}...
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>

                    {/* Diagnósticos Prováveis */}
                    {diagnostics.length > 0 && (
                        <div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <AlertCircle size={12} /> Diagnósticos Prováveis
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {diagnostics.map((diag, index) => (
                                    <div key={diag.id || index} style={{
                                        background: index === 0 ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.03)',
                                        border: index === 0 ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '6px', padding: '8px 12px', fontSize: '13px', color: index === 0 ? '#fff' : 'rgba(255,255,255,0.8)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: index === 0 ? 600 : 400 }}>{diag.diagnosis}</span>
                                            {index === 0 && <span style={{ fontSize: '10px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '2px 6px', borderRadius: '4px' }}>Mais Comum</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Peças Sugeridas (Smart Parts) */}
                    {parts.length > 0 && (
                        <div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Wrench size={12} /> Peças Comuns
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {parts.map((part, index) => (
                                    <div key={part.id || index} style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '6px', padding: '8px 12px', fontSize: '13px', color: 'rgba(255,255,255,0.9)',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <span>{part.part_name}</span>
                                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                                            {part.frequency}x
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Preços e Tempos */}
                    {pricing && (
                        <div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <TrendingUp size={12} /> Estimativas Históricas
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

                                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', padding: '6px', borderRadius: '6px' }}><DollarSign size={14} /></div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Preço Médio</div>
                                        <div style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>R$ {pricing.avg_price.toFixed(2).replace('.', ',')}</div>
                                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>Faixa: R$ {pricing.min_price.toFixed(2)} - R$ {pricing.max_price.toFixed(2)}</div>
                                    </div>
                                </div>

                                {pricing.avg_repair_time > 0 && (
                                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', padding: '6px', borderRadius: '6px' }}><Clock size={14} /></div>
                                        <div>
                                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Tempo Médio de Reparo</div>
                                            <div style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>
                                                {pricing.avg_repair_time < 60 ? `${pricing.avg_repair_time} minutos` : `${Math.floor(pricing.avg_repair_time / 60)}h ${pricing.avg_repair_time % 60}m`}
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
};
