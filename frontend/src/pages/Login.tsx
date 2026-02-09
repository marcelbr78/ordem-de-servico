import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Cpu, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const { signIn, signed } = useAuth();
    const navigate = useNavigate();

    // Redireciona se já estiver logado
    React.useEffect(() => {
        if (signed) {
            navigate('/');
        }
    }, [signed, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Loga automaticamente com o usuário admin padrão
            await signIn({ email: 'admin', password: 'admin' });
            navigate('/');
        } catch (err: any) {
            console.error('Login error:', err);
            const message = err.response?.data?.message || err.message || 'Erro desconhecido';
            alert(`Erro ao entrar no sistema: ${message}\nVerifique se o backend está rodando.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div className="glass-panel animate-fade" style={{
                width: '100%',
                maxWidth: '400px',
                padding: '40px',
                textAlign: 'center'
            }}>
                <div style={{
                    background: 'var(--accent-primary)',
                    width: '60px',
                    height: '60px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)'
                }}>
                    <Cpu color="white" size={32} />
                </div>

                <h1 style={{ fontSize: '28px', marginBottom: '8px', fontWeight: '800' }}>TechManager</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Gerenciamento de Assistência Técnica</p>

                <form onSubmit={handleSubmit}>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '18px',
                            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '16px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                            border: 'none',
                            transition: 'transform 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={24} />
                        ) : (
                            <>
                                Entrar no Sistema
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                <p style={{ marginTop: '24px', fontSize: '12px', color: 'var(--text-secondary)', opacity: 0.6 }}>
                    Modo de acesso rápido ativado
                </p>
            </div>
        </div>
    );
};
