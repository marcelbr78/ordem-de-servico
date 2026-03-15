# Sistema de Assistência Técnica

Sistema modular para gestão de assistência técnica de eletrônicos (Celulares, Notebooks, etc.).

## Tecnologias
- **Backend:** NestJS (Node.js) + PostgreSQL
- **Integrações:** Evolution API (WhatsApp)
- **Deploy:** Render (Blueprint automatizado)

## Estrutura de Módulos
1. **Auth & Users:** Gestão de acesso e permissões.
2. **Clients:** Cadastro e histórico de clientes.
3. **Orders (Core):** Gestão de Ordens de Serviço com protocolo automático.

## Como rodar localmente
1. `cd backend`
2. `npm install`
3. Configure o `.env`
4. `npm run start:dev`

---
*Desenvolvido de forma modular e escalável.*
