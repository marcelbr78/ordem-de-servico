# Migrations TypeORM

## Como usar

### Gerar uma migration automaticamente (após mudar entities)
```bash
npm run migration:generate -- src/migrations/NomeDaMigration
```

### Rodar migrations pendentes
```bash
npm run migration:run
```

### Reverter última migration
```bash
npm run migration:revert
```

### Ver status das migrations
```bash
npm run migration:show
```

## Regras importantes

- **Nunca** usar `synchronize: true` em produção
- Sempre gerar migration após alterar qualquer `.entity.ts`
- Fazer commit das migrations junto com as alterações de entity
- Migrations são imutáveis — nunca editar uma já executada em produção

## Ambiente de desenvolvimento

Para dev local com SQLite, o `synchronize: true` ainda está ativo.
Para dev com PostgreSQL local, usar migrations igual à produção.
