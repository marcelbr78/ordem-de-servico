import React, { useState } from 'react';
import { Settings, FileCheck, X } from 'lucide-react';
import api from '../../services/api';

interface OrderEquipmentTabProps {
    order: any;
    onUpdate: () => void;
}

export const OrderEquipmentTab: React.FC<OrderEquipmentTabProps> = ({ order, onUpdate }) => {
    const [editingEqId, setEditingEqId] = useState<string | null>(null);
    const [editEqData, setEditEqData] = useState<any>(null);
    const [savingEq, setSavingEq] = useState(false);

    const handleEditEq = (eq: any) => {
        setEditingEqId(eq.id);
        setEditEqData({ ...eq });
    };

    const handleSaveEq = async () => {
        if (!editingEqId || !editEqData) return;
        setSavingEq(true);
        try {
            await api.patch(`/orders/equipment/${editingEqId}`, editEqData);
            setEditingEqId(null);
            setEditEqData(null);
            onUpdate();
        } catch (error) {
            console.error('Error saving equipment:', error);
            alert('Erro ao salvar alterações do equipamento');
        } finally {
            setSavingEq(false);
        }
    };

    const isLocked = order.status === 'finalizada' || order.status === 'entregue';

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

    return (
        <div style={{ display: 'grid', gap: '16px' }}>
            {order.equipments?.map((eq: any, index: number) => {
                const isEditing = editingEqId === eq.id;
                return (
                    <div key={eq.id || index} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px', display: 'flex', gap: '24px', position: 'relative' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
                                    <Settings size={20} />
                                </div>
                                {isEditing ? (
                                    <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                                        <input
                                            value={editEqData.brand}
                                            onChange={e => setEditEqData({ ...editEqData, brand: e.target.value })}
                                            placeholder="Marca"
                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '4px 8px', borderRadius: '4px', flex: 1 }}
                                        />
                                        <input
                                            value={editEqData.model}
                                            onChange={e => setEditEqData({ ...editEqData, model: e.target.value })}
                                            placeholder="Modelo"
                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '4px 8px', borderRadius: '4px', flex: 1 }}
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>{eq.brand} {eq.model}</h4>
                                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{eq.type} • {eq.serialNumber || 'Sem Serial / IMEI'}</div>
                                    </div>
                                )}

                                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {eq.isMain && <span style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', fontSize: '11px', padding: '4px 8px', borderRadius: '6px', fontWeight: 700 }}>PRINCIPAL</span>}
                                    {isEditing ? (
                                        <>
                                            <button onClick={handleSaveEq} disabled={savingEq} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                                {savingEq ? 'Salvando...' : 'Salvar'}
                                            </button>
                                            <button onClick={() => setEditingEqId(null)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                                Cancelar
                                            </button>
                                        </>
                                    ) : (!isLocked && (
                                        <button onClick={() => handleEditEq(eq)} style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                            Editar
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gap: '12px' }}>
                                {isEditing && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>Tipo</span>
                                            <input
                                                value={editEqData.type}
                                                onChange={e => setEditEqData({ ...editEqData, type: e.target.value })}
                                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '6px', marginTop: '4px' }}
                                            />
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>Serial / IMEI</span>
                                            <input
                                                value={editEqData.serialNumber || ''}
                                                onChange={e => setEditEqData({ ...editEqData, serialNumber: e.target.value })}
                                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '6px', marginTop: '4px' }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {!isEditing && eq.functionalChecklist && (
                                    <div style={{ background: 'rgba(0,0,0,0.15)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.5px', display: 'block', marginBottom: '10px' }}>
                                            Checklist de Entrada
                                        </span>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                                            {(() => {
                                                try {
                                                    const checklist = JSON.parse(eq.functionalChecklist);
                                                    return CHECKLIST_ITEMS.map(item => (
                                                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: checklist[item.id] ? '#10b981' : 'rgba(255,255,255,0.3)' }}>
                                                            {checklist[item.id] ? <FileCheck size={14} /> : <X size={14} />}
                                                            <span>{item.label}</span>
                                                        </div>
                                                    ));
                                                } catch {
                                                    return <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Erro ao carregar checklist</span>;
                                                }
                                            })()}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>Defeito Relatado</span>
                                    {isEditing ? (
                                        <textarea
                                            value={editEqData.reportedDefect}
                                            onChange={e => setEditEqData({ ...editEqData, reportedDefect: e.target.value })}
                                            style={{ width: '100%', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', margin: '4px 0 0', minHeight: '80px', outline: 'none' }}
                                        />
                                    ) : (
                                        <p style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)', fontSize: '14px', margin: '4px 0 0' }}>{eq.reportedDefect}</p>
                                    )}
                                </div>

                                <div>
                                    <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>Condição Estética / Acessórios</span>
                                    {isEditing ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
                                            <input
                                                value={editEqData.condition || ''}
                                                onChange={e => setEditEqData({ ...editEqData, condition: e.target.value })}
                                                placeholder="Condição"
                                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                                            />
                                            <input
                                                value={editEqData.accessories || ''}
                                                onChange={e => setEditEqData({ ...editEqData, accessories: e.target.value })}
                                                placeholder="Acessórios"
                                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                                            />
                                        </div>
                                    ) : (
                                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', margin: '4px 0 0' }}>
                                            {eq.condition || 'Sem observação de condição'} {eq.accessories ? ` | Acessórios: ${eq.accessories}` : ''}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
