#!/bin/bash
# Backup do PostgreSQL — rode via cron todo dia às 3h
# Crontab: 0 3 * * * /caminho/para/backup.sh

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M)
KEEP_DAYS=30   # apagar backups com mais de 30 dias

mkdir -p "$BACKUP_DIR"

source .env 2>/dev/null

echo "[$(date)] Iniciando backup..."
docker compose exec -T postgres pg_dump \
  -U "${DB_USERNAME:-os4u}" "${DB_DATABASE:-assistencia_db}" \
  | gzip > "$BACKUP_DIR/db_${DATE}.sql.gz"

if [ $? -eq 0 ]; then
  SIZE=$(du -sh "$BACKUP_DIR/db_${DATE}.sql.gz" | cut -f1)
  echo "[$(date)] Backup OK: db_${DATE}.sql.gz ($SIZE)"
else
  echo "[$(date)] ERRO no backup!"
  exit 1
fi

# Apagar backups antigos
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$KEEP_DAYS -delete
echo "[$(date)] Backups antigos removidos (>${KEEP_DAYS} dias)"
