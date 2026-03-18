import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';

// ── Voz (Text-to-Speech) ──────────────────────────────────────────────────
const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'pt-BR';
    utter.rate = 0.95;
    utter.pitch = 1.05;
    // Prefer a Brazilian Portuguese voice if available
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang === 'pt-BR') || voices.find(v => v.lang.startsWith('pt'));
    if (ptVoice) utter.voice = ptVoice;
    window.speechSynthesis.speak(utter);
};

type Step =
    | 'LOADING'
    | 'NOT_FOUND'
    | 'WELCOME'
    | 'PHONE'
    | 'CONFIRM_CLIENT'
    | 'NAME'
    | 'EQUIP_TYPE'
    | 'EQUIP_BRAND'
    | 'EQUIP_MODEL'
    | 'PROBLEM'
    | 'CONFIRM'
    | 'SUCCESS';

interface TenantConfig { id: string; storeName: string; subdomain: string; }
interface KioskData {
    nome: string;
    telefone: string;
    clientId?: string;
    equipType: string;
    equipBrand: string;
    equipModel: string;
    problem: string;
}

const EQUIP_TYPES = [
    { label: 'Celular', icon: '📱' },
    { label: 'Notebook', icon: '💻' },
    { label: 'MacBook', icon: '🍎' },
    { label: 'Tablet', icon: '📲' },
    { label: 'Desktop', icon: '🖥️' },
    { label: 'Outros', icon: '🔧' },
];

const BRANDS: Record<string, string[]> = {
    Celular:   ['Samsung', 'Apple', 'Motorola', 'Xiaomi', 'LG', 'Positivo', 'Outro'],
    Notebook:  ['Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Samsung', 'Outro'],
    MacBook:   ['Apple'],
    Tablet:    ['Apple', 'Samsung', 'Lenovo', 'Positivo', 'Outro'],
    Desktop:   ['Dell', 'HP', 'Lenovo', 'Asus', 'Positivo', 'Outro'],
    Outros:    ['Outro'],
};

const PROBLEMS: Record<string, string[]> = {
    Celular:  ['Tela quebrada', 'Não liga', 'Bateria fraca', 'Molhou', 'Câmera com defeito', 'Não carrega', 'Travando/lento', 'Outro'],
    Notebook: ['Não liga', 'Tela quebrada', 'Teclado/touchpad', 'Muito lento', 'Bateria fraca', 'Molhou', 'Superaquecendo', 'Outro'],
    MacBook:  ['Não liga', 'Tela quebrada', 'Teclado/touchpad', 'Muito lento', 'Bateria fraca', 'Molhou', 'Outro'],
    Tablet:   ['Tela quebrada', 'Não liga', 'Bateria fraca', 'Molhou', 'Não carrega', 'Outro'],
    Desktop:  ['Não liga', 'Sem imagem', 'Muito lento', 'Travando', 'Superaquecendo', 'Barulho estranho', 'Outro'],
    Outros:   ['Não liga', 'Com defeito', 'Outro'],
};

// ── Estilos compartilhados ────────────────────────────────────────────────

const BG = '#0a0a0f';
const CARD = 'rgba(255,255,255,0.04)';
const BORDER = 'rgba(255,255,255,0.08)';
const ACCENT = '#6366f1';
const ACCENT2 = '#818cf8';
const TEXT = '#f1f5f9';
const MUTED = 'rgba(255,255,255,0.4)';

const fullPage: React.CSSProperties = {
    minHeight: '100dvh', width: '100vw', background: BG,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '24px', color: TEXT, fontFamily: 'system-ui, -apple-system, sans-serif',
    boxSizing: 'border-box',
};

const card: React.CSSProperties = {
    width: '100%', maxWidth: '520px',
    background: CARD, border: `1px solid ${BORDER}`,
    borderRadius: '24px', padding: '40px 32px',
    display: 'flex', flexDirection: 'column', gap: '24px',
};

const title: React.CSSProperties = {
    fontSize: '28px', fontWeight: 800, color: TEXT, lineHeight: 1.2,
};

const subtitle: React.CSSProperties = {
    fontSize: '16px', color: MUTED, marginTop: '-12px',
};

