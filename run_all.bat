@echo off
echo ========================================================
echo   ApexAgile Pro - Enterprise Agile Project Management
echo ========================================================
if "%PORT%"=="" set PORT=8001
echo Installing dependencies if needed...
python -m pip install -r backend/requirements.txt

echo.
echo Starting application server...
echo Access Web UI at:               http://127.0.0.1:%PORT%
echo Access Interactive API Docs at: http://127.0.0.1:%PORT%/docs
echo ========================================================
set PYTHONPATH=backend
python backend/run.py
pause
