import React, { useState, useEffect } from 'react';
import { Card, Tabs, Typography, Space, Button, Alert, List, Tag, Table, Collapse, Spin } from 'antd';
import {
  PlusOutlined, EditOutlined, SettingOutlined,
  ThunderboltOutlined, CheckCircleOutlined, BugOutlined, ReloadOutlined, TrophyOutlined,
} from '@ant-design/icons';
import PhaseManager from './PhaseManager';
import MatchManager from './MatchManager';
import GlobalBetManager from './GlobalBetManager';
import {
  recalculateAllPoints, getRanking, getAllBets, getAllMatches, getAllPhases,
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
    { key: 'fases',  label: <Space><PlusOutlined />Fases</Space>,        children: <PhaseManager /> },
    { key: 'jogos',  label: <Space><EditOutlined />Jogos</Space>,        children: <MatchManager /> },
    { key: 'global', label: <Space><TrophyOutlined />Palpite Global</Space>, children: <GlobalBetManager /> },
    { key: 'diag',   label: <Space><BugOutlined />Diagnóstico</Space>,   children: <DiagnosticPanel /> },
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
