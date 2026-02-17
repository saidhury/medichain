@echo off
set SCRIPT_DIR=%~dp0
echo Starting backend on port 8002...
cd /d "%SCRIPT_DIR%backend"
call venv\Scripts\activate.bat
python manage.py runserver 0.0.0.0:8002
pause
