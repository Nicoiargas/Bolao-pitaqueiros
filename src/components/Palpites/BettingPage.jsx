import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, InputNumber, Tag, Alert, Empty, Spin, Space,
  Typography, Row, Col, Segmented, Select, App, Badge,
} from 'antd';
import { TrophyOutlined, LockOutlined, SaveOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getAllPhases, getMatchesByPhase, getBetsByUser,
  placeBet, updateBet,
} from '../../services/gameService';
import { calculatePoints } from '../../services/pointsService';
import FlagImage from '../FlagImage';
import GlobalBet from './GlobalBet';

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

  useEffect(() => { loadPhases(); }, [user]);
  useEffect(() => { if (selectedPhaseId) loadMatches(selectedPhaseId); }, [selectedPhaseId]);

  const isPhaseOpen = (closingDate) => new Date() < toDate(closingDate);

  const loadPhases = async () => {
    try {
      setLoading(true);
      const data = await getAllPhases();
      setPhases(data);
      const open = data.find(p => isPhaseOpen(p.closingDate));
      setSelectedPhaseId(open?.id || data[0]?.id || null);
    } catch {
      message.error('Erro ao carregar fases');
    } finally {
      setLoading(false);
    }
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
          ? { home: existing.homeGoals, away: existing.awayGoals, id: existing.id }
          : { home: null, away: null, id: null };
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
    return cur.home !== ini.home || cur.away !== ini.away;
  }, [bets, initialBets]);

  const dirtyCount = matches.filter(m => isDirty(m.id) && bets[m.id]?.home !== null && bets[m.id]?.away !== null).length;

  const handleSaveAll = async () => {
    const toSave = matches.filter(m => isDirty(m.id));
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
          await updateBet(bet.id, bet.home, bet.away);
        } else {
          const newId = await placeBet(user.uid, match.id, bet.home, bet.away, selectedPhaseId);
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
    setBets(prev => ({ ...prev, [matchId]: { ...prev[matchId], [field]: val } }));
  };

  if (loading && phases.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" tip="Carregando..." />
      </div>
    );
  }

  const unsentCount = matches.filter(m => !initialBets[m.id]?.id).length;

  const availableGroups = [...new Set(matches.map(m => m.group).filter(Boolean))].sort();
  const filteredMatches = groupFilter === 'Todos'
    ? matches
    : matches.filter(m => m.group === groupFilter);

  const currentPhase = phases.find(p => p.id === selectedPhaseId);
  const phaseOpen = currentPhase && isPhaseOpen(currentPhase.closingDate);

  const segmentedOptions = phases.map(p => ({
    label: (
      <Space size={4}>
        {p.name}
        {!isPhaseOpen(p.closingDate) && <LockOutlined style={{ fontSize: 11 }} />}
      </Space>
    ),
    value: p.id,
  }));

  const SaveAllButton = () => (
    <Badge count={dirtyCount} offset={[-4, 4]}>
      <Button
        type="primary"
        icon={<SaveOutlined />}
        size="large"
        loading={savingAll}
        disabled={!phaseOpen || dirtyCount === 0}
        onClick={handleSaveAll}
        style={{ fontWeight: 700, minWidth: 180 }}
      >
        Salvar Todos os Palpites
      </Button>
    </Badge>
  );

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
          {filteredMatches.map((match) => {
            const bet     = bets[match.id] || { home: null, away: null, id: null };
            const finished = match.status === 'finished';
            const canBet  = !finished && phaseOpen;
            const dirty   = isDirty(match.id);

            return (
              <Card
                key={match.id}
                style={{
                  borderRadius: 12,
                  borderColor: dirty ? '#faad14' : undefined,
                  borderWidth: dirty ? 2 : undefined,
                }}
                styles={{ body: { padding: '16px 20px' } }}
              >
                <Row align="middle" gutter={[16, 12]}>
                  {/* Match info */}
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
                        <Text strong style={{ fontSize: 15, color: '#0033A0', display: 'block' }}>
                          <FlagImage name={match.homeTeam} height={16} />{match.homeTeam}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>vs</Text>
                        <Text strong style={{ fontSize: 15, color: '#0033A0', display: 'block' }}>
                          <FlagImage name={match.awayTeam} height={16} />{match.awayTeam}
                        </Text>
                      </div>
                    </div>
                  </Col>

                  {/* Bet inputs */}
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

                    {finished && (() => {
                      const basePoints  = currentPhase?.pointsPerGame ?? 0;
                      const hasBet      = bet.home !== null && bet.away !== null;
                      const betHome     = hasBet ? bet.home  : 0;
                      const betAway     = hasBet ? bet.away  : 0;
                      const pts         = calculatePoints(
                        { homeGoals: betHome,         awayGoals: betAway         },
                        { homeGoals: match.homeGoals, awayGoals: match.awayGoals },
                        basePoints
                      );
                      const isExact   = betHome === match.homeGoals && betAway === match.awayGoals;
                      const isCorrect = pts > 0 && !isExact;

                      return (
                        <div style={{ textAlign: 'center', marginTop: 8 }}>
                          <Space size={4} wrap style={{ justifyContent: 'center' }}>
                            <Tag color="blue">
                              Resultado: {match.homeGoals} × {match.awayGoals}
                            </Tag>
                            <Tag color={isExact ? 'gold' : isCorrect ? 'success' : 'default'}>
                              {hasBet ? 'Seu palpite' : 'Assumido'}: {betHome} × {betAway}
                            </Tag>
                            <Tag color={pts === 0 ? 'default' : 'green'} style={{ fontWeight: 700 }}>
                              {pts === 0 ? '0 pts' : isExact ? `+${pts} pts 🎯` : `+${pts} pt${pts !== 1 ? 's' : ''}`}
                            </Tag>
                          </Space>
                        </div>
                      );
                    })()}
                  </Col>

                  {/* Status / delete */}
                  <Col xs={24} md={6} style={{ textAlign: 'right' }}>
                    {finished ? (
                      <Tag icon={<LockOutlined />} color="default">Encerrado</Tag>
                    ) : !phaseOpen ? (
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
          })}
        </Space>
      )}

      {/* Botão salvar no fim da página */}
      {phaseOpen && filteredMatches.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <SaveAllButton />
        </div>
      )}
    </div>
  );
}

export default BettingPage;
