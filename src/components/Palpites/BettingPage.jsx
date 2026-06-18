import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card, Button, InputNumber, Tag, Alert, Empty, Spin, Space,
  Typography, Row, Col, Segmented, Select, App, Badge,
} from 'antd';
import { TrophyOutlined, LockOutlined, SaveOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getAllPhases, getAllMatches, getMatchesByPhase, getBetsByUser,
  placeBet, updateBet,
} from '../../services/gameService';
import { calculatePoints } from '../../services/pointsService';
import FlagImage from '../FlagImage';
import GlobalBet from './GlobalBet';

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

function computeGroupStandings(matches) {
  const ts = {};
  matches.filter(m => m.status === 'finished' && m.group).forEach(m => {
    [m.homeTeam, m.awayTeam].forEach(t => {
      if (!ts[t]) ts[t] = { team: t, group: m.group, pts: 0, gf: 0, ga: 0 };
    });
    const hg = m.homeGoals ?? 0, ag = m.awayGoals ?? 0;
    ts[m.homeTeam].gf += hg; ts[m.homeTeam].ga += ag;
    ts[m.awayTeam].gf += ag; ts[m.awayTeam].ga += hg;
    if (hg > ag)      ts[m.homeTeam].pts += 3;
    else if (hg < ag) ts[m.awayTeam].pts += 3;
    else { ts[m.homeTeam].pts += 1; ts[m.awayTeam].pts += 1; }
  });
  const byGroup = {};
  Object.values(ts).forEach(t => {
    if (!byGroup[t.group]) byGroup[t.group] = [];
    byGroup[t.group].push(t);
  });
  Object.keys(byGroup).forEach(g => {
    byGroup[g].sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      const gdA = a.gf - a.ga, gdB = b.gf - b.ga;
      if (gdB !== gdA) return gdB - gdA;
      return b.gf - a.gf;
    });
  });
  return byGroup;
}

function buildPositionLabels(standings) {
  const thirds = [];
  const labels = {};
  GROUPS.forEach(g => {
    const group = standings[g] || [];
    if (group[0]) labels[group[0].team] = { text: `1º Grupo ${g}`, color: 'blue' };
    if (group[1]) labels[group[1].team] = { text: `2º Grupo ${g}`, color: 'green' };
    if (group[2]) thirds.push({ ...group[2], groupLetter: g });
  });
  thirds.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gdA = a.gf - a.ga, gdB = b.gf - b.ga;
    if (gdB !== gdA) return gdB - gdA;
    return b.gf - a.gf;
  });
  thirds.slice(0, 8).forEach(t => { labels[t.team] = { text: `3º Grupo ${t.groupLetter}`, color: 'gold' }; });
  return labels;
}

const { Title, Text } = Typography;

const toDate = (val) => {
  if (!val) return null;
  if (val?.seconds) return new Date(val.seconds * 1000);
  return new Date(val);
};

