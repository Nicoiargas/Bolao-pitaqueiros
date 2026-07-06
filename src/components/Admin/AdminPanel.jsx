import React, { useState, useEffect } from 'react';
import { Card, Tabs, Typography, Space, Button, Alert, List, Tag, Table, Collapse, Spin } from 'antd';
import {
  PlusOutlined, EditOutlined, SettingOutlined,
  ThunderboltOutlined, CheckCircleOutlined, BugOutlined, ReloadOutlined, TrophyOutlined,
  DownloadOutlined, FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import PhaseManager from './PhaseManager';
import MatchManager from './MatchManager';
import GlobalBetManager from './GlobalBetManager';
import {
  recalculateAllPoints, getRanking, getAllBets, getAllMatches, getAllPhases, getBetLogs,
} from '../../services/gameService';
import { seedWorldCup2026 } from '../../services/seedMatches';
import { calculatePoints } from '../../services/pointsService';

const { Title, Text } = Typography;

function DiagnosticPanel() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [users, bets, matches, phases] = await Promise.all([
        getRanking(),
        getAllBets(),
        getAllMatches(),
        getAllPhases(),
      ]);
      setData({ users, bets, matches, phases });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>;
  if (!data) return <Alert type="error" message="Erro ao carregar diagnóstico" />;

  const { users, bets, matches, phases } = data;
  const finishedMatches = matches.filter(m => m.status === 'finished');

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Button icon={<ReloadOutlined />} onClick={loadData} size="small">Recarregar</Button>
        <Text type="secondary">
          {users.length} usuário(s) · {bets.length} palpite(s) · {finishedMatches.length} jogo(s) encerrado(s)
        </Text>
      </Space>

      <Collapse size="small" items={[
        {
          key: 'users',
          label: `Usuários (${users.length})`,
          children: (
            <Table
              size="small" pagination={false}
              dataSource={users.map(u => ({ ...u, key: u.uid }))}
              columns={[
                { title: 'Nome',    dataIndex: 'displayName', key: 'displayName' },
                { title: 'Email',   dataIndex: 'email',       key: 'email' },
                { title: 'Role',    dataIndex: 'role',        key: 'role',   render: v => <Tag color={v === 'admin' ? 'volcano' : 'blue'}>{v}</Tag> },
                { title: 'Pts',     dataIndex: 'totalPoints', key: 'pts',    render: v => <Text strong style={{ color: '#008B46' }}>{v ?? 0}</Text> },
              ]}
            />
          ),
        },
        {
          key: 'bets',
          label: `Palpites (${bets.length})`,
          children: (
            <Table
              size="small" pagination={false} scroll={{ y: 300 }}
              dataSource={bets.map(b => {
                const match   = matches.find(m => m.id === b.matchId);
                const phase   = match ? phases.find(p => p.id === match.phaseId) : null;
                const userObj = users.find(u => u.uid === b.userId);
                const pts = match?.status === 'finished'
                  ? calculatePoints(
                      { homeGoals: b.homeGoals, awayGoals: b.awayGoals },
                      { homeGoals: match.homeGoals, awayGoals: match.awayGoals },
                      phase?.pointsPerGame ?? 0,
                    )
                  : null;
                return {
                  ...b, key: b.id,
                  matchLabel:  match ? `${match.homeTeam} x ${match.awayTeam}` : '?',
                  matchStatus: match?.status,
                  phaseName:   phase?.name,
                  userName:    userObj?.displayName || b.userId,
                  pts,
                };
              })}
              columns={[
                { title: 'Usuário',  dataIndex: 'userName',    key: 'user' },
                { title: 'Jogo',     dataIndex: 'matchLabel',  key: 'match' },
                { title: 'Status',   dataIndex: 'matchStatus', key: 'status',  render: v => <Tag color={v === 'finished' ? 'default' : 'processing'}>{v || '?'}</Tag> },
                { title: 'Fase',     dataIndex: 'phaseName',   key: 'phase' },
                { title: 'Palpite',  key: 'palpite',           render: (_, r) => `${r.homeGoals} × ${r.awayGoals}` },
                { title: 'Pts calc', dataIndex: 'pts',         key: 'pts',     render: v => v === null ? <Text type="secondary">Pendente</Text> : <Text strong style={{ color: v > 0 ? '#008B46' : '#999' }}>{v}</Text> },
                { title: 'userId OK?', key: 'uidok',           render: (_, r) => <Tag color={users.some(u => u.uid === r.userId) ? 'success' : 'error'}>{users.some(u => u.uid === r.userId) ? 'Sim' : 'NÃO'}</Tag> },
              ]}
            />
          ),
        },
        {
          key: 'finished',
          label: `Jogos encerrados (${finishedMatches.length})`,
          children: (
            <Table
              size="small" pagination={false} scroll={{ y: 300 }}
              dataSource={finishedMatches.map(m => ({ ...m, key: m.id, phaseName: phases.find(p => p.id === m.phaseId)?.name }))}
              columns={[
                { title: 'Jogo',      key: 'jogo',      render: (_, r) => `${r.homeTeam} x ${r.awayTeam}` },
                { title: 'Resultado', key: 'result',    render: (_, r) => <Tag color="blue">{r.homeGoals} × {r.awayGoals}</Tag> },
                { title: 'Fase',      dataIndex: 'phaseName', key: 'phase' },
                { title: 'Pts/Jogo',  key: 'ppj',       render: (_, r) => phases.find(p => p.id === r.phaseId)?.pointsPerGame ?? <Tag color="error">?</Tag> },
              ]}
            />
          ),
        },
      ]} />
    </div>
  );
}

