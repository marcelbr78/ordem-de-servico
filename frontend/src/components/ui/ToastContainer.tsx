import React from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import type { Toast } from '../../hooks/useToast';

const CONFIGS = {
    success: { icon: CheckCircle, bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)', color: '#22c55e' },
    error:   { icon: XCircle,     bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', color: '#ef4444' },
    info:    { icon: Info,         bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)', color: '#3b82f6' },
    warning: { icon: AlertTriangle,bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', color: '#f59e0b' },
};

export const ToastContainer: React.FC<{ toasts: Toast[]; onDismiss: (id: string) => void }> = ({ toasts, onDismiss }) => (
    <div style={{ position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 9999, pointerEvents: 'none', width: 'max-content', maxWidth: 'calc(100vw - 32px)' }}>
        {toasts.map(t => {
            const cfg = CONFIGS[t.type];
            const Icon = cfg.icon;
            return (
                <div key={t.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                    background: '#1e1e2e', border: `1px solid ${cfg.border}`, borderLeft: `3px solid ${cfg.color}`,
                    borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    pointerEvents: 'all', animation: 'slideUp 0.2s ease',
                    minWidth: '260px',
                }}>
                    <Icon size={16} color={cfg.color} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '14px', color: '#fff', flex: 1 }}>{t.message}</span>
                    <button onClick={() => onDismiss(t.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', padding: '0 2px' }}>
                        <X size={14} />
                    </button>
                </div>
            );
        })}
        <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
);
