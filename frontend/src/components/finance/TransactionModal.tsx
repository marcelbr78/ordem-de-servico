import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X, Save } from 'lucide-react';
import { CustomSelect } from '../CustomSelect';
import api from '../../services/api';

interface TransactionModalProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ onClose, onSuccess, initialData }) => {
    const { register, handleSubmit, watch, control, formState: { isSubmitting } } = useForm({
        defaultValues: initialData || {
            type: 'INCOME',
            amount: '',
            category: '',
            paymentMethod: 'PIX',
            description: '',
        }
    });

    const type = watch('type');

    const onSubmit = async (data: any) => {
        try {
            await api.post('/finance', {
                ...data,
                amount: parseFloat(data.amount)
            });
            onSuccess();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar transação');
        }
    };

    const modalOverlay: React.CSSProperties = {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '20px',
        overflowY: 'auto'
    };

    const glassBg = {
        background: 'rgba(20,20,35,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
        padding: '24px', width: '100%', maxWidth: '500px', margin: 'auto'
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '10px 12px', borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
        color: '#fff', fontSize: '14px', outline: 'none', marginBottom: '16px'
    };

    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '6px'
    };

    return (
        <div style={modalOverlay} onClick={onClose}>
            <div style={glassBg} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>Nova Transação</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Type Toggle */}
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '4px', marginBottom: '20px' }}>
                        <label style={{
                            flex: 1, textAlign: 'center', padding: '10px', borderRadius: '8px', cursor: 'pointer',
                            background: type === 'INCOME' ? 'rgba(16,185,129,0.2)' : 'transparent',
                            color: type === 'INCOME' ? '#10b981' : 'rgba(255,255,255,0.5)',
                            fontWeight: 600, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}>
                            <input type="radio" value="INCOME" {...register('type')} style={{ display: 'none' }} />
                            Entrada
                        </label>
                        <label style={{
                            flex: 1, textAlign: 'center', padding: '10px', borderRadius: '8px', cursor: 'pointer',
                            background: type === 'EXPENSE' ? 'rgba(239,68,68,0.2)' : 'transparent',
                            color: type === 'EXPENSE' ? '#ef4444' : 'rgba(255,255,255,0.5)',
                            fontWeight: 600, transition: 'all 0.2s'
                        }}>
                            <input type="radio" value="EXPENSE" {...register('type')} style={{ display: 'none' }} />
                            Saída
                        </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Valor (R$)</label>
                            <input type="number" step="0.01" {...register('amount', { required: true })} style={inputStyle} placeholder="0,00" />
                        </div>
                        <div>
                            <label style={labelStyle}>Método</label>
                            <Controller
                                name="paymentMethod"
                                control={control}
                                render={({ field }) => (
                                    <CustomSelect
                                        value={field.value}
                                        onChange={field.onChange}
                                        options={[
                                            { label: 'PIX', value: 'PIX' },
                                            { label: 'Dinheiro', value: 'DINHEIRO' },
                                            { label: 'Cartão Crédito', value: 'CARTAO_M' },
                                            { label: 'Cartão Débito', value: 'CARTAO_D' },
                                            { label: 'Boleto', value: 'BOLETO' }
                                        ]}
                                    />
                                )}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Categoria</label>
                        <input list="categories" {...register('category', { required: true })} style={inputStyle} placeholder="Ex: Venda, Aluguel, Peças..." />
                        <datalist id="categories">
                            <option value="Venda Balcão" />
                            <option value="Pagamento OS" />
                            <option value="Compra de Peças" />
                            <option value="Aluguel" />
                            <option value="Internet/Luz" />
                            <option value="Salários" />
                        </datalist>
                    </div>

                    <div>
                        <label style={labelStyle}>Descrição (Opcional)</label>
                        <textarea {...register('description')} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Detalhes adicionais..." />
                    </div>

                    <button disabled={isSubmitting} type="submit" style={{
                        width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                        background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
                        color: '#fff', fontWeight: 700, fontSize: '16px', cursor: isSubmitting ? 'wait' : 'pointer',
                        marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}>
                        <Save size={20} />
                        {isSubmitting ? 'Salvando...' : 'Registrar Transação'}
                    </button>
                </form>
            </div>
        </div>
    );
};
