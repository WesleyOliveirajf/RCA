@echo off
echo === Setup Sistema RCA ===

echo [1/3] Backend API
cd apps\api
if not exist .venv python -m venv .venv
call .venv\Scripts\activate
pip install -r requirements-dev.txt
if not exist .env copy .env.example .env
cd ..\..

echo [2/3] Frontend Web
cd apps\web
call npm install
if not exist .env.local copy .env.example .env.local
cd ..\..

echo [3/3] Supabase
echo Execute manualmente: supabase link && supabase db push

echo.
echo Setup concluido. Configure .env e .env.local antes de iniciar.
echo API:  cd apps\api ^&^& uvicorn rca_api.main:app --reload --app-dir src
echo Web:  cd apps\web ^&^& npm run dev
