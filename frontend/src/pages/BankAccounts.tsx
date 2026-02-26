import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
    Building2, Plus, Edit2, Trash2, X, Check, ChevronDown, ChevronUp,
    Wallet, CreditCard, Landmark, AlertCircle, RefreshCw, Copy, Eye, EyeOff
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────── */
type AccountType = 'corrente' | 'poupanca' | 'pagamento' | 'caixa';
type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';

interface BankAccount {
    id: string;
    name: string;
    bank?: string;
    bankCode?: string;
    type: AccountType;
    agency?: string;
    agencyDigit?: string;
    account?: string;
    accountDigit?: string;
    pixKey?: string;
    pixKeyType?: PixKeyType;
    holderName?: string;
    holderDocument?: string;
    initialBalance: number;
    currentBalance: number;
    isActive: boolean;
    description?: string;
    color?: string;
    createdAt: string;
}

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
    corrente: 'Conta Corrente',
    poupanca: 'Poupança',
    pagamento: 'Conta Pagamento',
    caixa: 'Caixa Interno',
};

const PIX_TYPE_LABELS: Record<PixKeyType, string> = {
    cpf: 'CPF',
    cnpj: 'CNPJ',
    email: 'E-mail',
    telefone: 'Telefone',
    aleatoria: 'Chave Aleatória',
};

const ACCOUNT_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
    '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

const POPULAR_BANKS = [
    { name: 'Banco do Brasil', code: '001' },
    { name: 'Bradesco', code: '237' },
    { name: 'Itaú', code: '341' },
    { name: 'Santander', code: '033' },
    { name: 'Caixa Econômica Federal', code: '104' },
    { name: 'Nubank', code: '260' },
    { name: 'Inter', code: '077' },
    { name: 'Sicoob', code: '756' },
    { name: 'C6 Bank', code: '336' },
    { name: 'Mercado Pago', code: '323' },
    { name: 'PagBank', code: '290' },
    { name: 'Outro', code: '' },
];

const emptyForm = {
    name: '',
    bank: '',
    bankCode: '',
    type: 'corrente' as AccountType,
    agency: '',
    agencyDigit: '',
    account: '',
    accountDigit: '',
    pixKey: '',
    pixKeyType: '' as PixKeyType | '',
    holderName: '',
    holderDocument: '',
    initialBalance: 0,
    isActive: true,
    description: '',
    color: ACCOUNT_COLORS[0],
};

/* ─── Formatter ─────────────────────────────────────────── */
const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

