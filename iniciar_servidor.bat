@echo off
echo Iniciando o Servidor Local do MT Parceiros...
echo.
echo Por favor, mantenha a janela preta que vai se abrir aberta enquanto estiver testando.
echo.

:: Inicia o servidor Python em uma nova janela
start "Servidor MT Parceiros" cmd /c "python -m http.server 8080"

:: Aguarda 2 segundos para dar tempo do servidor iniciar
timeout /t 2 /nobreak >nul

:: Abre o navegador padrao no endereco do servidor
start http://localhost:8080

exit
