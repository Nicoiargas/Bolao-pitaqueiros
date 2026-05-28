import React from 'react';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { LockOutlined, TrophyOutlined } from '@ant-design/icons';
import { supabase } from '../../services/supabase';

const { Title, Text } = Typography;

function ResetPassword({ onDone }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const onFinish = async ({ password }) => {
    setError('');
    setLoading(true);
    try {
      const result = await Promise.race([
        supabase.auth.updateUser({ password }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Tempo esgotado. Verifique sua conexão e tente novamente.')), 10000)),
      ]);
      if (result.error) throw result.error;
      await supabase.auth.signOut();
      if (onDone) onDone();
    } catch (err) {
      setError(err.message || 'Erro ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #008B46 0%, #ffffff 55%, #FFD500 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <TrophyOutlined style={{ fontSize: 64, color: '#008B46' }} />
          <Title level={2} style={{ color: '#008B46', margin: '12px 0 4px' }}>
            Nova Senha
          </Title>
          <Text type="secondary">Digite sua nova senha abaixo</Text>
        </div>

        <Card
          style={{ borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}
          styles={{ body: { padding: 32 } }}
        >
          {error && (
            <Alert message={error} type="error" showIcon style={{ marginBottom: 20 }} />
          )}

          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="password"
              label="Nova senha"
              rules={[{ required: true, min: 6, message: 'Mínimo 6 caracteres' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#008B46' }} />}
                placeholder="••••••••"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="confirm"
              label="Confirmar senha"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Confirme a senha' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) return Promise.resolve();
                    return Promise.reject(new Error('As senhas não coincidem'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#008B46' }} />}
                placeholder="••••••••"
                size="large"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                style={{ fontWeight: 700 }}
              >
                Salvar nova senha
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}

export default ResetPassword;
