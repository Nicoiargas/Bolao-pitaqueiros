# 🏆 Sistema de Pontuação - Palpiteiros do Hexa

## 📊 Como Funciona

O sistema de pontuação é **automático**. Quando o admin registra o resultado de um jogo, o sistema calcula automaticamente os pontos de cada palpiteiro.

## ⭐ Regra de Pontuação

### Acertou o **resultado** (vitória/derrota/empate)
✅ Ganha os **pontos da fase**

### Acertou o **placar exato**
🎯 Ganha **3x** os pontos da fase!

### Errou
❌ Ganha **0 pontos**

## 📈 Pontos por Fase

| Fase | Pontos por Jogo | Com Placar Cravado |
|------|-----------------|------------------|
| **Grupos** | 1 ponto | 3 pontos |
| **Pré-Oitavas** | 1,5 ponto | 4,5 pontos |
| **Oitavas de Final** | 3 pontos | 9 pontos |
| **Quartas de Final** | 6 pontos | 18 pontos |
| **Semi Final** | 12 pontos | 36 pontos |
| **Final** | 24 pontos | 72 pontos |

## 📝 Exemplos Práticos

### Exemplo 1: Brasil 2 x 1 Argentina (Oitavas)

**Placar real:** 2 x 1

#### Palpiteiro A: Chutou 2 x 1 ✅
- Acertou resultado: Vitória Brasil
- Acertou placar: 2 x 1
- **Pontos:** 3 x 3 = **9 pontos** 🎯

#### Palpiteiro B: Chutou 1 x 0 ✅
- Acertou resultado: Vitória Brasil
- Errou placar: 1 x 0
- **Pontos:** 3 pontos

#### Palpiteiro C: Chutou 0 x 1 ❌
- Errou resultado: Chutou vitória Argentina
- **Pontos:** 0 pontos

#### Palpiteiro D: Chutou 2 x 2 ❌
- Errou resultado: Chutou empate
- **Pontos:** 0 pontos

### Exemplo 2: França x Marrocos - Fase de Grupos

**Placar real:** 2 x 0 França

#### Palpiteiro A: Chutou 2 x 0 ✅ 🎯
- Acertou resultado E placar
- **Pontos:** 1 x 3 = **3 pontos**

#### Palpiteiro B: Chutou 3 x 1 ✅
- Acertou resultado: Vitória França
- Errou placar
- **Pontos:** 1 ponto

#### Palpiteiro C: Chutou 1 x 1 ❌
- Errou resultado: Chutou empate
- **Pontos:** 0 pontos

### Exemplo 3: Final - Brasil x Argentina

**Placar real:** 3 x 2 Brasil

#### Palpiteiro A: Chutou 3 x 2 ✅ 🎯
- Acertou resultado E placar
- **Pontos:** 24 x 3 = **72 pontos** 👑

#### Palpiteiro B: Chutou 2 x 1 ✅
- Acertou resultado: Vitória Brasil
- Errou placar
- **Pontos:** 24 pontos

## 🧮 Algoritmo de Cálculo

```
Se (palpite.homeGoals == resultado.homeGoals AND palpite.awayGoals == resultado.awayGoals):
    pontos = pontosBaseDaFase * 3  // Placar cravado!
Senão se (resultado(palpite) == resultado(jogo)):
    pontos = pontosBaseDaFase      // Resultado correto
Senão:
    pontos = 0                     // Errou tudo
```

Onde `resultado()` verifica:
- Vitória home: homeGoals > awayGoals
- Vitória away: homeGoals < awayGoals
- Empate: homeGoals == awayGoals

## 🏅 Ranking

O ranking é **automático** e **em tempo real**:

1. Todos os pontos são **somados**
2. Palpiteiros são **ordenados** do maior para menor
3. Atualiza automaticamente quando resultado é registrado

## 🔒 Regras Importantes

### ⏰ Horário de Fechamento
- Após a hora de fechamento, **não é mais possível fazer palpites**
- Admin pode editar data/hora da fase

### 🔄 Editar Palpites
- Só é possível editar **antes** do jogo começar
- Após o jogo começar, palpite fica **travado**

### 📊 Ver Pontos
- Seu total está no **Dashboard**
- Ranking geral está em **Ranking**
- Detalhes por fase não têm interface (é possível em admin)

## 🎯 Estratégias para Ganhar

1. **Fases finais valem muito mais** (Semi = 12 pts, Final = 72 pts)
   → Invista mais tempo nas finais

2. **Cravar placar é difícil mas vale muito**
   → 72 pontos na final é quase impossível para todos

3. **Não deixar passar prazo**
   → Configure alarmes para 30min antes de fechamento

4. **Estudar as equipes**
   → Conhecer força dos times ajuda na previsão

## 📱 Visualizar Pontos

### Dashboard
- Total de pontos acumulados
- Status de cada fase

### Ranking
- Posição geral
- Quantos pontos você tem vs competidores

### Palpites
- Seus palpites atuais
- Já tem resultado? Vê os pontos ganhos

## 🔐 Admin - Registrar Resultado

Como admin, você faz isso em **Admin → Jogos**:

1. Seleciona a fase
2. Encontra o match
3. Clica em **Salvar** com o resultado
4. Sistema calcula pontos automaticamente ✅

## 🐛 Correção de Erros

Se registrou resultado errado:

1. Vá em **Admin → Jogos**
2. Encontre o match
3. Atualize para o resultado correto
4. Sistema recalcula pontos automaticamente

⚠️ Atenção: Palpiteiros verão mudança de pontos!

## 💡 Dicas Implementação

O código de cálculo está em: `src/services/pointsService.js`

Se quiser mudar pontuação:

```javascript
const POINTS_BY_PHASE = {
  'Grupos': 1,           // Mude aqui
  'Pré-Oitavas': 1.5,
  // ... etc
};

const CORRECT_SCORE_MULTIPLIER = 3;  // Ou mude aqui (placar cravado)
```

Exemplo: Para dar 2 pontos por grupo, mude para `'Grupos': 2`.

## ❓ Perguntas Comuns

**P: Posso cravar placar em qualquer jogo?**
R: Sim! Qualquer jogo de qualquer fase.

**P: Se a fase tem 8 jogos e eu acerto 5 resultados, quanto ganho?**
R: 5 vezes os pontos da fase (sem multiplicador de placar).

**P: Se registrar resultado errado, perde o ponto?**
R: Não! Sistema recalcula quando você corrige.

**P: Ranking atualiza em tempo real?**
R: Sim, a cada novo resultado registrado.

**P: Quem tem mais pontos ganhou?**
R: Sim! Ranking ordena por total de pontos.

---

## 📋 Checklist Pontuação

- [ ] Entendeu resultado vs placar
- [ ] Entendeu multiplicador x3
- [ ] Sabe quanto vale cada fase
- [ ] Fez pelo menos um palpite
- [ ] Viu seu ponto no ranking
- [ ] Entendeu data de fechamento

Agora é com você! 🇧🇷⚽

Boa sorte no bolão! 🍀
