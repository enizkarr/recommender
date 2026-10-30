@echo off
rem Updates, builds and runs the production site on this PC.
rem Double-click it, or run it from a terminal. Closing this window stops the site.
setlocal
set PORT=4000

rem Work from the project folder, wherever the script is started from.
cd /d "%~dp0.."

echo.
echo [1/5] Getting the latest code from GitHub...
git pull --ff-only
if errorlevel 1 echo       Could not update (uncommitted changes or no internet). Using the code on this PC.

echo.
echo [2/5] Checking packages...
rem npm ci only when package-lock.json changed since the last install; a fingerprint of it is kept in node_modules.
for /f "skip=1 delims=" %%h in ('certutil -hashfile package-lock.json SHA256 ^| findstr /v /c:"CertUtil"') do (
  set LOCK_HASH=%%h
  goto :hashed
)
:hashed
set OLD_HASH=
if exist node_modules\.lock-hash set /p OLD_HASH=<node_modules\.lock-hash
if "%LOCK_HASH%"=="%OLD_HASH%" (
  echo       Packages are up to date.
) else (
  call npm ci
  if errorlevel 1 goto :failed
  >node_modules\.lock-hash echo %LOCK_HASH%
)

echo.
echo [3/5] Stopping the site if it is already running...
rem Only a "next start" server on our port is stopped, so the dev server and other programs are left alone.
rem Nothing listening on the port is fine: the exit code is only 1 when another program holds it.
powershell -NoProfile -Command "$code = 0; $found = $false; Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue | ForEach-Object { $found = $true; $p = Get-CimInstance Win32_Process -Filter ('ProcessId = ' + $_.OwningProcess); if ($p.CommandLine -match 'next.+start') { Stop-Process -Id $p.ProcessId -Force; '      Stopped the old copy.' } else { '      Port %PORT% is used by another program: ' + $p.Name; $code = 1 } }; if (-not $found) { '      Not running.' }; exit $code"
if errorlevel 1 goto :failed

echo.
echo [4/5] Building the site (this takes a minute)...
call npm run build
if errorlevel 1 goto :failed

echo.
echo [5/5] Starting the site at http://localhost:%PORT%
echo       Keep this window open. Close it, or press Ctrl+C, to stop the site.
echo.
call npx next start -p %PORT%
goto :eof

:failed
echo.
echo Something went wrong - see the messages above. The site is not running.
pause
exit /b 1
