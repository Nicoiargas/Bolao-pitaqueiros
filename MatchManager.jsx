// src/components/Admin/MatchManager.jsx
import React, { useState, useEffect } from 'react';
import {
  getAllPhases,
  getMatchesByPhase,
  createMatch,
  updateMatchResult,
  deleteMatch,
} from '../../services/gameService';
import { AlertCircle, Trash2, Lock } from 'lucide-react';

function MatchManager() {
  const [phases, setPhases] = useState([]);
  const [selectedPhase, setSelectedPhase] = useState('');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    homeTeam: '',
    awayTeam: '',
    matchDate: '',
  });

  useEffect(() => {
    loadPhases();
  }, []);

  useEffect(() => {
    if (selectedPhase) {
      loadMatches(selectedPhase);
    }
  }, [selectedPhase]);

  const loadPhases = async () => {
    try {
      setLoading(true);
      const phasesData = await getAllPhases();
      setPhases(phasesData);
      if (phasesData.length > 0) {
        setSelectedPhase(phasesData[0].id);
      }
    } catch (error) {
      alert('Erro ao carregar fases: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async (phaseId) => {
    try {
      setLoading(true);
      const matchesData = await getMatchesByPhase(phaseId);
      setMatches(matchesData);
    } catch (error) {
      alert('Erro ao carregar matches: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.homeTeam || !formData.awayTeam || !formData.matchDate) {
      alert('Preencha todos os campos');
      return;
    }

    try {
      const matchDate = new Date(formData.matchDate);
      await createMatch(selectedPhase, formData.homeTeam, formData.awayTeam, matchDate);
      alert('Match criado!');
      setFormData({ homeTeam: '', awayTeam: '', matchDate: '' });
      setShowForm(false);
      loadMatches(selectedPhase);
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  };

  const handleUpdateResult = async (matchId, homeGoals, awayGoals) => {
    try {
      await updateMatchResult(matchId, homeGoals, awayGoals);
      alert('Resultado atualizado!');
      loadMatches(selectedPhase);
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  };

  const handleDelete = async (matchId) => {
    if (!window.confirm('Tem certeza que quer deletar este match?')) return;

    try {
      // deleteMatch não existe, usar updateDoc para deletar
      // Por enquanto, apenas alertar
      alert('Função de deletar ainda não implementada. Entre em contato com o desenvolvedor.');
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  };

  const currentPhase = phases.find(p => p.id === selectedPhase);

  return (
    <div>
      {/* Phase Selector */}
      {phases.length > 0 && (
        <div className="mb-8">
          <label className="block text-brasil-verde font-bold mb-3">
            Selecione a Fase
          </label>
          <select
            value={selectedPhase}
            onChange={(e) => {
              setSelectedPhase(e.target.value);
              setShowForm(false);
            }}
            className="w-full md:w-64 px-4 py-2 border-2 border-brasil-verde rounded-lg focus:outline-none focus:border-brasil-azul"
          >
            {phases.map((phase) => (
              <option key={phase.id} value={phase.id}>
                {phase.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Create Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="bg-brasil-verde text-white px-6 py-3 rounded-lg font-bold mb-8 hover:bg-brasil-azul transition"
        >
          + Adicionar Jogo
        </button>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-brasil-verde mb-6">
            Adicionar Novo Jogo
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Home Team */}
              <div>
                <label className="block text-brasil-verde font-bold mb-2">
                  Time 1 *
                </label>
                <input
                  type="text"
                  value={formData.homeTeam}
                  onChange={(e) => setFormData({ ...formData, homeTeam: e.target.value })}
                  placeholder="ex: Brasil"
                  className="w-full px-4 py-2 border-2 border-brasil-verde rounded-lg focus:outline-none focus:border-brasil-azul"
                />
              </div>

              {/* Away Team */}
              <div>
                <label className="block text-brasil-verde font-bold mb-2">
                  Time 2 *
                </label>
                <input
                  type="text"
                  value={formData.awayTeam}
                  onChange={(e) => setFormData({ ...formData, awayTeam: e.target.value })}
                  placeholder="ex: Argentina"
                  className="w-full px-4 py-2 border-2 border-brasil-verde rounded-lg focus:outline-none focus:border-brasil-azul"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-brasil-verde font-bold mb-2">
                  Data e Hora *
                </label>
                <input
                  type="datetime-local"
                  value={formData.matchDate}
                  onChange={(e) => setFormData({ ...formData, matchDate: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-brasil-verde rounded-lg focus:outline-none focus:border-brasil-azul"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-brasil-verde text-white px-6 py-3 rounded-lg font-bold hover:bg-brasil-azul transition"
              >
                Criar Jogo
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-400 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Matches List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 border-4 border-brasil-verde border-t-brasil-amarelo rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-brasil-verde font-bold">Carregando jogos...</p>
        </div>
      ) : matches.length > 0 ? (
        <div className="space-y-4">
          {matches.map((match) => (
            <div
              key={match.id}
              className="bg-white rounded-xl shadow-lg p-4 md:p-6 hover:shadow-xl transition"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                {/* Match Info */}
                <div className="md:col-span-1">
                  <p className="text-sm text-gray-600 mb-2">
                    {new Date(match.date.seconds * 1000).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="font-bold text-brasil-verde mb-1">{match.homeTeam}</p>
                  <p className="font-bold text-brasil-verde">vs</p>
                  <p className="font-bold text-brasil-verde">{match.awayTeam}</p>
                </div>

                {/* Status & Result */}
                <div className="md:col-span-2">
                  {match.status === 'finished' ? (
                    <div className="bg-brasil-amarelo bg-opacity-20 p-4 rounded-lg border-l-4 border-brasil-amarelo">
                      <p className="text-xs text-gray-600 mb-2">Resultado Final</p>
                      <p className="text-3xl font-bold text-brasil-verde text-center">
                        {match.homeGoals} x {match.awayGoals}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-gray-600 mb-3">Informar Resultado</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="9"
                          id={`home-${match.id}`}
                          defaultValue={match.homeGoals || 0}
                          placeholder="0"
                          className="w-16 px-2 py-2 border-2 border-brasil-verde rounded text-center font-bold"
                        />
                        <span className="text-2xl font-bold text-brasil-verde">x</span>
                        <input
                          type="number"
                          min="0"
                          max="9"
                          id={`away-${match.id}`}
                          defaultValue={match.awayGoals || 0}
                          placeholder="0"
                          className="w-16 px-2 py-2 border-2 border-brasil-verde rounded text-center font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 md:flex-col">
                  {match.status === 'finished' ? (
                    <div className="flex items-center gap-2 text-brasil-verde font-bold">
                      <Lock className="w-5 h-5" />
                      Encerrado
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        const home = parseInt(document.getElementById(`home-${match.id}`).value);
                        const away = parseInt(document.getElementById(`away-${match.id}`).value);
                        handleUpdateResult(match.id, home, away);
                      }}
                      className="bg-brasil-verde text-white px-4 py-2 rounded-lg font-bold hover:bg-brasil-azul transition"
                    >
                      Salvar
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(match.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <AlertCircle className="w-12 h-12 text-brasil-amarelo mx-auto mb-4" />
          <p className="text-xl text-brasil-verde font-bold">
            Nenhum jogo nesta fase
          </p>
          <p className="text-gray-600 mt-2">
            Clique em &quot;Adicionar Jogo&quot; para criar um novo match
          </p>
        </div>
      )}
    </div>
  );
}

export default MatchManager;
