@echo off
echo Starting Medical Chain MVP...
echo.

start "Encryption Service (8001)" cmd /k "cd /d D:\Hackathons\neilit-cybrella-2026\medical-chain-mvp\encryption_service && call venv\Scripts\activate.bat && uvicorn main:app --reload --port 8001 --host 0.0.0.0"
timeout /t 2 >nul

start "Django Backend (8000)" cmd /k "cd /d D:\Hackathons\neilit-cybrella-2026\medical-chain-mvp\backend && call venv\Scripts\activate.bat && python manage.py runserver 0.0.0.0:8000"
timeout /t 2 >nul

start "React Frontend (5173)" cmd /k "cd /d D:\Hackathons\neilit-cybrella-2026\medical-chain-mvp\frontend && npm run dev"
timeout /t 2 >nul

echo.
echo All services started!
echo - Frontend: http://localhost:5173
echo - Backend API: http://localhost:8000/api/
echo - Encryption: http://localhost:8001
echo.
pause
