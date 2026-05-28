# ⚡ Quick Start - Palpiteiros do Hexa com Claude Code

## 🚀 Começa Agora em 5 Minutos!

Este guia te ajuda a rodar o projeto no **Claude Code** (terminal do seu computador).

## 📋 O Que Você Tem

Todos esses arquivos estão prontos:

```
✅ Frontend completo (React + Vite)
✅ Autenticação (Firebase Auth)
✅ Banco de dados (Firestore)
✅ Sistema de pontos automático
✅ Painel admin
✅ Interface mobile-first
✅ Cores Brasil
✅ Tudo pronto para produção
```

## 🔧 Instalação Rápida

### 1️⃣ Abra o Claude Code no seu terminal

```bash
# Navegue até a pasta do projeto
cd caminho/para/palpiteiros-hexa
```

### 2️⃣ Crie a estrutura de pastas

```bash
# Criar pastas
mkdir -p src/components/Auth
mkdir -p src/components/Dashboard
mkdir -p src/components/Palpites
mkdir -p src/components/Ranking
mkdir -p src/components/Admin
mkdir -p src/components/Nav
mkdir -p src/services
mkdir -p src/styles
mkdir -p public
```

### 3️⃣ Copie os arquivos

Copie todos os arquivos `.jsx`, `.js`, `.css` do Claude Code para suas respectivas pastas:

```
src/
  ├── App.jsx                    (colar na raiz src/)
  ├── main.jsx                   (colar na raiz src/)
  ├── components/
  │   ├── Auth/
  │   │   ├── Login.jsx
  │   │   └── Register.jsx
  │   ├── Dashboard/
  │   │   └── Dashboard.jsx
  │   ├── Palpites/
  │   │   └── BettingPage.jsx
  │   ├── Ranking/
  │   │   └── Ranking.jsx
  │   ├── Admin/
  │   │   ├── AdminPanel.jsx
  │   │   ├── PhaseManager.jsx
  │   │   └── MatchManager.jsx
  │   └── Nav/
  │       └── Navigation.jsx
  ├── services/
  │   ├── firebase.js
  │   ├── authService.js
  │   ├── gameService.js
  │   └── pointsService.js
  └── styles/
      └── global.css
```

### 4️⃣ Crie .env.local

```bash
# Copie o .env.example
cp .env.example .env.local

# Abra e preencha com suas credenciais Firebase
nano .env.local
```

### 5️⃣ Instale Dependências

```bash
npm install
```

### 6️⃣ Rode o projeto

```bash
npm run dev
```

Você verá:
```
  VITE v4.4.0  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.X.X:5173/
```

Abra: **http://localhost:5173**

✅ **Pronto!** Seu app está rodando!

## 🔑 Credenciais Padrão

**Login de Teste (já criado):**
- Email: `teste@palpiteiros.com`
- Senha: `Teste@123`

**Criar Admin:**
1. Clique "Crie sua conta agora"
2. Nome: `Admin`, Email: `admin@palpiteiros.com`, Senha: `Admin@123`
3. Faça login
4. Firebase Console → Firestore → users → seu doc → `role`: mude para `admin`

## 📁 Estrutura do Projeto Explicada

```
palpiteiros-hexa/
├── src/
│   ├── App.jsx                 # Componente principal com roteamento
│   ├── main.jsx                # Entrada do React
│   ├── components/             # Componentes React
│   ├── services/               # Lógica do Firebase e pontos
│   └── styles/                 # CSS global
├── public/                      # Arquivos estáticos
├── package.json                # Dependências
├── vite.config.js              # Configuração Vite
├── tailwind.config.js          # Configuração Tailwind
├── .env.example                # Variáveis de ambiente (copie para .env.local)
├── index.html                  # HTML principal
├── README.md                   # Documentação completa
├── SETUP.md                    # Guia de setup
├── DEPLOYMENT.md               # Guia de deploy
└── POINTS_SYSTEM.md            # Sistema de pontos
```

## 🎨 Cores Brasil Disponíveis

```css
--brasil-verde: #008B46;
--brasil-amarelo: #FFD500;
--brasil-azul: #0033A0;
```

