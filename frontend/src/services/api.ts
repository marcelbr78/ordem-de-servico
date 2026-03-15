import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3005',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('@OS:token');
    const shadowTenantId = localStorage.getItem('shadow_tenant_id');
    const tenantId = localStorage.getItem('tenant_id');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Shadowing mode (Master Admin accessing customer panel) has priority
    if (shadowTenantId) {
        config.headers['x-tenant-id'] = shadowTenantId;
    } else if (tenantId) {
        config.headers['x-tenant-id'] = tenantId;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('@OS:refreshToken');

            if (refreshToken) {
                try {
                    const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
                        refresh_token: refreshToken,
                    });

                    const { access_token, refresh_token } = response.data;

                    localStorage.setItem('@OS:token', access_token);
                    localStorage.setItem('@OS:refreshToken', refresh_token);

                    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
                    originalRequest.headers['Authorization'] = `Bearer ${access_token}`;

                    return api(originalRequest);
                } catch {
                    // Se o refresh falhar, desloga o usuário
                    localStorage.removeItem('@OS:token');
                    localStorage.removeItem('@OS:refreshToken');
                    localStorage.removeItem('@OS:user');

                    const isMasterRoute = window.location.pathname.startsWith('/masteradmin');
                    window.location.href = isMasterRoute ? '/masteradmin/login' : '/login';
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;
