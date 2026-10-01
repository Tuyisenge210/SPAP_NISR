$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

$Python = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
if (-not (Test-Path -LiteralPath $Python)) {
	throw "Project Python environment not found. Run the Windows setup commands in README.md first."
}

& $Python -m uvicorn api.app:app --host 127.0.0.1 --port 8000 --reload
if ($LASTEXITCODE -ne 0) {
	throw "The LFS API stopped with exit code $LASTEXITCODE."
}
