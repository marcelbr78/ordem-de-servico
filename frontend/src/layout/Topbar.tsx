import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Search, Bell, Menu, X, Store, LayoutDashboard, Users, CreditCard, LayoutGrid, UserPlus, Brain, ArrowRight } from 'lucide-react';
import { adminService } from '../services/adminService';
import type { TenantAdminDto } from '../services/adminService';

interface TopbarProps {
    toggleSidebar: () => void;
    isDesktop: boolean;
}

// ── Search result types ────────────────────────────────────────
interface SearchResult {
    id: string;
    type: 'tenant' | 'page';
    title: string;
    subtitle: string;
    icon: React.ElementType;
    iconColor: string;
    path: string;
}

// Static admin pages for quick navigation
const ADMIN_PAGES: SearchResult[] = [
    { id: 'pg-overview', type: 'page', title: 'Platform Overview', subtitle: 'Dashboard principal', icon: LayoutDashboard, iconColor: 'var(--accent-primary)', path: '/portal-gestao/inicio' },
    { id: 'pg-tenants', type: 'page', title: 'Gestão de Lojas', subtitle: 'Tenants cadastrados', icon: Store, iconColor: '#10b981', path: '/masteradmin/tenants' },
    { id: 'pg-billing', type: 'page', title: 'Billing', subtitle: 'Assinaturas e faturamento', icon: CreditCard, iconColor: '#f59e0b', path: '/masteradmin/billing' },
    { id: 'pg-plans', type: 'page', title: 'Planos', subtitle: 'Gerenciar planos SaaS', icon: LayoutGrid, iconColor: '#8b5cf6', path: '/masteradmin/plans' },
    { id: 'pg-signups', type: 'page', title: 'Signup Monitor', subtitle: 'Novos cadastros e trials', icon: UserPlus, iconColor: '#06b6d4', path: '/masteradmin/signups' },
    { id: 'pg-insights', type: 'page', title: 'AI Insights', subtitle: 'Recomendações inteligentes', icon: Brain, iconColor: '#a78bfa', path: '/masteradmin/insights' },
    { id: 'pg-users', type: 'page', title: 'Usuários', subtitle: 'Gestão de usuários', icon: Users, iconColor: '#ec4899', path: '/masteradmin/users' },
];

// ── Search Dropdown ────────────────────────────────────────────
const SearchDropdown = ({ results, onSelect, loading, query }: {
    results: SearchResult[];
    onSelect: (r: SearchResult) => void;
    loading: boolean;
    query: string;
}) => {
    if (!query) return null;

    const tenantResults = results.filter(r => r.type === 'tenant');
    const pageResults = results.filter(r => r.type === 'page');

    return (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: 'rgba(12,16,28,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '8px', backdropFilter: 'blur(20px)', zIndex: 200, boxShadow: '0 24px 60px rgba(0,0,0,0.6)', maxHeight: '400px', overflowY: 'auto' }}>
            {loading && (
                <div style={{ padding: '12px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>Buscando...</div>
            )}

            {!loading && results.length === 0 && (
                <div style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                    Nenhum resultado para "<strong style={{ color: 'rgba(255,255,255,0.5)' }}>{query}</strong>"
                </div>
            )}

            {tenantResults.length > 0 && (
                <div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '1px', padding: '8px 12px 4px' }}>Lojas</div>
                    {tenantResults.map(r => <ResultRow key={r.id} result={r} onSelect={onSelect} />)}
                </div>
            )}

            {pageResults.length > 0 && (
                <div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '1px', padding: '8px 12px 4px' }}>Páginas</div>
                    {pageResults.map(r => <ResultRow key={r.id} result={r} onSelect={onSelect} />)}
                </div>
            )}
        </div>
    );
};

