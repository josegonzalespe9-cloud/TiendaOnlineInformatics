import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { API_URL } from '../services/api';

/**
 * Obtiene o inicializa un identificador de sesión único en sessionStorage.
 */
function getOrCreateSessionId() {
  try {
    let sid = sessionStorage.getItem('informatics_visitor_session');
    if (!sid) {
      sid = 'sid_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      sessionStorage.setItem('informatics_visitor_session', sid);
    }
    return sid;
  } catch {
    return 'sid_fallback_' + Math.random().toString(36).substring(2, 9);
  }
}

/**
 * Detecta el tipo de dispositivo del visitante.
 */
function detectDispositivo() {
  if (typeof window === 'undefined') return 'Escritorio';
  const width = window.innerWidth;
  const ua = navigator.userAgent || '';
  const isTablet = /iPad|Tablet/i.test(ua) || (width >= 768 && width <= 1024);
  if (isTablet) return 'Tablet';
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || width < 768;
  if (isMobile) return 'Móvil';
  return 'Escritorio';
}

/**
 * Detecta el sistema operativo del visitante.
 */
function detectSO() {
  if (typeof navigator === 'undefined') return 'Desconocido';
  const ua = navigator.userAgent || '';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'MacOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Desconocido';
}

/**
 * Detecta el navegador web del visitante.
 */
function detectNavegador() {
  if (typeof navigator === 'undefined') return 'Desconocido';
  const ua = navigator.userAgent || '';
  if (/Edg/i.test(ua)) return 'Edge';
  if (/OPR|Opera/i.test(ua)) return 'Opera';
  if (/Chrome/i.test(ua)) return 'Chrome';
  if (/Safari/i.test(ua)) return 'Safari';
  if (/Firefox/i.test(ua)) return 'Firefox';
  return 'Desconocido';
}

/**
 * Detecta el origen / referrer de la visita.
 */
function detectReferrer() {
  if (typeof document === 'undefined' || !document.referrer) return 'Directo';
  try {
    const ref = document.referrer.toLowerCase();
    if (ref.includes('whatsapp') || ref.includes('wa.me')) return 'WhatsApp';
    if (ref.includes('google')) return 'Google';
    if (ref.includes('facebook') || ref.includes('fb.com')) return 'Facebook';
    if (ref.includes('instagram')) return 'Instagram';
    if (ref.includes('tiktok')) return 'TikTok';
    if (ref.includes('youtube')) return 'YouTube';
    if (ref.includes(window.location.hostname)) return 'Directo';
    return document.referrer.length > 50 ? document.referrer.substring(0, 50) : document.referrer;
  } catch {
    return 'Directo';
  }
}

/**
 * Componente silencioso de telemetría y analítica en tiempo real.
 * Registra cada cambio de página sin afectar el rendimiento del cliente.
 */
export default function VisitorTracker() {
  const location = useLocation();
  const { user } = useCart();
  const lastTrackedRef = useRef({ ruta: '', time: 0 });

  useEffect(() => {
    const rutaActual = location.pathname + (location.search || '');
    const now = Date.now();

    // Anti-Spam: No registrar la misma ruta si ocurrió hace menos de 2 segundos
    if (lastTrackedRef.current.ruta === rutaActual && (now - lastTrackedRef.current.time) < 2000) {
      return;
    }

    lastTrackedRef.current = { ruta: rutaActual, time: now };

    const payload = {
      sessionId: getOrCreateSessionId(),
      ruta: rutaActual,
      tituloPagina: document.title || 'Informatics Store',
      dispositivo: detectDispositivo(),
      navegador: detectNavegador(),
      sistemaOperativo: detectSO(),
      referrer: detectReferrer(),
      usuarioId: user?.id || null,
      usuarioNombre: user?.nombre || null,
      usuarioEmail: user?.email || null
    };

    // Envío asíncrono y resiliente
    try {
      fetch(`${API_URL}/api/visitas/registrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(() => {
        // Fallo silencioso intencional para no interrumpir al usuario
      });
    } catch {
      // Ignorar fallos de red en telemetría
    }
  }, [location.pathname, location.search, user?.id, user?.nombre, user?.email]);

  return null;
}
