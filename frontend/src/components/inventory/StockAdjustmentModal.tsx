import React from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, ArrowRightLeft } from 'lucide-react';
import api from '../../services/api';

interface StockAdjustmentModalProps {
    onClose: () => void;
    onSuccess: () => void;
    product: any;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({ onClose, onSuccess, product }) => {
    const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm({
        defaultValues: {
            type: 'IN',
            quantity: 1,
        }
    });

    const type = watch('type');

    const onSubmit = async (data: any) => {
        try {
            await api.put(`/inventory/${product.id}/${data.type}/${data.quantity}`);
            onSuccess();
        } catch (error) {
            console.error(error);
            alert('Erro ao ajustar estoque');
        }
    };

    const modalOverlay: React.CSSProperties = {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '20px',
        overflowY: 'auto'
    };

    const glassBg = {
        background: 'rgba(20,20,35,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
        padding: '24px', width: '100%', maxWidth: '400px', margin: 'auto'
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '10px 12px', borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
        color: '#fff', fontSize: '14px', outline: 'none', marginBottom: '16px'
    };

    return (
        <div style={modalOverlay} onClick={onClose}>
            <div style={glassBg} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <ArrowRightLeft size={24} className="text-yellow-500" />
                            Ajuste de Estoque
                        </h2>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                            {product.name} (Atual: {product.balance?.quantity || 0})
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Type Toggle */}
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '4px', marginBottom: '20px' }}>
                        <label style={{
                            flex: 1, textAlign: 'center', padding: '10px', borderRadius: '8px', cursor: 'pointer',
                            background: type === 'IN' ? 'rgba(16,185,129,0.2)' : 'transparent',
                            color: type === 'IN' ? '#10b981' : 'rgba(255,255,255,0.5)',
                            fontWeight: 600, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}>
                            <input type="radio" value="IN" {...register('type')} style={{ display: 'none' }} />
                            Entrada
                        </label>
                        <label style={{
                            flex: 1, textAlign: 'center', padding: '10px', borderRadius: '8px', cursor: 'pointer',
                            background: type === 'OUT' ? 'rgba(239,68,68,0.2)' : 'transparent',
                            color: type === 'OUT' ? '#ef4444' : 'rgba(255,255,255,0.5)',
                            fontWeight: 600, transition: 'all 0.2s'
                        }}>
                            <input type="radio" value="OUT" {...register('type')} style={{ display: 'none' }} />
                            Saída
                        </label>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>Quantidade</label>
                        <input type="number" min="1" {...register('quantity', { required: true, min: 1 })} style={inputStyle} />
                    </div>

                    <button disabled={isSubmitting} type="submit" style={{
                        width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                        background: 'linear-gradient(135deg, var(--primary), #eab308)',
                        color: '#fff', fontWeight: 700, fontSize: '16px', cursor: isSubmitting ? 'wait' : 'pointer',
                        marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}>
                        <Save size={20} />
                        {isSubmitting ? 'Processar Ajuste' : 'Confirmar'}
                    </button>
                </form>
            </div>
        </div>
    );
};
