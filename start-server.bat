@echo off
echo Starting NBA API Server...
cd /d "%~dp0server"
start /B "NBA-API-Server" "C:\Program Files\nodejs\node.exe" dist/index.js
echo NBA API Server started in background
echo Access the API at: http://localhost:8000
echo Or through Apache proxy at: http://localhost/api
pause