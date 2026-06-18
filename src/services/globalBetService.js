import { supabase } from './supabase';

export const GLOBAL_BET_CLOSING = '2026-06-11T12:00:00-03:00';

export const GLOBAL_BET_POINTS = {
  champion:      20,
  topScorer:     15,
  topAssists:    15,
  mostGoalsTeam: 10,
};

export const TEAMS = [
  'África do Sul', 'Alemanha', 'Arábia Saudita', 'Argentina', 'Argélia',
  'Austrália', 'Áustria', 'Bélgica', 'Bósnia e Herzegovina', 'Brasil',
  'Cabo Verde', 'Canadá', 'Catar', 'Colômbia', 'Coreia do Sul',
  'Costa do Marfim', 'Croácia', 'Curaçao', 'EUA', 'Egito',
  'Equador', 'Escócia', 'Espanha', 'França', 'Gana',
  'Haiti', 'Holanda', 'Inglaterra', 'Iraque', 'Irã',
  'Japão', 'Jordânia', 'Marrocos', 'México', 'Nova Zelândia',
  'Noruega', 'Panamá', 'Paraguai', 'Portugal', 'Rep. Dem. do Congo',
  'Senegal', 'Suécia', 'Suíça', 'Tchéquia', 'Tunísia',
  'Turquia', 'Uruguai', 'Uzbequistão',
].sort();

export async function getGlobalBet(userId) {
  try {
    const { data } = await supabase.from('global_bets').select('*').eq('user_id', userId).maybeSingle();
    return data ?? null;
  } catch { return null; }
}

export async function saveGlobalBet(userId, { topScorer, topAssists, champion, mostGoalsTeam }) {
  const { error } = await supabase.from('global_bets').upsert({
    user_id:        userId,
    top_scorer:     topScorer,
    top_assists:    topAssists,
    champion,
    most_goals_team: mostGoalsTeam,
    timestamp:      new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function getGlobalResults() {
  try {
    const { data } = await supabase.from('config').select('*')
      .in('key', ['global_top_scorer', 'global_top_assists', 'global_champion', 'global_most_goals_team']);
    if (!data?.length) return null;
    const map = Object.fromEntries(data.map(r => [r.key, r.value]));
    return {
      topScorer:     map.global_top_scorer     || null,
      topAssists:    map.global_top_assists    || null,
      champion:      map.global_champion       || null,
      mostGoalsTeam: map.global_most_goals_team || null,
    };
  } catch { return null; }
}

export async function saveGlobalResults({ topScorer, topAssists, champion, mostGoalsTeam }) {
  const { error } = await supabase.from('config').upsert([
    { key: 'global_top_scorer',      value: topScorer },
    { key: 'global_top_assists',     value: topAssists },
    { key: 'global_champion',        value: champion },
    { key: 'global_most_goals_team', value: mostGoalsTeam },
  ]);
  if (error) throw error;
}

export async function getAllGlobalBets() {
  try {
    const { data, error } = await supabase.from('global_bets').select('*');
    if (error) throw error;
    return data;
  } catch { return []; }
}

export function calcGlobalPoints(bet, results) {
  if (!bet || !results) return 0;
  let pts = 0;
  if (results.champion      && bet.champion         === results.champion)      pts += GLOBAL_BET_POINTS.champion;
  if (results.topScorer     && bet.top_scorer        === results.topScorer)     pts += GLOBAL_BET_POINTS.topScorer;
  if (results.topAssists    && bet.top_assists       === results.topAssists)    pts += GLOBAL_BET_POINTS.topAssists;
  if (results.mostGoalsTeam && bet.most_goals_team   === results.mostGoalsTeam) pts += GLOBAL_BET_POINTS.mostGoalsTeam;
  return pts;
}
