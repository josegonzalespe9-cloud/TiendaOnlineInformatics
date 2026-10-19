import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { 
  Search, Monitor, Tv, BrainCircuit, ShoppingCart, Info, Check, 
  X, Star, CheckCircle2, MessageSquare, ShieldCheck, Zap, Flame,
  Globe, Laptop, ExternalLink, Download, Layers, Shield
} from 'lucide-react';
import { API_URL } from '../services/api';
import CachedImage from './CachedImage';
import { showToast, showSuccess, showWarning } from '../utils/alerts';

const WhatsAppIconSVG = ({ className = "w-5 h-5" }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className} 
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.863-9.864.001-2.63-1.019-5.101-2.871-6.958C16.612 1.926 14.14 1.079 11.516 1.079c-5.442 0-9.87 4.42-9.874 9.865-.001 1.79.471 3.541 1.367 5.084L1.936 22.06l6.23-1.635zM15.95 13.1c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-1.62-.8-2.77-1.6-3.87-3.5-.29-.5-.07-.77.16-.99.2-.2.4-.48.6-.72.2-.24.27-.4.4-.67.13-.27.06-.5-.03-.7-.09-.2-.76-1.83-1.04-2.5-.28-.68-.56-.58-.76-.59-.2-.01-.43-.01-.66-.01-.23 0-.6.09-.91.43-.31.34-1.18 1.15-1.18 2.8 0 1.65 1.2 3.25 1.37 3.47.17.22 2.36 3.59 5.71 5.04.8.34 1.43.55 1.92.71.8.25 1.53.22 2.11.13.64-.1 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.18-.46-.3z" />
  </svg>
);

