import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { Plus, Trash2, Save, Search, X, UserPlus } from 'lucide-react';
import { CustomSelect } from '../CustomSelect';
import api from '../../services/api';
import type { Client } from '../../types';
import ClientForm from '../ClientForm'; // Corrected import ClientForm

interface OrderFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

interface OrderFormData {
    clientId: string;
    technicianId: string;
    priority: 'baixa' | 'normal' | 'alta' | 'urgente';
    initialObservations: string;
    equipments: {
        type: string;
        brand: string;
        model: string;
        serialNumber?: string;
        reportedDefect: string;
        accessories?: string;
        isMain: boolean;
        functionalChecklist?: string;
    }[];
}

const steps = ['Cliente', 'Equipamentos', 'Fotos', 'Detalhes'];

const COMMON_BRANDS = ['Apple', 'Samsung', 'Motorola', 'Xiaomi', 'Asus', 'LG', 'Nokia', 'Realme', 'Huawei', 'Positivo', 'Lenovo', 'Dell', 'HP', 'Acer'];
const COMMON_MODELS: Record<string, string[]> = {
    'Apple': ['iPhone 11', 'iPhone 12', 'iPhone 13', 'iPhone 14', 'iPhone 15', 'iPhone Pro Max', 'Macbook Air', 'Macbook Pro', 'iPad Pro', 'iPad Air', 'iPad mini', 'Apple Watch'],
    'Samsung': ['Galaxy S20', 'Galaxy S21', 'Galaxy S22', 'Galaxy S23', 'Galaxy S24', 'Galaxy A10', 'Galaxy A54', 'Galaxy Tab S9', 'Galaxy Book'],
    'Motorola': ['Moto G', 'Moto G20', 'Moto G30', 'Moto G60', 'Moto Edge', 'Moto One'],
    'Xiaomi': ['Redmi Note 11', 'Redmi Note 12', 'Redmi Note 13', 'Poco X5', 'Poco F5', 'Mi 13', 'Pad 6'],
    'Dell': ['Inspiron', 'Vostro', 'Latitude', 'XPS', 'G15'],
    'HP': ['Pavilion', 'EliteBook', 'ProBook', 'Omen'],
    'Acer': ['Aspire 3', 'Aspire 5', 'Nitro 5', 'Predator', 'Swift'],
    'Asus': ['Vivobook', 'Zenbook', 'ROG', 'TUF'],
    'Lenovo': ['Ideapad', 'ThinkPad', 'Legion', 'Yoga'],
};

const CHECKLIST_ITEMS = [
    { id: 'cam_front', label: 'Câmera Frontal' },
    { id: 'cam_rear', label: 'Câmera Traseira' },
    { id: 'charging', label: 'Carregamento' },
    { id: 'screen', label: 'Tela' },
    { id: 'touch', label: 'Touch' },
    { id: 'audio', label: 'Som/Áudio' },
    { id: 'calling', label: 'Ligação' },
    { id: 'wifi', label: 'WiFi' },
    { id: 'signal', label: 'Sinal/Rede' },
    { id: 'face_id', label: 'FaceID/Biometria' },
    { id: 'buttons', label: 'Botões' },
    { id: 'battery', label: 'Bateria' },
];

// ─── STYLES FROM CLIENTFORM ───
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
const glassBg: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px',
};

import { PhotoGallery } from '../common/PhotoGallery';

// ... (existing imports)

