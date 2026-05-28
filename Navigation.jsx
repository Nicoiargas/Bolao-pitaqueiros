// src/components/Nav/Navigation.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logoutUser } from '../../services/authService';
import { Trophy, Target, BarChart3, Settings, LogOut, Menu, X } from 'lucide-react';

function Navigation({ user, isAdmin }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex bg-gradient-to-r from-brasil-verde to-brasil-azul text-white px-6 py-4 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center w-full">
          <Link to="/dashboard" className="flex items-center gap-2 text-2xl font-bold">
            <Trophy className="w-8 h-8" fill="currentColor" />
            <span>Palpiteiros do Hexa</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="hover:bg-brasil-amarelo hover:text-brasil-verde px-3 py-2 rounded-lg transition">
              <Target className="w-5 h-5 inline-block mr-1" />
              Dashboard
            </Link>
            <Link to="/palpites" className="hover:bg-brasil-amarelo hover:text-brasil-verde px-3 py-2 rounded-lg transition">
              <Trophy className="w-5 h-5 inline-block mr-1" />
              Palpites
            </Link>
            <Link to="/ranking" className="hover:bg-brasil-amarelo hover:text-brasil-verde px-3 py-2 rounded-lg transition">
              <BarChart3 className="w-5 h-5 inline-block mr-1" />
              Ranking
            </Link>
            {isAdmin && (
              <Link to="/admin" className="hover:bg-brasil-amarelo hover:text-brasil-verde px-3 py-2 rounded-lg transition">
                <Settings className="w-5 h-5 inline-block mr-1" />
                Admin
              </Link>
            )}

            <div className="border-l border-white pl-6">
              <p className="text-sm mb-2">{user.displayName || user.email}</p>
              <button
                onClick={handleLogout}
                className="bg-brasil-amarelo text-brasil-verde px-4 py-2 rounded-lg font-bold hover:bg-white transition"
              >
                <LogOut className="w-4 h-4 inline-block mr-1" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-gradient-to-r from-brasil-verde to-brasil-azul text-white p-4 shadow-lg sticky top-0 z-40">
        <div className="flex justify-between items-center">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <Trophy className="w-6 h-6" fill="currentColor" />
            <span>Hexa</span>
          </Link>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="mt-4 flex flex-col gap-3 pb-4">
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="bg-white bg-opacity-20 px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Target className="w-5 h-5" />
              Dashboard
            </Link>
            <Link
              to="/palpites"
              onClick={() => setMobileMenuOpen(false)}
              className="bg-white bg-opacity-20 px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Trophy className="w-5 h-5" />
              Palpites
            </Link>
            <Link
              to="/ranking"
              onClick={() => setMobileMenuOpen(false)}
              className="bg-white bg-opacity-20 px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <BarChart3 className="w-5 h-5" />
              Ranking
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-brasil-amarelo text-brasil-verde px-4 py-2 rounded-lg font-bold flex items-center gap-2"
              >
                <Settings className="w-5 h-5" />
                Admin
              </Link>
            )}
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="bg-brasil-amarelo text-brasil-verde px-4 py-2 rounded-lg font-bold mt-2 flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </button>
            <p className="text-sm text-center opacity-75 mt-2">
              {user.displayName || user.email}
            </p>
          </div>
        )}
      </nav>
    </>
  );
}

export default Navigation;
