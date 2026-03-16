import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Users, Truck, Package } from 'lucide-react';

export const QuickAdd: React.FC = () => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    const options = [
        { label: 'Novo Cliente',     icon: Users,   color: '#22c55e', path: '/clients?new=1',    bg: 'rgba(34,197,94,0.15)'  },
        { label: 'Novo Fornecedor',  icon: Truck,   color: '#6366f1', path: '/suppliers?new=1',  bg: 'rgba(99,102,241,0.15)' },
        { label: 'Novo Produto',     icon: Package, color: '#3b82f6', path: '/inventory?new=1',  bg: 'rgba(59,130,246,0.15)' },
    ];

    const go = (path: string) => {
        setOpen(false);
        navigate(path);
    };

    return (
        <>
            {/* Overlay ao abrir */}
            {open && (
                <div
                    onClick={() => setOpen(false)}
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(2px)',
                        zIndex: 198,
                    }}
                />
            )}

            {/* Opções — aparecem acima do botão */}
            {open && (
                <div style={{
                    position: 'fixed',
                    bottom: 'calc(80px + env(safe-area-inset-bottom))',
                    right: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    zIndex: 199,
                    alignItems: 'flex-end',
                }}>
                    {options.map(({ label, icon: Icon, color, path, bg }) => (
                        <button
                            key={path}
                            onClick={() => go(path)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 16px 10px 12px',
                                borderRadius: '50px',
                                background: 'rgba(15,15,24,0.97)',
                                border: `1px solid ${color}30`,
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: '14px',
                                cursor: 'pointer',
                                boxShadow: `0 4px 24px rgba(0,0,0,0.4)`,
                                whiteSpace: 'nowrap',
                                backdropFilter: 'blur(12px)',
                                animation: 'quickAddIn 0.15s ease-out',
                            }}
                        >
                            <div style={{
                                width: '32px', height: '32px',
                                borderRadius: '50%',
                                background: bg,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <Icon size={15} color={color} />
                            </div>
                            {label}
                        </button>
                    ))}
                </div>
            )}

            {/* Botão principal + */}
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    position: 'fixed',
                    bottom: 'calc(68px + env(safe-area-inset-bottom))',
                    right: '16px',
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: open
                        ? 'rgba(255,255,255,0.1)'
                        : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    border: 'none',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 200,
                    boxShadow: open ? 'none' : '0 4px 20px rgba(59,130,246,0.5)',
                    transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                    transform: open ? 'rotate(45deg) scale(1.05)' : 'rotate(0deg) scale(1)',
                }}
            >
                {open ? <X size={22} /> : <Plus size={22} />}
            </button>

            <style>{`
                @keyframes quickAddIn {
                    from { opacity: 0; transform: translateX(10px) scale(0.95); }
                    to   { opacity: 1; transform: translateX(0) scale(1); }
                }
            `}</style>
        </>
    );
};
