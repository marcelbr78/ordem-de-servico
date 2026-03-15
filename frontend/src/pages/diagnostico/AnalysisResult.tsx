import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const AnalysisResult: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // We expect the state to be passed from the navigate action
    const result = location.state?.result as {
        analysisId: number;
        result: string;
        failingRail: string | null;
        lastValidRail: string | null;
    };

    if (!result) {
        return (
            <div style={{ color: 'white', padding: '20px' }}>
                <h2>Resultado não encontrado</h2>
                <button onClick={() => navigate('/diagnostico')}>Voltar</button>
            </div>
        );
    }

    return (
        <div style={{ color: 'white', padding: '20px' }}>
            <h2>Resultado do Diagnóstico</h2>

            <div style={{
                background: result.failingRail ? '#400a0a' : '#0a401a',
                padding: '20px',
                borderRadius: '8px',
                marginTop: '20px'
            }}>
                <h3 style={{ margin: '0 0 10px 0', color: result.failingRail ? '#ff4d4d' : '#4dff4d' }}>
                    {result.failingRail ? 'Falha Detectada' : 'Sequência Completa'}
                </h3>
                <p style={{ fontSize: '18px', lineHeight: '1.5' }}>
                    {result.result}
                </p>

                {result.failingRail && (
                    <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '5px' }}>
                        <p style={{ margin: '0 0 5px 0' }}><strong>Último rail válido:</strong> {result.lastValidRail || 'Nenhum'}</p>
                        <p style={{ margin: 0, color: '#ff4d4d' }}><strong>Rail ausente/falho:</strong> {result.failingRail}</p>
                    </div>
                )}
            </div>

            <button
                onClick={() => navigate('/diagnostico')}
                style={{
                    background: '#333',
                    color: 'white',
                    border: '1px solid #555',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    marginTop: '20px'
                }}
            >
                Voltar para o Início
            </button>
        </div>
    );
};
