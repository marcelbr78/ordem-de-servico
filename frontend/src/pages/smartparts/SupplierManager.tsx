import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Phone, Star, Package } from 'lucide-react';
import api from '../../services/api';

interface Supplier {
    id: string;
    name: string;
    phone: string;
    active: boolean;
    reliability: number;
    deliveryDays: number;
}

const glassStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '24px',
    color: '#fff'
};

const inputStyle = {
    width: '100%',
    padding: '12px',
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#fff',
    marginTop: '4px'
};

export function SupplierManager() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState<Partial<Supplier>>({ reliability: 5, active: true });

    const fetchSuppliers = async () => {
        try {
            const res = await api.get('/smartparts/suppliers');
            setSuppliers(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (formData.id) {
                await api.patch(`/smartparts/suppliers/${formData.id}`, formData);
            } else {
                await api.post('/smartparts/suppliers', formData);
            }
            setShowModal(false);
            setFormData({ reliability: 5, active: true });
            fetchSuppliers();
        } catch {
            alert('Erro ao salvar fornecedor');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza?')) return;
        try {
            await api.delete(`/smartparts/suppliers/${id}`);
            fetchSuppliers();
        } catch {
            alert('Erro ao excluir');
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>Gestão de Fornecedores</h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)' }}>SmartParts - Cotação Automática</p>
                </div>
                <button
                    onClick={() => { setFormData({ reliability: 5, active: true }); setShowModal(true); }}
                    style={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '12px',
                        color: 'white',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer'
                    }}
                >
                    <Plus size={18} /> Novo Fornecedor
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {suppliers.map(supplier => (
                    <div key={supplier.id} style={{ ...glassStyle, position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                <Package size={20} color="#6366f1" />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => { setFormData(supplier); setShowModal(true); }} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}><Edit3 size={16} /></button>
                                <button onClick={() => handleDelete(supplier.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                            </div>
                        </div>

                        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>{supplier.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '16px' }}>
                            <Phone size={14} /> {supplier.phone}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Star size={12} fill="#eab308" color="#eab308" /> {supplier.reliability}
                            </span>
                            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}>
                                📦 {supplier.deliveryDays} dias
                            </span>
                            <span style={{ background: supplier.active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: supplier.active ? '#34d399' : '#f87171', padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}>
                                {supplier.active ? 'Ativo' : 'Inativo'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ ...glassStyle, width: '100%', maxWidth: '800px', background: '#1a1a1a' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>
                            {formData.id ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Nome da Empresa</label>
                                    <input required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} placeholder="Ex: Distribuidora Silva" />
                                </div>
                                <div>
                                    <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>WhatsApp</label>
                                    <input required value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={inputStyle} placeholder="Ex: 5511999999999" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Confiabilidade (1-5)</label>
                                        <input type="number" min="1" max="5" required value={formData.reliability || 5} onChange={e => setFormData({ ...formData, reliability: parseInt(e.target.value) })} style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Prazo (dias)</label>
                                        <input type="number" min="0" required value={formData.deliveryDays || 1} onChange={e => setFormData({ ...formData, deliveryDays: parseInt(e.target.value) })} style={inputStyle} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                    <input type="checkbox" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} />
                                    <label>Ativo para cotações</label>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
