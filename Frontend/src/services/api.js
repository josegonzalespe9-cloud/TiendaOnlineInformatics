// Configuración inteligente y resiliente de API para producción y desarrollo
// 1. En entorno local de desarrollo (localhost o 127.0.0.1), usa directamente el backend local http://127.0.0.1:5193 para respuesta instantánea (<20ms) y evitar retrasos por suspensión en la nube.
// 2. En producción (Vercel o dominio público), utiliza VITE_API_URL o el backend en Render.

const isLocalBrowser = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_URL = isLocalBrowser 
  ? 'http://127.0.0.1:5193'
  : (import.meta.env.VITE_API_URL || 'https://informaticsbackend.onrender.com');
