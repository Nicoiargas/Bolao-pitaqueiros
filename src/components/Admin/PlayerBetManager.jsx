import React, { useState, useEffect, useMemo } from 'react';
import {
  Card, Select, InputNumber, Button, Tag, Space, Typography, App, Spin, Empty, Row, Col,
} from 'antd';
import { SaveOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getAllPhases, getAllMatches, getBetsByUser, getRanking, placeBet, updateBet,
} from '../../services/gameService';
import FlagImage from '../FlagImage';

const { Text } = Typography;

const toDate = (val) => {
  if (!val) return null;
  if (val?.seconds) return new Date(val.seconds * 1000);
  return new Date(val);
};

function PlayerBetManager() {
  const { message } = App.useApp();
  const [loading, setLoading]             = useState(true);
  const [users, setUsers]                 = useState([]);
  const [phases, setPhases]               = useState([]);
  const [allMatches, setAllMatches]       = useState([]);
  const [selectedUserId, setSelectedUserId]   = useState(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState(null);
  const [edits, setEdits]                 = useState({}); // matchId -> { id, home, away, penaltyWinner }
  const [savingId, setSavingId]           = useState(null);
  const [loadingBets, setLoadingBets]     = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [rankingUsers, allPhases, matches] = await Promise.all([
          getRanking(), getAllPhases(), getAllMatches(),
        ]);
        setUsers(rankingUsers);
        const sortedPhases = [...allPhases].sort(
          (a, b) => new Date(toDate(a.closingDate)) - new Date(toDate(b.closingDate))
        );
        setPhases(sortedPhases);
        setAllMatches(matches);
        if (sortedPhases.length > 0) setSelectedPhaseId(sortedPhases[0].id);
      } catch {
        message.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!selectedUserId) { setEdits({}); return; }
    (async () => {
      setLoadingBets(true);
      try {
        const bets = await getBetsByUser(selectedUserId);
        const map = {};
        bets.forEach(b => {
          map[b.matchId] = { id: b.id, home: b.homeGoals, away: b.awayGoals, penaltyWinner: b.penaltyWinner ?? null };
        });
        setEdits(map);
      } catch {
        message.error('Erro ao carregar palpites do jogador');
      } finally {
        setLoadingBets(false);
      }
    })();
  }, [selectedUserId]); // eslint-disable-line

  const phaseMatches = useMemo(() =>
    allMatches
      .filter(m => m.phaseId === selectedPhaseId)
      .slice()
      .sort((a, b) => toDate(a.date) - toDate(b.date)),
    [allMatches, selectedPhaseId]
  );

  const handleChange = (matchId, field, val) => {
    setEdits(prev => {
      const base = prev[matchId] || { id: null, home: null, away: null, penaltyWinner: null };
      const updated = { ...base, [field]: val };
      if (field === 'home' || field === 'away') {
        const nh = field === 'home' ? val : updated.home;
        const na = field === 'away' ? val : updated.away;
        if (nh === null || na === null || nh !== na) updated.penaltyWinner = null;
      }
      return { ...prev, [matchId]: updated };
    });
  };

  const handleSave = async (match) => {
    const e = edits[match.id];
    if (!e || e.home == null || e.away == null) { message.warning('Preencha os dois placares'); return; }
    setSavingId(match.id);
    try {
      const penaltyWinner = e.home === e.away ? (e.penaltyWinner ?? null) : null;
      if (e.id) {
        await updateBet(e.id, e.home, e.away, penaltyWinner);
        setEdits(prev => ({ ...prev, [match.id]: { ...e, penaltyWinner } }));
      } else {
        const newId = await placeBet(selectedUserId, match.id, e.home, e.away, match.phaseId, penaltyWinner);
        setEdits(prev => ({ ...prev, [match.id]: { ...e, id: newId, penaltyWinner } }));
      }
      message.success('Palpite salvo!');
    } catch {
      message.error('Erro ao salvar palpite');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" tip="Carregando..." /></div>;
  }

  const selectedUser = users.find(u => u.uid === selectedUserId);

  return (
    <div>
      <Space size={16} wrap style={{ marginBottom: 20 }}>
        <Select
          showSearch
          placeholder="Selecione o jogador"
          value={selectedUserId}
          onChange={setSelectedUserId}
          style={{ width: 280 }}
          options={users.map(u => ({ value: u.uid, label: `${u.displayName || u.email} (${u.email})` }))}
          filterOption={(input, opt) => opt.label.toLowerCase().includes(input.toLowerCase())}
        />
        <Select
          placeholder="Selecione a fase"
          value={selectedPhaseId}
          onChange={setSelectedPhaseId}
          style={{ width: 200 }}
          options={phases.map(p => ({ value: p.id, label: p.name }))}
        />
      </Space>

      {!selectedUserId ? (
        <Empty description="Selecione um jogador para lançar ou editar palpites" style={{ padding: 40 }} />
      ) : loadingBets ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
      ) : phaseMatches.length === 0 ? (
        <Empty description="Nenhum jogo nesta fase" style={{ padding: 32 }} />
      ) : (
        <>
          <Space style={{ marginBottom: 12 }}>
            <UserOutlined />
            <Text strong>Lançando palpites para: {selectedUser?.displayName || selectedUser?.email}</Text>
          </Space>
          <Space direction="vertical" style={{ width: '100%' }} size={8}>
            {phaseMatches.map(m => {
              const e = edits[m.id] || { id: null, home: null, away: null, penaltyWinner: null };
              const isKnockout = m.group === null;
              const showPenalty = isKnockout && e.home !== null && e.away !== null && e.home === e.away;
              return (
                <Card
                  key={m.id}
                  size="small"
                  style={{ borderRadius: 10 }}
                  styles={{ body: { padding: '12px 16px' } }}
                >
                  <Row align="middle" gutter={[8, 8]}>
                    <Col flex="auto">
                      <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                        {dayjs(toDate(m.date)).format('DD/MM · HH:mm')}
                      </Text>
                      <Space size={6} align="center" style={{ marginTop: 4 }}>
                        <Text strong style={{ color: '#0033A0' }}>
                          <FlagImage name={m.homeTeam} />{m.homeTeam}
                        </Text>
                        <Text type="secondary">vs</Text>
                        <Text strong style={{ color: '#0033A0' }}>
                          <FlagImage name={m.awayTeam} />{m.awayTeam}
                        </Text>
                      </Space>
                      {m.status === 'finished' && (
                        <div style={{ marginTop: 4 }}>
                          <Tag color="blue" style={{ fontSize: 11 }}>
                            Resultado: {m.homeGoals} × {m.awayGoals}
                          </Tag>
                        </div>
                      )}
                    </Col>

                    <Col>
                      <Space direction="vertical" size={8} align="end">
                        <Space>
                          <InputNumber
                            min={0} max={99} value={e.home} controls={false}
                            placeholder="0"
                            onChange={v => handleChange(m.id, 'home', v)}
                            style={{ width: 52, textAlign: 'center' }}
                          />
                          <Text strong style={{ color: '#008B46' }}>×</Text>
                          <InputNumber
                            min={0} max={99} value={e.away} controls={false}
                            placeholder="0"
                            onChange={v => handleChange(m.id, 'away', v)}
                            style={{ width: 52, textAlign: 'center' }}
                          />
                          <Button
                            type="primary" icon={<SaveOutlined />} size="small"
                            loading={savingId === m.id}
                            onClick={() => handleSave(m)}
                          >
                            {e.id ? 'Atualizar' : 'Lançar'}
                          </Button>
                        </Space>

                        {showPenalty && (
                          <Space size={4} align="center">
                            <Text style={{ fontSize: 12, color: '#666' }}>🥅 Pênaltis:</Text>
                            <Button
                              size="small"
                              type={e.penaltyWinner === m.homeTeam ? 'primary' : 'default'}
                              onClick={() => handleChange(m.id, 'penaltyWinner',
                                e.penaltyWinner === m.homeTeam ? null : m.homeTeam)}
                            >
                              {m.homeTeam}
                            </Button>
                            <Button
                              size="small"
                              type={e.penaltyWinner === m.awayTeam ? 'primary' : 'default'}
                              onClick={() => handleChange(m.id, 'penaltyWinner',
                                e.penaltyWinner === m.awayTeam ? null : m.awayTeam)}
                            >
                              {m.awayTeam}
                            </Button>
                          </Space>
                        )}
                      </Space>
                    </Col>
                  </Row>
                </Card>
              );
            })}
          </Space>
        </>
      )}
    </div>
  );
}

export default PlayerBetManager;
