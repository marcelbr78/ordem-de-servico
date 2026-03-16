/**
 * Cloudflare Worker — Keep Render Alive
 * Pinga o backend a cada 14 minutos para evitar que durma no plano free
 * 
 * Deploy: Cole este código em um novo Worker no Cloudflare
 * Cron trigger: adicionar "* /14 * * * *" (a cada 14 min)
 */

export default {
    // Executado pelo cron trigger
    async scheduled(event, env, ctx) {
        const url = 'https://os4u-backend.onrender.com/ping';
        try {
            const res = await fetch(url, {
                method: 'GET',
                headers: { 'User-Agent': 'CloudflareKeepAlive/1.0' },
                signal: AbortSignal.timeout(10000),
            });
            const data = await res.json();
            console.log(`[${new Date().toISOString()}] Ping OK:`, data);
        } catch (e) {
            console.error(`[${new Date().toISOString()}] Ping FALHOU:`, e.message);
        }
    },

    // Também responde a requisições HTTP normais
    async fetch(request, env, ctx) {
        return new Response(JSON.stringify({
            status: 'Keep-alive worker ativo',
            backend: 'https://os4u-backend.onrender.com',
            interval: '14 minutos',
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    },
};
