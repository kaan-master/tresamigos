@echo off
setlocal
echo Stoppen oude Tres Amigos processen op poort 3100, 5180, 5181 en 5434-check...

for %%P in (3100 5180 5181) do (
  for /f "tokens=5" %%A in ('netstat -ano ^| findstr /R /C:":%%P .*LISTENING"') do (
    if not "%%A"=="0" (
      echo   Poort %%P ^> PID %%A
      taskkill /F /PID %%A >nul 2>&1
    )
  )
)

timeout /t 2 /nobreak >nul

exit /b 0
