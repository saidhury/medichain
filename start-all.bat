@echo off
set SCRIPT_DIR=%~dp0
echo Starting Medical Chain MVP...
echo.

start "Encryption Service (8001)" cmd /k "cd /d %SCRIPT_DIR%encryption_service && call venv\Scripts\activate.bat && uvicorn main:app --reload --port 8001 --host 0.0.0.0"
timeout /t 2 >nul

start "Django Backend (8002)" cmd /k "cd /d %SCRIPT_DIR%backend && call venv\Scripts\activate.bat && python manage.py runserver 0.0.0.0:8002"
timeout /t 2 >nul

start "React Frontend (5173)" cmd /k "cd /d %SCRIPT_DIR%frontend && npm run dev"
timeout /t 2 >nul

echo.
echo All services started!
echo - Frontend: http://localhost:5173
echo - Backend API: http://localhost:8002/api/
echo - Encryption: http://localhost:8001
echo.
pause
