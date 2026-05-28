// src/components/Admin/PhaseManager.jsx
import React, { useState, useEffect } from 'react';
import { createPhase, getAllPhases, updatePhase, deletePhase } from '../../services/gameService';
import { AlertCircle, Trash2, Edit } from 'lucide-react';
import { PHASES } from '../../services/pointsService';

function PhaseManager() {
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    pointsPerGame: 1,
    closingDate: '',
  });

  useEffect(() => {
    loadPhases();
  }, []);

  const loadPhases = async () => {
    try {
      setLoading(true);
      const phasesData = await getAllPhases();
      setPhases(phasesData);
    } catch (error) {
      alert('Erro ao carregar fases: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.closingDate) {
      alert('Preencha todos os campos');
      return;
    }

    try {
      const closingDate = new Date(formData.closingDate);
      
      if (editingId) {
        await updatePhase(editingId, {
          name: formData.name,
          pointsPerGame: formData.pointsPerGame,
          closingDate: closingDate,
        });
        alert('Fase atualizada!');
      } else {
        await createPhase(formData.name, formData.pointsPerGame, closingDate);
        alert('Fase criada!');
      }

      setFormData({ name: '', pointsPerGame: 1, closingDate: '' });
      setEditingId(null);
      setShowForm(false);
      loadPhases();
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  };

  const handleEdit = (phase) => {
    setFormData({
      name: phase.name,
      pointsPerGame: phase.pointsPerGame,
      closingDate: new Date(phase.closingDate.seconds * 1000).toISOString().slice(0, 16),
    });
    setEditingId(phase.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que quer deletar esta fase?')) return;

    try {
      await deletePhase(id);
      alert('Fase deletada!');
      loadPhases();
    } catch (error) {
      alert('Erro ao deletar: ' + error.message);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', pointsPerGame: 1, closingDate: '' });
  };

  return (
    <div>
      {/* Create Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="bg-brasil-verde text-white px-6 py-3 rounded-lg font-bold mb-8 hover:bg-brasil-azul transition"
        >
          + Criar Nova Fase
        </button>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-brasil-verde mb-6">
            {editingId ? 'Editar Fase' : 'Criar Nova Fase'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome da Fase */}
              <div>
                <label className="block text-brasil-verde font-bold mb-2">
                  Nome da Fase *
                </label>
                <select
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-brasil-verde rounded-lg focus:outline-none focus:border-brasil-azul"
                >
                  <option value="">Selecione uma fase</option>
                  {PHASES.map((phase) => (
                    <option key={phase} value={phase}>
                      {phase}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pontos por Jogo */}
              <div>
                <label className="block text-brasil-verde font-bold mb-2">
                  Pontos por Jogo *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.pointsPerGame}
                  onChange={(e) => setFormData({ ...formData, pointsPerGame: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-brasil-verde rounded-lg focus:outline-none focus:border-brasil-azul"
                />
              </div>
            </div>

            {/* Data de Fechamento */}
            <div>
              <label className="block text-brasil-verde font-bold mb-2">
                Data e Hora de Fechamento *
              </label>
              <input
                type="datetime-local"
                value={formData.closingDate}
                onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
                className="w-full px-4 py-2 border-2 border-brasil-verde rounded-lg focus:outline-none focus:border-brasil-azul"
              />
              <p className="text-xs text-gray-600 mt-1">
                ⏰ Após essa data, os palpiteiros não poderão mais fazer palpites nesta fase
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-brasil-verde text-white px-6 py-3 rounded-lg font-bold hover:bg-brasil-azul transition"
              >
                {editingId ? 'Atualizar Fase' : 'Criar Fase'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-400 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Phases List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 border-4 border-brasil-verde border-t-brasil-amarelo rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-brasil-verde font-bold">Carregando fases...</p>
        </div>
      ) : phases.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {phases.map((phase) => (
            <div key={phase.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-brasil-verde mb-2">{phase.name}</h3>
                <p className="text-brasil-azul text-sm font-semibold">
                  {phase.pointsPerGame} ponto{phase.pointsPerGame !== 1 ? 's' : ''} por jogo
                </p>
              </div>

              <div className="mb-4 p-3 bg-brasil-amarelo bg-opacity-10 rounded-lg border-l-4 border-brasil-amarelo">
                <p className="text-xs text-gray-600">Fecha em:</p>
                <p className="font-bold text-brasil-verde">
                  {new Date(phase.closingDate.seconds * 1000).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(phase)}
                  className="flex-1 bg-brasil-amarelo text-brasil-verde px-4 py-2 rounded-lg font-bold hover:bg-opacity-80 transition flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(phase.id)}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-600 transition flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Deletar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <AlertCircle className="w-12 h-12 text-brasil-amarelo mx-auto mb-4" />
          <p className="text-xl text-brasil-verde font-bold">
            Nenhuma fase criada
          </p>
          <p className="text-gray-600 mt-2">
            Clique em &quot;Criar Nova Fase&quot; para começar
          </p>
        </div>
      )}
    </div>
  );
}

export default PhaseManager;
