import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Select, Alert, Tag, Space, Typography } from 'antd';
import { TrophyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getGlobalBet, saveGlobalBet, getGlobalResults, calcGlobalPoints,
  GLOBAL_BET_CLOSING, GLOBAL_BET_POINTS, TEAMS,
} from '../../services/globalBetService';

const { Text } = Typography;

const TEAM_OPTIONS = TEAMS.map(t => ({ value: t, label: t }));

function GlobalBet({ user }) {
  const [form] = Form.useForm();
  const [bet, setBet]         = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');

  const isClosed = dayjs().isAfter(dayjs(GLOBAL_BET_CLOSING));

  useEffect(() => {
    Promise.all([getGlobalBet(user.uid), getGlobalResults()])
      .then(([b, r]) => {
        setBet(b);
        setResults(r);
        if (b) form.setFieldsValue({
          champion:      b.champion,
          topScorer:     b.top_scorer,
          topAssists:    b.top_assists,
          mostGoalsTeam: b.most_goals_team,
        });
      })
      .finally(() => setLoading(false));
  }, [user.uid]);

  const onFinish = async (values) => {
    setError('');
    setSaving(true);
    try {
      await saveGlobalBet(user.uid, values);
      setBet({ champion: values.champion, top_scorer: values.topScorer, top_assists: values.topAssists, most_goals_team: values.mostGoalsTeam });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const pts = results && bet ? calcGlobalPoints(bet, results) : null;

  const resultTag = (label, betValue, resultValue) => {
    if (!resultValue) return <Tag>{betValue || '—'}</Tag>;
    const hit = betValue === resultValue;
    return (
      <Space size={4}>
        <Tag color={hit ? 'success' : 'default'}>{betValue || '—'}</Tag>
        {hit && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
      </Space>
    );
  };

  return (
    <Card
      loading={loading}
      style={{ borderRadius: 12, marginBottom: 24, border: '2px solid #FFD500' }}
      styles={{ header: { background: 'linear-gradient(90deg, #008B46, #0033A0)', borderRadius: '10px 10px 0 0' } }}
      title={
        <Space>
          <TrophyOutlined style={{ color: '#FFD500', fontSize: 20 }} />
          <Text strong style={{ color: 'white', fontSize: 16 }}>Palpite Global</Text>
          {isClosed
            ? <Tag color="red">Encerrado</Tag>
            : <Tag color="green">Fecha {dayjs(GLOBAL_BET_CLOSING).format('DD/MM [às] HH:mm')}</Tag>
          }
        </Space>
      }
    >
      {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 12 }} />}
      {saved && <Alert type="success" message="Palpite global salvo!" showIcon style={{ marginBottom: 12 }} />}

      {pts !== null && (
        <Alert
          type={pts > 0 ? 'success' : 'info'}
          showIcon
          message={`${pts / 10 >= 1 ? `${pts} pontos do palpite global` : 'Nenhum acerto no palpite global ainda'}`}
          style={{ marginBottom: 16 }}
        />
      )}

      {isClosed && bet ? (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: '🏆 Campeão',           val: bet.champion,         res: results?.champion,      pts: GLOBAL_BET_POINTS.champion },
              { label: '⚽ Artilheiro',         val: bet.top_scorer,       res: results?.topScorer,     pts: GLOBAL_BET_POINTS.topScorer },
              { label: '🎯 Assistente',         val: bet.top_assists,      res: results?.topAssists,    pts: GLOBAL_BET_POINTS.topAssists },
              { label: '🔥 Time c/ mais gols',  val: bet.most_goals_team,  res: results?.mostGoalsTeam, pts: GLOBAL_BET_POINTS.mostGoalsTeam },
            ].map(({ label, val, res, pts: p }) => (
              <Card key={label} size="small" style={{ borderRadius: 8 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>{label} (+{p} pts)</Text>
                <div style={{ marginTop: 4 }}>{resultTag(label, val, res)}</div>
              </Card>
            ))}
          </div>
        </div>
      ) : !isClosed ? (
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="champion" label="🏆 Time Campeão (+20 pts)" rules={[{ required: true, message: 'Escolha um time' }]}>
            <Select showSearch placeholder="Selecione o time" options={TEAM_OPTIONS} />
          </Form.Item>
          <Form.Item name="topScorer" label="⚽ Maior Artilheiro (+15 pts)" rules={[{ required: true, message: 'Informe o jogador' }]}>
            <Input placeholder="Nome do jogador" />
          </Form.Item>
          <Form.Item name="topAssists" label="🎯 Maior Assistente (+15 pts)" rules={[{ required: true, message: 'Informe o jogador' }]}>
            <Input placeholder="Nome do jogador" />
          </Form.Item>
          <Form.Item name="mostGoalsTeam" label="🔥 Time com Mais Gols (+10 pts)" rules={[{ required: true, message: 'Escolha um time' }]}>
            <Select showSearch placeholder="Selecione o time" options={TEAM_OPTIONS} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={saving} block size="large" style={{ fontWeight: 700 }}>
              {bet ? 'Atualizar Palpite Global' : 'Salvar Palpite Global'}
            </Button>
          </Form.Item>
        </Form>
      ) : (
        <Alert type="warning" message="Prazo encerrado e nenhum palpite registrado." showIcon />
      )}
    </Card>
  );
}

export default GlobalBet;
