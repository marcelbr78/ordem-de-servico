import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X, Save, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { CustomSelect } from '../CustomSelect';
import api from '../../services/api';

interface ProductModalProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

export const ProductModal: React.FC<ProductModalProps> = ({ onClose, onSuccess, initialData }) => {
    const [lookingUp, setLookingUp] = useState(false);
    const [showFiscal, setShowFiscal] = useState(false);
    const [suppliers, setSuppliers] = useState<any[]>([]);

    const { register, handleSubmit, setValue, control, formState: { isSubmitting } } = useForm({
        defaultValues: initialData || {
            name: '',
            description: '',
            sku: '',
            barcode: '',
            brand: '',
            category: '',
            unit: 'UN',
            ncm: '',
            cfop: '',
            origin: '',
            supplierId: '',
            minQuantity: 5,
            priceCost: '',
            priceSell: '',
        }
    });

    useEffect(() => {
        api.get('/smartparts/suppliers').then(res => {
            setSuppliers(res.data || []);
        }).catch(() => { });
    }, []);

    const handleBarcodeBlur = async (barcode: string) => {
        if (!barcode || barcode.length < 8) return;
        setLookingUp(true);
        try {
            const res = await api.get(`/inventory/barcode/${barcode}`);
            if (res.data && res.data.found) {
                setValue('name', res.data.name);
            }
        } catch (error) {
            console.error('Barcode lookup failed', error);
        } finally {
            setLookingUp(false);
        }
    };

    const onSubmit = async (data: any) => {
        try {
            const payload = {
                ...data,
                priceCost: parseFloat(data.priceCost) || 0,
                priceSell: parseFloat(data.priceSell) || 0,
                minQuantity: parseInt(data.minQuantity) || 0,
                supplierId: data.supplierId || undefined,
            };

            if (initialData?.id) {
                await api.put(`/inventory/${initialData.id}`, payload);
            } else {
                await api.post('/inventory', payload);
            }
            onSuccess();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar produto');
        }
    };

    const categories = ['Tela', 'Bateria', 'Conector', 'Câmera', 'Alto-falante', 'Flex', 'Carcaça', 'Placa', 'Outros'];
    const units = ['UN', 'PÇ', 'CX', 'KG', 'MT', 'LT'];
    const origins = [
        { value: '0', label: '0 - Nacional' },
        { value: '1', label: '1 - Estrangeira (importação direta)' },
        { value: '2', label: '2 - Estrangeira (mercado interno)' },
    ];

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '10px 12px', borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
        color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)',
        marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.3px',
    };



    const sectionStyle: React.CSSProperties = {
        marginBottom: '20px',
    };

    const fieldGap = '12px';

    return (
        <div
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
                padding: '20px',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'rgba(20,20,35,0.98)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px', width: '100%', maxWidth: '560px',
                    maxHeight: '90vh', overflowY: 'auto',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    position: 'sticky', top: 0, background: 'rgba(20,20,35,0.98)', zIndex: 1, borderRadius: '16px 16px 0 0',
                }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                        <Package size={22} color="#3b82f6" />
                        {initialData ? 'Editar Produto' : 'Novo Produto'}
                    </h2>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '24px' }}>
                    {/* ─── INFORMAÇÕES BÁSICAS ─── */}
                    <div style={sectionStyle}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(99,102,241,0.8)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                            Informações Básicas
                        </div>

                        <div style={{ marginBottom: fieldGap }}>
                            <label style={labelStyle}>Código de Barras (EAN/GTIN)</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                    {...register('barcode')}
                                    onBlur={(e) => handleBarcodeBlur(e.target.value)}
                                    style={inputStyle}
                                    placeholder="Escaneie ou digite..."
                                />
                                {lookingUp && <span style={{ color: '#6366f1', fontSize: '12px', whiteSpace: 'nowrap' }}>Buscando...</span>}
                            </div>
                        </div>

                        <div style={{ marginBottom: fieldGap }}>
                            <label style={labelStyle}>Nome do Produto *</label>
                            <input {...register('name', { required: true })} style={inputStyle} placeholder="Ex: Tela iPhone 13" />
                        </div>

                        <div style={{ marginBottom: fieldGap }}>
                            <label style={labelStyle}>Descrição</label>
                            <textarea
                                {...register('description')}
                                rows={2}
                                style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }}
                                placeholder="Descrição detalhada do produto..."
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: fieldGap, marginBottom: fieldGap }}>
                            <div>
                                <label style={labelStyle}>SKU (Código)</label>
                                <input {...register('sku')} style={inputStyle} placeholder="Ex: TELA-IP13" />
                            </div>
                            <div>
                                <label style={labelStyle}>Marca</label>
                                <input {...register('brand')} style={inputStyle} placeholder="Ex: Apple" />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: fieldGap }}>
                            <div>
                                <label style={labelStyle}>Categoria</label>
                                <Controller
                                    name="category"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomSelect
                                            value={field.value}
                                            onChange={field.onChange}
                                            options={[{ label: 'Selecionar...', value: '' }, ...categories.map(c => ({ label: c, value: c }))]}
                                            placeholder="Selecionar..."
                                        />
                                    )}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Unidade</label>
                                <Controller
                                    name="unit"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomSelect
                                            value={field.value}
                                            onChange={field.onChange}
                                            options={units.map(u => ({ label: u, value: u }))}
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ─── PREÇOS E ESTOQUE ─── */}
                    <div style={sectionStyle}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(52,211,153,0.8)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                            Preços e Estoque
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: fieldGap, marginBottom: fieldGap }}>
                            <div>
                                <label style={labelStyle}>Preço Custo (R$)</label>
                                <input type="number" step="0.01" {...register('priceCost')} style={inputStyle} placeholder="0,00" />
                            </div>
                            <div>
                                <label style={labelStyle}>Preço Venda (R$)</label>
                                <input type="number" step="0.01" {...register('priceSell')} style={inputStyle} placeholder="0,00" />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: fieldGap }}>
                            <div>
                                <label style={labelStyle}>Estoque Mínimo</label>
                                <input type="number" {...register('minQuantity')} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Fornecedor</label>
                                <Controller
                                    name="supplierId"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomSelect
                                            value={field.value}
                                            onChange={field.onChange}
                                            options={[{ label: 'Nenhum', value: '' }, ...suppliers.map(s => ({ label: s.name, value: s.id }))]}
                                            placeholder="Nenhum"
                                            searchable
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ─── DADOS FISCAIS (colapsável) ─── */}
                    <div style={sectionStyle}>
                        <button
                            type="button"
                            onClick={() => setShowFiscal(!showFiscal)}
                            style={{
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '8px', padding: '10px 14px', width: '100%',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '11px',
                                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                            }}
                        >
                            <span>📋 Dados Fiscais (NCM / CFOP / Origem)</span>
                            {showFiscal ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        {showFiscal && (
                            <div style={{ marginTop: '12px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: fieldGap, marginBottom: fieldGap }}>
                                    <div>
                                        <label style={labelStyle}>NCM</label>
                                        <input {...register('ncm')} style={inputStyle} placeholder="Ex: 8517.12.31" />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>CFOP</label>
                                        <input {...register('cfop')} style={inputStyle} placeholder="Ex: 5102" />
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Origem</label>
                                    <Controller
                                        name="origin"
                                        control={control}
                                        render={({ field }) => (
                                            <CustomSelect
                                                value={field.value}
                                                onChange={field.onChange}
                                                options={[{ label: 'Selecionar...', value: '' }, ...origins]}
                                                placeholder="Selecionar..."
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ─── BOTÃO SALVAR ─── */}
                    <button disabled={isSubmitting} type="submit" style={{
                        width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                        background: 'linear-gradient(135deg, var(--primary), #3b82f6)',
                        color: '#fff', fontWeight: 700, fontSize: '15px', cursor: isSubmitting ? 'wait' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        opacity: isSubmitting ? 0.7 : 1, transition: 'opacity 0.2s',
                    }}>
                        <Save size={18} />
                        {isSubmitting ? 'Salvando...' : 'Salvar Produto'}
                    </button>
                </form>
            </div>
        </div>
    );
};
