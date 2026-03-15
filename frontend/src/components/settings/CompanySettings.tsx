import React, { useState, useEffect } from 'react';
import { Building2, Save, MapPin, Phone } from 'lucide-react';
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
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        setLocalData({
            company_name: settings.company_name || '',
            company_fantasy_name: settings.company_fantasy_name || '',
            company_cnpj: settings.company_cnpj || '',
            company_ie: settings.company_ie || '',
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

    const handleSaveAll = async () => {
        try {
            setLoading(true);
            const promises = Object.entries(localData).map(([key, value]) =>
                api.put(`/settings/${key}`, { value: String(value) })
            );
            await Promise.all(promises);

            // Notify parent
            for (const [key, value] of Object.entries(localData)) {
                await onSave(key, String(value));
            }

            setMessage({ type: 'success', text: 'Dados da empresa salvos com sucesso!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Erro ao salvar dados.' });
        } finally {
            setLoading(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '10px 12px', borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
        color: '#fff', fontSize: '14px', outline: 'none',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '6px'
    };

    const sectionTitleStyle: React.CSSProperties = {
        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px',
        fontWeight: 600, color: '#fff', marginBottom: '16px', marginTop: '8px'
    };

    return (
        <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0 }}>Cadastro da Empresa</h3>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>
                        Informações completas para emissão de documentos e notas fiscais.
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
                    <Save size={16} /> {loading ? 'Salvando...' : 'Salvar Dados'}
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

            <div style={{ display: 'grid', gap: '32px' }}>

                {/* Identificação */}
                <section>
                    <div style={sectionTitleStyle}>
                        <Building2 size={18} color="#3b82f6" /> Identificação
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={labelStyle}>Razão Social</label>
                            <input type="text" value={localData.company_name} onChange={e => setLocalData({ ...localData, company_name: e.target.value })} style={inputStyle} placeholder="Nome oficial da empresa" />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={labelStyle}>Nome Fantasia</label>
                            <input type="text" value={localData.company_fantasy_name} onChange={e => setLocalData({ ...localData, company_fantasy_name: e.target.value })} style={inputStyle} placeholder="Nome comercial" />
                        </div>
                        <div>
                            <label style={labelStyle}>CNPJ</label>
                            <input type="text" value={localData.company_cnpj} onChange={e => setLocalData({ ...localData, company_cnpj: e.target.value })} style={inputStyle} placeholder="00.000.000/0000-00" />
                        </div>
                        <div>
                            <label style={labelStyle}>Inscrição Estadual (IE)</label>
                            <input type="text" value={localData.company_ie} onChange={e => setLocalData({ ...localData, company_ie: e.target.value })} style={inputStyle} placeholder="Isento ou Nº" />
                        </div>
                    </div>
                </section>

                {/* Contato */}
                <section>
                    <div style={sectionTitleStyle}>
                        <Phone size={18} color="#10b981" /> Contato
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Telefone / WhatsApp</label>
                            <input type="text" value={localData.company_phone} onChange={e => setLocalData({ ...localData, company_phone: e.target.value })} style={inputStyle} placeholder="(00) 00000-0000" />
                        </div>
                        <div>
                            <label style={labelStyle}>E-mail</label>
                            <input type="email" value={localData.company_email} onChange={e => setLocalData({ ...localData, company_email: e.target.value })} style={inputStyle} placeholder="contato@empresa.com" />
                        </div>
                    </div>
                </section>

                {/* Endereço */}
                <section>
                    <div style={sectionTitleStyle}>
                        <MapPin size={18} color="#ef4444" /> Endereço
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '16px' }}>
                        <div style={{ gridColumn: 'span 3' }}>
                            <label style={labelStyle}>CEP</label>
                            <input type="text" value={localData.company_address_zip} onChange={e => setLocalData({ ...localData, company_address_zip: e.target.value })} style={inputStyle} placeholder="00000-000" />
                        </div>
                        <div style={{ gridColumn: 'span 6' }}>
                            <label style={labelStyle}>Rua / Logradouro</label>
                            <input type="text" value={localData.company_address_street} onChange={e => setLocalData({ ...localData, company_address_street: e.target.value })} style={inputStyle} />
                        </div>
                        <div style={{ gridColumn: 'span 3' }}>
                            <label style={labelStyle}>Número</label>
                            <input type="text" value={localData.company_address_number} onChange={e => setLocalData({ ...localData, company_address_number: e.target.value })} style={inputStyle} />
                        </div>
                        <div style={{ gridColumn: 'span 4' }}>
                            <label style={labelStyle}>Complemento</label>
                            <input type="text" value={localData.company_address_complement} onChange={e => setLocalData({ ...localData, company_address_complement: e.target.value })} style={inputStyle} />
                        </div>
                        <div style={{ gridColumn: 'span 4' }}>
                            <label style={labelStyle}>Bairro</label>
                            <input type="text" value={localData.company_address_neighborhood} onChange={e => setLocalData({ ...localData, company_address_neighborhood: e.target.value })} style={inputStyle} />
                        </div>
                        <div style={{ gridColumn: 'span 3' }}>
                            <label style={labelStyle}>Cidade</label>
                            <input type="text" value={localData.company_address_city} onChange={e => setLocalData({ ...localData, company_address_city: e.target.value })} style={inputStyle} />
                        </div>
                        <div style={{ gridColumn: 'span 1' }}>
                            <label style={labelStyle}>UF</label>
                            <input type="text" value={localData.company_address_state} onChange={e => setLocalData({ ...localData, company_address_state: e.target.value })} style={inputStyle} maxLength={2} />
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
};
