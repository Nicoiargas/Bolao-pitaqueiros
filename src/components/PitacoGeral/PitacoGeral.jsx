import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, Tag, Spin, Typography, Empty, Segmented, Space } from 'antd';
import { TrophyOutlined, LockOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { getAllMatches, getAllPhases, getAllBets, getRanking } from '../../services/gameService';
import { calculatePoints } from '../../services/pointsService';
import FlagImage from '../FlagImage';

dayjs.locale('pt-br');

const { Title, Text } = Typography;

const GREEN = '#008B46';
const BLUE  = '#0033A0';
const GOLD  = '#FFD500';
const KNOCKOUT_PHASES = ['Round of 32', 'Oitavas', 'Quartas', 'Semis', 'Final'];
const PHASE_ORDER = ['Grupos', 'Round of 32', 'Oitavas', 'Quartas', 'Semis', 'Final'];

const toDate = (val) => {
  if (!val) return null;
  if (val?.seconds) return new Date(val.seconds * 1000);
  return new Date(val);
};

function isMatchVisible(match, phase) {
  if (!phase) return false;
  if (KNOCKOUT_PHASES.includes(phase.name)) {
    const deadline = new Date(toDate(match.date));
    deadline.setHours(12, 0, 0, 0);
    return new Date() >= deadline;
  }
  return new Date() >= toDate(phase.closingDate);
}

function fmtPlacar(hg, ag) {
  return hg != null && ag != null ? `${hg} × ${ag}` : '— × —';
}

function UserBetChip({ user, bet, match, basePoints }) {
  const finished = match.status === 'finished';
  const hasBet = bet && bet.homeGoals != null && bet.awayGoals != null;

  let pts = 0;
  let isExact = false;
  let isPenBonus = false;

  if (finished && hasBet) {
    pts = calculatePoints(
      { homeGoals: bet.homeGoals, awayGoals: bet.awayGoals, penaltyWinner: bet.penaltyWinner ?? null },
      { homeGoals: match.homeGoals, awayGoals: match.awayGoals, penaltyWinner: match.penaltyWinner ?? null },
      basePoints,
    );
    isExact = bet.homeGoals === match.homeGoals && bet.awayGoals === match.awayGoals;
    isPenBonus = isExact && bet.homeGoals === bet.awayGoals
      && bet.penaltyWinner && match.penaltyWinner
      && bet.penaltyWinner === match.penaltyWinner;
  }

  const borderColor = isExact ? '#d4a017' : pts > 0 ? GREEN : '#e0e0e0';
  const bg          = isExact ? '#fffbe6' : pts > 0 ? 'rgba(0,139,70,0.05)' : hasBet ? 'white' : '#fafafa';
  const scoreColor  = isExact ? '#8B6914' : pts > 0 ? GREEN : '#333';

  const words = (user.displayName || user.email || '').split(' ');
  const raw = words.length > 1 && words[0].length <= 2 ? words[1] : words[0];
  const firstName = raw.charAt(0).toUpperCase() + raw.slice(1);

  return (
    <div style={{
      border: `2px solid ${borderColor}`,
      borderRadius: 10,
      padding: '8px 12px',
      background: bg,
      minWidth: 92,
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
    }}>
      <Text style={{ fontSize: 11, color: '#888', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90 }}>
        {firstName}
      </Text>

      {hasBet ? (
        <>
          <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 800, color: scoreColor, lineHeight: 1.3 }}>
            {fmtPlacar(bet.homeGoals, bet.awayGoals)}
            {isExact && <span style={{ marginLeft: 3 }}>🎯</span>}
          </span>
          {bet.penaltyWinner && (
            <Text style={{ fontSize: 10, color: '#aaa' }}>pên: {bet.penaltyWinner}</Text>
          )}
          {finished && (
            pts > 0 ? (
              <Tag color="success" style={{ margin: 0, fontSize: 11, fontWeight: 700, lineHeight: '18px' }}>
                +{pts % 1 === 0 ? pts : pts.toFixed(1)}{isPenBonus ? ' 🥅' : ''}
              </Tag>
            ) : (
              <Tag color="default" style={{ margin: 0, fontSize: 11, lineHeight: '18px' }}>0 pts</Tag>
            )
          )}
        </>
      ) : (
        <Text style={{ fontSize: 12, color: '#ccc', fontStyle: 'italic' }}>sem pitaco</Text>
      )}
    </div>
  );
}

