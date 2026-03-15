# OS4U — Subir online (Render + Cloudflare Pages)

## O plano

```
Repo os4u (GitHub)
  └── main  →  Render (backend) + Cloudflare Pages (frontend)
                    ↑ sistema online, acessível de qualquer lugar

Repo os4u-interno (GitHub novo)
  └── main  →  só no seu notebook, uso interno
```

---

## PARTE 1 — Salvar a main atual como repositório interno

**No notebook, na pasta do sistema atual (a main com as OS dos clientes):**

```bash
# Entrar na pasta do sistema atual
cd /caminho/do/seu/sistema/atual

# Criar novo repositório no GitHub:
# → github.com → New repository → nome: os4u-interno → Private → Create

# Conectar e subir
git remote set-url origin https://github.com/SEU_USUARIO/os4u-interno.git
# ou se não tiver git init ainda:
git init
git remote add origin https://github.com/SEU_USUARIO/os4u-interno.git

git add .
git commit -m "backup: sistema interno com dados dos clientes"
git push -u origin main
```

✅ Pronto — main atual salva no repo privado `os4u-interno`.

---

## PARTE 2 — Subir o sistema novo no repo os4u

**No computador onde está o sistema novo (estes arquivos):**

```bash
cd /caminho/do/sistema/novo

# Inicializar git
git init

# Conectar ao repo os4u existente
git remote add origin https://github.com/SEU_USUARIO/os4u.git

# Adicionar tudo
git add .
git commit -m "feat: sistema OS4U completo — nova versão"

# Subir na main (vai substituir o que está no Render)
git push -u origin main --force
# --force porque a main do Render já tem commits diferentes
```

✅ O Render detecta o push e **inicia o redeploy automático**.

---

## PARTE 3 — Configurar o Render

O `render.yaml` na raiz já configura tudo automaticamente.
Mas você precisa preencher **uma variável** no dashboard:

**Dashboard Render → os4u-backend → Environment:**

| Variável | Valor |
|---|---|
| `FRONTEND_URL` | URL do seu site no Cloudflare (ex: `https://os4u.com.br`) |

Se ainda não tem a URL do Cloudflare, coloca `*` por enquanto e depois atualiza.

**Verificar se o backend subiu:**
```
https://os4u-backend.onrender.com/health
# Deve retornar: {"status":"ok"}
```

---

## PARTE 4 — Configurar Cloudflare Pages (frontend)

### No dashboard do Cloudflare Pages:

1. **Workers & Pages → Create → Pages → Connect to Git**
2. Selecionar o repositório `os4u`
3. Configurar o build:

| Campo | Valor |
|---|---|
| **Framework preset** | Vite |
| **Build command** | `npm install --legacy-peer-deps && npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | `frontend` |

4. **Environment variables (Production):**

| Variável | Valor |
|---|---|
| `VITE_API_URL` | URL do backend no Render (ex: `https://os4u-backend.onrender.com`) |

5. Clicar **Save and Deploy**

---

## PARTE 5 — Conectar o domínio no Cloudflare

Se você tem um domínio no Cloudflare:

**Cloudflare Pages → seu projeto → Custom domains → Add domain**

Digitar seu domínio → o Cloudflare configura o DNS automaticamente.

Depois disso:
- Voltar no **Render → Environment**
- Atualizar `FRONTEND_URL` para `https://seu-dominio.com.br`
- Clicar **Save** → Render faz redeploy em ~2 min

---

## Resultado final

| O quê | Onde | URL |
|---|---|---|
| Frontend | Cloudflare Pages | `https://seu-dominio.com.br` |
| Backend API | Render | `https://os4u-backend.onrender.com` |
| Banco | Render PostgreSQL | interno (não público) |
| Sistema interno | Notebook | `http://192.168.x.x` |

---

## Atualizar o sistema depois

Quando fizer mudanças no código e quiser publicar:

```bash
git add .
git commit -m "feat: descrição da mudança"
git push origin main
# Render e Cloudflare Pages fazem redeploy automaticamente
```

---

## Troubleshooting rápido

**Backend não sobe no Render:**
```
Render Dashboard → os4u-backend → Logs
```
Geralmente é variável de env faltando ou erro de build.

**Frontend abre mas dá erro de API:**
- Verificar se `VITE_API_URL` está apontando para o backend correto
- Lembrar: precisa fazer redeploy do Cloudflare Pages após mudar essa variável

**Rotas quebram ao dar F5 no navegador:**
- O arquivo `frontend/public/_redirects` resolve isso ✅ (já criado)

**Render "sleeping" (plano free):**
- O plano free dorme após 15min sem acesso
- Primeira requisição demora ~30s para "acordar"
- Para evitar: usar plano Starter ($7/mês) ou pingar de 14 em 14 min
