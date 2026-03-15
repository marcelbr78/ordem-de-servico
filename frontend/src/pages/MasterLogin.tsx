import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, ShieldAlert, ArrowRight, Mail, Lock } from 'lucide-react';

export const MasterLogin: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, signed, user, signOut } = useAuth();
    const navigate = useNavigate();
    console.log('[MasterLogin] Component mounted at:', window.location.pathname);

    React.useEffect(() => {
        if (signed && user) {
            console.log('[MasterLogin] Usuário logado detectado. Role:', user.role);
            const role = user.role?.toString().toLowerCase().trim();
            const isSuperAdmin = role === 'super_admin';
            if (isSuperAdmin) {
                navigate('/portal-gestao/inicio', { replace: true });
            } else {
                // Se tentou logar no painel master mas não é super_admin, vamos dar erro
                setError('Acesso negado: Somente administradores do sistema podem acessar este painel.');
                signOut(); // Opcional: desloga o usuário caso não tenha permissão e tente entrar no painel
            }
        }
    }, [signed, user, navigate, signOut]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password.trim()) {
            setError('Preencha todos os campos.');
            return;
        }

        setLoading(true);
        try {
            await signIn({ email: email.trim(), password });
        } catch (err) {
            console.error('MasterLogin error:', err);
            const error = err as Error & { response?: { data?: { message?: string } } };
            const message = error.response?.data?.message || error.message || 'Erro desconhecido';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '14px 14px 14px 44px',
        background: 'rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        color: 'white',
        fontSize: '15px',
        outline: 'none',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        boxSizing: 'border-box' as const,
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'var(--bg-primary)',
            position: 'relative',
        }}>
            {/* Master specific background touch */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
                pointerEvents: 'none'
            }} />

            <div className="glass-panel animate-fade" style={{
                width: '100%',
                maxWidth: '420px',
                padding: '40px',
                textAlign: 'center',
                background: 'rgba(20, 20, 25, 0.8)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                position: 'relative',
                zIndex: 1,
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                    width: '60px',
                    height: '60px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)'
                }}>
                    <ShieldAlert color="white" size={32} />
                </div>

                <h1 style={{ fontSize: '24px', marginBottom: '8px', fontWeight: '800', color: '#fff' }}>Painel Master</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '14px' }}>Acesso exclusivo a gestores do sistema</p>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        marginBottom: '20px',
                        color: '#f87171',
                        fontSize: '14px',
                        textAlign: 'left'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                    <div style={{ marginBottom: '16px', position: 'relative' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                            Usuário Master
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.6 }} />
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="E-mail administrador"
                                autoFocus
                                style={inputStyle}
                                onFocus={(e) => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.15)'; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '24px', position: 'relative' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                            Senha
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.6 }} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Sua senha secreta"
                                style={inputStyle}
                                onFocus={(e) => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.15)'; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '16px',
                            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '16px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                            border: 'none',
                            transition: 'transform 0.2s ease, opacity 0.2s ease',
                            opacity: loading ? 0.7 : 1,
                        }}
                        onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(1.02)'; }}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={24} />
                        ) : (
                            <>
                                Acessar Gerenciamento
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                    <a href="/portal-gestao/login" style={{
                        display: 'block',
                        marginTop: '20px',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        fontSize: '13px',
                        textDecoration: 'none',
                    }}>
                        Voltar para login de cliente
                    </a>
                </form>

                <p style={{ marginTop: '24px', fontSize: '12px', color: 'var(--text-secondary)', opacity: 0.5 }}>
                    © 2026 Admin — Acesso Restrito
                </p>
            </div>
        </div>
    );
};
