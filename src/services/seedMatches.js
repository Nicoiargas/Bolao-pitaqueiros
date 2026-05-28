import { supabase } from './supabase';

// Bump to force reseed (clears phases, matches, bets and resets user points).
const SEED_VERSION = '2026-v4';

// All times in BRT (UTC-3). Closing = 23:59 on the day before the first match of each phase.
const PHASES_SEED = [
  { name: 'Grupos',      pointsPerGame: 1,   closingDate: '2026-06-10T23:59:00-03:00' },
  { name: 'Round of 32', pointsPerGame: 1.5, closingDate: '2026-06-27T23:59:00-03:00' },
  { name: 'Oitavas',     pointsPerGame: 3,   closingDate: '2026-07-03T23:59:00-03:00' },
  { name: 'Quartas',     pointsPerGame: 6,   closingDate: '2026-07-08T23:59:00-03:00' },
  { name: 'Semis',       pointsPerGame: 12,  closingDate: '2026-07-13T23:59:00-03:00' },
  { name: 'Final',       pointsPerGame: 24,  closingDate: '2026-07-17T23:59:00-03:00' },
];

const GRUPOS_MATCHES = [
  // GRUPO A
  { g:'A', date:'2026-06-11T16:00:00-03:00', home:'México',               away:'África do Sul' },
  { g:'A', date:'2026-06-11T23:00:00-03:00', home:'Coreia do Sul',        away:'Tchéquia' },
  { g:'A', date:'2026-06-18T13:00:00-03:00', home:'Tchéquia',             away:'África do Sul' },
  { g:'A', date:'2026-06-18T22:00:00-03:00', home:'México',               away:'Coreia do Sul' },
  { g:'A', date:'2026-06-24T22:00:00-03:00', home:'Tchéquia',             away:'México' },
  { g:'A', date:'2026-06-24T22:00:00-03:00', home:'África do Sul',        away:'Coreia do Sul' },
  // GRUPO B
  { g:'B', date:'2026-06-12T16:00:00-03:00', home:'Canadá',               away:'Bósnia e Herzegovina' },
  { g:'B', date:'2026-06-13T16:00:00-03:00', home:'Catar',                away:'Suíça' },
  { g:'B', date:'2026-06-18T16:00:00-03:00', home:'Suíça',                away:'Bósnia e Herzegovina' },
  { g:'B', date:'2026-06-18T19:00:00-03:00', home:'Canadá',               away:'Catar' },
  { g:'B', date:'2026-06-24T16:00:00-03:00', home:'Suíça',                away:'Canadá' },
  { g:'B', date:'2026-06-24T16:00:00-03:00', home:'Bósnia e Herzegovina', away:'Catar' },
  // GRUPO C
  { g:'C', date:'2026-06-13T19:00:00-03:00', home:'Brasil',               away:'Marrocos' },
  { g:'C', date:'2026-06-13T22:00:00-03:00', home:'Haiti',                away:'Escócia' },
  { g:'C', date:'2026-06-19T19:00:00-03:00', home:'Escócia',              away:'Marrocos' },
  { g:'C', date:'2026-06-19T21:30:00-03:00', home:'Brasil',               away:'Haiti' },
  { g:'C', date:'2026-06-24T19:00:00-03:00', home:'Escócia',              away:'Brasil' },
  { g:'C', date:'2026-06-24T19:00:00-03:00', home:'Marrocos',             away:'Haiti' },
  // GRUPO D
  { g:'D', date:'2026-06-12T22:00:00-03:00', home:'EUA',                  away:'Paraguai' },
  { g:'D', date:'2026-06-14T01:00:00-03:00', home:'Austrália',            away:'Turquia' },
  { g:'D', date:'2026-06-19T16:00:00-03:00', home:'EUA',                  away:'Austrália' },
  { g:'D', date:'2026-06-20T00:00:00-03:00', home:'Turquia',              away:'Paraguai' },
  { g:'D', date:'2026-06-25T23:00:00-03:00', home:'Turquia',              away:'EUA' },
  { g:'D', date:'2026-06-25T23:00:00-03:00', home:'Paraguai',             away:'Austrália' },
  // GRUPO E
  { g:'E', date:'2026-06-14T14:00:00-03:00', home:'Alemanha',             away:'Curaçao' },
  { g:'E', date:'2026-06-14T20:00:00-03:00', home:'Costa do Marfim',      away:'Equador' },
  { g:'E', date:'2026-06-20T17:00:00-03:00', home:'Alemanha',             away:'Costa do Marfim' },
  { g:'E', date:'2026-06-20T21:00:00-03:00', home:'Equador',              away:'Curaçao' },
  { g:'E', date:'2026-06-25T17:00:00-03:00', home:'Curaçao',              away:'Costa do Marfim' },
  { g:'E', date:'2026-06-25T17:00:00-03:00', home:'Equador',              away:'Alemanha' },
  // GRUPO F
  { g:'F', date:'2026-06-14T17:00:00-03:00', home:'Holanda',              away:'Japão' },
  { g:'F', date:'2026-06-14T23:00:00-03:00', home:'Suécia',               away:'Tunísia' },
  { g:'F', date:'2026-06-20T14:00:00-03:00', home:'Holanda',              away:'Suécia' },
  { g:'F', date:'2026-06-20T23:00:00-03:00', home:'Tunísia',              away:'Japão' },
  { g:'F', date:'2026-06-25T20:00:00-03:00', home:'Japão',                away:'Suécia' },
  { g:'F', date:'2026-06-25T20:00:00-03:00', home:'Tunísia',              away:'Holanda' },
  // GRUPO G
  { g:'G', date:'2026-06-15T16:00:00-03:00', home:'Bélgica',              away:'Egito' },
  { g:'G', date:'2026-06-15T22:00:00-03:00', home:'Irã',                  away:'Nova Zelândia' },
  { g:'G', date:'2026-06-21T16:00:00-03:00', home:'Bélgica',              away:'Irã' },
  { g:'G', date:'2026-06-21T22:00:00-03:00', home:'Nova Zelândia',        away:'Egito' },
  { g:'G', date:'2026-06-27T00:00:00-03:00', home:'Egito',                away:'Irã' },
  { g:'G', date:'2026-06-27T00:00:00-03:00', home:'Nova Zelândia',        away:'Bélgica' },
  // GRUPO H
  { g:'H', date:'2026-06-15T13:00:00-03:00', home:'Espanha',              away:'Cabo Verde' },
  { g:'H', date:'2026-06-15T19:00:00-03:00', home:'Arábia Saudita',       away:'Uruguai' },
  { g:'H', date:'2026-06-21T13:00:00-03:00', home:'Espanha',              away:'Arábia Saudita' },
  { g:'H', date:'2026-06-21T19:00:00-03:00', home:'Uruguai',              away:'Cabo Verde' },
  { g:'H', date:'2026-06-26T21:00:00-03:00', home:'Cabo Verde',           away:'Arábia Saudita' },
  { g:'H', date:'2026-06-26T21:00:00-03:00', home:'Uruguai',              away:'Espanha' },
  // GRUPO I
  { g:'I', date:'2026-06-16T16:00:00-03:00', home:'França',               away:'Senegal' },
  { g:'I', date:'2026-06-16T19:00:00-03:00', home:'Iraque',               away:'Noruega' },
  { g:'I', date:'2026-06-22T18:00:00-03:00', home:'França',               away:'Iraque' },
  { g:'I', date:'2026-06-22T21:00:00-03:00', home:'Noruega',              away:'Senegal' },
  { g:'I', date:'2026-06-26T16:00:00-03:00', home:'Noruega',              away:'França' },
  { g:'I', date:'2026-06-26T16:00:00-03:00', home:'Senegal',              away:'Iraque' },
  // GRUPO J
  { g:'J', date:'2026-06-16T22:00:00-03:00', home:'Argentina',            away:'Argélia' },
  { g:'J', date:'2026-06-17T01:00:00-03:00', home:'Áustria',              away:'Jordânia' },
  { g:'J', date:'2026-06-22T14:00:00-03:00', home:'Argentina',            away:'Áustria' },
  { g:'J', date:'2026-06-23T00:00:00-03:00', home:'Jordânia',             away:'Argélia' },
  { g:'J', date:'2026-06-27T23:00:00-03:00', home:'Jordânia',             away:'Argentina' },
  { g:'J', date:'2026-06-27T23:00:00-03:00', home:'Argélia',              away:'Áustria' },
  // GRUPO K
  { g:'K', date:'2026-06-17T14:00:00-03:00', home:'Portugal',             away:'Rep. Dem. do Congo' },
  { g:'K', date:'2026-06-17T21:00:00-03:00', home:'Uzbequistão',          away:'Colômbia' },
  { g:'K', date:'2026-06-23T14:00:00-03:00', home:'Portugal',             away:'Uzbequistão' },
  { g:'K', date:'2026-06-23T23:00:00-03:00', home:'Colômbia',             away:'Rep. Dem. do Congo' },
  { g:'K', date:'2026-06-27T20:30:00-03:00', home:'Colômbia',             away:'Portugal' },
  { g:'K', date:'2026-06-27T20:30:00-03:00', home:'Rep. Dem. do Congo',   away:'Uzbequistão' },
  // GRUPO L
  { g:'L', date:'2026-06-17T17:00:00-03:00', home:'Inglaterra',           away:'Croácia' },
  { g:'L', date:'2026-06-17T20:00:00-03:00', home:'Gana',                 away:'Panamá' },
  { g:'L', date:'2026-06-23T17:00:00-03:00', home:'Inglaterra',           away:'Gana' },
  { g:'L', date:'2026-06-23T20:00:00-03:00', home:'Panamá',               away:'Croácia' },
  { g:'L', date:'2026-06-27T18:00:00-03:00', home:'Panamá',               away:'Inglaterra' },
  { g:'L', date:'2026-06-27T18:00:00-03:00', home:'Croácia',              away:'Gana' },
];

