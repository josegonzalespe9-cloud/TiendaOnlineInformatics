import React, { useState, useEffect } from 'react';
import { CheckCircle2, X, ShoppingBag, Sparkles } from 'lucide-react';
import { API_URL } from '../services/api';

export default function SocialProofToast() {
  const [compras, setCompras] = useState([]);
  const [indiceActual, setIndiceActual] = useState(0);
  const [visible, setVisible] = useState(false);
  const [desactivado, setDesactivado] = useState(false);

  useEffect(() => {
    // Si el usuario ya lo cerró en esta sesión, no insistir
    if (sessionStorage.getItem('dismiss_social_proof') === 'true') {
      setDesactivado(true);
      return;
    }

    const fetchCompras = async () => {
      try {
        const res = await fetch(`${API_URL}/api/social-proof/recientes`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCompras(data);
          }
        }
      } catch (err) {
        // En caso de fallo silencioso de red
      }
    };

    fetchCompras();
  }, []);

  useEffect(() => {
    if (desactivado || compras.length === 0) return;

    // Primer toast aparece a los 4 segundos
    const initialTimer = setTimeout(() => {
      setVisible(true);
    }, 4000);

    // Ciclo de mostrar durante 6 segundos y esperar 18 segundos para el siguiente
    const cycleInterval = setInterval(() => {
      setVisible(false);

      setTimeout(() => {
        setIndiceActual((prev) => (prev + 1) % compras.length);
        setVisible(true);
      }, 1000); // 1s de transición
    }, 22000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(cycleInterval);
    };
  }, [compras, desactivado]);

  // Ocultar toast individualmente después de 7 segundos activo
  useEffect(() => {
    if (!visible) return;
    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, 7000);
    return () => clearTimeout(hideTimer);
  }, [visible, indiceActual]);

  const handleCerrar = () => {
    setVisible(false);
    setDesactivado(true);
    try {
      sessionStorage.setItem('dismiss_social_proof', 'true');
    } catch {}
  };

  if (desactivado || compras.length === 0 || !visible) return null;

  const compra = compras[indiceActual];
  if (!compra) return null;

  return (
    <div className="fixed bottom-5 left-5 z-40 max-w-[340px] w-full animate-fade-in transition-all duration-500">
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 hover:border-emerald-500/50 rounded-2xl p-3.5 shadow-2xl flex items-start gap-3 relative group">
        {/* Botón Cerrar */}
        <button
          onClick={handleCerrar}
          className="absolute top-2 right-2 text-slate-500 hover:text-slate-300 p-1 rounded-lg transition-colors"
          title="Ocultar notificaciones"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Icono / Avatar */}
        <div className="bg-emerald-500/15 border border-emerald-500/30 p-2 rounded-xl text-emerald-400 flex-shrink-0 mt-0.5">
          <ShoppingBag className="w-4 h-4" />
        </div>

        {/* Contenido */}
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
            <span>{compra.cliente}</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400 font-normal">{compra.ciudad}</span>
            <span className="text-slate-500">·</span>
            <span className="text-emerald-400 text-[10px] flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3 inline" />
              Verificado
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-100 mt-0.5 leading-snug">
            Adquirió <span className="text-sky-300 font-bold">{compra.producto}</span>
          </p>

          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
            <span>{compra.tiempo}</span>
            <span className="text-emerald-400/80 font-medium flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Entrega inmediata
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
