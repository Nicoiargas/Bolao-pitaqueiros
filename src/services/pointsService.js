const CORRECT_SCORE_MULTIPLIER = 3;

export const PHASES = ['Grupos', 'Round of 32', 'Oitavas', 'Quartas', 'Semis', 'Final'];

// basePoints vem de phase.pointsPerGame para não duplicar a fonte da verdade
export function calculatePoints(userBet, actualMatch, basePoints) {
  if (!userBet || !actualMatch || basePoints == null) return 0;

  const betResult    = getResult(userBet.homeGoals,   userBet.awayGoals);
  const matchResult  = getResult(actualMatch.homeGoals, actualMatch.awayGoals);

  if (
    userBet.homeGoals === actualMatch.homeGoals &&
    userBet.awayGoals === actualMatch.awayGoals
  ) {
    return basePoints * CORRECT_SCORE_MULTIPLIER;
  }

  if (betResult === matchResult) {
    return basePoints;
  }

  return 0;
}

function getResult(home, away) {
  if (home > away) return 1;
  if (home < away) return -1;
  return 0;
}

export function getTotalPoints(userBets, allMatches, allPhases) {
  let total = 0;
  allMatches.filter(m => m.status === 'finished').forEach(match => {
    const phase      = allPhases.find(p => p.id === match.phaseId);
    const basePoints = phase?.pointsPerGame ?? 0;
    const bet        = userBets.find(b => b.matchId === match.id);
    // No bet → assume 0×0
    const betGoals   = bet
      ? { homeGoals: bet.homeGoals, awayGoals: bet.awayGoals }
      : { homeGoals: 0,             awayGoals: 0             };
    total += calculatePoints(betGoals, { homeGoals: match.homeGoals, awayGoals: match.awayGoals }, basePoints);
  });
  return total;
}
