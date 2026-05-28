# 🚀 Guia de Setup - Palpiteiros do Hexa

## ✅ Pré-requisitos

Antes de começar, você precisa ter:
- **Node.js 16+** - [Instalar aqui](https://nodejs.org)
- **Git** - [Instalar aqui](https://git-scm.com)
- **Conta Google** - Para criar o projeto Firebase
- **Editor de código** - VSCode recomendado

## 📋 Step-by-Step Setup

### 1️⃣ Criar Projeto Firebase (5-10 minutos)

1. Acesse [https://firebase.google.com/](https://firebase.google.com/)
2. Clique em **"Acessar Console"**
3. Clique em **"Criar Projeto"**
4. Preencha os dados:
   - **Nome do Projeto:** `palpiteiros-hexa`
   - **ID do Projeto:** deixar automático
   - **Desabilitar Google Analytics** (opcional)
5. Clique em **"Criar"** e aguarde 2-3 minutos

### 2️⃣ Ativar Autenticação

1. No Firebase Console, clique em **"Authentication"** (esquerda)
2. Clique em **"Começar"**
3. Em **"Sign-in method"**, clique em **"Email/Senha"**
4. **Ative** a opção **"Email/Senha"**
5. Clique em **"Salvar"**

### 3️⃣ Criar Firestore Database

1. No Firebase Console, clique em **"Firestore Database"** (esquerda)
2. Clique em **"Criar Banco de Dados"**
3. Selecione:
   - **Local:** `southamerica-east1 (São Paulo)`
   - **Modo:** `Iniciar no modo de teste` (importante!)
4. Clique em **"Criar"**

⚠️ **Importante:** O modo de teste permite leitura/escrita de dados por qualquer um. Antes de ir para produção, você DEVE configurar as regras de segurança. Veja a seção "Regras de Segurança" na documentação.

### 4️⃣ Obter Credenciais Firebase

1. No Firebase Console, clique em **⚙️ (Configurações) → Configurações do Projeto**
2. Desça até a seção **"Seus apps"**
3. Clique em **"Web" (ícone de `</>`)**
4. Dê um nome: `palpiteiros-hexa-web`
5. Clique em **"Registrar app"**
6. **Copie** a configuração que aparece (dentro de `const firebaseConfig = {...}`)

Deverá parecer com isso:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "palpiteiros-hexa.firebaseapp.com",
  projectId: "palpiteiros-hexa",
  storageBucket: "palpiteiros-hexa.appspot.com",
  messagingSenderId: "123...",
  appId: "1:123...:web:abc...",
};
```

### 5️⃣ Configurar Credenciais no Projeto

1. Abra o arquivo `.env.example` no seu editor
2. Renomeie para `.env.local`
3. Preencha os valores conforme a configuração do Firebase:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=palpiteiros-hexa.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=palpiteiros-hexa
VITE_FIREBASE_STORAGE_BUCKET=palpiteiros-hexa.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123...
VITE_FIREBASE_APP_ID=1:123...:web:abc...
```

### 6️⃣ Instalar Dependências

```bash
# No terminal, dentro da pasta do projeto
npm install
```

Isso vai instalar:
- React 18
- Firebase SDK
- Tailwind CSS
- Date-fns
- React Router
- Lucide Icons

### 7️⃣ Criar Usuário Admin Padrão

1. Execute o projeto: `npm run dev`
2. Clique em **"Crie sua conta agora"** na tela de login
3. Preencha:
   - **Nome:** `Admin`
   - **Email:** `admin@palpiteiros.com`
   - **Senha:** `Admin@123` (MUDE DEPOIS!)

4. Faça login com essas credenciais

Agora você precisa marcar esse usuário como admin:

1. Abra o Firebase Console
2. Vá em **Firestore Database → Dados**
3. Clique em **`users`**
4. Procure o documento do admin (com seu UID)
5. Edite o campo **`role`** e mude de `"user"` para `"admin"`
6. Salve

✅ Pronto! Agora você tem acesso ao painel `/admin`

### 8️⃣ Rodando Localmente

```bash
# Instalar dependências (se não fez ainda)
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Acessar em http://localhost:5173
```

## 🧪 Testar o App

### Login de Teste (já criado)
- Email: `teste@palpiteiros.com`
- Senha: `Teste@123`

### Criar Seu Próprio Usuário
1. Clique em "Crie sua conta agora"
2. Preencha nome, email e senha
3. Você será um palpiteiro normal

## 🐛 Troubleshooting

### Erro: "Firebase is not defined"
**Solução:** Verifique se o `.env.local` está preenchido corretamente com as credenciais.

### Erro: "Permission denied" no Firestore
**Solução:** 
1. Firebase Console → Firestore Database
2. Clique em "Regras"
3. Cole:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
4. Clique em "Publicar"

### Página branca ao abrir
**Solução:**
1. Abra o DevTools (F12)
2. Vá em "Console"
3. Procure por mensagens de erro em vermelho
4. Copie o erro e procure a solução

### App muito lento
**Solução:**
1. Clearar cache do navegador (Ctrl+Shift+Delete)
2. Recarregar página (Ctrl+R ou F5)
3. Se problema persistir, reinicie o servidor (`npm run dev`)

## 📱 Testar no Celular

Para testar no seu smartphone na mesma rede WiFi:

```bash
# No terminal, execute:
npm run dev

# Você verá algo como:
# Local: http://localhost:5173
# Network: http://192.168.X.X:5173
```

Copie o endereço "Network" e acesse no celular. ✅

## ✅ Checklist de Setup

- [ ] Criar projeto Firebase
- [ ] Ativar Authentication (Email/Senha)
- [ ] Criar Firestore Database
- [ ] Copiar credenciais Firebase
- [ ] Preencher `.env.local`
- [ ] Instalar dependências (`npm install`)
- [ ] Criar usuário admin
- [ ] Marcar usuário como admin no Firestore
- [ ] Testar login
- [ ] Testar página home (dashboard)
- [ ] Rodar em produção (próxima etapa!)

## 🎓 Próximos Passos

Depois de setup local, veja o arquivo **DEPLOYMENT.md** para colocar seu app em produção (hospedagem gratuita)!

---

**Dúvidas?** Procure por "[sua dúvida] firebase" no Google ou Stack Overflow.

**Erro que não sabe resolver?** Deixe a mensagem de erro bem clara e procure no GitHub Issues ou crie uma discussão.

Boa sorte, palpiteiro! 🇧🇷⚽
