@echo off
echo Starting Rwanda LFS Analytics API...
cd /d "%~dp0"
python -m pip install -r requirements-api.txt
python -m uvicorn api.app:app --host 0.0.0.0 --port 8000 --reload
pause
