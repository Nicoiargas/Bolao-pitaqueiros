# 🇧🇷 Palpiteiros do Hexa - App de Bolão da Copa

Um app moderno e responsivo para bolão da Copa do Mundo com sistema de pontuação por fase e autenticação de usuários.

## 🎯 Funcionalidades

- ✅ Autenticação com login/logout (Palpiteiros + Admin)
- ✅ Cadastro de fases do campeonato com datas editáveis
- ✅ Fechamento automático de palpites por data/hora
- ✅ Sistema de pontuação por fase (1pt, 1.5pt, 3pts, 6pts, 12pts, 24pts)
- ✅ Multiplicador x3 para placar cravado
- ✅ Ranking em tempo real
- ✅ Interface mobile-first com design Brasil
- ✅ Responsivo para desktop

## 📋 Estrutura do Projeto

```
palpiteiros-hexa/
├── frontend/                    # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/           # Login/Cadastro
│   │   │   ├── Dashboard/      # Painel principal
│   │   │   ├── Palpites/       # Tela de palpites
│   │   │   ├── Ranking/        # Placar
│   │   │   ├── Admin/          # Painel admin
│   │   │   └── Nav/            # Navegação
│   │   ├── pages/
│   │   ├── services/           # Firebase config
│   │   ├── styles/             # CSS Brasil colors
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
├── firebase/                    # Configuração Firebase
│   ├── firestore.rules
│   └── storage.rules
├── docs/
│   ├── SETUP.md                # Guia de setup
│   ├── DEPLOYMENT.md           # Deploy
│   └── POINTS_SYSTEM.md        # Sistema de pontos
└── .gitignore
```

## 🚀 Tecnologias

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Firebase (Firestore + Authentication)
- **Hospedagem:** Firebase Hosting (GRÁTIS)
- **Banco de Dados:** Firestore (GRÁTIS até 50k leituras/dia)
- **Mobile:** Responsivo com PWA

## 📱 Design Brasil

- Cor Verde: #008B46
- Cor Amarela: #FFD500
- Cor Azul: #0033A0
- Background Branco com acentos

## 🎮 Sistema de Pontuação

```
FASE          | PONTOS BASE | COM PLACAR CRAVADO
Grupos        | 1 ponto     | 3 pontos
Pré-oitavas   | 1,5 ponto   | 4,5 pontos
Oitavas       | 3 pontos    | 9 pontos
Quartas       | 6 pontos    | 18 pontos
Semis         | 12 pontos   | 36 pontos
Final         | 24 pontos   | 72 pontos
```

## ⚙️ Setup Rápido

### 1️⃣ Pré-requisitos
- Node.js 16+
- Conta Google/Gmail (para Firebase)

### 2️⃣ Criar Projeto Firebase

1. Acesse [firebase.google.com](https://firebase.google.com)
2. Clique "Acessar Console" → "Criar Projeto"
3. Nome: "palpiteiros-hexa"
4. Ative Google Analytics (opcional)

### 3️⃣ Ativar Serviços Firebase

**Authentication:**
- Authentication → Sign-in method
- Habilitar: Email/Senha

**Firestore:**
- Cloud Firestore → Criar banco de dados
- Iniciar no modo de teste
- Região: southamerica-east1 (São Paulo)

**Hosting:**
- Hosting → Comece agora

### 4️⃣ Obter Credenciais

No Firebase Console:
- Clique ⚙️ → Configurações do projeto
- Copie a configuração Web
- Cole em `frontend/.env.local`

```
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=palpiteiros-hexa
VITE_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
```

### 5️⃣ Instalar Dependências

```bash
cd frontend
npm install
```

### 6️⃣ Executar Localmente

```bash
npm run dev
```

Acesse: http://localhost:5173

## 📤 Deploy Gratuito (Firebase Hosting)

### 1️⃣ Build do Frontend
```bash
npm run build
```

### 2️⃣ Deploy
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

Seu app estará em: `https://palpiteiros-hexa.web.app`

## 👤 Acessos Padrão

### Admin
- Email: `admin@palpiteiros.com`
- Senha: `Admin@123` (MUDE DEPOIS!)

### Teste
- Email: `teste@palpiteiros.com`
- Senha: `Teste@123`

## 📊 Estrutura do Firestore

```
/users
  /{userId}
    - email
    - displayName
    - role: 'user' | 'admin'
    - createdAt
    - totalPoints

/phases
  /{phaseId}
    - name: 'Grupos', 'Oitavas', etc
    - pointsPerGame: 1, 1.5, 3, 6, 12, 24
    - closingDate: timestamp
    - status: 'open' | 'closed'
    - matches: []

/bets
  /{betId}
    - userId
    - matchId
    - phaseId
    - homeTeamGoals
    - awayTeamGoals
    - timestamp
    - points: 0-72

/matches
  /{matchId}
    - phaseId
    - homeTeam
    - awayTeam
    - homeGoals: number (resultado final)
    - awayGoals: number (resultado final)
    - date
    - status: 'scheduled' | 'finished'
```

## 🔐 Regras de Segurança Firestore

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
    
    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 🛠️ Customizações Importantes

### Editar Fases
- Acesso em: `/admin/phases`
- Editar data/hora de fechamento
- Adicionar matches

### Algoritmo de Pontos
- Arquivo: `frontend/src/services/pointsService.js`
- Função: `calculatePoints(userBet, actualMatch, phasePoints)`

## 🐛 Troubleshooting

**Erro de autenticação?**
- Verifique credenciais Firebase em `.env.local`
- Limpe cache do navegador

**Firestore lento?**
- Índices podem ser necessários
- Firebase cria automaticamente

**Mobile não funciona?**
- Teste em `localhost:5173` via smartphone na mesma rede
- Use `ipconfig getifaddr en0` (Mac) ou `ipconfig` (Windows)

## 📞 Suporte

Para dúvidas sobre Firebase:
- Docs: https://firebase.google.com/docs
- Stack Overflow: tag `firebase`

---

**Desenvolvido com ❤️ para os Palpiteiros do Hexa 🇧🇷**
