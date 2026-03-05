import React from 'react';
import { useAuth } from '../context/AuthContext';

export const DebugAuth: React.FC = () => {
    const { user, signed } = useAuth();

    return (
        <div style={{ padding: '50px', color: '#fff', background: '#222', minHeight: '100vh' }}>
            <h1>Debug de Autenticação</h1>
            <div style={{ background: '#333', padding: '20px', borderRadius: '10px' }}>
                <p><strong>Logado:</strong> {signed ? 'SIM' : 'NÃO'}</p>
                <p><strong>ID:</strong> {user?.id}</p>
                <p><strong>Nome:</strong> {user?.name}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Role:</strong> <span style={{ color: '#0f0', fontSize: '24px' }}>{user?.role || 'null'}</span></p>
                <p><strong>Tenant:</strong> {user?.tenantId}</p>
            </div>

            <pre style={{ marginTop: '20px', background: '#000', padding: '10px' }}>
                {JSON.stringify(user, null, 2)}
            </pre>

            <hr />
            <h3>LocalStorage</h3>
            <pre style={{ background: '#000', padding: '10px' }}>
                {localStorage.getItem('@OS:user')}
            </pre>
        </div>
    );
};
