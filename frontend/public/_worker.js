/**
 * Cloudflare Worker para servir SPA React
 * Redireciona todas as rotas para index.html (exceto assets)
 */
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        
        // Assets estáticos — servir diretamente
        if (url.pathname.startsWith('/assets/') || 
            url.pathname.endsWith('.js') ||
            url.pathname.endsWith('.css') ||
            url.pathname.endsWith('.ico') ||
            url.pathname.endsWith('.png') ||
            url.pathname.endsWith('.svg') ||
            url.pathname.endsWith('.woff') ||
            url.pathname.endsWith('.woff2')) {
            return env.ASSETS.fetch(request);
        }
        
        // Todas as outras rotas → index.html (SPA)
        const indexUrl = new URL('/', url.origin);
        return env.ASSETS.fetch(new Request(indexUrl, request));
    }
};
