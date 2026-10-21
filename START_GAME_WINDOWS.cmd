@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado. Abra dist\index.html diretamente, ou instale Node.js.
  pause
  exit /b 1
)
echo Iniciando FRACTURE em http://127.0.0.1:5173
node tools\dev.mjs
pause
