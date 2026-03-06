import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Cpu, Check, Zap, Star, Shield, ArrowRight, MessageCircle } from 'lucide-react';
import { adminService } from '../services/adminService';
import type { PlanDto } from '../services/adminService';

// ── Plan Card ────────────────────────────────────────────────
const PlanCard = ({ plan, highlighted, onSelect }: {
    plan: PlanDto;
    highlighted: boolean;
    onSelect: () => void;
}) => {
    const features = [
        { label: `Ordens/mês`, val: plan.osLimit === 0 ? 'Ilimitado' : plan.osLimit.toString() },
        { label: 'Usuários', val: plan.usersLimit === 0 ? 'Ilimitado' : plan.usersLimit.toString() },
        { label: 'Itens no estoque', val: plan.storageLimit === 0 ? 'Ilimitado' : plan.storageLimit.toString() },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '32px', borderRadius: '24px', border: `1px solid ${highlighted ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.08)'}`, background: highlighted ? 'linear-gradient(160deg, rgba(30,41,80,0.8), rgba(15,23,42,0.95))' : 'rgba(255,255,255,0.02)', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s', flex: 1 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>

            {highlighted && (
                <>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }} />
                    <div style={{ position: 'absolute', top: '16px', right: '16px', padding: '4px 12px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '100px', fontSize: '11px', fontWeight: 800, color: '#fff', letterSpacing: '0.5px' }}>
                        POPULAR
                    </div>
                    <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '200px', background: '#3b82f6', filter: 'blur(80px)', opacity: 0.08, borderRadius: '50%', pointerEvents: 'none' }} />
                </>
            )}

            <div style={{ marginBottom: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'capitalize', letterSpacing: '0.5px' }}>{plan.name}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                {plan.price === 0 ? (
                    <span style={{ fontSize: '36px', fontWeight: 900, color: '#fff' }}>Grátis</span>
                ) : (
                    <>
                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, alignSelf: 'flex-start', paddingTop: '8px' }}>R$</span>
                        <span style={{ fontSize: '48px', fontWeight: 900, color: '#fff', letterSpacing: '-2px' }}>{Number(plan.price).toFixed(0)}</span>
                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>/mês</span>
                    </>
                )}
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '28px', lineHeight: 1.5 }}>{plan.description || 'Perfeito para assistências em crescimento.'}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px', flex: 1 }}>
                {features.map(f => (
                    <div key={f.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{f.label}</span>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: highlighted ? '#60a5fa' : '#fff' }}>{f.val}</span>
                    </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', paddingLeft: '4px' }}>
                    <Check size={14} color="#10b981" /> WhatsApp integrado
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', paddingLeft: '4px' }}>
                    <Check size={14} color="#10b981" /> SmartParts cotações
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', paddingLeft: '4px' }}>
                    <Check size={14} color="#10b981" /> Suporte por e-mail
                </div>
                {highlighted && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', paddingLeft: '4px' }}>
                        <Check size={14} color="#10b981" /> Suporte prioritário
                    </div>
                )}
            </div>

            <button onClick={onSelect} style={{ width: '100%', padding: '14px', background: highlighted ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(255,255,255,0.07)', color: '#fff', borderRadius: '12px', border: highlighted ? 'none' : '1px solid rgba(255,255,255,0.12)', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'opacity 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}>
                Começar grátis por 14 dias <ArrowRight size={16} />
            </button>
        </div>
    );
};

// ── FAQ Item ──────────────────────────────────────────────────
const FAQ = ({ q, a }: { q: string; a: string }) => {
    const [open, setOpen] = useState(false);
    return (
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
            <button onClick={() => setOpen(v => !v)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', padding: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {q}
                <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.4)', transition: 'transform 0.2s', transform: open ? 'rotate(45deg)' : 'none', display: 'inline-block' }}>+</span>
            </button>
            {open && <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: '0 0 16px', maxWidth: '600px' }}>{a}</p>}
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────────
export const PricingPage: React.FC = () => {
    const navigate = useNavigate();
    const [plans, setPlans] = useState<PlanDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminService.getPlans()
            .then(data => setPlans(data.filter(p => p.active !== false)))
            .catch(() => setPlans([]))
            .finally(() => setLoading(false));
    }, []);

    const sorted = [...plans].sort((a, b) => a.price - b.price);
    const midIndex = Math.floor(sorted.length / 2);

    return (
        <div style={{ minHeight: '100vh', background: '#0a0e1a', color: '#fff', fontFamily: '"Inter", sans-serif' }}>
            {/* Navbar */}
            <nav style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,14,26,0.9)' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                    <div style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', padding: '8px', borderRadius: '10px' }}>
                        <Cpu color="white" size={20} />
                    </div>
                    <span style={{ fontSize: '20px', fontWeight: 900, color: '#fff' }}>OS4U</span>
                </Link>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Link to="/login" style={{ padding: '8px 20px', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>Entrar</Link>
                    <Link to="/signup" style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', borderRadius: '10px', fontSize: '14px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Criar conta grátis <ArrowRight size={14} />
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <header style={{ textAlign: 'center', padding: '80px 20px 60px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '300px', background: '#3b82f6', filter: 'blur(120px)', opacity: 0.07, borderRadius: '50%', pointerEvents: 'none' }} />
                <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', borderRadius: '100px', fontSize: '12px', fontWeight: 700, marginBottom: '20px', letterSpacing: '0.5px' }}>
                    14 DIAS DE TRIAL GRÁTIS
                </div>
                <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-1.5px', margin: '0 0 16px', lineHeight: 1.1 }}>
                    Planos simples,<br />
                    <span style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>sem surpresas.</span>
                </h1>
                <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)', maxWidth: '500px', margin: '0 auto 16px', lineHeight: 1.6 }}>
                    Escolha o plano ideal e comece gratuitamente. Cancele ou mude de plano quando quiser.
                </p>
            </header>

            {/* Plans grid */}
            <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px 80px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>Carregando planos...</div>
                ) : sorted.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>
                        Planos disponíveis em breve. <Link to="/signup" style={{ color: '#3b82f6' }}>Criar conta grátis</Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'stretch', flexWrap: 'wrap' }}>
                        {sorted.map((plan, i) => (
                            <PlanCard key={plan.id} plan={plan} highlighted={i === midIndex} onSelect={() => navigate(`/signup?plan=${plan.id}`)} />
                        ))}
                    </div>
                )}

                {/* All-inclusive note */}
                <div style={{ marginTop: '48px', padding: '24px 32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', display: 'flex', gap: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {[
                        { icon: Shield, label: 'Sem contrato', desc: 'Cancele quando quiser, sem burocracia' },
                        { icon: Zap, label: 'Ativação imediata', desc: 'Acesse a plataforma em menos de 1 minuto' },
                        { icon: Star, label: 'Migração assistida', desc: 'Nossa equipe ajuda você a migrar seus dados' },
                        { icon: MessageCircle, label: 'Suporte via WhatsApp', desc: 'Atendimento em português, rápido e eficiente' },
                    ].map(({ icon: Icon, label, desc }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '200px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Icon size={18} color="#60a5fa" />
                            </div>
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{label}</div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ */}
            <section style={{ maxWidth: '720px', margin: '0 auto', padding: '0 20px 80px' }}>
                <h2 style={{ fontSize: '32px', fontWeight: 900, textAlign: 'center', marginBottom: '48px' }}>Perguntas frequentes</h2>
                <FAQ q="O trial é totalmente gratuito?" a="Sim! 14 dias sem precisar de cartão de crédito. Você só paga se decidir continuar após o período de trial." />
                <FAQ q="Posso mudar de plano depois?" a="Sim. Você pode fazer upgrade ou downgrade do seu plano a qualquer momento diretamente no painel. A cobrança é ajustada proporcionalmente." />
                <FAQ q="Meus dados ficam seguros?" a="Seus dados ficam em um banco de dados isolado, exclusivo da sua loja. Utilizamos criptografia em repouso e em trânsito." />
                <FAQ q="Quantos usuários posso ter?" a="Depende do plano. O Starter inclui até 3 usuários, o Professional até 10. No Enterprise o limite é configurável." />
                <FAQ q="O sistema funciona no celular?" a="Sim, o OS4U é um PWA (Progressive Web App) e funciona perfeitamente em celulares Android e iPhone, sem precisar instalar nada." />
            </section>

            {/* CTA */}
            <section style={{ padding: '80px 20px', background: 'rgba(0,0,0,0.3)', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <h2 style={{ fontSize: '40px', fontWeight: 900, marginBottom: '16px', letterSpacing: '-1px' }}>Pronto para começar?</h2>
                <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.5)', marginBottom: '32px' }}>14 dias gratuitos. Sem cartão. Sem burocracia.</p>
                <button onClick={() => navigate('/signup')} style={{ padding: '16px 40px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', borderRadius: '14px', border: 'none', fontSize: '16px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 30px rgba(59,130,246,0.3)' }}>
                    Criar conta grátis <ArrowRight size={20} />
                </button>
            </section>

            <footer style={{ padding: '32px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: '13px' }}>
                © 2026 OS4U. Todos os direitos reservados.
            </footer>
        </div>
    );
};
