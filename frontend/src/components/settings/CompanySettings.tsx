import React, { useState, useEffect } from 'react';
import { Building2, Save, Search, Loader2 } from 'lucide-react';
import api from '../../services/api';

interface CompanySettingsProps {
    settings: Record<string, string>;
    onSave: (key: string, value: string) => Promise<void>;
}

export const CompanySettings: React.FC<CompanySettingsProps> = ({ settings, onSave }) => {
    const [localData, setLocalData] = useState({
        company_name: '',
        company_fantasy_name: '',
        company_cnpj: '',
        company_ie: '',
        company_im: '',
        company_ibge: '',
        company_phone: '',
        company_email: '',
        company_address_street: '',
        company_address_number: '',
        company_address_complement: '',
        company_address_neighborhood: '',
        company_address_city: '',
        company_address_state: '',
        company_address_zip: '',
    });
    const [loading, setLoading] = useState(false);
    const [cnpjLoading, setCnpjLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        setLocalData({
            company_name: settings.company_name || '',
            company_fantasy_name: settings.company_fantasy_name || '',
            company_cnpj: settings.company_cnpj || '',
            company_ie: settings.company_ie || '',
            company_im: settings.company_im || '',
            company_ibge: settings.company_ibge || '',
            company_phone: settings.company_phone || '',
            company_email: settings.company_email || '',
            company_address_street: settings.company_address_street || '',
            company_address_number: settings.company_address_number || '',
            company_address_complement: settings.company_address_complement || '',
            company_address_neighborhood: settings.company_address_neighborhood || '',
            company_address_city: settings.company_address_city || '',
            company_address_state: settings.company_address_state || '',
            company_address_zip: settings.company_address_zip || '',
        });
    }, [settings]);

    const set = (key: string, value: string) => setLocalData(prev => ({ ...prev, [key]: value }));

    const formatCnpj = (value: string) => {
        const d = value.replace(/\D/g, '').slice(0, 14);
        return d
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2');
    };

    const fetchCnpj = async () => {
        const digits = localData.company_cnpj.replace(/\D/g, '');
        if (digits.length !== 14) return;
        try {
            setCnpjLoading(true);
            const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setLocalData(prev => ({
                ...prev,
                company_name: data.razao_social || prev.company_name,
                company_fantasy_name: data.nome_fantasia || prev.company_fantasy_name,
                company_phone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1.slice(0,2)}) ${data.ddd_telefone_1.slice(2)}` : prev.company_phone,
                company_address_street: data.logradouro || prev.company_address_street,
                company_address_number: data.numero || prev.company_address_number,
                company_address_complement: data.complemento || prev.company_address_complement,
                company_address_neighborhood: data.bairro || prev.company_address_neighborhood,
                company_address_city: data.municipio || prev.company_address_city,
                company_address_state: data.uf || prev.company_address_state,
                company_address_zip: data.cep?.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2') || prev.company_address_zip,
                company_ibge: data.codigo_municipio_ibge ? String(data.codigo_municipio_ibge) : prev.company_ibge,
            }));
            setMessage({ type: 'success', text: 'Dados preenchidos automaticamente!' });
            setTimeout(() => setMessage(null), 3000);
        } catch {
            setMessage({ type: 'error', text: 'CNPJ não encontrado ou inválido.' });
            setTimeout(() => setMessage(null), 3000);
        } finally {
            setCnpjLoading(false);
        }
    };

    const handleSaveAll = async () => {
        try {
            setLoading(true);
            const promises = Object.entries(localData).map(([key, value]) =>
                api.put(`/settings/${key}`, { value: String(value) })
            );
            await Promise.all(promises);
            // Atualiza estado local do pai para cada chave
            for (const [key, value] of Object.entries(localData)) {
                onSave(key, String(value)).catch(() => {});
            }
            setMessage({ type: 'success', text: 'Dados salvos com sucesso!' });
            setTimeout(() => setMessage(null), 3000);
        } catch {
            setMessage({ type: 'error', text: 'Erro ao salvar dados.' });
        } finally {
            setLoading(false);
        }
    };

    // ── styles ──
    const card: React.CSSProperties = {
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '24px',
    };

    const inp: React.CSSProperties = {
        width: '100%',
        padding: '10px 12px',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.05)',
        color: '#fff',
        fontSize: '14px',
        outline: 'none',
        boxSizing: 'border-box',
    };

    const lbl: React.CSSProperties = {
        display: 'block',
        fontSize: '11px',
        fontWeight: 600,
        color: 'rgba(255,255,255,0.45)',
        letterSpacing: '0.6px',
        textTransform: 'uppercase',
        marginBottom: '5px',
    };

    const Field = ({ label, children }: { label: string, children: React.ReactNode }) => (
        <div>
            <label style={lbl}>{label}</label>
            {children}
        </div>
    );

    return (
        <div style={card}>
            <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Building2 size={20} color="#3b82f6" />
                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>Dados da Empresa (Emitente Fiscal)</span>
                </div>
                <button
                    onClick={handleSaveAll}
                    disabled={loading}
                    style={{
                        padding: '9px 18px', borderRadius: '8px', border: 'none',
                        background: 'linear-gradient(135deg, var(--primary,#6366f1), #7c3aed)',
                        color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '13px', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '7px',
                        opacity: loading ? 0.7 : 1,
                    }}
                >
                    <Save size={15} /> {loading ? 'Salvando...' : 'Salvar Dados'}
                </button>
            </div>

            {message && (
                <div style={{
                    marginBottom: '18px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px',
                    background: message.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: message.type === 'success' ? '#10b981' : '#ef4444',
                    border: `1px solid ${message.type === 'success' ? '#10b98130' : '#ef444430'}`,
                }}>
                    {message.text}
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* CNPJ — linha única full width */}
                <div>
                    <label style={lbl}>CNPJ — Digite para preencher automaticamente</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            value={localData.company_cnpj}
                            onChange={e => set('company_cnpj', formatCnpj(e.target.value))}
                            onBlur={fetchCnpj}
                            style={{ ...inp, flex: 1 }}
                            placeholder="00.000.000/0000-00"
                            maxLength={18}
                        />
                        <button
                            onClick={fetchCnpj}
                            disabled={cnpjLoading || localData.company_cnpj.replace(/\D/g, '').length !== 14}
                            style={{
                                padding: '0 20px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.5)',
                                background: 'rgba(99,102,241,0.15)', color: '#818cf8',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px',
                                fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap',
                                opacity: (cnpjLoading || localData.company_cnpj.replace(/\D/g, '').length !== 14) ? 0.4 : 1,
                            }}
                        >
                            {cnpjLoading
                                ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                : <Search size={14} />}
                            {cnpjLoading ? 'Buscando...' : 'Buscar'}
                        </button>
                    </div>
                </div>

                {/* Razão Social | Nome Fantasia | IE | IM */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', gap: '12px' }}>
                    <Field label="Razão Social">
                        <input type="text" value={localData.company_name} onChange={e => set('company_name', e.target.value)} style={inp} placeholder="Nome oficial" />
                    </Field>
                    <Field label="Nome Fantasia">
                        <input type="text" value={localData.company_fantasy_name} onChange={e => set('company_fantasy_name', e.target.value)} style={inp} placeholder="Nome comercial" />
                    </Field>
                    <Field label="Inscr. Estadual (IE)">
                        <input type="text" value={localData.company_ie} onChange={e => set('company_ie', e.target.value)} style={inp} placeholder="Inscrição Estadual" />
                    </Field>
                    <Field label="Inscr. Municipal (IM)">
                        <input type="text" value={localData.company_im} onChange={e => set('company_im', e.target.value)} style={inp} placeholder="Inscrição Municipal" />
                    </Field>
                </div>

                {/* Telefone | Email */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                    <Field label="Telefone">
                        <input type="text" value={localData.company_phone} onChange={e => set('company_phone', e.target.value)} style={inp} placeholder="(00) 00000-0000" />
                    </Field>
                    <Field label="E-mail">
                        <input type="email" value={localData.company_email} onChange={e => set('company_email', e.target.value)} style={inp} placeholder="contato@empresa.com" />
                    </Field>
                </div>

                {/* Separador endereço */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '4px' }}>
                    <span style={{ ...lbl, color: 'rgba(255,255,255,0.3)' }}>Endereço</span>
                </div>

                {/* Logradouro | Número | Bairro | Município | UF | CEP */}
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr 2fr 0.6fr 1fr', gap: '12px' }}>
                    <Field label="Logradouro">
                        <input type="text" value={localData.company_address_street} onChange={e => set('company_address_street', e.target.value)} style={inp} />
                    </Field>
                    <Field label="Número">
                        <input type="text" value={localData.company_address_number} onChange={e => set('company_address_number', e.target.value)} style={inp} />
                    </Field>
                    <Field label="Bairro">
                        <input type="text" value={localData.company_address_neighborhood} onChange={e => set('company_address_neighborhood', e.target.value)} style={inp} />
                    </Field>
                    <Field label="Município">
                        <input type="text" value={localData.company_address_city} onChange={e => set('company_address_city', e.target.value)} style={inp} />
                    </Field>
                    <Field label="UF">
                        <input type="text" value={localData.company_address_state} onChange={e => set('company_address_state', e.target.value)} style={inp} maxLength={2} />
                    </Field>
                    <Field label="CEP">
                        <input type="text" value={localData.company_address_zip} onChange={e => set('company_address_zip', e.target.value)} style={inp} placeholder="00000-000" />
                    </Field>
                </div>

                {/* Complemento | Código IBGE */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <Field label="Complemento">
                        <input type="text" value={localData.company_address_complement} onChange={e => set('company_address_complement', e.target.value)} style={inp} />
                    </Field>
                    <Field label="Código IBGE">
                        <input type="text" value={localData.company_ibge} onChange={e => set('company_ibge', e.target.value)} style={inp} placeholder="0000000" />
                    </Field>
                </div>

            </div>
        </div>
    );
};