Use em qualquer lugar:
```jsx
<div className="bg-brasil-verde text-white">Verde do Brasil</div>
```

## 🔌 Funcionalidades Incluídas

### ✅ Autenticação
- Login com email/senha
- Cadastro de novo usuário
- Logout
- Permanência de sessão

### ✅ Dashboard
- Visão geral das fases
- Data de fechamento de palpites
- Status de cada fase (aberta/fechada)

### ✅ Palpites
- Fazer palpites nos jogos
- Editar palpites (antes do fechamento)
- Deletar palpites
- Ver resultados finais

### ✅ Ranking
- Ranking em tempo real
- Visualizar pontos de todos
- Atualizar ranking manualmente

### ✅ Admin
- Gerenciar fases (criar, editar, deletar)
- Gerenciar matches (criar, registrar resultado)
- Datas de fechamento editáveis
- Sistema de pontuação automático

## 🐛 Comandos Úteis

```bash
# Iniciar desenvolvimento
npm run dev

# Build para produção
npm run build

# Ver o build localmente
npm run preview

# Limpar cache
rm -rf node_modules
npm install

# Resetar banco de dados (deletar tudo)
# Firebase Console → Firestore → banco de dados → limpar todos os dados
```

## 📱 Testar no Celular

```bash
# Seu IP local (Linux/Mac)
ipconfig getifaddr en0

# Seu IP local (Windows)
ipconfig

# Acesse no celular com o IP
# Ex: http://192.168.1.100:5173
```

## ⚠️ Antes de Deploy

```bash
# 1. Testar completamente localmente
npm run dev

# 2. Build de produção
npm run build

# 3. Instalar Firebase CLI
npm install -g firebase-tools

# 4. Login
firebase login

# 5. Inicializar
firebase init hosting

# 6. Deploy!
firebase deploy
```

## 📚 Arquivos Importantes

| Arquivo | O que faz |
|---------|-----------|
| `firebase.js` | Conecta ao Firebase |
| `authService.js` | Login/cadastro/logout |
| `gameService.js` | CRUD de fases, jogos, palpites |
| `pointsService.js` | Calcula pontos automaticamente |
| `App.jsx` | Roteamento e autenticação |
| `global.css` | Estilos globais e cores Brasil |

## 🎓 Customize Facilmente

### Mudar Pontuação?
Edite `src/services/pointsService.js`:
```javascript
const POINTS_BY_PHASE = {
  'Grupos': 1,           // ← mude aqui
  'Pré-Oitavas': 1.5,
  // ... etc
};
```

### Mudar Cores?
Edite `src/styles/global.css`:
```css
:root {
  --brasil-verde: #008B46;    /* seu verde */
  --brasil-amarelo: #FFD500;  /* seu amarelo */
  --brasil-azul: #0033A0;     /* seu azul */
}
```

### Mudar Textos?
Basta editar os componentes (`.jsx`):
```jsx
<h1>Palpiteiros do Hexa</h1> {/* ← mude para "Seu Bolão" */}
```

## 🚀 Próximas Etapas

1. **Setup Firebase** → Leia `SETUP.md`
2. **Rode localmente** → `npm run dev`
3. **Teste tudo** → Faça palpites, edite fases
4. **Deploy** → Leia `DEPLOYMENT.md`
5. **Jogue!** → Convide seus amigos!

## 📞 Precisa de Ajuda?

- **Erro no código?** → Procure a mensagem de erro em Google
- **Erro Firebase?** → Verifique `.env.local`
- **Precisa customizar?** → Edite o arquivo `.jsx` respectivo
- **Não sabe como?** → Procure "react [sua dúvida]" no Google

## 🎉 Sucesso!

Você agora tem um app de bolão **PROFISSIONAL**, **GRÁTIS**, **MOBILE-FIRST** e pronto para produção!

Compartilhe com seus amigos e divirta-se! 🇧🇷⚽

```
╔══════════════════════════════════════════════════════════════╗
║         Palpiteiros do Hexa - Boa Sorte no Bolão! 🍀        ║
║              Ready to predict, ready to win! 🎯              ║
╚══════════════════════════════════════════════════════════════╝
```
