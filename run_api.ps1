Set-Location -LiteralPath "D:\USER\PROJECTS\Rwanda labour force survey"
.venv\Scripts\python.exe -m pip install -r requirements-api.txt
.venv\Scripts\python.exe -m uvicorn api.app:app --host 0.0.0.0 --port 8000 --reload
