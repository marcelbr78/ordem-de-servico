@echo off
echo ==========================================
echo   INICIANDO SISTEMA DE ORDEM DE SERVICO
echo ==========================================

echo 1. Iniciando Backend (Porta 3001)...
start "Backend API" cmd /k "cd backend && npm run start:dev"

echo Aguardando 5 segundos para o backend subir...
timeout /t 5 >nul

echo 2. Iniciando Frontend (Porta 5173)...
start "Frontend App" cmd /k "cd frontend && npm run dev"

echo.
echo ==========================================
echo   SISTEMA NO AR!
echo   Acesse: http://localhost:5173
echo ==========================================
pause
