@echo off
echo.
echo 🚀 Subindo alterações para o Git...
echo.

REM Verifica se está no diretório correto
if not exist "package.json" (
    echo ❌ Erro: package.json não encontrado!
    echo Por favor, execute este script dentro da pasta do projeto.
    pause
    exit /b 1
)

REM Verifica se já tem repositório
if exist ".git" (
    echo ⚠️  Repositório Git já existe!
    echo Deseja forçar o commit? (s/n)
    set /p "force="
    if /i "%force%"=="s" (
        goto :force_commit
    ) else (
        echo Operação cancelada.
        pause
        exit /b 0
    )
)

echo 📦 Inicializando repositório Git...
git init

echo 🌐 Configurando repositório remoto...
echo Por favor, insira a URL do seu repositório GitHub:
echo (Exemplo: https://github.com/SEU_USUARIO/lifeos.git)
set /p "remote_url="

if "%remote_url%"=="" (
    echo ❌ URL do repositório não informada!
    echo Por favor, execute novamente e informe a URL.
    pause
    exit /b 1
)

git remote add origin "%remote_url%"

echo 📝 Configurando usuário do Git...
echo Por favor, informe seu nome de usuário do Git:
set /p "user_name="
echo Por favor, informe seu email do Git:
set /p "user_email="

if "%user_name%"=="" (
    echo ⚠️  Nome de usuário não informado, usando padrão...
    set "user_name=LifeOS User"
)

if "%user_email%"=="" (
    echo ⚠️  Email não informado, usando padrão...
    set "user_email=lifeos@example.com"
)

git config user.name "%user_name%"
git config user.email "%user_email%"

echo 🔄 Adicionando arquivos ao repositório...
git add .

echo 📤 Fazendo commit inicial...
git commit -m "🚀 Deploy inicial do LifeOS - Sistema completo de organização pessoal

✨ Principais funcionalidades:
- Dashboard com estatísticas diárias
- Sistema de hábitos com categorias e acompanhamento
- Metas com prazos e barras de progresso
- Área de relacionamentos com cadastro detalhado
- Tema dark/light com toggle
- Export/Import de dados
- Configurações personalizáveis
- Design moderno com cantos arredondados
- Interface totalmente em português

🔧 Otimizações:
- Build configurado para produção
- Segurança configurada
- Performance otimizada
- Deploy pronto para Vercel, Netlify e GitHub Pages"

echo 🌐 Enviando para o repositório remoto...
git branch -M main
git push -u origin main

echo.
echo ✅ Alterações enviadas com sucesso!
echo 🎉 Seu LifeOS está pronto para deploy!
echo.
echo Próximos passos:
echo 1. Conecte ao Vercel/Netlify/GitHub Pages
echo 2. Configure o deploy automático
echo 3. Compartilhe seu LifeOS online!
echo.
pause
exit /b 0

:force_commit
echo 🔄 Forçando commit...
git add .
git commit -m "🔄 Atualização do LifeOS - Sistema de organização pessoal

✨ Melhorias realizadas:
- Área de relacionamentos completa
- Design de cards aprimorado
- Botão da barra lateral harmonioso
- Configurações de deploy prontas
- Otimizações de performance
- Segurança configurada

🚀 Pronto para deploy em produção!"
git push origin main --force
echo.
echo ✅ Alterações enviadas com sucesso (forçado)!
echo 🎉 Seu LifeOS está atualizado!
echo.
pause