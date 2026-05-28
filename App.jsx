// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthChange, isAdmin } from './services/authService';
import Navigation from './components/Nav/Navigation';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import BettingPage from './components/Palpites/BettingPage';
import Ranking from './components/Ranking/Ranking';
import AdminPanel from './components/Admin/AdminPanel';
import './styles/global.css';

function App() {
  const [user, setUser] = useState(null);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const admin = await isAdmin(currentUser.uid);
        setUserIsAdmin(admin);
      } else {
        setUserIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brasil-verde border-t-brasil-amarelo rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-brasil-verde font-bold">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-white">
        <Navigation user={user} isAdmin={userIsAdmin} />
        <main className="flex-1">
          <Routes>
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/palpites" element={<BettingPage user={user} />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/admin/*" element={userIsAdmin ? <AdminPanel user={user} /> : <Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
