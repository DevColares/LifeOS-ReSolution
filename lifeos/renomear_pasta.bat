@echo off
echo.
echo 🚀 Renomeando pasta para LifeOS...
echo.

REM Verifica se está no diretório correto
if not exist "package.json" (
    echo ❌ Erro: package.json não encontrado!
    echo Por favor, execute este script dentro da pasta do projeto.
    pause
    exit /b 1
)

REM Verifica se já foi renomeado
if exist "..\lifeos" (
    echo ⚠️  Pasta 'lifeos' já existe no diretório pai!
    echo Por favor, remova ou renomeie a pasta existente primeiro.
    pause
    exit /b 1
)

REM Obtém o caminho atual
set "current_dir=%CD%"

REM Obtém o nome da pasta atual
for %%I in (.) do set "current_name=%%~nI"

REM Verifica se já está com o nome correto
if /i "%current_name%"=="lifeos" (
    echo ✅ Pasta já está com o nome correto: %current_name%
    pause
    exit /b 0
)

REM Volta para o diretório pai
cd ..

REM Renomeia a pasta
ren "%current_name%" "lifeos"

echo ✅ Pasta renomeada com sucesso!
echo 📁 %current_name% → lifeos
echo.
echo 🎉 Pronto para deploy!
echo.
echo Próximos passos:
echo 1. Entre na pasta: cd lifeos
echo 2. Inicie o projeto: npm run dev
echo 3. Crie repositório no GitHub
echo 4. Conecte ao Vercel/Netlify
echo.
pause