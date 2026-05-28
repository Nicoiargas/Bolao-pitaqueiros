# ⚡ GUIA RÁPIDO - COPA 2026 (APENAS MUDANÇAS)

## 📍 O QUE FAZER

Seu projeto já funciona. Para Copa 2026 oficial, só precisa:

### ✏️ Modificar 2 Arquivos

**1. `src/services/pointsService.js`**
- Adicionar: `'Round of 32': 1.5,`
- Adicionar: `'Round of 32',`

**2. `src/services/gameService.js`**
- Adicionar 2 funções no final (copiar de DIFFS_EXATOS.md)

**3. `src/components/Admin/PhaseManager.jsx`**
- Nenhuma alteração

---

## 🚀 COMO FAZER (3 PASSOS)

### Passo 1: pointsService.js
```javascript
// Localizar estas linhas:
const POINTS_BY_PHASE = {
  'Grupos': 1,
  // ADICIONAR AQUI: 'Round of 32': 1.5,
  'Oitavas': 3,
  
// E TAMBÉM adicionar em PHASES:
export const PHASES = [
  'Grupos',
  // ADICIONAR AQUI: 'Round of 32',
  'Oitavas',
```

### Passo 2: gameService.js
Copiar as 2 funções do arquivo `DIFFS_EXATOS.md` e colar no final.

### Passo 3: Testar
```bash
npm run dev
# Abrir Admin → Phases
# Deve aparecer "Round of 32" como opção
```

---

## 📊 MUDANÇA PRINCIPAL

```
Antes: Grupos → Oitavas → Quartas → Semis → Final (5 fases)
Depois: Grupos → Round of 32 → Oitavas → Quartas → Semis → Final (6 fases)
```

---

## 💰 Tabela Pontos Nova

| Fase | Resultado | Com Placar |
|------|-----------|-----------|
| Grupos | 1 | 3 |
| **Round of 32** | **1,5** | **4,5** |
| Oitavas | 3 | 9 |
| Quartas | 6 | 18 |
| Semis | 12 | 36 |
| Final | 24 | 72 |

---

## 📄 DOCUMENTOS LEIA

1. **ALTERACOES_COPA_2026.md** - O que mudou
2. **DIFFS_EXATOS.md** - Código para copiar/colar

---

## ✅ PRONTO!

Aplicou as mudanças? Testou? Funcionou?

Então seu app agora tem **Copa 2026 oficial com Round of 32!** 🎉

Nada mais precisa ser feito! 🚀
