import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Tag, Statistic, Typography, Spin, Empty, Alert, Space } from 'antd';
import { TrophyOutlined, CalendarOutlined, ThunderboltOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getAllPhases, getMatchesByPhase, getBetsByUser } from '../../services/gameService';

const { Title, Text } = Typography;

const toDate = (val) => {
  if (!val) return null;
  if (val?.seconds) return new Date(val.seconds * 1000);
  return new Date(val);
};

function Dashboard({ user }) {
  const isAdmin = user?.role === 'admin';
  const [phases, setPhases] = useState([]);
  const [matchesData, setMatchesData] = useState({});
  const [userBets, setUserBets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const phasesData = await getAllPhases();
      setPhases(phasesData);
      const matches = {};
      for (const phase of phasesData) {
        matches[phase.id] = await getMatchesByPhase(phase.id);
      }
      setMatchesData(matches);
      if (!isAdmin) setUserBets(await getBetsByUser(user.uid));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isPhaseOpen = (closingDate) => new Date() < toDate(closingDate);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" tip="Carregando fases..." />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      {/* Banner */}
      <Card
        style={{
          marginBottom: 24,
          background: 'linear-gradient(90deg, #008B46, #0033A0)',
          border: 'none',
          borderRadius: 16,
        }}
        styles={{ body: { padding: '28px 32px' } }}
      >
        <Space align="center" size={16}>
          <TrophyOutlined style={{ fontSize: 48, color: '#FFD500' }} />
          <div>
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              Bem-vindo, {user.displayName || 'Pitaqueiro'}!
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.75)' }}>
              Bolão dos Pitaqueiros — Seu palpite, sua glória!
            </Text>
          </div>
        </Space>
      </Card>

      {/* Phases grid */}
      {phases.length === 0 ? (
        <Empty description="Nenhuma fase cadastrada ainda." />
      ) : (
        <Row gutter={[16, 16]}>
          {phases.map((phase) => {
            const matches = matchesData[phase.id] || [];
            const phaseBets = userBets.filter(b => b.phaseId === phase.id);
            const open = isPhaseOpen(phase.closingDate);
            const closingDate = toDate(phase.closingDate);
            const finished = matches.filter(m => m.status === 'finished').length;

            return (
              <Col xs={24} sm={12} lg={8} key={phase.id}>
                <Card
                  style={{ borderRadius: 12, borderTop: `4px solid ${open ? '#008B46' : '#d9d9d9'}`, height: '100%' }}
                  styles={{ body: { padding: 0 } }}
                >
                  <div style={{
                    background: 'linear-gradient(90deg, #008B46, #0033A0)',
                    borderRadius: '8px 8px 0 0',
                    padding: '16px 20px',
                  }}>
                    <Title level={4} style={{ color: 'white', margin: 0 }}>{phase.name}</Title>
                    <Text style={{ color: '#FFD500', fontSize: 12 }}>
                      {phase.pointsPerGame} ponto{phase.pointsPerGame !== 1 ? 's' : ''} por jogo
                    </Text>
                  </div>

                  <div style={{ padding: '16px 20px' }}>
                    <div style={{ marginBottom: 16 }}>
                      <Tag
                        color={open ? 'success' : 'default'}
                        icon={<CalendarOutlined />}
                        style={{ marginBottom: 4 }}
                      >
                        {open ? 'Aberto' : 'Fechado'}
                      </Tag>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {open
                            ? `Fecha ${dayjs(closingDate).fromNow()}`
                            : `Encerrou ${dayjs(closingDate).fromNow()}`}
                        </Text>
                      </div>
                    </div>

                    <Row gutter={16} style={{ marginBottom: 16 }}>
                      <Col span={12}>
                        <Statistic
                          title="Jogos"
                          value={matches.length}
                          valueStyle={{ color: '#0033A0', fontSize: 28 }}
                        />
                      </Col>
                      <Col span={12}>
                        {isAdmin ? (
                          <Statistic
                            title="Encerrados"
                            value={finished}
                            valueStyle={{ color: '#008B46', fontSize: 28 }}
                          />
                        ) : (
                          <Statistic
                            title="Seus palpites"
                            value={phaseBets.length}
                            valueStyle={{ color: '#008B46', fontSize: 28 }}
                          />
                        )}
                      </Col>
                    </Row>

                    {isAdmin ? (
                      <Button
                        type="primary"
                        block
                        href="/admin"
                        style={{ fontWeight: 600, background: '#0033A0', borderColor: '#0033A0' }}
                      >
                        Gerenciar Jogos
                      </Button>
                    ) : (
                      <Button
                        type={open ? 'primary' : 'default'}
                        block
                        disabled={!open}
                        href="/palpites"
                        style={{ fontWeight: 600 }}
                      >
                        {open ? 'Fazer Palpites' : 'Fase Encerrada'}
                      </Button>
                    )}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* How it works */}
      <Alert
        style={{ marginTop: 32, borderRadius: 12 }}
        icon={<ThunderboltOutlined />}
        type="success"
        showIcon
        message={<Text strong style={{ color: '#008B46' }}>Como funciona a pontuação</Text>}
        description={
          <ul style={{ paddingLeft: 16, marginBottom: 0, marginTop: 8 }}>
            <li>✅ Acerte o resultado → ganhe os pontos da fase</li>
            <li>🎯 Crave o placar exato → ganhe 3× mais pontos!</li>
            <li>⏰ Respeite o horário de fechamento da fase</li>
            <li>📊 Acompanhe sua posição no ranking em tempo real</li>
          </ul>
        }
      />
    </div>
  );
}

export default Dashboard;
