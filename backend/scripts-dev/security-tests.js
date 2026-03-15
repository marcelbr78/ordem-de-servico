// ============================================
// SECURITY TEST SUITE - TechManager ERP
// ============================================
const http = require('http');

const BASE = 'http://localhost:3001';
let adminToken = null;

function request(method, path, body, token) {
    return new Promise((resolve) => {
        const url = new URL(path, BASE);
        const data = body ? JSON.stringify(body) : null;
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (token) options.headers['Authorization'] = `Bearer ${token}`;

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => {
                let parsed;
                try { parsed = JSON.parse(responseData); } catch { parsed = responseData; }
                resolve({ status: res.statusCode, data: parsed });
            });
        });
        req.on('error', (e) => resolve({ status: 0, data: e.message }));
        if (data) req.write(data);
        req.end();
    });
}

async function run() {
    console.log('='.repeat(60));
    console.log(' TESTES DE SEGURANÇA - TechManager ERP');
    console.log('='.repeat(60));
    console.log();

    // TEST 1: Login com sucesso
    console.log('▶ TESTE 1: Login com credenciais válidas (admin/admin1234)');
    const login = await request('POST', '/auth/login', { email: 'admin', password: 'admin1234' });
    console.log(`  Status: ${login.status}`);
    if (login.status === 200) {
        adminToken = login.data.access_token;
        console.log(`  ✅ Login OK`);
        console.log(`  User: ${JSON.stringify(login.data.user)}`);
        console.log(`  Access Token: ${adminToken.substring(0, 40)}...`);
        console.log(`  Refresh Token: ${login.data.refresh_token.substring(0, 40)}...`);
    } else {
        console.log(`  ❌ Falhou: ${JSON.stringify(login.data)}`);
    }
    console.log();

    // TEST 2: Login com senha errada
    console.log('▶ TESTE 2: Login com senha INCORRETA');
    const badLogin = await request('POST', '/auth/login', { email: 'admin', password: 'senhaerrada' });
    console.log(`  Status: ${badLogin.status}`);
    console.log(`  ${badLogin.status === 401 ? '✅' : '❌'} Resposta: ${JSON.stringify(badLogin.data)}`);
    console.log();

    // TEST 3: Login com credenciais vazias
    console.log('▶ TESTE 3: Login com campos vazios');
    const emptyLogin = await request('POST', '/auth/login', { email: '', password: '' });
    console.log(`  Status: ${emptyLogin.status}`);
    console.log(`  ${emptyLogin.status === 400 ? '✅' : '❌'} Resposta: ${JSON.stringify(emptyLogin.data)}`);
    console.log();

    // TEST 4: Acesso SEM token a rota protegida
    console.log('▶ TESTE 4: Acesso a /clients SEM token JWT');
    const noAuth = await request('GET', '/clients');
    console.log(`  Status: ${noAuth.status}`);
    console.log(`  ${noAuth.status === 401 ? '✅' : '❌'} Resposta: ${JSON.stringify(noAuth.data)}`);
    console.log();

    // TEST 5: Acesso COM token a rota protegida
    console.log('▶ TESTE 5: Acesso a /clients COM token JWT (admin)');
    const withAuth = await request('GET', '/clients', null, adminToken);
    console.log(`  Status: ${withAuth.status}`);
    console.log(`  ${withAuth.status === 200 ? '✅' : '❌'} Acesso autorizado. Registros: ${Array.isArray(withAuth.data) ? withAuth.data.length : 'N/A'}`);
    console.log();

    // TEST 6: Token inválido/expirado
    console.log('▶ TESTE 6: Acesso com token JWT INVÁLIDO');
    const badToken = await request('GET', '/clients', null, 'token.invalido.aqui');
    console.log(`  Status: ${badToken.status}`);
    console.log(`  ${badToken.status === 401 ? '✅' : '❌'} Resposta: ${JSON.stringify(badToken.data)}`);
    console.log();

    // TEST 7: Refresh Token
    if (login.status === 200) {
        console.log('▶ TESTE 7: Refresh Token (rotação)');
        const refresh = await request('POST', '/auth/refresh', { refresh_token: login.data.refresh_token });
        console.log(`  Status: ${refresh.status}`);
        if (refresh.status === 200) {
            console.log(`  ✅ Novo Access Token: ${refresh.data.access_token.substring(0, 40)}...`);
            console.log(`  ✅ Novo Refresh Token: ${refresh.data.refresh_token.substring(0, 40)}...`);
        } else {
            console.log(`  ❌ Falhou: ${JSON.stringify(refresh.data)}`);
        }
        console.log();

        // TEST 8: Reuso do refresh token antigo (segurança)
        console.log('▶ TESTE 8: Reuso de Refresh Token ANTIGO (deve bloquear)');
        const reuse = await request('POST', '/auth/refresh', { refresh_token: login.data.refresh_token });
        console.log(`  Status: ${reuse.status}`);
        console.log(`  ${reuse.status === 401 ? '✅' : '❌'} Resposta: ${JSON.stringify(reuse.data)}`);
        console.log();
    }

    // TEST 9: Logout
    if (login.status === 200) {
        console.log('▶ TESTE 9: Logout');
        const logout = await request('POST', '/auth/logout', { userId: login.data.user.id });
        console.log(`  Status: ${logout.status}`);
        console.log(`  ${logout.status === 200 ? '✅' : '❌'} Logout efetuado`);
        console.log();
    }

    // TEST 10: Registro de novo usuário
    console.log('▶ TESTE 10: Registro de novo usuário (técnico)');
    const register = await request('POST', '/auth/register', {
        email: 'tecnico_teste',
        name: 'Técnico Teste',
        password: 'teste12345',
        role: 'technician',
    });
    console.log(`  Status: ${register.status}`);
    if (register.status === 201) {
        console.log(`  ✅ Usuário criado: ${JSON.stringify({ id: register.data.id, email: register.data.email, role: register.data.role })}`);

        // TEST 11: Login com técnico
        console.log();
        console.log('▶ TESTE 11: Login como técnico');
        const techLogin = await request('POST', '/auth/login', { email: 'tecnico_teste', password: 'teste12345' });
        console.log(`  Status: ${techLogin.status}`);
        if (techLogin.status === 200) {
            const techToken = techLogin.data.access_token;
            console.log(`  ✅ Login técnico OK`);

            // TEST 12: Técnico tentando deletar cliente (deveria dar 403)
            console.log();
            console.log('▶ TESTE 12: Técnico tentando DELETE /clients/:id (sem permissão)');
            const techDelete = await request('DELETE', '/clients/fake-id', null, techToken);
            console.log(`  Status: ${techDelete.status}`);
            console.log(`  ${techDelete.status === 403 ? '✅' : '❌'} Resposta: ${JSON.stringify(techDelete.data)}`);

            // TEST 13: Técnico acessando leitura de clientes (deveria funcionar)
            console.log();
            console.log('▶ TESTE 13: Técnico fazendo GET /clients (tem permissão)');
            const techRead = await request('GET', '/clients', null, techToken);
            console.log(`  Status: ${techRead.status}`);
            console.log(`  ${techRead.status === 200 ? '✅' : '❌'} Leitura permitida`);
        } else {
            console.log(`  ❌ Login falhou: ${JSON.stringify(techLogin.data)}`);
        }
    } else {
        console.log(`  ⚠️ ${JSON.stringify(register.data)}`);
    }

    console.log();
    console.log('='.repeat(60));
    console.log(' AUDITORIA - Logs no banco');
    console.log('='.repeat(60));

    // Ler audit logs do banco
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database('./database.sqlite');
    db.all("SELECT * FROM audit_logs ORDER BY createdAt DESC LIMIT 15", (err, rows) => {
        if (err) { console.log('  Erro ao ler logs:', err.message); db.close(); return; }
        console.log(`  Total de logs recentes: ${rows.length}`);
        console.log();
        rows.forEach((row, i) => {
            console.log(`  [${i + 1}] ${row.createdAt} | ${row.action} | ${row.entity} | User: ${row.userId || 'N/A'} | IP: ${row.ip || 'N/A'}`);
            if (row.details) console.log(`       Detalhes: ${row.details}`);
        });
        db.close();
    });
}

run();
