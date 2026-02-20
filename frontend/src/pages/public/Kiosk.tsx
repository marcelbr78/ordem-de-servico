import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { User, Phone, FileText, CheckCircle, ArrowRight, ArrowLeft, MapPin } from 'lucide-react';

type Step = 'WELCOME' | 'FORM' | 'SUCCESS';

export const Kiosk: React.FC = () => {
    const [step, setStep] = useState<Step>('WELCOME');
    const [greeting, setGreeting] = useState('');

    // Form State
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [cpf, setCpf] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Address State
    const [cep, setCep] = useState('');
    const [rua, setRua] = useState('');
    const [numero, setNumero] = useState('');
    const [complemento, setComplemento] = useState('');
    const [bairro, setBairro] = useState('');
    const [cidade, setCidade] = useState('');
    const [estado, setEstado] = useState('');
    const [cepLoading, setCepLoading] = useState(false);
    const [aceitaNotificacoes, setAceitaNotificacoes] = useState(true);

    const handleCepChange = async (val: string) => {
        const digits = val.replace(/\D/g, '');
        // Mask 00000-000
        let formatted = digits;
        if (digits.length > 5) formatted = `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
        setCep(formatted);

        if (digits.length === 8) {
            setCepLoading(true);
            try {
                // Use backend proxy to avoid CORS/Mixed Content/SSL issues on old devices
                const res = await api.get(`/clients/public/cep/${digits}`);
                const data = res.data;

                if (!data.erro) {
                    setRua(data.logradouro || '');
                    setBairro(data.bairro || '');
                    setCidade(data.localidade || '');
                    setEstado(data.uf || '');
                    // Focus number field?
                }
            } catch (err) {
                console.error(err);
            } finally {
                setCepLoading(false);
            }
        }
    };

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Bom dia');
        else if (hour < 18) setGreeting('Boa tarde');
        else setGreeting('Boa noite');
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.post('/clients/public/register', {
                nome,
                telefone,
                cpf: cpf || undefined,
                cep: cep.replace(/\D/g, '') || undefined,
                rua: rua || undefined,
                numero: numero || undefined,
                complemento: complemento || undefined,
                bairro: bairro || undefined,
                cidade: cidade || undefined,
                estado: estado || undefined,
                observacoes: aceitaNotificacoes ? 'Cliente aceitou receber notificações via WhatsApp no cadastro.' : 'Cliente NÃO aceitou receber notificações.',
            });
            setStep('SUCCESS');
            // Reset form
            setNome('');
            setTelefone('');
            setCpf('');
            setCep('');
            setRua('');
            setNumero('');
            setComplemento('');
            setBairro('');
            setCidade('');
            setEstado('');
            setAceitaNotificacoes(true);
            // Auto reset after 5 seconds
            setTimeout(() => setStep('WELCOME'), 5000);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Erro ao realizar cadastro. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 11) val = val.slice(0, 11);
        // Mask (99) 99999-9999
        if (val.length > 2) val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
        if (val.length > 9) val = `${val.slice(0, 9)}-${val.slice(9)}`;
        setTelefone(val);
    };

    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 11) val = val.slice(0, 11);
        // Mask 999.999.999-99
        if (val.length > 3) val = `${val.slice(0, 3)}.${val.slice(3)}`;
        if (val.length > 7) val = `${val.slice(0, 7)}.${val.slice(7)}`;
        if (val.length > 11) val = `${val.slice(0, 11)}-${val.slice(11)}`;
        setCpf(val);
    };

    if (step === 'WELCOME') {
        return (
            <div style={{
                minHeight: '100vh', width: '100vw', background: 'linear-gradient(135deg, #14532d 0%, #052e16 100%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '40px', textAlign: 'center', color: '#fff'
            }}>
                <div style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '16px', background: 'rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: 'bold'
                    }}>
                        I
                    </div>
                    <div>
                        <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '1px' }}>INFOSEND</h2>
                        <span style={{ fontSize: '14px', opacity: 0.7 }}>ASSISTÊNCIA TÉCNICA</span>
                    </div>
                </div>

                <h1 style={{ fontSize: '48px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>
                    {greeting}!
                </h1>
                <p style={{ fontSize: '24px', color: 'rgba(255,255,255,0.6)', marginBottom: '80px' }}>
                    Seja bem-vindo(a) à nossa assistência.
                </p>

                <button
                    onClick={() => setStep('FORM')}
                    style={{
                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                        border: 'none', borderRadius: '24px',
                        padding: '40px 80px',
                        fontSize: '32px', fontWeight: 700, color: '#fff',
                        cursor: 'pointer',
                        boxShadow: '0 20px 50px rgba(20, 83, 45, 0.5)',
                        transition: 'transform 0.2s',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <User size={64} />
                    FAZER CADASTRO
                </button>

                <p style={{ marginTop: '40px', color: 'rgba(255,255,255,0.3)', fontSize: '18px' }}>
                    Toque no botão acima para começar
                </p>

                <div style={{
                    marginTop: 'auto', paddingTop: '40px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    color: 'rgba(255,255,255,0.5)', fontSize: '16px'
                }}>
                    <MapPin size={20} />
                    <span>Rua Amazonas, 550 - Blumenau</span>
                </div>
            </div>
        );
    }

    if (step === 'SUCCESS') {
        return (
            <div style={{
                height: '100vh', width: '100vw', background: '#14532d',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '40px', textAlign: 'center'
            }}>
                <div style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '1px', color: '#fff' }}>INFOSEND</h2>
                </div>

                <div style={{
                    width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px'
                }}>
                    <CheckCircle size={64} color="#22c55e" />
                </div>

                <h1 style={{ fontSize: '42px', fontWeight: 800, color: '#fff', marginBottom: '24px' }}>
                    Cadastro Realizado!
                </h1>
                <p style={{ fontSize: '24px', color: 'rgba(255,255,255,0.6)' }}>
                    Obrigado por se cadastrar.<br />Um atendente irá chamá-lo em breve.
                </p>

                <div style={{ marginTop: '80px', width: '100%', maxWidth: '400px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#4ade80', animation: 'progress 5s linear forwards' }} />
                </div>

                <style>{`
                    @keyframes progress {
                        from { width: 100%; }
                        to { width: 0%; }
                    }
                `}</style>
            </div>
        );
    }

    // FORM STEP
    return (
        <div style={{
            minHeight: '100vh', width: '100vw', background: '#14532d',
            display: 'flex', flexDirection: 'column',
            padding: '40px' // Added padding for better safe area
        }}>
            <button
                onClick={() => setStep('WELCOME')}
                style={{
                    alignSelf: 'flex-start', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)',
                    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', padding: '16px', marginBottom: '20px'
                }}
            >
                <ArrowLeft size={24} /> Voltar
            </button>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '600px', width: '100%', margin: '0 auto', overflowY: 'auto', paddingRight: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#fff' }}>
                        Seus Dados
                    </h2>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 'bold' }}>INFOSEND</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '40px', fontSize: '18px' }}>
                    Preencha para agilizar seu atendimento
                </p>

                {error && (
                    <div style={{
                        padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#ef4444', borderRadius: '12px', marginBottom: '24px', fontSize: '18px'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
                    <div>
                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '8px', fontSize: '18px' }}>Seu Nome Completo</label>
                        <div style={{ position: 'relative' }}>
                            <User size={24} style={{ position: 'absolute', left: '16px', top: '20px', color: 'rgba(255,255,255,0.4)' }} />
                            <input
                                required
                                value={nome}
                                onChange={e => setNome(e.target.value)}
                                placeholder="Ex: João Silva"
                                style={{
                                    width: '100%', padding: '20px 20px 20px 56px', fontSize: '20px', borderRadius: '16px',
                                    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                                    color: '#fff', outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '8px', fontSize: '18px' }}>Seu WhatsApp</label>
                        <div style={{ position: 'relative' }}>
                            <Phone size={24} style={{ position: 'absolute', left: '16px', top: '20px', color: 'rgba(255,255,255,0.4)' }} />
                            <input
                                required
                                value={telefone}
                                onChange={handlePhoneChange}
                                placeholder="(00) 00000-0000"
                                maxLength={15}
                                style={{
                                    width: '100%', padding: '20px 20px 20px 56px', fontSize: '20px', borderRadius: '16px',
                                    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                                    color: '#fff', outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', marginBottom: '8px', fontSize: '18px' }}>CPF (Opcional)</label>
                        <div style={{ position: 'relative' }}>
                            <FileText size={24} style={{ position: 'absolute', left: '16px', top: '20px', color: 'rgba(255,255,255,0.4)' }} />
                            <input
                                value={cpf}
                                onChange={handleCpfChange}
                                placeholder="000.000.000-00"
                                maxLength={14}
                                style={{
                                    width: '100%', padding: '20px 20px 20px 56px', fontSize: '20px', borderRadius: '16px',
                                    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                                    color: '#fff', outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Endereço (Opcional)
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', marginBottom: '4px', fontSize: '14px' }}>CEP</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        value={cep}
                                        onChange={e => handleCepChange(e.target.value)}
                                        placeholder="00000-000"
                                        maxLength={9}
                                        style={{
                                            width: '100%', padding: '16px', fontSize: '16px', borderRadius: '12px',
                                            border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                                            color: '#fff', outline: 'none'
                                        }}
                                    />
                                    {cepLoading && <span style={{ position: 'absolute', right: 12, top: 18, color: '#fff' }}>⏳</span>}
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', marginBottom: '4px', fontSize: '14px' }}>Rua</label>
                                <input
                                    value={rua}
                                    onChange={e => setRua(e.target.value)}
                                    placeholder="Rua, Av..."
                                    style={{
                                        width: '100%', padding: '16px', fontSize: '16px', borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                                        color: '#fff', outline: 'none'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', marginBottom: '4px', fontSize: '14px' }}>Número</label>
                                <input
                                    value={numero}
                                    onChange={e => setNumero(e.target.value)}
                                    placeholder="Nº"
                                    style={{
                                        width: '100%', padding: '16px', fontSize: '16px', borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                                        color: '#fff', outline: 'none'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', marginBottom: '4px', fontSize: '14px' }}>Bairro</label>
                                <input
                                    value={bairro}
                                    onChange={e => setBairro(e.target.value)}
                                    placeholder="Bairro"
                                    style={{
                                        width: '100%', padding: '16px', fontSize: '16px', borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                                        color: '#fff', outline: 'none'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', marginBottom: '4px', fontSize: '14px' }}>Cidade</label>
                                <input
                                    value={cidade}
                                    onChange={e => setCidade(e.target.value)}
                                    placeholder="Cidade"
                                    style={{
                                        width: '100%', padding: '16px', fontSize: '16px', borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                                        color: '#fff', outline: 'none'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', marginBottom: '4px', fontSize: '14px' }}>UF</label>
                                <input
                                    value={estado}
                                    onChange={e => setEstado(e.target.value)}
                                    placeholder="UF"
                                    maxLength={2}
                                    style={{
                                        width: '100%', padding: '16px', fontSize: '16px', borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                                        color: '#fff', outline: 'none', textTransform: 'uppercase'
                                    }}
                                />
                            </div>
                        </div>

                    </div>

                    <div style={{ marginBottom: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                            <input
                                type="checkbox"
                                checked={aceitaNotificacoes}
                                onChange={e => setAceitaNotificacoes(e.target.checked)}
                                style={{ width: '24px', height: '24px', cursor: 'pointer', accentColor: '#22c55e' }}
                            />
                            <span style={{ fontSize: '18px', color: '#fff' }}>Aceito receber notificações e atualizações pelo WhatsApp</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: '24px',
                            background: loading ? 'rgba(74, 222, 128, 0.5)' : '#22c55e',
                            border: 'none', borderRadius: '16px',
                            padding: '24px',
                            fontSize: '20px', fontWeight: 700, color: '#fff',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'
                        }}
                    >
                        {loading ? 'Cadastrando...' : (
                            <>
                                FINALIZAR <ArrowRight size={24} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
