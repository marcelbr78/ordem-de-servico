import React, { useState, useEffect } from 'react';
import { Save, Printer, FileText, Type, Eye, Layout, Monitor } from 'lucide-react';
import api from '../../services/api';
interface PrintFields {
    showDefect: boolean;
    showItemDescription: boolean;
    showFinancials: boolean;
    showSignatures: boolean;
    showChecklist: boolean;
    showTechnicalReport: boolean;
    showEstimatedValue: boolean;
    compactHeader: boolean;
}

interface PrintingSettingsProps {
    settings: Record<string, string>;
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
    const [activeSubTab, setActiveSubTab] = useState<'general' | 'detailed'>('general');
    const [targetVia, setTargetVia] = useState<'client' | 'store' | 'term'>('client');

    const defaultFields: PrintFields = {
        showDefect: true,
        showItemDescription: true,
        showFinancials: true,
        showSignatures: true,
        showChecklist: true,
        showTechnicalReport: true,
        showEstimatedValue: true,
        compactHeader: false
    };

    const [fields, setFields] = useState<Record<'client' | 'store' | 'term', PrintFields>>({
        client: { ...defaultFields },
        store: { ...defaultFields },
        term: { ...defaultFields, showFinancials: false, showDefect: false, showTechnicalReport: true }
    });

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

