@echo off
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
	echo Project Python environment not found. Run the Windows setup commands in README.md first.
	exit /b 1
)
echo Starting Rwanda LFS Analytics API at http://127.0.0.1:8000
".venv\Scripts\python.exe" -m uvicorn api.app:app --host 127.0.0.1 --port 8000 --reload