function MatchCard({ match, phase, betsByMatch, users }) {
  const matchBets  = betsByMatch[match.id] ?? [];
  const basePoints = phase?.pointsPerGame ?? 0;
  const finished   = match.status === 'finished';

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      if (!finished) return (a.displayName || '').localeCompare(b.displayName || '');
      const betA = matchBets.find(bm => bm.userId === a.uid);
      const betB = matchBets.find(bm => bm.userId === b.uid);
      const calc = (bet) => bet
        ? calculatePoints(
            { homeGoals: bet.homeGoals, awayGoals: bet.awayGoals, penaltyWinner: bet.penaltyWinner ?? null },
            { homeGoals: match.homeGoals, awayGoals: match.awayGoals, penaltyWinner: match.penaltyWinner ?? null },
            basePoints,
          )
        : 0;
      return calc(betB) - calc(betA) || (a.displayName || '').localeCompare(b.displayName || '');
    });
  }, [users, matchBets, finished]);

  return (
    <Card
      style={{ borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', border: '1px solid #ebebeb' }}
      styles={{ body: { padding: 0 } }}
    >
      {/* Cabeçalho do jogo */}
      <div style={{ padding: '14px 20px 12px', background: 'linear-gradient(135deg, #f5f8ff 0%, #eef3ff 100%)', borderBottom: '1px solid #e8edf8' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(toDate(match.date)).format('DD/MM · HH:mm')}
          </Text>
          {finished ? (
            <Tag icon={<LockOutlined />} color="default" style={{ margin: 0, fontSize: 11 }}>Encerrado</Tag>
          ) : (
            <Tag icon={<ClockCircleOutlined />} color="processing" style={{ margin: 0, fontSize: 11 }}>Aguardando resultado</Tag>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          {/* Time da casa */}
          <div style={{ textAlign: 'center', flex: 1 }}>
            <FlagImage name={match.homeTeam} height={28} />
            <Text strong style={{ fontSize: 13, color: BLUE, display: 'block', marginTop: 4, lineHeight: 1.2 }}>
              {match.homeTeam}
            </Text>
          </div>

          {/* Placar */}
          <div style={{ textAlign: 'center', minWidth: 90 }}>
            <div style={{
              fontSize: 20,
              fontWeight: 900,
              fontFamily: 'monospace',
              color: finished ? '#111' : '#bbb',
              background: 'white',
              borderRadius: 8,
              padding: '6px 10px',
              border: `2px solid ${finished ? '#d0d8f0' : '#e8e8e8'}`,
              boxShadow: finished ? '0 1px 4px rgba(0,51,160,0.10)' : 'none',
              display: 'inline-block',
              minWidth: 80,
            }}>
              {finished ? fmtPlacar(match.homeGoals, match.awayGoals) : '? × ?'}
            </div>
            {match.penaltyWinner && (
              <Text style={{ fontSize: 10, color: '#888', display: 'block', marginTop: 2 }}>
                pên: {match.penaltyWinner}
              </Text>
            )}
          </div>

          {/* Time visitante */}
          <div style={{ textAlign: 'center', flex: 1 }}>
            <FlagImage name={match.awayTeam} height={28} />
            <Text strong style={{ fontSize: 13, color: BLUE, display: 'block', marginTop: 4, lineHeight: 1.2 }}>
              {match.awayTeam}
            </Text>
          </div>
        </div>
      </div>

      {/* Grid de pitacos */}
      <div style={{ padding: '12px 20px 16px' }}>
        <Text style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 10 }}>
          Pitacos
        </Text>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {sortedUsers.map(user => (
            <UserBetChip
              key={user.uid}
              user={user}
              bet={matchBets.find(b => b.userId === user.uid)}
              match={match}
              basePoints={basePoints}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

function PitacoGeral() {
  const [loading, setLoading]           = useState(true);
  const [matches, setMatches]           = useState([]);
  const [phases, setPhases]             = useState([]);
  const [betsByMatch, setBetsByMatch]   = useState({});
  const [users, setUsers]               = useState([]);
  const [phaseMap, setPhaseMap]         = useState({});
  const [selectedPhaseId, setSelectedPhaseId] = useState(null);
  const scrollRef      = useRef(null);
  const hasScrolled    = useRef(false);
  const lastAutoPhase  = useRef(null);  // última fase auto-selecionada pelo sistema

  const loadData = (isFirstLoad = false) => {
    return Promise.all([
      getAllMatches(),
      getAllPhases(),
      getAllBets(),
      getRanking(),
    ]).then(([allMatches, allPhases, allBets, allUsers]) => {
      const pm = Object.fromEntries(allPhases.map(p => [p.id, p]));
      setPhaseMap(pm);
      setMatches(allMatches);
      setUsers(allUsers);

      const sorted = [...allPhases].sort((a, b) => {
        const ia = PHASE_ORDER.indexOf(a.name);
        const ib = PHASE_ORDER.indexOf(b.name);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });
      setPhases(sorted);

      const bm = {};
      allBets.forEach(b => {
        if (!bm[b.matchId]) bm[b.matchId] = [];
        bm[b.matchId].push(b);
      });
      setBetsByMatch(bm);

      const phaseById = Object.fromEntries(allPhases.map(p => [p.id, p]));
      const matchesByPhaseId = {};
      allMatches.forEach(m => {
        if (!matchesByPhaseId[m.phaseId]) matchesByPhaseId[m.phaseId] = [];
        matchesByPhaseId[m.phaseId].push(m);
      });

      const withVisible = sorted.filter(p =>
        (matchesByPhaseId[p.id] ?? []).some(m => isMatchVisible(m, phaseById[m.phaseId]))
      );

      const mostRecent = withVisible.length > 0
        ? withVisible[withVisible.length - 1].id
        : sorted[0]?.id ?? null;

      // Avança fase automaticamente no primeiro load ou quando uma fase nova ficar disponível
      if (isFirstLoad || mostRecent !== lastAutoPhase.current) {
        setSelectedPhaseId(mostRecent);
      }
      lastAutoPhase.current = mostRecent;
    }).catch(console.error);
  };

  useEffect(() => {
    loadData(true).finally(() => setLoading(false));

    // Recarrega quando o usuário volta para a aba
    const onVisibility = () => {
      if (document.visibilityState === 'visible') loadData(false);
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Recarrega a cada 2 minutos para detectar jogos que passaram do meio-dia
    const interval = setInterval(() => loadData(false), 2 * 60 * 1000);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(interval);
    };
  }, []);

  const matchesByPhase = useMemo(() => {
    const map = {};
    matches.forEach(m => {
      if (!map[m.phaseId]) map[m.phaseId] = [];
      map[m.phaseId].push(m);
    });
    Object.values(map).forEach(arr => arr.sort((a, b) => new Date(a.date) - new Date(b.date)));
    return map;
  }, [matches]);

  const currentMatches = useMemo(() => {
    const phase = phaseMap[selectedPhaseId];
    return (matchesByPhase[selectedPhaseId] ?? []).filter(m => isMatchVisible(m, phase));
  }, [matchesByPhase, selectedPhaseId, phaseMap]);

  useEffect(() => {
    if (loading || hasScrolled.current) return;
    const today = dayjs().format('YYYY-MM-DD');
    const hasToday = currentMatches.some(m => dayjs(toDate(m.date)).format('YYYY-MM-DD') === today);
    if (hasToday) {
      hasScrolled.current = true;
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    }
  }, [loading, currentMatches]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" tip="Carregando pitacos..." />
      </div>
    );
  }

  const visiblePhases = phases.filter(p =>
    (matchesByPhase[p.id] ?? []).some(m => isMatchVisible(m, p))
  );

  const currentPhase = phaseMap[selectedPhaseId];

  const segmentedOptions = visiblePhases.map(p => ({ label: p.name, value: p.id }));

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(90deg, ${GREEN}, ${BLUE})`,
        borderRadius: 16, padding: '20px 28px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <TrophyOutlined style={{ fontSize: 40, color: GOLD }} />
        <div>
          <Title level={3} style={{ color: 'white', margin: 0 }}>Pitaco Geral</Title>
          <Text style={{ color: 'rgba(255,255,255,0.75)' }}>
            Pitacos de todos após o fechamento das fases
          </Text>
        </div>
      </div>

      {visiblePhases.length === 0 ? (
        <Empty description="Nenhuma fase fechada ainda — os pitacos aparecem aqui após o fechamento." />
      ) : (
        <>
          {/* Seletor de fase */}
          {visiblePhases.length > 1 && (
            <div style={{ marginBottom: 20 }}>
              <Segmented
                options={segmentedOptions}
                value={selectedPhaseId}
                onChange={setSelectedPhaseId}
                style={{ background: 'white' }}
              />
            </div>
          )}

          {/* Cards dos jogos */}
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            {currentMatches.length === 0 ? (
              <Empty description="Nenhum pitaco disponível ainda para esta fase." />
            ) : (() => {
              const today = dayjs().format('YYYY-MM-DD');
              let firstTodayFound = false;
              return currentMatches.map(match => {
                const isToday = dayjs(toDate(match.date)).format('YYYY-MM-DD') === today;
                const isScrollTarget = isToday && !firstTodayFound;
                if (isScrollTarget) firstTodayFound = true;
                return (
                  <div
                    key={match.id}
                    ref={isScrollTarget ? scrollRef : null}
                    style={isScrollTarget ? { scrollMarginTop: 80 } : undefined}
                  >
                    <MatchCard
                      match={match}
                      phase={currentPhase}
                      betsByMatch={betsByMatch}
                      users={users}
                    />
                  </div>
                );
              });
            })()}
          </Space>
        </>
      )}
    </div>
  );
}

export default PitacoGeral;
