import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { powerSequenceService } from '../../services/powerSequenceService';
import type { PowerSequenceStep } from '../../services/powerSequenceService';

export const BoardSequence: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [steps, setSteps] = useState<PowerSequenceStep[]>([]);
    const [loading, setLoading] = useState(true);
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

    if (loading) return <div style={{ color: 'white' }}>Carregando sequência...</div>;

    return (
        <div style={{ color: 'white', padding: '20px' }}>
            <h2>Visualização de Power Sequence</h2>
            <p>Esta é a sequência correta de inicialização da placa.</p>

            <button
                onClick={() => navigate(`/diagnostico/board/${id}/new-analysis`)}
                style={{
                    background: '#0a84ff',
                    color: 'white',
                    border: 'none',
                    padding: '10px 15px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginBottom: '20px'
                }}
            >
                Iniciar Novo Diagnóstico
            </button>

            <ul style={{ listStyleType: 'none', padding: 0 }}>
                {steps.map(step => (
                    <li key={step.id} style={{
                        background: '#222',
                        margin: '5px 0',
                        padding: '10px',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'space-between'
                    }}>
                        <span><strong>{step.stepOrder}.</strong> {step.railName}</span>
                        {step.expectedVoltage && <span style={{ color: '#0a84ff' }}>{step.expectedVoltage}</span>}
                    </li>
                ))}
            </ul>
        </div>
    );
};
