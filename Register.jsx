// src/components/Auth/Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../../services/authService';
import { Trophy, Mail, Lock, User, AlertCircle, Check } from 'lucide-react';

function Register() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    if (!displayName.trim()) {
      setError('Nome é obrigatório');
      return false;
    }
    if (!email.includes('@')) {
      setError('Email inválido');
      return false;
    }
    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Senhas não conferem');
      return false;
    }
    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      await registerUser(email, password, displayName);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const strength = passwordStrength();

  return (
    <div className="min-h-screen bg-gradient-to-br from-brasil-verde via-white to-brasil-amarelo flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Trophy className="w-16 h-16 text-brasil-verde" fill="currentColor" />
          </div>
          <h1 className="text-3xl font-bold text-brasil-verde mb-2">
            Palpiteiros do Hexa
          </h1>
          <p className="text-brasil-azul font-semibold text-sm">
            Junte-se ao bolão da Copa
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4 mb-6">
            {/* Name */}
            <div>
              <label className="block text-brasil-verde font-bold mb-2">
                <User className="w-4 h-4 inline-block mr-2" />
                Nome de Palpiteiro
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome"
                className="w-full px-4 py-3 border-2 border-brasil-verde rounded-lg focus:outline-none focus:border-brasil-azul bg-white text-brasil-azul"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-brasil-verde font-bold mb-2">
                <Mail className="w-4 h-4 inline-block mr-2" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 border-2 border-brasil-verde rounded-lg focus:outline-none focus:border-brasil-azul bg-white text-brasil-azul"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-brasil-verde font-bold mb-2">
                <Lock className="w-4 h-4 inline-block mr-2" />
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border-2 border-brasil-verde rounded-lg focus:outline-none focus:border-brasil-azul bg-white text-brasil-azul"
                required
              />
              
              {/* Password Strength */}
              {password && (
                <div className="mt-2 flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 flex-1 rounded ${
                        i < strength ? 'bg-brasil-verde' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-brasil-verde font-bold mb-2">
                <Lock className="w-4 h-4 inline-block mr-2" />
                Confirmar Senha
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border-2 border-brasil-verde rounded-lg focus:outline-none focus:border-brasil-azul bg-white text-brasil-azul"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brasil-verde to-brasil-azul text-white font-bold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50 mt-6"
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              Já tem conta?{' '}
              <Link to="/login" className="text-brasil-verde font-bold hover:underline">
                Faça login aqui
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-brasil-verde text-sm mt-8 opacity-75">
          🇧🇷 Palpiteiros do Hexa © 2024
        </p>
      </div>
    </div>
  );
}

export default Register;
