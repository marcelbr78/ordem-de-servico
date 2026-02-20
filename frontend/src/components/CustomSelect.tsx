import { useState, useRef, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export interface SelectOption {
    label: string;
    value: string;
    icon?: ReactNode;
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    label?: string;
    width?: string;
    searchable?: boolean;
}

export function CustomSelect({
    value,
    onChange,
    options,
    placeholder = 'Selecione...',
    width = '100%',
    searchable = false
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selected = options.find(d => d.value === value);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search when opening
    useEffect(() => {
        if (isOpen && searchable && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen, searchable]);

    const filtered = useMemo(() => {
        if (!searchable || !search) return options;
        const s = search.toLowerCase();
        return options.filter(d =>
            d.label.toLowerCase().includes(s) ||
            d.value.toLowerCase().includes(s)
        );
    }, [search, options, searchable]);

    return (
        <div ref={containerRef} style={{ position: 'relative', width }}>
            {/* Trigger Button */}
            <div
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) setSearch('');
                }}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 12px', borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#fff', fontSize: '13px', cursor: 'pointer',
                    userSelect: 'none', minHeight: '42px',
                    outline: isOpen ? '1px solid var(--primary)' : 'none',
                    transition: 'border-color 0.2s, outline 0.2s'
                }}
            >
                {selected ? (
                    <>
                        {selected.icon && <span>{selected.icon}</span>}
                        <span style={{ fontWeight: 500, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {selected.label}
                        </span>
                    </>
                ) : (
                    <span style={{ color: 'rgba(255,255,255,0.4)', flex: 1 }}>{placeholder}</span>
                )}
                <ChevronDown size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, width: '100%',
                    background: '#1a1b26', // Dark background
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    marginTop: '4px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    zIndex: 1000,
                    overflow: 'hidden',
                    display: 'flex', flexDirection: 'column'
                }}>
                    {/* Search Bar */}
                    {searchable && (
                        <div style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                background: 'rgba(255,255,255,0.05)', borderRadius: '6px',
                                padding: '6px 8px'
                            }}>
                                <Search size={12} color="rgba(255,255,255,0.4)" />
                                <input
                                    ref={searchInputRef}
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Buscar..."
                                    style={{
                                        background: 'transparent', border: 'none', outline: 'none',
                                        color: '#fff', fontSize: '12px', width: '100%'
                                    }}
                                />
                                {search && (
                                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSearch('')} />
                                )}
                            </div>
                        </div>
                    )}

                    {/* List */}
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {filtered.length === 0 ? (
                            <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                                Nenhuma opção encontrada
                            </div>
                        ) : (
                            filtered.map(opt => (
                                <div
                                    key={opt.value}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '10px 12px', cursor: 'pointer',
                                        fontSize: '13px', color: '#fff',
                                        background: opt.value === value ? 'rgba(255,255,255,0.1)' : 'transparent',
                                        transition: 'background 0.2s',
                                        borderBottom: '1px solid rgba(255,255,255,0.02)'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                    onMouseLeave={e => e.currentTarget.style.background = opt.value === value ? 'rgba(255,255,255,0.1)' : 'transparent'}
                                >
                                    {opt.icon && <span style={{ fontSize: '16px' }}>{opt.icon}</span>}
                                    <span>{opt.label}</span>
                                    {opt.value === value && (
                                        <span style={{ marginLeft: 'auto', color: 'var(--primary)' }}>✓</span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
