import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { powerSequenceService } from '../../services/powerSequenceService';
import type { PowerSequenceStep } from '../../services/powerSequenceService';

export const NewAnalysis: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [steps, setSteps] = useState<PowerSequenceStep[]>([]);
    const [selectedRails, setSelectedRails] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (id) loadSequence(parseInt(id));
    }, [id]);

    const loadSequence = async (boardId: number) => {
        try {
            const data = await powerSequenceService.getBoardSequence(boardId);
            setSteps(data.steps || []);
        } catch (error) {
            console.error('Failed to load board sequence', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleRail = (railName: string) => {
        setSelectedRails(prev =>
            prev.includes(railName)
                ? prev.filter(r => r !== railName)
                : [...prev, railName]
        );
    };

    const handleAnalyze = async () => {
        if (!id) return;
        setAnalyzing(true);
        try {
            const result = await powerSequenceService.analyze(parseInt(id), selectedRails);
            navigate(`/diagnostico/result/${result.analysisId}`, { state: { result } });
        } catch (error) {
            console.error('Failed to analyze', error);
            alert('Erro ao realizar diagnóstico.');
        } finally {
            setAnalyzing(false);
        }
    };

    if (loading) return <div style={{ color: 'white' }}>Carregando rails...</div>;

    return (
        <div style={{ color: 'white', padding: '20px' }}>
            <h2>Novo Diagnóstico</h2>
            <p>Marque os rails que estão presentes e com a voltagem correta na placa.</p>

            <div style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {steps.map(step => (
                    <label key={step.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: selectedRails.includes(step.railName) ? '#004010' : '#222',
                        padding: '10px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                    }}>
                        <input
                            type="checkbox"
                            checked={selectedRails.includes(step.railName)}
                            onChange={() => handleToggleRail(step.railName)}
                            style={{ width: '20px', height: '20px' }}
                        />
                        <span><strong>{step.stepOrder}.</strong> {step.railName}</span>
                    </label>
                ))}
            </div>

            <button
                onClick={handleAnalyze}
                disabled={analyzing}
                style={{
                    background: analyzing ? '#555' : '#0a84ff',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '5px',
                    cursor: analyzing ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    width: '100%'
                }}
            >
                {analyzing ? 'Analisando...' : 'Executar Diagnóstico'}
            </button>
        </div>
    );
};