const bigBtn = (active = true, secondary = false): React.CSSProperties => ({
    padding: '18px 32px', borderRadius: '16px', border: 'none',
    fontSize: '18px', fontWeight: 700, cursor: active ? 'pointer' : 'not-allowed',
    background: secondary ? CARD : `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
    border: secondary ? `1px solid ${BORDER}` : 'none',
    color: active ? '#fff' : 'rgba(255,255,255,0.3)',
    transition: 'all 0.15s', width: '100%',
    opacity: active ? 1 : 0.5,
});

const gridBtn = (selected = false): React.CSSProperties => ({
    padding: '20px 12px', borderRadius: '14px', border: `1px solid ${selected ? ACCENT : BORDER}`,
    background: selected ? `${ACCENT}22` : CARD,
    color: selected ? ACCENT2 : TEXT,
    fontSize: '15px', fontWeight: selected ? 700 : 500,
    cursor: 'pointer', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '8px', transition: 'all 0.15s',
});

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '18px 20px', fontSize: '20px', borderRadius: '14px',
    border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.03)',
    color: TEXT, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
};

const backBtn: React.CSSProperties = {
    background: 'none', border: 'none', color: MUTED, fontSize: '16px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 0', alignSelf: 'flex-start',
};

// ── Componente principal ──────────────────────────────────────────────────

export const Kiosk: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [step, setStep] = useState<Step>('LOADING');
    const [tenant, setTenant] = useState<TenantConfig | null>(null);
    const [data, setData] = useState<KioskData>({
        nome: '', telefone: '', equipType: '', equipBrand: '', equipModel: '', problem: '',
    });
    const [foundName, setFoundName] = useState('');
    const [protocol, setProtocol] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(12);
    const [muted, setMuted] = useState(false);
    const phoneRef = useRef<HTMLInputElement>(null);
    const nameRef = useRef<HTMLInputElement>(null);
    const modelRef = useRef<HTMLInputElement>(null);

    const say = useCallback((text: string) => {
        if (!muted) speak(text);
    }, [muted]);

    // Load tenant on mount
    useEffect(() => {
        if (!slug) { setStep('NOT_FOUND'); return; }
        axios.get(`${BASE_URL}/kiosk/public/${slug}`)
            .then(r => { setTenant(r.data); setStep('WELCOME'); })
            .catch(() => setStep('NOT_FOUND'));
    }, [slug]);

    // Voz em cada etapa
    useEffect(() => {
        if (muted) return;
        const hour = new Date().getHours();
        const greet = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
        const msgs: Partial<Record<Step, string>> = {
            WELCOME:         `${greet}! Toque no botão para iniciar seu atendimento.`,
            PHONE:           'Digite o número do seu WhatsApp.',
            CONFIRM_CLIENT:  `Encontramos seu cadastro. ${foundName}, é você?`,
            NAME:            'Qual é o seu nome completo?',
            EQUIP_TYPE:      'Qual é o tipo do aparelho?',
            EQUIP_BRAND:     'Qual é a marca do aparelho?',
            EQUIP_MODEL:     'Qual é o modelo?',
            PROBLEM:         'Descreva o problema do aparelho.',
            CONFIRM:         'Confira os dados. Está tudo correto?',
        };
        if (msgs[step]) speak(msgs[step]!);
    }, [step, muted]);

    // Auto-focus inputs
    useEffect(() => {
        if (step === 'PHONE') setTimeout(() => phoneRef.current?.focus(), 200);
        if (step === 'NAME') setTimeout(() => nameRef.current?.focus(), 200);
        if (step === 'EQUIP_MODEL') setTimeout(() => modelRef.current?.focus(), 200);
    }, [step]);

    // Countdown after success → reset
    useEffect(() => {
        if (step !== 'SUCCESS') return;
        setCountdown(12);
        const interval = setInterval(() => setCountdown(c => c - 1), 1000);
        const timeout = setTimeout(() => resetKiosk(), 12000);
        return () => { clearInterval(interval); clearTimeout(timeout); };
    }, [step]);

    const resetKiosk = () => {
        setData({ nome: '', telefone: '', equipType: '', equipBrand: '', equipModel: '', problem: '' });
        setFoundName('');
        setProtocol('');
        setError('');
        setStep('WELCOME');
    };

    const formatPhone = (val: string) => {
        const d = val.replace(/\D/g, '').slice(0, 11);
        if (d.length > 6) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
        if (d.length > 2) return `(${d.slice(0,2)}) ${d.slice(2)}`;
        return d;
    };

    // PHONE step — search client
    const handlePhoneNext = async () => {
        const digits = data.telefone.replace(/\D/g, '');
        if (digits.length < 10) { setError('Digite um número válido'); return; }
        setError('');
        setLoading(true);
        try {
            const res = await axios.post(`${BASE_URL}/kiosk/public/${slug}/identify`, { telefone: data.telefone });
            if (res.data.found) {
                setFoundName(res.data.nome);
                setData(d => ({ ...d, clientId: res.data.clientId }));
                setStep('CONFIRM_CLIENT');
            } else {
                setStep('NAME');
            }
        } catch {
            setError('Erro ao buscar cliente. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    // EQUIP_TYPE step — auto-skip brand if only one option
    const handleEquipType = (type: string) => {
        const brands = BRANDS[type] || ['Outro'];
        if (brands.length === 1) {
            setData(d => ({ ...d, equipType: type, equipBrand: brands[0] }));
            setStep('EQUIP_MODEL');
        } else {
            setData(d => ({ ...d, equipType: type, equipBrand: '' }));
            setStep('EQUIP_BRAND');
        }
    };

    // PROBLEM — quick select + fill textarea
    const handleQuickProblem = (p: string) => {
        setData(d => ({ ...d, problem: p === 'Outro' ? '' : p }));
    };

    // CONFIRM → submit
    const handleOpenOS = async () => {
        setError('');
        setLoading(true);
        try {
            const res = await axios.post(`${BASE_URL}/kiosk/public/${slug}/open-os`, data);
            const proto = res.data.protocol as string;
            setProtocol(proto);
            setStep('SUCCESS');
            // Lê o protocolo em voz separando os dígitos para ficar mais claro
            if (!muted) {
                const digits = proto.replace('-', '... ').split('').join(' ');
                setTimeout(() => speak(`Pronto! Sua ordem de serviço foi aberta. O número do protocolo é... ${digits}. Aguarde ser chamado.`), 400);
            }
        } catch (e: any) {
            setError(e.response?.data?.message || 'Erro ao abrir OS. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    // Botão mudo fixo no canto
    const MuteBtn = () => (
        <button
            onClick={() => { setMuted(m => !m); window.speechSynthesis?.cancel(); }}
            title={muted ? 'Ativar voz' : 'Silenciar'}
            style={{
                position: 'fixed', bottom: '20px', right: '20px', zIndex: 999,
                width: '48px', height: '48px', borderRadius: '50%',
                background: muted ? 'rgba(255,255,255,0.08)' : `${ACCENT}33`,
                border: `1px solid ${muted ? BORDER : ACCENT}`,
                color: muted ? MUTED : ACCENT2,
                fontSize: '22px', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
            }}
        >
            {muted ? '🔇' : '🔊'}
        </button>
    );

    // ── LOADING ──────────────────────────────────────────────────
    if (step === 'LOADING') {
        return (
            <div style={fullPage}>
                <div style={{ width: '40px', height: '40px', border: `3px solid ${ACCENT}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        );
    }

    // ── NOT FOUND ─────────────────────────────────────────────────
    if (step === 'NOT_FOUND') {
        return (
            <div style={fullPage}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <div style={{ ...title, textAlign: 'center' }}>Loja não encontrada</div>
                <div style={{ ...subtitle, textAlign: 'center', marginTop: '8px' }}>
                    Verifique se o endereço está correto.
                </div>
                <MuteBtn />
            </div>
        );
    }

    // ── WELCOME ───────────────────────────────────────────────────
    if (step === 'WELCOME') {
        const hour = new Date().getHours();
        const greet = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
        return (
            <div style={{ ...fullPage, gap: '40px', textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '20px',
                        background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '36px', fontWeight: 900, color: '#fff',
                        boxShadow: `0 20px 60px ${ACCENT}44`,
                    }}>
                        {tenant?.storeName?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '1px', color: TEXT }}>
                        {tenant?.storeName?.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '14px', color: MUTED }}>ASSISTÊNCIA TÉCNICA</div>
                </div>

                <div>
                    <div style={{ fontSize: '48px', fontWeight: 800, color: TEXT }}>{greet}!</div>
                    <div style={{ fontSize: '20px', color: MUTED, marginTop: '8px' }}>
                        Toque abaixo para iniciar seu atendimento
                    </div>
                </div>

                <button
                    onClick={() => setStep('PHONE')}
                    style={{
                        background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
                        border: 'none', borderRadius: '24px',
                        padding: '32px 64px', fontSize: '28px', fontWeight: 700, color: '#fff',
                        cursor: 'pointer', boxShadow: `0 20px 60px ${ACCENT}44`,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                        transition: 'transform 0.1s',
                    }}
                    onTouchStart={e => e.currentTarget.style.transform = 'scale(0.96)'}
                    onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <span style={{ fontSize: '48px' }}>👆</span>
                    INICIAR ATENDIMENTO
                </button>
            </div>
            <MuteBtn />
        );
    }

    // ── PHONE ─────────────────────────────────────────────────────
    if (step === 'PHONE') {
        return (
            <div style={fullPage}>
                <div style={card}>
                    <button style={backBtn} onClick={() => setStep('WELCOME')}>← Voltar</button>
                    <div style={title}>📱 Qual é o seu<br />WhatsApp?</div>
                    <div style={subtitle}>Vamos verificar se você já é cadastrado</div>

                    <input
                        ref={phoneRef}
                        type="tel"
                        inputMode="numeric"
                        placeholder="(00) 00000-0000"
                        value={data.telefone}
                        onChange={e => {
                            setError('');
                            setData(d => ({ ...d, telefone: formatPhone(e.target.value) }));
                        }}
                        onKeyDown={e => e.key === 'Enter' && handlePhoneNext()}
                        style={{ ...inputStyle, letterSpacing: '2px' }}
                    />

                    {error && <div style={{ color: '#f87171', fontSize: '15px' }}>{error}</div>}

                    <button
                        disabled={loading || data.telefone.replace(/\D/g,'').length < 10}
                        onClick={handlePhoneNext}
                        style={bigBtn(!loading && data.telefone.replace(/\D/g,'').length >= 10)}
                    >
                        {loading ? 'Buscando...' : 'CONTINUAR →'}
                    </button>
                </div>
            </div>
            <MuteBtn />
        );
    }

    // ── CONFIRM CLIENT ────────────────────────────────────────────
    if (step === 'CONFIRM_CLIENT') {
        return (
            <div style={fullPage}>
                <div style={card}>
                    <div style={{ fontSize: '48px', textAlign: 'center' }}>👋</div>
                    <div style={{ ...title, textAlign: 'center' }}>Encontramos você!</div>
                    <div style={{
                        padding: '24px', background: `${ACCENT}11`, border: `1px solid ${ACCENT}33`,
                        borderRadius: '16px', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '13px', color: MUTED, marginBottom: '4px' }}>Nome cadastrado</div>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: TEXT }}>{foundName}</div>
                    </div>
                    <div style={{ ...subtitle, textAlign: 'center' }}>É você mesmo?</div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => setStep('EQUIP_TYPE')}
                            style={{ ...bigBtn(), flex: 1 }}
                        >
                            ✅ Sim, sou eu
                        </button>
                        <button
                            onClick={() => {
                                setData(d => ({ ...d, clientId: undefined }));
                                setStep('NAME');
                            }}
                            style={{ ...bigBtn(true, true), flex: 1 }}
                        >
                            ❌ Não
                        </button>
                    </div>
                </div>
            </div>
            <MuteBtn />
        );
    }

    // ── NAME ──────────────────────────────────────────────────────
    if (step === 'NAME') {
        return (
            <div style={fullPage}>
                <div style={card}>
                    <button style={backBtn} onClick={() => setStep('PHONE')}>← Voltar</button>
                    <div style={title}>👤 Qual é o seu<br />nome completo?</div>

                    <input
                        ref={nameRef}
                        type="text"
                        placeholder="Ex: Maria da Silva"
                        value={data.nome}
                        onChange={e => setData(d => ({ ...d, nome: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && data.nome.trim().length > 2 && setStep('EQUIP_TYPE')}
                        style={inputStyle}
                    />

                    <button
                        disabled={data.nome.trim().length < 3}
                        onClick={() => setStep('EQUIP_TYPE')}
                        style={bigBtn(data.nome.trim().length >= 3)}
                    >
                        CONTINUAR →
                    </button>
                </div>
            </div>
            <MuteBtn />
        );
    }

    // ── EQUIP TYPE ────────────────────────────────────────────────
    if (step === 'EQUIP_TYPE') {
        return (
            <div style={fullPage}>
                <div style={card}>
                    <button style={backBtn} onClick={() => setStep(data.clientId ? 'CONFIRM_CLIENT' : 'NAME')}>← Voltar</button>
                    <div style={title}>🔧 Qual é o<br />aparelho?</div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        {EQUIP_TYPES.map(t => (
                            <button
                                key={t.label}
                                onClick={() => handleEquipType(t.label)}
                                style={gridBtn(data.equipType === t.label)}
                            >
                                <span style={{ fontSize: '28px' }}>{t.icon}</span>
                                <span>{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <MuteBtn />
        );
    }

    // ── EQUIP BRAND ───────────────────────────────────────────────
    if (step === 'EQUIP_BRAND') {
        const brands = BRANDS[data.equipType] || ['Outro'];
        return (
            <div style={fullPage}>
                <div style={card}>
                    <button style={backBtn} onClick={() => setStep('EQUIP_TYPE')}>← Voltar</button>
                    <div style={title}>🏷️ Qual a marca?</div>
                    <div style={{ fontSize: '14px', color: MUTED }}>{data.equipType}</div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                        {brands.map(b => (
                            <button
                                key={b}
                                onClick={() => { setData(d => ({ ...d, equipBrand: b })); setStep('EQUIP_MODEL'); }}
                                style={gridBtn(data.equipBrand === b)}
                            >
                                <span style={{ fontSize: '22px', fontWeight: 700 }}>{b}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <MuteBtn />
        );
    }

    // ── EQUIP MODEL ───────────────────────────────────────────────
    if (step === 'EQUIP_MODEL') {
        return (
            <div style={fullPage}>
                <div style={card}>
                    <button style={backBtn} onClick={() => setStep(BRANDS[data.equipType]?.length === 1 ? 'EQUIP_TYPE' : 'EQUIP_BRAND')}>← Voltar</button>
                    <div style={title}>📋 Qual o modelo?</div>
                    <div style={{ fontSize: '14px', color: MUTED }}>{data.equipType} · {data.equipBrand}</div>

                    <input
                        ref={modelRef}
                        type="text"
                        placeholder={data.equipType === 'Celular' ? 'Ex: Galaxy A54, iPhone 12' : 'Ex: Inspiron 15, IdeaPad 3'}
                        value={data.equipModel}
                        onChange={e => setData(d => ({ ...d, equipModel: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && data.equipModel.trim().length > 1 && setStep('PROBLEM')}
                        style={inputStyle}
                    />
                    <div style={{ fontSize: '13px', color: MUTED }}>Se não souber o modelo exato, escreva o que souber</div>

                    <button
                        disabled={data.equipModel.trim().length < 2}
                        onClick={() => setStep('PROBLEM')}
                        style={bigBtn(data.equipModel.trim().length >= 2)}
                    >
                        CONTINUAR →
                    </button>
                </div>
            </div>
            <MuteBtn />
        );
    }

    // ── PROBLEM ───────────────────────────────────────────────────
    if (step === 'PROBLEM') {
        const probs = PROBLEMS[data.equipType] || PROBLEMS.Outros;
        return (
            <div style={{ ...fullPage, justifyContent: 'flex-start', paddingTop: '32px' }}>
                <div style={{ ...card, maxHeight: 'calc(100dvh - 64px)', overflow: 'auto' }}>
                    <button style={backBtn} onClick={() => setStep('EQUIP_MODEL')}>← Voltar</button>
                    <div style={title}>💬 Qual é o problema?</div>
                    <div style={{ fontSize: '14px', color: MUTED }}>{data.equipBrand} {data.equipModel}</div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {probs.map(p => (
                            <button
                                key={p}
                                onClick={() => handleQuickProblem(p)}
                                style={{
                                    padding: '10px 18px', borderRadius: '100px',
                                    border: `1px solid ${data.problem === p ? ACCENT : BORDER}`,
                                    background: data.problem === p ? `${ACCENT}22` : CARD,
                                    color: data.problem === p ? ACCENT2 : TEXT,
                                    fontSize: '15px', fontWeight: data.problem === p ? 700 : 400,
                                    cursor: 'pointer', transition: 'all 0.15s',
                                }}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    <textarea
                        placeholder="Descreva com mais detalhes (opcional)..."
                        value={data.problem}
                        onChange={e => setData(d => ({ ...d, problem: e.target.value }))}
                        rows={4}
                        style={{
                            ...inputStyle, resize: 'none', fontSize: '16px',
                            fontFamily: 'inherit', lineHeight: 1.6,
                        }}
                    />

                    <button
                        disabled={data.problem.trim().length < 3}
                        onClick={() => setStep('CONFIRM')}
                        style={bigBtn(data.problem.trim().length >= 3)}
                    >
                        CONTINUAR →
                    </button>
                </div>
            </div>
            <MuteBtn />
        );
    }

    // ── CONFIRM ───────────────────────────────────────────────────
    if (step === 'CONFIRM') {
        const rows: [string, string][] = [
            ['Cliente', data.nome || foundName],
            ['Telefone', data.telefone],
            ['Aparelho', `${data.equipBrand} ${data.equipModel}`],
            ['Tipo', data.equipType],
            ['Problema', data.problem],
        ];
        return (
            <div style={fullPage}>
                <div style={card}>
                    <button style={backBtn} onClick={() => setStep('PROBLEM')}>← Voltar</button>
                    <div style={title}>✅ Confirme<br />os dados</div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {rows.map(([label, value]) => (
                            <div key={label} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                padding: '14px 16px', background: CARD, borderRadius: '12px',
                                border: `1px solid ${BORDER}`, gap: '12px',
                            }}>
                                <span style={{ fontSize: '13px', color: MUTED, whiteSpace: 'nowrap' }}>{label}</span>
                                <span style={{ fontSize: '15px', fontWeight: 600, textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
                            </div>
                        ))}
                    </div>

                    {error && <div style={{ color: '#f87171', fontSize: '15px' }}>{error}</div>}

                    <button
                        disabled={loading}
                        onClick={handleOpenOS}
                        style={bigBtn(!loading)}
                    >
                        {loading ? 'Abrindo OS...' : '🚀 ABRIR ORDEM DE SERVIÇO'}
                    </button>
                </div>
            </div>
            <MuteBtn />
        );
    }

    // ── SUCCESS ───────────────────────────────────────────────────
    if (step === 'SUCCESS') {
        return (
            <div style={{ ...fullPage, gap: '32px', textAlign: 'center' }}>
                <div style={{
                    width: '100px', height: '100px', borderRadius: '50%',
                    background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '48px',
                }}>
                    ✅
                </div>

                <div>
                    <div style={{ fontSize: '36px', fontWeight: 800, color: TEXT }}>OS Aberta!</div>
                    <div style={{ fontSize: '16px', color: MUTED, marginTop: '8px' }}>
                        Aguarde ser chamado pelo técnico
                    </div>
                </div>

                <div style={{
                    padding: '28px 40px', background: CARD, border: `1px solid ${BORDER}`,
                    borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '8px',
                }}>
                    <div style={{ fontSize: '14px', color: MUTED }}>Número do protocolo</div>
                    <div style={{
                        fontSize: '40px', fontWeight: 900, letterSpacing: '4px',
                        color: ACCENT2, fontVariantNumeric: 'tabular-nums',
                    }}>
                        {protocol}
                    </div>
                </div>

                <div style={{ fontSize: '16px', color: MUTED }}>
                    Anote o número acima para acompanhar seu atendimento
                </div>

                {/* Countdown bar */}
                <div style={{ width: '100%', maxWidth: '320px' }}>
                    <div style={{ fontSize: '13px', color: MUTED, marginBottom: '8px', textAlign: 'center' }}>
                        Reiniciando em {countdown}s...
                    </div>
                    <div style={{ height: '4px', background: BORDER, borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', background: ACCENT2, borderRadius: '2px',
                            width: `${(countdown / 12) * 100}%`, transition: 'width 1s linear',
                        }} />
                    </div>
                </div>

                <button onClick={resetKiosk} style={{ ...bigBtn(true, true), maxWidth: '320px' }}>
                    Novo Atendimento
                </button>
            </div>
            <MuteBtn />
        );
    }

    return null;
};
