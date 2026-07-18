import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Lock, Mail, User, Phone, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../services/api';
import { showSuccess, showError, showWarning } from '../utils/alerts';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useCart();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (isRegister) {
        // Validación local estricta antes de enviar datos al servidor
        if (!nombre.trim() || !email.trim() || !password.trim() || !whatsapp.trim()) {
          showWarning('Formulario Incompleto', 'Por favor, rellene todos los campos.');
          return;
        }

        // Endpoint de Registro
        const response = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nombre,
            email,
            passwordHash: password,
            whatsapp,
            rol: 'Cliente'
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.mensaje || 'Error en el registro');
        }

        showSuccess('Registro Exitoso', 'Registro completado con éxito. Ahora puede iniciar sesión.');
        setIsRegister(false);
        setPassword('');
      } else {
        // Validación local de login
        if (!email.trim() || !password.trim()) {
          showWarning('Campos Requeridos', 'Por favor, ingrese su correo y contraseña.');
          return;
        }

        // Endpoint de Login
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            password
          })
        });

        if (!response.ok) {
          throw new Error('Credenciales inválidas');
        }

        const data = await response.json();
        
        // Guardar sesión de forma segura a través del Contexto
        login(data.usuario, data.token);
        
        // Redirigir a Panel de Cliente
        navigate('/panel');
      }
    } catch (error) {
      console.error("Error de autenticación:", error);
      showError('Error de Autenticación', error.message || 'Ha ocurrido un error en las credenciales. Revise sus datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent pointer-events-none" />

        {/* Título */}
        <div className="text-center space-y-2 z-10 relative">
          <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">
            {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h2>
          <p className="text-slate-400 text-sm">
            {isRegister 
              ? 'Regístrate para comprar y controlar tus licencias' 
              : 'Accede a tu panel Informatics para controlar tus servicios'}
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4 z-10 relative">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Nombre Completo
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-[#1e293b] text-white border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg pl-11 pr-4 py-3 text-sm transition-all placeholder-slate-500"
                  placeholder="Ej. José Gonzales"
                />
                <User className="absolute left-4 top-3.5 text-slate-500 w-4 h-4" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1e293b] text-white border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg pl-11 pr-4 py-3 text-sm transition-all placeholder-slate-500"
                placeholder="correo@ejemplo.com"
              />
              <Mail className="absolute left-4 top-3.5 text-slate-500 w-4 h-4" />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Número de WhatsApp
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full bg-[#1e293b] text-white border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg pl-11 pr-4 py-3 text-sm transition-all placeholder-slate-500"
                  placeholder="Ej. +51984497138"
                />
                <Phone className="absolute left-4 top-3.5 text-slate-500 w-4 h-4" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1e293b] text-white border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg pl-11 pr-12 py-3 text-sm transition-all placeholder-slate-500"
                placeholder="••••••••"
              />
              <Lock className="absolute left-4 top-3.5 text-slate-500 w-4 h-4" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-500 hover:bg-sky-400 text-slate-955 font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-6 shadow-lg hover:shadow-sky-500/20 disabled:bg-slate-800 disabled:text-slate-500"
          >
            {loading ? (
              <span>Procesando...</span>
            ) : isRegister ? (
              <>
                <UserPlus className="w-5 h-5" />
                Registrarse
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        {/* Toggle */}
        <div className="text-center pt-2 border-t border-slate-800/60 z-10 relative">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-sky-400 hover:text-sky-300 text-sm font-medium transition-colors"
          >
            {isRegister 
              ? '¿Ya tienes una cuenta? Inicia sesión aquí' 
              : '¿No tienes cuenta? Regístrate aquí'}
          </button>
        </div>
      </div>
    </div>
  );
}
