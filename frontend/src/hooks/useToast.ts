import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';
export interface Toast { id: string; type: ToastType; message: string; }

export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const show = useCallback((message: string, type: ToastType = 'success', duration = 3500) => {
        const id = Math.random().toString(36).slice(2);
        setToasts(p => [...p, { id, type, message }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration);
    }, []);

    const dismiss = useCallback((id: string) => setToasts(p => p.filter(t => t.id !== id)), []);

    return { toasts, show, dismiss };
}