/* ─── Modal ─────────────────────────────────────────────── */
interface ModalProps {
    isOpen: boolean;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, title, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', padding: '16px',
        }}>
            <div style={{
                background: 'var(--bg-secondary)', borderRadius: '16px',
                width: '100%', maxWidth: '640px', maxHeight: '90vh',
                display: 'flex', flexDirection: 'column',
                border: '1px solid var(--border-color)',
                boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
            }}>
                <div style={{
                    padding: '20px 24px', borderBottom: '1px solid var(--border-color)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '18px', fontWeight: 700 }}>{title}</h2>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-secondary)', padding: '4px',
                        display: 'flex', borderRadius: '6px',
                        transition: 'color 0.2s',
                    }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                    >
                        <X size={20} />
                    </button>
                </div>
                <div style={{ overflowY: 'auto', flex: 1, padding: '24px' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

/* ─── Field ─────────────────────────────────────────────── */
const Field: React.FC<{
    label: string; required?: boolean; children: React.ReactNode; span?: number;
}> = ({ label, required, children, span }) => (
    <div style={{ gridColumn: span ? `span ${span}` : undefined }}>
        <label style={{
            display: 'block', marginBottom: '6px', fontSize: '12px',
            fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
            {label}{required && <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>}
        </label>
        {children}
    </div>
);

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)', borderRadius: '8px',
    color: 'var(--text-primary)', fontSize: '14px', boxSizing: 'border-box',
    outline: 'none', transition: 'border-color 0.2s',
};

/* ─── Account Form ──────────────────────────────────────── */
type FormState = typeof emptyForm;

interface AccountFormProps {
    initial: FormState;
    isEdit: boolean;
    onSave: (data: FormState) => Promise<void>;
    onClose: () => void;
    saving: boolean;
}

const AccountForm: React.FC<AccountFormProps> = ({ initial, onSave, onClose, saving }) => {
    const [form, setForm] = useState<FormState>(initial);
    const [showPixSection, setShowPixSection] = useState(!!initial.pixKey);
    const [bankSearch, setBankSearch] = useState(initial.bank || '');
    const [showBankList, setShowBankList] = useState(false);

    const set = (k: keyof FormState, v: FormState[keyof FormState]) =>
        setForm(prev => ({ ...prev, [k]: v }));

    const handleBankSelect = (bank: { name: string; code: string }) => {
        set('bank', bank.name);
        set('bankCode', bank.code);
        setBankSearch(bank.name);
        setShowBankList(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
    };

    const gridStyle: React.CSSProperties = {
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
    };

    return (
        <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Cor de identificação */}
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Cor de identificação
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {ACCOUNT_COLORS.map(c => (
                            <button key={c} type="button" onClick={() => set('color', c)} style={{
                                width: '28px', height: '28px', borderRadius: '50%', background: c,
                                border: form.color === c ? '3px solid #fff' : '2px solid transparent',
                                cursor: 'pointer', transition: 'transform 0.15s, border 0.15s',
                                transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
                                outline: form.color === c ? '2px solid rgba(255,255,255,0.4)' : 'none',
                                outlineOffset: '2px',
                            }} />
                        ))}
                    </div>
                </div>

                {/* Nome */}
                <Field label="Nome da conta" required>
                    <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)}
                        placeholder="Ex: Conta Bradesco Principal" required />
                </Field>

                <div style={gridStyle}>
                    {/* Banco */}
                    <Field label="Banco">
                        <div style={{ position: 'relative' }}>
                            <input style={inputStyle} value={bankSearch}
                                onChange={e => { setBankSearch(e.target.value); set('bank', e.target.value); setShowBankList(true); }}
                                onFocus={() => setShowBankList(true)}
                                onBlur={() => setTimeout(() => setShowBankList(false), 200)}
                                placeholder="Bradesco, Nubank..." />
                            {showBankList && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                                    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                                    borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', marginTop: '4px',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                                }}>
                                    {POPULAR_BANKS.filter(b =>
                                        b.name.toLowerCase().includes(bankSearch.toLowerCase())
                                    ).map(b => (
                                        <button key={b.code + b.name} type="button"
                                            onMouseDown={() => handleBankSelect(b)}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                width: '100%', padding: '10px 14px', background: 'none', border: 'none',
                                                cursor: 'pointer', color: 'var(--text-primary)', fontSize: '14px',
                                                textAlign: 'left',
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                        >
                                            <span>{b.name}</span>
                                            {b.code && <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{b.code}</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Field>

                    {/* Tipo */}
                    <Field label="Tipo de conta">
                        <select style={inputStyle} value={form.type} onChange={e => set('type', e.target.value as AccountType)}>
                            {Object.entries(ACCOUNT_TYPE_LABELS).map(([v, l]) => (
                                <option key={v} value={v}>{l}</option>
                            ))}
                        </select>
                    </Field>
                </div>

                {/* Agência e Conta (não mostrar para caixa) */}
                {form.type !== 'caixa' && (
                    <div style={gridStyle}>
                        <Field label="Agência">
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input style={{ ...inputStyle, flex: 1 }} value={form.agency}
                                    onChange={e => set('agency', e.target.value)} placeholder="0001" />
                                <input style={{ ...inputStyle, width: '60px' }} value={form.agencyDigit}
                                    onChange={e => set('agencyDigit', e.target.value)} placeholder="X" />
                            </div>
                        </Field>
                        <Field label="Conta">
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input style={{ ...inputStyle, flex: 1 }} value={form.account}
                                    onChange={e => set('account', e.target.value)} placeholder="12345678" />
                                <input style={{ ...inputStyle, width: '60px' }} value={form.accountDigit}
                                    onChange={e => set('accountDigit', e.target.value)} placeholder="X" />
                            </div>
                        </Field>
                    </div>
                )}

                {/* Titular */}
                <div style={gridStyle}>
                    <Field label="Titular da conta">
                        <input style={inputStyle} value={form.holderName}
                            onChange={e => set('holderName', e.target.value)} placeholder="Nome do titular" />
                    </Field>
                    <Field label="CPF / CNPJ do titular">
                        <input style={inputStyle} value={form.holderDocument}
                            onChange={e => set('holderDocument', e.target.value)} placeholder="000.000.000-00" />
                    </Field>
                </div>

                {/* Saldo inicial */}
                <Field label="Saldo inicial">
                    <div style={{ position: 'relative' }}>
                        <span style={{
                            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                            color: 'var(--text-secondary)', fontSize: '14px',
                        }}>R$</span>
                        <input type="number" step="0.01" min="0" style={{ ...inputStyle, paddingLeft: '36px' }}
                            value={form.initialBalance}
                            onChange={e => set('initialBalance', parseFloat(e.target.value) || 0)}
                            placeholder="0,00" />
                    </div>
                </Field>

                {/* PIX */}
                <div>
                    <button type="button" onClick={() => setShowPixSection(!showPixSection)} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#22c55e', fontSize: '14px', fontWeight: 600, padding: '0',
                    }}>
                        {showPixSection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        {showPixSection ? 'Ocultar PIX' : '+ Adicionar chave PIX'}
                    </button>
                    {showPixSection && (
                        <div style={{ ...gridStyle, marginTop: '12px' }}>
                            <Field label="Tipo de chave PIX">
                                <select style={inputStyle} value={form.pixKeyType}
                                    onChange={e => set('pixKeyType', e.target.value as PixKeyType)}>
                                    <option value="">Selecione...</option>
                                    {Object.entries(PIX_TYPE_LABELS).map(([v, l]) => (
                                        <option key={v} value={v}>{l}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Chave PIX">
                                <input style={inputStyle} value={form.pixKey}
                                    onChange={e => set('pixKey', e.target.value)}
                                    placeholder="Digite a chave..." />
                            </Field>
                        </div>
                    )}
                </div>

                {/* Descrição */}
                <Field label="Observações">
                    <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                        value={form.description}
                        onChange={e => set('description', e.target.value)}
                        placeholder="Informações adicionais sobre a conta..." />
                </Field>

                {/* Ativo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button type="button" onClick={() => set('isActive', !form.isActive)} style={{
                        width: '44px', height: '24px', borderRadius: '12px',
                        background: form.isActive ? '#22c55e' : '#374151',
                        border: 'none', cursor: 'pointer', position: 'relative',
                        transition: 'background 0.2s',
                    }}>
                        <span style={{
                            position: 'absolute', top: '2px',
                            left: form.isActive ? '22px' : '2px',
                            width: '20px', height: '20px', borderRadius: '50%',
                            background: '#fff', transition: 'left 0.2s',
                        }} />
                    </button>
                    <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
                        Conta {form.isActive ? 'ativa' : 'inativa'}
                    </span>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' }}>
                    <button type="button" onClick={onClose} style={{
                        padding: '10px 20px', borderRadius: '8px', background: 'transparent',
                        border: '1px solid var(--border-color)', color: 'var(--text-secondary)',
                        cursor: 'pointer', fontSize: '14px', fontWeight: 500,
                    }}>Cancelar</button>
                    <button type="submit" disabled={saving} style={{
                        padding: '10px 24px', borderRadius: '8px', background: '#6366f1',
                        border: 'none', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
                        fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
                        opacity: saving ? 0.7 : 1, transition: 'opacity 0.2s',
                    }}>
                        {saving ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
                        {saving ? 'Salvando...' : 'Salvar conta'}
                    </button>
                </div>
            </div>
        </form>
    );
};

/* ─── Card ───────────────────────────────────────────────── */
interface CardProps {
    account: BankAccount;
    onEdit: (a: BankAccount) => void;
    onDelete: (id: string) => void;
}

const AccountCard: React.FC<CardProps> = ({ account, onEdit, onDelete }) => {
    const [showPixKey, setShowPixKey] = useState(false);
    const [copied, setCopied] = useState(false);

    const copyPix = () => {
        if (!account.pixKey) return;
        navigator.clipboard.writeText(account.pixKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const color = account.color || '#6366f1';
    const balance = Number(account.currentBalance);
    const isNegative = balance < 0;

    const TypeIcon = account.type === 'caixa' ? Wallet
        : account.type === 'pagamento' ? CreditCard
            : Landmark;

    return (
        <div style={{
            background: 'var(--bg-secondary)', borderRadius: '16px',
            border: `1px solid ${account.isActive ? 'var(--border-color)' : '#374151'}`,
            overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s',
            opacity: account.isActive ? 1 : 0.6,
        }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px rgba(0,0,0,0.3)`;
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
            }}
        >
            {/* Color strip */}
            <div style={{ height: '4px', background: color }} />

            <div style={{ padding: '20px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '42px', height: '42px', borderRadius: '10px',
                            background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <TypeIcon size={20} style={{ color }} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '15px' }}>{account.name}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px' }}>
                                {account.bank && `${account.bank} • `}
                                {ACCOUNT_TYPE_LABELS[account.type] || account.type}
                                {!account.isActive && <span style={{ marginLeft: '6px', color: '#f97316', fontSize: '11px', fontWeight: 600 }}>INATIVA</span>}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => onEdit(account)} style={{
                            padding: '6px', background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-secondary)', borderRadius: '6px', display: 'flex',
                            transition: 'color 0.2s, background 0.2s',
                        }}
                            title="Editar conta"
                            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'var(--hover-bg)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'none'; }}>
                            <Edit2 size={15} />
                        </button>
                        <button onClick={() => onDelete(account.id)} style={{
                            padding: '6px', background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-secondary)', borderRadius: '6px', display: 'flex',
                            transition: 'color 0.2s, background 0.2s',
                        }}
                            title="Excluir conta"
                            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'none'; }}>
                            <Trash2 size={15} />
                        </button>
                    </div>
                </div>

                {/* Balance */}
                <div style={{
                    background: isNegative ? 'rgba(239,68,68,0.08)' : `${color}11`,
                    borderRadius: '10px', padding: '14px 16px', marginBottom: '14px',
                    border: `1px solid ${isNegative ? 'rgba(239,68,68,0.2)' : `${color}22`}`,
                }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Saldo atual</div>
                    <div style={{ color: isNegative ? '#ef4444' : color, fontSize: '22px', fontWeight: 800, marginTop: '4px' }}>
                        {fmt(balance)}
                    </div>
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {account.agency && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Agência</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                {account.agency}{account.agencyDigit ? `-${account.agencyDigit}` : ''}
                            </span>
                        </div>
                    )}
                    {account.account && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Conta</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                {account.account}{account.accountDigit ? `-${account.accountDigit}` : ''}
                            </span>
                        </div>
                    )}
                    {account.holderName && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Titular</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{account.holderName}</span>
                        </div>
                    )}
                </div>

                {/* PIX */}
                {account.pixKey && (
                    <div style={{
                        marginTop: '12px', padding: '10px 12px', borderRadius: '8px',
                        background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                    }}>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ color: '#22c55e', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                PIX • {account.pixKeyType ? PIX_TYPE_LABELS[account.pixKeyType as PixKeyType] : ''}
                            </div>
                            <div style={{ color: 'var(--text-primary)', fontSize: '13px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {showPixKey ? account.pixKey : '•••••••••••••'}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                            <button onClick={() => setShowPixKey(!showPixKey)} style={{
                                padding: '4px', background: 'none', border: 'none', cursor: 'pointer',
                                color: '#22c55e', display: 'flex', borderRadius: '4px',
                            }} title={showPixKey ? 'Ocultar' : 'Mostrar'}>
                                {showPixKey ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button onClick={copyPix} style={{
                                padding: '4px', background: 'none', border: 'none', cursor: 'pointer',
                                color: copied ? '#22c55e' : '#22c55e', display: 'flex', borderRadius: '4px',
                            }} title="Copiar chave PIX">
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ─── Main Page ─────────────────────────────────────────── */
export const BankAccounts: React.FC = () => {
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
    const [saving, setSaving] = useState(false);
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

    const loadAccounts = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/bank-accounts');
            setAccounts(res.data);
        } catch {
            setError('Erro ao carregar contas bancárias.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadAccounts(); }, [loadAccounts]);

    const openCreate = () => { setEditingAccount(null); setShowModal(true); };
    const openEdit = (a: BankAccount) => { setEditingAccount(a); setShowModal(true); };
    const closeModal = () => { setShowModal(false); setEditingAccount(null); };

    const handleSave = async (data: typeof emptyForm) => {
        setSaving(true);
        try {
            if (editingAccount) {
                await api.patch(`/bank-accounts/${editingAccount.id}`, data);
            } else {
                await api.post('/bank-accounts', data);
            }
            closeModal();
            loadAccounts();
        } catch {
            alert('Erro ao salvar conta bancária.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta conta bancária?')) return;
        try {
            await api.delete(`/bank-accounts/${id}`);
            loadAccounts();
        } catch {
            alert('Erro ao excluir conta.');
        }
    };

    const filtered = accounts.filter(a => {
        if (filterActive === 'active') return a.isActive;
        if (filterActive === 'inactive') return !a.isActive;
        return true;
    });

    const totalBalance = accounts
        .filter(a => a.isActive)
        .reduce((s, a) => s + Number(a.currentBalance), 0);

    const initialForm: typeof emptyForm = editingAccount ? {
        name: editingAccount.name || '',
        bank: editingAccount.bank || '',
        bankCode: editingAccount.bankCode || '',
        type: editingAccount.type || 'corrente',
        agency: editingAccount.agency || '',
        agencyDigit: editingAccount.agencyDigit || '',
        account: editingAccount.account || '',
        accountDigit: editingAccount.accountDigit || '',
        pixKey: editingAccount.pixKey || '',
        pixKeyType: (editingAccount.pixKeyType as PixKeyType) || '',
        holderName: editingAccount.holderName || '',
        holderDocument: editingAccount.holderDocument || '',
        initialBalance: Number(editingAccount.initialBalance) || 0,
        isActive: editingAccount.isActive,
        description: editingAccount.description || '',
        color: editingAccount.color || ACCOUNT_COLORS[0],
    } : { ...emptyForm };

    return (
        <div style={{ padding: '24px', maxWidth: '1200px' }}>
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                    }}>
                        <Building2 size={24} color="#fff" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
                            Contas Bancárias
                        </h1>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
                            {accounts.filter(a => a.isActive).length} conta{accounts.filter(a => a.isActive).length !== 1 ? 's' : ''} ativa{accounts.filter(a => a.isActive).length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <button onClick={openCreate} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 20px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none', color: '#fff', cursor: 'pointer',
                    fontWeight: 600, fontSize: '14px',
                    boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.5)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.4)'; }}>
                    <Plus size={16} />
                    Nova Conta
                </button>
            </div>

            {/* Summary card */}
            {accounts.length > 0 && (
                <div style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    borderRadius: '16px', padding: '24px', marginBottom: '24px',
                    boxShadow: '0 8px 32px rgba(99,102,241,0.35)',
                    animation: 'fadeIn 0.4s ease',
                }}>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Saldo total consolidado
                    </div>
                    <div style={{ color: '#fff', fontSize: '36px', fontWeight: 900, marginTop: '8px' }}>
                        {fmt(totalBalance)}
                    </div>
                    <div style={{ display: 'flex', gap: '20px', marginTop: '16px', flexWrap: 'wrap' }}>
                        {accounts.filter(a => a.isActive).map(a => (
                            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: a.color || '#fff' }} />
                                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>{a.name}: {fmt(Number(a.currentBalance))}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {(['all', 'active', 'inactive'] as const).map(f => (
                    <button key={f} onClick={() => setFilterActive(f)} style={{
                        padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
                        border: '1px solid', cursor: 'pointer', transition: 'all 0.2s',
                        background: filterActive === f ? '#6366f1' : 'transparent',
                        borderColor: filterActive === f ? '#6366f1' : 'var(--border-color)',
                        color: filterActive === f ? '#fff' : 'var(--text-secondary)',
                    }}>
                        {f === 'all' ? `Todas (${accounts.length})` : f === 'active' ? `Ativas (${accounts.filter(a => a.isActive).length})` : `Inativas (${accounts.filter(a => !a.isActive).length})`}
                    </button>
                ))}
                <button onClick={loadAccounts} style={{
                    marginLeft: 'auto', padding: '6px 12px', borderRadius: '20px',
                    border: '1px solid var(--border-color)', background: 'transparent',
                    cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '13px',
                }}>
                    <RefreshCw size={13} /> Atualizar
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-secondary)', gap: '10px' }}>
                    <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    Carregando contas...
                </div>
            ) : error ? (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '16px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444',
                }}>
                    <AlertCircle size={18} />
                    {error}
                </div>
            ) : filtered.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '60px 20px',
                    background: 'var(--bg-secondary)', borderRadius: '16px',
                    border: '2px dashed var(--border-color)',
                }}>
                    <Building2 size={48} style={{ color: 'var(--text-secondary)', marginBottom: '16px' }} />
                    <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '16px', margin: '0 0 8px' }}>
                        {filterActive === 'all' ? 'Nenhuma conta cadastrada' : `Nenhuma conta ${filterActive === 'active' ? 'ativa' : 'inativa'}`}
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 20px' }}>
                        {filterActive === 'all' && 'Cadastre sua primeira conta bancária para começar.'}
                    </p>
                    {filterActive === 'all' && (
                        <button onClick={openCreate} style={{
                            padding: '10px 20px', borderRadius: '8px',
                            background: '#6366f1', border: 'none', color: '#fff',
                            cursor: 'pointer', fontWeight: 600, fontSize: '14px',
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                        }}>
                            <Plus size={16} /> Nova Conta
                        </button>
                    )}
                </div>
            ) : (
                <div style={{
                    display: 'grid', gap: '16px',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    animation: 'fadeIn 0.3s ease',
                }}>
                    {filtered.map(account => (
                        <AccountCard key={account.id} account={account} onEdit={openEdit} onDelete={handleDelete} />
                    ))}
                </div>
            )}

            {/* Modal */}
            <Modal
                isOpen={showModal}
                title={editingAccount ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}
                onClose={closeModal}
            >
                <AccountForm
                    key={editingAccount?.id || 'new'}
                    initial={initialForm}
                    isEdit={!!editingAccount}
                    onSave={handleSave}
                    onClose={closeModal}
                    saving={saving}
                />
            </Modal>
        </div>
    );
};
