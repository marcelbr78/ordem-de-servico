import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { powerSequenceService } from '../../services/powerSequenceService';
import type { DiagnosticBoard } from '../../services/powerSequenceService';

export const DiagnosticoIndex: React.FC = () => {
    const [boards, setBoards] = useState<DiagnosticBoard[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadBoards();
    }, []);

    const loadBoards = async () => {
        try {
            const data = await powerSequenceService.getBoards();
            setBoards(data);
        } catch (error) {
            console.error('Failed to load boards', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ color: 'white' }}>Carregando placas...</div>;

    return (
        <div style={{ color: 'white', padding: '20px' }}>
            <h2>Power Sequence Diagnostics</h2>
            <p>Selecione uma placa para iniciar o diagnóstico.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                {boards.map(board => (
                    <div
                        key={board.id}
                        style={{
                            border: '1px solid #333',
                            padding: '15px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            background: '#1a1a1a'
                        }}
                        onClick={() => navigate(`/diagnostico/board/${board.id}`)}
                    >
                        <h3>{board.model} ({board.manufacturer})</h3>
                        {board.description && <p style={{ color: '#aaa' }}>{board.description}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
};