const R32_MATCHES = [
  { date:'2026-06-28T16:00:00-03:00', home:'2º Grupo A',                  away:'2º Grupo B' },
  { date:'2026-06-29T14:00:00-03:00', home:'1º Grupo E',                  away:'Melhor 3º A/B/C/D/F' },
  { date:'2026-06-29T17:00:00-03:00', home:'1º Grupo F',                  away:'2º Grupo C' },
  { date:'2026-06-29T22:00:00-03:00', home:'1º Grupo C',                  away:'2º Grupo F' },
  { date:'2026-06-30T15:00:00-03:00', home:'1º Grupo I',                  away:'Melhor 3º C/D/F/G/H' },
  { date:'2026-06-30T18:00:00-03:00', home:'2º Grupo E',                  away:'2º Grupo I' },
  { date:'2026-06-30T22:00:00-03:00', home:'1º Grupo A',                  away:'Melhor 3º C/E/F/H/I' },
  { date:'2026-07-01T14:00:00-03:00', home:'1º Grupo L',                  away:'Melhor 3º E/H/I/J/K' },
  { date:'2026-07-01T17:00:00-03:00', home:'1º Grupo D',                  away:'Melhor 3º B/E/F/I/J' },
  { date:'2026-07-01T22:00:00-03:00', home:'1º Grupo G',                  away:'Melhor 3º A/E/H/I/J' },
  { date:'2026-07-02T16:00:00-03:00', home:'2º Grupo K',                  away:'2º Grupo L' },
  { date:'2026-07-02T22:00:00-03:00', home:'1º Grupo H',                  away:'2º Grupo J' },
  { date:'2026-07-03T14:00:00-03:00', home:'1º Grupo B',                  away:'Melhor 3º E/F/G/I/J' },
  { date:'2026-07-03T17:00:00-03:00', home:'1º Grupo J',                  away:'2º Grupo H' },
  { date:'2026-07-03T20:00:00-03:00', home:'1º Grupo K',                  away:'Melhor 3º D/E/I/J/L' },
  { date:'2026-07-03T23:00:00-03:00', home:'2º Grupo D',                  away:'2º Grupo G' },
];

