---
name: Coordenação entre Claude do Servidor e Claude do Notebook
description: Papéis, responsabilidades e protocolo de comunicação entre os dois Claude Code
type: project
---

## Os dois Claudes do projeto OS4U

O projeto é operado por dois Claude Code distintos. O "canal" oficial entre eles é o Git (GitHub). O Nilson é o mensageiro humano que coordena os dois.

---

## Claude do Servidor (Linux 192.168.100.192)

**Onde roda:** `/home/os4u/os4u/` no servidor Linux Ubuntu 24.04
**Memórias locais em:** `/home/os4u/claude-memory/`
**Memórias compartilhadas em:** `claude-memory/` deste repositório

### Responsabilidades exclusivas do Servidor:
- Fazer deploy: `git pull` + rebuild dos containers Docker
- Monitorar containers: logs, status, health check
- Gerenciar Evolution API (WhatsApp — porta :8080)
- Gerenciar banco PostgreSQL em produção (backups, migrações)
- Configurar infraestrutura: Cloudflare Tunnel, Tailscale, SSH, portas, systemd
- Operações de servidor: disco, RAM, rede, processos
- **Produção é domínio exclusivo do Servidor — notebook não acessa produção diretamente**

### NÃO é papel do Servidor:
- Editar código de features ou lógica de negócio
- Fazer commits de código novo
- Trabalhar como desenvolvedor no repositório

---

## Claude do Notebook (máquina de desenvolvimento)

**Onde roda:** pasta `ordem-de-servico/` no notebook do Nilson
**Memórias compartilhadas em:** `claude-memory/` deste repositório

### Responsabilidades exclusivas do Notebook:
- Desenvolver features, corrigir bugs, refatorar código
- Fazer commits e push para o GitHub
- Trabalhar no staging para validar antes do deploy
- Criar e gerenciar branches (`feature/xxx → develop → PR → main`)
- Analisar código, propor arquitetura, revisar qualidade
- Testar localmente antes de qualquer deploy

### NÃO é papel do Notebook:
- Acessar o servidor Linux diretamente (SSH, Docker, infraestrutura)
- Fazer deploy em produção — isso é exclusivo do Claude do Servidor
- Alterar configuração de infraestrutura no servidor

---

## Protocolo de comunicação

O Nilson é o canal entre os dois. Fluxo típico:

```
Notebook Claude
  → desenvolve + testa no staging
  → commit + push para develop/main no GitHub
  → avisa Nilson que está pronto para deploy

Nilson avisa o Servidor Claude
  → git pull + docker rebuild
  → confirma status e saúde dos containers
  → avisa Nilson que está em produção
```

---

## Regras de ouro

1. **Cada Claude age apenas no seu domínio.** Se perceber que algo é do outro domínio, oriente o Nilson a levar para o Claude certo.
2. **Git é o contrato.** O que está no GitHub é a verdade sobre o código.
3. **Staging antes de produção.** Notebook testa → Servidor faz deploy.
4. **Sem surpresas.** Antes de qualquer mudança significativa, listar o que será feito e pedir aprovação do Nilson.

---

## O que cada Claude deve saber sobre a infraestrutura

### Notebook Claude — contexto do servidor (para não fazer requisições erradas):
- Frontend produção: http://192.168.100.192 / https://os4u.com.br
- Backend produção: http://192.168.100.192:3005 / https://api.os4u.com.br
- Evolution API: https://evolution.os4u.com.br (v1.8.2, instância os4u_nanotechcell)
- Banco: PostgreSQL 16, 7 tenants, 13 usuários
- Staging (Windows 192.168.100.28): frontend :8081, backend :3006

### Servidor Claude — contexto do desenvolvimento (para entender o que chega via git):
- Branch main = produção (protegida, exige PR)
- Branch develop = próxima versão (sincronizada com main)
- Fluxo: feature/xxx → develop → PR → main
- Arquivos ainda não commitados: warranties module, event listeners, order-notification.service
- Login staging: admin@admin.com / Admin@123

**Why:** Dois Claudes em domínios diferentes evita conflitos e mantém responsabilidade clara.

**How to apply:** Antes de qualquer ação, verificar: "isso é código (notebook) ou infraestrutura (servidor)?". Se for do outro domínio, orientar o Nilson.