function toCSV(rows) {
  return rows.map(row =>
    row.map(cell => {
      const s = String(cell ?? '');
      return s.includes(';') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(';')
  ).join('\r\n');
}

function downloadCSV(filename, rows) {
  const bom   = '﻿'; // BOM para Excel reconhecer UTF-8
  const blob  = new Blob([bom + toCSV(rows)], { type: 'text/csv;charset=utf-8;' });
  const url   = URL.createObjectURL(blob);
  const link  = document.createElement('a');
  link.href   = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function ExportPanel() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [exporting, setExporting] = useState(null); // phaseId sendo exportado

  useEffect(() => {
    (async () => {
      try {
        const [users, bets, matches, phases] = await Promise.all([
          getRanking(), getAllBets(), getAllMatches(), getAllPhases(),
        ]);
        setData({ users, bets, matches, phases });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>;
  if (!data)   return <Alert type="error" message="Erro ao carregar dados" />;

  const { users, bets, matches, phases } = data;

  const handleExport = (phase) => {
    setExporting(phase.id);
    try {
      const phaseMatches = matches.filter(m => m.phaseId === phase.id);
      const phaseBets    = bets.filter(b => b.phaseId === phase.id);

      const header = [
        'Usuário', 'Email',
        'Jogo', 'Data',
        'Palpite Casa', 'Palpite Fora', 'Pênaltis Apostados',
        'Resultado Casa', 'Resultado Fora', 'Pênaltis Resultado',
        'Pontos',
      ];

      const rows = [header];

      for (const match of phaseMatches) {
        const matchBets = phaseBets.filter(b => b.matchId === match.id);
        const jogo      = `${match.homeTeam} x ${match.awayTeam}`;
        const data_jogo = dayjs(match.date).format('DD/MM/YYYY HH:mm');
        const resHome   = match.homeGoals ?? '';
        const resAway   = match.awayGoals ?? '';
        const resPen    = match.penaltyWinner ?? '';

        for (const bet of matchBets) {
          const user = users.find(u => u.uid === bet.userId);
          const pts  = match.status === 'finished'
            ? calculatePoints(
                { homeGoals: bet.homeGoals, awayGoals: bet.awayGoals, penaltyWinner: bet.penaltyWinner ?? null },
                { homeGoals: match.homeGoals, awayGoals: match.awayGoals, penaltyWinner: match.penaltyWinner ?? null },
                phase.pointsPerGame,
              )
            : '';

          rows.push([
            user?.displayName ?? bet.userId,
            user?.email ?? '',
            jogo,
            data_jogo,
            bet.homeGoals ?? '',
            bet.awayGoals ?? '',
            bet.penaltyWinner ?? '',
            resHome, resAway, resPen,
            pts,
          ]);
        }

        // Linha para usuários sem palpite nesse jogo
        const betUserIds = new Set(matchBets.map(b => b.userId));
        for (const user of users.filter(u => u.role !== 'admin' && !betUserIds.has(u.uid))) {
          rows.push([
            user.displayName ?? user.email,
            user.email,
            jogo, data_jogo,
            'SEM PALPITE', '', '',
            resHome, resAway, resPen,
            '',
          ]);
        }
      }

      const filename = `palpites_${phase.name.replace(/\s+/g, '_')}_${dayjs().format('YYYY-MM-DD')}.csv`;
      downloadCSV(filename, rows);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div>
      <Alert
        type="info" showIcon style={{ marginBottom: 20, borderRadius: 8 }}
        message="Backup de palpites por fase"
        description="Exporta todos os palpites (incluindo ausentes) em CSV compatível com Excel. Use no fechamento de cada fase."
      />
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        {phases.map(phase => {
          const phaseMatches = matches.filter(m => m.phaseId === phase.id);
          const phaseBets    = bets.filter(b => b.phaseId === phase.id);
          const closed       = new Date() > new Date(phase.closingDate);
          return (
            <Card
              key={phase.id}
              style={{ borderRadius: 10, borderColor: closed ? '#d9d9d9' : '#91caff' }}
              styles={{ body: { padding: '14px 20px' } }}
            >
              <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <Space direction="vertical" size={2}>
                  <Space>
                    <Text strong style={{ fontSize: 15 }}>{phase.name}</Text>
                    <Tag color={closed ? 'default' : 'processing'}>
                      {closed ? 'Fechada' : 'Aberta'}
                    </Tag>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {phaseMatches.length} jogos · {phaseBets.length} palpites ·{' '}
                    Fechamento: {dayjs(phase.closingDate).format('DD/MM/YYYY HH:mm')}
                  </Text>
                </Space>
                <Button
                  icon={<DownloadOutlined />}
                  type={closed ? 'primary' : 'default'}
                  loading={exporting === phase.id}
                  disabled={phaseBets.length === 0}
                  onClick={() => handleExport(phase)}
                  style={closed ? { background: '#008B46', borderColor: '#008B46' } : {}}
                >
                  Exportar CSV
                </Button>
              </Space>
            </Card>
          );
        })}
      </Space>
    </div>
  );
}

function BetLogPanel() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setLogs(await getBetLogs()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>;

  const columns = [
    {
      title: 'Horário (BRT)',
      dataIndex: 'attempt_at',
      key: 'time',
      width: 160,
      render: v => {
        const brt = new Date(new Date(v).getTime() - 3 * 60 * 60 * 1000);
        return brt.toISOString().replace('T', ' ').slice(0, 19);
      },
    },
    {
      title: 'Usuário',
      key: 'user',
      render: (_, r) => r.users?.display_name ?? r.user_id,
    },
    {
      title: 'Palpite',
      key: 'bet',
      render: (_, r) => `${r.home_goals ?? '?'} × ${r.away_goals ?? '?'}`,
    },
    {
      title: 'Status',
      key: 'status',
      width: 130,
      render: (_, r) => r.success
        ? <Tag color="success">Salvo</Tag>
        : <Tag color="error">Não salvo</Tag>,
    },
    {
      title: 'Motivo',
      dataIndex: 'failure_reason',
      key: 'reason',
      render: v => v ? <Text type="danger">{v}</Text> : <Text type="secondary">—</Text>,
    },
  ];

  const bloqueados = logs.filter(l => !l.success).length;

  return (
    <div>
      <Space style={{ marginBottom: 12, width: '100%', justifyContent: 'space-between' }}>
        <Space>
          <Text strong>{logs.length} tentativa(s)</Text>
          {bloqueados > 0 && <Tag color="error">{bloqueados} bloqueada(s)</Tag>}
        </Space>
        <Button icon={<ReloadOutlined />} size="small" onClick={load}>Atualizar</Button>
      </Space>
      {bloqueados > 0 && (
        <Alert
          type="warning" showIcon style={{ marginBottom: 12, borderRadius: 8 }}
          message={`${bloqueados} palpite(s) tentado(s) após o prazo`}
        />
      )}
      <Table
        size="small"
        dataSource={logs.map(l => ({ ...l, key: l.id }))}
        columns={columns}
        pagination={{ pageSize: 50 }}
        scroll={{ y: 400 }}
        rowClassName={r => !r.success ? 'ant-table-row-danger' : ''}
      />
    </div>
  );
}

function AdminPanel() {
  const [activeTab, setActiveTab]         = useState('fases');
  const [recalcLoading, setRecalcLoading] = useState(false);
  const [recalcResult, setRecalcResult]   = useState(null);

  useEffect(() => { seedWorldCup2026().catch(console.error); }, []);

  const handleRecalc = async () => {
    setRecalcResult(null);
    setRecalcLoading(true);
    try {
      await recalculateAllPoints();
      const users = await getRanking();
      setRecalcResult({ users, error: null });
    } catch (e) {
      setRecalcResult({ users: [], error: e.message || String(e) });
    } finally {
      setRecalcLoading(false);
    }
  };

  const tabItems = [
    { key: 'fases',   label: <Space><PlusOutlined />Fases</Space>,           children: <PhaseManager /> },
    { key: 'jogos',   label: <Space><EditOutlined />Jogos</Space>,           children: <MatchManager /> },
    { key: 'global',  label: <Space><TrophyOutlined />Palpite Global</Space>, children: <GlobalBetManager /> },
    { key: 'export',  label: <Space><DownloadOutlined />Exportar</Space>,    children: <ExportPanel /> },
    { key: 'logs',    label: <Space><FileTextOutlined />Log de Palpites</Space>, children: <BetLogPanel /> },
    { key: 'diag',    label: <Space><BugOutlined />Diagnóstico</Space>,      children: <DiagnosticPanel /> },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <Card
        style={{ marginBottom: 24, background: 'linear-gradient(90deg, #008B46, #0033A0)', border: 'none', borderRadius: 16 }}
        styles={{ body: { padding: '20px 28px' } }}
      >
        <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Space>
            <SettingOutlined style={{ fontSize: 36, color: '#FFD500' }} />
            <div>
              <Title level={3} style={{ color: 'white', margin: 0 }}>Painel de Administração</Title>
              <Text style={{ color: 'rgba(255,255,255,0.75)' }}>Gerencie as fases e jogos do bolão</Text>
            </div>
          </Space>
          <Button
            icon={<ThunderboltOutlined />}
            loading={recalcLoading}
            onClick={handleRecalc}
            style={{ background: '#FFD500', borderColor: '#FFD500', color: '#008B46', fontWeight: 700 }}
          >
            {recalcLoading ? 'Calculando...' : 'Recalcular Pontuação'}
          </Button>
        </Space>
      </Card>

      {/* Resultado do recálculo */}
      {recalcResult && (
        <Card style={{ marginBottom: 24, borderRadius: 12 }} styles={{ body: { padding: '16px 20px' } }}>
          {recalcResult.error ? (
            <Alert type="error" showIcon message="Erro ao recalcular" description={recalcResult.error} />
          ) : (
            <>
              <Space style={{ marginBottom: 12 }}>
                <CheckCircleOutlined style={{ color: '#008B46', fontSize: 18 }} />
                <Text strong style={{ color: '#008B46' }}>Pontuação recalculada com sucesso!</Text>
                <Tag color="blue">{recalcResult.users.length} usuário(s)</Tag>
              </Space>
              <List
                size="small"
                dataSource={recalcResult.users}
                renderItem={u => (
                  <List.Item style={{ padding: '6px 0' }}>
                    <Space>
                      <Tag color={u.role === 'admin' ? 'volcano' : 'blue'}>{u.role}</Tag>
                      <Text strong>{u.displayName || u.email}</Text>
                    </Space>
                    <Text strong style={{ color: '#008B46', fontSize: 16 }}>
                      {u.totalPoints ?? 0} pts
                    </Text>
                  </List.Item>
                )}
              />
            </>
          )}
        </Card>
      )}

      <Card style={{ borderRadius: 12 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" tabBarStyle={{ marginBottom: 24 }} />
      </Card>
    </div>
  );
}

export default AdminPanel;
