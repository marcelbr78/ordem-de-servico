import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface User {
    id: string;
    name: string;
    name: string;
    email: string;
    mustChangePassword?: boolean;
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

    useEffect(() => {
        const storageToken = localStorage.getItem('@OS:token');
        const storageUser = localStorage.getItem('@OS:user');

        if (storageToken && storageUser) {
            setUser(JSON.parse(storageUser));
        }
        setLoading(false);
    }, []);

    async function signIn(credentials: any) {
        const response = await api.post('/auth/login', credentials);
        const { access_token, refresh_token, user: userData } = response.data;

        localStorage.setItem('@OS:token', access_token);
        localStorage.setItem('@OS:refreshToken', refresh_token);
        localStorage.setItem('@OS:user', JSON.stringify(userData));

        setUser(userData);
    }

    function signOut() {
        localStorage.removeItem('@OS:token');
        localStorage.removeItem('@OS:refreshToken');
        localStorage.removeItem('@OS:user');
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ signed: !!user, user, signIn, signOut, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
