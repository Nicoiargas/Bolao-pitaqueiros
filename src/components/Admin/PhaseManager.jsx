import React, { useState, useEffect } from 'react';
import {
  Table, Button, Modal, Form, Select, InputNumber, DatePicker,
  Space, Tag, Popconfirm, Typography, App, Empty,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { createPhase, getAllPhases, updatePhase, deletePhase, getPhaseCompletionStats } from '../../services/gameService';
import { PHASES } from '../../services/pointsService';

const { Text } = Typography;

const toDate = (val) => {
  if (!val) return null;
  if (val?.seconds) return new Date(val.seconds * 1000);
  return new Date(val);
};

function PhaseManager() {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();
  const [phases, setPhases] = useState([]);
  const [stats, setStats]   = useState({});
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadPhases(); }, []);

  const loadPhases = async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([getAllPhases(), getPhaseCompletionStats()]);
      setPhases(p);
      setStats(s);
    } catch {
      message.error('Erro ao carregar fases');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingPhase(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (phase) => {
    setEditingPhase(phase);
    form.setFieldsValue({
      name: phase.name,
      pointsPerGame: phase.pointsPerGame,
      closingDate: dayjs(toDate(phase.closingDate)),
    });
    setModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const date = values.closingDate.toDate();

      if (editingPhase) {
        await updatePhase(editingPhase.id, {
          name: values.name,
          pointsPerGame: values.pointsPerGame,
          closingDate: date,
        });
        message.success('Fase atualizada!');
      } else {
        await createPhase(values.name, values.pointsPerGame, date);
        message.success('Fase criada!');
      }
      setModalOpen(false);
      loadPhases();
    } catch (err) {
      if (err?.errorFields) return; // validation error, keep modal open
      message.error('Erro ao salvar fase');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (phaseId) => {
    modal.confirm({
      title: 'Deletar fase?',
      content: 'Todos os dados desta fase podem ser afetados.',
      okText: 'Sim, deletar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: async () => {
        await deletePhase(phaseId);
        message.success('Fase deletada');
        loadPhases();
      },
    });
  };

  const isOpen = (closingDate) => new Date() < toDate(closingDate);

  const columns = [
    {
      title: 'Fase',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <Text strong style={{ color: '#0033A0' }}>{name}</Text>,
    },
    {
      title: 'Pontos/Jogo',
      dataIndex: 'pointsPerGame',
      key: 'points',
      width: 120,
      render: (pts) => <Tag color="blue">{pts} pt{pts !== 1 ? 's' : ''}</Tag>,
    },
    {
      title: 'Fechamento',
      dataIndex: 'closingDate',
      key: 'closing',
      render: (date) => (
        <Text>{dayjs(toDate(date)).format('DD/MM/YYYY HH:mm')}</Text>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_, record) => (
        <Tag color={isOpen(record.closingDate) ? 'success' : 'default'}>
          {isOpen(record.closingDate) ? 'Aberta' : 'Fechada'}
        </Tag>
      ),
    },
    {
      title: 'Completos',
      key: 'completed',
      width: 130,
      render: (_, record) => {
        const s = stats[record.id];
        if (!s) return <Text type="secondary">—</Text>;
        const allDone = s.completed === s.totalUsers;
        return (
          <Tag color={allDone ? 'success' : s.completed > 0 ? 'processing' : 'default'}>
            {s.completed}/{s.totalUsers} jogadores
          </Tag>
        );
      },
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEdit(record)}
            style={{ color: '#008B46', borderColor: '#008B46' }}
          />
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Criar Nova Fase
        </Button>
      </div>

      <Table
        dataSource={phases}
        columns={columns}
        rowKey="id"
        loading={loading}
        locale={{ emptyText: <Empty description="Nenhuma fase criada ainda" /> }}
        pagination={false}
      />

      <Modal
        title={editingPhase ? 'Editar Fase' : 'Criar Nova Fase'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        okText={editingPhase ? 'Atualizar' : 'Criar'}
        confirmLoading={saving}
        destroyOnClose
        width={480}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Nome da fase"
            rules={[{ required: true, message: 'Selecione a fase' }]}
          >
            <Select placeholder="Selecione uma fase" size="large">
              {PHASES.map(p => (
                <Select.Option key={p} value={p}>{p}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="pointsPerGame"
            label="Pontos por jogo"
            rules={[{ required: true, message: 'Informe os pontos' }]}
          >
            <InputNumber
              min={0.5}
              step={0.5}
              size="large"
              style={{ width: '100%' }}
              addonAfter="pontos"
            />
          </Form.Item>

          <Form.Item
            name="closingDate"
            label="Data e hora de fechamento"
            rules={[{ required: true, message: 'Informe a data de fechamento' }]}
            extra="Após este horário, pitaqueiros não poderão mais fazer palpites"
          >
            <DatePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              size="large"
              style={{ width: '100%' }}
              placeholder="Selecione data e hora"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default PhaseManager;
