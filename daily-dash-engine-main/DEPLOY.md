# Guia de Deploy - Subir o LifeOS para Internet

## 🚀 Deploy com Vercel (Recomendado)

### **1. Preparar o Projeto**

#### **Verificar package.json**
Certifique-se que seu `package.json` tem as dependências corretas:

```json
{
  "name": "lifeos",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "lucide-react": "^0.263.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.5",
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@typescript-eslint/eslint-plugin": "^7.2.0",
    "@typescript-eslint/parser": "^7.2.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.19",
    "bun-types": "1.1.13",
    "eslint": "^8.57.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.38",
    "tailwind-merge": "^2.0.0",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.2.2",
    "vite": "^5.2.0"
  }
}
```

#### **Criar build de produção**
```bash
# Instalar dependências
npm install

# Criar build
npm run build
```

### **2. Deploy com Vercel**

#### **Opção 1: Via CLI (Linha de Comando)**

1. **Instalar Vercel CLI**
```bash
npm install -g vercel
```

2. **Fazer login**
```bash
vercel login
```

3. **Deploy**
```bash
vercel
```

4. **Seguir os passos no terminal**
- Escolha o projeto
- Confirme as configurações
- Aguarde o deploy

#### **Opção 2: Via GitHub + Vercel (Recomendado)**

1. **Criar repositório no GitHub**
```bash
# Inicializar git
git init
git add .
git commit -m "Initial commit"

# Criar repositório no GitHub (via github.com)
# Substitua USERNAME e REPO pelo seu usuário e nome do repositório
git remote add origin https://github.com/USERNAME/REPO.git
git branch -M main
git push -u origin main
```

2. **Conectar ao Vercel**
- Acesse [vercel.com](https://vercel.com)
- Crie conta (se não tiver)
- Conecte sua conta do GitHub
- Importe o repositório do LifeOS

3. **Configurar deploy**
- Escolha o repositório
- Configurações automáticas (Vite detecta automaticamente)
- Clique em "Deploy"

### **3. Deploy com Netlify**

#### **Via Drag & Drop**
1. Acesse [netlify.com](https://netlify.com)
2. Crie conta
3. Arraste a pasta `dist` (resultado do `npm run build`) para o dashboard

#### **Via GitHub**
1. Conecte sua conta do GitHub
2. Escolha o repositório
3. Configure build:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Deploy

### **4. Deploy com GitHub Pages**

1. **Criar build**
```bash
npm run build
```

2. **Configurar GitHub Pages**
- No repositório do GitHub, vá em Settings > Pages
- Escolha a branch `gh-pages` ou `main` na pasta `/docs`
- Salve as configurações

3. **Automatizar com GitHub Actions**
Crie o arquivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### **5. Configurações Adicionais**

#### **Custom Domain (Domínio Próprio)**
- **Vercel**: Settings > Domains
- **Netlify**: Site settings > Domain management
- **GitHub Pages**: Settings > Pages > Custom domain

#### **HTTPS**
- Todas as plataformas acima oferecem HTTPS gratuito

#### **Environment Variables**
Se precisar de variáveis de ambiente, configure no painel da plataforma escolhida.

### **6. Pós-Deploy**

#### **Verificar Deploy**
- Acesse a URL fornecida pela plataforma
- Teste todas as funcionalidades
- Verifique se o localStorage funciona corretamente

#### **Monitoramento**
- Verifique logs no painel da plataforma
- Teste em diferentes dispositivos
- Verifique tempo de carregamento

### **7. Atualizações**

#### **Deploy Automático**
- Qualquer push no GitHub (branch configurada) faz deploy automático
- Ideal para manter o site sempre atualizado

#### **Deploy Manual**
```bash
# Vercel CLI
vercel --prod

# Netlify CLI
netlify deploy --prod
```

## 🎯 Plataformas Recomendadas

### **1. Vercel** ⭐⭐⭐⭐⭐
- **Vantagens**: Deploy instantâneo, integração perfeita com React/Vite
- **Custo**: Gratuito para projetos pessoais
- **Velocidade**: Muito rápido
- **Recomendado para**: Iniciantes e projetos pessoais

### **2. Netlify** ⭐⭐⭐⭐
- **Vantagens**: Interface amigável, ótimo para front-end
- **Custo**: Gratuito para projetos pessoais
- **Velocidade**: Rápido
- **Recomendado para**: Projetos estáticos

### **3. GitHub Pages** ⭐⭐⭐
- **Vantagens**: Gratuito, integrado ao GitHub
- **Custo**: Totalmente gratuito
- **Velocidade**: Moderado
- **Recomendado para**: Projetos simples

## 🆘 Solução de Problemas

### **Problemas Comuns**
- **Build falhando**: Verifique dependências no package.json
- **Página em branco**: Verifique console do navegador
- **Recursos não carregam**: Verifique caminhos no vite.config.ts

### **Suporte**
- **Vercel**: [vercel.com/support](https://vercel.com/support)
- **Netlify**: [netlify.com/support](https://netlify.com/support)
- **GitHub Pages**: [docs.github.com/pages](https://docs.github.com/pages)

---

**Pronto! Seu LifeOS estará online em minutos! 🚀🌐**