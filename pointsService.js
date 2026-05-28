// src/services/pointsService.js

const POINTS_BY_PHASE = {
  'Grupos': 1,
  'Pré-Oitavas': 1.5,
  'Oitavas': 3,
  'Quartas': 6,
  'Semis': 12,
  'Final': 24
};

const CORRECT_SCORE_MULTIPLIER = 3;

/**
 * Calcula pontos de um palpite
 * @param {Object} userBet - Palpite do usuário {homeGoals, awayGoals}
 * @param {Object} actualMatch - Resultado real {homeGoals, awayGoals}
 * @param {String} phaseName - Nome da fase
 * @returns {Number} Pontos obtidos
 */
export function calculatePoints(userBet, actualMatch, phaseName) {
  if (!userBet || !actualMatch) return 0;
  
  const basePoints = POINTS_BY_PHASE[phaseName] || 0;
  
  // Verificar se acertou o resultado
  if (userBet.homeGoals === actualMatch.homeGoals && 
      userBet.awayGoals === actualMatch.awayGoals) {
    // Cravou o placar - triplica
    return basePoints * CORRECT_SCORE_MULTIPLIER;
  }
  
  // Verificar resultado (vitória/derrota/empate)
  const userResult = getResult(userBet);
  const actualResult = getResult(actualMatch);
  
  if (userResult === actualResult) {
    // Acertou resultado mas não o placar
    return basePoints;
  }
  
  // Errou
  return 0;
}

/**
 * Determina resultado: 1 (home), 0 (empate), -1 (away)
 */
function getResult(match) {
  if (match.homeGoals > match.awayGoals) return 1;
  if (match.homeGoals < match.awayGoals) return -1;
  return 0;
}

/**
 * Retorna pontos totais do palpiteiro
 */
export function getTotalPoints(userBets, allMatches) {
  let total = 0;
  
  userBets.forEach(bet => {
    const match = allMatches.find(m => m.id === bet.matchId);
    if (match && match.status === 'finished') {
      total += calculatePoints(
        { homeGoals: bet.homeGoals, awayGoals: bet.awayGoals },
        { homeGoals: match.homeGoals, awayGoals: match.awayGoals },
        match.phaseName
      );
    }
  });
  
  return total;
}

export const PHASES = Object.keys(POINTS_BY_PHASE);
export default { calculatePoints, getTotalPoints, PHASES };
