import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Select, Alert, Table, Tag, Space, Typography } from 'antd';
import { TrophyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { getFlagUrl } from '../../services/flags';
import {
  getGlobalResults, saveGlobalResults, getAllGlobalBets, calcGlobalPoints,
  GLOBAL_BET_POINTS, TEAMS,
} from '../../services/globalBetService';

const { Text } = Typography;
const TEAM_OPTIONS = TEAMS.map(t => ({ value: t, label: t }));

const FlagOption = ({ name }) => {
  const url = getFlagUrl(name);
  return (
    <span>
      {url && <img src={url} height={14} alt="" style={{ marginRight: 6, borderRadius: 2, verticalAlign: 'middle' }} />}
      {name}
    </span>
  );
};

function GlobalBetManager() {
  const [form] = Form.useForm();
  const [results, setResults] = useState(null);
  const [bets, setBets]       = useState([]);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    Promise.all([getGlobalResults(), getAllGlobalBets()])
      .then(([r, b]) => {
        setResults(r);
        setBets(b);
        if (r) form.setFieldsValue({
          champion:      r.champion,
          topScorer:     r.topScorer,
          topAssists:    r.topAssists,
          mostGoalsTeam: r.mostGoalsTeam,
        });
      });
  }, []);

  const onFinish = async (values) => {
    setError('');
    setSaving(true);
    try {
      await saveGlobalResults(values);
      setResults(values);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Erro ao salvar resultados.');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { title: 'Usuário',    dataIndex: 'user_id',        key: 'user',   ellipsis: true },
    { title: '🏆 Campeão', dataIndex: 'champion',       key: 'champ',  render: v => <Tag color={results?.champion === v ? 'success' : 'default'}>{v}</Tag> },
    { title: '⚽ Artilheiro', dataIndex: 'top_scorer',  key: 'scorer', render: v => <Tag color={results?.topScorer === v ? 'success' : 'default'}>{v}</Tag> },
    { title: '🎯 Assistente', dataIndex: 'top_assists', key: 'assist', render: v => <Tag color={results?.topAssists === v ? 'success' : 'default'}>{v}</Tag> },
    { title: '🔥 + Gols',  dataIndex: 'most_goals_team', key: 'goals', render: v => <Tag color={results?.mostGoalsTeam === v ? 'success' : 'default'}>{v}</Tag> },
    { title: 'Pts',        key: 'pts', render: (_, r) => {
      const pts = calcGlobalPoints(r, results);
      return <Text strong style={{ color: pts > 0 ? '#008B46' : '#999' }}>{pts}</Text>;
    }},
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Card title={<Space><TrophyOutlined style={{ color: '#FFD500' }} />Resultados do Palpite Global</Space>} style={{ borderRadius: 12 }}>
        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 12 }} />}
        {saved && <Alert type="success" message="Resultados salvos! Clique em 'Recalcular Pontuação' no topo." showIcon style={{ marginBottom: 12 }} />}

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="champion" label="🏆 Time Campeão (+20 pts)">
            <Select
              showSearch
              placeholder="Selecione"
              options={TEAM_OPTIONS}
              allowClear
              optionFilterProp="label"
              optionRender={(opt) => <FlagOption name={opt.data.value} />}
              labelRender={({ value }) => value ? <FlagOption name={value} /> : null}
            />
          </Form.Item>
          <Form.Item name="topScorer" label="⚽ Maior Artilheiro (+15 pts)">
            <Input placeholder="Nome do jogador" />
          </Form.Item>
          <Form.Item name="topAssists" label="🎯 Maior Assistente (+15 pts)">
            <Input placeholder="Nome do jogador" />
          </Form.Item>
          <Form.Item name="mostGoalsTeam" label="🔥 Time com Mais Gols (+10 pts)">
            <Select
              showSearch
              placeholder="Selecione"
              options={TEAM_OPTIONS}
              allowClear
              optionFilterProp="label"
              optionRender={(opt) => <FlagOption name={opt.data.value} />}
              labelRender={({ value }) => value ? <FlagOption name={value} /> : null}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={saving}>Salvar Resultados</Button>
          </Form.Item>
        </Form>
      </Card>

      {bets.length > 0 && (
        <Card title={`Palpites recebidos (${bets.length})`} style={{ borderRadius: 12 }}>
          <Table
            size="small"
            dataSource={bets.map(b => ({ ...b, key: b.id }))}
            columns={columns}
            pagination={false}
            scroll={{ x: true }}
          />
        </Card>
      )}
    </Space>
  );
}

export default GlobalBetManager;
