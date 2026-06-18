import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Drawer, Space, Avatar, Typography } from 'antd';
import {
  TrophyOutlined, DashboardOutlined, BarChartOutlined,
  SettingOutlined, LogoutOutlined, MenuOutlined, UnorderedListOutlined,
} from '@ant-design/icons';
import { logoutUser } from '../../services/authService';

const { Text } = Typography;

function Navigation({ user, isAdmin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await logoutUser();
    window.location.href = '/login';
  };

  const currentKey = location.pathname.startsWith('/admin') ? '/admin'
    : location.pathname.startsWith('/palpites') ? '/palpites'
    : location.pathname.startsWith('/pitaco-geral') ? '/pitaco-geral'
    : location.pathname.startsWith('/ranking') ? '/ranking'
    : '/dashboard';

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">Dashboard</Link>,
    },
    ...(!isAdmin ? [{
      key: '/palpites',
      icon: <TrophyOutlined />,
      label: <Link to="/palpites">Palpites</Link>,
    }] : []),
    {
      key: '/ranking',
      icon: <BarChartOutlined />,
      label: <Link to="/ranking">Ranking</Link>,
    },
    {
      key: '/pitaco-geral',
      icon: <UnorderedListOutlined />,
      label: <Link to="/pitaco-geral">Pitaco Geral</Link>,
    },
    ...(isAdmin ? [{
      key: '/admin',
      icon: <SettingOutlined />,
      label: <Link to="/admin">Admin</Link>,
    }] : []),
  ];

  const initials = (user.displayName || user.email || 'P')[0].toUpperCase();

  return (
    <Layout.Header className="brand-header">
      {/* Logo */}
      <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <TrophyOutlined style={{ fontSize: 26, color: '#FFD500' }} />
        <Text strong style={{ color: 'white', fontSize: 17, whiteSpace: 'nowrap' }}>
          Bolão dos Pitaqueiros
        </Text>
      </Link>

      {/* Desktop menu */}
      <div className="desktop-only" style={{ flex: 1, justifyContent: 'center' }}>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[currentKey]}
          items={menuItems}
          style={{ background: 'transparent', border: 'none', minWidth: 320 }}
        />
      </div>

      {/* Desktop user + logout */}
      <div className="desktop-only" style={{ alignItems: 'center', gap: 12 }}>
        <Avatar style={{ backgroundColor: '#FFD500', color: '#008B46', fontWeight: 700 }}>
          {initials}
        </Avatar>
        <Text style={{ color: 'rgba(255,255,255,0.85)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.displayName || user.email}
        </Text>
        <Button
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          style={{ background: '#FFD500', border: 'none', color: '#008B46', fontWeight: 700 }}
        >
          Sair
        </Button>
      </div>

      {/* Mobile hamburger */}
      <Button
        className="mobile-only"
        icon={<MenuOutlined />}
        onClick={() => setDrawerOpen(true)}
        style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.5)', color: 'white' }}
      />

      {/* Mobile drawer */}
      <Drawer
        title={
          <Space>
            <TrophyOutlined style={{ color: '#008B46' }} />
            <span style={{ color: '#008B46', fontWeight: 700 }}>Bolão dos Pitaqueiros</span>
          </Space>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement="right"
        width={260}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space>
            <Avatar style={{ backgroundColor: '#008B46', color: 'white', fontWeight: 700 }}>
              {initials}
            </Avatar>
            <Text strong style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.displayName || user.email}
            </Text>
          </Space>
          <Menu
            mode="inline"
            selectedKeys={[currentKey]}
            items={menuItems}
            onClick={() => setDrawerOpen(false)}
          />
          <Button
            block
            danger
            icon={<LogoutOutlined />}
            onClick={() => { handleLogout(); setDrawerOpen(false); }}
          >
            Sair
          </Button>
        </Space>
      </Drawer>
    </Layout.Header>
  );
}

export default Navigation;