export const OrderForm: React.FC<OrderFormProps> = ({ onClose, onSuccess }) => {
    const [step, setStep] = useState(0);
    const [clients, setClients] = useState<Client[]>([]);
    const [searchClient, setSearchClient] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [technicians, setTechnicians] = useState<{ id: string, name: string }[]>([]);
    const [isRegisteringClient, setIsRegisteringClient] = useState(false);
    const [registerLoading, setRegisterLoading] = useState(false);
    const [photos, setPhotos] = useState<File[]>([]);
    const [lookupLoading, setLookupLoading] = useState<Record<number, boolean>>({});

    const { register, control, handleSubmit, setValue, formState: { isValid, errors } } = useForm<OrderFormData>({
        defaultValues: {
            priority: 'normal',
            equipments: [{ type: 'Celular', brand: '', model: '', reportedDefect: '', isMain: true }]
        },
        mode: 'onChange'
    });

    const { fields, append, remove } = useFieldArray({ control, name: "equipments" });
    const watchedEquipments = useWatch({ control, name: 'equipments' });

    useEffect(() => {
        if (searchClient.length > 2) {
            const delayDebounceFn = setTimeout(async () => {
                try {
                    const response = await api.get(`/clients?search=${searchClient}`);
                    setClients(response.data);
                } catch (error) {
                    console.error("Erro ao buscar clientes", error);
                }
            }, 500);
            return () => clearTimeout(delayDebounceFn);
        } else {
            setClients([]);
        }
    }, [searchClient]);

    useEffect(() => {
        // Load logged user as technician
        const user = localStorage.getItem('@OS:user');
        if (user) {
            try {
                const userData = JSON.parse(user);
                if (userData && userData.id) {
                    setTechnicians([{ id: userData.id, name: userData.name || 'Técnico Logado' }]);
                    setValue('technicianId', userData.id, { shouldValidate: true });
                }
            } catch (e) {
                console.error('Invalid user data', e);
            }
        }
    }, [setValue]);

    const onSubmit = async (data: OrderFormData) => {
        try {
            console.log('Submitting Order:', data);
            const res = await api.post('/orders', data);
            const newOrderId = res.data.id;

            // Upload Photos if any
            if (photos.length > 0) {
                try {
                    for (const file of photos) {
                        const formData = new FormData();
                        formData.append('file', file);
                        await api.post(`/orders/${newOrderId}/images`, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                    }
                } catch (photoError) {
                    console.error('Error uploading photos:', photoError);
                    alert('OS criada, mas houve erro ao enviar algumas fotos.');
                }
            }

            onSuccess();
        } catch (error: any) {
            console.error('Error creating order:', error);
            const msg = error?.response?.data?.message || 'Erro desconhecido';
            alert('Erro ao criar OS: ' + (Array.isArray(msg) ? msg.join(', ') : msg));
        }
    };

    const handleCreateClient = async (data: any) => {
        setRegisterLoading(true);
        try {
            const response = await api.post('/clients', data);
            const newClient = response.data;
            setSelectedClient(newClient);
            setValue('clientId', newClient.id);
            setIsRegisteringClient(false);
            // Optionally clear search
            setSearchClient('');
            setClients([]);
        } catch (error: any) {
            console.error('Error creating client:', error);
            const msg = error?.response?.data?.message || 'Erro ao cadastrar cliente';
            alert('Erro: ' + (Array.isArray(msg) ? msg.join(', ') : msg));
        } finally {
            setRegisterLoading(false);
        }
    };

    const nextStep = () => {
        if (step === 0 && !selectedClient) { alert('Selecione um cliente'); return; }
        setStep(s => s + 1);
    };
    const prevStep = () => setStep(s => s - 1);

    return (
        <div className="animate-fade">
            {/* Header / Wizard Steps via Inline Styles */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {isRegisteringClient ? 'Novo Cliente' : 'Nova Ordem de Serviço'}
                    </h2>
                    {!isRegisteringClient && (
                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            {steps.map((label, idx) => (
                                <div key={label} style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    color: idx <= step ? '#6366f1' : 'rgba(255,255,255,0.4)',
                                    fontSize: '13px', fontWeight: 600
                                }}>
                                    <div style={{
                                        width: '20px', height: '20px', borderRadius: '50%',
                                        background: idx <= step ? '#6366f1' : 'rgba(255,255,255,0.1)',
                                        color: idx <= step ? '#fff' : 'rgba(255,255,255,0.5)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px'
                                    }}>{idx + 1}</div>
                                    {label}
                                    {idx < steps.length - 1 && <div style={{ width: '20px', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                    <X size={24} />
                </button>
            </div>

            <div style={{ ...glassBg, padding: '24px' }}>

                {/* STEP 1: CLIENTE */}
                {step === 0 && (
                    <div style={sectionStyle}>
                        {isRegisteringClient ? (
                            <div>
                                <ClientForm
                                    onSubmit={handleCreateClient}
                                    onCancel={() => setIsRegisteringClient(false)}
                                    loading={registerLoading}
                                />
                            </div>
                        ) : (
                            <>
                                <div style={sectionTitleStyle}>👤 Selecione o Cliente</div>
                                {selectedClient ? (
                                    <div style={{
                                        background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
                                        borderRadius: '10px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 600, color: '#fff', fontSize: '16px' }}>{selectedClient.nome}</div>
                                            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginTop: '4px' }}>{selectedClient.cpfCnpj} • {selectedClient.email}</div>
                                        </div>
                                        <button onClick={() => { setSelectedClient(null); setValue('clientId', ''); }}
                                            style={{ background: 'transparent', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 600 }}>
                                            Trocar
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                            <div style={{ position: 'relative', flex: 1 }}>
                                                <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'rgba(255,255,255,0.3)' }} />
                                                <input autoFocus value={searchClient} onChange={e => setSearchClient(e.target.value)}
                                                    placeholder="Buscar cliente por Nome, CPF/CNPJ..."
                                                    style={{ ...inputStyle, paddingLeft: '36px' }}
                                                />
                                            </div>
                                            <button onClick={() => setIsRegisteringClient(true)}
                                                style={{
                                                    padding: '0 16px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.5)',
                                                    background: 'rgba(99,102,241,0.1)', color: '#fff', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', whiteSpace: 'nowrap'
                                                }}>
                                                <UserPlus size={16} /> Novo Cliente
                                            </button>
                                        </div>

                                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            {clients.map(client => (
                                                <div key={client.id} onClick={() => { setSelectedClient(client); setValue('clientId', client.id); }}
                                                    style={{
                                                        padding: '12px', borderRadius: '8px', marginBottom: '8px', cursor: 'pointer',
                                                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                                                    }}>
                                                    <div style={{ color: '#fff', fontWeight: 500 }}>{client.nome}</div>
                                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{client.cpfCnpj}</div>
                                                </div>
                                            ))}
                                            {searchClient && clients.length === 0 && (
                                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                                    <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '12px' }}>Nenhum cliente encontrado</div>
                                                    <button onClick={() => setIsRegisteringClient(true)}
                                                        style={{
                                                            color: '#6366f1', background: 'transparent', border: 'none',
                                                            cursor: 'pointer', fontSize: '14px', fontWeight: 500
                                                        }}>
                                                        Cadastrar novo cliente agora
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* STEP 2: EQUIPAMENTOS */}
                {step === 1 && !isRegisteringClient && (
                    <div style={sectionStyle}>
                        <div style={{ ...sectionTitleStyle, justifyContent: 'space-between' }}>
                            <span>📱 Equipamentos</span>
                            <button onClick={() => append({ type: 'Celular', brand: '', model: '', reportedDefect: '', isMain: false })}
                                style={{ color: '#6366f1', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                                <Plus size={14} /> Adicionar
                            </button>
                        </div>

                        {fields.map((field, index) => (
                            <div key={field.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>ITEM #{index + 1} {index === 0 && '(PRINCIPAL)'}</span>
                                    {fields.length > 1 && <button onClick={() => remove(index)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                    <div>
                                        <div style={labelStyle}>Tipo</div>
                                        <input {...register(`equipments.${index}.type` as const, { required: true })} style={inputStyle} placeholder="Ex: Celular" list="equipment-types" />
                                        <datalist id="equipment-types">
                                            <option value="Celular" />
                                            <option value="Notebook" />
                                            <option value="Tablet" />
                                            <option value="Macbook" />
                                            <option value="Videogame" />
                                            <option value="Monitor" />
                                            <option value="Relógio (Smartwatch)" />
                                        </datalist>
                                    </div>
                                    <div>
                                        <div style={labelStyle}>Marca</div>
                                        <input {...register(`equipments.${index}.brand` as const, { required: true })} style={inputStyle} placeholder="Samsung" list={`brands-${index}`} />
                                        <datalist id={`brands-${index}`}>
                                            {COMMON_BRANDS.map(b => <option key={b} value={b} />)}
                                        </datalist>
                                    </div>
                                    <div>
                                        <div style={labelStyle}>Modelo</div>
                                        <input {...register(`equipments.${index}.model` as const, { required: true })} style={inputStyle} placeholder="S23" list={`models-${index}`} />
                                        <datalist id={`models-${index}`}>
                                            {(() => {
                                                const watchedBrand = watchedEquipments?.[index]?.brand;
                                                const models = (watchedBrand && COMMON_MODELS[watchedBrand])
                                                    ? COMMON_MODELS[watchedBrand]
                                                    : Object.values(COMMON_MODELS).flat();
                                                return Array.from(new Set(models)).map(m => <option key={m} value={m} />);
                                            })()}
                                        </datalist>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '12px' }}>
                                    <div style={labelStyle}>Serial / IMEI</div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            {...register(`equipments.${index}.serialNumber` as const)}
                                            style={inputStyle}
                                            placeholder="IMEI ou Serial"
                                            onBlur={async (e) => {
                                                const serial = e.target.value;
                                                if (serial.length >= 3) {
                                                    try {
                                                        setLookupLoading(prev => ({ ...prev, [index]: true }));
                                                        const response = await api.get(`/orders/equipment/lookup/${serial}`);
                                                        if (response.data) {
                                                            setValue(`equipments.${index}.type`, response.data.type);
                                                            setValue(`equipments.${index}.brand`, response.data.brand);
                                                            setValue(`equipments.${index}.model`, response.data.model);
                                                        }
                                                    } catch (error) {
                                                        console.error("Erro ao buscar equipamento por serial", error);
                                                    } finally {
                                                        setLookupLoading(prev => ({ ...prev, [index]: false }));
                                                    }
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            disabled={lookupLoading[index]}
                                            onClick={async () => {
                                                const serial = watchedEquipments?.[index]?.serialNumber;
                                                if (serial && serial.length >= 3) {
                                                    try {
                                                        setLookupLoading(prev => ({ ...prev, [index]: true }));
                                                        const response = await api.get(`/orders/equipment/lookup/${serial}`);
                                                        if (response.data) {
                                                            setValue(`equipments.${index}.type`, response.data.type);
                                                            setValue(`equipments.${index}.brand`, response.data.brand);
                                                            setValue(`equipments.${index}.model`, response.data.model);
                                                        }
                                                    } catch (error) {
                                                        console.error("Erro ao buscar equipamento por serial", error);
                                                    } finally {
                                                        setLookupLoading(prev => ({ ...prev, [index]: false }));
                                                    }
                                                }
                                            }}
                                            style={{
                                                padding: '0 12px',
                                                background: lookupLoading[index] ? 'rgba(255, 255, 255, 0.05)' : 'rgba(99, 102, 241, 0.2)',
                                                border: '1px solid rgba(99, 102, 241, 0.4)',
                                                borderRadius: '8px',
                                                color: '#6366f1',
                                                cursor: lookupLoading[index] ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s'
                                            }}
                                            title="Buscar no histórico ou API"
                                        >
                                            {lookupLoading[index] ? (
                                                <div style={{ width: '14px', height: '14px', border: '2px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                            ) : (
                                                <Search size={14} />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* CHECKLIST DE FUNCIONAMENTO */}
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ ...labelStyle, marginBottom: '10px', color: 'var(--primary)', fontWeight: 700 }}>VERIFICAÇÃO DE FUNCIONAMENTO (ENTRADA)</div>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                        gap: '8px',
                                        background: 'rgba(255,255,255,0.02)',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        {CHECKLIST_ITEMS.map((item) => (
                                            <label key={item.id} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                padding: '6px',
                                                borderRadius: '4px',
                                                transition: 'background 0.2s'
                                            }} className="hover:bg-white/5">
                                                <input
                                                    type="checkbox"
                                                    onChange={(e) => {
                                                        const currentChecklist = JSON.parse(field.functionalChecklist || '{}');
                                                        currentChecklist[item.id] = e.target.checked;
                                                        setValue(`equipments.${index}.functionalChecklist`, JSON.stringify(currentChecklist));
                                                    }}
                                                    checked={JSON.parse(field.functionalChecklist || '{}')[item.id] || false}
                                                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                                                />
                                                <span style={{ color: 'rgba(255,255,255,0.8)' }}>{item.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div><div style={labelStyle}>Defeito Relatado *</div><input {...register(`equipments.${index}.reportedDefect` as const, { required: true })} style={inputStyle} placeholder="Descreva o defeito..." /></div>
                            </div>
                        ))}
                    </div>
                )}

                {/* STEP 3: FOTOS */}
                {step === 2 && !isRegisteringClient && (
                    <div style={sectionStyle}>
                        <div style={sectionTitleStyle}>📷 Fotos do Equipamento</div>
                        <PhotoGallery
                            mode="local"
                            localFiles={photos}
                            onLocalFilesChange={setPhotos}
                        />
                    </div>
                )}

                {/* STEP 4: DETALHES */}
                {step === 3 && !isRegisteringClient && (
                    <div style={sectionStyle}>
                        <div style={sectionTitleStyle}>📝 Detalhes Finais</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                            <div>
                                <div style={labelStyle}>Prioridade</div>
                                <Controller
                                    name="priority"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomSelect
                                            value={field.value}
                                            onChange={field.onChange}
                                            options={[
                                                { label: 'Normal', value: 'normal' },
                                                { label: 'Baixa', value: 'baixa' },
                                                { label: 'Alta', value: 'alta' },
                                                { label: 'Urgente', value: 'urgente' }
                                            ]}
                                        />
                                    )}
                                />
                            </div>
                            <div>
                                <div style={labelStyle}>Técnico Responsável *</div>
                                <Controller
                                    name="technicianId"
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field }) => (
                                        <CustomSelect
                                            value={field.value}
                                            onChange={field.onChange}
                                            options={technicians.map(t => ({ label: t.name, value: t.id }))}
                                            placeholder="Selecione..."
                                            searchable
                                        />
                                    )}
                                />
                                {errors.technicianId && <span style={{ color: '#ef4444', fontSize: '11px' }}>Selecione um técnico</span>}
                            </div>
                        </div>
                        <div>
                            <div style={labelStyle}>Observações Iniciais</div>
                            <textarea {...register('initialObservations')} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Observações..." />
                        </div>
                    </div>
                )}

                {/* FOOTER ACTIONS - Hide when registering client */}
                {!isRegisteringClient && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        {step > 0 && (
                            <button onClick={prevStep} style={{
                                padding: '10px 24px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                                background: 'transparent', color: '#fff', cursor: 'pointer'
                            }}>Voltar</button>
                        )}

                        {step < steps.length - 1 ? (
                            <button onClick={nextStep} disabled={step === 0 && !selectedClient} style={{
                                padding: '10px 32px', borderRadius: '8px', border: 'none',
                                background: 'linear-gradient(135deg, var(--primary), #7c3aed)', color: '#fff',
                                fontWeight: 600, cursor: 'pointer', opacity: (step === 0 && !selectedClient) ? 0.5 : 1
                            }}>
                                Próximo
                            </button>
                        ) : (
                            <button onClick={handleSubmit(onSubmit)} style={{
                                padding: '10px 32px', borderRadius: '8px', border: 'none',
                                background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
                                fontWeight: 600, cursor: 'pointer', opacity: !isValid ? 0.5 : 1
                            }}>
                                <Save size={16} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} /> Finalizar OS
                            </button>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};
