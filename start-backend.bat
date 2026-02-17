@echo off
echo Starting backend on port 8000...
cd /d "D:\Hackathons\neilit-cybrella-2026\medical-chain-mvp\backend"
call venv\Scripts\activate.bat
python manage.py runserver 0.0.0.0:8000
pause
