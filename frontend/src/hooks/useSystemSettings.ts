import { useState, useEffect } from 'react';
import api from '../services/api';

export interface SystemSettingsMap {
    [key: string]: string;
}

export const useSystemSettings = () => {
    const [settings, setSettings] = useState<SystemSettingsMap>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const r = await api.get('/settings');
            const m: SystemSettingsMap = {};
            if (Array.isArray(r.data)) {
                r.data.forEach((s: any) => { m[s.key] = s.value; });
            }
            setSettings(m);
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    return { settings, loading, refetch: fetchSettings };
};
