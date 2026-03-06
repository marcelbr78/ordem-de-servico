import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Cpu, MessageCircle, Send, CheckCircle, Shield, Zap, ArrowRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        whatsapp: '',
        cnpj: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        // Simulando envio de e-mail / whatsapp 
        setTimeout(() => {
            setSubmitting(false);
            setSubmitSuccess(true);
        }, 1500);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const sectionStyle = {
        padding: '80px 20px',
        maxWidth: '1200px',
        margin: '0 auto',
    };

    const featureCardStyle = {
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '40px 30px',
        transition: 'transform 0.3s ease, border-color 0.3s ease',
        cursor: 'default',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'flex-start' as const,
        gap: '20px'
    };

    const inputStyle = {
        width: '100%',
        padding: '16px 20px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        color: '#fff',
        fontSize: '16px',
        outline: 'none',
        transition: 'border-color 0.2s',
        marginBottom: '16px'
    };

    return (
        <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', overflowX: 'hidden', fontFamily: '"Inter", sans-serif' }}>

            {/* ─── NAVBAR ─── */}
            <nav style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(15,23,42,0.9)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', padding: '8px', borderRadius: '10px' }}>
                        <Cpu color="white" size={24} />
                    </div>
                    <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>OS4U</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Link to="/pricing" style={{ padding: '8px 16px', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>Preços</Link>
                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            padding: '8px 20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '14px'
                        }}
                    >
                        Entrar
                    </button>
                    <Link to="/signup" style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', borderRadius: '10px', fontSize: '14px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Criar conta <ArrowRight size={14} />
                    </Link>
                </div>
            </nav>

            {/* ─── HERO SECTION ─── */}
            <header style={{ ...sectionStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: '100px', paddingBottom: '100px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translate(-50%, 0)', width: '800px', height: '400px', background: '#3b82f6', filter: 'blur(150px)', opacity: 0.15, pointerEvents: 'none', borderRadius: '50%' }}></div>

                <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', borderRadius: '20px', fontSize: '13px', fontWeight: 600, marginBottom: '24px', letterSpacing: '0.5px' }}>
                    O SISTEMA DO FUTURO ESTÁ AQUI 🚀
                </div>

                <h1 style={{ fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 800, lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-1.5px', maxWidth: '900px' }}>
                    Gerencie sua assistência com <span style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>inteligência</span> e automação.
                </h1>

                <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', maxWidth: '600px', lineHeight: 1.6, marginBottom: '40px' }}>
                    Um layout fácil, integração nativa com WhatsApp, orçamentos automáticos (SmartParts) e controle financeiro integrado para revolucionar a sua loja.
                </p>

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button onClick={() => navigate('/signup')} style={{ padding: '16px 32px', background: 'linear-gradient(135deg, var(--primary), #7c3aed)', color: '#fff', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '16px', boxShadow: '0 8px 30px rgba(59, 130, 246, 0.3)', transition: 'transform 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Criar conta grátis <ArrowRight size={18} />
                    </button>
                    <button onClick={() => navigate('/pricing')} style={{ padding: '16px 32px', background: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontWeight: 700, fontSize: '16px', textDecoration: 'none', transition: 'background 0.2s' }}>
                        Ver Planos
                    </button>
                </div>
            </header>

            {/* ─── FEATURES SECTION ─── */}
            <section style={{ background: 'rgba(0,0,0,0.2)', padding: '100px 0' }}>
                <div style={sectionStyle}>
                    <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                        <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '16px' }}>Por que escolher o OS4U?</h2>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '18px' }}>Pensado por quem entende de assistência técnica, para assistências técnicas.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                        <div style={featureCardStyle} className="hover-lift">
                            <div style={{ padding: '14px', background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', borderRadius: '16px' }}>
                                <MessageCircle size={32} />
                            </div>
                            <h3 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>WhatsApp Automático & Link</h3>
                            <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, margin: 0 }}>Chega de perder tempo avisando os clientes. O OS4U envia o status das ordens diretamente no WhatsApp, acompanhado de um <b>Link Exclusivo</b> para o cliente acompanhar o reparo em tempo real, gerando muita credibilidade.</p>
                        </div>

                        <div style={featureCardStyle} className="hover-lift">
                            <div style={{ padding: '14px', background: 'rgba(168, 85, 247, 0.1)', color: '#c084fc', borderRadius: '16px' }}>
                                <Zap size={32} />
                            </div>
                            <h3 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Cotações SmartParts</h3>
                            <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, margin: 0 }}>Crie lances expressos para fornecedores e receba cotações dinâmicas das peças que você precisa para consertar suas OS. Centralizando compras sem dor de cabeça.</p>
                        </div>

                        <div style={featureCardStyle} className="hover-lift">
                            <div style={{ padding: '14px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', borderRadius: '16px' }}>
                                <Shield size={32} />
                            </div>
                            <h3 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Interface Impecável</h3>
                            <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, margin: 0 }}>Usamos um design ultra-moderno (Dark Mode e responsividade nativa) feito exclusivamente para diminuir cliques e acelerar o fluxo dos técnicos no balcão da loja.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── CTA / CADASTRO ─── */}
            <section id="cadastro" style={sectionStyle}>
                <div style={{ background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))', borderRadius: '32px', padding: '64px', border: '1px solid rgba(255,255,255,0.05)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '64px', alignItems: 'center' }}>

                    <div>
                        <h2 style={{ fontSize: '40px', fontWeight: 800, marginBottom: '24px', lineHeight: 1.2 }}>Pronto para simplificar sua vida?</h2>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '18px', lineHeight: 1.6, marginBottom: '32px' }}>
                            No momento estamos abrindo vagas limitadas para novas assistências testarem o sistema OS4U. Se você tem interesse em modernizar a sua loja, preencha os dados e nossa equipe entrará em contato via WhatsApp/Email.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.8)' }}>
                                <CheckCircle color="#10b981" size={20} /> Sem obrigações no formulário
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.8)' }}>
                                <CheckCircle color="#10b981" size={20} /> Demonstração gratuita da plataforma
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.8)' }}>
                                <CheckCircle color="#10b981" size={20} /> Setup inicial junto com nossa equipe
                            </div>
                        </div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {submitSuccess ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                    <CheckCircle color="#10b981" size={40} />
                                </div>
                                <h3 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>Tudo Certo!</h3>
                                <p style={{ color: 'rgba(255,255,255,0.6)' }}>Seus dados foram enviados. Em breve um de nossos consultores entrará em contato através do seu WhatsApp ou E-mail.</p>
                                <button onClick={() => setSubmitSuccess(false)} style={{ marginTop: '24px', padding: '12px 24px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}>Quero indicar outra Loja</button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <h3 style={{ fontSize: '24px', fontWeight: 700, margin: 0, marginBottom: '8px' }}>Manifestar Interesse</h3>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '24px' }}>Preencha os campos abaixo</p>

                                <input required type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder="Seu Nome Completo *" style={inputStyle} />
                                <input required type="email" name="email" value={formData.email} onChange={handleChange} placeholder="E-mail da Loja *" style={inputStyle} />
                                <input required type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="WhatsApp (com DDD) *" style={inputStyle} />
                                <input required type="text" name="cnpj" value={formData.cnpj} onChange={handleChange} placeholder="CNPJ da Assistência *" style={{ ...inputStyle, marginBottom: '8px' }} />

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{
                                        width: '100%', padding: '16px', background: 'linear-gradient(135deg, var(--primary), #7c3aed)', color: '#fff', borderRadius: '12px',
                                        fontWeight: 700, fontSize: '16px', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        marginTop: '16px', boxShadow: '0 4px 15px rgba(59,130,246,0.3)', opacity: submitting ? 0.7 : 1
                                    }}
                                >
                                    {submitting ? 'Enviando...' : (
                                        <>Quero experimentar o OS4U <Send size={18} /></>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            {/* ─── FOOTER ─── */}
            <footer style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}>
                <p>© 2026 OS4U. O sistema premium para assistência técnica de alto padrão.</p>
            </footer>

            <style>{`
                .hover-lift:hover {
                    transform: translateY(-5px);
                    border-color: rgba(255,255,255,0.2) !important;
                }
                @media (max-width: 768px) {
                    #cadastro > div {
                        grid-template-columns: 1fr !important;
                        padding: 32px !important;
                    }
                }
            `}</style>
        </div>
    );
};
