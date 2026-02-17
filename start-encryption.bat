@echo off
echo Starting encryption on port 8001...
cd /d "D:\Hackathons\neilit-cybrella-2026\medical-chain-mvp\encryption_service"
call venv\Scripts\activate.bat
uvicorn main:app --reload --port 8001 --host 0.0.0.0
pause
