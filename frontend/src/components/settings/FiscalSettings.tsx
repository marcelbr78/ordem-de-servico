import React, { useState, useRef } from 'react';
import {
    Building2, FileKey, CreditCard, Upload, CheckCircle2, AlertTriangle,
    Eye, EyeOff, Loader2, Info, Zap, ReceiptText, Shield,
} from 'lucide-react';
import api from '../../services/api';

interface Props {
    settings: Record<string, string>;
    onSave: (key: string, value: string) => Promise<void>;
}

const input: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
    color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
};
const label: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 600,
    color: 'rgba(255,255,255,0.5)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px',
};
const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px', padding: '24px', marginBottom: '20px',
};
const sectionTitle = (icon: React.ReactNode, text: string, color: string): React.ReactNode => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div style={{ width: 34, height: 34, borderRadius: '8px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
        </div>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>{text}</h3>
    </div>
);

// ────────────────────────────────────────────────
// Sub-seção: Dados da Empresa Fiscal
// ────────────────────────────────────────────────
const EmpresaFiscalSection: React.FC<Props> = ({ settings, onSave }) => {
    const [local, setLocal] = useState<Record<string, string>>({});
    const [savingKey, setSavingKey] = useState<string | null>(null);
    const [buscandoCnpj, setBuscandoCnpj] = useState(false);
    const [cnpjStatus, setCnpjStatus] = useState<'idle' | 'ok' | 'erro'>('idle');
    const [cnpjMsg, setCnpjMsg] = useState('');

    const val = (key: string) => local[key] ?? settings[key] ?? '';
    const set = (key: string, v: string) => setLocal(p => ({ ...p, [key]: v }));

    const save = async (key: string) => {
        const v = val(key);
        setSavingKey(key);
        try { await onSave(key, v); } finally { setSavingKey(null); }
    };

    // Salva vários campos de uma vez
    const saveMany = async (fields: Record<string, string>) => {
        setLocal(p => ({ ...p, ...fields }));
        for (const [k, v] of Object.entries(fields)) {
            await onSave(k, v);
        }
    };

    // Busca CNPJ na Receita Federal via BrasilAPI
    const buscarCnpj = async (cnpjRaw: string) => {
        const cnpj = cnpjRaw.replace(/\D/g, '');
        if (cnpj.length !== 14) return;

        setBuscandoCnpj(true);
        setCnpjStatus('idle');
        setCnpjMsg('Consultando Receita Federal...');

        try {
            const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
            if (!res.ok) throw new Error('CNPJ não encontrado');
            const d = await res.json();

            // Formatar telefone
            const fone = d.ddd_telefone_1
                ? `(${d.ddd_telefone_1.trim().slice(0, 2)}) ${d.ddd_telefone_1.trim().slice(2)}`
                : '';

            // Formatar CEP
            const cep = d.cep
                ? d.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2')
                : '';

            await saveMany({
                fiscal_cnpj: cnpjRaw,
                fiscal_razao_social: d.razao_social || '',
                fiscal_nome_fantasia: d.nome_fantasia || d.razao_social || '',
                fiscal_logradouro: d.logradouro || '',
                fiscal_numero: d.numero || '',
                fiscal_bairro: d.bairro || '',
                fiscal_municipio: d.municipio || '',
                fiscal_uf: d.uf || '',
                fiscal_cep: cep,
                fiscal_cod_ibge: d.codigo_municipio_ibge ? String(d.codigo_municipio_ibge) : '',
                fiscal_fone: fone,
                // Detectar Simples Nacional
                fiscal_crt: d.opcao_pelo_simples ? '1' : '3',
            });

            setCnpjStatus('ok');
            setCnpjMsg(`✅ Dados preenchidos automaticamente: ${d.razao_social}`);
        } catch (err: any) {
            setCnpjStatus('erro');
            setCnpjMsg('❌ CNPJ não encontrado. Preencha os dados manualmente.');
        } finally {
            setBuscandoCnpj(false);
        }
    };

    const field = (key: string, placeholder: string, label_: string, type = 'text') => (
        <div>
            <label style={label}>{label_}</label>
            <input
                type={type}
                value={val(key)}
                placeholder={placeholder}
                onChange={e => set(key, e.target.value)}
                onBlur={() => save(key)}
                style={{ ...input, borderColor: savingKey === key ? '#6366f1' : 'rgba(255,255,255,0.1)' }}
            />
        </div>
    );

    return (
        <div style={card}>
            {sectionTitle(<Building2 size={16} style={{ color: '#6366f1' }} />, 'Dados da Empresa (Emitente Fiscal)', '#6366f1')}

            {/* CNPJ com busca automática */}
            <div style={{ marginBottom: '20px' }}>
                <label style={label}>CNPJ — Digite para preencher automaticamente</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <input
                            type='text'
                            value={val('fiscal_cnpj')}
                            placeholder='00.000.000/0001-00'
                            maxLength={18}
                            onChange={e => {
                                // Formatar enquanto digita
                                const raw = e.target.value.replace(/\D/g, '').slice(0, 14);
                                const fmt = raw
                                    .replace(/^(\d{2})(\d)/, '$1.$2')
                                    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
                                    .replace(/\.(\d{3})(\d)/, '.$1/$2')
                                    .replace(/(\d{4})(\d)/, '$1-$2');
                                set('fiscal_cnpj', fmt);
                                if (raw.length === 14) buscarCnpj(fmt);
                            }}
                            onBlur={() => save('fiscal_cnpj')}
                            style={{
                                ...input,
                                fontSize: '16px',
                                letterSpacing: '1px',
                                borderColor: cnpjStatus === 'ok' ? '#10b981' : cnpjStatus === 'erro' ? '#ef4444' : 'rgba(255,255,255,0.1)',
                            }}
                        />
                        {buscandoCnpj && (
                            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                                <Loader2 size={18} style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => buscarCnpj(val('fiscal_cnpj'))}
                        disabled={buscandoCnpj || val('fiscal_cnpj').replace(/\D/g, '').length !== 14}
                        style={{
                            padding: '10px 16px', borderRadius: '10px', whiteSpace: 'nowrap',
                            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
                            color: '#a5b4fc', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '6px',
                        }}>
                        🔍 Buscar
                    </button>
                </div>

                {cnpjMsg && (
                    <div style={{
                        marginTop: '8px', padding: '8px 14px', borderRadius: '8px', fontSize: '12px',
                        background: cnpjStatus === 'ok' ? 'rgba(16,185,129,0.1)' : cnpjStatus === 'erro' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
                        border: `1px solid ${cnpjStatus === 'ok' ? 'rgba(16,185,129,0.3)' : cnpjStatus === 'erro' ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.2)'}`,
                        color: cnpjStatus === 'ok' ? '#6ee7b7' : cnpjStatus === 'erro' ? '#fca5a5' : '#a5b4fc',
                    }}>
                        {cnpjMsg}
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                {field('fiscal_razao_social', 'EMPRESA LTDA', 'Razão Social')}
                {field('fiscal_nome_fantasia', 'Nome Fantasia', 'Nome Fantasia')}
                {field('fiscal_ie', 'Inscrição Estadual', 'Inscr. Estadual (IE)')}
                {field('fiscal_im', 'Inscrição Municipal', 'Inscr. Municipal (IM)')}
                {field('fiscal_fone', '(47) 99999-9999', 'Telefone')}
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '20px 0' }} />
            <p style={{ margin: '0 0 16px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase' }}>Endereço</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {field('fiscal_logradouro', 'Rua das Flores', 'Logradouro')}
                {field('fiscal_numero', '100', 'Número')}
                {field('fiscal_bairro', 'Centro', 'Bairro')}
                {field('fiscal_municipio', 'Blumenau', 'Município')}
                {field('fiscal_uf', 'SC', 'UF')}
                {field('fiscal_cep', '89000-000', 'CEP')}
                {field('fiscal_cod_ibge', '4202404', 'Código IBGE')}
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '20px 0' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                    <label style={label}>Regime Tributário (CRT)</label>
                    <select
                        value={val('fiscal_crt')}
                        onChange={e => { set('fiscal_crt', e.target.value); onSave('fiscal_crt', e.target.value); }}
                        style={{ ...input }}>
                        <option value='1'>1 — Simples Nacional</option>
                        <option value='2'>2 — Simples Nacional (Excesso)</option>
                        <option value='3'>3 — Regime Normal (Lucro Presumido/Real)</option>
                    </select>
                </div>
                <div>
                    <label style={label}>Ambiente de Emissão</label>
                    <select
                        value={val('fiscal_ambiente') || '2'}
                        onChange={e => { set('fiscal_ambiente', e.target.value); onSave('fiscal_ambiente', e.target.value); }}
                        style={{ ...input }}>
                        <option value='2'>🧪 Homologação (Testes — não gera NF real)</option>
                        <option value='1'>🔴 Produção (Notas com validade jurídica)</option>
                    </select>
                </div>
                <div>
                    <label style={label}>URL WebService NFS-e (Prefeitura)</label>
                    <input
                        type='text'
                        value={val('fiscal_nfse_url')}
                        placeholder='https://nfse.blumenau.atende.net/...'
                        onChange={e => set('fiscal_nfse_url', e.target.value)}
                        onBlur={() => save('fiscal_nfse_url')}
                        style={input}
                    />
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                        URL WSDL do web service da prefeitura (NFS-e de serviço)
                    </p>
                </div>
            </div>
        </div>
    );
};

// ────────────────────────────────────────────────
// Sub-seção: Certificado Digital A1
// ────────────────────────────────────────────────
const CertificadoSection: React.FC<Props> = ({ settings, onSave }) => {
    const [senha, setSenha] = useState('');
    const [showSenha, setShowSenha] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadOk, setUploadOk] = useState(false);
    const [uploadErro, setUploadErro] = useState('');
    const [senhaOk, setSenhaOk] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.name.endsWith('.pfx') && !file.name.endsWith('.p12')) {
            setUploadErro('Arquivo inválido. Use .pfx ou .p12');
            return;
        }
        setUploading(true);
        setUploadErro('');
        try {
            const form = new FormData();
            form.append('certificado', file);
            await api.post('/fiscal/certificado/upload', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setUploadOk(true);
            await onSave('fiscal_cert_name', file.name);
        } catch (err: any) {
            setUploadErro(err?.response?.data?.message || 'Erro ao enviar certificado');
        } finally {
            setUploading(false);
        }
    };

    const handleSaveSenha = async () => {
        if (!senha) return;
        try {
            await onSave('fiscal_cert_password', senha);
            setSenhaOk(true);
            setTimeout(() => setSenhaOk(false), 3000);
        } catch { /* ignore */ }
    };

    const certName = settings.fiscal_cert_name;

    return (
        <div style={card}>
            {sectionTitle(<FileKey size={16} style={{ color: '#f59e0b' }} />, 'Certificado Digital A1 (.pfx)', '#f59e0b')}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Upload */}
                <div>
                    <label style={label}>Arquivo do Certificado (.pfx / .p12)</label>
                    <div
                        onClick={() => fileRef.current?.click()}
                        style={{
                            border: `2px dashed ${uploadOk ? '#10b981' : uploadErro ? '#ef4444' : 'rgba(255,255,255,0.15)'}`,
                            borderRadius: '10px', padding: '24px', textAlign: 'center', cursor: 'pointer',
                            background: uploadOk ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
                            transition: 'all 0.2s',
                        }}>
                        <input ref={fileRef} type='file' accept='.pfx,.p12' style={{ display: 'none' }} onChange={handleUpload} />
                        {uploading ? (
                            <><Loader2 size={28} style={{ color: '#6366f1', animation: 'spin 1s linear infinite', marginBottom: 8 }} /><p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Enviando...</p></>
                        ) : uploadOk ? (
                            <><CheckCircle2 size={28} style={{ color: '#10b981', marginBottom: 8 }} /><p style={{ margin: 0, color: '#10b981', fontSize: '13px' }}>Certificado enviado!</p></>
                        ) : (
                            <>
                                <Upload size={28} style={{ color: certName ? '#f59e0b' : 'rgba(255,255,255,0.3)', marginBottom: 8 }} />
                                <p style={{ margin: '0 0 4px', color: '#fff', fontSize: '13px', fontWeight: 600 }}>
                                    {certName ? `📄 ${certName}` : 'Clique para selecionar'}
                                </p>
                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>
                                    {certName ? 'Clique para substituir' : 'Arquivo .pfx ou .p12 do certificado A1'}
                                </p>
                            </>
                        )}
                    </div>
                    {uploadErro && (
                        <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '12px', display: 'flex', gap: '6px' }}>
                            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {uploadErro}
                        </div>
                    )}
                </div>

                {/* Senha */}
                <div>
                    <label style={label}>Senha do Certificado</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showSenha ? 'text' : 'password'}
                            value={senha || (settings.fiscal_cert_password ? '••••••••' : '')}
                            onFocus={() => { if (settings.fiscal_cert_password) setSenha(''); }}
                            onChange={e => setSenha(e.target.value)}
                            placeholder='Senha do arquivo .pfx'
                            style={{ ...input, paddingRight: '44px' }}
                        />
                        <button onClick={() => setShowSenha(!showSenha)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
                            {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    <button
                        onClick={handleSaveSenha}
                        disabled={!senha}
                        style={{ marginTop: '10px', padding: '9px 18px', borderRadius: '8px', background: senha ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${senha ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'}`, color: senha ? '#f59e0b' : 'rgba(255,255,255,0.3)', cursor: senha ? 'pointer' : 'default', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {senhaOk ? <><CheckCircle2 size={14} />Salvo!</> : <>Salvar Senha</>}
                    </button>
                    <p style={{ marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', lineHeight: '1.5' }}>
                        🔒 A senha é armazenada de forma segura no servidor e nunca fica visível após salvar.
                    </p>
                </div>
            </div>

            {/* Info box */}
            <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <Info size={16} style={{ color: '#6366f1', flexShrink: 0, marginTop: 1 }} />
                <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' }}>
                    O certificado A1 é o arquivo <strong style={{ color: '#fff' }}>.pfx</strong> que você recebe da certificadora (Serasa, Certisign, Valid, etc.). Ele é necessário para assinar as NF-e e enviá-las à SEFAZ. A validade costuma ser de 1 a 3 anos.
                </p>
            </div>
        </div>
    );
};

// ────────────────────────────────────────────────
// Sub-seção: PagBank / PagSeguro
// ────────────────────────────────────────────────
const PagBankSection: React.FC<Props> = ({ settings, onSave }) => {
    const [local, setLocal] = useState<Record<string, string>>({});
    const [savingKey, setSavingKey] = useState<string | null>(null);
    const [showToken, setShowToken] = useState(false);
    const [testando, setTestando] = useState(false);
    const [testeResult, setTesteResult] = useState<{ ok: boolean; msg: string } | null>(null);

    const val = (k: string) => local[k] ?? settings[k] ?? '';
    const set = (k: string, v: string) => setLocal(p => ({ ...p, [k]: v }));
    const save = async (k: string) => { setSavingKey(k); try { await onSave(k, val(k)); } finally { setSavingKey(null); } };

    const handleTestar = async () => {
        setTestando(true);
        setTesteResult(null);
        try {
            const { data } = await api.get('/pagbank/status');
            setTesteResult({ ok: data.connected, msg: data.connected ? `✅ Conta: ${data.nome || 'Conectada!'}` : '❌ Token inválido' });
        } catch (e: any) {
            setTesteResult({ ok: false, msg: e?.response?.data?.message || 'Erro ao conectar com PagBank' });
        } finally {
            setTestando(false);
        }
    };

    const webhookUrl = `${window.location.origin.replace(':5173', ':3005')}/fiscal/webhook/pagamento`;

    return (
        <div style={card}>
            {sectionTitle(<CreditCard size={16} style={{ color: '#00b140' }} />, 'PagBank / PagSeguro — Pagamentos Automáticos', '#00b140')}

            <div style={{ marginBottom: '20px', padding: '14px 16px', borderRadius: '10px', background: 'rgba(0,177,64,0.08)', border: '1px solid rgba(0,177,64,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Zap size={14} style={{ color: '#00b140' }} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#00b140' }}>Como funciona a automação</span>
                </div>
                <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.8' }}>
                    <li>Cliente paga via PagBank (PIX, cartão, boleto)</li>
                    <li>PagBank envia confirmação automática (webhook) para este sistema</li>
                    <li>O sistema lança a <strong style={{ color: '#fff' }}>transação financeira</strong> automaticamente</li>
                    <li>E emite a <strong style={{ color: '#fff' }}>NF-e / NFS-e</strong> automaticamente (se configurado)</li>
                </ol>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                {/* Token */}
                <div>
                    <label style={label}>Token de Acesso PagBank</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showToken ? 'text' : 'password'}
                            value={val('pagbank_token')}
                            onChange={e => set('pagbank_token', e.target.value)}
                            onBlur={() => save('pagbank_token')}
                            placeholder='Bearer token da API PagBank'
                            style={{ ...input, paddingRight: '44px', borderColor: savingKey === 'pagbank_token' ? '#00b140' : 'rgba(255,255,255,0.1)' }}
                        />
                        <button onClick={() => setShowToken(!showToken)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
                            {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                        Em PagBank: Venda Online → Integrações → Gerar Token
                    </p>
                </div>

                {/* Ambiente */}
                <div>
                    <label style={label}>Ambiente PagBank</label>
                    <select
                        value={val('pagbank_ambiente') || 'sandbox'}
                        onChange={e => { set('pagbank_ambiente', e.target.value); onSave('pagbank_ambiente', e.target.value); }}
                        style={input}>
                        <option value='sandbox'>🧪 Sandbox (Testes)</option>
                        <option value='production'>🔴 Produção (Real)</option>
                    </select>
                </div>

                {/* E-mail da conta */}
                <div>
                    <label style={label}>E-mail da Conta PagBank</label>
                    <input
                        type='email'
                        value={val('pagbank_email')}
                        onChange={e => set('pagbank_email', e.target.value)}
                        onBlur={() => save('pagbank_email')}
                        placeholder='seu@email.com'
                        style={input}
                    />
                </div>

                {/* Gerar NF automático */}
                <div>
                    <label style={label}>Ação ao Receber Pagamento</label>
                    <select
                        value={val('pagbank_auto_nf') || 'nenhuma'}
                        onChange={e => { set('pagbank_auto_nf', e.target.value); onSave('pagbank_auto_nf', e.target.value); }}
                        style={input}>
                        <option value='nenhuma'>Apenas lançar financeiro</option>
                        <option value='nfse'>Lançar financeiro + Emitir NFS-e</option>
                        <option value='nfe'>Lançar financeiro + Emitir NF-e</option>
                        <option value='ambos'>Lançar financeiro + Emitir NFS-e + NF-e</option>
                    </select>
                </div>
            </div>

            {/* Webhook URL */}
            <div style={{ marginBottom: '16px' }}>
                <label style={label}>URL do Webhook (configure no PagBank)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input readOnly value={webhookUrl} style={{ ...input, background: 'rgba(0,0,0,0.3)', color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', fontSize: '12px' }} />
                    <button
                        onClick={() => { navigator.clipboard.writeText(webhookUrl); }}
                        style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(0,177,64,0.12)', border: '1px solid rgba(0,177,64,0.3)', color: '#00b140', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '12px', fontWeight: 600 }}>
                        Copiar
                    </button>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                    No PagBank → Configurações → Notificações → cole esta URL
                </p>
            </div>

            {/* Botão testar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                    onClick={handleTestar}
                    disabled={testando || !val('pagbank_token')}
                    style={{ padding: '10px 20px', borderRadius: '8px', background: val('pagbank_token') ? 'rgba(0,177,64,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${val('pagbank_token') ? 'rgba(0,177,64,0.4)' : 'rgba(255,255,255,0.08)'}`, color: val('pagbank_token') ? '#00b140' : 'rgba(255,255,255,0.3)', cursor: val('pagbank_token') ? 'pointer' : 'default', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {testando ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Shield size={14} />}
                    Testar Conexão
                </button>

                {testeResult && (
                    <span style={{ fontSize: '13px', color: testeResult.ok ? '#10b981' : '#f87171', fontWeight: 600 }}>
                        {testeResult.msg}
                    </span>
                )}
            </div>
        </div>
    );
};

// ────────────────────────────────────────────────
// Sub-seção: E-mail para envio de DANFE
// ────────────────────────────────────────────────
const EmailFiscalSection: React.FC<Props> = ({ settings, onSave }) => {
    const [local, setLocal] = useState<Record<string, string>>({});
    const [showPass, setShowPass] = useState(false);
    const [savingKey, setSavingKey] = useState<string | null>(null);
    const [testando, setTestando] = useState(false);
    const [testeResult, setTesteResult] = useState<{ ok: boolean; msg: string } | null>(null);

    const val = (k: string) => local[k] ?? settings[k] ?? '';
    const set = (k: string, v: string) => setLocal(p => ({ ...p, [k]: v }));
    const save = async (k: string) => { setSavingKey(k); try { await onSave(k, val(k)); } finally { setSavingKey(null); } };

    const handleTestarEmail = async () => {
        setTestando(true);
        setTesteResult(null);
        try {
            await api.post('/fiscal/email/teste');
            setTesteResult({ ok: true, msg: '✅ E-mail de teste enviado!' });
        } catch (e: any) {
            setTesteResult({ ok: false, msg: e?.response?.data?.message || 'Erro ao enviar e-mail teste' });
        } finally {
            setTestando(false);
        }
    };

    return (
        <div style={card}>
            {sectionTitle(<ReceiptText size={16} style={{ color: '#3b82f6' }} />, 'E-mail para Envio de DANFE', '#3b82f6')}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                    <label style={label}>Servidor SMTP</label>
                    <input type='text' value={val('smtp_host')} onChange={e => set('smtp_host', e.target.value)} onBlur={() => save('smtp_host')} placeholder='smtp.gmail.com' style={{ ...input, borderColor: savingKey === 'smtp_host' ? '#3b82f6' : 'rgba(255,255,255,0.1)' }} />
                </div>
                <div>
                    <label style={label}>Porta SMTP</label>
                    <input type='number' value={val('smtp_port')} onChange={e => set('smtp_port', e.target.value)} onBlur={() => save('smtp_port')} placeholder='587' style={input} />
                </div>
                <div>
                    <label style={label}>Usuário / E-mail</label>
                    <input type='email' value={val('smtp_user')} onChange={e => set('smtp_user', e.target.value)} onBlur={() => save('smtp_user')} placeholder='seu@email.com' style={input} />
                </div>
                <div>
                    <label style={label}>Senha / App Password</label>
                    <div style={{ position: 'relative' }}>
                        <input type={showPass ? 'text' : 'password'} value={val('smtp_pass')} onChange={e => set('smtp_pass', e.target.value)} onBlur={() => save('smtp_pass')} placeholder='Senha do e-mail ou App Password' style={{ ...input, paddingRight: '44px' }} />
                        <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
                            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>
                <div>
                    <label style={label}>Remetente (From)</label>
                    <input type='email' value={val('smtp_from')} onChange={e => set('smtp_from', e.target.value)} onBlur={() => save('smtp_from')} placeholder='noreply@suaempresa.com.br' style={input} />
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Info size={14} style={{ color: '#3b82f6', flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.5' }}>
                    No Gmail: use <strong style={{ color: '#fff' }}>App Passwords</strong> (conta Google → Segurança → Senhas para apps). Para outros provedores, use as credenciais SMTP normais.
                </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                <button
                    onClick={handleTestarEmail}
                    disabled={testando || !val('smtp_user')}
                    style={{ padding: '10px 20px', borderRadius: '8px', background: val('smtp_user') ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${val('smtp_user') ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`, color: val('smtp_user') ? '#3b82f6' : 'rgba(255,255,255,0.3)', cursor: val('smtp_user') ? 'pointer' : 'default', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {testando ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <ReceiptText size={14} />}
                    Enviar E-mail de Teste
                </button>
                {testeResult && (
                    <span style={{ fontSize: '13px', color: testeResult.ok ? '#10b981' : '#f87171', fontWeight: 600 }}>
                        {testeResult.msg}
                    </span>
                )}
            </div>
        </div>
    );
};

// ────────────────────────────────────────────────
// Componente principal exportado
// ────────────────────────────────────────────────
export const FiscalSettings: React.FC<Props> = ({ settings, onSave }) => {
    const [activeSection, setActiveSection] = useState<'empresa' | 'certificado' | 'pagbank' | 'email'>('empresa');

    const tabs = [
        { id: 'empresa', icon: <Building2 size={14} />, label: 'Empresa' },
        { id: 'certificado', icon: <FileKey size={14} />, label: 'Certificado' },
        { id: 'pagbank', icon: <CreditCard size={14} />, label: 'PagBank' },
        { id: 'email', icon: <ReceiptText size={14} />, label: 'E-mail DANFE' },
    ] as const;

    return (
        <div>
            {/* Mini tabs internas */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveSection(t.id as any)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                            borderRadius: '8px', border: `1px solid ${activeSection === t.id ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
                            background: activeSection === t.id ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                            color: activeSection === t.id ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
                            cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s',
                        }}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {activeSection === 'empresa' && <EmpresaFiscalSection settings={settings} onSave={onSave} />}
            {activeSection === 'certificado' && <CertificadoSection settings={settings} onSave={onSave} />}
            {activeSection === 'pagbank' && <PagBankSection settings={settings} onSave={onSave} />}
            {activeSection === 'email' && <EmailFiscalSection settings={settings} onSave={onSave} />}

            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};
