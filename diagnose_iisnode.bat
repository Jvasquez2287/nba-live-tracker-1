@echo off
echo IISNode Diagnostic Script
echo ========================

echo.
echo 1. Checking IISNode installation...
if exist "C:\Program Files\iisnode\iisnode.dll" (
    echo ✓ IISNode DLL found
) else (
    echo ✗ IISNode DLL not found at C:\Program Files\iisnode\iisnode.dll
)

echo.
echo 2. Checking Node.js installation...
where node >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Node.js found
    for /f "tokens=*" %%i in ('node --version') do echo Node.js version: %%i
) else (
    echo ✗ Node.js not found in PATH
)

echo.
echo 3. Checking application files...
if exist "dist\index.js" (
    echo ✓ dist/index.js found
) else (
    echo ✗ dist/index.js not found - run 'npm run build' first
)

if exist "web.config" (
    echo ✓ web.config found
) else (
    echo ✗ web.config not found
)

echo.
echo 4. Testing Node.js application directly...
if exist "dist\index.js" (
    echo Running: node dist/index.js (will terminate in 3 seconds)
    timeout /t 3 /nobreak >nul
    start /b node dist/index.js > test_output.log 2>&1
    timeout /t 2 /nobreak >nul
    taskkill /f /im node.exe >nul 2>&1
    if exist "test_output.log" (
        echo Test output:
        type test_output.log
        del test_output.log
    )
) else (
    echo Skipping Node.js test - dist/index.js not found
)

echo.
echo 5. Checking IISNode logs directory...
if exist "iisnode" (
    echo ✓ iisnode directory exists
    echo Recent log files:
    dir /b iisnode\*.log 2>nul | findstr . >nul
    if errorlevel 1 (
        echo No log files found
    ) else (
        for /f %%f in ('dir /b /o-d iisnode\*.log 2^>nul') do (
            echo %%f
            goto :break
        )
    )
    :break
) else (
    echo ✗ iisnode directory not found - will be created when IISNode runs
)

echo.
echo Diagnostic complete. Check the results above for issues.
echo If you see errors, check:
echo - IISNode installation
echo - Application pool configuration (must be 'No Managed Code')
echo - File permissions
echo - IISNode logs in the iisnode directory
pause