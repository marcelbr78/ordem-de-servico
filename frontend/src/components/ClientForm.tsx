
import { useState, useCallback } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { CountrySelect, DDIS } from './CountrySelect';
import { CustomSelect } from './CustomSelect';

interface Contact {
    id?: string;
    tipo: 'whatsapp' | 'telefone' | 'recados';
    numero: string;
    principal: boolean;
}

interface Address {
    cep: string;
    rua: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
}

interface FormData {
    tipo: 'PF' | 'PJ';
    nome: string;
    nomeFantasia: string;
    cpfCnpj: string;
    email: string;
    contatos: Contact[];
    endereco: Address;
    observacoes: string;
}

interface ClientFormProps {
    initialData?: Partial<FormData>;
    isEdit?: boolean;
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
}

const ESTADOS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const splitPhone = (fullNumber: string) => {
    // 1. Remove tudo que não é dígito ou '+'
    let clean = fullNumber.replace(/[^\d+]/g, '');
    if (!clean) return { ddi: '+55', number: '' };

    // 2. Se o número começa com um DDI conhecido (com ou sem +)
    // Ordenamos os DDIs por tamanho decrescente para evitar casamentos parciais (ex: +3 associando antes de +351)
    const sortedDDIS = [...DDIS].sort((a, b) => b.code.length - a.code.length);

    // Tenta casar com '+' primeiro
    let ddiMatch = sortedDDIS.find(d => clean.startsWith(d.code));

    // Se não casou com '+', tenta casar sem o '+' (ex: '5511...')
    if (!ddiMatch) {
        ddiMatch = sortedDDIS.find(d => clean.startsWith(d.code.replace('+', '')));
    }

    if (ddiMatch) {
        const codeWithPlus = ddiMatch.code;
        const codeWithoutPlus = ddiMatch.code.replace('+', '');
        const number = clean.startsWith(codeWithPlus)
            ? clean.slice(codeWithPlus.length)
            : clean.slice(codeWithoutPlus.length);

        return { ddi: codeWithPlus, number };
    }

    // 3. Fallback: Se não detectou DDI, assume +55 se o número tiver cara de BR, ou apenas o número
    return { ddi: '+55', number: clean };
};

const formatCpfCnpj = (value: string, tipo: 'PF' | 'PJ'): string => {
    const digits = value.replace(/\D/g, '');
    if (tipo === 'PF') {
        return digits.replace(/(\d{3})(\d{3})?(\d{3})?(\d{2})?/, (_, a, b, c, d) =>
            [a, b, c].filter(Boolean).join('.') + (d ? `-${d}` : '')
        );
    }
    return digits.replace(/(\d{2})(\d{3})?(\d{3})?(\d{4})?(\d{2})?/, (_, a, b, c, d, e) =>
        [a, b, c].filter(Boolean).join('.') + (d ? `/${d}` : '') + (e ? `-${e}` : '')
    );
};

const formatCep = (value: string): string => {
    const d = value.replace(/\D/g, '');
    if (d.length <= 5) return d;
    return `${d.slice(0, 5)}-${d.slice(5, 8)}`;
};

const sectionStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px', padding: '20px', marginBottom: '16px',
};
const sectionTitleStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px',
    fontWeight: 600, color: 'var(--primary)', marginBottom: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px',
};
const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.6)', marginBottom: '4px' };
const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff',
    fontSize: '14px', outline: 'none', transition: 'border-color 0.2s',
};


