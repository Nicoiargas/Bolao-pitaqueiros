import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, Alert } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { loginUser } from '../../services/authService';

const { Title, Text } = Typography;

const GREEN  = '#008B46';
const BLUE   = '#0033A0';
const YELLOW = '#FFD500';

function Login() {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [error, setError]     = React.useState('');
  const navigate = useNavigate();

  const onFinish = async ({ email, password }) => {
    setError('');
    setLoading(true);
    try {
      await loginUser(email, password);
      navigate('/dashboard');
    } catch {
      setError('Email ou senha incorretos. Verifique seus dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: `linear-gradient(160deg, ${GREEN} 0%, #005c2e 40%, ${BLUE} 100%)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
    }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <img
          src="/favicon.png"
          alt="Copa 2026"
          style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 16 }}
        />
        <Title level={2} style={{ color: 'white', margin: 0, fontSize: 26, letterSpacing: -0.5 }}>
          Bolão dos Pitaqueiros
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15 }}>
          Seu palpite, sua glória!
        </Text>
      </div>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'rgba(255,255,255,0.97)',
        borderRadius: 24,
        padding: '32px 28px 24px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
      }}>
        {error && (
          <Alert message={error} type="error" showIcon style={{ marginBottom: 20, borderRadius: 10 }} />
        )}

        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="on">
          <Form.Item
            name="email"
            label={<span style={{ fontWeight: 600, color: '#333' }}>Email</span>}
            rules={[{ required: true, type: 'email', message: 'Informe um email válido' }]}
          >
            <Input
              prefix={<MailOutlined style={{ color: GREEN }} />}
              placeholder="seu@email.com"
              size="large"
              inputMode="email"
              autoComplete="email"
              style={{ fontSize: 16, borderRadius: 10, height: 52 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ fontWeight: 600, color: '#333' }}>Senha</span>}
            rules={[{ required: true, message: 'Informe a senha' }]}
            style={{ marginBottom: 8 }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: GREEN }} />}
              placeholder="••••••••"
              size="large"
              autoComplete="current-password"
              style={{ fontSize: 16, borderRadius: 10, height: 52 }}
            />
          </Form.Item>

          <div style={{ textAlign: 'right', marginBottom: 20 }}>
            <Button
              type="link"
              onClick={() => navigate('/reset-password')}
              style={{ padding: 0, fontSize: 13, color: BLUE }}
            >
              Esqueci a senha
            </Button>
          </div>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
            style={{
              height: 54,
              fontSize: 17,
              fontWeight: 700,
              borderRadius: 12,
              background: GREEN,
              borderColor: GREEN,
              letterSpacing: 0.3,
            }}
          >
            Entrar
          </Button>
        </Form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#e8e8e8' }} />
          <Text style={{ color: '#bbb', fontSize: 12 }}>ou</Text>
          <div style={{ flex: 1, height: 1, background: '#e8e8e8' }} />
        </div>

        <Button
          block
          size="large"
          onClick={() => navigate('/register')}
          style={{
            height: 54,
            fontSize: 16,
            fontWeight: 600,
            borderRadius: 12,
            borderColor: BLUE,
            color: BLUE,
          }}
        >
          Criar conta
        </Button>
      </div>

      <Text style={{ color: 'rgba(255,255,255,0.4)', marginTop: 24, fontSize: 12 }}>
        Bolão dos Pitaqueiros © 2026
      </Text>
    </div>
  );
}

export default Login;
