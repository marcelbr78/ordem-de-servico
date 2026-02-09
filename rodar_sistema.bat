echo [1/3] Banco de Dados Local (SQLite ativado)...
:: docker-compose up -d

echo [2/3] Iniciando Backend...
start cmd /k "cd backend && npm run start:dev"

echo [3/3] Iniciando Frontend...
start cmd /k "cd frontend && npm run dev"

echo Sucesso! Aguarde alguns segundos e acesse http://localhost:5173
pause
