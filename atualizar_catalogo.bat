@echo off
setlocal
set "ROOT=%~dp0"
set "PYTHON_EXE=%ROOT%.venv\Scripts\python.exe"

if not exist "%PYTHON_EXE%" (
  set "PYTHON_EXE=python"
)

cd /d "%ROOT%"
echo Atualizando catalogo do site MT Parceiros...
echo.
"%PYTHON_EXE%" scripts\sync_cms.py %*

if errorlevel 1 (
  echo.
  echo Falha na sincronizacao.
  pause
  exit /b 1
)

echo.
echo Sincronizacao concluida.
echo.
pause
