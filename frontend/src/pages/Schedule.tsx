import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { Plus, ChevronLeft, ChevronRight, RefreshCw, Clock, X, Save, Calendar } from 'lucide-react';

interface Appointment { id?: string; title: string; description?: string; status?: string; startAt: string; endAt: string; color?: string; technicianId?: string; clientId?: string; orderId?: string; notes?: string; }

const COLORS = ['#3b82f6','#a855f7','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899'];
const STATUS_COLOR: Record<string, string> = { scheduled: '#3b82f6', confirmed: '#10b981', in_progress: '#a855f7', done: '#22c55e', cancelled: '#ef4444' };
const STATUS_LABEL: Record<string, string> = { scheduled: 'Agendado', confirmed: 'Confirmado', in_progress: 'Em andamento', done: 'Concluído', cancelled: 'Cancelado' };
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7h - 19h
const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' };

const fmtDate = (d: Date) => d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

const emptyAppt: Appointment = {
    title: '', description: '', status: 'scheduled',
    startAt: new Date().toISOString().slice(0, 16),
    endAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    color: COLORS[0],
};

export const Schedule: React.FC = () => {
    const [appts, setAppts] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'week'|'day'>('week');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Appointment>(emptyAppt);
    const [saving, setSaving] = useState(false);

    // Calcular semana atual
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d;
    });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const from = view === 'week' ? weekDays[0].toISOString() : new Date(currentDate.setHours(0,0,0,0)).toISOString();
            const to = view === 'week' ? weekDays[6].toISOString() : new Date(currentDate.setHours(23,59,59,999)).toISOString();
            const r = await api.get('/appointments', { params: { from, to } });
            setAppts(r.data);
        } catch {} finally { setLoading(false); }
    }, [currentDate, view]);

    useEffect(() => { load(); }, [load]);

    const navigate = (dir: number) => {
        const d = new Date(currentDate);
        view === 'week' ? d.setDate(d.getDate() + dir * 7) : d.setDate(d.getDate() + dir);
        setCurrentDate(d);
    };

    const getApptForSlot = (day: Date, hour: number) =>
        appts.filter(a => {
            const s = new Date(a.startAt);
            return isSameDay(s, day) && s.getHours() === hour;
        });

    const openNew = (day?: Date, hour?: number) => {
        const start = new Date(day || currentDate);
        if (hour !== undefined) start.setHours(hour, 0, 0, 0);
        const end = new Date(start.getTime() + 3600000);
        setEditing({ ...emptyAppt, startAt: start.toISOString().slice(0, 16), endAt: end.toISOString().slice(0, 16) });
        setShowModal(true);
    };

    const save = async () => {
        if (!editing.title) return;
        setSaving(true);
        try {
            if (editing.id) await api.patch(`/appointments/${editing.id}`, editing);
            else await api.post('/appointments', editing);
            setShowModal(false); await load();
        } catch {} finally { setSaving(false); }
    };

    const remove = async (id: string) => {
        if (!window.confirm('Excluir agendamento?')) return;
        await api.delete(`/appointments/${id}`).catch(() => {}); await load();
    };

    const days = view === 'week' ? weekDays : [currentDate];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '4px' }}>
                        <button onClick={() => navigate(-1)} style={{ padding: '7px', borderRadius: '7px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '34px', minHeight: '34px' }}><ChevronLeft size={16} /></button>
                        <button onClick={() => setCurrentDate(new Date())} style={{ padding: '6px 12px', borderRadius: '7px', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 600, minHeight: '34px' }}>Hoje</button>
                        <button onClick={() => navigate(1)} style={{ padding: '7px', borderRadius: '7px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '34px', minHeight: '34px' }}><ChevronRight size={16} /></button>
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                        {view === 'week' ? `${fmtDate(weekDays[0])} — ${fmtDate(weekDays[6])}` : fmtDate(currentDate)}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px', padding: '3px', background: 'rgba(255,255,255,0.04)', borderRadius: '9px' }}>
                        {([['week','Semana'],['day','Dia']] as const).map(([v, l]) => (
                            <button key={v} onClick={() => setView(v)} style={{ padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, background: view === v ? 'var(--accent-primary)' : 'transparent', color: view === v ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer' }}>{l}</button>
                        ))}
                    </div>
                    <button onClick={load} style={{ padding: '9px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: loading ? 'var(--accent-primary)' : 'rgba(255,255,255,0.6)', cursor: 'pointer', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    </button>
                    <button onClick={() => openNew()} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: '#fff', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer', minHeight: '44px', whiteSpace: 'nowrap' }}>
                        <Plus size={15} /> Novo
                    </button>
                </div>
            </div>

            {/* Grade do calendário */}
            <div style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <div style={{ display: 'grid', gridTemplateColumns: `56px repeat(${days.length}, 1fr)`, minWidth: view === 'week' ? '700px' : '300px' }}>
                    {/* Cabeçalho com dias */}
                    <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', height: '48px' }} />
                    {days.map((day, i) => {
                        const isToday = isSameDay(day, new Date());
                        return (
                            <div key={i} style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', borderRight: i < days.length - 1 ? '1px solid var(--border-color)' : 'none', height: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{day.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isToday ? 'var(--accent-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '14px', fontWeight: isToday ? 800 : 600, color: isToday ? '#fff' : '#fff' }}>{day.getDate()}</span>
                                </div>
                            </div>
                        );
                    })}

                    {/* Slots de hora */}
                    {HOURS.map(hour => (
                        <React.Fragment key={hour}>
                            <div style={{ padding: '0 8px', height: '64px', display: 'flex', alignItems: 'flex-start', paddingTop: '4px', borderBottom: '1px solid rgba(255,255,255,0.04)', borderRight: '1px solid var(--border-color)', flexShrink: 0 }}>
                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>{hour}:00</span>
                            </div>
                            {days.map((day, di) => {
                                const slotAppts = getApptForSlot(day, hour);
                                return (
                                    <div key={di} onClick={() => openNew(day, hour)} style={{ height: '64px', borderBottom: '1px solid rgba(255,255,255,0.04)', borderRight: di < days.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', padding: '2px', cursor: 'pointer', position: 'relative', transition: 'background 0.1s' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                        {slotAppts.map((a, ai) => (
                                            <div key={ai} onClick={e => { e.stopPropagation(); setEditing(a); setShowModal(true); }} style={{ padding: '3px 6px', borderRadius: '5px', background: a.color || '#3b82f6', fontSize: '11px', fontWeight: 600, color: '#fff', cursor: 'pointer', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: a.status === 'cancelled' ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</span>
                                                <button onClick={e => { e.stopPropagation(); remove(a.id!); }} style={{ background: 'rgba(0,0,0,0.2)', border: 'none', color: '#fff', borderRadius: '3px', padding: '1px 3px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px' }}>✕</button>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Modal de agendamento */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '12px' }}>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', width: '100%', maxWidth: '480px', maxHeight: '94dvh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', margin: 0 }}>{editing.id ? 'Editar' : 'Novo'} Agendamento</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', borderRadius: '8px', padding: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                        </div>
                        <div style={{ overflowY: 'auto', flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div><label style={lbl}>Título *</label><input value={editing.title} onChange={e => setEditing(p => ({ ...p, title: e.target.value }))} placeholder="Descrição do agendamento" style={inp} /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div><label style={lbl}>Início</label><input type="datetime-local" value={editing.startAt} onChange={e => setEditing(p => ({ ...p, startAt: e.target.value }))} style={inp} /></div>
                                <div><label style={lbl}>Fim</label><input type="datetime-local" value={editing.endAt} onChange={e => setEditing(p => ({ ...p, endAt: e.target.value }))} style={inp} /></div>
                            </div>
                            <div><label style={lbl}>Status</label>
                                <select value={editing.status || 'scheduled'} onChange={e => setEditing(p => ({ ...p, status: e.target.value }))} style={inp}>
                                    {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                            </div>
                            <div><label style={lbl}>Cor</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {COLORS.map(c => <button key={c} onClick={() => setEditing(p => ({ ...p, color: c }))} style={{ width: '28px', height: '28px', borderRadius: '50%', background: c, border: editing.color === c ? '3px solid #fff' : '2px solid transparent', cursor: 'pointer' }} />)}
                                </div>
                            </div>
                            <div><label style={lbl}>Observações</label><textarea value={editing.notes || ''} onChange={e => setEditing(p => ({ ...p, notes: e.target.value }))} style={{ ...inp, minHeight: '72px', resize: 'vertical' }} /></div>
                            {editing.id && (
                                <button onClick={() => remove(editing.id!)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '9px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 600, fontSize: '13px', cursor: 'pointer', alignSelf: 'flex-start' }}>Excluir agendamento</button>
                            )}
                        </div>
                        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px' }}>
                            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '11px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                            <button onClick={save} disabled={saving || !editing.title} style={{ flex: 2, padding: '11px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: !editing.title ? 0.5 : 1 }}>
                                <Save size={15} />{saving ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
