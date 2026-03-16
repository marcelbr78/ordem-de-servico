import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import {
    Search, Plus, Package, ArrowRightLeft, Pencil, X, RefreshCw,
    AlertTriangle, TrendingUp, TrendingDown, BarChart2, ShoppingCart,
    Filter, Download, Upload, Barcode, ChevronDown, Save, Trash2,
    ArrowUpCircle, ArrowDownCircle, Settings2, History, Layers,
} from 'lucide-react';

// ── Tipos ────────────────────────────────────────────────────
interface Product {
    id: string; name: string; type: 'product' | 'service'; sku?: string;
    barcode?: string; brand?: string; category?: string; unit?: string;
    minQuantity: number; priceCost: number; priceSell: number;
    balance?: { quantity: number }; description?: string;
}
interface Movement {
    id: string; productId: string; type: string; quantity: number;
    unitCost: number; balanceBefore: number; balanceAfter: number;
    createdAt: string; product?: { name: string; sku?: string };
    reason?: string; invoiceNumber?: string;
}
interface Summary { totalItems: number; totalValue: number; totalSellValue: number; lowStock: number; zeroStock: number; }
interface AbcItem { id: string; name: string; sku?: string; quantity: number; value: number; cumulativePct: number; abc: 'A' | 'B' | 'C'; }

// ── Utils ────────────────────────────────────────────────────
const R$ = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const fmtDate = (d: string) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
const MOVEMENT_LABELS: Record<string, { label: string; color: string; icon: string }> = {
    ENTRY:         { label: 'Entrada',    color: '#22c55e', icon: '↑' },
    EXIT:          { label: 'Saída',      color: '#ef4444', icon: '↓' },
    REVERSE_ENTRY: { label: 'Est. Revertida', color: '#f59e0b', icon: '↺' },
    REVERSE_EXIT:  { label: 'Saída Revertida', color: '#3b82f6', icon: '↺' },
};
const ABC_CFG = { A: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', label: 'Curva A (80% do valor)' }, B: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Curva B (15% do valor)' }, C: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', label: 'Curva C (5% do valor)' } };
const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' };

// ── Modal de produto ─────────────────────────────────────────
// ── Listas de sugestões ──────────────────────────────────────
const MARCAS_COMUNS = [
    'Apple','Samsung','Motorola','Xiaomi','LG','Sony','Huawei',
    'Dell','HP','Lenovo','Asus','Acer','Microsoft','Nokia',
    'Positivo','Multilaser','JBL','Generic',
];
const CATEGORIAS_COMUNS = [
    'Tela / Display','Bateria','Conector de Carga','Câmera','Alto-Falante',
    'Microfone','Botões','Carcaça / Tampa','Flex / Cabo','Placa-mãe',
    'Memória / RAM','SSD / HD','Fonte','Cooler','Pasta Térmica',
    'Ferramentas','Acessórios','Serviço de Reparo','Diagnóstico',
];
const UNIDADES = ['UN','PÇ','CX','KG','MT','LT','PR','KIT'];

// Gerar SKU interno curto e padronizado
const gerarSKU = (nome: string, marca: string, categoria: string): string => {
    const sigla = (s: string) => s.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
    const ts = Date.now().toString().slice(-4);
    const partes = [sigla(marca) || 'GEN', sigla(categoria) || 'PRD', sigla(nome) || 'ITM', ts];
    return partes.filter(Boolean).join('-');
};

// Input de moeda brasileiro
const CurrencyInput: React.FC<{ value: number; onChange: (v: number) => void; label: React.ReactNode; style?: React.CSSProperties }> = ({ value, onChange, label, style }) => {
    const [display, setDisplay] = React.useState(value > 0 ? value.toFixed(2).replace('.', ',') : '');
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let raw = e.target.value.replace(/[^0-9]/g, '');
        if (!raw) { setDisplay(''); onChange(0); return; }
        const num = parseInt(raw) / 100;
        setDisplay(num.toFixed(2).replace('.', ','));
        onChange(num);
    };
    return (
        <div>
            <label style={lbl}>{label}</label>
            <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>R$</span>
                <input
                    inputMode="numeric"
                    value={display}
                    onChange={handleChange}
                    placeholder="0,00"
                    style={{ ...inp, paddingLeft: '32px', ...style }}
                />
            </div>
        </div>
    );
};

