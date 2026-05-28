// src/components/Ranking/Ranking.jsx
import React, { useState, useEffect } from 'react';
import { getRanking } from '../../services/gameService';
import { Trophy, Medal } from 'lucide-react';

function Ranking() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRanking();
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadRanking, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadRanking = async () => {
    try {
      setLoading(true);
      const rankingData = await getRanking();
      setRanking(rankingData);
    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (position) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return '📍';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brasil-verde border-t-brasil-amarelo rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-brasil-verde font-bold">Carregando ranking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-brasil-verde to-brasil-azul text-white rounded-2xl p-8 mb-8 shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <Trophy className="w-12 h-12" fill="currentColor" />
          <div>
            <h1 className="text-4xl font-bold">Ranking do Hexa</h1>
            <p className="text-brasil-amarelo font-semibold text-lg">
              Quem será o campeão dos palpiteiros? 👑
            </p>
          </div>
        </div>
      </div>

      {/* Ranking Table */}
      {ranking.length > 0 ? (
        <div className="space-y-3">
          {ranking.map((user, index) => (
            <div
              key={index}
              className={`rounded-xl shadow-lg p-4 md:p-6 flex items-center gap-4 transition hover:shadow-xl ${
                index < 3
                  ? 'bg-gradient-to-r from-brasil-verde to-brasil-azul text-white'
                  : 'bg-white'
              }`}
            >
              {/* Position */}
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                  index < 3
                    ? 'bg-brasil-amarelo text-brasil-verde'
                    : 'bg-brasil-amarelo bg-opacity-20 text-brasil-verde'
                }`}>
                  {getMedalEmoji(index + 1)}
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-lg md:text-xl truncate ${
                  index < 3 ? 'text-white' : 'text-brasil-verde'
                }`}>
                  {index + 1}º - {user.displayName || user.email}
                </p>
                <p className={`text-sm ${
                  index < 3 ? 'text-brasil-amarelo' : 'text-gray-600'
                }`}>
                  {user.email}
                </p>
              </div>

              {/* Points */}
              <div className={`flex-shrink-0 text-right ${
                index < 3 ? 'text-brasil-amarelo' : 'text-brasil-verde'
              }`}>
                <p className="text-3xl font-bold">{user.totalPoints || 0}</p>
                <p className={`text-xs font-semibold ${
                  index < 3 ? 'text-white' : 'text-gray-600'
                }`}>
                  pontos
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <Trophy className="w-16 h-16 text-brasil-amarelo mx-auto mb-4" />
          <p className="text-xl text-brasil-verde font-bold">
            Ainda não há palpiteiros no sistema
          </p>
          <p className="text-gray-600 mt-2">
            Faça seus palpites para aparecer no ranking!
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-12 bg-brasil-verde bg-opacity-10 border-l-4 border-brasil-verde p-6 rounded-lg">
        <h3 className="font-bold text-brasil-verde mb-3 flex items-center gap-2">
          <Medal className="w-5 h-5" />
          Como a pontuação funciona
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-brasil-azul">
          <div>
            <p className="font-bold text-brasil-verde mb-1">✅ Acertou o resultado</p>
            <p>Você ganha os pontos da fase</p>
          </div>
          <div>
            <p className="font-bold text-brasil-verde mb-1">🎯 Cravou o placar</p>
            <p>Você ganha 3x mais pontos!</p>
          </div>
          <div>
            <p className="font-bold text-brasil-verde mb-1">📊 Fases diferentes</p>
            <p>Cada fase vale mais pontos</p>
          </div>
          <div>
            <p className="font-bold text-brasil-verde mb-1">⏰ Respeite o horário</p>
            <p>Não pode chutar após fechamento</p>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="text-center mt-8">
        <button
          onClick={loadRanking}
          className="bg-brasil-verde text-white px-6 py-3 rounded-lg font-bold hover:bg-brasil-azul transition"
        >
          🔄 Atualizar Ranking
        </button>
      </div>
    </div>
  );
}

export default Ranking;
