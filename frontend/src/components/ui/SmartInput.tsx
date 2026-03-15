import React, { useState, useRef, useEffect } from 'react';
import { Loader2, ChevronDown, History, Database } from 'lucide-react';
import { useAutocomplete } from '../../hooks/useAutocomplete';

interface SmartInputProps {
    value: string;
    onChange: (v: string) => void;
    endpoint: string;
    extraParams?: Record<string, string>;
    placeholder?: string;
    label?: string;
    required?: boolean;
    disabled?: boolean;
    autoCapitalize?: boolean;
    inputStyle?: React.CSSProperties;
    minChars?: number;
    onOptionSelect?: (option: any) => void;
}

export const SmartInput: React.FC<SmartInputProps> = ({
    value, onChange, endpoint, extraParams = {}, placeholder, label,
    required, disabled, autoCapitalize = true, inputStyle, minChars = 1, onOptionSelect,
}) => {
    const [focused, setFocused] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { options, open, loading, search, close, loadInitial } = useAutocomplete(endpoint, extraParams, minChars);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) close();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [close]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let v = e.target.value;
        if (autoCapitalize && v) v = v.charAt(0).toUpperCase() + v.slice(1);
        onChange(v);
        search(v);
    };

    const handleSelect = (opt: any) => {
        onChange(opt.value || opt.nome || opt);
        close();
        if (onOptionSelect) onOptionSelect(opt);
    };

    const inp: React.CSSProperties = {
        width: '100%', padding: '10px 36px 10px 12px', borderRadius: '10px',
        border: `1px solid ${focused ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.1)'}`,
        background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '16px',
        outline: 'none', boxSizing: 'border-box' as const, transition: 'border-color 0.15s',
        ...inputStyle,
    };

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            {label && (
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                    {label}{required && <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>}
                </label>
            )}
            <div style={{ position: 'relative' }}>
                <input
                    value={value} onChange={handleChange} placeholder={placeholder}
                    disabled={disabled} required={required}
                    onFocus={() => { setFocused(true); if (!value && minChars === 0) loadInitial(); }}
                    onBlur={() => setFocused(false)}
                    style={inp}
                    autoComplete="off"
                />
                <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    {loading
                        ? <Loader2 size={14} color="rgba(255,255,255,0.3)" style={{ animation: 'spin 1s linear infinite' }} />
                        : <ChevronDown size={14} color="rgba(255,255,255,0.2)" />
                    }
                </div>
            </div>
            {open && options.length > 0 && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                    background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    zIndex: 9999, overflow: 'hidden', maxHeight: '220px', overflowY: 'auto',
                }}>
                    {options.map((opt, i) => (
                        <button key={i} onMouseDown={() => handleSelect(opt)} style={{
                            display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                            padding: '10px 14px', background: 'transparent', border: 'none',
                            color: '#fff', cursor: 'pointer', fontSize: '14px', textAlign: 'left',
                            borderBottom: i < options.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.1)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            {opt.source === 'history' ? <History size={12} color="#f59e0b" /> : <Database size={12} color="rgba(255,255,255,0.3)" />}
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.value || opt.nome}</span>
                            {opt.source === 'history' && <span style={{ fontSize: '10px', color: '#f59e0b', flexShrink: 0 }}>histórico</span>}
                        </button>
                    ))}
                </div>
            )}
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
};
