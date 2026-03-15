import React, { useState, useEffect } from 'react';
import { Shield, Save, Users, Check, X, Info } from 'lucide-react';
import api from '../../services/api';

type Role = 'admin' | 'technician' | 'attendant';
type Permission = string;

const ROLES: { key: Role; label: string; color: string; desc: string }[] = [
    { key: 'admin',      label: 'Administrador', color: '#ef4444', desc: 'Acesso total ao sistema' },
    { key: 'technician', label: 'Técnico',        color: '#3b82f6', desc: 'Gerencia OS e diagnósticos' },
    { key: 'attendant',  label: 'Atendente',      color: '#22c55e', desc: 'Atendimento ao cliente, cria OS' },
];

const PERMISSION_GROUPS = [
    { label: 'Ordens de Serviço', perms: [
        { key: 'os.view',    label: 'Visualizar OS' },
        { key: 'os.create',  label: 'Criar OS' },
        { key: 'os.edit',    label: 'Editar OS' },
        { key: 'os.delete',  label: 'Excluir OS' },
        { key: 'os.status',  label: 'Mudar status' },
        { key: 'os.finance', label: 'Ver financeiro da OS' },
    ]},
    { label: 'Clientes', perms: [
        { key: 'clients.view',   label: 'Visualizar' },
        { key: 'clients.create', label: 'Criar' },
        { key: 'clients.edit',   label: 'Editar' },
        { key: 'clients.delete', label: 'Excluir' },
    ]},
    { label: 'Estoque', perms: [
        { key: 'inventory.view',   label: 'Visualizar' },
        { key: 'inventory.manage', label: 'Gerenciar produtos' },
        { key: 'inventory.adjust', label: 'Ajustar estoque' },
    ]},
    { label: 'Financeiro', perms: [
        { key: 'finance.view',   label: 'Visualizar' },
        { key: 'finance.manage', label: 'Lançamentos' },
        { key: 'finance.bank',   label: 'Contas bancárias' },
    ]},
    { label: 'Relatórios', perms: [
        { key: 'reports.view', label: 'Visualizar relatórios' },
        { key: 'reports.export', label: 'Exportar dados' },
    ]},
    { label: 'Configurações', perms: [
        { key: 'settings.view',    label: 'Visualizar config' },
        { key: 'settings.manage',  label: 'Alterar config' },
        { key: 'settings.users',   label: 'Gerenciar usuários' },
        { key: 'settings.fiscal',  label: 'Config fiscal' },
    ]},
];

const DEFAULT_PERMISSIONS: Record<Role, Permission[]> = {
    admin:      PERMISSION_GROUPS.flatMap(g => g.perms.map(p => p.key)),
    technician: ['os.view','os.create','os.edit','os.status','clients.view','clients.create','inventory.view','inventory.adjust'],
    attendant:  ['os.view','os.create','clients.view','clients.create','clients.edit','inventory.view'],
};

export const PermissionsSettings: React.FC<{ settings: Record<string, string>; onSave: (k: string, v: string) => Promise<void> }> = ({ settings, onSave }) => {
    const [activeRole, setActiveRole] = useState<Role>('technician');
    const [perms, setPerms] = useState<Record<Role, Set<Permission>>>(() => {
        const init: Record<Role, Set<Permission>> = { admin: new Set(), technician: new Set(), attendant: new Set() };
        ROLES.forEach(r => {
            const saved = settings[`permissions_${r.key}`];
            init[r.key] = new Set(saved ? JSON.parse(saved) : DEFAULT_PERMISSIONS[r.key]);
        });
        return init;
    });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    const toggle = (perm: Permission) => {
        if (activeRole === 'admin') return; // admin sempre tem tudo
        setPerms(p => {
            const s = new Set(p[activeRole]);
            s.has(perm) ? s.delete(perm) : s.add(perm);
            return { ...p, [activeRole]: s };
        });
    };

    const save = async () => {
        setSaving(true);
        try {
            for (const r of ROLES) {
                await onSave(`permissions_${r.key}`, JSON.stringify([...perms[r.key]]));
            }
            setMsg('Permissões salvas!');
        } catch { setMsg('Erro ao salvar'); }
        finally { setSaving(false); setTimeout(() => setMsg(null), 3000); }
    };

    const role = ROLES.find(r => r.key === activeRole)!;
    const allPerms = PERMISSION_GROUPS.flatMap(g => g.perms.map(p => p.key));
    const activeCount = perms[activeRole].size;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Seletor de perfil */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                {ROLES.map(r => (
                    <button key={r.key} onClick={() => setActiveRole(r.key)} style={{ padding: '14px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', border: `1px solid ${activeRole === r.key ? r.color + '50' : 'var(--border-color)'}`, background: activeRole === r.key ? `${r.color}12` : 'var(--bg-secondary)', transition: 'all 0.15s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: r.color }} />
                            <span style={{ fontSize: '13px', fontWeight: 700, color: activeRole === r.key ? r.color : '#fff' }}>{r.label}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{r.desc}</div>
                    </button>
                ))}
            </div>

            {/* Info admin */}
            {activeRole === 'admin' && (
                <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Info size={15} color="#ef4444" />
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Administradores têm acesso total e não podem ter permissões removidas.</span>
                </div>
            )}

            {/* Contador */}
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                <span style={{ color: role.color, fontWeight: 700 }}>{activeCount}</span> de {allPerms.length} permissões ativas para <strong style={{ color: '#fff' }}>{role.label}</strong>
            </div>

            {/* Grupos de permissões */}
            {PERMISSION_GROUPS.map(group => (
                <div key={group.label} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{group.label}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                        {group.perms.map(p => {
                            const has = perms[activeRole].has(p.key);
                            const isAdmin = activeRole === 'admin';
                            return (
                                <button key={p.key} onClick={() => toggle(p.key)} disabled={isAdmin} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', background: 'transparent', border: 'none', cursor: isAdmin ? 'default' : 'pointer', textAlign: 'left', borderRight: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                                    onMouseEnter={e => { if (!isAdmin) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                                    <div style={{ width: '20px', height: '20px', borderRadius: '5px', background: has ? `${role.color}20` : 'rgba(255,255,255,0.05)', border: `1px solid ${has ? role.color + '50' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                                        {has ? <Check size={12} color={role.color} /> : null}
                                    </div>
                                    <span style={{ fontSize: '13px', color: has ? '#fff' : 'rgba(255,255,255,0.45)', fontWeight: has ? 500 : 400 }}>{p.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}

            {msg && <div style={{ padding: '10px 16px', borderRadius: '10px', background: msg.includes('Erro') ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: msg.includes('Erro') ? '#ef4444' : '#22c55e', fontSize: '13px' }}>{msg}</div>}

            <button onClick={save} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer', alignSelf: 'flex-start', minHeight: '44px' }}>
                <Save size={16} />{saving ? 'Salvando...' : 'Salvar permissões'}
            </button>
        </div>
    );
};
