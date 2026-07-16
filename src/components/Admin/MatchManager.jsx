import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Tabs, Button, InputNumber, Select, Space, Tag, Typography,
  App, Empty, Spin, Row, Col, Segmented, Card, Collapse, DatePicker,
} from 'antd';
import {
  CheckOutlined, LockOutlined, TrophyOutlined, EditOutlined,
  CloseOutlined, ThunderboltOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getAllPhases, getAllMatches, updateMatchResult, updateMatchTeams, recalculateAllPoints,
  updateMatchClosingTime, updateMatchDate,
} from '../../services/gameService';
import { brtDayjsToIso, isoToBrtDayjs, formatBrt } from '../../services/brtTime';
import FlagImage from '../FlagImage';

const { Text } = Typography;

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'];
const KNOCKOUT_PHASES = ['Round of 32','Oitavas','Quartas','Semis','Final'];

const toDate = (val) => {
  if (!val) return null;
  if (val?.seconds) return new Date(val.seconds * 1000);
  return new Date(val);
};

function computeGroupStandings(matches) {
  const teamStats = {};
  matches.filter(m => m.status === 'finished' && m.group).forEach(m => {
    [m.homeTeam, m.awayTeam].forEach(t => {
      if (!teamStats[t]) teamStats[t] = { team: t, group: m.group, pts: 0, gf: 0, ga: 0, played: 0 };
    });
    const hg = m.homeGoals ?? 0, ag = m.awayGoals ?? 0;
    teamStats[m.homeTeam].gf += hg; teamStats[m.homeTeam].ga += ag; teamStats[m.homeTeam].played++;
    teamStats[m.awayTeam].gf += ag; teamStats[m.awayTeam].ga += hg; teamStats[m.awayTeam].played++;
    if (hg > ag)      teamStats[m.homeTeam].pts += 3;
    else if (hg < ag) teamStats[m.awayTeam].pts += 3;
    else              { teamStats[m.homeTeam].pts += 1; teamStats[m.awayTeam].pts += 1; }
  });
  const byGroup = {};
  Object.values(teamStats).forEach(t => {
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

function buildClassifiedData(standings) {
  const firstByGroup = {}, secondByGroup = {}, thirds = [];
  GROUPS.forEach(g => {
    const group = standings[g] || [];
    if (group[0]) firstByGroup[g]  = group[0].team;
    if (group[1]) secondByGroup[g] = group[1].team;
    if (group[2]) thirds.push({ ...group[2], groupLetter: g });
  });
  thirds.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gdA = a.gf - a.ga, gdB = b.gf - b.ga;
    if (gdB !== gdA) return gdB - gdA;
    return b.gf - a.gf;
  });
  return { firstByGroup, secondByGroup, rankedThirds: thirds.slice(0, 8) };
}

// ── MatchCard — componente no nível do módulo para evitar remount a cada render ──
// (definir dentro do MatchManager causava scroll jump ao editar placar)
function MatchCard({
  m,
  result,
  teamEdit,
  isEditingResult,
  allTeams,
  positionLabels,
  onSetResult,
  onSave,
  onSaveAndClose,
  onOpenResultEdit,
  onCancelResultEdit,
  onOpenTeamEdit,
  onCancelTeamEdit,
  onSetTeamField,
  onSaveTeams,
  deadlineEdit,
  onOpenDeadlineEdit,
  onCancelDeadlineEdit,
  onSetDeadlineValue,
  onSaveDeadline,
  onClearDeadline,
  dateEdit,
  onOpenDateEdit,
  onCancelDateEdit,
  onSetDateValue,
  onSaveDate,
}) {
  const isKnockout = m.group === null;
  const r = result || { home: 0, away: 0 };
  const teamSelectOptions = useMemo(() => allTeams.map(t => ({ value: t, label: t })), [allTeams]);

  return (
    <Card
      size="small"
      style={{ borderRadius: 10, borderColor: m.status === 'finished' ? '#d9d9d9' : '#91caff' }}
      styles={{ body: { padding: '12px 16px' } }}
    >
      <Row align="middle" gutter={[8, 8]}>
        {/* Times */}
        <Col flex="auto">
          {dateEdit !== undefined ? (
            <Space size={4} align="center" wrap>
              <DatePicker
                showTime={{ format: 'HH:mm' }}
                format="DD/MM HH:mm"
                value={dateEdit}
                onChange={(val) => onSetDateValue(m.id, val)}
                size="small"
                placeholder="Data e hora do jogo"
                style={{ width: 165 }}
              />
              <Button size="small" type="primary" icon={<CheckOutlined />}
                onClick={() => onSaveDate(m.id)}>
                OK
              </Button>
              <Button size="small" icon={<CloseOutlined />}
                onClick={() => onCancelDateEdit(m.id)} />
            </Space>
          ) : (
            <Space size={4} align="center">
              <Text type="secondary" style={{ fontSize: 11 }}>
                {dayjs(toDate(m.date)).format('DD/MM · HH:mm')}
              </Text>
              <Button size="small" type="text" icon={<EditOutlined />}
                title="Editar data/hora do jogo" onClick={() => onOpenDateEdit(m)}
                style={{ color: '#aaa', padding: '0 2px', height: 18 }}
              />
            </Space>
          )}

          {isKnockout && teamEdit ? (
            <Space direction="vertical" size={4} style={{ marginTop: 6 }}>
              <Select
                showSearch size="small"
                value={teamEdit.home || undefined}
                onChange={v => onSetTeamField(m.id, 'home', v)}
                placeholder="Time da casa" style={{ width: 220 }}
                options={teamSelectOptions}
                filterOption={(input, opt) => opt.value.toLowerCase().includes(input.toLowerCase())}
              />
              <Select
                showSearch size="small"
                value={teamEdit.away || undefined}
                onChange={v => onSetTeamField(m.id, 'away', v)}
                placeholder="Time visitante" style={{ width: 220 }}
                options={teamSelectOptions}
                filterOption={(input, opt) => opt.value.toLowerCase().includes(input.toLowerCase())}
              />
              <Space size={4}>
                <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => onSaveTeams(m.id)}>
                  Confirmar
                </Button>
                <Button size="small" icon={<CloseOutlined />} onClick={() => onCancelTeamEdit(m.id)}>
                  Cancelar
                </Button>
              </Space>
            </Space>
          ) : (
            <Space size={4} align="center" style={{ marginTop: 4, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <Text strong style={{ color: '#0033A0', fontSize: 15 }}>
                    <FlagImage name={m.homeTeam} />{m.homeTeam}
                  </Text>
                  {isKnockout && positionLabels[m.homeTeam] && (
                    <Tag color={positionLabels[m.homeTeam].color} style={{ fontSize: 10, margin: 0, padding: '0 5px', lineHeight: '18px' }}>
                      {positionLabels[m.homeTeam].text}
                    </Tag>
                  )}
                </div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>vs</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <Text strong style={{ color: '#0033A0', fontSize: 15 }}>
                    <FlagImage name={m.awayTeam} />{m.awayTeam}
                  </Text>
                  {isKnockout && positionLabels[m.awayTeam] && (
                    <Tag color={positionLabels[m.awayTeam].color} style={{ fontSize: 10, margin: 0, padding: '0 5px', lineHeight: '18px' }}>
                      {positionLabels[m.awayTeam].text}
                    </Tag>
                  )}
                </div>
              </div>
              {isKnockout && m.status !== 'finished' && (
                <Button size="small" icon={<EditOutlined />} type="text"
                  title="Atualizar times" onClick={() => onOpenTeamEdit(m)}
                  style={{ color: '#aaa', marginLeft: 4 }}
                />
              )}
            </Space>
          )}

          {/* Prazo de fechamento — apenas mata-mata não finalizado */}
          {isKnockout && m.status !== 'finished' && (
            <div style={{ marginTop: 8 }}>
              {deadlineEdit !== undefined ? (
                <Space size={4} align="center" wrap>
                  <DatePicker
                    showTime={{ format: 'HH:mm' }}
                    format="DD/MM HH:mm"
                    value={deadlineEdit}
                    onChange={(val) => onSetDeadlineValue(m.id, val)}
                    size="small"
                    placeholder="Data e hora de fechamento"
                    style={{ width: 165 }}
                  />
                  <Button size="small" type="primary" icon={<CheckOutlined />}
                    onClick={() => onSaveDeadline(m.id)}>
                    OK
                  </Button>
                  <Button size="small" icon={<CloseOutlined />}
                    onClick={() => onCancelDeadlineEdit(m.id)} />
                  {m.closingTime && (
                    <Button size="small" danger onClick={() => onClearDeadline(m.id)}>
                      Remover prazo
                    </Button>
                  )}
                </Space>
              ) : (
                <Space size={4} align="center">
                  {m.closingTime
                    ? <Tag color="purple" style={{ fontSize: 10, margin: 0 }}>⏰ {formatBrt(m.closingTime, 'DD/MM HH:mm')} (BRT)</Tag>
                    : <Tag style={{ fontSize: 10, margin: 0, color: '#aaa', borderColor: '#d9d9d9' }}>⏰ 12:00 padrão</Tag>}
                  <Button
                    size="small" type="text"
                    icon={<ClockCircleOutlined />}
                    title="Alterar prazo de fechamento"
                    onClick={() => onOpenDeadlineEdit(m)}
                    style={{ color: '#aaa', padding: '0 2px' }}
                  />
                </Space>
              )}
            </div>
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
          {m.status === 'finished' && !isEditingResult ? (
            <Space size={4} direction="vertical" align="end">
              <Space size={4}>
                <Tag color="blue" style={{ fontSize: 15, padding: '3px 14px', fontWeight: 700 }}>
                  {m.homeGoals} × {m.awayGoals}
                </Tag>
                <Button size="small" icon={<EditOutlined />} type="text"
                  title="Editar resultado" onClick={() => onOpenResultEdit(m.id)}
                  style={{ color: '#aaa' }}
                />
              </Space>
              {isKnockout && m.homeGoals === m.awayGoals && m.penaltyWinner && (
                <Tag color="purple" style={{ fontSize: 11 }}>🥅 Pen. {m.penaltyWinner}</Tag>
              )}
            </Space>
          ) : (
            <Space direction="vertical" size={8}>
              <Space>
                <InputNumber
                  min={0} max={99} value={r.home} controls={false}
                  onChange={v => onSetResult(m.id, 'home', v)}
                  style={{ width: 52, textAlign: 'center', fontWeight: 700 }}
                />
                <Text strong style={{ color: '#008B46' }}>×</Text>
                <InputNumber
                  min={0} max={99} value={r.away} controls={false}
                  onChange={v => onSetResult(m.id, 'away', v)}
                  style={{ width: 52, textAlign: 'center', fontWeight: 700 }}
                />
                <Button type="primary" icon={<CheckOutlined />} size="small"
                  onClick={() => isEditingResult ? onSaveAndClose(m.id) : onSave(m.id)}
                >
                  Salvar
                </Button>
                {isEditingResult && (
                  <Button size="small" icon={<CloseOutlined />} onClick={() => onCancelResultEdit(m.id)}>
                    Cancelar
                  </Button>
                )}
              </Space>
              {isKnockout && r.home !== null && r.away !== null && r.home === r.away && (
                <Space size={4} align="center">
                  <Text style={{ fontSize: 12, color: '#666' }}>🥅 Pênaltis:</Text>
                  <Button
                    size="small"
                    type={r.penaltyWinner === m.homeTeam ? 'primary' : 'default'}
                    style={r.penaltyWinner === m.homeTeam ? { background: '#531dab', borderColor: '#531dab' } : {}}
                    onClick={() => onSetResult(m.id, 'penaltyWinner',
                      r.penaltyWinner === m.homeTeam ? null : m.homeTeam)}
                  >
                    {m.homeTeam}
                  </Button>
                  <Button
                    size="small"
                    type={r.penaltyWinner === m.awayTeam ? 'primary' : 'default'}
                    style={r.penaltyWinner === m.awayTeam ? { background: '#531dab', borderColor: '#531dab' } : {}}
                    onClick={() => onSetResult(m.id, 'penaltyWinner',
                      r.penaltyWinner === m.awayTeam ? null : m.awayTeam)}
                  >
                    {m.awayTeam}
                  </Button>
                </Space>
              )}
            </Space>
          )}
        </Col>
      </Row>
    </Card>
  );
}

function MatchTable({ matches, cardProps }) {
  if (!matches?.length) return <Empty description="Nenhum jogo nesta fase" style={{ padding: 32 }} />;
  return (
    <Space direction="vertical" style={{ width: '100%' }} size={8}>
      {matches.map(m => (
        <MatchCard
          key={m.id}
          m={m}
          result={cardProps.results[m.id]}
          teamEdit={cardProps.teamEdits[m.id]}
          isEditingResult={cardProps.editingResults.has(m.id)}
          allTeams={cardProps.allTeams}
          positionLabels={cardProps.positionLabels}
          onSetResult={cardProps.onSetResult}
          onSave={cardProps.onSave}
          onSaveAndClose={cardProps.onSaveAndClose}
          onOpenResultEdit={cardProps.onOpenResultEdit}
          onCancelResultEdit={cardProps.onCancelResultEdit}
          onOpenTeamEdit={cardProps.onOpenTeamEdit}
          onCancelTeamEdit={cardProps.onCancelTeamEdit}
          onSetTeamField={cardProps.onSetTeamField}
          onSaveTeams={cardProps.onSaveTeams}
          deadlineEdit={cardProps.deadlineEdits[m.id]}
          onOpenDeadlineEdit={cardProps.onOpenDeadlineEdit}
          onCancelDeadlineEdit={cardProps.onCancelDeadlineEdit}
          onSetDeadlineValue={cardProps.onSetDeadlineValue}
          onSaveDeadline={cardProps.onSaveDeadline}
          onClearDeadline={cardProps.onClearDeadline}
          dateEdit={cardProps.dateEdits[m.id]}
          onOpenDateEdit={cardProps.onOpenDateEdit}
          onCancelDateEdit={cardProps.onCancelDateEdit}
          onSetDateValue={cardProps.onSetDateValue}
          onSaveDate={cardProps.onSaveDate}
        />
      ))}
    </Space>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

function MatchManager() {
  const { message } = App.useApp();
  const [loading, setLoading]               = useState(true);
  const [phases, setPhases]                 = useState([]);
  const [matchesByPhase, setMatchesByPhase] = useState({});
  const [results, setResults]               = useState({});
  const [teamEdits, setTeamEdits]           = useState({});
  const [editingResults, setEditingResults] = useState(new Set());
  const [deadlineEdits, setDeadlineEdits]   = useState({});
  const [dateEdits, setDateEdits]           = useState({});
  const [activeGroup, setActiveGroup]       = useState('A');
  const [activeKnockout, setActiveKnockout] = useState('Round of 32');
  const [autoFilling, setAutoFilling]       = useState(false);

  // Refs para acessar estado atual dentro de useCallback sem stale closure
  const resultsRef       = useRef(results);
  const teamEditsRef     = useRef(teamEdits);
  const deadlineEditsRef = useRef(deadlineEdits);
  const dateEditsRef     = useRef(dateEdits);
  useEffect(() => { resultsRef.current       = results;       }, [results]);
  useEffect(() => { teamEditsRef.current     = teamEdits;     }, [teamEdits]);
  useEffect(() => { deadlineEditsRef.current = deadlineEdits; }, [deadlineEdits]);
  useEffect(() => { dateEditsRef.current     = dateEdits;     }, [dateEdits]);

  // silentRefresh: atualiza dados sem setar loading — preserva scroll e foco
  const silentRefresh = useCallback(async () => {
    try {
      const [allPhases, allMatches] = await Promise.all([getAllPhases(), getAllMatches()]);
      setPhases(allPhases);
      const byPhase = {};
      allPhases.forEach(p => { byPhase[p.id] = []; });
      allMatches.forEach(m => { if (byPhase[m.phaseId]) byPhase[m.phaseId].push(m); });
      setMatchesByPhase(byPhase);
      const updated = {};
      allMatches.forEach(m => { updated[m.id] = { home: m.homeGoals ?? 0, away: m.awayGoals ?? 0, penaltyWinner: m.penaltyWinner ?? null }; });
      setResults(updated);
    } catch { message.error('Erro ao recarregar dados'); }
  }, []); // eslint-disable-line

  const silentRefreshRef = useRef(silentRefresh);
  useEffect(() => { silentRefreshRef.current = silentRefresh; }, [silentRefresh]);

  useEffect(() => {
    // Carga inicial com spinner
    setLoading(true);
    silentRefresh().finally(() => setLoading(false));
  }, []); // eslint-disable-line

  // ── Handlers estáveis com useCallback ─────────────────────────────────────
  const onSetResult = useCallback((matchId, field, val) =>
    setResults(prev => ({ ...prev, [matchId]: { ...prev[matchId], [field]: val } })), []);

  const onOpenResultEdit   = useCallback((matchId) => setEditingResults(prev => new Set(prev).add(matchId)), []);
  const onCancelResultEdit = useCallback((matchId) => setEditingResults(prev => { const s = new Set(prev); s.delete(matchId); return s; }), []);

  const onOpenTeamEdit  = useCallback((m) => setTeamEdits(prev => ({ ...prev, [m.id]: { home: m.homeTeam, away: m.awayTeam } })), []);
  const onCancelTeamEdit = useCallback((matchId) => setTeamEdits(prev => { const n = { ...prev }; delete n[matchId]; return n; }), []);
  const onSetTeamField  = useCallback((matchId, field, val) =>
    setTeamEdits(prev => ({ ...prev, [matchId]: { ...prev[matchId], [field]: val } })), []);

  const onSave = useCallback(async (matchId) => {
    const r = resultsRef.current[matchId];
    if (!r || r.home == null || r.away == null) { message.warning('Preencha ambos os placares'); return; }
    const penaltyWinner = (r.home != null && r.away != null && r.home === r.away) ? (r.penaltyWinner ?? null) : null;
    try {
      await updateMatchResult(matchId, parseInt(r.home), parseInt(r.away), penaltyWinner);
      await recalculateAllPoints();
      message.success('Resultado salvo e pontuação atualizada!');
      silentRefreshRef.current();
    } catch { message.error('Erro ao salvar resultado'); }
  }, []);

  const onSaveAndClose = useCallback(async (matchId) => {
    const r = resultsRef.current[matchId];
    if (!r || r.home == null || r.away == null) { message.warning('Preencha ambos os placares'); return; }
    const penaltyWinner = (r.home != null && r.away != null && r.home === r.away) ? (r.penaltyWinner ?? null) : null;
    try {
      await updateMatchResult(matchId, parseInt(r.home), parseInt(r.away), penaltyWinner);
      await recalculateAllPoints();
      message.success('Resultado salvo e pontuação atualizada!');
      onCancelResultEdit(matchId);
      silentRefreshRef.current();
    } catch { message.error('Erro ao salvar resultado'); }
  }, [onCancelResultEdit]);

  const onSaveTeams = useCallback(async (matchId) => {
    const t = teamEditsRef.current[matchId];
    if (!t?.home?.trim() || !t?.away?.trim()) { message.warning('Selecione os dois times'); return; }
    try {
      await updateMatchTeams(matchId, t.home.trim(), t.away.trim());
      message.success('Times atualizados!');
      onCancelTeamEdit(matchId);
      silentRefreshRef.current();
    } catch { message.error('Erro ao atualizar times'); }
  }, [onCancelTeamEdit]);

  const onOpenDeadlineEdit = useCallback((m) => {
    const current = m.closingTime ? isoToBrtDayjs(m.closingTime) : null;
    setDeadlineEdits(prev => ({ ...prev, [m.id]: current }));
  }, []);

  const onCancelDeadlineEdit = useCallback((matchId) => {
    setDeadlineEdits(prev => { const n = { ...prev }; delete n[matchId]; return n; });
  }, []);

  const onSetDeadlineValue = useCallback((matchId, val) => {
    setDeadlineEdits(prev => ({ ...prev, [matchId]: val }));
  }, []);

  const onSaveDeadline = useCallback(async (matchId) => {
    const val = deadlineEditsRef.current[matchId];
    const iso = brtDayjsToIso(val);
    try {
      await updateMatchClosingTime(matchId, iso);
      message.success(iso ? 'Prazo de fechamento atualizado!' : 'Prazo removido — padrão 12:00 ativo');
      setDeadlineEdits(prev => { const n = { ...prev }; delete n[matchId]; return n; });
      silentRefreshRef.current();
    } catch { message.error('Erro ao atualizar prazo'); }
  }, []);

  const onClearDeadline = useCallback(async (matchId) => {
    try {
      await updateMatchClosingTime(matchId, null);
      message.success('Prazo removido — padrão 12:00 ativo');
      setDeadlineEdits(prev => { const n = { ...prev }; delete n[matchId]; return n; });
      silentRefreshRef.current();
    } catch { message.error('Erro ao remover prazo'); }
  }, []);

  const onOpenDateEdit = useCallback((m) => {
    setDateEdits(prev => ({ ...prev, [m.id]: isoToBrtDayjs(m.date) }));
  }, []);

  const onCancelDateEdit = useCallback((matchId) => {
    setDateEdits(prev => { const n = { ...prev }; delete n[matchId]; return n; });
  }, []);

  const onSetDateValue = useCallback((matchId, val) => {
    setDateEdits(prev => ({ ...prev, [matchId]: val }));
  }, []);

  const onSaveDate = useCallback(async (matchId) => {
    const val = dateEditsRef.current[matchId];
    if (!val) { message.warning('Selecione data e hora'); return; }
    try {
      await updateMatchDate(matchId, brtDayjsToIso(val));
      message.success('Data e hora do jogo atualizadas!');
      setDateEdits(prev => { const n = { ...prev }; delete n[matchId]; return n; });
      silentRefreshRef.current();
    } catch { message.error('Erro ao atualizar data do jogo'); }
  }, []);

  // ── Dados derivados ────────────────────────────────────────────────────────
  const gruposPhase   = phases.find(p => p.name === 'Grupos');
  const gruposMatches = gruposPhase ? (matchesByPhase[gruposPhase.id] || []) : [];

  const allTeams = useMemo(
    () => [...new Set(gruposMatches.flatMap(m => [m.homeTeam, m.awayTeam]))].sort(),
    [gruposMatches]
  );

  const standings      = useMemo(() => computeGroupStandings(gruposMatches), [gruposMatches]);
  const gruposFinished = gruposMatches.length > 0 && gruposMatches.every(m => m.status === 'finished');

  const matchNumberMap = useMemo(() => {
    const map = {};
    let n = 1;
    for (const phaseName of ['Grupos', 'Round of 32', 'Oitavas', 'Quartas', 'Semis', 'Final']) {
      const phase = phases.find(p => p.name === phaseName);
      if (!phase) continue;
      (matchesByPhase[phase.id] || []).slice()
        .sort((a, b) => new Date(toDate(a.date)) - new Date(toDate(b.date)))
        .forEach(m => { map[n] = m; n++; });
    }
    return map;
  }, [phases, matchesByPhase]);

  const positionLabels = useMemo(() => {
    const { firstByGroup, secondByGroup, rankedThirds } = buildClassifiedData(standings);
    const labels = {};
    GROUPS.forEach(g => {
      if (firstByGroup[g])  labels[firstByGroup[g]]  = { text: `1º Grupo ${g}`, color: 'blue' };
      if (secondByGroup[g]) labels[secondByGroup[g]] = { text: `2º Grupo ${g}`, color: 'green' };
    });
    rankedThirds.forEach(t => { labels[t.team] = { text: `3º Grupo ${t.groupLetter}`, color: 'gold' }; });
    return labels;
  }, [standings]);

  // Objeto passado ao MatchTable/MatchCard — contém estado e handlers
  const cardProps = useMemo(() => ({
    results, teamEdits, editingResults, allTeams, positionLabels,
    deadlineEdits, dateEdits,
    onSetResult, onSave, onSaveAndClose, onOpenResultEdit, onCancelResultEdit,
    onOpenTeamEdit, onCancelTeamEdit, onSetTeamField, onSaveTeams,
    onOpenDeadlineEdit, onCancelDeadlineEdit, onSetDeadlineValue, onSaveDeadline, onClearDeadline,
    onOpenDateEdit, onCancelDateEdit, onSetDateValue, onSaveDate,
  }), [results, teamEdits, editingResults, allTeams, positionLabels,
      deadlineEdits, dateEdits,
      onSetResult, onSave, onSaveAndClose, onOpenResultEdit, onCancelResultEdit,
      onOpenTeamEdit, onCancelTeamEdit, onSetTeamField, onSaveTeams,
      onOpenDeadlineEdit, onCancelDeadlineEdit, onSetDeadlineValue, onSaveDeadline, onClearDeadline,
      onOpenDateEdit, onCancelDateEdit, onSetDateValue, onSaveDate]);

  // ── Auto-preencher ─────────────────────────────────────────────────────────
  const handleAutoFill = async () => {
    const currentPhase = phases.find(p => p.name === activeKnockout);
    if (!currentPhase) { message.error(`Fase "${activeKnockout}" não encontrada`); return; }

    const matches = matchesByPhase[currentPhase.id] || [];
    let updates = [];

    if (activeKnockout === 'Round of 32') {
      const { firstByGroup, secondByGroup, rankedThirds } = buildClassifiedData(standings);
      const pat1 = /^1º Grupo ([A-L])$/, pat2 = /^2º Grupo ([A-L])$/;
      const pat3 = /^Melhor 3º ([A-L/]+)$/, patShort = /^([123])([A-L])$/;

      const resolveSimple = (name) => {
        let mm;
        if ((mm = pat1.exec(name)))     return firstByGroup[mm[1]]  ?? null;
        if ((mm = pat2.exec(name)))     return secondByGroup[mm[1]] ?? null;
        if ((mm = patShort.exec(name))) return (standings[mm[2]] || [])[parseInt(mm[1]) - 1]?.team ?? null;
        return undefined;
      };

      const pending = {}, thirdSlots = [];
      for (const m of matches) {
        const hs = resolveSimple(m.homeTeam), as = resolveSimple(m.awayTeam);
        const hm = pat3.exec(m.homeTeam),    am = pat3.exec(m.awayTeam);
        if (hs !== undefined || as !== undefined || hm || am) {
          pending[m.id] = { m,
            home: hs !== undefined ? (hs ?? m.homeTeam) : m.homeTeam,
            away: as !== undefined ? (as ?? m.awayTeam) : m.awayTeam,
          };
        }
        if (hm) thirdSlots.push({ matchId: m.id, field: 'home', groups: hm[1].split('/') });
        if (am) thirdSlots.push({ matchId: m.id, field: 'away', groups: am[1].split('/') });
      }

      const assignment = {}, usedThirds = new Set();
      const solve = (slots) => {
        if (!slots.length) return true;
        const scored = slots.map(s => ({
          ...s, cands: rankedThirds.filter(t => s.groups.includes(t.groupLetter) && !usedThirds.has(t.team)),
        })).sort((a, b) => a.cands.length - b.cands.length);
        const [curr, ...rest] = scored;
        for (const t of curr.cands) {
          usedThirds.add(t.team);
          assignment[`${curr.matchId}|${curr.field}`] = t.team;
          if (solve(rest)) return true;
          usedThirds.delete(t.team);
          delete assignment[`${curr.matchId}|${curr.field}`];
        }
        return false;
      };
      solve(thirdSlots);

      for (const [key, team] of Object.entries(assignment)) {
        const [matchId, field] = key.split('|');
        if (!pending[matchId]) {
          const m = matches.find(x => x.id === matchId);
          if (m) pending[matchId] = { m, home: m.homeTeam, away: m.awayTeam };
        }
        if (pending[matchId]) pending[matchId][field] = team;
      }
      updates = Object.values(pending);

    } else {
      const patVenc = /^Venc\. Jogo (\d+)$/, patPerd = /^Perd\. Jogo (\d+)$/;
      const resolveRef = (name) => {
        let mm;
        if ((mm = patPerd.exec(name))) {
          const ref = matchNumberMap[parseInt(mm[1])];
          if (!ref || ref.status !== 'finished') return null;
          if (ref.homeGoals > ref.awayGoals) return ref.awayTeam;
          if (ref.awayGoals > ref.homeGoals) return ref.homeTeam;
          // empate: perdedor é quem não ganhou nos pênaltis
          if (ref.penaltyWinner === ref.homeTeam) return ref.awayTeam;
          if (ref.penaltyWinner === ref.awayTeam) return ref.homeTeam;
          return null;
        }
        if ((mm = patVenc.exec(name))) {
          const ref = matchNumberMap[parseInt(mm[1])];
          if (!ref || ref.status !== 'finished') return null;
          if (ref.homeGoals > ref.awayGoals) return ref.homeTeam;
          if (ref.awayGoals > ref.homeGoals) return ref.awayTeam;
          // empate: vencedor é quem ganhou nos pênaltis
          return ref.penaltyWinner ?? null;
        }
        return undefined;
      };
      for (const m of matches) {
        const nh = resolveRef(m.homeTeam), na = resolveRef(m.awayTeam);
        if ((nh !== undefined || na !== undefined) && (nh || na))
          updates.push({ m, home: nh ?? m.homeTeam, away: na ?? m.awayTeam });
      }
    }

    if (updates.length === 0) {
      message.info('Nenhum jogo resolvível — verifique se os jogos da fase anterior têm resultado');
      return;
    }
    setAutoFilling(true);
    try {
      await Promise.all(updates.map(({ m, home, away }) => updateMatchTeams(m.id, home, away)));
      message.success(`${updates.length} jogos preenchidos!`);
      silentRefreshRef.current();
    } catch { message.error('Erro ao preencher times'); }
    finally  { setAutoFilling(false); }
  };

  // ── Painel de classificados ────────────────────────────────────────────────
  const classifiedPanelItems = useMemo(() => {
    if (Object.keys(standings).length === 0) return null;
    const thirds = GROUPS.flatMap(g => {
      const group = standings[g] || [];
      return group[2] ? [{ ...group[2], g }] : [];
    });
    thirds.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      const gdA = a.gf - a.ga, gdB = b.gf - b.ga;
      if (gdB !== gdA) return gdB - gdA;
      return b.gf - a.gf;
    });
    const qualifiedThirds = new Set(thirds.slice(0, 8).map(t => t.team));

    return [{
      key: '1',
      label: (
        <Space>
          <Text strong>Classificados da Fase de Grupos</Text>
          {gruposFinished ? <Tag color="success">Fase concluída</Tag> : <Tag color="processing">Em andamento</Tag>}
        </Space>
      ),
      children: (
        <Row gutter={[8, 8]}>
          {GROUPS.map(g => {
            const group    = standings[g] || [];
            const gMatches = gruposMatches.filter(m => m.group === g);
            const done     = gMatches.filter(m => m.status === 'finished').length;
            return (
              <Col key={g} xs={12} sm={8} md={6} lg={4}>
                <Card size="small"
                  title={<Text strong style={{ fontSize: 12 }}>Grupo {g}</Text>}
                  extra={<Text type="secondary" style={{ fontSize: 10 }}>{done}/{gMatches.length}</Text>}
                  style={{ borderRadius: 8 }}
                  styles={{ header: { minHeight: 30, padding: '0 8px' }, body: { padding: '6px 8px' } }}
                >
                  {group.length === 0
                    ? <Text type="secondary" style={{ fontSize: 11 }}>Aguardando...</Text>
                    : group.slice(0, 3).map((t, i) => (
                      <div key={t.team} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <Tag style={{ minWidth: 22, textAlign: 'center', margin: 0, fontSize: 10, padding: '0 3px' }}
                          color={i === 0 ? 'blue' : i === 1 ? 'green' : qualifiedThirds.has(t.team) ? 'gold' : 'default'}>
                          {i + 1}º
                        </Tag>
                        <Text style={{ fontSize: 11, fontWeight: i < 2 ? 600 : 400 }}>
                          <FlagImage name={t.team} height={10} />{t.team}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 10, marginLeft: 'auto' }}>{t.pts}p</Text>
                      </div>
                    ))
                  }
                </Card>
              </Col>
            );
          })}
        </Row>
      ),
    }];
  }, [standings, gruposFinished, gruposMatches]);

  // ── Abas dos grupos ────────────────────────────────────────────────────────
  const groupTabItems = useMemo(() => GROUPS.map(g => {
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
              <Col key={t}>
                <Tag color="blue" style={{ marginBottom: 4 }}><FlagImage name={t} height={12} />{t}</Tag>
              </Col>
            ))}
          </Row>
          <MatchTable matches={gMatches} cardProps={cardProps} />
        </div>
      ),
    };
  }), [gruposMatches, cardProps]);

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
          : <Empty description="Fase de Grupos não encontrada" />}
      </Card>

      {/* Mata-mata */}
      <Card
        style={{ borderRadius: 12 }}
        styles={{ body: { padding: '16px 20px' } }}
        title={
          <Space>
            <TrophyOutlined style={{ color: '#FFD500' }} />
            <Tag color="gold" style={{ fontSize: 13, padding: '2px 10px' }}>Mata-mata</Tag>
          </Space>
        }
      >
        <Segmented
          options={KNOCKOUT_PHASES}
          value={activeKnockout}
          onChange={setActiveKnockout}
          style={{ marginBottom: 16 }}
        />

        {activeKnockout === 'Round of 32' && classifiedPanelItems && (
          <Collapse size="small" style={{ marginBottom: 16 }} items={classifiedPanelItems} />
        )}

        <Space style={{ marginBottom: 16 }} wrap>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={handleAutoFill}
            loading={autoFilling}
            disabled={activeKnockout === 'Round of 32' && !gruposFinished}
            style={{ background: '#008B46', borderColor: '#008B46' }}
          >
            {activeKnockout === 'Round of 32' ? 'Auto-preencher com classificados' : 'Auto-preencher com vencedores'}
          </Button>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {activeKnockout === 'Round of 32'
              ? 'Preenche os slots de posição (ex: "1º Grupo A") com os times classificados'
              : 'Preenche os slots (ex: "Venc. Jogo 74") com os vencedores da fase anterior'}
          </Text>
        </Space>

        <MatchTable matches={knockoutMatches} cardProps={cardProps} />
      </Card>
    </div>
  );
}

export default MatchManager;
