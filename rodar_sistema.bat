@echo off
echo [1/4] Iniciando WhatsApp (Evolution API)... (DESATIVADO)
cd backend
rem docker-compose -f docker-compose-evolution.yml up -d
cd ..

echo [2/4] Iniciando Backend...
start "Backend Server" cmd /k "cd backend && npm run start"

echo [3/4] Iniciando Frontend...
start "Frontend App" cmd /k "cd frontend && npm run preview"

echo [4/4] Configurando Webhook WhatsApp... (DESATIVADO)
rem timeout /t 5 /nobreak > NUL
cd backend
rem node -e "const axios = require('axios'); setTimeout(() => { axios.post('http://localhost:8080/webhook/set/loja_local', { enabled: true, url: 'http://host.docker.internal:3001/smartparts/webhook/whatsapp', webhook_by_events: false, events: ['MESSAGES_UPSERT'] }, { headers: { apikey: 'B8D6F5E4C3A2910G7', 'Content-Type': 'application/json' } }).then(r => console.log('Webhook OK')).catch(e => console.log('Webhook retry later')) }, 3000)"
cd ..

echo.
echo =======================================================
echo Sistema iniciado!
echo Acesse: http://localhost:5173
echo =======================================================
pause
