// src/components/Admin/AdminPanel.jsx
import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Settings, Plus, Edit2 } from 'lucide-react';
import PhaseManager from './PhaseManager';
import MatchManager from './MatchManager';

function AdminPanel({ user }) {
  const location = useLocation();
  const isPhases = location.pathname === '/admin' || location.pathname === '/admin/';
  const isMatches = location.pathname === '/admin/matches';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-brasil-verde to-brasil-azul text-white rounded-2xl p-8 mb-8 shadow-lg">
        <div className="flex items-center gap-4">
          <Settings className="w-10 h-10" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Painel de Administração</h1>
            <p className="text-brasil-amarelo">Gerencie as fases e jogos da Copa</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-8">
        <Link
          to="/admin"
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition ${
            isPhases
              ? 'bg-brasil-verde text-white shadow-lg'
              : 'bg-white border-2 border-brasil-verde text-brasil-verde hover:bg-brasil-verde hover:text-white'
          }`}
        >
          <Plus className="w-5 h-5" />
          Fases
        </Link>
        <Link
          to="/admin/matches"
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition ${
            isMatches
              ? 'bg-brasil-verde text-white shadow-lg'
              : 'bg-white border-2 border-brasil-verde text-brasil-verde hover:bg-brasil-verde hover:text-white'
          }`}
        >
          <Edit2 className="w-5 h-5" />
          Jogos
        </Link>
      </div>

      {/* Content */}
      <Routes>
        <Route path="/" element={<PhaseManager />} />
        <Route path="/matches" element={<MatchManager />} />
      </Routes>
    </div>
  );
}

export default AdminPanel;