function BettingPage({ user }) {
  const { message, modal } = App.useApp();
  const [phases, setPhases]               = useState([]);
  const [selectedPhaseId, setSelectedPhaseId] = useState(null);
  const [matches, setMatches]             = useState([]);
  const [bets, setBets]                   = useState({});
  const [initialBets, setInitialBets]     = useState({});
  const [loading, setLoading]             = useState(true);
  const [savingAll, setSavingAll]         = useState(false);
  const [groupFilter, setGroupFilter]     = useState('Todos');
  const [positionLabels, setPositionLabels] = useState({});
  const scrollRef = useRef(null);

  useEffect(() => { loadPhases(); }, [user]);
  useEffect(() => { if (selectedPhaseId) loadMatches(selectedPhaseId); }, [selectedPhaseId]);
  useEffect(() => { if (phases.length > 0) loadPositionLabels(phases); }, [phases]);

  useEffect(() => {
    if (loading || !matches.length) return;
    const today = dayjs().format('YYYY-MM-DD');
    const hasToday = matches.some(m => dayjs(toDate(m.date)).format('YYYY-MM-DD') === today);
    if (hasToday) {
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    }
  }, [matches, loading]);

  const isPhaseOpen = (closingDate) => new Date() < toDate(closingDate);

  const isMatchOpen = (match, phase) => {
    if (!phase) return false;
    return new Date() < toDate(phase.closingDate);
  };

  const isPhaseAnyOpen = (p) => isPhaseOpen(p.closingDate);

  const loadPhases = async () => {
    try {
      setLoading(true);
      const [data, allMatches] = await Promise.all([getAllPhases(), getAllMatches()]);
      const sorted = [...data].sort((a, b) => new Date(toDate(a.closingDate)) - new Date(toDate(b.closingDate)));
      setPhases(sorted);

      // Prioridade 1: fase que tem jogos hoje → abre lá e rola até o primeiro
      const today = dayjs().format('YYYY-MM-DD');
      const todayMatch = allMatches.find(m => dayjs(toDate(m.date)).format('YYYY-MM-DD') === today);
      if (todayMatch) {
        setSelectedPhaseId(todayMatch.phaseId);
        return;
      }

      // Prioridade 2: última fase fechada (fase vigente de referência)
      const now = new Date();
      const closed = sorted.filter(p => toDate(p.closingDate) <= now);
      const lastClosed = closed[closed.length - 1];
      const firstOpen = sorted.find(p => isPhaseAnyOpen(p));
      const vigent = lastClosed ?? firstOpen ?? sorted[sorted.length - 1];
      setSelectedPhaseId(vigent?.id ?? null);
    } catch {
      message.error('Erro ao carregar fases');
    } finally {
      setLoading(false);
    }
  };

  const loadPositionLabels = async (allPhases) => {
    const gruposPhase = allPhases.find(p => p.name === 'Grupos');
    if (!gruposPhase) return;
    try {
      const groupMatches = await getMatchesByPhase(gruposPhase.id);
      const standings = computeGroupStandings(groupMatches);
      setPositionLabels(buildPositionLabels(standings));
    } catch { /* falha silenciosa — labels são informação complementar */ }
  };

  const loadMatches = async (phaseId) => {
    try {
      setLoading(true);
      const [matchData, userBets] = await Promise.all([
        getMatchesByPhase(phaseId),
        getBetsByUser(user.uid),
      ]);
      setMatches(matchData);
      const betsMap = {};
      matchData.forEach(m => {
        const existing = userBets.find(b => b.matchId === m.id);
        betsMap[m.id] = existing
          ? { home: existing.homeGoals, away: existing.awayGoals, id: existing.id, penaltyWinner: existing.penaltyWinner ?? null }
          : { home: null, away: null, id: null, penaltyWinner: null };
      });
      setBets(betsMap);
      setInitialBets(betsMap);
    } catch {
      message.error('Erro ao carregar jogos');
    } finally {
      setLoading(false);
    }
  };

  const isDirty = useCallback((matchId) => {
    const cur = bets[matchId];
    const ini = initialBets[matchId];
    if (!cur || !ini) return false;
    return cur.home !== ini.home || cur.away !== ini.away || cur.penaltyWinner !== ini.penaltyWinner;
  }, [bets, initialBets]);

  const dirtyCount = matches.filter(m => isDirty(m.id) && bets[m.id]?.home !== null && bets[m.id]?.away !== null).length;

  const handleSaveAll = async () => {
    const toSave = matches.filter(m => isDirty(m.id) && isMatchOpen(m, currentPhase));
    const incomplete = toSave.filter(m => bets[m.id]?.home === null || bets[m.id]?.away === null);
    const complete   = toSave.filter(m => bets[m.id]?.home !== null && bets[m.id]?.away !== null);

    if (complete.length === 0) {
      message.info('Nenhuma alteração para salvar');
      return;
    }

    setSavingAll(true);
    try {
      const updatedBets = { ...bets };
      for (const match of complete) {
        const bet = bets[match.id];
        if (bet.id) {
          await updateBet(bet.id, bet.home, bet.away, bet.penaltyWinner ?? null);
        } else {
          const newId = await placeBet(user.uid, match.id, bet.home, bet.away, selectedPhaseId, bet.penaltyWinner ?? null);
          updatedBets[match.id] = { ...bet, id: newId };
        }
      }
      setBets(updatedBets);
      setInitialBets(updatedBets);
      message.success(`${complete.length} palpite${complete.length !== 1 ? 's' : ''} salvos!`);
    } catch {
      message.error('Erro ao salvar palpites');
    } finally {
      setSavingAll(false);
    }
  };

  const handleEdit = (matchId) => {
    setBets(prev => ({ ...prev, [matchId]: { ...prev[matchId], home: null, away: null } }));
  };

  const handleChange = (matchId, field, val) => {
    setBets(prev => {
      const updated = { ...prev[matchId], [field]: val };
      if (field === 'home' || field === 'away') {
        const newHome = field === 'home' ? val : updated.home;
        const newAway = field === 'away' ? val : updated.away;
        if (newHome === null || newAway === null || newHome !== newAway) updated.penaltyWinner = null;
      }
      return { ...prev, [matchId]: updated };
    });
  };

  if (loading && phases.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" tip="Carregando..." />
      </div>
    );
  }

  const availableGroups = [...new Set(matches.map(m => m.group).filter(Boolean))].sort();
  const filteredMatches = groupFilter === 'Todos'
    ? matches
    : matches.filter(m => m.group === groupFilter);

  const currentPhase = phases.find(p => p.id === selectedPhaseId);

  const unsentCount = matches.filter(m => !initialBets[m.id]?.id && isMatchOpen(m, currentPhase)).length;

  // Para Grupos: aberta se algum jogo visível ainda aceita palpites
  const phaseOpen = currentPhase && (
    currentPhase.name === 'Grupos'
      ? filteredMatches.some(m => m.status !== 'finished' && isMatchOpen(m, currentPhase))
      : isPhaseOpen(currentPhase.closingDate)
  );

  // dirtyCount considera apenas jogos com rodada ainda aberta
  const openDirtyCount = filteredMatches.filter(m =>
    isDirty(m.id) && bets[m.id]?.home !== null && bets[m.id]?.away !== null && isMatchOpen(m, currentPhase)
  ).length;

  const segmentedOptions = phases.map(p => ({
    label: (
      <Space size={4}>
        {p.name}
        {!isPhaseAnyOpen(p) && <LockOutlined style={{ fontSize: 11 }} />}
      </Space>
    ),
    value: p.id,
  }));

  const SaveAllButton = () => (
    <Badge count={openDirtyCount} offset={[-4, 4]}>
      <Button
        type="primary"
        icon={<SaveOutlined />}
        size="large"
        loading={savingAll}
        disabled={!phaseOpen || openDirtyCount === 0}
        onClick={handleSaveAll}
        style={{ fontWeight: 700, minWidth: 180 }}
      >
        Salvar Todos os Palpites
      </Button>
    </Badge>
  );

  const renderMatchCard = (match) => {
    const bet     = bets[match.id] || { home: null, away: null, id: null };
    const finished = match.status === 'finished';
    const canBet  = !finished && isMatchOpen(match, currentPhase);
    const dirty   = isDirty(match.id);
    return (
      <Card
        style={{
          borderRadius: 12,
          borderColor: dirty ? '#faad14' : undefined,
          borderWidth: dirty ? 2 : undefined,
        }}
        styles={{ body: { padding: '16px 20px' } }}
      >
        <Row align="middle" gutter={[16, 12]}>
          <Col xs={24} md={8}>
            <div>
              <Space size={6}>
                {match.group && <Tag color="blue" style={{ fontSize: 11 }}>Grupo {match.group}</Tag>}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {dayjs(toDate(match.date)).format('DD/MM · HH:mm')}
                </Text>
                {dirty && <Tag color="warning" style={{ fontSize: 11 }}>Não salvo</Tag>}
              </Space>
              <div style={{ marginTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text strong style={{ fontSize: 15, color: '#0033A0' }}>
                    <FlagImage name={match.homeTeam} height={16} />{match.homeTeam}
                  </Text>
                  {!match.group && positionLabels[match.homeTeam] && (
                    <Tag color={positionLabels[match.homeTeam].color}
                      style={{ fontSize: 10, margin: 0, padding: '0 5px', lineHeight: '18px' }}>
                      {positionLabels[match.homeTeam].text}
                    </Tag>
                  )}
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>vs</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text strong style={{ fontSize: 15, color: '#0033A0' }}>
                    <FlagImage name={match.awayTeam} height={16} />{match.awayTeam}
                  </Text>
                  {!match.group && positionLabels[match.awayTeam] && (
                    <Tag color={positionLabels[match.awayTeam].color}
                      style={{ fontSize: 10, margin: 0, padding: '0 5px', lineHeight: '18px' }}>
                      {positionLabels[match.awayTeam].text}
                    </Tag>
                  )}
                </div>
              </div>
            </div>
          </Col>

          <Col xs={24} md={10}>
            <Space align="center" style={{ justifyContent: 'center', width: '100%' }}>
              <InputNumber
                className="bet-input"
                min={0} max={99}
                value={bet.home}
                onChange={(val) => handleChange(match.id, 'home', val)}
                disabled={!canBet}
                controls={false}
                placeholder="0"
                style={{ width: 72, textAlign: 'center' }}
              />
              <Text strong style={{ fontSize: 22, color: '#008B46' }}>×</Text>
              <InputNumber
                className="bet-input"
                min={0} max={99}
                value={bet.away}
                onChange={(val) => handleChange(match.id, 'away', val)}
                disabled={!canBet}
                controls={false}
                placeholder="0"
                style={{ width: 72, textAlign: 'center' }}
              />
            </Space>

            {!match.group && canBet && bet.home !== null && bet.away !== null && bet.home === bet.away && (
              <div style={{ textAlign: 'center', marginTop: 10 }}>
                <Text style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6 }}>
                  🥅 Vencedor nos pênaltis (bônus ×2):
                </Text>
                <Space>
                  <Button
                    size="small"
                    type={bet.penaltyWinner === match.homeTeam ? 'primary' : 'default'}
                    style={bet.penaltyWinner === match.homeTeam ? { background: '#008B46', borderColor: '#008B46' } : {}}
                    onClick={() => handleChange(match.id, 'penaltyWinner',
                      bet.penaltyWinner === match.homeTeam ? null : match.homeTeam)}
                  >
                    {match.homeTeam}
                  </Button>
                  <Button
                    size="small"
                    type={bet.penaltyWinner === match.awayTeam ? 'primary' : 'default'}
                    style={bet.penaltyWinner === match.awayTeam ? { background: '#008B46', borderColor: '#008B46' } : {}}
                    onClick={() => handleChange(match.id, 'penaltyWinner',
                      bet.penaltyWinner === match.awayTeam ? null : match.awayTeam)}
                  >
                    {match.awayTeam}
                  </Button>
                </Space>
              </div>
            )}

            {finished && (() => {
              const basePoints  = currentPhase?.pointsPerGame ?? 0;
              const hasBet      = bet.home !== null && bet.away !== null;
              const betHome     = hasBet ? bet.home : 0;
              const betAway     = hasBet ? bet.away : 0;
              const pts         = calculatePoints(
                { homeGoals: betHome, awayGoals: betAway, penaltyWinner: bet.penaltyWinner ?? null },
                { homeGoals: match.homeGoals, awayGoals: match.awayGoals, penaltyWinner: match.penaltyWinner ?? null },
                basePoints
              );
              const isExact   = betHome === match.homeGoals && betAway === match.awayGoals;
              const isCorrect = pts > 0 && !isExact;
              const hasPenaltyBonus = isExact && betHome === betAway &&
                bet.penaltyWinner && match.penaltyWinner &&
                bet.penaltyWinner === match.penaltyWinner;
              return (
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <Space size={4} wrap style={{ justifyContent: 'center' }}>
                    <Tag color="blue">
                      Resultado: {match.homeGoals} × {match.awayGoals}
                      {match.penaltyWinner && ` (pen. ${match.penaltyWinner})`}
                    </Tag>
                    <Tag color={isExact ? 'gold' : isCorrect ? 'success' : 'default'}>
                      {hasBet ? 'Seu palpite' : 'Assumido'}: {betHome} × {betAway}
                      {bet.penaltyWinner && ` (pen. ${bet.penaltyWinner})`}
                    </Tag>
                    <Tag color={pts === 0 ? 'default' : 'green'} style={{ fontWeight: 700 }}>
                      {pts === 0 ? '0 pts' : isExact ? `+${pts} pts ${hasPenaltyBonus ? '🎯🥅' : '🎯'}` : `+${pts} pt${pts !== 1 ? 's' : ''}`}
                    </Tag>
                  </Space>
                </div>
              );
            })()}
          </Col>

          <Col xs={24} md={6} style={{ textAlign: 'right' }}>
            {finished ? (
              <Tag icon={<LockOutlined />} color="default">Encerrado</Tag>
            ) : !isMatchOpen(match, currentPhase) ? (
              <Tag icon={<LockOutlined />} color="warning">Fase fechada</Tag>
            ) : bet.id ? (
              <Button
                icon={<EditOutlined />}
                size="small"
                onClick={() => handleEdit(match.id)}
              >
                Editar
              </Button>
            ) : null}
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <GlobalBet user={user} />
      {/* Header */}
      <Card
        style={{ marginBottom: 24, background: 'linear-gradient(90deg, #008B46, #0033A0)', border: 'none', borderRadius: 16 }}
        styles={{ body: { padding: '20px 28px' } }}
      >
        <Row align="middle" justify="space-between" gutter={[16, 16]}>
          <Col>
            <Space>
              <TrophyOutlined style={{ fontSize: 36, color: '#FFD500' }} />
              <div>
                <Title level={3} style={{ color: 'white', margin: 0 }}>Seus Palpites</Title>
                <Text style={{ color: 'rgba(255,255,255,0.75)' }}>Escolha a fase e chute os placares!</Text>
              </div>
            </Space>
          </Col>
          {phaseOpen && (
            <Col>
              <SaveAllButton />
            </Col>
          )}
        </Row>
      </Card>

      {/* Phase selector */}
      {phases.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <Segmented
            options={segmentedOptions}
            value={selectedPhaseId}
            onChange={setSelectedPhaseId}
            style={{ background: 'white' }}
          />
        </div>
      )}

      {/* Phase status */}
      {currentPhase && (
        <Alert
          type={phaseOpen ? 'success' : 'error'}
          showIcon
          style={{ marginBottom: 20, borderRadius: 8 }}
          message={phaseOpen ? 'Fase aberta para palpites' : 'Fase fechada'}
          description={
            phaseOpen ? (
              <span>
                Prazo para palpites:{' '}
                <Tag color="red" style={{ fontWeight: 700, fontSize: 13 }}>
                  {dayjs(toDate(currentPhase.closingDate)).format('DD/MM/YYYY [às] HH:mm')}
                </Tag>
                <span style={{ color: '#999', fontSize: 12 }}>
                  ({dayjs(toDate(currentPhase.closingDate)).fromNow()})
                </span>
              </span>
            ) : (
              `Encerrou em ${dayjs(toDate(currentPhase.closingDate)).format('DD/MM/YYYY [às] HH:mm')}`
            )
          }
        />
      )}

      {/* Aviso de jogos sem palpite */}
      {phaseOpen && unsentCount > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8 }}
          message={`Você ainda tem ${unsentCount} jogo${unsentCount !== 1 ? 's' : ''} sem palpite nessa fase`}
        />
      )}

      {/* Group filter */}
      {availableGroups.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Select
            value={groupFilter}
            onChange={v => setGroupFilter(v)}
            style={{ minWidth: 140 }}
            size="middle"
          >
            <Select.Option value="Todos">Todos os grupos</Select.Option>
            {availableGroups.map(g => (
              <Select.Option key={g} value={g}>Grupo {g}</Select.Option>
            ))}
          </Select>
        </div>
      )}

      {/* Matches */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : filteredMatches.length === 0 ? (
        <Empty description="Nenhum jogo nesta fase" />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          {(() => {
            const today = dayjs().format('YYYY-MM-DD');
            let firstTodayFound = false;
            return filteredMatches.map(match => {
              const isToday = dayjs(toDate(match.date)).format('YYYY-MM-DD') === today;
              const isScrollTarget = isToday && !firstTodayFound;
              if (isScrollTarget) firstTodayFound = true;
              return (
                <div key={match.id} ref={isScrollTarget ? scrollRef : null}>
                  {renderMatchCard(match)}
                </div>
              );
            });
          })()}
        </Space>
      )}

      {phaseOpen && filteredMatches.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <SaveAllButton />
        </div>
      )}
    </div>
  );
}

export default BettingPage;
