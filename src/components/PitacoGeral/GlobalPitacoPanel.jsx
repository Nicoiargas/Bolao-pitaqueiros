import React from 'react';
import { Card, Tag, Typography, Space } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import FlagImage from '../FlagImage';
import { GLOBAL_BET_CLOSING, calcGlobalPoints } from '../../services/globalBetService';

const { Text } = Typography;

const hitExact   = (val, target)    => Boolean(val) && Boolean(target) && val === target;
const hitVariant = (val, variants)  => Boolean(val) && Boolean(variants?.includes(val));

function GlobalPitacoPanel({ users, globalBets, globalResults }) {
  const isClosed = dayjs().isAfter(dayjs(GLOBAL_BET_CLOSING));
  if (!isClosed) return null;

  const rows = users
    .filter(u => u.role !== 'admin')
    .map(user => {
      const bet = globalBets.find(b => b.user_id === user.uid) ?? null;
      const pts = calcGlobalPoints(bet, globalResults);
      return { user, bet, pts };
    })
    .sort((a, b) => b.pts - a.pts || (a.user.displayName || '').localeCompare(b.user.displayName || ''));

  if (rows.length === 0) return null;

  return (
    <Card
      style={{ borderRadius: 14, marginBottom: 24, border: '2px solid #FFD500' }}
      styles={{ header: { background: 'linear-gradient(90deg, #008B46, #0033A0)', borderRadius: '10px 10px 0 0' } }}
      title={
        <Space>
          <TrophyOutlined style={{ color: '#FFD500' }} />
          <Text strong style={{ color: 'white' }}>Palpites Globais de Todos</Text>
        </Space>
      }
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {rows.map(({ user, bet, pts }) => (
          <div key={user.uid} style={{ border: '1px solid #ebebeb', borderRadius: 10, padding: '10px 14px', minWidth: 220 }}>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>{user.displayName || user.email}</Text>
            {!bet ? (
              <Text type="secondary" style={{ fontStyle: 'italic', fontSize: 12 }}>sem palpite global</Text>
            ) : (
              <Space direction="vertical" size={4}>
                <Space size={4}>
                  <FlagImage name={bet.champion} height={12} />
                  <Tag color={hitExact(bet.champion, globalResults?.champion) ? 'success' : 'default'} style={{ margin: 0 }}>
                    🏆 {bet.champion || '—'}
                  </Tag>
                </Space>
                <Tag color={hitVariant(bet.top_scorer, globalResults?.topScorerVariants) ? 'success' : 'default'} style={{ margin: 0 }}>
                  ⚽ {bet.top_scorer || '—'}
                </Tag>
                <Tag color={hitVariant(bet.top_assists, globalResults?.topAssistsVariants) ? 'success' : 'default'} style={{ margin: 0 }}>
                  🎯 {bet.top_assists || '—'}
                </Tag>
                <Space size={4}>
                  <FlagImage name={bet.most_goals_team} height={12} />
                  <Tag color={hitExact(bet.most_goals_team, globalResults?.mostGoalsTeam) ? 'success' : 'default'} style={{ margin: 0 }}>
                    🔥 {bet.most_goals_team || '—'}
                  </Tag>
                </Space>
                <Tag color={pts > 0 ? 'green' : 'default'} style={{ marginTop: 2, fontWeight: 700 }}>
                  {pts} pts
                </Tag>
              </Space>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

export default GlobalPitacoPanel;
