import { useState, useRef, useCallback, useEffect } from 'react';
import api from '../services/api';

interface Option { value: string; source?: string; id?: string; nome?: string; cpfCnpj?: string; }

const cache: Record<string, { ts: number; data: Option[] }> = {};
const CACHE_TTL = 60000; // 1 min

async function fetchOptions(endpoint: string, params: Record<string, string>): Promise<Option[]> {
    const key = endpoint + JSON.stringify(params);
    if (cache[key] && Date.now() - cache[key].ts < CACHE_TTL) return cache[key].data;
    try {
        const res = await api.get(endpoint, { params });
        const data = res.data || [];
        cache[key] = { ts: Date.now(), data };
        return data;
    } catch { return []; }
}

export function useAutocomplete(endpoint: string, extraParams: Record<string, string> = {}, minChars = 1) {
    const [options, setOptions] = useState<Option[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const search = useCallback((q: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (q.length < minChars) { setOptions([]); setOpen(false); return; }
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            const results = await fetchOptions(endpoint, { q, ...extraParams });
            setOptions(results);
            setOpen(results.length > 0);
            setLoading(false);
        }, 200);
    }, [endpoint, JSON.stringify(extraParams)]);

    const loadInitial = useCallback(async () => {
        const results = await fetchOptions(endpoint, { q: '', ...extraParams });
        setOptions(results);
        if (results.length > 0) setOpen(true);
    }, [endpoint, JSON.stringify(extraParams)]);

    const close = useCallback(() => setOpen(false), []);

    return { options, open, loading, search, close, loadInitial };
}