const ResultRow = ({ result, onSelect }: { result: SearchResult; onSelect: (r: SearchResult) => void }) => (
    <button onClick={() => onSelect(result)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: `${result.iconColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <result.icon size={16} color={result.iconColor} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.title}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.subtitle}</div>
        </div>
        <ArrowRight size={14} color="rgba(255,255,255,0.2)" />
    </button>
);

// ── Global Search field ────────────────────────────────────────
const GlobalSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Keyboard shortcut: Cmd/Ctrl+K
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(true);
                inputRef.current?.focus();
            }
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    const search = useCallback(async (q: string) => {
        if (!q.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            // Filter static pages
            const pageMatches = ADMIN_PAGES.filter(p =>
                p.title.toLowerCase().includes(q.toLowerCase()) ||
                p.subtitle.toLowerCase().includes(q.toLowerCase())
            );

            // Search tenants from API
            const tenantsRes = await adminService.getTenants(1, 200).catch(() => ({ data: [] as TenantAdminDto[], meta: { total: 0 } }));
            const tenantList: TenantAdminDto[] = Array.isArray(tenantsRes) ? tenantsRes : tenantsRes.data ?? [];
            const tenantMatches: SearchResult[] = tenantList
                .filter(t => {
                    const name = (t.name || t.storeName || '').toLowerCase();
                    const email = (t.email ?? '').toLowerCase();
                    const sub = t.subdomain?.toLowerCase() ?? '';
                    return name.includes(q.toLowerCase()) || email.includes(q.toLowerCase()) || sub.includes(q.toLowerCase());
                })
                .slice(0, 6)
                .map(t => ({
                    id: t.id,
                    type: 'tenant' as const,
                    title: t.name || t.storeName || `Loja ${t.id.slice(0, 6)}`,
                    subtitle: t.email ?? t.subdomain ?? '',
                    icon: Store,
                    iconColor: t.status === 'active' ? '#10b981' : t.status === 'suspended' ? '#ef4444' : '#f59e0b',
                    path: `/masteradmin/tenants/${t.id}`,
                }));

            setResults([...tenantMatches, ...pageMatches]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const q = e.target.value;
        setQuery(q);
        setOpen(true);
        clearTimeout(debounceRef.current);
        if (!q.trim()) { setResults([]); return; }
        debounceRef.current = setTimeout(() => search(q), 300);
    };

    const handleSelect = (r: SearchResult) => {
        navigate(r.path);
        setQuery('');
        setOpen(false);
    };

    const handleFocus = () => {
        setOpen(true);
        if (!query) {
            // Show all pages as default suggestions
            setResults(ADMIN_PAGES.slice(0, 6));
        }
    };

    return (
        <div ref={containerRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none', zIndex: 1 }} />
            <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleChange}
                onFocus={handleFocus}
                placeholder="Buscar tenant, página...  ⌘K"
                style={{ background: 'var(--glass)', border: `1px solid ${open ? 'rgba(59,130,246,0.4)' : 'var(--glass-border)'}`, padding: '9px 36px 9px 34px', borderRadius: '10px', color: '#fff', fontSize: '13px', width: '280px', outline: 'none', transition: 'border 0.2s, width 0.2s', ...(open ? { width: '320px' } : {}) }}
            />
            {query && (
                <button onClick={() => { setQuery(''); setResults(ADMIN_PAGES.slice(0, 6)); }} style={{ position: 'absolute', right: '10px', color: 'rgba(255,255,255,0.3)', padding: '2px', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={14} />
                </button>
            )}
            {open && (
                <SearchDropdown results={results} onSelect={handleSelect} loading={loading} query={query || 'inicio'} />
            )}
        </div>
    );
};

// ── Topbar ─────────────────────────────────────────────────────
export const Topbar: React.FC<TopbarProps> = ({ toggleSidebar, isDesktop }) => {
    const { user, signOut } = useAuth();
    const isSuperAdmin = user?.role === 'super_admin' || (typeof user?.role === 'string' && user.role.toLowerCase() === 'super_admin');

    return (
        <header style={{ height: '70px', borderBottom: '1px solid var(--border-color)', padding: '0 20px 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'rgba(10, 10, 12, 0.9)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 100 }}>
            {/* Left: menu + search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={toggleSidebar} style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '8px', background: 'var(--glass)', border: '1px solid var(--glass-border)', cursor: 'pointer' }}>
                    <Menu size={18} />
                </button>
                {isDesktop && <GlobalSearch />}
            </div>

            {/* Right: bell + user + logout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button style={{ color: 'rgba(255,255,255,0.6)', cursor: 'pointer', position: 'relative', background: 'none', border: 'none', padding: '4px' }}>
                    <Bell size={20} />
                    <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: 'var(--accent-primary)', borderRadius: '50%' }} />
                </button>

                <div style={{ height: '28px', width: '1px', background: 'var(--border-color)' }} />

                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff', lineHeight: 1.2, display: 'block' }}>{user?.name || 'User'}</span>
                    <span style={{ fontSize: '11px', color: isSuperAdmin ? 'var(--accent-primary)' : 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {isSuperAdmin ? 'Super Admin' : user?.role?.replace('_', ' ')}
                    </span>
                </div>

                <button onClick={signOut} style={{ padding: '8px', color: 'rgba(255,255,255,0.6)', borderRadius: '10px', background: 'var(--glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)', cursor: 'pointer' }} title="Sair do sistema">
                    <LogOut size={16} />
                </button>
            </div>
        </header>
    );
};
