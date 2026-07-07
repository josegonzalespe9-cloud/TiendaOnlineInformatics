import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { CartProvider, useCart } from './context/CartContext';
import Catalogo from './components/Catalogo';
import Carrito from './components/Carrito';
import PanelCliente from './components/PanelCliente';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import BotonSoporteFloat from './components/BotonSoporteFloat';
import ProtectedRoute from './components/ProtectedRoute';
import { ShoppingCart, User, ShieldAlert, LogOut, Code } from 'lucide-react';

function Navigation() {
  const { cartItemsCount, user, logout } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-sky-500 p-2 rounded-xl text-slate-950 font-black">
                <Code className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent group-hover:from-sky-300 group-hover:to-emerald-300 transition-all">
                Informatics
              </span>
            </Link>
          </div>

          {/* Menú de Enlaces */}
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-slate-350 hover:text-slate-100 text-sm font-medium transition-colors"
            >
              Catálogo
            </Link>

            {/* Botón exclusivo Panel Admin al lado de Catálogo */}
            {user && (user.rol === 'Admin' || user.rol === 'Administrador') && (
              <Link
                to="/admin"
                className="text-slate-350 hover:text-slate-100 text-sm font-medium transition-colors"
              >
                Panel Admin
              </Link>
            )}

            {/* Carrito Icono */}
            <Link
              to="/carrito"
              className="relative p-2.5 text-slate-350 hover:text-slate-100 transition-colors"
              title="Carrito de Compras"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-emerald-500 text-slate-950 font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-slate-900 shadow-md">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            {/* Usuario Sesión */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/panel"
                  className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                >
                  <User className="w-3.5 h-3.5" />
                  Mi Panel
                </Link>

                {(user.rol === 'Admin' || user.rol === 'Administrador') && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Admin
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="p-2.5 text-slate-500 hover:text-rose-400 transition-colors"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs transition-all shadow-md"
              >
                Acceder
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />

      {/* Contenido Principal */}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Catalogo />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/panel" element={<PanelCliente />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          } />
        </Routes>
      </main>

      {/* Botón flotante global de Soporte */}
      <BotonSoporteFloat />

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900/60 py-6 text-center text-xs text-slate-500">
        <p>© 2026 Informatics Corporation. Todos los derechos reservados.</p>
        <p className="mt-1 text-slate-655 font-mono">Plataforma de Gestión Comercial con backend .NET 10 y React.</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <Router>
        <MainLayout />
      </Router>
    </CartProvider>
  );
}
