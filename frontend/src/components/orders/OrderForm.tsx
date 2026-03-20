import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { Plus, Trash2, Save, Search, X, UserPlus } from 'lucide-react';
import { CustomSelect } from '../CustomSelect';
import api from '../../services/api';
import type { Client } from '../../types';
import ClientForm from '../ClientForm';
import { SmartInput } from '../ui/SmartInput';

interface OrderFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

interface OrderFormData {
    clientId: string;
    technicianId: string;
    priority: 'baixa' | 'normal' | 'alta' | 'urgente';
    initialObservations: string;
    expectedDeliveryDate?: string;
    observations?: string;
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
const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.6)', marginBottom: '6px' };
const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 12px', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff',
    fontSize: '16px', // 16px evita zoom automático no iOS
    outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' as const,
};
const glassBg: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px',
};

import { PhotoGallery } from '../common/PhotoGallery';
import { SuggestionsPanel } from './SuggestionsPanel';

const PatternLock = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
    const path = value ? value.split('').map(Number) : [];
    const getPos = (n: number) => ({ x: 15 + ((n - 1) % 3) * 45, y: 15 + Math.floor((n - 1) / 3) * 45 });
    return (
        <div style={{ width: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <div style={{ width: '120px', height: '120px', position: 'relative' }}>
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                    {path.map((dot, i) => {
                        if (i === 0) return null;
                        const p1 = getPos(path[i - 1]);
                        const p2 = getPos(dot);
                        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#6366f1" strokeWidth="3" strokeLinecap="round" opacity={0.6} />;
                    })}
                </svg>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(dot => {
                    const isActive = path.includes(dot);
                    const isLast = path[path.length - 1] === dot;
                    const pos = getPos(dot);
                    return (
                        <div key={dot}
                            onClick={() => {
                                if (isActive && isLast) onChange(path.slice(0, -1).join(''));
                                else if (!isActive) onChange([...path, dot].join(''));
                                else onChange([dot].join(''));
                            }}
                            style={{
                                position: 'absolute', top: pos.y - 15, left: pos.x - 15, width: '30px', height: '30px', borderRadius: '50%',
                                background: isActive ? '#6366f1' : 'rgba(255,255,255,0.05)',
                                border: isActive ? 'none' : '2px solid rgba(255,255,255,0.15)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s', zIndex: 2
                            }}
                        >
                            {isActive && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />}
                        </div>
                    );
                })}
            </div>
            <button type="button" onClick={() => onChange('')} style={{ marginTop: '12px', fontSize: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', padding: '5px 12px', borderRadius: '12px', cursor: 'pointer' }}>
                Limpar
            </button>
        </div>
    );
};

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
            {/* Header / Wizard Steps */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#fff' }}>
                        {isRegisteringClient ? 'Novo Cliente' : 'Nova Ordem de Serviço'}
                    </h2>
                    {!isRegisteringClient && (
                        <div style={{ display: 'flex', alignItems: 'center', marginTop: '12px', gap: '0' }}>
                            {steps.map((label, idx) => (
                                <React.Fragment key={label}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'default' }}>
                                        <div style={{
                                            width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                                            background: idx < step ? '#6366f1' : idx === step ? 'linear-gradient(135deg,#6366f1,#7c3aed)' : 'rgba(255,255,255,0.08)',
                                            color: idx <= step ? '#fff' : 'rgba(255,255,255,0.4)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700,
                                            boxShadow: idx === step ? '0 0 0 3px rgba(99,102,241,0.25)' : 'none',
                                            transition: 'all 0.2s',
                                        }}>{idx + 1}</div>
                                        <span style={{ fontSize: '10px', fontWeight: 600, color: idx <= step ? '#6366f1' : 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
                                            {label}
                                        </span>
                                    </div>
                                    {idx < steps.length - 1 && (
                                        <div style={{ flex: 1, height: '2px', background: idx < step ? '#6366f1' : 'rgba(255,255,255,0.08)', margin: '0 4px 20px', transition: 'background 0.3s' }} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                </div>
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', borderRadius: '8px', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <X size={18} />
                </button>
            </div>

            <div style={{ ...glassBg, padding: '20px' }}>

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
                                                <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'rgba(255,255,255,0.3)', zIndex: 1 }} />
                                                <input autoFocus value={searchClient}
                                                    onChange={e => {
                                                        // Capitalizar primeira letra de cada palavra
                                                        const v = e.target.value;
                                                        setSearchClient(v);
                                                    }}
                                                    placeholder="Buscar cliente por Nome, CPF/CNPJ..."
                                                    style={{ ...inputStyle, paddingLeft: '36px' }}
                                                    autoComplete="off"
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
                                        <Controller
                                            control={control}
                                            name={`equipments.${index}.type`}
                                            rules={{ required: true }}
                                            render={({ field }) => (
                                                <SmartInput
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    endpoint="/autocomplete/equipment-types"
                                                    placeholder="Ex: Celular"
                                                    minChars={0}
                                                />
                                            )}
                                        />
                                    </div>
                                    <div>
                                        <div style={labelStyle}>Marca</div>
                                        <Controller
                                            control={control}
                                            name={`equipments.${index}.brand`}
                                            rules={{ required: true }}
                                            render={({ field }) => (
                                                <SmartInput
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    endpoint="/autocomplete/brands"
                                                    placeholder="Samsung, Apple..."
                                                    minChars={0}
                                                />
                                            )}
                                        />
                                    </div>
                                    <div>
                                        <div style={labelStyle}>Modelo</div>
                                        <Controller
                                            control={control}
                                            name={`equipments.${index}.model`}
                                            rules={{ required: true }}
                                            render={({ field }) => (
                                                <SmartInput
                                                    value={field.value}
                                                    onChange={v => field.onChange(v)}
                                                    endpoint="/autocomplete/models"
                                                    extraParams={{ brand: watchedEquipments?.[index]?.brand || '' }}
                                                    placeholder="Galaxy A54..."
                                                    minChars={0}
                                                />
                                            )}
                                        />
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
                                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 2fr) auto', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                                    <div style={{ minWidth: 'min-content' }}>
                                        <div style={{ ...labelStyle, marginBottom: '10px', color: 'var(--primary)', fontWeight: 700 }}>VERIFICAÇÃO DE FUNCIONAMENTO (ENTRADA)</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            {CHECKLIST_ITEMS.map((item) => {
                                                const state = JSON.parse(watchedEquipments?.[index]?.functionalChecklist || '{}')[item.id];
                                                return (
                                                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', padding: '6px', borderRadius: '4px' }} className="hover:bg-white/5">
                                                        <span style={{ color: 'rgba(255,255,255,0.8)' }}>{item.label}</span>
                                                        <button type="button" onClick={() => {
                                                            const d = JSON.parse(watchedEquipments?.[index]?.functionalChecklist || '{}');
                                                            if (state === undefined || state === null) d[item.id] = true;
                                                            else if (state === true) d[item.id] = false;
                                                            else delete d[item.id];
                                                            setValue(`equipments.${index}.functionalChecklist`, JSON.stringify(d));
                                                        }} style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: state === true ? '#22c55e' : state === false ? '#ef4444' : 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {state === true ? '✓' : state === false ? '✕' : ''}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 18px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ ...labelStyle, margin: '0 0 16px 0', color: 'var(--primary)', fontWeight: 700 }}>PADRÃO ANDROID</div>
                                        <PatternLock 
                                            value={JSON.parse(watchedEquipments?.[index]?.functionalChecklist || '{}')['androidPattern'] || ''}
                                            onChange={(val) => {
                                                const d = JSON.parse(watchedEquipments?.[index]?.functionalChecklist || '{}');
                                                d['androidPattern'] = val;
                                                setValue(`equipments.${index}.functionalChecklist`, JSON.stringify(d));
                                            }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr)', gap: '12px', marginBottom: '16px' }}>
                                    <div>
                                        <div style={labelStyle}>O que acompanha? (Acessórios)</div>
                                        <input
                                            {...register(`equipments.${index}.accessories` as const)}
                                            style={inputStyle}
                                            placeholder="Ex: Capa preta, carregador original, película..."
                                        />
                                    </div>
                                    <div>
                                        <div style={labelStyle}>Senha ou PIN numérico</div>
                                        <input
                                            type="text"
                                            onChange={(e) => {
                                                const d = JSON.parse(watchedEquipments?.[index]?.functionalChecklist || '{}');
                                                d['password'] = e.target.value;
                                                setValue(`equipments.${index}.functionalChecklist`, JSON.stringify(d));
                                            }}
                                            value={JSON.parse(watchedEquipments?.[index]?.functionalChecklist || '{}')['password'] || ''}
                                            style={inputStyle}
                                            placeholder="Ex: 123456, Abc@123..."
                                        />
                                    </div>
                                    <div>
                                        <div style={labelStyle}>Padrão de Desenho</div>
                                        <input
                                            type="text"
                                            onChange={(e) => {
                                                const d = JSON.parse(watchedEquipments?.[index]?.functionalChecklist || '{}');
                                                d['pattern'] = e.target.value.replace(/[^1-9]/g, '');
                                                setValue(`equipments.${index}.functionalChecklist`, JSON.stringify(d));
                                            }}
                                            value={JSON.parse(watchedEquipments?.[index]?.functionalChecklist || '{}')['pattern'] || ''}
                                            style={inputStyle}
                                            placeholder="Z = 1235789"
                                            maxLength={9}
                                        />
                                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>Sequência usando números 1 a 9 no teclado telefônico.</div>
                                    </div>
                                </div>

                                <div>
                                    <div style={labelStyle}>Defeito Relatado *</div>
                                    <Controller
                                        control={control}
                                        name={`equipments.${index}.reportedDefect`}
                                        rules={{ required: true }}
                                        render={({ field }) => (
                                            <SmartInput
                                                value={field.value}
                                                onChange={field.onChange}
                                                endpoint="/autocomplete/symptoms"
                                                extraParams={{
                                                    brand: watchedEquipments?.[index]?.brand || '',
                                                    model: watchedEquipments?.[index]?.model || '',
                                                }}
                                                placeholder="Descreva o defeito relatado pelo cliente..."
                                                minChars={2}
                                            />
                                        )}
                                    />
                                </div>

                                <SuggestionsPanel
                                    model={watchedEquipments?.[index]?.model || ''}
                                    symptom={watchedEquipments?.[index]?.reportedDefect || ''}
                                />

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
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) minmax(180px, 1.5fr) minmax(150px, 1fr)', gap: '12px', marginBottom: '16px', alignItems: 'start' }}>
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
                            <div>
                                <div style={labelStyle}>Prazo / Previsão (Opcional)</div>
                                <input
                                    type="date"
                                    {...register('expectedDeliveryDate')}
                                    style={{ ...inputStyle, minHeight: '42px' }}
                                />
                            </div>
                        </div>
                        
                        <div style={{ marginTop: '16px' }}>
                            <div style={labelStyle}>Observações / Condições Especiais (Opcional)</div>
                            <textarea
                                {...register('observations')}
                                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                                placeholder="E.g.: Aparelho deixado sem película. Cliente ciente do risco X. Tela com trinco..."
                            />
                        </div>
                        <div>
                            <div style={labelStyle}>Observações Iniciais</div>
                            <textarea {...register('initialObservations')} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Observações..." />
                        </div>
                    </div>
                )}

                {/* FOOTER ACTIONS - Hide when registering client */}
                {!isRegisteringClient && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <div>
                            {step > 0 && (
                                <button onClick={prevStep} style={{
                                    padding: '12px 24px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)',
                                    background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                                    fontSize: '14px', fontWeight: 600, minHeight: '48px',
                                }}>← Voltar</button>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                                {step + 1} de {steps.length}
                            </span>
                            {step < steps.length - 1 ? (
                                <button onClick={nextStep} disabled={step === 0 && !selectedClient} style={{
                                    padding: '12px 32px', borderRadius: '10px', border: 'none',
                                    background: (step === 0 && !selectedClient) ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, var(--primary), #7c3aed)',
                                    color: '#fff', fontWeight: 700, cursor: (step === 0 && !selectedClient) ? 'not-allowed' : 'pointer',
                                    fontSize: '14px', minHeight: '48px',
                                }}>
                                    Próximo →
                                </button>
                            ) : (
                                <button onClick={handleSubmit(onSubmit)} style={{
                                    padding: '12px 32px', borderRadius: '10px', border: 'none',
                                    background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
                                    fontWeight: 700, cursor: 'pointer', fontSize: '14px', minHeight: '48px',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                }}>
                                    <Save size={16} /> Criar OS
                                </button>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
