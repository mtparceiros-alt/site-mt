@echo off
cls
echo ============================================================
echo   🛡️ FAXINA DE SEGURANÇA - MT PARCEIROS 🛡️
echo ============================================================
echo.
echo 1. Acessando pasta de deploy...
cd /d "C:\Users\Marcos.PC_M1\Documents\github_site\Site_MT_Final"

echo.
echo 2. Removendo commit exposto do historico local...
git reset --soft HEAD~1

echo.
echo 3. Preparando arquivos protegidos (Ofuscados)...
git add .

echo.
echo 4. Gerando novo registro de segurança...
git commit -m "Security Patch: Restoring obfuscated logic and performance"

echo.
echo 5. LIMPANDO GITHUB REMOTO (Force Push)...
echo [!] Isso vai apagar o rastro do codigo legivel do servidor.
git push origin main --force

echo.
echo ============================================================
echo   ✅ LIMPEZA CONCLUÍDA COM SUCESSO!
echo   Seu código está seguro e o rastro foi apagado.
echo ============================================================
pause
