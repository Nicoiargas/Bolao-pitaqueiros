import React, { useState, useEffect } from 'react';
import {
  Tabs, Button, InputNumber, Input, Space, Tag, Typography,
  App, Empty, Spin, Row, Col, Segmented, Card,
} from 'antd';
import { CheckOutlined, LockOutlined, TrophyOutlined, EditOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getAllPhases, getAllMatches, updateMatchResult, updateMatchTeams, recalculateAllPoints,
} from '../../services/gameService';
import FlagImage from '../FlagImage';

const { Text } = Typography;

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'];
const KNOCKOUT_PHASES = ['Round of 32','Oitavas','Quartas','Semis','Final'];

const toDate = (val) => {
  if (!val) return null;
  if (val?.seconds) return new Date(val.seconds * 1000);
  return new Date(val);
};

function MatchManager() {
  const { message } = App.useApp();
  const [loading, setLoading]             = useState(true);
  const [phases, setPhases]               = useState([]);
  const [matchesByPhase, setMatchesByPhase] = useState({});
  const [results, setResults]             = useState({});
  const [teamEdits, setTeamEdits]         = useState({});
  const [editingResults, setEditingResults] = useState(new Set());
  const [activeGroup, setActiveGroup]     = useState('A');
  const [activeKnockout, setActiveKnockout] = useState('Round of 32');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [allPhases, allMatches] = await Promise.all([getAllPhases(), getAllMatches()]);
      setPhases(allPhases);

      const byPhase = {};
      allPhases.forEach(p => { byPhase[p.id] = []; });
      allMatches.forEach(m => { if (byPhase[m.phaseId]) byPhase[m.phaseId].push(m); });
      setMatchesByPhase(byPhase);

      const initial = {};
      allMatches.forEach(m => { initial[m.id] = { home: m.homeGoals ?? 0, away: m.awayGoals ?? 0 }; });
      setResults(initial);
    } catch {
      message.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // ── Resultado ──────────────────────────────────────────────────────────────
  const setResult = (matchId, field, val) =>
    setResults(prev => ({ ...prev, [matchId]: { ...prev[matchId], [field]: val } }));

  const handleSave = async (matchId) => {
    const r = results[matchId];
    if (r.home == null || r.away == null) { message.warning('Preencha ambos os placares'); return; }
    try {
      await updateMatchResult(matchId, parseInt(r.home), parseInt(r.away));
      await recalculateAllPoints();
      message.success('Resultado salvo e pontuação atualizada!');
      loadAll();
    } catch { message.error('Erro ao salvar resultado'); }
  };

  const openResultEdit  = (matchId) => setEditingResults(prev => new Set(prev).add(matchId));
  const cancelResultEdit = (matchId) => setEditingResults(prev => { const s = new Set(prev); s.delete(matchId); return s; });

  const handleSaveAndClose = async (matchId) => {
    await handleSave(matchId);
    cancelResultEdit(matchId);
  };

  // ── Edição de times (mata-mata) ────────────────────────────────────────────
  const openTeamEdit = (m) =>
    setTeamEdits(prev => ({ ...prev, [m.id]: { home: m.homeTeam, away: m.awayTeam } }));

  const cancelTeamEdit = (matchId) =>
    setTeamEdits(prev => { const n = { ...prev }; delete n[matchId]; return n; });

  const setTeamField = (matchId, field, val) =>
    setTeamEdits(prev => ({ ...prev, [matchId]: { ...prev[matchId], [field]: val } }));

  const handleSaveTeams = async (matchId) => {
    const t = teamEdits[matchId];
    if (!t.home.trim() || !t.away.trim()) { message.warning('Preencha os dois nomes'); return; }
    try {
      await updateMatchTeams(matchId, t.home.trim(), t.away.trim());
      message.success('Times atualizados!');
      cancelTeamEdit(matchId);
      loadAll();
    } catch { message.error('Erro ao atualizar times'); }
  };

  // ── Card de jogo ───────────────────────────────────────────────────────────
  const MatchCard = ({ m }) => {
    const isKnockout    = m.group === null;
    const editing       = teamEdits[m.id];
    const editingResult = editingResults.has(m.id);
    const r             = results[m.id] || { home: 0, away: 0 };

    return (
      <Card
        size="small"
        style={{ borderRadius: 10, borderColor: m.status === 'finished' ? '#d9d9d9' : '#91caff' }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <Row align="middle" gutter={[8, 8]}>
          {/* Times */}
          <Col flex="auto">
            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
              {dayjs(toDate(m.date)).format('DD/MM · HH:mm')}
            </Text>

            {isKnockout && editing ? (
              /* Modo edição: dois inputs */
              <Space direction="vertical" size={4} style={{ marginTop: 6 }}>
                <Input
                  size="small"
                  value={editing.home}
                  onChange={e => setTeamField(m.id, 'home', e.target.value)}
                  placeholder="Time da casa"
                  style={{ width: 200 }}
                />
                <Input
                  size="small"
                  value={editing.away}
                  onChange={e => setTeamField(m.id, 'away', e.target.value)}
                  placeholder="Time visitante"
                  style={{ width: 200 }}
                  onPressEnter={() => handleSaveTeams(m.id)}
                />
                <Space size={4}>
                  <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleSaveTeams(m.id)}>
                    Confirmar
                  </Button>
                  <Button size="small" icon={<CloseOutlined />} onClick={() => cancelTeamEdit(m.id)}>
                    Cancelar
                  </Button>
                </Space>
              </Space>
            ) : (
              /* Modo exibição */
              <Space size={4} align="center" style={{ marginTop: 4, flexWrap: 'wrap' }}>
                <div>
                  <Text strong style={{ color: '#0033A0', fontSize: 15 }}>
                    <FlagImage name={m.homeTeam} />{m.homeTeam}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>vs</Text>
                  <Text strong style={{ color: '#0033A0', fontSize: 15 }}>
                    <FlagImage name={m.awayTeam} />{m.awayTeam}
                  </Text>
                </div>
                {isKnockout && m.status !== 'finished' && (
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    type="text"
                    title="Atualizar times"
                    onClick={() => openTeamEdit(m)}
                    style={{ color: '#aaa', marginLeft: 4 }}
                  />
                )}
              </Space>
            )}
          </Col>

          {/* Status */}
          <Col>
            {m.status === 'finished'
              ? <Tag icon={<LockOutlined />} color="default">Encerrado</Tag>
              : <Tag color="processing">Agendado</Tag>}
          </Col>

          {/* Resultado */}
          <Col>
            {m.status === 'finished' && !editingResult ? (
              <Space size={4}>
                <Tag color="blue" style={{ fontSize: 15, padding: '3px 14px', fontWeight: 700 }}>
                  {m.homeGoals} × {m.awayGoals}
                </Tag>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  type="text"
                  title="Editar resultado"
                  onClick={() => openResultEdit(m.id)}
                  style={{ color: '#aaa' }}
                />
              </Space>
            ) : (
              <Space>
                <InputNumber
                  min={0} max={99} value={r.home} controls={false}
                  onChange={v => setResult(m.id, 'home', v)}
                  style={{ width: 52, textAlign: 'center', fontWeight: 700 }}
                />
                <Text strong style={{ color: '#008B46' }}>×</Text>
                <InputNumber
                  min={0} max={99} value={r.away} controls={false}
                  onChange={v => setResult(m.id, 'away', v)}
                  style={{ width: 52, textAlign: 'center', fontWeight: 700 }}
                />
                <Button type="primary" icon={<CheckOutlined />} size="small"
                  onClick={() => editingResult ? handleSaveAndClose(m.id) : handleSave(m.id)}>
                  Salvar
                </Button>
                {editingResult && (
                  <Button size="small" icon={<CloseOutlined />} onClick={() => cancelResultEdit(m.id)}>
                    Cancelar
                  </Button>
                )}
              </Space>
            )}
          </Col>
        </Row>
      </Card>
    );
  };

  const MatchTable = ({ matches }) => {
    if (!matches?.length) return <Empty description="Nenhum jogo nesta fase" style={{ padding: 32 }} />;
    return (
      <Space direction="vertical" style={{ width: '100%' }} size={8}>
        {matches.map(m => <MatchCard key={m.id} m={m} />)}
      </Space>
    );
  };

  // ── Fase de Grupos ─────────────────────────────────────────────────────────
  const gruposPhase   = phases.find(p => p.name === 'Grupos');
  const gruposMatches = gruposPhase ? (matchesByPhase[gruposPhase.id] || []) : [];

  const groupTabItems = GROUPS.map(g => {
    const gMatches = gruposMatches.filter(m => m.group === g);
    const done     = gMatches.filter(m => m.status === 'finished').length;
    return {
      key: g,
      label: (
        <span>
          <Tag color={done === 6 ? 'success' : done > 0 ? 'processing' : 'default'} style={{ margin: 0 }}>{g}</Tag>
          <span style={{ fontSize: 11, color: '#999', marginLeft: 4 }}>{done}/6</span>
        </span>
      ),
      children: (
        <div style={{ paddingTop: 12 }}>
          <Row gutter={8} style={{ marginBottom: 14 }}>
            {[...new Set(gMatches.flatMap(m => [m.homeTeam, m.awayTeam]))].map(t => (
              <Col key={t}><Tag color="blue" style={{ marginBottom: 4 }}><FlagImage name={t} height={12} />{t}</Tag></Col>
            ))}
          </Row>
          <MatchTable matches={gMatches} />
        </div>
      ),
    };
  });

  // ── Mata-mata ──────────────────────────────────────────────────────────────
  const knockoutPhaseObj = phases.find(p => p.name === activeKnockout);
  const knockoutMatches  = knockoutPhaseObj ? (matchesByPhase[knockoutPhaseObj.id] || []) : [];

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" tip="Carregando jogos..." /></div>;
  }

  return (
    <div>
      {/* Fase de Grupos */}
      <Card
        style={{ marginBottom: 24, borderRadius: 12 }}
        styles={{ body: { padding: '16px 20px' } }}
        title={
          <Space>
            <Tag color="green" style={{ fontSize: 13, padding: '2px 10px' }}>Fase de Grupos</Tag>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {gruposMatches.filter(m => m.status === 'finished').length} / 72 resultados lançados
            </Text>
          </Space>
        }
      >
        {gruposPhase
          ? <Tabs activeKey={activeGroup} onChange={setActiveGroup} items={groupTabItems} size="small" />
          : <Empty description="Fase de Grupos não encontrada — limpe o localStorage e recarregue" />}
      </Card>

      {/* Mata-mata */}
      <Card
        style={{ borderRadius: 12 }}
        styles={{ body: { padding: '16px 20px' } }}
        title={
          <Space>
            <TrophyOutlined style={{ color: '#FFD500' }} />
            <Tag color="gold" style={{ fontSize: 13, padding: '2px 10px' }}>Mata-mata</Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Clique em ✏️ para definir os times classificados
            </Text>
          </Space>
        }
      >
        <Segmented
          options={KNOCKOUT_PHASES}
          value={activeKnockout}
          onChange={setActiveKnockout}
          style={{ marginBottom: 16 }}
        />
        <MatchTable matches={knockoutMatches} />
      </Card>
    </div>
  );
}

export default MatchManager;
