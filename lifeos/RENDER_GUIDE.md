# Guia de Deploy no Render - LifeOS

Seu projeto está pronto para o deploy! Adicionamos as configurações necessárias para que o Render reconheça o projeto automaticamente.

## Opção 1: Usando o Blueprint (Recomendado)

O arquivo `render.yaml` que criamos permite um deploy quase automático:

1. Acesse o [Dashboard do Render](https://dashboard.render.com/).
2. Clique em **"Blueprints"** no menu superior.
3. Conecte seu repositório GitHub.
4. O Render lerá o arquivo `render.yaml` e configurará tudo sozinho:
   - **Tipo:** Static Site
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
   - **SPAs:** Já configuramos o redirecionamento automático para o `index.html`.

## Opção 2: Configuração Manual

Se preferir configurar manualmente no painel do Render:

1. Clique em **"New +"** e escolha **"Static Site"**.
2. Escolha seu repositório.
3. Preencha as configurações:
   - **Name:** lifeos (ou sua preferência)
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Em **"Redirects/Rewrites"**, adicione:
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Action:** Rewrite

## Verificações Realizadas

- [x] **TypeScript:** Código sem erros de tipo.
- [x] **Lint:** Erros corrigidos (apenas warnings restantes que não bloqueiam o build).
- [x] **Routing:** Configurado para SPA.
- [x] **Build:** Configuração de build padrão do Vite.

Boa sorte com seu LifeOS online! 🚀
