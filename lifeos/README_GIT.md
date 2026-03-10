# 🚀 LifeOS - Subir para Git

## 📦 Subir Alterações para o Git

### **Execute o Script de Deploy**
```bash
# Dentro da pasta do projeto, execute:
subir_git.bat
```

### **Ou Suba Manualmente**
```bash
# 1. Inicializar repositório Git
git init

# 2. Configurar usuário
git config user.name "SEU_NOME"
git config user.email "seu@email.com"

# 3. Adicionar arquivos
git add .

# 4. Fazer commit
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

# 5. Conectar ao repositório remoto
git remote add origin https://github.com/SEU_USUARIO/lifeos.git

# 6. Enviar para GitHub
git branch -M main
git push -u origin main
```

## 🌐 Conectar ao GitHub

### **Criar Repositório no GitHub**
1. Acesse [github.com](https://github.com)
2. Clique em "New repository"
3. Nome: `lifeos`
4. Descrição: `Sistema completo de organização pessoal`
5. Deixe público
6. Não inicialize com README (já temos)
7. Crie o repositório

### **Conectar Repositório Local**
```bash
# URL do seu repositório (substitua SEU_USUARIO)
git remote add origin https://github.com/SEU_USUARIO/lifeos.git
git branch -M main
git push -u origin main
```

## 🔄 Atualizações Futuras

### **Sempre que fizer alterações**
```bash
# 1. Adicionar alterações
git add .

# 2. Fazer commit
git commit -m "feat: adicionar nova funcionalidade"

# 3. Enviar para GitHub
git push origin main
```

### **Puxar alterações de outros desenvolvedores**
```bash
# 1. Puxar alterações
git pull origin main

# 2. Resolver conflitos (se houver)
# 3. Fazer merge
git push origin main
```

## 🎯 Resultado Final

### **Repositório no GitHub**
- ✅ Código fonte completo
- ✅ Documentação de deploy
- ✅ Configurações prontas
- ✅ Histórico de commits

### **Próximos Passos**
1. **Conectar ao Vercel/Netlify**
2. **Configurar deploy automático**
3. **Compartilhar URL online**

---

**Seu LifeOS está pronto para o mundo! 🌟**

## 📋 Checklist de Git

- [ ] Executar `subir_git.bat` ou subir manualmente
- [ ] Criar repositório no GitHub
- [ ] Conectar repositório local ao remoto
- [ ] Enviar código para GitHub
- [ ] Configurar deploy automático
- [ ] Compartilhar URL online

**Tudo pronto para o deploy! 🚀🌐**