import React, { useState, useEffect, useMemo } from 'react';
import {
  Tabs, Button, InputNumber, Select, Space, Tag, Typography,
  App, Empty, Spin, Row, Col, Segmented, Card, Collapse,
} from 'antd';
import {
  CheckOutlined, LockOutlined, TrophyOutlined, EditOutlined,
  CloseOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
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

function computeGroupStandings(matches) {
  const teamStats = {};

  matches.filter(m => m.status === 'finished' && m.group).forEach(m => {
    [m.homeTeam, m.awayTeam].forEach(t => {
      if (!teamStats[t]) teamStats[t] = { team: t, group: m.group, pts: 0, gf: 0, ga: 0, played: 0 };
    });
    const hg = m.homeGoals ?? 0;
    const ag = m.awayGoals ?? 0;
    teamStats[m.homeTeam].gf += hg; teamStats[m.homeTeam].ga += ag; teamStats[m.homeTeam].played++;
    teamStats[m.awayTeam].gf += ag; teamStats[m.awayTeam].ga += hg; teamStats[m.awayTeam].played++;
    if (hg > ag)      { teamStats[m.homeTeam].pts += 3; }
    else if (hg < ag) { teamStats[m.awayTeam].pts += 3; }
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

// Extrai os três mapas necessários para resolver qualquer posição do R32
function buildClassifiedData(standings) {
  const firstByGroup  = {};  // { A: 'México', ... }
  const secondByGroup = {};  // { A: 'Tchéquia', ... }
  const thirds = [];

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

function MatchManager() {
  const { message } = App.useApp();
  const [loading, setLoading]               = useState(true);
  const [phases, setPhases]                 = useState([]);
  const [matchesByPhase, setMatchesByPhase] = useState({});
  const [results, setResults]               = useState({});
  const [teamEdits, setTeamEdits]           = useState({});
  const [editingResults, setEditingResults] = useState(new Set());
  const [activeGroup, setActiveGroup]       = useState('A');
  const [activeKnockout, setActiveKnockout] = useState('Round of 32');
  const [autoFilling, setAutoFilling]       = useState(false);

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

  const openResultEdit   = (matchId) => setEditingResults(prev => new Set(prev).add(matchId));
  const cancelResultEdit = (matchId) => setEditingResults(prev => { const s = new Set(prev); s.delete(matchId); return s; });

  const handleSaveAndClose = async (matchId) => {
    await handleSave(matchId);
    cancelResultEdit(matchId);
  };

  // ── Edição de times (mata-mata) ────────────────────────────────────────────
  const openTeamEdit   = (m) => setTeamEdits(prev => ({ ...prev, [m.id]: { home: m.homeTeam, away: m.awayTeam } }));
  const cancelTeamEdit = (matchId) => setTeamEdits(prev => { const n = { ...prev }; delete n[matchId]; return n; });
  const setTeamField   = (matchId, field, val) =>
    setTeamEdits(prev => ({ ...prev, [matchId]: { ...prev[matchId], [field]: val } }));

  const handleSaveTeams = async (matchId) => {
    const t = teamEdits[matchId];
    if (!t.home?.trim() || !t.away?.trim()) { message.warning('Selecione os dois times'); return; }
    try {
      await updateMatchTeams(matchId, t.home.trim(), t.away.trim());
      message.success('Times atualizados!');
      cancelTeamEdit(matchId);
      loadAll();
    } catch { message.error('Erro ao atualizar times'); }
  };

  // ── Fase de Grupos ─────────────────────────────────────────────────────────
  const gruposPhase   = phases.find(p => p.name === 'Grupos');
  const gruposMatches = gruposPhase ? (matchesByPhase[gruposPhase.id] || []) : [];

  const allTeams = useMemo(
    () => [...new Set(gruposMatches.flatMap(m => [m.homeTeam, m.awayTeam]))].sort(),
    [gruposMatches]
  );

  const standings      = useMemo(() => computeGroupStandings(gruposMatches), [gruposMatches]);
  const gruposFinished = gruposMatches.length > 0 && gruposMatches.every(m => m.status === 'finished');

  // Mapa número global → jogo (grupos=1-72, R32=73-88, Oitavas=89-96, Quartas=97-100, Semis=101-102, Final=103-104)
  const matchNumberMap = useMemo(() => {
    const map = {};
    let n = 1;
    for (const phaseName of ['Grupos', 'Round of 32', 'Oitavas', 'Quartas', 'Semis', 'Final']) {
      const phase = phases.find(p => p.name === phaseName);
      if (!phase) continue;
      const sorted = (matchesByPhase[phase.id] || []).slice().sort((a, b) => new Date(toDate(a.date)) - new Date(toDate(b.date)));
      sorted.forEach(m => { map[n] = m; n++; });
    }
    return map;
  }, [phases, matchesByPhase]);

  // Mapa time → { text, color } para exibir a posição de classificação no mata-mata
  const positionLabels = useMemo(() => {
    const { firstByGroup, secondByGroup, rankedThirds } = buildClassifiedData(standings);
    const labels = {};
    GROUPS.forEach(g => {
      if (firstByGroup[g])  labels[firstByGroup[g]]  = { text: `1º Grupo ${g}`, color: 'blue' };
      if (secondByGroup[g]) labels[secondByGroup[g]] = { text: `2º Grupo ${g}`, color: 'green' };
    });
    rankedThirds.forEach(t => {
      labels[t.team] = { text: `3º Grupo ${t.groupLetter}`, color: 'gold' };
    });
    return labels;
  }, [standings]);

  // ── Auto-preencher (todas as fases do mata-mata) ──────────────────────────
  const handleAutoFill = async () => {
    const currentPhase = phases.find(p => p.name === activeKnockout);
    if (!currentPhase) { message.error(`Fase "${activeKnockout}" não encontrada`); return; }

    const matches = matchesByPhase[currentPhase.id] || [];
    let updates = [];

    if (activeKnockout === 'Round of 32') {
      // ── R32: resolve por posição nos grupos ─────────────────────────────────
      const { firstByGroup, secondByGroup, rankedThirds } = buildClassifiedData(standings);

      const pat1     = /^1º Grupo ([A-L])$/;
      const pat2     = /^2º Grupo ([A-L])$/;
      const pat3     = /^Melhor 3º ([A-L/]+)$/;
      const patShort = /^([123])([A-L])$/;

      const resolveSimple = (name) => {
        let mm;
        if ((mm = pat1.exec(name)))     return firstByGroup[mm[1]]  ?? null;
        if ((mm = pat2.exec(name)))     return secondByGroup[mm[1]] ?? null;
        if ((mm = patShort.exec(name))) return (standings[mm[2]] || [])[parseInt(mm[1]) - 1]?.team ?? null;
        return undefined;
      };

      const pending = {};
      const thirdSlots = [];

      for (const m of matches) {
        const hs = resolveSimple(m.homeTeam);
        const as = resolveSimple(m.awayTeam);
        const hm = pat3.exec(m.homeTeam);
        const am = pat3.exec(m.awayTeam);
        if (hs !== undefined || as !== undefined || hm || am) {
          pending[m.id] = { m,
            home: hs !== undefined ? (hs ?? m.homeTeam) : m.homeTeam,
            away: as !== undefined ? (as ?? m.awayTeam) : m.awayTeam,
          };
        }
        if (hm) thirdSlots.push({ matchId: m.id, field: 'home', groups: hm[1].split('/') });
        if (am) thirdSlots.push({ matchId: m.id, field: 'away', groups: am[1].split('/') });
      }

      // Backtracking MRV para os slots "Melhor 3º"
      const assignment = {};
      const usedThirds = new Set();
      const solve = (slots) => {
        if (!slots.length) return true;
        const scored = slots.map(s => ({
          ...s,
          cands: rankedThirds.filter(t => s.groups.includes(t.groupLetter) && !usedThirds.has(t.team)),
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
      // ── Oitavas / Quartas / Semis / Final: resolve por "Venc./Perd. Jogo N" ──
      const patVenc = /^Venc\. Jogo (\d+)$/;
      const patPerd = /^Perd\. Jogo (\d+)$/;

      const resolveRef = (name) => {
        let mm;
        const isPerd = !!(mm = patPerd.exec(name)) || !(mm = patVenc.exec(name)) && undefined;
        if (!mm) mm = patVenc.exec(name);
        if (!mm) return undefined; // não é um padrão de referência

        const ref = matchNumberMap[parseInt(mm[1])];
        if (!ref || ref.status !== 'finished') return null; // jogo ainda não concluído

        const homeWon = ref.homeGoals > ref.awayGoals;
        const awayWon = ref.awayGoals > ref.homeGoals;

        if (/^Perd/.test(name)) return homeWon ? ref.awayTeam : awayWon ? ref.homeTeam : null;
        return homeWon ? ref.homeTeam : awayWon ? ref.awayTeam : null;
      };

      for (const m of matches) {
        const nh = resolveRef(m.homeTeam);
        const na = resolveRef(m.awayTeam);
        if ((nh !== undefined || na !== undefined) && (nh || na)) {
          updates.push({ m, home: nh ?? m.homeTeam, away: na ?? m.awayTeam });
        }
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
      loadAll();
    } catch { message.error('Erro ao preencher times'); }
    finally  { setAutoFilling(false); }
  };

  // ── Painel de classificados ────────────────────────────────────────────────
  const ClassifiedPanel = () => {
    if (Object.keys(standings).length === 0) return null;

    const qualifiedThirds = useMemo(() => {
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
      return new Set(thirds.slice(0, 8).map(t => t.team));
    }, [standings]);

    return (
      <Collapse
        size="small"
        style={{ marginBottom: 16 }}
        items={[{
          key: '1',
          label: (
            <Space>
              <Text strong>Classificados da Fase de Grupos</Text>
              {gruposFinished
                ? <Tag color="success">Fase concluída</Tag>
                : <Tag color="processing">Em andamento</Tag>
              }
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
                    <Card
                      size="small"
                      title={<Text strong style={{ fontSize: 12 }}>Grupo {g}</Text>}
                      extra={<Text type="secondary" style={{ fontSize: 10 }}>{done}/{gMatches.length}</Text>}
                      style={{ borderRadius: 8 }}
                      styles={{ header: { minHeight: 30, padding: '0 8px' }, body: { padding: '6px 8px' } }}
                    >
                      {group.length === 0
                        ? <Text type="secondary" style={{ fontSize: 11 }}>Aguardando...</Text>
                        : group.slice(0, 3).map((t, i) => {
                          const isQ = i < 2 || qualifiedThirds.has(t.team);
                          return (
                            <div key={t.team} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                              <Tag
                                style={{ minWidth: 22, textAlign: 'center', margin: 0, fontSize: 10, padding: '0 3px' }}
                                color={i === 0 ? 'blue' : i === 1 ? 'green' : isQ ? 'gold' : 'default'}
                              >
                                {i + 1}º
                              </Tag>
                              <Text style={{ fontSize: 11, fontWeight: i < 2 ? 600 : 400 }}>
                                <FlagImage name={t.team} height={10} />{t.team}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 10, marginLeft: 'auto' }}>{t.pts}p</Text>
                            </div>
                          );
                        })
                      }
                    </Card>
                  </Col>
                );
              })}
            </Row>
          ),
        }]}
      />
    );
  };

  // ── Card de jogo ───────────────────────────────────────────────────────────
  const MatchCard = ({ m }) => {
    const isKnockout    = m.group === null;
    const editing       = teamEdits[m.id];
    const editingResult = editingResults.has(m.id);
    const r             = results[m.id] || { home: 0, away: 0 };

    const teamSelectOptions = allTeams.map(t => ({ value: t, label: t }));

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
              <Space direction="vertical" size={4} style={{ marginTop: 6 }}>
                <Select
                  showSearch
                  size="small"
                  value={editing.home || undefined}
                  onChange={v => setTeamField(m.id, 'home', v)}
                  placeholder="Time da casa"
                  style={{ width: 220 }}
                  options={teamSelectOptions}
                  filterOption={(input, opt) => opt.value.toLowerCase().includes(input.toLowerCase())}
                />
                <Select
                  showSearch
                  size="small"
                  value={editing.away || undefined}
                  onChange={v => setTeamField(m.id, 'away', v)}
                  placeholder="Time visitante"
                  style={{ width: 220 }}
                  options={teamSelectOptions}
                  filterOption={(input, opt) => opt.value.toLowerCase().includes(input.toLowerCase())}
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
                  size="small" icon={<EditOutlined />} type="text"
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
                <Button
                  type="primary" icon={<CheckOutlined />} size="small"
                  onClick={() => editingResult ? handleSaveAndClose(m.id) : handleSave(m.id)}
                >
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

  // ── Fase de Grupos — abas ──────────────────────────────────────────────────
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
              <Col key={t}>
                <Tag color="blue" style={{ marginBottom: 4 }}><FlagImage name={t} height={12} />{t}</Tag>
              </Col>
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

        {activeKnockout === 'Round of 32' && <ClassifiedPanel />}

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

        <MatchTable matches={knockoutMatches} />
      </Card>
    </div>
  );
}

export default MatchManager;
