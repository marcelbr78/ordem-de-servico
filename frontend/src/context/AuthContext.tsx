import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutos

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    tenantId?: string;
    mustChangePassword?: boolean;
    canViewFinancials?: boolean;
}

interface AuthContextData {
    user: User | null;
    signed: boolean;
    signIn(credentials: any): Promise<void>;
    signOut(): void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const storageToken = localStorage.getItem('@OS:token');
        const storageUser = localStorage.getItem('@OS:user');

        if (storageToken && storageUser) {
            const parsedUser = JSON.parse(storageUser);
            console.log('[Auth] Carregando usuário persistido:', parsedUser.email, 'Role:', parsedUser.role);
            setUser(parsedUser);
        }
        setLoading(false);
    }, []);

    async function signIn(credentials: any) {
        const response = await api.post('/auth/login', credentials);
        const { access_token, refresh_token, user: userData } = response.data;

        localStorage.setItem('@OS:token', access_token);
        localStorage.setItem('@OS:refreshToken', refresh_token);
        localStorage.setItem('@OS:user', JSON.stringify(userData));
        if (userData.tenantId) {
            localStorage.setItem('tenant_id', userData.tenantId);
        }

        setUser(userData);
    }

    function signOut() {
        localStorage.removeItem('@OS:token');
        localStorage.removeItem('@OS:refreshToken');
        localStorage.removeItem('@OS:user');
        localStorage.removeItem('tenant_id');
        setUser(null);
    }

    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        inactivityTimer.current = setTimeout(() => {
            signOut();
        }, INACTIVITY_TIMEOUT);
    }, []);

    useEffect(() => {
        if (!user) {
            if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
            return;
        }

        const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
        events.forEach(e => window.addEventListener(e, resetInactivityTimer, { passive: true }));
        resetInactivityTimer();

        return () => {
            if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
            events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
        };
    }, [user, resetInactivityTimer]);

    return (
        <AuthContext.Provider value={{ signed: !!user, user, signIn, signOut, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
