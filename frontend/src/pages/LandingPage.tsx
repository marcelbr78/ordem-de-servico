import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ArrowRight, CheckCircle, MessageCircle, Zap, Shield, BarChart2,
    Printer, Package, Users, Receipt, Star, ChevronDown, Phone,
    Cpu, Clock, TrendingUp, Wrench, FileText, Send, X,
    Play, Building2, Calendar, Lock, Globe,
} from 'lucide-react';

// ── Animated counter ──────────────────────────────────────────
const Counter: React.FC<{ to: number; suffix?: string; duration?: number }> = ({ to, suffix = '', duration = 2000 }) => {
    const [val, setVal] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const started = useRef(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting && !started.current) {
                started.current = true;
                const start = Date.now();
                const tick = () => {
                    const p = Math.min((Date.now() - start) / duration, 1);
                    const ease = 1 - Math.pow(1 - p, 3);
                    setVal(Math.round(ease * to));
                    if (p < 1) requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
            }
        }, { threshold: 0.3 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [to, duration]);
    return <span ref={ref}>{val.toLocaleString('pt-BR')}{suffix}</span>;
};

// ── Feature card ───────────────────────────────────────────────
const FeatureCard: React.FC<{ icon: React.ElementType; color: string; title: string; desc: string; tags?: string[] }> =
    ({ icon: Icon, color, title, desc, tags }) => (
    <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '20px', padding: '28px 24px', display: 'flex', flexDirection: 'column',
        gap: '14px', transition: 'all 0.25s', cursor: 'default',
    }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${color}40`; el.style.transform = 'translateY(-3px)'; el.style.background = `rgba(255,255,255,0.05)`; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(255,255,255,0.07)'; el.style.transform = 'translateY(0)'; el.style.background = 'rgba(255,255,255,0.03)'; }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={22} color={color} />
        </div>
        <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', margin: 0 }}>{title}</h3>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, margin: 0 }}>{desc}</p>
        {tags && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {tags.map(t => (
                    <span key={t} style={{ fontSize: '11px', fontWeight: 600, padding: '2px 9px', borderRadius: '20px', background: `${color}15`, color, border: `1px solid ${color}25` }}>{t}</span>
                ))}
            </div>
        )}
    </div>
);

// ── Testimonial ────────────────────────────────────────────────
const Testimonial: React.FC<{ text: string; name: string; role: string; stars?: number }> = ({ text, name, role, stars = 5 }) => (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '3px' }}>{Array.from({ length: stars }).map((_, i) => <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}</div>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>"{text}"</p>
        <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{name}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{role}</div>
        </div>
    </div>
);

// ── FAQ Item ───────────────────────────────────────────────────
const FaqItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
    const [open, setOpen] = useState(false);
    return (
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', background: 'transparent', border: 'none', cursor: 'pointer', gap: '16px' }}>
                <span style={{ fontSize: '16px', fontWeight: 600, color: '#fff', textAlign: 'left' }}>{q}</span>
                <ChevronDown size={18} color="rgba(255,255,255,0.4)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
            </button>
            {open && <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, paddingBottom: '20px', margin: 0 }}>{a}</p>}
        </div>
    );
};

// ── Main ───────────────────────────────────────────────────────
export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ nome: '', email: '', whatsapp: '', cidade: '' });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [mobileMenu, setMobileMenu] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setTimeout(() => { setSubmitting(false); setSubmitted(true); }, 1500);
    };

    const inp: React.CSSProperties = { width: '100%', padding: '13px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' };
    const sec: React.CSSProperties = { maxWidth: '1160px', margin: '0 auto', padding: '0 24px' };

    return (
        <div style={{ minHeight: '100vh', background: '#080c14', color: '#fff', fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif", overflowX: 'hidden' }}>

            {/* ── NAVBAR ── */}
            <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(8,12,20,0.88)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ ...sec, height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Cpu size={18} color="#fff" />
                        </div>
                        <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>OS4U</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)', marginLeft: '2px' }}>BETA</span>
                    </div>
                    {/* Desktop nav */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="desktop-nav">
                        {[['Funcionalidades','#funcionalidades'],['Como funciona','#como-funciona'],['Depoimentos','#depoimentos'],['Preços','/pricing'],['FAQ','#faq']].map(([l, h]) => (
                            <a key={l} href={h} onClick={h.startsWith('/') ? (e) => { e.preventDefault(); navigate(h); } : undefined}
                                style={{ padding: '8px 14px', color: 'rgba(255,255,255,0.65)', fontSize: '14px', fontWeight: 500, textDecoration: 'none', borderRadius: '8px', transition: 'all 0.15s' }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}>{l}</a>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button onClick={() => navigate('/login')} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>Entrar</button>
                        <Link to="/signup" style={{ padding: '9px 18px', background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: '#fff', borderRadius: '9px', fontSize: '14px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                            Testar grátis <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── HERO ── */}
            <header style={{ position: 'relative', overflow: 'hidden', padding: '100px 0 80px' }}>
                {/* Glows */}
                <div style={{ position: 'absolute', top: '-100px', left: '20%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '-80px', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />
                {/* Grid pattern */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

                <div style={{ ...sec, position: 'relative', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e', borderRadius: '20px', fontSize: '13px', fontWeight: 600, marginBottom: '28px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
                        Sistema completo para assistência técnica
                    </div>

                    <h1 style={{ fontSize: 'clamp(36px, 5.5vw, 68px)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-2px', marginBottom: '24px', maxWidth: '900px', margin: '0 auto 24px' }}>
                        Sua assistência técnica<br />
                        no <span style={{ background: 'linear-gradient(135deg, #3b82f6, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>próximo nível.</span>
                    </h1>

                    <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', color: 'rgba(255,255,255,0.6)', maxWidth: '680px', lineHeight: 1.65, margin: '0 auto 40px' }}>
                        OS4U é o sistema de gestão mais completo do Brasil para assistências técnicas. WhatsApp automático, cotação de peças, NF-e, financeiro, estoque, Kanban — tudo integrado numa plataforma só.
                    </p>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '56px' }}>
                        <button onClick={() => navigate('/signup')} style={{ padding: '15px 32px', background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: '#fff', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 32px rgba(59,130,246,0.3)', transition: 'transform 0.2s' }}
                            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                            Criar conta grátis <ArrowRight size={16} />
                        </button>
                        <a href="#demo" style={{ padding: '15px 28px', background: 'rgba(255,255,255,0.06)', color: '#fff', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)', fontWeight: 600, fontSize: '15px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Play size={15} /> Ver demonstração
                        </a>
                    </div>

                    {/* Social proof */}
                    <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {[
                            { n: <Counter to={500} suffix="+" />, l: 'assistências ativas' },
                            { n: <Counter to={98} suffix="%" />, l: 'de satisfação' },
                            { n: <Counter to={15000} suffix="+" />, l: 'OS processadas/mês' },
                            { n: '14 dias', l: 'trial grátis' },
                        ].map(({ n, l }, i) => (
                            <div key={i} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>{n}</div>
                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '3px' }}>{l}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </header>

            {/* ── MOCKUP / PREVIEW ── */}
            <section id="demo" style={{ padding: '20px 0 80px' }}>
                <div style={{ ...sec }}>
                    <div style={{ background: 'linear-gradient(145deg, rgba(15,23,42,0.9), rgba(8,12,20,1))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
                        {/* Browser chrome */}
                        <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />)}
                            </div>
                            <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: '6px', height: '24px', display: 'flex', alignItems: 'center', paddingLeft: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                                🔒 app.os4u.com.br/orders
                            </div>
                        </div>
                        {/* Dashboard preview */}
                        <div style={{ display: 'flex', minHeight: '340px' }}>
                            {/* Mini sidebar */}
                            <div style={{ width: '52px', background: 'rgba(0,0,0,0.3)', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {[BarChart2, Wrench, Users, Package, TrendingUp, Receipt, MessageCircle].map((Icon, i) => (
                                    <div key={i} style={{ width: '36px', height: '36px', borderRadius: '8px', background: i === 1 ? 'rgba(59,130,246,0.2)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Icon size={16} color={i === 1 ? '#3b82f6' : 'rgba(255,255,255,0.25)'} />
                                    </div>
                                ))}
                            </div>
                            {/* Content */}
                            <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>Ordens de Serviço</div>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>23 abertas · 5 urgentes</div>
                                    </div>
                                    <div style={{ padding: '7px 14px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', fontSize: '12px', color: '#60a5fa', fontWeight: 600 }}>+ Nova OS</div>
                                </div>
                                {/* KPI row */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                                    {[
                                        { l: 'Abertas', v: '23', c: '#3b82f6' }, { l: 'Em Reparo', v: '8', c: '#a855f7' },
                                        { l: 'Finalizadas', v: '47', c: '#22c55e' }, { l: 'Faturado', v: 'R$8,4k', c: '#f59e0b' },
                                    ].map(({ l, v, c }) => (
                                        <div key={l} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${c}20`, borderRadius: '10px' }}>
                                            <div style={{ fontSize: '18px', fontWeight: 800, color: c }}>{v}</div>
                                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{l}</div>
                                        </div>
                                    ))}
                                </div>
                                {/* OS list preview */}
                                {[
                                    { n: '#202503-0042', c: 'José Silva', d: 'Samsung A54 · Tela quebrada', s: 'Em Reparo', sc: '#a855f7' },
                                    { n: '#202503-0041', c: 'Maria Souza', d: 'iPhone 13 · Bateria fraca', s: 'Finalizada', sc: '#22c55e' },
                                    { n: '#202503-0040', c: 'Carlos Lima', d: 'Notebook Dell · Não liga', s: 'Ag. Peça', sc: '#f97316' },
                                ].map(({ n, c, d, s, sc }) => (
                                    <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '9px' }}>
                                        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#60a5fa', fontWeight: 700, flexShrink: 0 }}>{n}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{c}</div>
                                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{d}</div>
                                        </div>
                                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: `${sc}15`, color: sc, border: `1px solid ${sc}25`, flexShrink: 0 }}>{s}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── STATS BAND ── */}
            <section style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '40px 0' }}>
                <div style={{ ...sec, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '24px' }}>
                    {[
                        { n: <><Counter to={500} />+</>, l: 'Assistências ativas', icon: Building2, c: '#3b82f6' },
                        { n: <><Counter to={15000} />+</>, l: 'OS/mês processadas', icon: Wrench, c: '#a855f7' },
                        { n: <><Counter to={98} />%</>, l: 'Satisfação dos clientes', icon: Star, c: '#22c55e' },
                        { n: '< 2min', l: 'Para abrir uma OS', icon: Clock, c: '#f59e0b' },
                        { n: 'R$ 0', l: 'Custo no trial (14 dias)', icon: Shield, c: '#ec4899' },
                    ].map(({ n, l, icon: Icon, c }) => (
                        <div key={l} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <Icon size={20} color={c} />
                            <div style={{ fontSize: '26px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>{n}</div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{l}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FUNCIONALIDADES ── */}
            <section id="funcionalidades" style={{ padding: '100px 0' }}>
                <div style={sec}>
                    <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                        <div style={{ display: 'inline-block', fontSize: '12px', fontWeight: 700, color: '#a855f7', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', padding: '4px 14px', borderRadius: '20px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Funcionalidades</div>
                        <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: '16px' }}>Tudo que sua assistência precisa</h2>
                        <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.5)', maxWidth: '600px', margin: '0 auto' }}>Mais de 40 funcionalidades integradas. Sem precisar de outros sistemas.</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                        <FeatureCard icon={Wrench} color="#3b82f6" title="Ordens de Serviço Completas"
                            desc="Abertura com checklist de entrada, fotos, laudo técnico, diagnóstico inteligente, peças, histórico completo e PDF da OS."
                            tags={['Kanban', 'Múltiplos equipamentos', 'Histórico']} />
                        <FeatureCard icon={MessageCircle} color="#22c55e" title="WhatsApp Automático"
                            desc="Notificações automáticas em cada mudança de status via Evolution API. Templates personalizáveis por evento com preview visual."
                            tags={['Evolution API', 'Templates', 'Conversa por OS']} />
                        <FeatureCard icon={Zap} color="#f59e0b" title="Cotação SmartParts"
                            desc="Envie cotações para todos os fornecedores de uma vez via WhatsApp. Receba respostas automaticamente — Incell, OLED, Original separados."
                            tags={['Multi-fornecedor', 'Multi-opção', 'Auto-resposta']} />
                        <FeatureCard icon={Receipt} color="#a855f7" title="Notas Fiscais (NF-e / NFS-e)"
                            desc="Emissão de NF-e e NFS-e integrada. DANFE, carta de correção, cancelamento, envio por e-mail. Certificado A1 com armazenamento seguro."
                            tags={['NF-e', 'NFS-e', 'DANFE PDF', 'CC-e']} />
                        <FeatureCard icon={BarChart2} color="#ec4899" title="Financeiro Integrado"
                            desc="Lançamentos vinculados às OS, contas bancárias, resumo por período, PIX automático e controle de formas de pagamento."
                            tags={['Múltiplas contas', 'PIX', 'Categorias']} />
                        <FeatureCard icon={Package} color="#f97316" title="Estoque Inteligente"
                            desc="Controle de produtos e peças com entrada por compra, vinculação à OS, alertas de mínimo e consulta por código de barras."
                            tags={['Código de barras', 'Alerta mínimo', 'Por OS']} />
                        <FeatureCard icon={Cpu} color="#06b6d4" title="Diagnóstico de Placa"
                            desc="Módulo avançado de diagnóstico de placa-mãe com sequência de power, análise de componentes e histórico de reparos."
                            tags={['BoardView', 'Power sequence', 'Histórico']} />
                        <FeatureCard icon={Printer} color="#84cc16" title="Impressão Térmica"
                            desc="Impressão em bobina 58mm ou 80mm via Bluetooth, USB ou rede. QR Code no recibo com link de status. Impressão automática ao abrir OS."
                            tags={['58mm / 80mm', 'Bluetooth', 'QR Code']} />
                        <FeatureCard icon={Shield} color="#f59e0b" title="Controle de Garantia"
                            desc="Gestão completa de garantias com alertas de vencimento, notificação automática ao cliente e rastreamento por OS."
                            tags={['Alertas', 'WhatsApp auto', 'Rastreamento']} />
                        <FeatureCard icon={Users} color="#60a5fa" title="Gestão de Clientes"
                            desc="Cadastro PF/PJ com múltiplos contatos, endereço automático por CEP, histórico completo de OS e gastos."
                            tags={['PF / PJ', 'Auto CEP', 'Histórico']} />
                        <FeatureCard icon={Globe} color="#a855f7" title="Status Público Online"
                            desc="Cada OS tem um link único que o cliente acompanha em tempo real. Aprovação de orçamento online com aceite digital."
                            tags={['Link único', 'Aprovação online', 'Tempo real']} />
                        <FeatureCard icon={Lock} color="#22c55e" title="Segurança & Auditoria"
                            desc="Log completo de todas as ações do sistema, hierarquia de usuários (admin, técnico, atendente) e auditoria de conversas."
                            tags={['Log completo', 'Roles', 'LGPD']} />
                    </div>
                </div>
            </section>

            {/* ── COMO FUNCIONA ── */}
            <section id="como-funciona" style={{ padding: '100px 0', background: 'rgba(0,0,0,0.25)' }}>
                <div style={sec}>
                    <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                        <div style={{ display: 'inline-block', fontSize: '12px', fontWeight: 700, color: '#3b82f6', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', padding: '4px 14px', borderRadius: '20px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Como funciona</div>
                        <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-1px' }}>Do balcão ao WhatsApp em 3 passos</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
                        {[
                            { n: '01', icon: FileText, color: '#3b82f6', t: 'Abre a OS', d: 'Em menos de 2 minutos você abre a OS com as informações do cliente, equipamento e defeito. O sistema preenche marca e modelo automaticamente pelo histórico.' },
                            { n: '02', icon: Zap, color: '#a855f7', t: 'Sistema trabalha por você', d: 'WhatsApp de entrada enviado automaticamente. SmartParts faz a cotação de peças com todos os fornecedores ao mesmo tempo. Diagnóstico inteligente sugere o problema.' },
                            { n: '03', icon: CheckCircle, color: '#22c55e', t: 'Entrega e recebe', d: 'OS finalizada, WhatsApp de aviso enviado, pagamento registrado, NF emitida automaticamente e garantia cadastrada. Tudo num clique.' },
                        ].map(({ n, icon: Icon, color, t, d }) => (
                            <div key={n} style={{ position: 'relative', padding: '32px 28px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px' }}>
                                <div style={{ position: 'absolute', top: '24px', right: '24px', fontSize: '48px', fontWeight: 900, color: `${color}15`, lineHeight: 1 }}>{n}</div>
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                    <Icon size={24} color={color} />
                                </div>
                                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: '#fff' }}>{t}</h3>
                                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: 0 }}>{d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── DEPOIMENTOS ── */}
            <section id="depoimentos" style={{ padding: '100px 0' }}>
                <div style={sec}>
                    <div style={{ textAlign: 'center', marginBottom: '56px' }}>
                        <div style={{ display: 'inline-block', fontSize: '12px', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', padding: '4px 14px', borderRadius: '20px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Depoimentos</div>
                        <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-1px' }}>O que nossos clientes dizem</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                        <Testimonial stars={5} name="Rafael M." role="Assistência TechCenter, São Paulo" text="Antes eu usava planilha e WhatsApp manual. Hoje o OS4U faz tudo automaticamente. O WhatsApp automático sozinho já valeu o custo — os clientes ficam impressionados." />
                        <Testimonial stars={5} name="Fernanda L." role="MobileMax, Curitiba" text="A cotação de peças via WhatsApp é incrível. Antes eu ligava para 5 fornecedores, hoje em 30 minutos já tenho as respostas de todos no mesmo lugar. Economizo horas por semana." />
                        <Testimonial stars={5} name="João Carlos" role="Fix Tech, Blumenau" text="Migrei de outro sistema e a diferença é absurda. O módulo de NF-e funciona de verdade, a impressora térmica conectou na hora e o suporte resolveu tudo rapidinho." />
                        <Testimonial stars={5} name="Simone A." role="CellService, Porto Alegre" text="O link de status público que o cliente acessa é o que mais impressiona. Todo dia recebo mensagem de clientes elogiando a transparência. Minha reputação melhorou muito." />
                        <Testimonial stars={5} name="Diego S." role="SmartFix, Florianópolis" text="Já testei 4 sistemas diferentes. O OS4U é o único que tem tudo junto: OS, financeiro, estoque e nota fiscal sem precisar ficar integrando coisa com coisa." />
                        <Testimonial stars={5} name="Marcelo T." role="RepairPro, Joinville" text="O diagnóstico de placa com a sequência de power é uma mão na roda. Consigo consultar o histórico de reparos semelhantes e economizo muito tempo no diagnóstico." />
                    </div>
                </div>
            </section>

            {/* ── COMPARATIVO ── */}
            <section style={{ padding: '100px 0', background: 'rgba(0,0,0,0.25)' }}>
                <div style={sec}>
                    <div style={{ textAlign: 'center', marginBottom: '56px' }}>
                        <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: '12px' }}>OS4U vs Concorrentes</h2>
                        <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.5)' }}>O que só o OS4U oferece</p>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Funcionalidade</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', fontWeight: 800, color: '#60a5fa', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(59,130,246,0.06)' }}>OS4U</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Concorrente A</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Concorrente B</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ['WhatsApp automático com Evolution', true, false, false],
                                    ['Cotação multi-fornecedor (SmartParts)', true, false, false],
                                    ['NF-e e NFS-e integrado', true, true, false],
                                    ['Kanban de OS com drag-and-drop', true, false, true],
                                    ['Diagnóstico de placa (BoardView)', true, false, false],
                                    ['Status público com link único', true, true, false],
                                    ['Impressora térmica integrada', true, false, false],
                                    ['Conversa por OS para auditoria', true, false, false],
                                    ['Plataforma SaaS multi-tenants', true, false, false],
                                    ['Diagnóstico inteligente por IA', true, false, false],
                                ].map(([feat, os4u, cA, cB], i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <td style={{ padding: '13px 16px', fontSize: '14px', color: 'rgba(255,255,255,0.75)' }}>{feat}</td>
                                        <td style={{ padding: '13px 16px', textAlign: 'center', background: 'rgba(59,130,246,0.04)' }}>
                                            {os4u ? <CheckCircle size={18} color="#22c55e" /> : <X size={18} color="#ef4444" />}
                                        </td>
                                        <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                                            {cA ? <CheckCircle size={18} color="#22c55e" /> : <X size={18} color="#ef4444" />}
                                        </td>
                                        <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                                            {cB ? <CheckCircle size={18} color="#22c55e" /> : <X size={18} color="#ef4444" />}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* ── FAQ ── */}
            <section id="faq" style={{ padding: '100px 0' }}>
                <div style={{ ...sec, maxWidth: '760px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '56px' }}>
                        <div style={{ display: 'inline-block', fontSize: '12px', fontWeight: 700, color: '#06b6d4', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', padding: '4px 14px', borderRadius: '20px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Dúvidas frequentes</div>
                        <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-1px' }}>Perguntas frequentes</h2>
                    </div>
                    {[
                        { q: 'Funciona para qualquer tipo de assistência técnica?', a: 'Sim. O OS4U atende assistências de celular, notebook, MacBook, tablet, videogame e eletrônicos em geral. O sistema é configurável para qualquer fluxo de trabalho.' },
                        { q: 'Preciso instalar algum programa?', a: 'Não. O OS4U é 100% online (cloud). Funciona em qualquer navegador, computador, celular ou tablet. Sem instalação, sem atualização manual.' },
                        { q: 'O WhatsApp automático funciona com meu número já usado?', a: 'Sim, através da Evolution API você conecta qualquer número de WhatsApp (inclusive o número já em uso na sua loja) via QR Code. Leva menos de 5 minutos.' },
                        { q: 'A emissão de NF-e é para qualquer estado?', a: 'A NF-e (produto) funciona para todos os estados do Brasil. A NFS-e (serviço) depende da integração com a prefeitura — o sistema já suporta os padrões ABRASF e outras principais prefeituras.' },
                        { q: 'Posso migrar dados do meu sistema atual?', a: 'Sim. Nossa equipe de suporte auxilia na migração de clientes e histórico de OS via planilha Excel. O processo leva em média 1 dia útil.' },
                        { q: 'Quantos usuários posso ter?', a: 'Depende do plano escolhido. O plano Starter suporta até 3 usuários, o Pro até 10 e o Enterprise é ilimitado. Cada usuário tem nível de acesso configurável (admin, técnico, atendente).' },
                        { q: 'O que acontece após o trial de 14 dias?', a: 'Você escolhe um plano e continua com todos os seus dados. Se não quiser assinar, seus dados ficam disponíveis por mais 30 dias para exportação.' },
                        { q: 'Tem suporte técnico?', a: 'Sim. Suporte via WhatsApp e sistema de tickets integrado. Tempo médio de resposta: menos de 2 horas em dias úteis.' },
                    ].map(({ q, a }) => <FaqItem key={q} q={q} a={a} />)}
                </div>
            </section>

            {/* ── CTA FINAL ── */}
            <section style={{ padding: '100px 0', background: 'rgba(0,0,0,0.3)' }}>
                <div style={sec}>
                    <div style={{ background: 'linear-gradient(145deg, rgba(59,130,246,0.12), rgba(124,58,237,0.08))', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '28px', padding: '64px 48px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '64px', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: '20px', lineHeight: 1.15 }}>
                                Pronto para transformar sua assistência?
                            </h2>
                            <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, marginBottom: '28px' }}>
                                Comece seu trial grátis de 14 dias agora. Sem cartão de crédito. Nossa equipe faz o setup junto com você.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {['14 dias grátis, sem cartão de crédito', 'Setup inicial gratuito com suporte', 'Migração de dados incluída', 'Cancele quando quiser, sem multa'].map(l => (
                                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', color: 'rgba(255,255,255,0.8)' }}>
                                        <CheckCircle size={18} color="#22c55e" style={{ flexShrink: 0 }} /> {l}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.35)', borderRadius: '20px', padding: '36px', border: '1px solid rgba(255,255,255,0.07)' }}>
                            {submitted ? (
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                        <CheckCircle size={32} color="#22c55e" />
                                    </div>
                                    <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>Recebemos seu contato!</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: '20px' }}>Nossa equipe vai entrar em contato pelo WhatsApp em até 2 horas úteis.</p>
                                    <button onClick={() => navigate('/signup')} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: '#fff', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '7px', margin: '0 auto' }}>
                                        Criar conta agora <ArrowRight size={14} />
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>Falar com consultor</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', marginBottom: '24px' }}>Resposta em até 2h úteis pelo WhatsApp</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <input required type="text" placeholder="Seu nome completo *" value={formData.nome} onChange={e => setFormData(p => ({ ...p, nome: e.target.value }))} style={inp} onFocus={e => (e.target.style.borderColor = 'rgba(59,130,246,0.5)')} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')} />
                                        <input required type="email" placeholder="E-mail da loja *" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} style={inp} onFocus={e => (e.target.style.borderColor = 'rgba(59,130,246,0.5)')} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')} />
                                        <input required type="text" placeholder="WhatsApp (com DDD) *" value={formData.whatsapp} onChange={e => setFormData(p => ({ ...p, whatsapp: e.target.value }))} style={inp} onFocus={e => (e.target.style.borderColor = 'rgba(59,130,246,0.5)')} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')} />
                                        <input type="text" placeholder="Cidade / Estado" value={formData.cidade} onChange={e => setFormData(p => ({ ...p, cidade: e.target.value }))} style={inp} onFocus={e => (e.target.style.borderColor = 'rgba(59,130,246,0.5)')} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.12)')} />
                                        <button type="submit" disabled={submitting} style={{ padding: '14px', background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: '#fff', borderRadius: '10px', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: submitting ? 0.75 : 1, transition: 'opacity 0.2s' }}>
                                            {submitting ? 'Enviando...' : <><Phone size={16} /> Quero falar com consultor</>}
                                        </button>
                                    </div>
                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: '12px' }}>Ou <Link to="/signup" style={{ color: '#60a5fa', textDecoration: 'none' }}>crie sua conta agora</Link> e comece em 5 minutos</p>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '48px 24px 32px' }}>
                <div style={{ ...sec, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '40px', marginBottom: '40px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Cpu size={14} color="#fff" />
                            </div>
                            <span style={{ fontSize: '16px', fontWeight: 800 }}>OS4U</span>
                        </div>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.65 }}>O sistema mais completo do Brasil para assistências técnicas.</p>
                    </div>
                    {[
                        { title: 'Produto', links: ['Funcionalidades', 'Preços', 'Changelog', 'Status do sistema'] },
                        { title: 'Empresa', links: ['Sobre nós', 'Blog', 'Termos de uso', 'Privacidade'] },
                        { title: 'Suporte', links: ['Central de ajuda', 'WhatsApp', 'Suporte técnico', 'Documentação'] },
                    ].map(({ title, links }) => (
                        <div key={title}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                                {links.map(l => <a key={l} href="#" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', transition: 'color 0.15s' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>{l}</a>)}
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ ...sec, paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>© 2026 OS4U. Todos os direitos reservados.</p>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        {['Termos', 'Privacidade', 'Cookies'].map(l => <a key={l} href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>{l}</a>)}
                    </div>
                </div>
            </footer>

            <style>{`
                @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
                @media (max-width: 768px) {
                    .desktop-nav { display: none !important; }
                }
                * { scroll-behavior: smooth; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #080c14; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
            `}</style>
        </div>
    );
};
