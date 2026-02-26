import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { CustomSelect } from '../CustomSelect';
import api from '../../services/api';

// REFRESH_V4_PURIFIED_CLIENT_PATTERN
interface ProductModalProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

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

export const ProductModal: React.FC<ProductModalProps> = ({ onClose, onSuccess, initialData }) => {
    const [form, setForm] = useState({
        name: initialData?.name || '',
        description: initialData?.description || '',
        sku: initialData?.sku || '',
        barcode: initialData?.barcode || '',
        brand: initialData?.brand || '',
        category: initialData?.category || '',
        unit: initialData?.unit || 'UN',
        priceCost: initialData?.priceCost?.toString() || '',
        priceSell: initialData?.priceSell?.toString() || '',
        minQuantity: initialData?.minQuantity?.toString() || '5',
        supplierId: initialData?.supplierId || '',
        ncm: initialData?.ncm || '',
        cfop: initialData?.cfop || '',
        origin: initialData?.origin || '0',
        type: initialData?.type || 'product',
    });

    const [loading, setLoading] = useState(false);
    const [lookingUp, setLookingUp] = useState(false);
    const [showFiscal, setShowFiscal] = useState(false);
    const [suppliers, setSuppliers] = useState<any[]>([]);

    useEffect(() => {
        api.get('/smartparts/suppliers').then(res => {
            setSuppliers(res.data || []);
        }).catch(() => { });
    }, []);

    const updateField = useCallback((field: string, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleBarcodeBlur = async () => {
        const barcode = form.barcode;
        if (!barcode || barcode.length < 8) return;
        setLookingUp(true);
        try {
            const res = await api.get(`/inventory/barcode/${barcode}`);
            if (res.data && res.data.found) {
                updateField('name', res.data.name);
            }
        } catch (error) {
            console.error('Barcode lookup failed', error);
        } finally {
            setLookingUp(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name || !form.priceSell) {
            alert('Por favor, preencha o nome e o preço de venda.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...form,
                priceCost: parseFloat(form.priceCost) || 0,
                priceSell: parseFloat(form.priceSell) || 0,
                minQuantity: parseInt(form.minQuantity) || 0,
                supplierId: form.supplierId || undefined,
            };

            if (initialData?.id) {
                await api.put(`/inventory/${initialData.id}`, payload);
            } else {
                await api.post('/inventory', payload);
            }
            onSuccess();
        } catch (error: any) {
            console.error(error);
            alert(error?.response?.data?.message || 'Erro ao salvar produto');
        } finally {
            setLoading(false);
        }
    };

    const categories = ['Tela', 'Bateria', 'Conector', 'Câmera', 'Alto-falante', 'Flex', 'Carcaça', 'Placa', 'Outros'];
    const units = ['UN', 'PÇ', 'CX', 'KG', 'MT', 'LT'];
    const origins = [
        { value: '0', label: '0 - Nacional' },
        { value: '1', label: '1 - Estrangeira (importação direta)' },
        { value: '2', label: '2 - Estrangeira (mercado interno)' },
    ];

    return (
        <form onSubmit={handleSubmit} style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '12px' }}>
            {/* ─── Tipo de Item ─── */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <button
                    type="button"
                    onClick={() => updateField('type', 'product')}
                    style={{
                        flex: 1, padding: '10px', borderRadius: '8px',
                        background: form.type === 'product' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600,
                        transition: 'all 0.2s'
                    }}
                >
                    Produto
                </button>
                <button
                    type="button"
                    onClick={() => updateField('type', 'service')}
                    style={{
                        flex: 1, padding: '10px', borderRadius: '8px',
                        background: form.type === 'service' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600,
                        transition: 'all 0.2s'
                    }}
                >
                    Serviço
                </button>
            </div>

            {/* ─── 📦 Informações Básicas ─── */}
            <div style={sectionStyle}>
                <div style={sectionTitleStyle}>
                    {form.type === 'product' ? '📦 Dados do Produto' : '🔧 Dados do Serviço'}
                </div>

                <div className="grid-responsive-2" style={{ marginBottom: '12px' }}>
                    {form.type === 'product' ? (
                        <div>
                            <label style={labelStyle}>Código de Barras (EAN/GTIN)</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    value={form.barcode}
                                    onChange={e => updateField('barcode', e.target.value)}
                                    onBlur={handleBarcodeBlur}
                                    style={inputStyle}
                                    placeholder="Escaneie ou digite..."
                                />
                                {lookingUp && <span style={{ position: 'absolute', right: 12, top: 12, fontSize: '11px', color: 'var(--primary)' }}>Buscando...</span>}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label style={labelStyle}>Nome do Serviço *</label>
                            <input
                                value={form.name}
                                onChange={e => updateField('name', e.target.value)}
                                style={inputStyle}
                                placeholder="Ex: Mão de obra Troca de Tela"
                                required
                            />
                        </div>
                    )}

                    {form.type === 'product' && (
                        <div>
                            <label style={labelStyle}>Nome do Produto *</label>
                            <input
                                value={form.name}
                                onChange={e => updateField('name', e.target.value)}
                                style={inputStyle}
                                placeholder="Ex: Tela iPhone 13"
                                required
                            />
                        </div>
                    )}
                </div>

                <div style={{ marginBottom: '12px' }}>
                    <label style={labelStyle}>Descrição</label>
                    <textarea
                        value={form.description}
                        onChange={e => updateField('description', e.target.value)}
                        rows={2}
                        style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }}
                        placeholder={form.type === 'product' ? "Descrição detalhada do produto..." : "Descrição do serviço..."}
                    />
                </div>

                {form.type === 'product' && (
                    <>
                        <div className="grid-responsive-2" style={{ marginBottom: '12px' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <label style={{ ...labelStyle, marginBottom: 0 }}>SKU (Código)</label>
                                    <button
                                        type="button"
                                        onClick={() => updateField('sku', Math.floor(100000 + Math.random() * 900000).toString())}
                                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        <RefreshCw size={12} /> Gerar 6 dígitos
                                    </button>
                                </div>
                                <input
                                    value={form.sku}
                                    onChange={e => updateField('sku', e.target.value)}
                                    style={inputStyle}
                                    placeholder="Ex: TELA-IP13"
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Marca</label>
                                <input
                                    value={form.brand}
                                    onChange={e => updateField('brand', e.target.value)}
                                    style={inputStyle}
                                    placeholder="Ex: Apple"
                                />
                            </div>
                        </div>
                    </>
                )}

                <div className="grid-responsive-2">
                    <div>
                        <label style={labelStyle}>Categoria</label>
                        <CustomSelect
                            value={form.category}
                            onChange={val => updateField('category', val)}
                            options={[{ label: 'Selecionar...', value: '' }, ...categories.map(c => ({ label: c, value: c }))]}
                        />
                    </div>
                    {form.type === 'product' && (
                        <div>
                            <label style={labelStyle}>Unidade</label>
                            <CustomSelect
                                value={form.unit}
                                onChange={val => updateField('unit', val)}
                                options={units.map(u => ({ label: u, value: u }))}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* ─── 💰 Preços e Custos ─── */}
            <div style={sectionStyle}>
                <div style={sectionTitleStyle}>💰 Preços {form.type === 'product' && 'e Estoque'}</div>
                <div className="grid-responsive-2" style={{ marginBottom: '12px' }}>
                    {form.type === 'product' && (
                        <div>
                            <label style={labelStyle}>Preço Custo (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.priceCost}
                                onChange={e => updateField('priceCost', e.target.value)}
                                style={inputStyle}
                                placeholder="0,00"
                            />
                        </div>
                    )}
                    <div style={{ gridColumn: form.type === 'service' ? 'span 2' : 'auto' }}>
                        <label style={labelStyle}>Preço Venda (R$) *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={form.priceSell}
                            onChange={e => updateField('priceSell', e.target.value)}
                            style={inputStyle}
                            placeholder="0,00"
                            required
                        />
                    </div>
                </div>

                {form.type === 'product' && (
                    <div className="grid-responsive-2">
                        <div>
                            <label style={labelStyle}>Estoque Mínimo</label>
                            <input
                                type="number"
                                value={form.minQuantity}
                                onChange={e => updateField('minQuantity', e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Fornecedor</label>
                            <CustomSelect
                                value={form.supplierId}
                                onChange={val => updateField('supplierId', val)}
                                options={[{ label: 'Nenhum', value: '' }, ...suppliers.map(s => ({ label: s.name, value: s.id }))]}
                                searchable
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* ─── 📋 Dados Fiscais ─── */}
            {form.type === 'product' && (
                <div style={sectionStyle}>
                    <button
                        type="button"
                        onClick={() => setShowFiscal(!showFiscal)}
                        style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            width: '100%', background: 'transparent', border: 'none', color: 'var(--primary)',
                            fontWeight: 600, fontSize: '14px', cursor: 'pointer', outline: 'none'
                        }}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📋 Dados Fiscais (NCM / CFOP / Origem)</span>
                        {showFiscal ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>

                    {showFiscal && (
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="grid-responsive-2" style={{ marginBottom: '12px' }}>
                                <div>
                                    <label style={labelStyle}>NCM</label>
                                    <input
                                        value={form.ncm}
                                        onChange={e => updateField('ncm', e.target.value)}
                                        style={inputStyle}
                                        placeholder="Ex: 8517.12.31"
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>CFOP</label>
                                    <input
                                        value={form.cfop}
                                        onChange={e => updateField('cfop', e.target.value)}
                                        style={inputStyle}
                                        placeholder="Ex: 5102"
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Origem</label>
                                <CustomSelect
                                    value={form.origin}
                                    onChange={val => updateField('origin', val)}
                                    options={[{ label: 'Selecionar...', value: '' }, ...origins]}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ─── Ações ─── */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px' }}>
                <button type="button" onClick={onClose}
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
                    {loading ? 'Salvando...' : `Salvar ${form.type === 'product' ? 'Produto' : 'Serviço'}`}
                </button>
            </div>
        </form>
    );
};
