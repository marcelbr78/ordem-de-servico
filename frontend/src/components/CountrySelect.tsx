import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export const DDIS = [
    { code: '+55', country: 'Brasil', flag: '🇧🇷' },
    { code: '+351', country: 'Portugal', flag: '🇵🇹' },
    { code: '+1', country: 'EUA', flag: '🇺🇸' },
    { code: '+44', country: 'Reino Unido', flag: '🇬🇧' },
    { code: '+34', country: 'Espanha', flag: '🇪🇸' },
    { code: '+33', country: 'França', flag: '🇫🇷' },
    { code: '+49', country: 'Alemanha', flag: '🇩🇪' },
    { code: '+39', country: 'Itália', flag: '🇮🇹' },
    { code: '+54', country: 'Argentina', flag: '🇦🇷' },
    { code: '+598', country: 'Uruguai', flag: '🇺🇾' },
    { code: '+595', country: 'Paraguai', flag: '🇵🇾' },
    { code: '+81', country: 'Japão', flag: '🇯🇵' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
];

interface CountrySelectProps {
    value: string;
    onChange: (value: string) => void;
}

export function CountrySelect({ value, onChange }: CountrySelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selected = DDIS.find(d => d.code === value) || DDIS[0]; // Fallback to BR

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
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const filtered = useMemo(() => {
        const s = search.toLowerCase();
        return DDIS.filter(d =>
            d.country.toLowerCase().includes(s) ||
            d.code.includes(s) ||
            d.flag.includes(s)
        );
    }, [search]);

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '120px' }}>
            {/* Trigger Button */}
            <div
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) setSearch('');
                }}
                style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '10px 8px', borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#fff', fontSize: '13px', cursor: 'pointer',
                    userSelect: 'none', height: '42px' // Match input height
                }}
            >
                <span>{selected.flag}</span>
                <span style={{ fontWeight: 500 }}>{selected.code}</span>
                <ChevronDown size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, width: '220px', // Wider than trigger
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
                                placeholder="Buscar país..."
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

                    {/* List */}
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {filtered.length === 0 ? (
                            <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                                Nenhum país encontrado
                            </div>
                        ) : (
                            filtered.map(d => (
                                <div
                                    key={d.code}
                                    onClick={() => {
                                        onChange(d.code);
                                        setIsOpen(false);
                                    }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '8px 12px', cursor: 'pointer',
                                        fontSize: '13px', color: '#fff',
                                        background: d.code === value ? 'rgba(255,255,255,0.1)' : 'transparent',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                    onMouseLeave={e => e.currentTarget.style.background = d.code === value ? 'rgba(255,255,255,0.1)' : 'transparent'}
                                >
                                    <span style={{ fontSize: '16px' }}>{d.flag}</span>
                                    <span>{d.country}</span>
                                    <span style={{ marginLeft: 'auto', opacity: 0.5, fontSize: '11px' }}>{d.code}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
