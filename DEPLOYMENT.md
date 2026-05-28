# 🚀 Deployment - Colocar em Produção

## 📋 Pré-requisitos

Você já deve ter:
- ✅ Projeto Firebase criado
- ✅ App rodando localmente (`npm run dev`)
- ✅ Node.js instalado

## 📤 Deploy no Firebase Hosting (GRÁTIS)

Firebase Hosting é **100% grátis** até 10GB/mês. Perfeito para este projeto!

### 1️⃣ Instalar Firebase CLI

```bash
npm install -g firebase-tools
```

Verifique a instalação:
```bash
firebase --version
```

### 2️⃣ Build do Projeto

```bash
npm run build
```

Isso vai criar uma pasta `dist/` com o app otimizado para produção.

### 3️⃣ Login no Firebase

```bash
firebase login
```

Isso vai:
1. Abrir seu navegador
2. Pedir para você fazer login com sua conta Google
3. Pedir permissão para o CLI acessar Firebase
4. Voltar para o terminal confirmando o login

### 4️⃣ Inicializar Firebase Hosting

```bash
firebase init hosting
```

Responda as perguntas:
- **"Qual projeto Firebase você quer usar?"** → Selecione `palpiteiros-hexa`
- **"Qual é seu diretório de publicação?"** → Digite `dist` (sem aspas)
- **"Configurar como SPA?"** → Digite `y` (sim)
- **"Ativar GitHub Actions Deploy?"** → Digite `n` (não, por enquanto)

Resultado:
```
✓ Firebaserc criado
✓ firebase.json criado
✓ .firebaserc criado
```

### 5️⃣ Deploy!

```bash
firebase deploy
```

Aguarde 1-2 minutos. Você verá algo como:

```
✓  Deploy complete!
Project Console: https://console.firebase.google.com/project/palpiteiros-hexa
Hosting URL: https://palpiteiros-hexa.web.app
```

🎉 **Seu app está no ar!**

Acesse: `https://palpiteiros-hexa.web.app`

## 🔒 Configurar Regras de Segurança (IMPORTANTE!)

O app em produção **DEVE** ter regras de segurança configuradas!

### Editar Firestore Rules

1. Firebase Console → **Firestore Database**
2. Clique em **"Regras"**
3. Substitua tudo pelo código abaixo:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users - cada um lê/escreve seu próprio perfil
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow create: if request.auth.uid == userId;
      allow update: if request.auth.uid == userId;
      allow delete: if false;
    }
    
    // Phases - todos leem, admin escreve
    match /phases/{phaseId} {
      allow read: if request.auth != null;
      allow create, update, delete: if isAdmin();
    }
    
    // Bets - cada um gerencia suas apostas
    match /bets/{betId} {
      allow read: if request.auth.uid == resource.data.userId || isAdmin();
      allow create: if request.auth.uid == request.resource.data.userId;
      allow update: if request.auth.uid == resource.data.userId;
      allow delete: if request.auth.uid == resource.data.userId;
    }
    
    // Matches - todos leem, admin escreve
    match /matches/{matchId} {
      allow read: if request.auth != null;
      allow create, update, delete: if isAdmin();
    }
    
    // Helper function
    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

4. Clique em **"Publicar"**

⚠️ **Importante:** Sem essas regras, qualquer pessoa consegue:
- Deletar todos os palpites
- Modificar resultados dos jogos
- Ver dados privados de outros usuários

## 🔄 Atualizar o App em Produção

Toda vez que você fizer mudanças:

```bash
# 1. Testar localmente
npm run dev

# 2. Build para produção
npm run build

# 3. Deploy
firebase deploy
```

O site atualizará em 1-2 minutos. ✨

## 📊 Monitorar Uso

No Firebase Console:
- **Firestore:** Veja leitura/escrita de dados
- **Authentication:** Veja número de usuários
- **Hosting:** Veja tráfego e performance

Tudo é **GRÁTIS** até certos limites.

## 💰 Limites Gratuitos

**Firestore:**
- 50k leituras/dia
- 20k escritas/dia
- 20k exclusões/dia
- 1GB de armazenamento

**Authentication:**
- Verificações de usuário ilimitadas

**Hosting:**
- 10GB de tráfego/mês
- Download ilimitado

Para este projeto, você **nunca vai exceder** esses limites! 🎉

## 🚨 Se Exceder os Limites

1. Firebase avisa por email
2. Você não será cobrado automaticamente
3. Pode aumentar o plano pagando conforme uso

## 🌍 Domínio Customizado (Opcional)

Quer usar seu próprio domínio? (ex: `bolao.com.br`)

### Com domínio já comprado:

1. Firebase Console → **Hosting**
2. Clique em **"Conectar domínio"**
3. Siga os passos (é bem simples)

Custo: Gratuito! Você paga apenas pelo domínio.

## ✅ Checklist Deploy

- [ ] Build do projeto (`npm run build`)
- [ ] Firebase CLI instalado
- [ ] Login Firebase (`firebase login`)
- [ ] Firebase inicializado (`firebase init`)
- [ ] Deploy (`firebase deploy`)
- [ ] Acessar URL de produção
- [ ] Testar login em produção
- [ ] Configurar regras de segurança
- [ ] Verificar no Firebase Console

## 🐛 Troubleshooting Deploy

### Erro: "Firebase CLI not found"
```bash
npm install -g firebase-tools --force
```

### Erro: "Permission denied"
```bash
# Refazer login
firebase logout
firebase login
```

### Erro: "dist folder not found"
```bash
# Fazer build novamente
npm run build
firebase init hosting  # e escolher "dist" novamente
```

### App quebrado em produção mas funciona local
1. Limpar cache do navegador (Ctrl+Shift+Delete)
2. Recarregar página (Ctrl+F5)
3. Se problema persistir, verificar Console (F12)

## 📱 Testar em Produção

Acesse a URL de produção no seu celular:
```
https://palpiteiros-hexa.web.app
```

Deve funcionar identicamente ao local! ✅

## 🔔 Avisos Importantes

⚠️ **ANTES de ir para produção com dados reais:**

1. ✅ Testar completamente em desenvolvimento
2. ✅ Configurar regras de segurança (visto acima)
3. ✅ Trocar senha do admin
4. ✅ Fazer backup (export do Firestore)
5. ✅ Testar em vários navegadores
6. ✅ Testar em vários celulares

## 📞 Suporte

- Firebase Docs: https://firebase.google.com/docs
- Firebase CLI: https://firebase.google.com/docs/cli
- Deploy Issues: https://stackoverflow.com/questions/tagged/firebase

---

**Parabéns!** 🎉 Seu app Palpiteiros do Hexa está no ar! 

🇧🇷 Boa sorte com o bolão!