// Metadatos técnicos enriquecidos para fanáticos del software y streaming
export const getTechnicalDetails = (prod) => {
  const nombre = (prod.nombre || '').toLowerCase();
  
  if (nombre.includes('windows 11') || nombre.includes('windows 10')) {
    return {
      plataforma: 'Windows',
      tipoEntrega: '⚡ Clave 25 Caracteres',
      tipoLicencia: 'OEM Permanente (Enlazada a Placa Madre)',
      instaladorOficial: 'https://www.microsoft.com/software-download',
      requisitos: 'Procesador 1 GHz o superior, 4 GB RAM, 64 GB espacio en disco, TPM 2.0 (Win 11)',
      garantia: 'Garantía de activación genuina de por vida ante Microsoft',
      pasos: [
        'Abre Configuración en tu PC > Sistema > Activación',
        'Haz clic en "Cambiar la clave de producto"',
        'Pega el código de 25 caracteres y haz clic en Activar'
      ]
    };
  }

  if (nombre.includes('office profesional plus 2021') || nombre.includes('office profesional plus 2024')) {
    return {
      plataforma: 'Windows',
      tipoEntrega: '⚡ Clave 25 Caracteres',
      tipoLicencia: 'Licencia Perpetua (Sin mensualidades, 1 PC)',
      instaladorOficial: 'https://setup.office.com',
      requisitos: 'Windows 10 o Windows 11 (No compatible con Mac ni Chromebook)',
      garantia: 'Garantía 100% de descarga directa de los servidores de Microsoft',
      pasos: [
        'Ingresa a setup.office.com con tu cuenta Microsoft',
        'Escribe tu clave de producto entregada',
        'Descarga el instalador oficial e inicia Word o Excel activado'
      ]
    };
  }

  if (nombre.includes('office hogar') || nombre.includes('mac')) {
    return {
      plataforma: 'Mac & PC',
      tipoEntrega: '⚡ Clave 25 Caracteres Bind',
      tipoLicencia: 'Retail Perpetua (Vinculada a tu cuenta)',
      instaladorOficial: 'https://setup.office.com',
      requisitos: 'Cualquiera de las 3 versiones más recientes de macOS o Windows 10/11',
      garantia: 'Transferible a otro equipo mediante tu cuenta de Microsoft',
      pasos: [
        'Inicia sesión en setup.office.com',
        'Vincula la clave a tu correo personal de Hotmail/Outlook',
        'Instala en Mac o PC desde account.microsoft.com'
      ]
    };
  }

  if (nombre.includes('office 365')) {
    return {
      plataforma: 'Multiplataforma (PC, Mac, Móvil)',
      tipoEntrega: '👤 Credenciales Administradas',
      tipoLicencia: 'Suscripción Anual (1 Año con 1 TB OneDrive)',
      instaladorOficial: 'https://portal.office.com',
      requisitos: 'Compatible con Windows, Mac, iPad, iPhone y Android',
      garantia: 'Reemplazo garantizado durante todo el periodo anual',
      pasos: [
        'Ingresa a portal.office.com con las credenciales entregadas',
        'Cambia tu contraseña provisional en el primer inicio',
        'Descarga las aplicaciones oficiales en hasta 5 dispositivos simultáneos'
      ]
    };
  }

  if (nombre.includes('idm') || nombre.includes('internet download manager')) {
    return {
      plataforma: 'Windows',
      tipoEntrega: '⚡ Clave Serial Permanente',
      tipoLicencia: 'Perpetua (Actualizaciones oficiales incluidas)',
      instaladorOficial: 'https://www.internetdownloadmanager.com/download.html',
      requisitos: 'Windows 7, 8, 10, 11 (32 y 64 bits)',
      garantia: 'Licencia original genuina Tonec Inc.',
      pasos: [
        'Descarga e instala IDM desde el sitio oficial',
        'Ve al menú Registro > Registro',
        'Ingresa tu nombre y el número de serie recibido'
      ]
    };
  }

  if (nombre.includes('winrar')) {
    return {
      plataforma: 'Windows',
      tipoEntrega: '🔑 Llave de Registro (rarreg.key)',
      tipoLicencia: 'Licencia Permanente de por vida',
      instaladorOficial: 'https://www.win-rar.com/download.html',
      requisitos: 'Cualquier versión de Windows',
      garantia: 'Elimina de por vida la ventana emergente de evaluación',
      pasos: [
        'Descarga e instala WinRAR oficial',
        'Copia la clave rarreg.key en la carpeta de instalación de WinRAR',
        '¡Listo! Quedará registrado oficialmente a tu nombre'
      ]
    };
  }

  if (nombre.includes('eset') || nombre.includes('antivirus')) {
    return {
      plataforma: 'Windows & Mac',
      tipoEntrega: '⚡ Clave Alfanumérica Retail',
      tipoLicencia: 'Suscripción 365 Días (1 Dispositivo)',
      instaladorOficial: 'https://www.eset.com/la/hogar/internet-security/descarga/',
      requisitos: 'Windows 10/11 o macOS 12 o superior',
      garantia: 'Actualizaciones de base de firmas de virus garantizadas por 1 año',
      pasos: [
        'Descarga el instalador desde el portal oficial de ESET',
        'Durante la instalación selecciona "Utilizar clave de licencia adquirida"',
        'Pega el código de 20 caracteres y activa la protección en tiempo real'
      ]
    };
  }

  if (nombre.includes('netflix')) {
    return {
      plataforma: 'Multiplataforma (TV, Móvil, PC)',
      tipoEntrega: '👤 Perfil Privado con PIN',
      tipoLicencia: 'Suscripción Mensual Renovable',
      instaladorOficial: 'https://www.netflix.com',
      requisitos: 'Smart TV, TV Box, Chromecast, PC o Celular',
      garantia: 'Garantía 100% anti-caídas y soporte por WhatsApp en caso de código de hogar',
      pasos: [
        'Inicia sesión con el correo y clave entregados',
        'Ingresa únicamente a tu perfil asignado',
        'Coloca tu PIN de 4 dígitos para que nadie más acceda a tu historial'
      ]
    };
  }

  if (nombre.includes('spotify') || nombre.includes('youtube')) {
    return {
      plataforma: 'Multiplataforma',
      tipoEntrega: '📧 Activación a tu propio correo',
      tipoLicencia: 'Suscripción Mensual Oficial',
      instaladorOficial: 'https://www.spotify.com',
      requisitos: 'Cualquier dispositivo con app oficial',
      garantia: 'Mantienes tus listas de reproducción, favoritos y perfil intactos',
      pasos: [
        'Te enviamos un enlace de invitación oficial',
        'Inicias sesión con tu cuenta personal actual',
        '¡Listo! Tu cuenta pasa a ser Premium sin anuncios'
      ]
    };
  }

  if (nombre.includes('canva') || nombre.includes('capcut') || nombre.includes('adobe')) {
    return {
      plataforma: 'Multiplataforma',
      tipoEntrega: '👥 Invitación a Equipo Pro / Acceso',
      tipoLicencia: 'Suscripción Anual Completa',
      instaladorOficial: 'https://www.canva.com',
      requisitos: 'Navegador web o App oficial',
      garantia: 'Reemplazo o re-invitación inmediata si expira el grupo',
      pasos: [
        'Te enviamos el enlace de unión a tu correo',
        'Aceptas la invitación y se desbloquean todas las funciones Pro',
        'Tus proyectos y diseños personales se mantienen totalmente privados'
      ]
    };
  }

  if (nombre.includes('chatgpt') || nombre.includes('claude') || nombre.includes('gemini') || nombre.includes('grok')) {
    return {
      plataforma: 'Web & Móvil',
      tipoEntrega: '🔑 Credenciales Dedicadas',
      tipoLicencia: 'Suscripción Mensual con IA Avanzada',
      instaladorOficial: 'https://chatgpt.com',
      requisitos: 'Cualquier navegador moderno',
      garantia: 'Garantía de acceso completo al modelo más avanzado',
      pasos: [
        'Ingresa con el usuario y contraseña proporcionados',
        'Accede a modelos de razonamiento y generación de imágenes',
        'Soporte inmediato durante todo el mes contratado'
      ]
    };
  }

  // Fallback general para el resto del catálogo
  return {
    plataforma: prod.categoria === 'Streaming' || prod.categoria === 'IA' ? 'Multiplataforma' : 'Windows',
    tipoEntrega: prod.categoria === 'Streaming' ? '👤 Perfil con PIN' : '⚡ Clave Digital',
    tipoLicencia: prod.duracionMeses === 0 ? 'Licencia Perpetua' : prod.duracionMeses === 12 ? 'Suscripción Anual' : 'Suscripción Mensual',
    instaladorOficial: 'https://informatics.local',
    requisitos: 'Consulte compatibilidad con su dispositivo',
    garantia: 'Garantía 100% de soporte y reposición',
    pasos: [
      'Recibe tu acceso verificado tras el pedido',
      'Sigue la guía de activación adjunta en tu panel de cliente',
      'Contáctanos al WhatsApp de soporte ante cualquier consulta técnica'
    ]
  };
};

