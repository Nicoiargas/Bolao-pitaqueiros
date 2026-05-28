import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { MailOutlined, LockOutlined, TrophyOutlined } from '@ant-design/icons';
import { loginUser } from '../../services/authService';

const { Title, Text } = Typography;

function Login() {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const navigate = useNavigate();

  const onFinish = async ({ email, password }) => {
    setError('');
    setLoading(true);
    try {
      await loginUser(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Email ou senha incorretos. Verifique seus dados.');
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
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <TrophyOutlined style={{ fontSize: 64, color: '#008B46' }} />
          <Title level={2} style={{ color: '#008B46', margin: '12px 0 4px' }}>
            Bolão dos Pitaqueiros
          </Title>
          <Text type="secondary">Seu palpite, sua glória!</Text>
        </div>

        <Card
          style={{ borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}
          styles={{ body: { padding: 32 } }}
        >
          {error && (
            <Alert message={error} type="error" showIcon style={{ marginBottom: 20 }} />
          )}

          <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, type: 'email', message: 'Informe um email válido' }]}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#008B46' }} />}
                placeholder="seu@email.com"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Senha"
              rules={[{ required: true, message: 'Informe a senha' }]}
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
                Entrar
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button
              block
              size="large"
              onClick={() => navigate('/register')}
              style={{ fontWeight: 600 }}
            >
              Criar conta
            </Button>
          </div>
        </Card>

        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 16, fontSize: 12 }}>
          Bolão dos Pitaqueiros © 2025
        </Text>
      </div>
    </div>
  );
}

export default Login;
