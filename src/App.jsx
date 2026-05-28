import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Spin } from 'antd';
import { onAuthChange, isAdmin } from './services/authService';
import Navigation from './components/Nav/Navigation';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ResetPassword from './components/Auth/ResetPassword';
import Dashboard from './components/Dashboard/Dashboard';
import BettingPage from './components/Palpites/BettingPage';
import Ranking from './components/Ranking/Ranking';
import AdminPanel from './components/Admin/AdminPanel';
import './styles/global.css';

function App() {
  const [user, setUser]               = useState(null);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [loading, setLoading]         = useState(true);
  const [showReset, setShowReset]     = useState(false);

  useEffect(() => {
    if (window.location.hostname === 'localhost') {
      setUser({ uid: 'dev', email: 'dev@localhost', displayName: 'Dev', role: 'admin', totalPoints: 0 });
      setUserIsAdmin(true);
      setLoading(false);
      return;
    }

    // Detecta recovery direto na URL (antes de qualquer listener)
    const params = new URLSearchParams(window.location.hash.substring(1));
    if (params.get('type') === 'recovery' && params.get('access_token')) {
      setShowReset(true);
      setLoading(false);
      return;
    }

    const fallback = setTimeout(() => setLoading(false), 6000);

    const unsubscribe = onAuthChange(async (currentUser, isRecovery) => {
      clearTimeout(fallback);
      if (isRecovery) {
        setShowReset(true);
        setLoading(false);
        return;
      }
      setUser(currentUser);
      if (currentUser) {
        setUserIsAdmin(currentUser.role === 'admin');
      } else {
        setUserIsAdmin(false);
      }
      setLoading(false);
    });
    return () => { unsubscribe(); clearTimeout(fallback); };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Spin size="large" tip="Carregando..." />
      </div>
    );
  }

  if (showReset) {
    return <ResetPassword onDone={() => { setShowReset(false); setUser(null); }} />;
  }

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login"          element={<Login />} />
          <Route path="/register"       element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*"               element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Navigation user={user} isAdmin={userIsAdmin} />
        <Layout.Content style={{ background: '#f5f5f5' }}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/palpites"  element={userIsAdmin ? <Navigate to="/dashboard" /> : <BettingPage user={user} />} />
            <Route path="/ranking"   element={<Ranking />} />
            <Route path="/admin/*"   element={userIsAdmin ? <AdminPanel /> : <Navigate to="/dashboard" />} />
            <Route path="*"          element={<Navigate to="/dashboard" />} />
          </Routes>
        </Layout.Content>
      </Layout>
    </Router>
  );
}

export default App;
