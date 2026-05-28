// src/components/Auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../../services/authService';
import { Trophy, Mail, Lock, AlertCircle } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginUser(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginUser('teste@palpiteiros.com', 'Teste@123');
      navigate('/dashboard');
    } catch (err) {
      setError('Erro ao fazer login de teste');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brasil-verde via-white to-brasil-amarelo flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Trophy className="w-16 h-16 text-brasil-verde" fill="currentColor" />
          </div>
          <h1 className="text-4xl font-bold text-brasil-verde mb-2">
            Palpiteiros do Hexa
          </h1>
          <p className="text-brasil-azul font-semibold">
            Sua Copa, Seus Palpites, Sua Glória!
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 mb-6">
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
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brasil-verde to-brasil-azul text-white font-bold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Test Login */}
          <div className="border-t-2 border-brasil-amarelo pt-6">
            <p className="text-center text-sm text-gray-600 mb-4">
              Quer testar sem cadastro?
            </p>
            <button
              onClick={handleTestLogin}
              disabled={loading}
              className="w-full bg-brasil-amarelo text-brasil-verde font-bold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Carregando...' : 'Login Teste'}
            </button>
          </div>

          {/* Register Link */}
          <div className="text-center mt-6">
            <p className="text-gray-600 text-sm">
              Novo por aqui?{' '}
              <Link to="/register" className="text-brasil-verde font-bold hover:underline">
                Crie sua conta agora
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

export default Login;
