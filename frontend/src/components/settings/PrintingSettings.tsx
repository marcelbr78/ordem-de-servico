import React, { useState, useEffect } from 'react';
import { Save, Printer, FileText, Type } from 'lucide-react';
import api from '../../services/api';

interface PrintingSettingsProps {
    settings: any;
    onSave: (key: string, value: string) => Promise<void>;
}

export const PrintingSettings: React.FC<PrintingSettingsProps> = ({ settings, onSave }) => {
    const [format, setFormat] = useState(settings.print_format || 'a4');
    const [headerText, setHeaderText] = useState(settings.print_header_text || '');
    const [footerText, setFooterText] = useState(settings.print_footer_text || '');
    const [showCNPJ, setShowCNPJ] = useState(settings.print_show_cnpj !== 'false');
    const [showAddress, setShowAddress] = useState(settings.print_show_address !== 'false');
    const [showPhone, setShowPhone] = useState(settings.print_show_phone !== 'false');
    const [showEmail, setShowEmail] = useState(settings.print_show_email !== 'false');
    const [useFantasy, setUseFantasy] = useState(settings.print_use_fantasy_name === 'true');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Update local state when prop changes (e.g. initial load)
    useEffect(() => {
        if (settings.print_format) setFormat(settings.print_format);
        if (settings.print_header_text) setHeaderText(settings.print_header_text);
        if (settings.print_footer_text) setFooterText(settings.print_footer_text);
        setShowCNPJ(settings.print_show_cnpj !== 'false');
        setShowAddress(settings.print_show_address !== 'false');
        setShowPhone(settings.print_show_phone !== 'false');
        setShowEmail(settings.print_show_email !== 'false');
        setUseFantasy(settings.print_use_fantasy_name === 'true');
    }, [settings]);

    const handleSaveAll = async () => {
        try {
            setLoading(true);
            await api.put('/settings/print_format', { value: format });
            await api.put('/settings/print_header_text', { value: headerText });
            await api.put('/settings/print_footer_text', { value: footerText });
            await api.put('/settings/print_show_cnpj', { value: String(showCNPJ) });
            await api.put('/settings/print_show_address', { value: String(showAddress) });
            await api.put('/settings/print_show_phone', { value: String(showPhone) });
            await api.put('/settings/print_show_email', { value: String(showEmail) });
            await api.put('/settings/print_use_fantasy_name', { value: String(useFantasy) });

            // Notify parent to update its state
            await onSave('print_format', format);
            await onSave('print_header_text', headerText);
            await onSave('print_footer_text', footerText);
            await onSave('print_show_cnpj', String(showCNPJ));
            await onSave('print_show_address', String(showAddress));
            await onSave('print_show_phone', String(showPhone));
            await onSave('print_show_email', String(showEmail));
            await onSave('print_use_fantasy_name', String(useFantasy));

            setMessage({ type: 'success', text: 'Configurações de impressão salvas!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Erro ao salvar configurações.' });
        } finally {
            setLoading(false);
        }
    };

    const glassBg = {
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '10px 12px', borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
        color: '#fff', fontSize: '14px', outline: 'none',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '6px'
    };

    return (
        <div style={{ ...glassBg, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0 }}>Preferências de Impressão</h3>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>
                        Defina o formato do papel e textos padrão para seus documentos.
                    </p>
                </div>
                <button
                    onClick={handleSaveAll}
                    disabled={loading}
                    style={{
                        padding: '10px 20px', borderRadius: '10px', border: 'none',
                        background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
                        color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    <Save size={16} /> {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            {message && (
                <div style={{
                    marginBottom: '20px', padding: '12px 16px', borderRadius: '10px', fontSize: '14px',
                    background: message.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: message.type === 'success' ? '#10b981' : '#ef4444',
                    border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}30`
                }}>
                    {message.text}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

                {/* Format Selection */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <Printer size={20} color="#3b82f6" />
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#fff' }}>Formato do Papel</h4>
                    </div>

                    <div style={{ display: 'grid', gap: '12px' }}>
                        {[
                            { id: 'a4', label: 'A4 Padrão (Técnico)', desc: 'Layout completo com grades e bordas. Ideal para impressoras jato de tinta/laser.' },
                            { id: '80mm', label: 'Térmica 80mm (Cupom)', desc: 'Layout estreito (aprox. 8cm). Ideal para impressoras de cupom não fiscal.' },
                            { id: '58mm', label: 'Térmica 58mm (Mini)', desc: 'Layout super compacto (aprox. 5.8cm). Para mini impressoras portáteis.' }
                        ].map(opt => (
                            <label key={opt.id} style={{
                                display: 'flex', alignItems: 'flex-start', gap: '12px',
                                padding: '12px', borderRadius: '8px', cursor: 'pointer',
                                background: format === opt.id ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                                border: format === opt.id ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.05)',
                                transition: 'all 0.2s'
                            }}>
                                <input
                                    type="radio"
                                    name="print_format"
                                    value={opt.id}
                                    checked={format === opt.id}
                                    onChange={(e) => setFormat(e.target.value)}
                                    style={{ marginTop: '4px' }}
                                />
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '14px', color: format === opt.id ? '#60a5fa' : '#fff' }}>{opt.label}</div>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px', lineHeight: '1.4' }}>{opt.desc}</div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Text Customization */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Header Text */}
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <Type size={20} color="#a855f7" />
                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#fff' }}>Textos Personalizados</h4>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Título do Cabeçalho (Opcional)</label>
                            <input
                                type="text"
                                value={headerText}
                                onChange={(e) => setHeaderText(e.target.value)}
                                placeholder="Ex: COMPROVANTE DE ENTRADA"
                                style={inputStyle}
                            />
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                                Se vazio, usará "ORDEM DE SERVIÇO" ou "TERMO DE GARANTIA".
                            </p>
                        </div>

                        <div>
                            <label style={labelStyle}>Rodapé (Apenas A4)</label>
                            <textarea
                                value={footerText}
                                onChange={(e) => setFooterText(e.target.value)}
                                placeholder="Texto legal ou aviso no rodapé da página..."
                                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                            />
                        </div>
                    </div>

                    {/* Visibility Toggles */}
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <FileText size={20} color="#10b981" />
                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#fff' }}>O que mostrar na OS?</h4>
                        </div>

                        <div style={{ display: 'grid', gap: '12px' }}>
                            {[
                                { id: 'fantasy', label: 'Usar Nome Fantasia no topo', value: useFantasy, setter: setUseFantasy },
                                { id: 'cnpj', label: 'Mostrar CNPJ / IE', value: showCNPJ, setter: setShowCNPJ },
                                { id: 'addr', label: 'Mostrar Endereço Completo', value: showAddress, setter: setShowAddress },
                                { id: 'phone', label: 'Mostrar Telefone / WhatsApp', value: showPhone, setter: setShowPhone },
                                { id: 'email', label: 'Mostrar E-mail', value: showEmail, setter: setShowEmail },
                            ].map(opt => (
                                <label key={opt.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                                    padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <input type="checkbox" checked={opt.value} onChange={e => opt.setter(e.target.checked)} />
                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Preview Note */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 600 }}>
                            <FileText size={16} /> Nota sobre Impressão
                        </div>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.5' }}>
                            Ao alterar o formato, o sistema ajustará automaticamente o layout ao clicar em "Imprimir" na tela de detalhes da OS.
                            Certifique-se de selecionar a impressora correta e o tamanho de papel correspondente nas configurações do sistema operacional ao imprimir.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
};
