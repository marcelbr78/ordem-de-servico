import React, { useState } from 'react';
import { Loader2, Lock, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onSuccess: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onSuccess }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { user, signOut } = useAuth();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 8) {
            setError('A nova senha deve ter pelo menos 8 caracteres.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('As senhas não conferem.');
            return;
        }

        if (newPassword === 'admin1234') {
            setError('A nova senha não pode ser igual à padrão.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/change-password', {
                userId: user?.id,
                newPassword
            });
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erro ao alterar senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '30px' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{
                        background: '#F59E0B',
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 15px'
                    }}>
                        <Lock color="white" size={24} />
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Segurança Obrigatória</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Para sua segurança, você deve alterar a senha padrão no primeiro acesso.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nova Senha (mín. 8 caracteres)</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="form-input"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Confirmar Nova Senha</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="form-input"
                            required
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '10px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            color: '#EF4444',
                            fontSize: '13px',
                            marginBottom: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            type="button"
                            onClick={signOut}
                            style={{
                                flex: 1,
                                padding: '12px',
                                background: 'transparent',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-primary)',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            Sair
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                            style={{ flex: 1 }}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Alterar Senha'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
