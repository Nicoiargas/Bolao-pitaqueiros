import { supabase } from './supabase';
import { getTotalPoints } from './pointsService';
import { getAllGlobalBets, getGlobalResults, calcGlobalPoints } from './globalBetService';

// ── Mappers ──────────────────────────────────────────────────────────────────

const mapPhase = r => r ? ({
  id:            r.id,
  name:          r.name,
  pointsPerGame: r.points_per_game,
  closingDate:   r.closing_date,
  status:        r.status,
  createdAt:     r.created_at,
}) : null;

const mapMatch = r => r ? ({
  id:        r.id,
  phaseId:   r.phase_id,
  homeTeam:  r.home_team,
  awayTeam:  r.away_team,
  group:     r.group_name,
  homeGoals: r.home_goals,
  awayGoals: r.away_goals,
  date:      r.date,
  status:    r.status,
  createdAt: r.created_at,
}) : null;

const mapBet = r => r ? ({
  id:        r.id,
  userId:    r.user_id,
  matchId:   r.match_id,
  phaseId:   r.phase_id,
  homeGoals: r.home_goals,
  awayGoals: r.away_goals,
  timestamp: r.timestamp,
}) : null;

const mapUser = r => r ? ({
  uid:         r.id,
  email:       r.email,
  displayName: r.display_name,
  role:        r.role,
  totalPoints: r.total_points ?? 0,
}) : null;

// ── Fases ────────────────────────────────────────────────────────────────────

export async function createPhase(phaseName, pointsPerGame, closingDate) {
  const { data, error } = await supabase.from('phases').insert({
    name:            phaseName,
    points_per_game: pointsPerGame,
    closing_date:    closingDate instanceof Date ? closingDate.toISOString() : closingDate,
    status:          'open',
  }).select().single();
  if (error) throw error;
  return data.id;
}

export async function getAllPhases() {
  const { data, error } = await supabase.from('phases').select('*');
  if (error) throw error;
  return data.map(mapPhase);
}

export async function updatePhase(phaseId, updates) {
  const row = {};
  if (updates.name          !== undefined) row.name            = updates.name;
  if (updates.pointsPerGame !== undefined) row.points_per_game = updates.pointsPerGame;
  if (updates.closingDate   !== undefined) row.closing_date    = updates.closingDate instanceof Date ? updates.closingDate.toISOString() : updates.closingDate;
  if (updates.status        !== undefined) row.status          = updates.status;
  const { error } = await supabase.from('phases').update(row).eq('id', phaseId);
  if (error) throw error;
}

export async function deletePhase(phaseId) {
  const { error } = await supabase.from('phases').delete().eq('id', phaseId);
  if (error) throw error;
}

// ── Jogos ────────────────────────────────────────────────────────────────────

export async function createMatch(phaseId, homeTeam, awayTeam, matchDate, group = null) {
  const { data, error } = await supabase.from('matches').insert({
    phase_id:   phaseId,
    home_team:  homeTeam,
    away_team:  awayTeam,
    group_name: group,
    date:       matchDate instanceof Date ? matchDate.toISOString() : matchDate,
    status:     'scheduled',
  }).select().single();
  if (error) throw error;
  return data.id;
}

export async function getMatchesByPhase(phaseId) {
  const { data, error } = await supabase
    .from('matches').select('*').eq('phase_id', phaseId).order('date');
  if (error) throw error;
  return data.map(mapMatch);
}

export async function getAllMatches() {
  const { data, error } = await supabase.from('matches').select('*').order('date');
  if (error) throw error;
  return data.map(mapMatch);
}

export async function updateMatchResult(matchId, homeGoals, awayGoals) {
  const { error } = await supabase.from('matches')
    .update({ home_goals: homeGoals, away_goals: awayGoals, status: 'finished' })
    .eq('id', matchId);
  if (error) throw error;
}

export async function updateMatchTeams(matchId, homeTeam, awayTeam) {
  const { error } = await supabase.from('matches')
    .update({ home_team: homeTeam, away_team: awayTeam })
    .eq('id', matchId);
  if (error) throw error;
}

export async function deleteMatch(matchId) {
  const { error } = await supabase.from('matches').delete().eq('id', matchId);
  if (error) throw error;
}

// ── Palpites ─────────────────────────────────────────────────────────────────

export async function placeBet(userId, matchId, homeGoals, awayGoals, phaseId) {
  const { data, error } = await supabase.from('bets').insert({
    user_id:    userId,
    match_id:   matchId,
    phase_id:   phaseId,
    home_goals: homeGoals,
    away_goals: awayGoals,
  }).select('id').single();
  if (error) throw error;
  return data.id;
}

export async function getBetsByUser(userId) {
  const { data, error } = await supabase.from('bets').select('*').eq('user_id', userId);
  if (error) throw error;
  return data.map(mapBet);
}

export async function getAllBets() {
  const { data, error } = await supabase.from('bets').select('*');
  if (error) throw error;
  return data.map(mapBet);
}

export async function updateBet(betId, homeGoals, awayGoals) {
  const { error } = await supabase.from('bets')
    .update({ home_goals: homeGoals, away_goals: awayGoals, timestamp: new Date().toISOString() })
    .eq('id', betId);
  if (error) throw error;
}

export async function deleteBet(betId) {
  const { error } = await supabase.from('bets').delete().eq('id', betId);
  if (error) throw error;
}

// ── Ranking ──────────────────────────────────────────────────────────────────

export async function getRanking() {
  const { data, error } = await supabase
    .from('users').select('*')
    .neq('role', 'admin')
    .order('total_points', { ascending: false });
  if (error) throw error;
  return data.map(mapUser);
}

export async function updateUserPoints(userId, totalPoints) {
  const { error } = await supabase.from('users')
    .update({ total_points: totalPoints }).eq('id', userId);
  if (error) throw error;
}

// ── Recálculo de pontos ──────────────────────────────────────────────────────

export async function recalculateAllPoints() {
  const [allMatches, allPhases, allBets, globalBets, globalResults, { data: usersData, error }] = await Promise.all([
    getAllMatches(),
    getAllPhases(),
    getAllBets(),
    getAllGlobalBets(),
    getGlobalResults(),
    supabase.from('users').select('*').neq('role', 'admin'),
  ]);
  if (error) throw error;

  await Promise.all(usersData.map(row => {
    const userBets    = allBets.filter(b => b.userId === row.id);
    const matchPts    = getTotalPoints(userBets, allMatches, allPhases);
    const globalBet   = globalBets.find(b => b.user_id === row.id);
    const globalPts   = calcGlobalPoints(globalBet, globalResults);
    return supabase.from('users').update({ total_points: matchPts + globalPts }).eq('id', row.id);
  }));
}