const R16_MATCHES = [
  { date:'2026-07-04T14:00:00-03:00', home:'Venc. Jogo 74', away:'Venc. Jogo 77' },
  { date:'2026-07-04T18:00:00-03:00', home:'Venc. Jogo 73', away:'Venc. Jogo 75' },
  { date:'2026-07-05T16:00:00-03:00', home:'Venc. Jogo 76', away:'Venc. Jogo 78' },
  { date:'2026-07-05T21:00:00-03:00', home:'Venc. Jogo 79', away:'Venc. Jogo 80' },
  { date:'2026-07-06T16:00:00-03:00', home:'Venc. Jogo 83', away:'Venc. Jogo 84' },
  { date:'2026-07-06T21:00:00-03:00', home:'Venc. Jogo 81', away:'Venc. Jogo 82' },
  { date:'2026-07-07T16:00:00-03:00', home:'Venc. Jogo 86', away:'Venc. Jogo 88' },
  { date:'2026-07-07T21:00:00-03:00', home:'Venc. Jogo 85', away:'Venc. Jogo 87' },
];

const QF_MATCHES = [
  { date:'2026-07-09T17:00:00-03:00', home:'Venc. Jogo 89',  away:'Venc. Jogo 90' },
  { date:'2026-07-10T16:00:00-03:00', home:'Venc. Jogo 93',  away:'Venc. Jogo 94' },
  { date:'2026-07-12T18:00:00-03:00', home:'Venc. Jogo 91',  away:'Venc. Jogo 92' },
  { date:'2026-07-12T22:00:00-03:00', home:'Venc. Jogo 95',  away:'Venc. Jogo 96' },
];

