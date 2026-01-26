@echo off
echo Stopping NBA API Server...
taskkill /FI "WINDOWTITLE eq NBA-API-Server" /T /F
echo NBA API Server stopped
pause