export default function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [filtro, setFiltro] = useState('Todos');
  const [filtroPlataforma, setFiltroPlataforma] = useState('Todas');
  const [buscar, setBuscar] = useState('');
  const [loading, setLoading] = useState(true);
  const [productoAgregadoId, setProductoAgregadoId] = useState(null);
  
  // Estado para Modal de Detalle de Producto
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  // Estado para Reseñas y Comentarios de Clientes
  const [reseñas, setReseñas] = useState({});
  const [nuevoComentario, setNuevoComentario] = useState({
    nombre: '',
    texto: '',
    estrellas: 5
  });

  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/productos`);
        if (!response.ok) {
          throw new Error('Error al conectar con la API');
        }
        const data = await response.json();
        setProductos(data);
      } catch (error) {
        console.error("Error al obtener catálogo:", error);
        // Semilla local enriquecida con productos de culto para aficionados
        setProductos([
          { id: 1, nombre: "Windows 11 Pro", descripcion: "Licencia OEM permanente enlazada al hardware del equipo.\nActivación 100% limpia y directa con Microsoft.\nSoporte para actualizaciones oficiales.", precio: 29.90, duracionMeses: 0, categoria: "Software", imagenUrl: "/windows.png" },
          { id: 2, nombre: "Office Profesional Plus 2024", descripcion: "Licencia perpetua de Office 2024 (Word, Excel, PowerPoint, Outlook).\nPago único sin mensualidades.\nDescarga oficial directa desde setup.office.com.", precio: 45.00, duracionMeses: 0, categoria: "Software", imagenUrl: "/office2024.png" },
          { id: 3, nombre: "Office Hogar y Empresas 2024 (Mac & PC)", descripcion: "Licencia perpetua oficial compatible con MacOS y Windows.\nVinculable a tu cuenta personal de Microsoft.\nIdeal para MacBooks y usuarios de Apple.", precio: 59.90, duracionMeses: 0, categoria: "Software", imagenUrl: "/office2024.png" },
          { id: 4, nombre: "Office 365 A3", descripcion: "Suscripción anual de Office 365 con 1 TB de almacenamiento en la nube OneDrive.\nInstalable en hasta 5 dispositivos simultáneos.", precio: 59.90, duracionMeses: 12, categoria: "Software", imagenUrl: "/office365.png" },
          { id: 5, nombre: "ESET Internet Security", descripcion: "Activación retail de 365 días para 1 PC.\nProtección antivirus, banca electrónica blindada y firewall inteligente.", precio: 39.90, duracionMeses: 12, categoria: "Software", imagenUrl: "/eset.png" },
          { id: 6, nombre: "Internet Download Manager (IDM)", descripcion: "Licencia perpetua del acelerador de descargas #1 para Windows.\nMultiplica la velocidad hasta 5x con reanudación.", precio: 29.00, duracionMeses: 0, categoria: "Software", imagenUrl: "/nitro14.png" },
          { id: 7, nombre: "WinRAR Pro", descripcion: "Licencia oficial permanente del compresor universal.\nElimina el aviso de prueba para siempre.", precio: 19.90, duracionMeses: 0, categoria: "Software", imagenUrl: "/nitro14.png" },
          { id: 8, nombre: "Malwarebytes Premium (1 Año)", descripcion: "Seguridad antimalware complementaria con protección en tiempo real contra ransomware y phishing.", precio: 35.00, duracionMeses: 12, categoria: "Software", imagenUrl: "/eset.png" },
          { id: 9, nombre: "NordVPN (1 Año)", descripcion: "VPN de alta velocidad sin límites para streaming, privacidad y seguridad en redes públicas.", precio: 49.90, duracionMeses: 12, categoria: "Software", imagenUrl: "/nitro14.png" },
          { id: 10, nombre: "Canva Pro (Anual)", descripcion: "Acceso premium administrado mediante equipo.\nDiseño ilimitado con millones de plantillas pro.", precio: 49.90, duracionMeses: 12, categoria: "Software", imagenUrl: "/canva.png" },
          { id: 11, nombre: "CapCut Pro (Anual)", descripcion: "Edición de video premium anual con efectos IA avanzados y exportación en 4K sin marca de agua.", precio: 69.90, duracionMeses: 12, categoria: "Software", imagenUrl: "/capcut.png" },
          { id: 12, nombre: "ChatGPT Plus (1 Mes)", descripcion: "Acceso a GPT-4o, Canvas, creación de imágenes DALL-E y GPTs personalizados.", precio: 19.90, duracionMeses: 1, categoria: "IA", imagenUrl: "/chatgpt.png" },
          { id: 13, nombre: "Claude Pro (1 Mes)", descripcion: "Acceso ilimitado a Claude 3.5 Sonnet de Anthropic con alta capacidad de análisis y desarrollo.", precio: 24.90, duracionMeses: 1, categoria: "IA", imagenUrl: "/gemini.png" },
          { id: 14, nombre: "Netflix Premium (1 Mes)", descripcion: "Perfil privado con PIN en UHD 4K sin interrupciones con garantía de reposición inmediata.", precio: 15.00, duracionMeses: 1, categoria: "Streaming", imagenUrl: "/netflix.png" },
          { id: 15, nombre: "Spotify Premium (1 Mes)", descripcion: "Activación oficial a tu propio correo sin perder playlists ni historial.", precio: 9.90, duracionMeses: 1, categoria: "Streaming", imagenUrl: "/spotifypremium.png" },
          { id: 16, nombre: "YouTube Premium (1 Mes)", descripcion: "Sin anuncios, reproducción en segundo plano y YouTube Music incluido a tu propio correo.", precio: 10.00, duracionMeses: 1, categoria: "Streaming", imagenUrl: "/youtubepremium.png" },
          { id: 17, nombre: "HBO Max (1 Mes)", descripcion: "Perfil de streaming mensual en 4K HDR con acceso inmediato.", precio: 12.00, duracionMeses: 1, categoria: "Streaming", imagenUrl: "/hbomax.png" }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, []);

  // Cargar reseñas guardadas desde localStorage
  useEffect(() => {
    try {
      const guardadas = localStorage.getItem('informatics_reseñas_productos');
      if (guardadas) {
        setReseñas(JSON.parse(guardadas));
      } else {
        const semillas = {
          default: [
            { id: 'r1', cliente: 'Carlos Mendoza (Entusiasta PC)', estrellas: 5, comentario: 'Activé Windows 11 y Office 2024 directamente en setup.office.com sin problema alguno. ¡Claves 100% genuinas!', fecha: 'Hace 2 días' },
            { id: 'r2', cliente: 'Rodrigo P. (Editor)', estrellas: 5, comentario: 'El combo de Canva Pro y CapCut me salvó la vida. Soporte rápido por WhatsApp.', fecha: 'Hace 4 días' },
            { id: 'r3', cliente: 'Valeria S. (Cineasta)', estrellas: 5, comentario: 'Netflix con PIN propio en mi Smart TV funcionando perfecto todo el mes.', fecha: 'Hace 1 semana' }
          ]
        };
        setReseñas(semillas);
        localStorage.setItem('informatics_reseñas_productos', JSON.stringify(semillas));
      }
    } catch (e) {
      console.error("Error al leer reseñas de localStorage:", e);
    }
  }, []);

  // Definición de Combos Pro para entusiastas con ahorro visible
  const combosPro = [
    {
      id: 'combo-pc-master',
      nombre: '🔥 Combo Formateo PC Master',
      subtitulo: 'Windows 11 Pro + Office 2024 Pro Plus + ESET Antivirus',
      descripcion: 'El kit definitivo para dejar tu computadora blindada, activada de por vida y protegida con la mejor suite de seguridad.',
      precioOriginal: 114.80,
      precioCombo: 89.90,
      ahorro: 24.90,
      items: ['Windows 11 Pro', 'Office Profesional Plus 2024', 'ESET Internet Security'],
      badge: 'Más Vendido para Técnicos y Gamers'
    },
    {
      id: 'combo-creador',
      nombre: '🎨 Combo Creador de Contenido & Video',
      subtitulo: 'Canva Pro + CapCut Pro + Filmora',
      descripcion: 'Todo lo que necesitas para diseñar miniaturas virales, editar reels y producir videos en 4K sin marcas de agua.',
      precioOriginal: 159.80,
      precioCombo: 129.90,
      ahorro: 29.90,
      items: ['Canva Pro (Anual)', 'CapCut Pro (Anual)', 'Filmora'],
      badge: 'Ahorro del 20% Anual'
    },
    {
      id: 'combo-entretenimiento',
      nombre: '🍿 Combo Cine & Música Total',
      subtitulo: 'Netflix UHD + Spotify + YouTube Premium + HBO Max',
      descripcion: 'Disfruta de películas, series sin anuncios y tu música favorita en máxima fidelidad con perfiles garantizados.',
      precioOriginal: 46.90,
      precioCombo: 36.90,
      ahorro: 10.00,
      items: ['Netflix Premium (1 Mes)', 'Spotify Premium (1 Mes)', 'YouTube Premium (1 Mes)', 'HBO Max (1 Mes)'],
      badge: 'Cero Anuncios en 4K'
    },
    {
      id: 'combo-doble-ia',
      nombre: '🤖 Combo Dúo Inteligencia Artificial',
      subtitulo: 'ChatGPT Plus + Claude Pro (o Gemini Advanced)',
      descripcion: 'Compara respuestas, programa software y analiza documentos extensos con los 2 mejores modelos de IA del planeta.',
      precioOriginal: 44.80,
      precioCombo: 34.90,
      ahorro: 9.90,
      items: ['ChatGPT Plus (1 Mes)', 'Claude Pro (1 Mes)'],
      badge: 'Productividad Extrema'
    }
  ];

  const handleAgregar = (producto, e) => {
    if (e) e.stopPropagation();
    addToCart(producto);
    showToast(`"${producto.nombre}" agregado al carrito`, 'success');
    setProductoAgregadoId(producto.id || producto.productoId);
    setTimeout(() => {
      setProductoAgregadoId(null);
    }, 1500);
  };

  const handleAgregarCombo = (combo) => {
    let agregados = 0;
    combo.items.forEach(itemNombre => {
      const prodEncontrado = productos.find(p => p.nombre.toLowerCase().includes(itemNombre.toLowerCase()) || itemNombre.toLowerCase().includes(p.nombre.toLowerCase()));
      if (prodEncontrado) {
        addToCart(prodEncontrado);
        agregados++;
      }
    });

    if (agregados > 0) {
      showSuccess(
        '¡Combo Agregado al Carrito!', 
        `Se añadieron ${agregados} productos del "${combo.nombre}". Aprovecha el descuento aplicado en tu orden.`
      );
    } else {
      showWarning('Aviso', 'Los productos de este combo se están sincronizando con el inventario.');
    }
  };

  const getBadgeDuracion = (meses) => {
    if (meses === 0) return { texto: 'Permanente', clase: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' };
    if (meses === 1) return { texto: 'Mensual', clase: 'bg-sky-500/10 text-sky-400 border border-sky-500/20' };
    return { texto: 'Anual', clase: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' };
  };

  const productosFiltrados = productos.filter((prod) => {
    if (prod.activo === false) return false;
    const tech = getTechnicalDetails(prod);
    const cumpleFiltroCat = filtro === 'Todos' || prod.categoria === filtro;
    const cumpleFiltroPlataforma = filtroPlataforma === 'Todas' || 
      (filtroPlataforma === 'Windows' && tech.plataforma.includes('Windows')) ||
      (filtroPlataforma === 'Mac' && tech.plataforma.includes('Mac')) ||
      (filtroPlataforma === 'Multi' && tech.plataforma.includes('Multi'));

    const cumpleBusqueda = (prod.nombre || '').toLowerCase().includes(buscar.toLowerCase()) ||
      (prod.descripcion || '').toLowerCase().includes(buscar.toLowerCase()) ||
      tech.tipoLicencia.toLowerCase().includes(buscar.toLowerCase());

    return cumpleFiltroCat && cumpleFiltroPlataforma && cumpleBusqueda;
  });

  const obtenerReseñasProducto = (prodId) => {
    const lista = reseñas[prodId] || reseñas['default'] || [];
    return lista;
  };

  const obtenerPromedioEstrellas = (prodId) => {
    const lista = obtenerReseñasProducto(prodId);
    if (lista.length === 0) return '5.0';
    const suma = lista.reduce((acc, r) => acc + (r.estrellas || 5), 0);
    return (suma / lista.length).toFixed(1);
  };

  const handleGuardarReseña = (e, prodId) => {
    e.preventDefault();
    if (!nuevoComentario.nombre.trim() || !nuevoComentario.texto.trim()) {
      showWarning('Campos incompletos', 'Por favor ingresa tu nombre y tu comentario.');
      return;
    }

    const nuevaReseña = {
      id: Date.now().toString(),
      cliente: nuevoComentario.nombre.trim(),
      estrellas: nuevoComentario.estrellas,
      comentario: nuevoComentario.texto.trim(),
      fecha: 'Justo ahora'
    };

    const prevLista = reseñas[prodId] || reseñas['default'] || [];
    const nuevaLista = [nuevaReseña, ...prevLista];
    const nuevoEstado = {
      ...reseñas,
      [prodId]: nuevaLista
    };

    setReseñas(nuevoEstado);
    try {
      localStorage.setItem('informatics_reseñas_productos', JSON.stringify(nuevoEstado));
    } catch (err) {
      console.error("Error al guardar reseña:", err);
    }

    setNuevoComentario({ nombre: '', texto: '', estrellas: 5 });
    showSuccess('¡Muchas gracias!', 'Tu valoración técnica ha sido publicada con éxito.');
  };

  const handleAbrirWhatsAppProducto = (prod) => {
    const whatsappAdmin = '51984497138';
    const tech = getTechnicalDetails(prod);
    const textoMensaje = encodeURIComponent(
      `*CONSULTA TÉCNICA - INFORMATICS*\n\n` +
      `*Producto:* ${prod.nombre}\n` +
      `*Plataforma:* ${tech.plataforma}\n` +
      `*Tipo Licencia:* ${tech.tipoLicencia}\n` +
      `*Precio:* S/ ${Number(prod.precio).toFixed(2)}\n\n` +
      `Hola, soy usuario de PC/Software y quisiera confirmar la compatibilidad y stock para entrega inmediata.`
    );
    window.open(`https://api.whatsapp.com/send?phone=${whatsappAdmin}&text=${textoMensaje}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Banner Principal Futurista */}
      <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 mb-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-emerald-500/10 to-indigo-500/10 pointer-events-none" />
        <div className="space-y-4 max-w-2xl text-center md:text-left z-10">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="bg-sky-500/10 text-sky-400 font-bold text-xs px-3.5 py-1.5 rounded-full border border-sky-500/20 tracking-widest uppercase flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Informatics Pro Hub
            </span>
            <span className="bg-emerald-500/10 text-emerald-400 font-bold text-xs px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Claves Genuinas & Garantía Anti-Caídas
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-100 tracking-tight leading-tight">
            Software Oficial, Ofimática & Streaming Garantizado
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Sin intermediarios dudosos. Descarga directo desde los servidores oficiales de Microsoft, Tonec y ESET. Accede a perfiles UHD 4K con PIN privado y soporte de reposición inmediata.
          </p>
        </div>

        {/* Mini stats para entusiastas */}
        <div className="z-10 grid grid-cols-2 gap-3 w-full md:w-auto">
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center backdrop-blur-md">
            <span className="block text-2xl font-black text-sky-400 font-mono">100%</span>
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Activación Limpia</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center backdrop-blur-md">
            <span className="block text-2xl font-black text-emerald-400 font-mono">&lt; 15 min</span>
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Entrega Rápida</span>
          </div>
        </div>
      </div>

      {/* Controles de Búsqueda, Filtro de Categorías y Plataformas */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
          {/* Buscador */}
          <div className="relative w-full lg:w-96">
            <input
              type="text"
              placeholder="Buscar Office 2024, Windows, IDM, Netflix..."
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-all text-sm"
            />
            <Search className="absolute left-4 top-3.5 text-slate-600 w-4 h-4" />
          </div>

          {/* Filtros de Categorías Principales */}
          <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            {[
              { id: 'Todos', label: 'Todos', icon: Layers },
              { id: 'Software', label: 'Software & PC', icon: Monitor },
              { id: 'Streaming', label: 'Streaming', icon: Tv },
              { id: 'IA', label: 'Inteligencia Artificial', icon: BrainCircuit },
              { id: 'Combos', label: '🔥 Combos de Ahorro', icon: Flame }
            ].map((cat) => {
              const Icon = cat.icon;
              const activo = filtro === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setFiltro(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 whitespace-nowrap ${
                    activo
                      ? 'bg-sky-500 text-slate-955 shadow-lg shadow-sky-500/25 scale-102'
                      : 'bg-slate-955 text-slate-400 border border-slate-800 hover:bg-slate-900 hover:text-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Barra de Filtro Rápido por Plataforma (Windows / Mac / Multi) */}
        {filtro !== 'Combos' && (
          <div className="flex items-center gap-2 px-2 overflow-x-auto text-xs">
            <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap mr-1">
              Plataforma:
            </span>
            {[
              { id: 'Todas', label: 'Todas las Plataformas' },
              { id: 'Windows', label: '💻 Windows (10/11)' },
              { id: 'Mac', label: '🍎 MacOS / Apple' },
              { id: 'Multi', label: '🌐 Multiplataforma / Smart TV' }
            ].map((plat) => (
              <button
                key={plat.id}
                onClick={() => setFiltroPlataforma(plat.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  filtroPlataforma === plat.id
                    ? 'bg-slate-800 text-sky-400 border border-sky-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                {plat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* --- SECCIÓN DESTACADA DE COMBOS PRO DE AHORRO --- */}
      {(filtro === 'Combos' || filtro === 'Todos') && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Flame className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-100">Packs & Combos Pro para Aficionados</h2>
                <p className="text-xs text-slate-400">Lleva suites completas con descuento garantizado en 1 solo clic</p>
              </div>
            </div>
            {filtro !== 'Combos' && (
              <button 
                onClick={() => setFiltro('Combos')}
                className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                Ver todos los combos →
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {combosPro.map((combo) => (
              <div 
                key={combo.id}
                className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-amber-500/10 border-l border-b border-amber-500/30 text-amber-400 text-[10px] font-extrabold px-2.5 py-1 rounded-bl-xl uppercase tracking-wider">
                  Ahorras S/ {combo.ahorro.toFixed(2)}
                </div>

                <div>
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest block mb-1">
                    {combo.badge}
                  </span>
                  <h3 className="text-base font-black text-slate-100 group-hover:text-amber-300 transition-colors">
                    {combo.nombre}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 mb-4 leading-relaxed line-clamp-2">
                    {combo.descripcion}
                  </p>

                  <div className="space-y-1.5 mb-5 bg-slate-955/60 p-3 rounded-xl border border-slate-850">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Incluye {combo.items.length} Licencias:
                    </span>
                    {combo.items.map((it, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="truncate">{it}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 line-through block">
                      Antes S/ {combo.precioOriginal.toFixed(2)}
                    </span>
                    <span className="text-lg font-black text-emerald-400 font-mono">
                      S/ {combo.precioCombo.toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAgregarCombo(combo)}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-955 font-black px-3.5 py-2 rounded-xl text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Llevar Combo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid del Catálogo Individual de Productos */}
      {filtro !== 'Combos' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-sky-400" />
              Catálogo Individual ({productosFiltrados.length} Disponibles)
            </h2>
            <span className="text-xs text-slate-400">
              🟢 Stock en tiempo real disponible
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
            </div>
          ) : productosFiltrados.length === 0 ? (
            <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl max-w-xl mx-auto p-8 shadow-2xl">
              <p className="text-slate-400">No encontramos productos con los filtros seleccionados.</p>
              <button 
                onClick={() => { setFiltro('Todos'); setFiltroPlataforma('Todas'); setBuscar(''); }}
                className="mt-4 bg-sky-500 text-slate-955 font-bold px-4 py-2 rounded-xl text-xs"
              >
                Limpiar Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {productosFiltrados.map((prod) => {
                const id = prod.id || prod.productoId;
                const badge = getBadgeDuracion(prod.duracionMeses);
                const tech = getTechnicalDetails(prod);
                const esAgregado = productoAgregadoId === id;
                const promedioEstrellas = obtenerPromedioEstrellas(id);

                return (
                  <div
                    key={id}
                    onClick={() => setProductoSeleccionado(prod)}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md hover:shadow-2xl hover:border-sky-500/40 transition-all duration-300 flex flex-col justify-between group cursor-pointer transform hover:-translate-y-1 relative"
                  >
                    {/* Imagen & Badges Superpuestos */}
                    <div className="relative w-full aspect-square overflow-hidden bg-slate-955 rounded-xl mb-3">
                      <CachedImage
                        src={prod.imagenUrl || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=300&q=80'}
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=300&q=80'; }}
                        alt={prod.nombre}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      
                      {/* Badge Superior Izquierdo: Categoría y Plataforma */}
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md shadow-md tracking-wider backdrop-blur-md ${
                          prod.categoria === 'Software' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                          prod.categoria === 'Streaming' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {prod.categoria}
                        </span>
                        <span className="text-[9px] font-bold bg-slate-950/80 text-slate-300 px-2 py-0.5 rounded-md border border-slate-800 backdrop-blur-md">
                          {tech.plataforma}
                        </span>
                      </div>

                      {/* Badge Superior Derecho: Duración */}
                      <div className="absolute top-2.5 right-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md backdrop-blur-md ${badge.clase}`}>
                          {badge.texto}
                        </span>
                      </div>

                      {/* Indicador Ver Ficha Técnica al hacer hover */}
                      <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                        <span className="bg-sky-500 text-slate-955 text-xs font-black px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                          <Info className="w-4 h-4" />
                          Ver Ficha Técnica & Requisitos
                        </span>
                      </div>
                    </div>

                    {/* Contenido de la Tarjeta */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-slate-100 line-clamp-1 group-hover:text-sky-400 transition-colors">
                            {prod.nombre}
                          </h3>
                        </div>

                        {/* Tipo de Entrega y Rating */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-amber-400">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span className="font-bold text-slate-200 text-[11px]">{promedioEstrellas}</span>
                          </div>
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
                            {tech.tipoEntrega}
                          </span>
                        </div>

                        <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed min-h-[34px]">
                          {prod.descripcion}
                        </p>
                      </div>

                      {/* Precio y Botón de Compra */}
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-800/80">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Precio Genuino</span>
                          <span className="text-lg font-black text-emerald-400 font-mono">
                            S/ {Number(prod.precio).toFixed(2)}
                          </span>
                        </div>

                        <button
                          onClick={(e) => handleAgregar(prod, e)}
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-all duration-300 active:scale-95 ${
                            esAgregado
                              ? 'bg-emerald-500 text-slate-955 shadow-lg shadow-emerald-500/25'
                              : 'bg-sky-500 hover:bg-sky-400 text-slate-955 shadow-lg shadow-sky-500/20'
                          }`}
                          title={esAgregado ? "Agregado al Carrito" : "Comprar Producto"}
                        >
                          {esAgregado ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Agregado
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-3.5 h-3.5" />
                              Comprar
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* --- MODAL FLOTANTE DE DETALLE DE PRODUCTO & FICHA TÉCNICA --- */}
      {productoSeleccionado && (() => {
        const tech = getTechnicalDetails(productoSeleccionado);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-955/80 backdrop-blur-md animate-fade-in">
            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative p-5 sm:p-8 space-y-6 text-slate-100">
              {/* Botón de cierre */}
              <button
                onClick={() => setProductoSeleccionado(null)}
                className="absolute top-4 right-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white p-2 rounded-full transition-colors z-20"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Layout Encabezado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Imagen */}
                <div className="relative aspect-square w-full bg-slate-955 rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
                  <CachedImage
                    src={productoSeleccionado.imagenUrl || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=300&q=80'}
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=300&q=80'; }}
                    alt={productoSeleccionado.nombre}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <span className="text-[11px] font-extrabold uppercase px-3 py-1 rounded-full shadow-md bg-sky-500/20 text-sky-300 border border-sky-500/30 backdrop-blur-md">
                      {productoSeleccionado.categoria}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full shadow-md backdrop-blur-md ${getBadgeDuracion(productoSeleccionado.duracionMeses).clase}`}>
                      {getBadgeDuracion(productoSeleccionado.duracionMeses).texto}
                    </span>
                  </div>
                </div>

                {/* Información Principal y Especificaciones de Aficionado */}
                <div className="space-y-4 flex flex-col justify-between h-full">
                  <div>
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">
                      Ficha Técnica & Arquitectura
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-100 mt-1 mb-2">
                      {productoSeleccionado.nombre}
                    </h2>

                    {/* Cuadrícula de Especificaciones Técnicas */}
                    <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Plataforma</span>
                        <span className="font-semibold text-slate-200">{tech.plataforma}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Tipo de Licencia</span>
                        <span className="font-semibold text-slate-200">{tech.tipoLicencia}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Método de Entrega</span>
                        <span className="font-semibold text-cyan-400">{tech.tipoEntrega}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Garantía</span>
                        <span className="font-semibold text-emerald-400">100% Reposición</span>
                      </div>
                    </div>

                    {/* Requisitos de Sistema */}
                    <div className="bg-slate-955/60 border border-slate-800 p-3.5 rounded-xl space-y-1 mb-4 text-xs">
                      <span className="font-bold text-slate-300 text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
                        <Laptop className="w-3.5 h-3.5 text-sky-400" /> Requisitos de Sistema:
                      </span>
                      <p className="text-slate-400">{tech.requisitos}</p>
                    </div>

                    {/* Pasos de Activación */}
                    <div className="bg-slate-955/60 border border-slate-800 p-3.5 rounded-xl space-y-2 mb-4 text-xs">
                      <span className="font-bold text-slate-300 text-[11px] flex items-center gap-1.5 uppercase tracking-wider">
                        <Zap className="w-3.5 h-3.5 text-amber-400" /> Pasos de Activación Inmediata:
                      </span>
                      <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
                        {tech.pasos.map((paso, pIdx) => (
                          <li key={pIdx} className="leading-snug">{paso}</li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  {/* Precio y Botones de Acción */}
                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Precio Oficial:</span>
                      <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                        S/ {Number(productoSeleccionado.precio).toFixed(2)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleAbrirWhatsAppProducto(productoSeleccionado)}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-955 font-black py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-xs shadow-lg active:scale-95"
                      >
                        <WhatsAppIconSVG className="w-4 h-4" />
                        Consultar en WhatsApp
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          handleAgregar(productoSeleccionado, e);
                          setProductoSeleccionado(null);
                        }}
                        className="w-full bg-sky-500 hover:bg-sky-400 text-slate-955 font-black py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-xs shadow-lg active:scale-95"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Agregar al Carrito
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Opiniones de Clientes */}
              <div className="pt-6 border-t border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-sky-400" />
                    Opiniones y Verificaciones de la Comunidad
                  </h3>
                  <span className="text-xs text-slate-400">
                    Puntuación promedio: <strong className="text-amber-400">{obtenerPromedioEstrellas(productoSeleccionado.id || productoSeleccionado.productoId)} / 5.0</strong>
                  </span>
                </div>

                <div className="space-y-2.5 max-h-40 overflow-y-auto pr-2 scrollbar-thin">
                  {obtenerReseñasProducto(productoSeleccionado.id || productoSeleccionado.productoId).map((res) => (
                    <div key={res.id} className="bg-slate-955/70 border border-slate-850 p-3 rounded-xl space-y-1">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-200">{res.cliente}</span>
                          <div className="flex text-amber-400">
                            {[...Array(res.estrellas || 5)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-amber-400" />
                            ))}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{res.fecha}</span>
                      </div>
                      <p className="text-xs text-slate-400">"{res.comentario}"</p>
                    </div>
                  ))}
                </div>

                {/* Formulario para Dejar Comentario */}
                <form 
                  onSubmit={(e) => handleGuardarReseña(e, productoSeleccionado.id || productoSeleccionado.productoId)} 
                  className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Tu Nombre o Usuario"
                      value={nuevoComentario.nombre}
                      onChange={(e) => setNuevoComentario(prev => ({ ...prev, nombre: e.target.value }))}
                      className="bg-slate-955 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
                    />
                    <select
                      value={nuevoComentario.estrellas}
                      onChange={(e) => setNuevoComentario(prev => ({ ...prev, estrellas: Number(e.target.value) }))}
                      className="bg-slate-955 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    >
                      <option value="5">★★★★★ (5 Estrellas - Activación Exitosa)</option>
                      <option value="4">★★★★☆ (4 Estrellas - Muy Bueno)</option>
                      <option value="3">★★★☆☆ (3 Estrellas - Bueno)</option>
                    </select>
                  </div>
                  <textarea
                    required
                    rows="2"
                    placeholder="Comparte tu experiencia de activación o velocidad de entrega..."
                    value={nuevoComentario.texto}
                    onChange={(e) => setNuevoComentario(prev => ({ ...prev, texto: e.target.value }))}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-sky-500 hover:bg-sky-400 text-slate-955 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md active:scale-95"
                    >
                      Publicar Opinión
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
