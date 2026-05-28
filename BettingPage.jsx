// src/components/Palpites/BettingPage.jsx
import React, { useState, useEffect } from 'react';
import {
  getAllPhases,
  getMatchesByPhase,
  getBetByUserAndMatch,
  placeBet,
  updateBet,
  deleteBet,
} from '../../services/gameService';
import { Trophy, Lock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function BettingPage({ user }) {
  const [phases, setPhases] = useState([]);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [matches, setMatches] = useState([]);
  const [bets, setBets] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPhases();
  }, [user]);

  useEffect(() => {
    if (selectedPhase) {
      loadMatches(selectedPhase);
    }
  }, [selectedPhase]);

  const loadPhases = async () => {
    try {
      setLoading(true);
      const phasesData = await getAllPhases();
      const openPhases = phasesData.filter(p => isPhaseOpen(p.closingDate));
      setPhases(phasesData);
      if (openPhases.length > 0) {
        setSelectedPhase(openPhases[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar fases:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async (phaseId) => {
    try {
      setLoading(true);
      const matchesData = await getMatchesByPhase(phaseId);
      setMatches(matchesData);

      // Carregar palpites existentes
      const betsData = {};
      for (const match of matchesData) {
        const existingBet = await getBetByUserAndMatch(user.uid, match.id);
        if (existingBet) {
          betsData[match.id] = {
            home: existingBet.homeGoals,
            away: existingBet.awayGoals,
            id: existingBet.id,
          };
        } else {
          betsData[match.id] = { home: '', away: '', id: null };
        }
      }
      setBets(betsData);
    } catch (error) {
      console.error('Erro ao carregar matches:', error);
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

  const handleBetChange = (matchId, field, value) => {
    const numValue = value === '' ? '' : parseInt(value);
    setBets({
      ...bets,
      [matchId]: {
        ...bets[matchId],
        [field]: numValue,
      },
    });
  };

  const handleSaveBet = async (matchId) => {
    const bet = bets[matchId];
    if (bet.home === '' || bet.away === '') {
      alert('Preencha ambos os placares');
      return;
    }

    setSaving(true);
    try {
      const phase = phases.find(p => p.id === selectedPhase);
      
      if (bet.id) {
        // Atualizar palpite existente
        await updateBet(bet.id, bet.home, bet.away);
      } else {
        // Criar novo palpite
        const newBetId = await placeBet(user.uid, matchId, bet.home, bet.away, selectedPhase);
        setBets({
          ...bets,
          [matchId]: {
            ...bet,
            id: newBetId,
          },
        });
      }
      alert('Palpite salvo com sucesso! 🎯');
    } catch (error) {
      alert('Erro ao salvar palpite: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBet = async (matchId) => {
    const bet = bets[matchId];
    if (!bet.id) return;

    if (!window.confirm('Tem certeza que quer deletar este palpite?')) return;

    try {
      await deleteBet(bet.id);
      setBets({
        ...bets,
        [matchId]: { home: '', away: '', id: null },
      });
      alert('Palpite deletado!');
    } catch (error) {
      alert('Erro ao deletar palpite: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brasil-verde border-t-brasil-amarelo rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-brasil-verde font-bold">Carregando jogos...</p>
        </div>
      </div>
    );
  }

  const currentPhase = phases.find(p => p.id === selectedPhase);
  const isPhaseActive = currentPhase && isPhaseOpen(currentPhase.closingDate);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-brasil-verde to-brasil-azul text-white rounded-2xl p-6 mb-8 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-8 h-8" fill="currentColor" />
          <h1 className="text-3xl font-bold">Seus Palpites</h1>
        </div>
        <p className="text-brasil-amarelo">
          Escolha uma fase e faça seus palpites nos jogos!
        </p>
      </div>

      {/* Phase Selector */}
      {phases.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-brasil-verde mb-4">Escolha a Fase</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {phases.map((phase) => {
              const isOpen = isPhaseOpen(phase.closingDate);
              return (
                <button
                  key={phase.id}
                  onClick={() => setSelectedPhase(phase.id)}
                  disabled={!isOpen}
                  className={`p-3 rounded-lg font-bold transition ${
                    selectedPhase === phase.id
                      ? 'bg-brasil-verde text-white shadow-lg'
                      : isOpen
                      ? 'bg-white border-2 border-brasil-verde text-brasil-verde hover:bg-brasil-verde hover:text-white'
                      : 'bg-gray-200 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {phase.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Current Phase Info */}
      {currentPhase && (
        <div className={`mb-8 p-4 rounded-lg border-l-4 flex items-start gap-3 ${
          isPhaseActive
            ? 'bg-green-50 border-brasil-verde'
            : 'bg-red-50 border-red-500'
        }`}>
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: isPhaseActive ? '#008B46' : '#ef4444' }} />
          <div>
            <p className={`font-bold ${isPhaseActive ? 'text-brasil-verde' : 'text-red-600'}`}>
              {isPhaseActive ? 'Fase Aberta' : 'Fase Fechada'}
            </p>
            <p className={`text-sm ${isPhaseActive ? 'text-brasil-verde' : 'text-red-600'}`}>
              {isPhaseActive ? `Fechamento ${timeUntilClosing(currentPhase.closingDate)}` : 'Você não pode mais fazer palpites nesta fase'}
            </p>
          </div>
        </div>
      )}

      {/* Matches Grid */}
      {matches.length > 0 ? (
        <div className="space-y-4">
          {matches.map((match) => {
            const bet = bets[match.id];
            const isFinished = match.status === 'finished';

            return (
              <div
                key={match.id}
                className="bg-white rounded-xl shadow-lg p-4 md:p-6 hover:shadow-xl transition"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  {/* Match Info */}
                  <div className="text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm text-gray-600">
                        {new Date(match.date.seconds * 1000).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-xl font-bold text-brasil-azul">
                        {match.homeTeam}
                      </p>
                      <p className="text-xl font-bold text-brasil-azul">
                        vs
                      </p>
                      <p className="text-xl font-bold text-brasil-azul">
                        {match.awayTeam}
                      </p>
                    </div>
                  </div>

                  {/* Betting Inputs */}
                  <div className="flex justify-center items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max="9"
                      value={bet?.home ?? ''}
                      onChange={(e) => handleBetChange(match.id, 'home', e.target.value)}
                      disabled={isFinished || !isPhaseActive}
                      placeholder="0"
                      className="w-16 h-16 text-3xl font-bold text-center rounded-lg border-2 border-brasil-verde focus:outline-none focus:border-brasil-azul disabled:bg-gray-200 disabled:cursor-not-allowed"
                    />
                    <p className="text-2xl font-bold text-brasil-verde">x</p>
                    <input
                      type="number"
                      min="0"
                      max="9"
                      value={bet?.away ?? ''}
                      onChange={(e) => handleBetChange(match.id, 'away', e.target.value)}
                      disabled={isFinished || !isPhaseActive}
                      placeholder="0"
                      className="w-16 h-16 text-3xl font-bold text-center rounded-lg border-2 border-brasil-verde focus:outline-none focus:border-brasil-azul disabled:bg-gray-200 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 justify-center md:justify-end">
                    {isFinished ? (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Lock className="w-5 h-5" />
                        <span className="text-sm font-bold">Encerrado</span>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleSaveBet(match.id)}
                          disabled={saving || !isPhaseActive}
                          className="bg-brasil-verde text-white px-4 py-2 rounded-lg font-bold hover:bg-brasil-azul transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {bet?.id ? '✓ Atualizar' : '+ Salvar'}
                        </button>
                        {bet?.id && (
                          <button
                            onClick={() => handleDeleteBet(match.id)}
                            disabled={saving}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-600 transition disabled:opacity-50"
                          >
                            ✕
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Result Display */}
                {isFinished && (
                  <div className="mt-4 pt-4 border-t-2 border-gray-200 text-center">
                    <p className="text-sm text-gray-600 mb-2">Resultado Final</p>
                    <p className="text-2xl font-bold text-brasil-verde">
                      {match.homeGoals} x {match.awayGoals}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-brasil-amarelo mx-auto mb-4" />
          <p className="text-xl text-brasil-verde font-bold">
            Nenhum jogo nesta fase
          </p>
        </div>
      )}
    </div>
  );
}

export default BettingPage;
