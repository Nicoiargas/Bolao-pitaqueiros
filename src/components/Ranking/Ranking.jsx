import React, { useState, useEffect } from 'react';
import { Card, List, Avatar, Typography, Button, Spin, Empty, Space, Tag, Alert } from 'antd';
import { TrophyOutlined, ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { getRanking } from '../../services/gameService';

const { Title, Text } = Typography;

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

function Ranking() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRanking();
    const interval = setInterval(loadRanking, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadRanking = async () => {
    try {
      setLoading(true);
      setRanking(await getRanking());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <Card
        style={{ marginBottom: 24, background: 'linear-gradient(90deg, #008B46, #0033A0)', border: 'none', borderRadius: 16 }}
        styles={{ body: { padding: '20px 28px' } }}
      >
        <Space>
          <TrophyOutlined style={{ fontSize: 40, color: '#FFD500' }} />
          <div>
            <Title level={3} style={{ color: 'white', margin: 0 }}>Ranking dos Pitaqueiros</Title>
            <Text style={{ color: 'rgba(255,255,255,0.75)' }}>Quem é o melhor pitaqueiro? 👑</Text>
          </div>
        </Space>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" tip="Carregando ranking..." />
        </div>
      ) : ranking.length === 0 ? (
        <Empty
          image={<TrophyOutlined style={{ fontSize: 64, color: '#FFD500' }} />}
          description="Nenhum pitaqueiro no sistema ainda. Faça seus palpites para aparecer aqui!"
        />
      ) : (
        <List
          dataSource={ranking}
          renderItem={(rankUser, index) => {
            const position = index + 1;
            const isTop3 = position <= 3;
            const medal = MEDAL[position];

            return (
              <List.Item
                style={{
                  background: isTop3
                    ? 'linear-gradient(90deg, #008B46, #0033A0)'
                    : 'white',
                  borderRadius: 12,
                  marginBottom: 8,
                  padding: '14px 20px',
                  border: 'none',
                  boxShadow: isTop3 ? '0 4px 16px rgba(0,139,70,0.3)' : '0 1px 4px rgba(0,0,0,0.08)',
                }}
                actions={[
                  <Text
                    key="points"
                    strong
                    style={{ fontSize: 26, color: isTop3 ? '#FFD500' : '#008B46' }}
                  >
                    {rankUser.totalPoints || 0}
                    <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 4, color: isTop3 ? 'rgba(255,255,255,0.6)' : '#999' }}>
                      pts
                    </span>
                  </Text>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: isTop3 ? '#FFD500' : '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isTop3 ? 20 : 15,
                      fontWeight: 700,
                      color: isTop3 ? '#008B46' : '#666',
                      flexShrink: 0,
                    }}>
                      {medal || position}
                    </div>
                  }
                  title={
                    <Text strong style={{ color: isTop3 ? 'white' : '#0033A0', fontSize: 16 }}>
                      {rankUser.displayName || rankUser.email}
                    </Text>
                  }
                  description={
                    <Text style={{ color: isTop3 ? 'rgba(255,255,255,0.65)' : '#999', fontSize: 12 }}>
                      {rankUser.email}
                    </Text>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}

      {/* Refresh */}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Button
          icon={<ReloadOutlined />}
          onClick={loadRanking}
          loading={loading}
          type="primary"
          ghost
        >
          Atualizar Ranking
        </Button>
      </div>

      {/* Legend */}
      <Alert
        style={{ marginTop: 24, borderRadius: 12 }}
        icon={<InfoCircleOutlined />}
        type="info"
        showIcon
        message="Como funcionam os pontos"
        description={
          <ul style={{ paddingLeft: 16, margin: '8px 0 0' }}>
            <li>✅ Acertou o resultado → pontos da fase</li>
            <li>🎯 Cravou o placar exato → 3× mais pontos!</li>
            <li>📊 Cada fase vale mais que a anterior</li>
          </ul>
        }
      />
    </div>
  );
}

export default Ranking;