const defaultAddress: Address = { cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' };

export default function ClientForm({ initialData, isEdit, onSubmit, onCancel, loading }: ClientFormProps) {
    const [form, setForm] = useState<FormData>({
        tipo: initialData?.tipo || 'PF',
        nome: initialData?.nome || '',
        nomeFantasia: initialData?.nomeFantasia || '',
        cpfCnpj: initialData?.cpfCnpj ? formatCpfCnpj(initialData.cpfCnpj, initialData.tipo || 'PF') : '',
        email: initialData?.email || '',
        contatos: initialData?.contatos?.length ? initialData.contatos : [{ tipo: 'whatsapp', numero: '', principal: true }],
        endereco: { ...defaultAddress, ...(initialData?.endereco || {}) },
        observacoes: initialData?.observacoes || '',
    });
    const [cepLoading, setCepLoading] = useState(false);
    const [cnpjLoading, setCnpjLoading] = useState(false);
    const [cepError, setCepError] = useState('');

    const updateField = useCallback((field: keyof FormData, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    }, []);

    const updateAddress = useCallback((field: keyof Address, value: string) => {
        setForm(prev => ({ ...prev, endereco: { ...prev.endereco, [field]: value } }));
    }, []);

    // ─── CEP Auto-fill via ViaCEP ────────────────────
    const handleCepChange = async (rawCep: string) => {
        const digits = rawCep.replace(/\D/g, '');
        updateAddress('cep', digits);
        setCepError('');
        if (digits.length === 8) {
            setCepLoading(true);
            try {
                const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setForm(prev => ({
                        ...prev,
                        endereco: {
                            ...prev.endereco,
                            cep: digits,
                            rua: data.logradouro || prev.endereco.rua,
                            bairro: data.bairro || prev.endereco.bairro,
                            cidade: data.localidade || prev.endereco.cidade,
                            estado: data.uf || prev.endereco.estado,
                        },
                    }));
                } else {
                    setCepError('CEP não encontrado');
                }
            } catch {
                setCepError('Erro ao buscar CEP');
            }
            setCepLoading(false);
        }
    };

    // ─── CNPJ Auto-fill via BrasilAPI ────────────────
    const handleCpfCnpjBlur = async () => {
        if (form.tipo !== 'PJ') return;
        const digits = form.cpfCnpj.replace(/\D/g, '');
        if (digits.length !== 14) return;
        setCnpjLoading(true);
        try {
            const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
            if (res.ok) {
                const data = await res.json();
                setForm(prev => ({
                    ...prev,
                    nome: prev.nome || data.razao_social || '',
                    nomeFantasia: prev.nomeFantasia || data.nome_fantasia || '',
                    endereco: {
                        ...prev.endereco,
                        cep: prev.endereco.cep || (data.cep || '').replace(/\D/g, ''),
                        rua: prev.endereco.rua || data.logradouro || '',
                        numero: prev.endereco.numero || data.numero || '',
                        complemento: prev.endereco.complemento || data.complemento || '',
                        bairro: prev.endereco.bairro || data.bairro || '',
                        cidade: prev.endereco.cidade || data.municipio || '',
                        estado: prev.endereco.estado || data.uf || '',
                    },
                }));
            }
        } catch { /* silently fail - CNPJ lookup is a "plus" */ }
        setCnpjLoading(false);
    };

    // ─── Contact Management ──────────────────────────
    const addContact = () => {
        const types: Array<'whatsapp' | 'telefone' | 'recados'> = ['whatsapp', 'telefone', 'recados'];
        const usedTypes = form.contatos.map(c => c.tipo);
        const nextType = types.find(t => !usedTypes.includes(t)) || 'telefone';
        updateField('contatos', [...form.contatos, { tipo: nextType, numero: '', principal: false }]);
    };

    const removeContact = (idx: number) => {
        if (form.contatos.length <= 1) return;
        const updated = form.contatos.filter((_, i) => i !== idx);
        if (!updated.some(c => c.principal) && updated.length > 0) updated[0].principal = true;
        updateField('contatos', updated);
    };

    const updateContact = (idx: number, field: keyof Contact, value: any) => {
        const updated = [...form.contatos];
        if (field === 'principal' && value === true) {
            updated.forEach(c => c.principal = false);
        }
        (updated[idx] as any)[field] = value;
        updateField('contatos', updated);
    };


    // ─── Submit ──────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cpfCnpjClean = form.cpfCnpj.replace(/\D/g, '');
        const payload: any = {
            tipo: form.tipo,
            nome: form.nome,
            cpfCnpj: cpfCnpjClean,
            email: form.email || undefined,
            observacoes: form.observacoes || undefined,
            cep: form.endereco.cep || undefined,
            rua: form.endereco.rua || undefined,
            numero: form.endereco.numero || undefined,
            complemento: form.endereco.complemento || undefined,
            bairro: form.endereco.bairro || undefined,
            cidade: form.endereco.cidade || undefined,
            estado: form.endereco.estado || undefined,
        };
        if (form.tipo === 'PJ') payload.nomeFantasia = form.nomeFantasia || undefined;

        const validContacts = form.contatos
            .filter(c => c.numero.replace(/[^\d+]/g, '').length >= 7)
            .map(c => ({
                id: c.id, // IMPORTANTE: Envia o ID para o backend sincronizar
                tipo: c.tipo,
                numero: c.numero.replace(/[^\d+]/g, ''),
                principal: c.principal,
            }));

        if (!isEdit && validContacts.length === 0) {
            alert('Adicione pelo menos um contato válido (mínimo 7 dígitos).');
            return;
        }

        payload.contatos = validContacts;
        await onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit} style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}>
            {/* ─── 🧍 Dados do Cliente ─── */}
            <div style={sectionStyle}>
                <div style={sectionTitleStyle}>🧍 Dados do Cliente</div>
                <div className="grid-responsive-2" style={{ marginBottom: '12px' }}>
                    <div>
                        <div style={labelStyle}>Tipo *</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {(['PF', 'PJ'] as const).map(t => (
                                <button key={t} type="button" onClick={() => { updateField('tipo', t); updateField('cpfCnpj', ''); }}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid',
                                        borderColor: form.tipo === t ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                        background: form.tipo === t ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                                        color: form.tipo === t ? 'var(--primary)' : 'rgba(255,255,255,0.5)',
                                        fontWeight: 600, cursor: isEdit ? 'not-allowed' : 'pointer', fontSize: '13px',
                                        opacity: (isEdit && form.tipo !== t) ? 0.5 : 1
                                    }} disabled={isEdit}>
                                    {t === 'PF' ? '👤 Pessoa Física' : '🏢 Pessoa Jurídica'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div style={labelStyle}>{form.tipo === 'PF' ? 'CPF' : 'CNPJ'} *</div>
                        <div style={{ position: 'relative' }}>
                            <input style={inputStyle} value={form.cpfCnpj} disabled={isEdit}
                                placeholder={form.tipo === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                                maxLength={form.tipo === 'PF' ? 14 : 18}
                                onChange={e => updateField('cpfCnpj', formatCpfCnpj(e.target.value, form.tipo))}
                                onBlur={handleCpfCnpjBlur}
                            />
                            {cnpjLoading && <span style={{ position: 'absolute', right: 12, top: 12, fontSize: '12px', color: 'var(--primary)' }}>Buscando...</span>}
                        </div>
                    </div>
                </div>
                <div className={form.tipo === 'PJ' ? "grid-responsive-3" : "grid-responsive-2"} style={{ marginBottom: '12px' }}>
                    <div>
                        <div style={labelStyle}>{form.tipo === 'PJ' ? 'Razão Social' : 'Nome Completo'} *</div>
                        <input style={inputStyle} value={form.nome} required
                            onChange={e => updateField('nome', e.target.value)}
                            placeholder={form.tipo === 'PJ' ? 'Razão Social da Empresa' : 'Nome completo do cliente'}
                        />
                    </div>
                    {form.tipo === 'PJ' && (
                        <div>
                            <div style={labelStyle}>Nome Fantasia</div>
                            <input style={inputStyle} value={form.nomeFantasia}
                                onChange={e => updateField('nomeFantasia', e.target.value)} placeholder="Nome Fantasia"
                            />
                        </div>
                    )}
                    <div>
                        <div style={labelStyle}>E-mail</div>
                        <input style={inputStyle} type="email" value={form.email}
                            onChange={e => updateField('email', e.target.value)} placeholder="email@exemplo.com"
                        />
                    </div>
                </div>
            </div>

            {/* ─── 📞 Contatos ─── */}
            <div style={sectionStyle}>
                <div style={sectionTitleStyle}>
                    <span>📞 Contatos</span>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 400, marginLeft: 'auto' }}>Mínimo 1 obrigatório</span>
                </div>
                {form.contatos.map((contact, idx) => (
                    <div key={idx} className="flex-wrap-mobile" style={{ alignItems: 'flex-end', marginBottom: '10px' }}>
                        <div style={{ minWidth: '160px', flex: 1 }}>
                            {idx === 0 && <div style={labelStyle}>Tipo</div>}
                            <CustomSelect
                                value={contact.tipo}
                                onChange={val => updateContact(idx, 'tipo', val)}
                                options={[
                                    { label: '📱 WhatsApp', value: 'whatsapp' },
                                    { label: '☎️ Telefone', value: 'telefone' },
                                    { label: '📝 Recados', value: 'recados' }
                                ]}
                            />
                        </div>

                        {/* DDI Selector */}
                        <div style={{ minWidth: '100px', flex: '0 0 120px' }}>
                            {idx === 0 && <div style={labelStyle}>País (DDI)</div>}
                            <CountrySelect
                                value={splitPhone(contact.numero).ddi}
                                onChange={val => {
                                    const { number } = splitPhone(contact.numero);
                                    updateContact(idx, 'numero', `${val}${number}`);
                                }}
                            />
                        </div>

                        <div style={{ flex: 2, minWidth: '200px' }}>
                            {idx === 0 && <div style={labelStyle}>Número (com DDD)</div>}
                            <input style={inputStyle}
                                value={splitPhone(contact.numero).number}
                                placeholder="Ex: 11 99999-9999"
                                onChange={e => {
                                    const { ddi } = splitPhone(contact.numero);
                                    const cleanNum = e.target.value.replace(/\D/g, '');
                                    updateContact(idx, 'numero', `${ddi}${cleanNum}`);
                                }}
                            />
                        </div>
                        <button type="button" onClick={() => updateContact(idx, 'principal', true)} title="Marcar como principal"
                            style={{
                                padding: '10px', borderRadius: '8px', border: '1px solid',
                                borderColor: contact.principal ? 'var(--warning)' : 'rgba(255,255,255,0.1)',
                                background: contact.principal ? 'rgba(245,158,11,0.15)' : 'transparent',
                                color: contact.principal ? 'var(--warning)' : 'rgba(255,255,255,0.3)', cursor: 'pointer',
                            }}>
                            <Star size={14} fill={contact.principal ? 'currentColor' : 'none'} />
                        </button>
                        {form.contatos.length > 1 && (
                            <button type="button" onClick={() => removeContact(idx)} title="Remover"
                                style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--danger)', cursor: 'pointer' }}>
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                ))}
                {form.contatos.length < 3 && (
                    <button type="button" onClick={addContact}
                        style={{
                            width: '100%', padding: '8px', borderRadius: '8px',
                            border: '1px dashed rgba(255,255,255,0.15)', background: 'transparent',
                            color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '13px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        }}>
                        + Adicionar contato
                    </button>
                )}
            </div>

            {/* ─── 📍 Endereço ─── */}
            <div style={sectionStyle}>
                <div style={sectionTitleStyle}>📍 Endereço</div>
                <div className="grid-responsive-3" style={{ marginBottom: '12px' }}>
                    <div>
                        <div style={labelStyle}>CEP</div>
                        <div style={{ position: 'relative' }}>
                            <input style={inputStyle} value={formatCep(form.endereco.cep)} placeholder="00000-000"
                                maxLength={9} onChange={e => handleCepChange(e.target.value)}
                            />
                            {cepLoading && <span style={{ position: 'absolute', right: 12, top: 12, fontSize: '12px', color: 'var(--primary)' }}>⏳</span>}
                        </div>
                        {cepError && <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{cepError}</span>}
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                        <div style={labelStyle}>Rua / Logradouro</div>
                        <input style={inputStyle} value={form.endereco.rua}
                            onChange={e => updateAddress('rua', e.target.value)} placeholder="Rua, Avenida, etc."
                        />
                    </div>
                </div>
                <div className="grid-responsive-4" style={{ marginBottom: '12px' }}>
                    <div>
                        <div style={labelStyle}>Número</div>
                        <input style={inputStyle} value={form.endereco.numero}
                            onChange={e => updateAddress('numero', e.target.value)} placeholder="Nº"
                        />
                    </div>
                    <div>
                        <div style={labelStyle}>Complemento</div>
                        <input style={inputStyle} value={form.endereco.complemento}
                            onChange={e => updateAddress('complemento', e.target.value)} placeholder="Apto, Sala..."
                        />
                    </div>
                    <div>
                        <div style={labelStyle}>Bairro</div>
                        <input style={inputStyle} value={form.endereco.bairro}
                            onChange={e => updateAddress('bairro', e.target.value)} placeholder="Bairro"
                        />
                    </div>
                    <div>
                        <div style={labelStyle}>Cidade</div>
                        <input style={inputStyle} value={form.endereco.cidade}
                            onChange={e => updateAddress('cidade', e.target.value)} placeholder="Cidade"
                        />
                    </div>
                </div>
                <div className="grid-responsive-4">
                    <div>
                        <div style={labelStyle}>Estado</div>
                        <CustomSelect
                            value={form.endereco.estado}
                            onChange={val => updateAddress('estado', val)}
                            options={ESTADOS.map(uf => ({ label: uf, value: uf }))}
                            searchable
                            placeholder="UF"
                        />
                    </div>
                </div>
            </div>

            {/* ─── 📝 Observações ─── */}
            <div style={sectionStyle}>
                <div style={sectionTitleStyle}>📝 Observações internas</div>
                <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }}
                    value={form.observacoes} onChange={e => updateField('observacoes', e.target.value)}
                    placeholder="Observações internas sobre o cliente (não visível ao cliente)"
                />
            </div>

            {/* ─── Ações ─── */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px' }}>
                <button type="button" onClick={onCancel}
                    style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>
                    Cancelar
                </button>
                <button type="submit" disabled={loading}
                    style={{
                        padding: '10px 32px', borderRadius: '8px', border: 'none',
                        background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
                        color: '#fff', fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                    }}>
                    {loading ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </button>
            </div>
        </form>
    );
}
