// src/components/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { getAllPhases, getMatchesByPhase, getBetsByUser } from '../../services/gameService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trophy, Calendar, AlertCircle, Target } from 'lucide-react';

function Dashboard({ user }) {
  const [phases, setPhases] = useState([]);
  const [matchesData, setMatchesData] = useState({});
  const [userBets, setUserBets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const phasesData = await getAllPhases();
      setPhases(phasesData);

      // Carregar matches para cada fase
      const matches = {};
      for (const phase of phasesData) {
        matches[phase.id] = await getMatchesByPhase(phase.id);
      }
      setMatchesData(matches);

      // Carregar palpites do usuário
      const bets = await getBetsByUser(user.uid);
      setUserBets(bets);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const isPhaseOpen = (closingDate) => {
    return new Date() < new Date(closingDate.seconds * 1000);
  };

  const timeUntilClosing = (closingDate) => {
    const closingTime = new Date(closingDate.seconds * 1000);
    return formatDistanceToNow(closingTime, { locale: ptBR, addSuffix: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brasil-verde border-t-brasil-amarelo rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-brasil-verde font-bold">Carregando fases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brasil-verde to-brasil-azul text-white rounded-2xl p-8 mb-8 shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <Trophy className="w-10 h-10" fill="currentColor" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Bem-vindo, {user.displayName || 'Palpiteiro'}!</h1>
            <p className="text-brasil-amarelo font-semibold">Sua jornada rumo ao Hexa começou 🇧🇷</p>
          </div>
        </div>
      </div>

      {/* Phases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {phases.map((phase) => {
          const matches = matchesData[phase.id] || [];
          const phaseBets = userBets.filter(bet => bet.phaseId === phase.id);
          const isOpen = isPhaseOpen(phase.closingDate);

          return (
            <div
              key={phase.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition border-t-4"
              style={{ borderTopColor: isOpen ? '#008B46' : '#C0C0C0' }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-brasil-verde to-brasil-azul text-white p-4">
                <h2 className="text-2xl font-bold mb-1">{phase.name}</h2>
                <p className="text-brasil-amarelo text-sm font-semibold">
                  {phase.pointsPerGame} ponto{phase.pointsPerGame !== 1 ? 's' : ''} por jogo
                </p>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Closing Date */}
                <div className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${isOpen ? 'bg-green-50 border-l-4 border-brasil-verde' : 'bg-red-50 border-l-4 border-red-500'}`}>
                  <Calendar className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: isOpen ? '#008B46' : '#ef4444' }} />
                  <div className="text-sm">
                    <p className={`font-bold ${isOpen ? 'text-brasil-verde' : 'text-red-600'}`}>
                      {isOpen ? 'Aberto para palpites' : 'Fechado'}
                    </p>
                    <p className={isOpen ? 'text-brasil-verde' : 'text-red-600'}>
                      {isOpen ? `Fechamento ${timeUntilClosing(phase.closingDate)}` : 'Não há mais tempo para palpitar'}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-brasil-amarelo bg-opacity-10 p-3 rounded-lg text-center border-2 border-brasil-amarelo">
                    <p className="text-3xl font-bold text-brasil-verde">{matches.length}</p>
                    <p className="text-xs text-brasil-azul">Jogos</p>
                  </div>
                  <div className="bg-brasil-verde bg-opacity-10 p-3 rounded-lg text-center border-2 border-brasil-verde">
                    <p className="text-3xl font-bold text-brasil-verde">{phaseBets.length}</p>
                    <p className="text-xs text-brasil-azul">Seus Palpites</p>
                  </div>
                </div>

                {/* Action Button */}
                <a
                  href="/palpites"
                  className={`block w-full text-center py-3 rounded-lg font-bold transition ${
                    isOpen
                      ? 'bg-brasil-verde text-white hover:bg-brasil-azul'
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                  onClick={(e) => !isOpen && e.preventDefault()}
                >
                  {isOpen ? 'Fazer Palpites' : 'Fase Encerrada'}
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {phases.length === 0 && (
        <div className="text-center py-16">
          <AlertCircle className="w-16 h-16 text-brasil-amarelo mx-auto mb-4" />
          <p className="text-xl text-brasil-verde font-bold">
            Nenhuma fase cadastrada ainda
          </p>
          <p className="text-gray-600 mt-2">
            Aguarde o administrador abrir as fases do campeonato
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-12 bg-brasil-verde bg-opacity-10 border-l-4 border-brasil-verde p-6 rounded-lg">
        <div className="flex items-start gap-3">
          <Target className="w-6 h-6 text-brasil-verde flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-brasil-verde mb-2">Como funciona</h3>
            <ul className="text-sm text-brasil-azul space-y-1">
              <li>✅ Acerte o resultado: ganhe os pontos da fase</li>
              <li>🎯 Crave o placar: ganhe 3x mais pontos!</li>
              <li>⏰ Respeite o horário de fechamento</li>
              <li>📊 Veja seu ranking em tempo real</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