// Autocomplete com sugestões
const AutocompleteInput: React.FC<{ value: string; onChange: (v: string) => void; label: string; suggestions: string[]; placeholder?: string }> = ({ value, onChange, label, suggestions, placeholder }) => {
    const [open, setOpen] = React.useState(false);
    const filtered = suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase());
    return (
        <div style={{ position: 'relative' }}>
            <label style={lbl}>{label}</label>
            <input
                value={value}
                onChange={e => { onChange(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                placeholder={placeholder}
                style={inp}
            />
            {open && filtered.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', zIndex: 100, maxHeight: '160px', overflowY: 'auto', marginTop: '2px' }}>
                    {filtered.slice(0, 8).map(s => (
                        <div key={s} onMouseDown={() => { onChange(s); setOpen(false); }}
                            style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', color: '#fff' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.15)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            {s}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ProductModal: React.FC<{ product?: Product | null; onClose: () => void; onSuccess: () => void }> = ({ product, onClose, onSuccess }) => {
    const isEdit = !!product;
    const [data, setData] = useState({
        name: product?.name || '',
        type: product?.type || 'product',
        sku: product?.sku || '',
        barcode: product?.barcode || '',
        brand: product?.brand || '',
        category: product?.category || '',
        unit: product?.unit || 'UN',
        minQuantity: product?.minQuantity || 0,
        priceCost: product?.priceCost || 0,
        priceSell: product?.priceSell || 0,
        description: product?.description || '',
        // campos NF
        ncm: (product as any)?.ncm || '',
        cfop: (product as any)?.cfop || '',
        origin: (product as any)?.origin || '0',
    });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');
    const set = (k: string, v: any) => setData(p => ({ ...p, [k]: v }));
    const margin = data.priceCost > 0 ? ((data.priceSell - data.priceCost) / data.priceCost * 100) : 0;

    // Auto-gerar SKU quando nome/marca/categoria mudam
    React.useEffect(() => {
        if (!isEdit && data.name && !data.sku) {
            set('sku', gerarSKU(data.name, data.brand, data.category));
        }
    }, [data.name, data.brand, data.category]);

    const save = async () => {
        if (!data.name.trim()) { setErr('Nome obrigatório'); return; }
        setSaving(true); setErr('');
        try {
            if (isEdit) await api.put(`/inventory/${product!.id}`, data);
            else await api.post('/inventory', data);
            onSuccess();
        } catch (e: any) { setErr(e?.response?.data?.message || 'Erro ao salvar'); }
        finally { setSaving(false); }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
            <div style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '580px', maxHeight: '92dvh', overflowY: 'auto' }}>
                <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>{isEdit ? 'Editar Produto' : 'Novo Produto'}</h3>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}><X size={15}/></button>
                </div>
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {/* Tipo */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {(['product','service'] as const).map(t => (
                            <button key={t} onClick={() => set('type', t)} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: `1px solid ${data.type === t ? (t === 'product' ? 'rgba(59,130,246,0.4)' : 'rgba(139,92,246,0.4)') : 'rgba(255,255,255,0.08)'}`, background: data.type === t ? (t === 'product' ? 'rgba(59,130,246,0.12)' : 'rgba(139,92,246,0.12)') : 'rgba(255,255,255,0.03)', color: data.type === t ? (t === 'product' ? '#60a5fa' : '#a78bfa') : 'rgba(255,255,255,0.4)', fontWeight: 700, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                {t === 'product' ? <><Package size={14}/> Produto</> : <><Settings2 size={14}/> Serviço</>}
                            </button>
                        ))}
                    </div>

                    {/* Nome */}
                    <div><label style={lbl}>Nome *</label><input value={data.name} onChange={e => set('name', e.target.value)} style={inp} placeholder="Ex: Tela iPhone 13 Pro" autoFocus /></div>

                    {/* SKU gerado automaticamente */}
                    <div>
                        <label style={lbl}>
                            SKU Interno
                            {!isEdit && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', marginLeft: '6px' }}>gerado automaticamente</span>}
                        </label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <input value={data.sku} onChange={e => set('sku', e.target.value)} style={{ ...inp, fontFamily: 'monospace', flex: 1 }} placeholder="APL-TEL-ITE-1234" />
                            {!isEdit && <button onClick={() => set('sku', gerarSKU(data.name, data.brand, data.category))} style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa', cursor: 'pointer', fontSize: '11px', whiteSpace: 'nowrap' }}>Gerar</button>}
                        </div>
                    </div>

                    {/* Marca e Categoria com autocomplete */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <AutocompleteInput value={data.brand} onChange={v => set('brand', v)} label="Marca" suggestions={MARCAS_COMUNS} placeholder="Ex: Apple, Samsung..." />
                        <AutocompleteInput value={data.category} onChange={v => set('category', v)} label="Categoria" suggestions={CATEGORIAS_COMUNS} placeholder="Ex: Tela, Bateria..." />
                    </div>

                    {/* Código de barras + Unidade */}
                    {data.type === 'product' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div><label style={lbl}>Código de Barras</label><input value={data.barcode} onChange={e => set('barcode', e.target.value)} style={inp} placeholder="EAN-13" inputMode="numeric" /></div>
                            <div><label style={lbl}>Unidade</label>
                                <select value={data.unit} onChange={e => set('unit', e.target.value)} style={inp}>
                                    {UNIDADES.map(u => <option key={u}>{u}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Preços com máscara monetária */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <CurrencyInput
                            value={data.priceCost}
                            onChange={v => set('priceCost', v)}
                            label="Preço de Custo"
                        />
                        <CurrencyInput
                            value={data.priceSell}
                            onChange={v => set('priceSell', v)}
                            label={<>Preço de Venda {data.priceCost > 0 && <span style={{ color: margin >= 20 ? '#22c55e' : '#f59e0b', fontSize: '10px' }}>({margin.toFixed(0)}%)</span>}</>}
                        />
                    </div>

                    {/* Estoque mínimo */}
                    {data.type === 'product' && (
                        <div style={{ maxWidth: '50%' }}>
                            <label style={lbl}>Estoque mínimo</label>
                            <input type="number" min="0" inputMode="numeric" value={data.minQuantity} onChange={e => set('minQuantity', Number(e.target.value))} style={inp} />
                        </div>
                    )}

                    {/* Campos Nota Fiscal */}
                    {data.type === 'product' && (
                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px' }}>📄 Dados para Nota Fiscal</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <label style={lbl}>NCM</label>
                                    <input value={data.ncm} onChange={e => set('ncm', e.target.value)} style={inp} placeholder="Ex: 8517.12.31" inputMode="numeric" />
                                </div>
                                <div>
                                    <label style={lbl}>CFOP</label>
                                    <input value={data.cfop} onChange={e => set('cfop', e.target.value)} style={inp} placeholder="Ex: 5102" inputMode="numeric" />
                                </div>
                                <div style={{ gridColumn: '1/-1' }}>
                                    <label style={lbl}>Origem</label>
                                    <select value={data.origin} onChange={e => set('origin', e.target.value)} style={inp}>
                                        <option value="0">0 — Nacional</option>
                                        <option value="1">1 — Estrangeira (importação direta)</option>
                                        <option value="2">2 — Estrangeira (mercado interno)</option>
                                        <option value="3">3 — Nacional c/ mais de 40% conteúdo estrangeiro</option>
                                        <option value="8">8 — Nacional (operações com gás natural)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Descrição */}
                    <div><label style={lbl}>Descrição / Observações</label><textarea value={data.description} onChange={e => set('description', e.target.value)} style={{ ...inp, minHeight: '50px', resize: 'vertical', fontFamily: 'inherit' }} /></div>

                    {err && <div style={{ padding: '9px 13px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '13px' }}>{err}</div>}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                        <button onClick={save} disabled={saving} style={{ flex: 2, padding: '10px', borderRadius: '8px', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                            {saving ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Produto'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Modal de movimentação ─────────────────────────────────────
const MovementModal: React.FC<{ product: Product; onClose: () => void; onSuccess: () => void }> = ({ product, onClose, onSuccess }) => {
    const [type, setType] = useState<'entry' | 'exit' | 'adjust'>('entry');
    const [qty, setQty] = useState('');
    const [cost, setCost] = useState(String(product.priceCost || ''));
    const [reason, setReason] = useState('');
    const [invoice, setInvoice] = useState('');
    const [saving, setSaving] = useState(false);

    const current = product.balance?.quantity || 0;
    const newQty = type === 'adjust' ? Number(qty) : type === 'entry' ? current + Number(qty) : Math.max(0, current - Number(qty));

    const save = async () => {
        if (!qty || isNaN(Number(qty))) return;
        setSaving(true);
        try {
            if (type === 'entry') await api.post(`/inventory/${product.id}/entry`, { quantity: Number(qty), cost: Number(cost), reason, invoiceNumber: invoice });
            else if (type === 'exit') await api.post(`/inventory/${product.id}/exit`, { quantity: Number(qty), reason });
            else await api.post(`/inventory/${product.id}/adjust`, { quantity: Number(qty), reason });
            onSuccess();
        } catch (e: any) { alert(e?.response?.data?.message || 'Erro'); }
        finally { setSaving(false); }
    };

    const colors = { entry: '#22c55e', exit: '#ef4444', adjust: '#f59e0b' };
    const c = colors[type];

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
            <div style={{ background: '#0f0f18', border: `1px solid ${c}30`, borderRadius: '16px', width: '100%', maxWidth: '440px' }}>
                <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#fff' }}>Movimentação de Estoque</h3>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{product.name} · Atual: <strong style={{ color: '#fff' }}>{current} {product.unit || 'UN'}</strong></div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}><X size={15}/></button>
                </div>
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {([['entry','↑ Entrada','#22c55e'],['exit','↓ Saída','#ef4444'],['adjust','⇆ Ajuste','#f59e0b']] as const).map(([k, l, col]) => (
                            <button key={k} onClick={() => setType(k)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: `1px solid ${type === k ? col + '50' : 'rgba(255,255,255,0.08)'}`, background: type === k ? col + '18' : 'rgba(255,255,255,0.03)', color: type === k ? col : 'rgba(255,255,255,0.4)', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>
                                {l}
                            </button>
                        ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: type === 'entry' ? '1fr 1fr' : '1fr', gap: '10px' }}>
                        <div>
                            <label style={lbl}>{type === 'adjust' ? 'Novo saldo total' : 'Quantidade'}</label>
                            <input type="number" min="0" value={qty} onChange={e => setQty(e.target.value)} style={inp} autoFocus placeholder={type === 'adjust' ? 'Saldo final' : 'Qtd'} />
                        </div>
                        {type === 'entry' && <div><label style={lbl}>Custo unitário (R$)</label><input type="number" min="0" step="0.01" value={cost} onChange={e => setCost(e.target.value)} style={inp} /></div>}
                    </div>
                    {type === 'entry' && <div><label style={lbl}>Nº da Nota Fiscal (opcional)</label><input value={invoice} onChange={e => setInvoice(e.target.value)} style={inp} placeholder="NF 00123" /></div>}
                    <div><label style={lbl}>Motivo (opcional)</label><input value={reason} onChange={e => setReason(e.target.value)} style={inp} placeholder="Ex: Compra fornecedor, Quebra, Inventário..." /></div>
                    {qty && !isNaN(Number(qty)) && (
                        <div style={{ padding: '10px 14px', background: `${c}08`, border: `1px solid ${c}25`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Saldo após movimentação:</span>
                            <span style={{ fontSize: '18px', fontWeight: 800, color: c }}>{newQty} {product.unit || 'UN'}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                        <button onClick={save} disabled={saving || !qty} style={{ flex: 2, padding: '10px', borderRadius: '8px', background: `linear-gradient(135deg, ${c}, ${c}cc)`, border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: saving || !qty ? 0.6 : 1, fontSize: '13px' }}>
                            {saving ? 'Salvando...' : 'Confirmar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Componente principal ──────────────────────────────────────
export const Inventory: React.FC = () => {
    const [products, setProducts]   = useState<Product[]>([]);
    const [movements, setMovements] = useState<Movement[]>([]);
    const [abcData, setAbcData]     = useState<AbcItem[]>([]);
    const [summary, setSummary]     = useState<Summary | null>(null);
    const [loading, setLoading]     = useState(true);
    const [activeView, setActiveView] = useState<'produtos' | 'movimentacoes' | 'abc' | 'alertas'>('produtos');
    const [search, setSearch]       = useState('');
    const [filterType, setFilterType] = useState<'all' | 'product' | 'service'>('all');
    const [filterAbc, setFilterAbc] = useState<'' | 'A' | 'B' | 'C'>('');
    const [showModal, setShowModal] = useState(false);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [moveProduct, setMoveProduct] = useState<Product | null>(null);
    const [movFrom, setMovFrom]     = useState('');
    const [movTo, setMovTo]         = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [prodRes, sumRes, movRes, abcRes] = await Promise.all([
                api.get('/inventory'),
                api.get('/inventory/summary').catch(() => ({ data: null })),
                api.get('/inventory/movements').catch(() => ({ data: [] })),
                api.get('/inventory/abc').catch(() => ({ data: [] })),
            ]);
            setProducts(prodRes.data || []);
            setSummary(sumRes.data);
            setMovements(movRes.data || []);
            setAbcData(abcRes.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const loadMovements = useCallback(async () => {
        const res = await api.get(`/inventory/movements?from=${movFrom}&to=${movTo}`).catch(() => ({ data: [] }));
        setMovements(res.data || []);
    }, [movFrom, movTo]);

    useEffect(() => { if (activeView === 'movimentacoes') loadMovements(); }, [activeView, loadMovements]);

    const filtered = products.filter(p => {
        const q = search.toLowerCase();
        const matchSearch = !search || p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.barcode?.includes(q);
        const matchType = filterType === 'all' || p.type === filterType;
        return matchSearch && matchType;
    });

    const lowStockProducts = products.filter(p => p.type === 'product' && p.minQuantity > 0 && (p.balance?.quantity || 0) <= p.minQuantity);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={18} color="#3b82f6"/>
                    </div>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Estoque</h1>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>
                            {products.length} itens
                            {(summary?.lowStock || 0) > 0 && <span style={{ color: '#f59e0b', marginLeft: '8px' }}>· {summary?.lowStock} em estoque baixo</span>}
                            {(summary?.zeroStock || 0) > 0 && <span style={{ color: '#ef4444', marginLeft: '8px' }}>· {summary?.zeroStock} zerados</span>}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={load} style={{ padding: '9px', borderRadius: '9px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: loading ? '#3b82f6' : 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '40px', minHeight: '40px' }}>
                        <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/>
                    </button>
                    <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '9px', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer', background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', color: '#fff', minHeight: '40px' }}>
                        <Plus size={16}/> Novo Item
                    </button>
                </div>
            </div>

            {/* KPIs */}
            {summary && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '9px' }}>
                    {[
                        { l: 'Produtos', v: summary.totalItems, c: '#3b82f6' },
                        { l: 'Valor em Custo', v: R$(summary.totalValue), c: '#a855f7' },
                        { l: 'Valor em Venda', v: R$(summary.totalSellValue), c: '#22c55e' },
                        { l: 'Estoque Baixo', v: summary.lowStock, c: '#f59e0b', urgent: summary.lowStock > 0 },
                        { l: 'Zerados', v: summary.zeroStock, c: '#ef4444', urgent: summary.zeroStock > 0 },
                    ].map(({ l, v, c, urgent }) => (
                        <div key={l} style={{ padding: '12px 14px', background: 'var(--bg-secondary)', border: `1px solid ${urgent ? c + '40' : 'var(--border-color)'}`, borderRadius: '11px' }}>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginBottom: '6px' }}>{l}</div>
                            <div style={{ fontSize: '20px', fontWeight: 800, color: urgent ? c : '#fff', letterSpacing: '-0.5px' }}>{v}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Alerta estoque baixo */}
            {lowStockProducts.length > 0 && activeView === 'produtos' && (
                <div onClick={() => setActiveView('alertas')} style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '9px', cursor: 'pointer' }}>
                    <AlertTriangle size={15} color="#f59e0b" style={{ flexShrink: 0 }}/>
                    <span style={{ fontSize: '13px', color: '#fcd34d', fontWeight: 600 }}>{lowStockProducts.length} produto{lowStockProducts.length > 1 ? 's' : ''} com estoque abaixo do mínimo</span>
                    <span style={{ fontSize: '12px', color: '#f59e0b', marginLeft: 'auto' }}>Ver alertas →</span>
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '4px', width: 'fit-content', flexWrap: 'wrap' }}>
                {([['produtos','📦 Produtos'],['movimentacoes','📋 Movimentações'],['abc','📊 Curva ABC'],['alertas','⚠️ Alertas']] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setActiveView(key)} style={{ padding: '7px 14px', borderRadius: '7px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: activeView === key ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeView === key ? '#fff' : 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>
                        {label}{key === 'alertas' && lowStockProducts.length > 0 && <span style={{ marginLeft: '5px', fontSize: '10px', fontWeight: 800, background: '#f59e0b', color: '#000', padding: '1px 5px', borderRadius: '20px' }}>{lowStockProducts.length}</span>}
                    </button>
                ))}
            </div>

            {/* ── PRODUTOS ── */}
            {activeView === 'produtos' && (
                <>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                            <Search size={13} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}/>
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar nome, SKU, código de barras..." style={{ ...inp, paddingLeft: '34px', fontSize: '13px' }}/>
                        </div>
                        <div style={{ display: 'flex', gap: '3px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '3px' }}>
                            {([['all','Todos'],['product','Produtos'],['service','Serviços']] as const).map(([k, l]) => (
                                <button key={k} onClick={() => setFilterType(k)} style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: filterType === k ? 'rgba(59,130,246,0.2)' : 'transparent', color: filterType === k ? '#60a5fa' : 'rgba(255,255,255,0.4)' }}>{l}</button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }}/> Carregando...
                        </div>
                    ) : (
                        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '620px' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                            {['Produto', 'SKU / Barras', 'Custo', 'Venda', 'Margem', 'Estoque', 'Mín.', ''].map(h => (
                                                <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.length === 0 ? (
                                            <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Nenhum produto encontrado</td></tr>
                                        ) : filtered.map((p, i) => {
                                            const qty = p.balance?.quantity || 0;
                                            const isLow = p.type === 'product' && p.minQuantity > 0 && qty <= p.minQuantity;
                                            const margin = p.priceCost > 0 ? ((p.priceSell - p.priceCost) / p.priceCost * 100) : 0;
                                            return (
                                                <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                    <td style={{ padding: '11px 14px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: p.type === 'service' ? 'rgba(139,92,246,0.12)' : 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                {p.type === 'service' ? <Settings2 size={14} color="#a78bfa"/> : <Package size={14} color="#60a5fa"/>}
                                                            </div>
                                                            <div style={{ minWidth: 0 }}>
                                                                <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{p.name}</div>
                                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{p.brand || p.category || (p.type === 'service' ? 'Serviço' : 'Produto')}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '11px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>
                                                        {p.sku && <div>{p.sku}</div>}
                                                        {p.barcode && <div style={{ color: 'rgba(255,255,255,0.3)' }}>{p.barcode}</div>}
                                                        {!p.sku && !p.barcode && '—'}
                                                    </td>
                                                    <td style={{ padding: '11px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>{p.type === 'product' ? R$(p.priceCost) : '—'}</td>
                                                    <td style={{ padding: '11px 14px', fontSize: '13px', fontWeight: 600, color: '#22c55e', whiteSpace: 'nowrap' }}>{R$(p.priceSell)}</td>
                                                    <td style={{ padding: '11px 14px' }}>
                                                        {p.type === 'product' && p.priceCost > 0 ? (
                                                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', background: margin >= 30 ? 'rgba(34,197,94,0.12)' : margin >= 10 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)', color: margin >= 30 ? '#22c55e' : margin >= 10 ? '#f59e0b' : '#ef4444' }}>
                                                                {margin.toFixed(0)}%
                                                            </span>
                                                        ) : '—'}
                                                    </td>
                                                    <td style={{ padding: '11px 14px', fontSize: '14px', fontWeight: 700, color: p.type === 'service' ? 'rgba(255,255,255,0.3)' : isLow ? '#f59e0b' : qty === 0 ? '#ef4444' : '#fff' }}>
                                                        {p.type === 'service' ? '—' : (
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                                {qty}
                                                                {isLow && <AlertTriangle size={11} color="#f59e0b"/>}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '11px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{p.type === 'service' ? '—' : (p.minQuantity || '—')}</td>
                                                    <td style={{ padding: '11px 10px' }}>
                                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                                            {p.type === 'product' && (
                                                                <button onClick={() => setMoveProduct(p)} title="Movimentar estoque" style={{ padding: '6px', borderRadius: '7px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                                    <ArrowRightLeft size={12}/>
                                                                </button>
                                                            )}
                                                            <button onClick={() => setEditProduct(p)} style={{ padding: '6px', borderRadius: '7px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                                <Pencil size={12}/>
                                                            </button>
                                                            <button onClick={async () => { if (confirm(`Excluir "${p.name}"?`)) { await api.delete(`/inventory/${p.id}`); load(); } }} style={{ padding: '6px', borderRadius: '7px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                                <Trash2 size={12}/>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div style={{ padding: '9px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                                <span>{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
                                <span>Valor em venda: <strong style={{ color: '#22c55e' }}>{R$(filtered.filter(p => p.type === 'product').reduce((s, p) => s + p.priceSell * (p.balance?.quantity || 0), 0))}</strong></span>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ── MOVIMENTAÇÕES ── */}
            {activeView === 'movimentacoes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input type="date" value={movFrom} onChange={e => setMovFrom(e.target.value)} style={{ ...inp, width: 'auto', fontSize: '13px' }} />
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>até</span>
                        <input type="date" value={movTo} onChange={e => setMovTo(e.target.value)} style={{ ...inp, width: 'auto', fontSize: '13px' }} />
                        <button onClick={loadMovements} style={{ padding: '9px 14px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Filtrar</button>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
                                <thead><tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    {['Tipo','Produto','Qtd','Custo Unit.','Antes','Depois','Motivo','Data'].map(h => (
                                        <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr></thead>
                                <tbody>
                                    {movements.length === 0 ? (
                                        <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Nenhuma movimentação no período</td></tr>
                                    ) : movements.map((m, i) => {
                                        const cfg = MOVEMENT_LABELS[m.type] || { label: m.type, color: '#94a3b8', icon: '·' };
                                        return (
                                            <tr key={m.id} style={{ borderBottom: i < movements.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                <td style={{ padding: '10px 14px' }}><span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}20` }}>{cfg.icon} {cfg.label}</span></td>
                                                <td style={{ padding: '10px 14px', fontSize: '13px', color: '#fff', fontWeight: 500, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.product?.name || '—'}</td>
                                                <td style={{ padding: '10px 14px', fontSize: '14px', fontWeight: 700, color: m.type === 'ENTRY' ? '#22c55e' : '#ef4444' }}>
                                                    {m.type.includes('EXIT') ? '-' : '+'}{m.quantity}
                                                </td>
                                                <td style={{ padding: '10px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{m.unitCost > 0 ? R$(m.unitCost) : '—'}</td>
                                                <td style={{ padding: '10px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{m.balanceBefore}</td>
                                                <td style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 700, color: '#fff' }}>{m.balanceAfter}</td>
                                                <td style={{ padding: '10px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.45)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(m as any).reason || '—'}</td>
                                                <td style={{ padding: '10px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>{fmtDate(m.createdAt)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ── CURVA ABC ── */}
            {activeView === 'abc' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {(['','A','B','C'] as const).map(k => (
                            <button key={k} onClick={() => setFilterAbc(k)} style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, border: `1px solid ${filterAbc === k ? (ABC_CFG[k as 'A']?.color || '#60a5fa') + '50' : 'rgba(255,255,255,0.08)'}`, background: filterAbc === k ? (ABC_CFG[k as 'A']?.bg || 'rgba(59,130,246,0.1)') : 'rgba(255,255,255,0.03)', color: filterAbc === k ? (ABC_CFG[k as 'A']?.color || '#60a5fa') : 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                                {k || 'Todos'}{k && ` — ${ABC_CFG[k]?.label}`}
                            </button>
                        ))}
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '540px' }}>
                                <thead><tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    {['Classe','#','Produto','Qtd em Estoque','Valor Total','% Acumulado'].map(h => (
                                        <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                    ))}
                                </tr></thead>
                                <tbody>
                                    {(filterAbc ? abcData.filter(i => i.abc === filterAbc) : abcData).map((item, i) => {
                                        const cfg = ABC_CFG[item.abc];
                                        return (
                                            <tr key={item.id} style={{ borderBottom: i < abcData.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                <td style={{ padding: '10px 14px' }}><span style={{ fontSize: '12px', fontWeight: 800, padding: '2px 9px', borderRadius: '20px', background: cfg.bg, color: cfg.color }}>{item.abc}</span></td>
                                                <td style={{ padding: '10px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{i + 1}</td>
                                                <td style={{ padding: '10px 14px', fontSize: '13px', color: '#fff', fontWeight: 500 }}>{item.name}<br/><span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>{item.sku}</span></td>
                                                <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>{item.quantity}</td>
                                                <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: 700, color: '#22c55e' }}>{R$(item.value)}</td>
                                                <td style={{ padding: '10px 14px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                                                            <div style={{ height: '100%', width: `${item.cumulativePct}%`, background: cfg.color, borderRadius: '3px' }}/>
                                                        </div>
                                                        <span style={{ fontSize: '11px', color: cfg.color, fontWeight: 700, minWidth: '42px', textAlign: 'right' }}>{item.cumulativePct.toFixed(1)}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ── ALERTAS ── */}
            {activeView === 'alertas' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {lowStockProducts.length === 0 ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                            <Package size={32} style={{ opacity: 0.2 }}/>
                            <p style={{ margin: 0, fontSize: '14px' }}>Nenhum produto com estoque baixo!</p>
                        </div>
                    ) : lowStockProducts.map(p => {
                        const qty = p.balance?.quantity || 0;
                        const pct = p.minQuantity > 0 ? Math.min((qty / p.minQuantity) * 100, 100) : 100;
                        const color = qty === 0 ? '#ef4444' : pct < 50 ? '#f59e0b' : '#22c55e';
                        return (
                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: 'var(--bg-secondary)', border: `1px solid ${color}25`, borderRadius: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <AlertTriangle size={18} color={color}/>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>{p.name}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px' }}/>
                                        </div>
                                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
                                            {qty} / {p.minQuantity} mín.
                                        </span>
                                    </div>
                                    {p.sku && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '3px', fontFamily: 'monospace' }}>SKU: {p.sku}</div>}
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontSize: '22px', fontWeight: 900, color, letterSpacing: '-0.5px' }}>{qty}</div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>em estoque</div>
                                </div>
                                <button onClick={() => setMoveProduct(p)} style={{ padding: '8px 14px', borderRadius: '9px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                    Repor estoque
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modais */}
            {(showModal || editProduct) && (
                <ProductModal
                    product={editProduct}
                    onClose={() => { setShowModal(false); setEditProduct(null); }}
                    onSuccess={() => { setShowModal(false); setEditProduct(null); load(); }}
                />
            )}
            {moveProduct && (
                <MovementModal
                    product={moveProduct}
                    onClose={() => setMoveProduct(null)}
                    onSuccess={() => { setMoveProduct(null); load(); }}
                />
            )}
        </div>
    );
};