        // Parse detailed fields
        try {
            const f = {
                client: settings.print_fields_client ? JSON.parse(settings.print_fields_client) : { ...defaultFields },
                store: settings.print_fields_store ? JSON.parse(settings.print_fields_store) : { ...defaultFields },
                term: settings.print_fields_term ? JSON.parse(settings.print_fields_term) : { ...defaultFields, showFinancials: false, showDefect: false }
            };
            setFields(f);
        } catch (e) {
            console.error('Error parsing print fields:', e);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

            // Save detailed fields
            await api.put('/settings/print_fields_client', { value: JSON.stringify(fields.client) });
            await api.put('/settings/print_fields_store', { value: JSON.stringify(fields.store) });
            await api.put('/settings/print_fields_term', { value: JSON.stringify(fields.term) });

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

    const getSubTabStyle = (active: boolean): React.CSSProperties => ({
        padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
        border: active ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
        background: active ? 'rgba(99,102,241,0.1)' : 'transparent',
        color: active ? 'var(--primary)' : 'rgba(255,255,255,0.5)',
        display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
    });

    const updateField = (via: 'client' | 'store' | 'term', field: keyof PrintFields, val: boolean) => {
        setFields(prev => ({
            ...prev,
            [via]: { ...prev[via], [field]: val }
        }));
    };

    return (
        <div style={{ ...glassBg, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0 }}>Preferências de Impressão</h3>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>
                        Defina o formato, textos e quais campos aparecem em cada via.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <button onClick={() => setActiveSubTab('general')} style={getSubTabStyle(activeSubTab === 'general')}><Monitor size={14} /> Geral</button>
                        <button onClick={() => setActiveSubTab('detailed')} style={getSubTabStyle(activeSubTab === 'detailed')}><Layout size={14} /> Layout por Via</button>
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
                        <Save size={16} /> {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
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

            {activeSubTab === 'general' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

                    {/* Format Selection */}
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <Printer size={20} color="#3b82f6" />
                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#fff' }}>Formato do Papel</h4>
                        </div>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {[
                                { id: 'a4', label: 'A4 Padrão (Técnico)', desc: 'Layout completo. Ideal para impressoras jato de tinta/laser.' },
                                { id: '80mm', label: 'Térmica 80mm', desc: 'Layout estreito. Para impressoras de cupom.' },
                                { id: '58mm', label: 'Térmica 58mm', desc: 'Layout compacto. Para mini impressoras.' }
                            ].map(opt => (
                                <label key={opt.id} style={{
                                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                                    padding: '12px', borderRadius: '8px', cursor: 'pointer',
                                    background: format === opt.id ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                                    border: format === opt.id ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.05)',
                                    transition: 'all 0.2s'
                                }}>
                                    <input type="radio" name="print_format" value={opt.id} checked={format === opt.id} onChange={(e) => setFormat(e.target.value)} style={{ marginTop: '4px' }} />
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '14px', color: format === opt.id ? '#60a5fa' : '#fff' }}>{opt.label}</div>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{opt.desc}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Text & Header */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                <Type size={20} color="#a855f7" />
                                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#fff' }}>Informações da Empresa</h4>
                            </div>
                            <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
                                {[
                                    { id: 'fantasy', label: 'Usar Nome Fantasia', value: useFantasy, setter: setUseFantasy },
                                    { id: 'cnpj', label: 'Mostrar CNPJ/IE', value: showCNPJ, setter: setShowCNPJ },
                                    { id: 'addr', label: 'Mostrar Endereço', value: showAddress, setter: setShowAddress },
                                    { id: 'phone', label: 'Mostrar Telefone', value: showPhone, setter: setShowPhone },
                                ].map(opt => (
                                    <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <input type="checkbox" checked={opt.value} onChange={e => opt.setter(e.target.checked)} />
                                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                            <label style={labelStyle}>Título (Opcional)</label>
                            <input type="text" value={headerText} onChange={(e) => setHeaderText(e.target.value)} placeholder="Ex: COMPROVANTE" style={inputStyle} />
                        </div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <FileText size={20} color="#10b981" />
                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#fff' }}>Rodapé Geral (A4)</h4>
                        </div>
                        <textarea value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="Termos gerais..." style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} />
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px' }}>
                    {/* Select Via & Toggles */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                            {(['client', 'store', 'term'] as const).map(v => (
                                <button key={v} onClick={() => setTargetVia(v)} style={{
                                    flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: targetVia === v ? 'var(--primary)' : 'transparent',
                                    color: targetVia === v ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                                }}>
                                    {v === 'client' ? 'Via Cliente' : v === 'store' ? 'Via Loja' : 'Termo Entrega'}
                                </button>
                            ))}
                        </div>

                        <div style={{ ...glassBg, background: 'rgba(0,0,0,0.2)', padding: '20px', border: '1px solid rgba(255,255,255,0.05)', display: 'grid', gap: '12px' }}>
                            <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Campos Visíveis</h4>
                            {[
                                { id: 'showDefect', label: 'Defeito Relatado' },
                                { id: 'showChecklist', label: 'Checklist de Entrada' },
                                { id: 'showTechnicalReport', label: 'Laudo/Relatório Técnico' },
                                { id: 'showItemDescription', label: 'Descrição dos Itens (Peças/Ser.)' },
                                { id: 'showEstimatedValue', label: 'Valor Estimado' },
                                { id: 'showFinancials', label: 'Valores Finais e Total' },
                                { id: 'showSignatures', label: 'Linhas de Assinatura' },
                                { id: 'compactHeader', label: 'Cabeçalho Compacto' },
                            ].map((f) => (
                                <label key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                                    <span style={{ fontSize: '13px', color: '#fff' }}>{f.label}</span>
                                    <div style={{ position: 'relative', width: '36px', height: '20px' }}>
                                        <input
                                            type="checkbox"
                                            checked={fields[targetVia][f.id as keyof PrintFields]}
                                            onChange={e => updateField(targetVia, f.id as keyof PrintFields, e.target.checked)}
                                            style={{ appearance: 'none', width: '36px', height: '20px', background: fields[targetVia][f.id as keyof PrintFields] ? 'var(--primary)' : 'rgba(255,255,255,0.1)', borderRadius: '20px', cursor: 'pointer', transition: '0.2s' }}
                                        />
                                        <div style={{ position: 'absolute', top: '2px', left: fields[targetVia][f.id as keyof PrintFields] ? '18px' : '2px', width: '16px', height: '16px', background: '#fff', borderRadius: '50%', transition: '0.2s', pointerEvents: 'none' }} />
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* LIVE PREVIEW */}
                    <div style={{ ...glassBg, background: 'rgba(255,255,255,0.02)', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto', maxHeight: '700px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'rgba(255,255,255,0.3)', fontSize: '12px', textTransform: 'uppercase', fontWeight: 700 }}>
                            <Eye size={14} /> Pré-visualização Inteligente
                        </div>

                        {/* Mock Paper */}
                        <div style={{
                            width: format === 'a4' ? '100%' : '300px',
                            maxWidth: '600px',
                            background: '#fff',
                            color: '#000',
                            padding: '24px',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                            fontFamily: 'Arial, sans-serif',
                            fontSize: '11px',
                            lineHeight: '1.4'
                        }}>
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '10px' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: fields[targetVia].compactHeader ? '14px' : '18px' }}>{useFantasy ? 'MINHA LOJA FANTASIA' : 'MINHA EMPRESA LTDA'}</div>
                                    <div style={{ fontSize: '10px', color: '#666' }}>{showAddress && 'Rua Exemplo, 123 - Centro'}</div>
                                    <div style={{ fontSize: '10px', color: '#666' }}>{showPhone && 'Tel: (11) 99999-9999'}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{targetVia === 'term' ? 'TERMO DE ENTREGA' : headerText || 'ORDEM DE SERVIÇO'}</div>
                                    <div style={{ fontWeight: 'bold' }}>Nº 2024001</div>
                                </div>
                            </div>

                            {/* Client */}
                            <div style={{ marginBottom: '10px', border: '1px solid #eee', padding: '5px' }}>
                                <strong>Cliente:</strong> João da Silva • <strong>CPF:</strong> 123.456.789-00
                            </div>

                            {/* Equipment */}
                            <div style={{ marginBottom: '10px' }}>
                                <div style={{ background: '#f5f5f5', padding: '3px 8px', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>EQUIPAMENTO</div>
                                <div style={{ padding: '8px', border: '1px solid #ddd', borderTop: 'none' }}>
                                    <strong>iPhone 13 Pro Max</strong> (Verde) • SN: G6TZ...
                                    {fields[targetVia].showDefect && <div style={{ marginTop: '4px' }}><strong>Defeito:</strong> Não liga / Tela quebrada</div>}
                                    {fields[targetVia].showChecklist && <div style={{ marginTop: '4px', fontSize: '9px', color: '#666' }}>Checklist: [✓] Tela [✓] Bateria [X] Touch</div>}
                                </div>
                            </div>

                            {/* Technical Report */}
                            {fields[targetVia].showTechnicalReport && (
                                <div style={{ marginBottom: '10px' }}>
                                    <div style={{ background: '#f5f5f5', padding: '3px 8px', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>LAUDO TÉCNICO</div>
                                    <div style={{ padding: '8px', border: '1px solid #ddd', borderTop: 'none' }}>Substituído módulo de display original e bateria. Testado e OK.</div>
                                </div>
                            )}

                            {/* Items */}
                            {fields[targetVia].showFinancials && (
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
                                    <thead>
                                        <tr style={{ background: '#f5f5f5' }}>
                                            <th style={{ border: '1px solid #ddd', textAlign: 'left', padding: '4px' }}>Item</th>
                                            <th style={{ border: '1px solid #ddd', textAlign: 'right', padding: '4px' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style={{ border: '1px solid #ddd', padding: '4px' }}>
                                                Tela iPhone 13 Pro
                                                {fields[targetVia].showItemDescription && <div style={{ fontSize: '9px', color: '#888' }}>Peça original com 90 dias de garantia</div>}
                                            </td>
                                            <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'right' }}>R$ 1.200,00</td>
                                        </tr>
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ fontWeight: 'bold' }}>
                                            <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'right' }}>TOTAL:</td>
                                            <td style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'right' }}>R$ 1.200,00</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            )}

                            {/* Values only */}
                            {fields[targetVia].showEstimatedValue && !fields[targetVia].showFinancials && (
                                <div style={{ marginBottom: '10px', textAlign: 'right' }}><strong>Valor Estimado:</strong> R$ 1.200,00</div>
                            )}

                            {/* Signatures */}
                            {fields[targetVia].showSignatures && (
                                <div style={{ display: 'flex', gap: '20px', marginTop: '40px' }}>
                                    <div style={{ flex: 1, borderTop: '1px solid #000', textAlign: 'center', paddingTop: '5px', fontSize: '9px' }}>ASSINATURA DO CLIENTE</div>
                                    <div style={{ flex: 1, borderTop: '1px solid #000', textAlign: 'center', paddingTop: '5px', fontSize: '9px' }}>ASSINATURA TÉCNICA</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
