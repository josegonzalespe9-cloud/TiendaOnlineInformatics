import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle2, X, ShoppingBag, Sparkles } from 'lucide-react';
import { API_URL } from '../services/api';

const COMPRAS_INICIALES = [
  { id: 101, cliente: 'Carlos M.', ciudad: 'Lima', producto: 'Canva Pro (12 Meses)', tiempo: 'Hace 3 min' },
  { id: 102, cliente: 'Lucía R.', ciudad: 'Arequipa', producto: 'ChatGPT Plus (1 Mes)', tiempo: 'Hace 8 min' },
  { id: 103, cliente: 'Alejandro V.', ciudad: 'Trujillo', producto: 'Spotify Premium (1 Mes)', tiempo: 'Hace 14 min' },
  { id: 104, cliente: 'Mariana S.', ciudad: 'Cusco', producto: 'Adobe Creative Cloud', tiempo: 'Hace 22 min' },
  { id: 105, cliente: 'David P.', ciudad: 'Lima', producto: 'Netflix Premium 4K', tiempo: 'Hace 35 min' }
];

export default function SocialProofToast() {
  const [compras, setCompras] = useState(COMPRAS_INICIALES);
  const [indiceActual, setIndiceActual] = useState(0);
  const [visible, setVisible] = useState(false);
  const [cerradoTemporal, setCerradoTemporal] = useState(false);
  const location = useLocation();

  // No mostrar dentro del panel de administración para no estorbar la gestión operativa
  const esRutaAdmin = location.pathname.startsWith('/admin');

  // Obtener compras reales de la API (enriqueciendo o reemplazando con datos en vivo)
  useEffect(() => {
    let isMounted = true;
    const fetchCompras = async () => {
      try {
        const res = await fetch(`${API_URL}/api/social-proof/recientes`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setCompras(data);
          }
        }
      } catch (err) {
        // Mantiene COMPRAS_INICIALES si la red o el backend demoran
      }
    };

    fetchCompras();
    return () => { isMounted = false; };
  }, []);

  // Ciclo dinámico: Primer toast aparece a los 1.5 segundos
  useEffect(() => {
    if (cerradoTemporal || esRutaAdmin) return;

    // Mostrar el primer toast rápido
    const initialTimer = setTimeout(() => {
      setVisible(true);
    }, 1500);

    // Intervalo de rotación: Cada 14 segundos (7s visible + 7s descanso)
    const cycleInterval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndiceActual((prev) => (prev + 1) % compras.length);
        setVisible(true);
      }, 1000);
    }, 14000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(cycleInterval);
    };
  }, [compras.length, cerradoTemporal, esRutaAdmin]);

  // Ocultar individualmente después de 7 segundos activo
  useEffect(() => {
    if (!visible) return;
    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, 7000);
    return () => clearTimeout(hideTimer);
  }, [visible, indiceActual]);

  const handleCerrar = (e) => {
    e.stopPropagation();
    setVisible(false);
    setCerradoTemporal(true);
    // Reactivar después de 45 segundos por si el visitante sigue navegando
    setTimeout(() => {
      setCerradoTemporal(false);
    }, 45000);
  };

  if (esRutaAdmin || cerradoTemporal || compras.length === 0 || !visible) {
    return null;
  }

  const compra = compras[indiceActual] || compras[0];

  return (
    <aside 
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 sm:right-auto sm:bottom-6 sm:left-6 z-50 max-w-[350px] w-auto transition-all duration-500 ease-out animate-slide-up"
    >
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 hover:border-emerald-500/60 rounded-2xl p-3.5 shadow-2xl flex items-start gap-3 relative group ring-1 ring-emerald-500/10 hover:ring-emerald-500/30 transition-all">
        {/* Botón Cerrar */}
        <button
          onClick={handleCerrar}
          aria-label="Cerrar notificación"
          className="absolute top-2 right-2 text-slate-500 hover:text-slate-300 p-1 rounded-lg transition-colors"
          title="Ocultar"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Icono / Avatar con animación de pulso */}
        <div className="relative flex-shrink-0 mt-0.5">
          <div className="bg-emerald-500/15 border border-emerald-500/30 p-2.5 rounded-xl text-emerald-400 shadow-sm">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>

        {/* Contenido */}
        <div className="flex-1 pr-4 min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 flex-wrap">
            <span className="text-slate-100">{compra.cliente}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 font-normal">{compra.ciudad}</span>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400 text-[10px] font-semibold flex items-center gap-0.5 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
              <CheckCircle2 className="w-2.5 h-2.5 inline" />
              Verificado
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-200 mt-0.5 leading-snug truncate">
            Adquirió <span className="text-sky-300 font-bold">{compra.producto}</span>
          </p>

          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 pt-0.5">
            <span>{compra.tiempo}</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Entrega inmediata
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
