# LifeOS - Sistema Operacional Pessoal

Um moderno e belo sistema operacional pessoal construído com React, TypeScript e Tailwind CSS. Gerencie seus hábitos, metas e produtividade em uma interface elegante.

## 🚀 Funcionalidades

- **Controle de Hábitos**: Construa consistência com o acompanhamento diário de hábitos e sequências
- **Gestão de Metas**: Crie e acompanhe metas com subtarefas e barras de progresso
- **Painel**: Visão geral da sua produtividade e progresso
- **Tema Escuro/Claro**: Alterne entre temas com transições suaves
- **Design Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- **Armazenamento Local**: Seus dados são salvos automaticamente no seu navegador

## 🛠️ Stack Tecnológica

- **React 19** - Biblioteca moderna de UI
- **TypeScript** - Desenvolvimento com tipos seguros
- **Tailwind CSS** - Framework CSS baseado em utilitários
- **Vite** - Ferramenta de build e servidor de desenvolvimento rápido
- **Lucide React** - Ícones SVG bonitos
- **Radix UI** - Componentes acessíveis
- **Shadcn/ui** - Biblioteca de componentes modernos

## 📦 Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd lifeos
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
# ou
pnpm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

4. Abra seu navegador e visite `http://localhost:5173`

## 🎨 Capturas de Tela

### Dashboard
![Dashboard](./screenshots/dashboard.png)

### Hábitos
![Habits](./screenshots/habits.png)

### Metas
![Goals](./screenshots/goals.png)

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes UI reutilizáveis
│   ├── Dashboard.tsx    # Visão principal do dashboard
│   ├── HabitsView.tsx   # Gerenciamento de hábitos
│   ├── GoalsView.tsx    # Gerenciamento de metas
│   ├── ThemeToggle.tsx  # Alternância de tema
│   └── ui/             # Componentes Shadcn/ui
├── hooks/              # Hooks React personalizados
│   ├── useLocalStorage.ts
│   └── useTheme.ts
├── lib/                # Utilitários e tipos
│   ├── types.ts        # Interfaces TypeScript
│   ├── utils.ts        # Funções auxiliares
│   └── mockData.ts     # Dados de exemplo
└── pages/              # Componentes de páginas principais
    └── Index.tsx       # Página principal da aplicação
```

## 🔧 Configuração

O projeto está configurado com:
- **ESLint** para linting de código
- **Prettier** para formatação de código
- **TypeScript** para verificação de tipos
- **Tailwind CSS** para estilização
- **Vite** para configuração de build

## 🚀 Deploy

Este projeto está pronto para deploy em qualquer serviço de hospedagem estática:

- **Vercel**: `vercel`
- **Netlify**: `netlify deploy`
- **GitHub Pages**: Build com `npm run build` e deploy da pasta `dist`

## 🤝 Contribuindo

1. Faça um fork do repositório
2. Crie uma branch para a feature (`git checkout -b feature/feature-incrivel`)
3. Faça o commit das suas alterações (`git commit -m 'Adiciona feature incrível'`)
4. Faça push para a branch (`git push origin feature/feature-incrivel`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- Construído com [Shadcn/ui](https://ui.shadcn.com/)
- Ícones do [Lucide](https://lucide.dev/)
- Estilizado com [Tailwind CSS](https://tailwindcss.com/)
- Construído com [Vite](https://vitejs.dev/)