const SF_MATCHES = [
  { date:'2026-07-14T17:00:00-03:00', home:'Venc. Jogo 97',  away:'Venc. Jogo 98' },
  { date:'2026-07-15T17:00:00-03:00', home:'Venc. Jogo 99',  away:'Venc. Jogo 100' },
];

const FINAL_MATCHES = [
  { date:'2026-07-18T16:00:00-03:00', home:'Perd. Jogo 101', away:'Perd. Jogo 102' },
  { date:'2026-07-19T16:00:00-03:00', home:'Venc. Jogo 101', away:'Venc. Jogo 102' },
];

export async function seedWorldCup2026() {
  const { data: cfg } = await supabase.from('config').select('value').eq('key', 'seedVersion').single();
  if (cfg?.value === SEED_VERSION) return;

  // Limpa dados existentes (ordem importa por FK)
  await supabase.from('bets').delete().gt('timestamp', '1970-01-01');
  await supabase.from('matches').delete().gt('created_at', '1970-01-01');
  await supabase.from('phases').delete().gt('created_at', '1970-01-01');
  await supabase.from('users').update({ total_points: 0 }).gt('created_at', '1970-01-01');

  const now = new Date().toISOString();

  // Cria fases
  const { data: phases, error: phaseErr } = await supabase.from('phases').insert(
    PHASES_SEED.map(p => ({
      name: p.name, points_per_game: p.pointsPerGame,
      closing_date: p.closingDate, status: 'open', created_at: now,
    }))
  ).select();
  if (phaseErr) throw phaseErr;

  const phaseByName = Object.fromEntries(phases.map(p => [p.name, p.id]));

  const toRow = (phaseId, home, away, date, group) => ({
    phase_id: phaseId, home_team: home, away_team: away,
    group_name: group || null, date,
    status: 'scheduled', home_goals: null, away_goals: null, created_at: now,
  });

  const allMatches = [
    ...GRUPOS_MATCHES.map(m => toRow(phaseByName['Grupos'],      m.home, m.away, m.date, m.g)),
    ...R32_MATCHES.map(m   => toRow(phaseByName['Round of 32'],  m.home, m.away, m.date, null)),
    ...R16_MATCHES.map(m   => toRow(phaseByName['Oitavas'],      m.home, m.away, m.date, null)),
    ...QF_MATCHES.map(m    => toRow(phaseByName['Quartas'],      m.home, m.away, m.date, null)),
    ...SF_MATCHES.map(m    => toRow(phaseByName['Semis'],        m.home, m.away, m.date, null)),
    ...FINAL_MATCHES.map(m => toRow(phaseByName['Final'],        m.home, m.away, m.date, null)),
  ];

  const { error: matchErr } = await supabase.from('matches').insert(allMatches);
  if (matchErr) throw matchErr;

  await supabase.from('config').upsert({ key: 'seedVersion', value: SEED_VERSION });
}
