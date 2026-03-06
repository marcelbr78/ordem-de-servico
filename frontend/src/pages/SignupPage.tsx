import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cpu, Eye, EyeOff, Store, User, Mail, Lock, Phone, MapPin, CheckCircle, ArrowRight, Loader } from 'lucide-react';
import api from '../services/api';

// ── Field component ────────────────────────────────────────────
const Field = ({ label, icon: Icon, type = 'text', value, onChange, placeholder, error, required = false, hint }: {
    label: string;
    icon: React.ElementType;
    type?: string;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    error?: string;
    required?: boolean;
    hint?: string;
}) => {
    const [showPw, setShowPw] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPw ? 'text' : 'password') : type;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {label}{required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
            </label>
            <div style={{ position: 'relative' }}>
                <Icon size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                <input
                    type={inputType}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    required={required}
                    style={{ width: '100%', padding: '12px 40px 12px 40px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.1)'}`, borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: 'border 0.2s' }}
                    onFocus={e => { if (!error) e.target.style.borderColor = 'rgba(59,130,246,0.5)'; }}
                    onBlur={e => { if (!error) e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                />
                {isPassword && (
                    <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '2px' }}>
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                )}
            </div>
            {error && <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>{error}</span>}
            {hint && !error && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{hint}</span>}
        </div>
    );
};

// ── Trial badge ────────────────────────────────────────────────
const TrialBenefit = ({ text }: { text: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'rgba(255,255,255,0.75)' }}>
        <CheckCircle size={16} color="#10b981" />
        {text}
    </div>
);

// ── Signup page ────────────────────────────────────────────────
export const SignupPage: React.FC = () => {
    const navigate = useNavigate();
    const { signIn } = useAuth();

    const [form, setForm] = useState({
        storeName: '',
        ownerName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        city: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const [step, setStep] = useState<1 | 2>(1);

    const set = (field: string) => (v: string) => {
        setForm(f => ({ ...f, [field]: v }));
        if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
    };

    const validateStep1 = () => {
        const e: Record<string, string> = {};
        if (!form.storeName.trim()) e.storeName = 'Nome da assistência obrigatório';
        if (!form.ownerName.trim()) e.ownerName = 'Seu nome completo é obrigatório';
        if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'E-mail inválido';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const validateStep2 = () => {
        const e: Record<string, string> = {};
        if (form.password.length < 8) e.password = 'Mínimo 8 caracteres';
        if (form.password !== form.confirmPassword) e.confirmPassword = 'Senhas não coincidem';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleNext = (ev: React.FormEvent) => {
        ev.preventDefault();
        if (validateStep1()) setStep(2);
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!validateStep2()) return;

        setLoading(true);
        setApiError('');

        try {
            const response = await api.post('/auth/signup', {
                storeName: form.storeName,
                ownerName: form.ownerName,
                email: form.email,
                password: form.password,
                phone: form.phone || undefined,
                city: form.city || undefined,
            });

            // Auto-login with returned token
            const { access_token, refresh_token, user: userData } = response.data;
            localStorage.setItem('@OS:token', access_token);
            localStorage.setItem('@OS:refreshToken', refresh_token);
            localStorage.setItem('@OS:user', JSON.stringify(userData));

            // Re-load auth context
            await signIn({ email: form.email, password: form.password });
            navigate('/dashboard');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string | string[] } } };
            const raw = error.response?.data?.message ?? 'Erro ao criar conta.';
            const msg = Array.isArray(raw) ? raw[0] : raw;
            setApiError(msg === 'E-mail já cadastrado' ? '⚠ Este e-mail já está cadastrado. Tente fazer login.' : msg);
        } finally {
            setLoading(false);
        }
    };




    return (
        <div style={{ minHeight: '100vh', background: '#0a0e1a', display: 'flex', fontFamily: '"Inter", sans-serif' }}>
            {/* Left panel — benefits */}
            <div style={{ flex: '0 0 460px', background: 'linear-gradient(160deg, #0f1729 0%, #0a0e1a 100%)', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '32px', position: 'relative', overflow: 'hidden' }}>
                {/* Glow */}
                <div style={{ position: 'absolute', top: '20%', left: '30%', width: '400px', height: '400px', background: '#3b82f6', filter: 'blur(160px)', opacity: 0.07, borderRadius: '50%', pointerEvents: 'none' }} />

                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', padding: '10px', borderRadius: '12px' }}>
                        <Cpu color="white" size={24} />
                    </div>
                    <span style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.5px', color: '#fff' }}>OS4U</span>
                </div>

                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#fff', margin: '0 0 12px', lineHeight: 1.2, letterSpacing: '-0.5px' }}>
                        14 dias de trial<br />
                        <span style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>completamente grátis.</span>
                    </h1>
                    <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
                        Crie sua conta agora e comece a gerenciar sua assistência com tecnologia de ponta. Sem cartão de crédito.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {[
                        'Trial de 14 dias — sem cartão de crédito',
                        'Ordens de serviço ilimitadas no trial',
                        'Integração WhatsApp inclusa',
                        'Suporte prioritário na configuração',
                        'Migração de dados assistida',
                    ].map(t => <TrialBenefit key={t} text={t} />)}
                </div>

                {/* Plan pricing preview */}
                <div style={{ padding: '20px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '14px' }}>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>Após o trial</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '28px', fontWeight: 900, color: '#fff' }}>R$79</span>
                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>/mês no Starter</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', margin: '6px 0 0' }}>
                        Cancele quando quiser. <Link to="/pricing" style={{ color: 'var(--accent-primary)' }}>Ver todos os planos →</Link>
                    </p>
                </div>
            </div>

            {/* Right panel — form */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px' }}>
                <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {/* Header */}
                    <div>
                        {/* Steps */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                            {[1, 2].map(s => (
                                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: s <= step ? 'var(--accent-primary)' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: s <= step ? '#fff' : 'rgba(255,255,255,0.3)', transition: 'background 0.3s' }}>
                                        {s < step ? <CheckCircle size={14} /> : s}
                                    </div>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: s === step ? '#fff' : 'rgba(255,255,255,0.35)' }}>
                                        {s === 1 ? 'Dados da Loja' : 'Acesso'}
                                    </span>
                                    {s < 2 && <ArrowRight size={12} color="rgba(255,255,255,0.2)" />}
                                </div>
                            ))}
                        </div>

                        <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#fff', margin: 0 }}>
                            {step === 1 ? 'Crie sua conta' : 'Defina sua senha'}
                        </h2>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>
                            {step === 1 ? 'Preencha os dados da sua assistência técnica.' : 'Crie uma senha segura para acessar a plataforma.'}
                        </p>
                    </div>

                    {/* Step 1 */}
                    {step === 1 && (
                        <form onSubmit={handleNext} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <Field label="Nome da Assistência" icon={Store} value={form.storeName} onChange={set('storeName')} placeholder="Ex: TechFix Assistência LTDA" error={errors.storeName} required />
                            <Field label="Seu Nome Completo" icon={User} value={form.ownerName} onChange={set('ownerName')} placeholder="Maria da Silva" error={errors.ownerName} required />
                            <Field label="E-mail" icon={Mail} type="email" value={form.email} onChange={set('email')} placeholder="contato@techfix.com.br" error={errors.email} required />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <Field label="WhatsApp" icon={Phone} value={form.phone} onChange={set('phone')} placeholder="(11) 99999-9999" />
                                <Field label="Cidade" icon={MapPin} value={form.city} onChange={set('city')} placeholder="São Paulo – SP" />
                            </div>
                            <button type="submit" style={{ marginTop: '8px', padding: '14px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                Continuar <ArrowRight size={18} />
                            </button>
                        </form>
                    )}

                    {/* Step 2 */}
                    {step === 2 && (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <Field label="Senha" icon={Lock} type="password" value={form.password} onChange={set('password')} placeholder="Mínimo 8 caracteres" error={errors.password} required hint="Use letras, números e símbolos para maior segurança" />
                            <Field label="Confirmar Senha" icon={Lock} type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repita a senha" error={errors.confirmPassword} required />

                            {/* Password strength */}
                            {form.password.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {[0, 1, 2, 3].map(i => {
                                            const strength = [form.password.length >= 8, /[A-Z]/.test(form.password), /[0-9]/.test(form.password), /[^A-Za-z0-9]/.test(form.password)].filter(Boolean).length;
                                            const colors = ['#ef4444', '#f59e0b', '#10b981', '#10b981'];
                                            return <div key={i} style={{ height: '3px', flex: 1, borderRadius: '100px', background: i < strength ? colors[strength - 1] : 'rgba(255,255,255,0.06)' }} />;
                                        })}
                                    </div>
                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                                        {[form.password.length >= 8, /[A-Z]/.test(form.password), /[0-9]/.test(form.password), /[^A-Za-z0-9]/.test(form.password)].filter(Boolean).length <= 1 ? 'Senha fraca' :
                                            [form.password.length >= 8, /[A-Z]/.test(form.password), /[0-9]/.test(form.password), /[^A-Za-z0-9]/.test(form.password)].filter(Boolean).length === 2 ? 'Senha média' :
                                                'Senha forte ✓'}
                                    </span>
                                </div>
                            )}

                            {apiError && (
                                <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', fontSize: '13px', color: '#ef4444', fontWeight: 600 }}>
                                    {apiError}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>
                                    Voltar
                                </button>
                                <button type="submit" disabled={loading} style={{ flex: 2, padding: '14px', background: loading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    {loading ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Criando conta...</> : <>Criar conta grátis <ArrowRight size={18} /></>}
                                </button>
                            </div>

                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 1.6 }}>
                                Ao criar sua conta você concorda com nossos{' '}
                                <span style={{ color: 'var(--accent-primary)', cursor: 'pointer' }}>Termos de Uso</span> e{' '}
                                <span style={{ color: 'var(--accent-primary)', cursor: 'pointer' }}>Política de Privacidade</span>.
                            </p>
                        </form>
                    )}

                    <p style={{ textAlign: 'center', fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
                        Já tem uma conta?{' '}
                        <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 700, textDecoration: 'none' }}>Fazer login</Link>
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                input::placeholder { color: rgba(255,255,255,0.25); }
                input { color-scheme: dark; }
            `}</style>
        </div>
    );
};
