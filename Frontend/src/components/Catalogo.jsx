import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { 
  Search, Monitor, Tv, BrainCircuit, ShoppingCart, Info, Check, 
  X, Star, CheckCircle2, MessageSquare, ShieldCheck, Zap 
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

export default function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [filtro, setFiltro] = useState('Todos');
  const [buscar, setBuscar] = useState('');
  const [loading, setLoading] = useState(true);
  const [productoAgregadoId, setProductoAgregadoId] = useState(null);
  
  // Estado para Modal de Detalle de Producto
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  // Estado para Reseñas y Comentarios de Clientes por producto (persistido en localStorage)
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
        // Semilla local de respaldo si falla la API
        setProductos([
          { id: 1, nombre: "Canva Pro (Anual)", descripcion: "Acceso premium administrado mediante equipo.\nDiseño ilimitado y plantillas pro.\nSoporte garantizado durante todo el año.", precio: 49.90, duracionMeses: 12, categoria: "Software", imagenUrl: "https://upload.wikimedia.org/wikipedia/commons/0/08/Canva_icon_2021.svg" },
          { id: 2, nombre: "CapCut Pro (Anual)", descripcion: "Edición de video premium anual.\nFiltros y efectos de IA avanzados.\nExportación en 4K sin marca de agua.", precio: 69.90, duracionMeses: 12, categoria: "Software", imagenUrl: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Capcut-logo.svg" },
          { id: 3, nombre: "ESET Internet Security", descripcion: "Activación retail de 365 días.\nProtección antivirus y banca segura.\nLicencia oficial para 1 PC.", precio: 39.90, duracionMeses: 12, categoria: "Software", imagenUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c9/ESET_logo.png" },
          { id: 4, nombre: "Windows 11 Pro", descripcion: "Licencia OEM enlazada al hardware del equipo.\nActivación permanente y directa con Microsoft.\nSoporte para actualizaciones oficiales.", precio: 29.90, duracionMeses: 0, categoria: "Software", imagenUrl: "https://upload.wikimedia.org/wikipedia/commons/8/87/Windows_logo_-_2021.svg" },
          { id: 5, nombre: "ChatGPT Plus (1 Mes)", descripcion: "Acceso a GPT-4o e Inteligencia Artificial rápida.\nCreación de imágenes DALL-E 3.\nUso de GPTs personalizados.", precio: 19.90, duracionMeses: 1, categoria: "IA", imagenUrl: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg" },
          { id: 6, nombre: "Netflix Premium (1 Mes)", descripcion: "Cuenta completa o pantalla Ultra HD 4K.\nSin interrupciones y con garantía total.\nSoporte de renovación mensual.", precio: 15.00, duracionMeses: 1, categoria: "Streaming", imagenUrl: "https://upload.wikimedia.org/wikipedia/commons/7/75/Netflix_icon.svg" },
          { id: 7, nombre: "HBO Max (1 Mes)", descripcion: "Perfil de streaming mensual en 4K HDR.\nAcceso inmediato en todos tus dispositivos.", precio: 12.00, duracionMeses: 1, categoria: "Streaming", imagenUrl: "https://upload.wikimedia.org/wikipedia/commons/1/17/HBO_Max_Logo.svg" }
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
            { id: 'r1', cliente: 'Carlos Mendoza', estrellas: 5, comentario: 'Licencia 100% original y entregada al instante. Excelente soporte por WhatsApp.', fecha: 'Hace 2 días' },
            { id: 'r2', cliente: 'Ana María R.', estrellas: 5, comentario: 'Súper recomendado, me ayudaron con la instalación en minutos.', fecha: 'Hace 5 días' }
          ]
        };
        setReseñas(semillas);
        localStorage.setItem('informatics_reseñas_productos', JSON.stringify(semillas));
      }
    } catch (e) {
      console.error("Error al leer reseñas de localStorage:", e);
    }
  }, []);

  const handleAgregar = (producto, e) => {
    if (e) e.stopPropagation();
    addToCart(producto);
    showToast(`"${producto.nombre}" agregado al carrito`, 'success');
    setProductoAgregadoId(producto.id || producto.productoId);
    setTimeout(() => {
      setProductoAgregadoId(null);
    }, 1500);
  };

  const getBadgeDuracion = (meses) => {
    if (meses === 0) return { texto: 'Permanente', clase: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' };
    if (meses === 1) return { texto: 'Mensual', clase: 'bg-sky-500/10 text-sky-400 border border-sky-500/20' };
    return { texto: 'Anual', clase: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' };
  };

  const productosFiltrados = productos.filter((prod) => {
    const cumpleFiltro = filtro === 'Todos' || prod.categoria === filtro;
    const cumpleBusqueda = (prod.nombre || '').toLowerCase().includes(buscar.toLowerCase()) ||
      (prod.descripcion || '').toLowerCase().includes(buscar.toLowerCase());
    return cumpleFiltro && cumpleBusqueda;
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
    showSuccess('¡Muchas gracias!', 'Tu valoración ha sido publicada con éxito.');
  };

  const handleAbrirWhatsAppProducto = (prod) => {
    const whatsappAdmin = '51984497138';
    const duracion = prod.duracionMeses === 0 ? 'Perpetuo' : `${prod.duracionMeses} Mes(es)`;
    const textoMensaje = encodeURIComponent(
      `*CONSULTA DE LICENCIA - INFORMATICS*\n\n` +
      `*Producto:* ${prod.nombre}\n` +
      `*Categoría:* ${prod.categoria}\n` +
      `*Duración:* ${duracion}\n` +
      `*Precio:* S/ ${Number(prod.precio).toFixed(2)}\n\n` +
      `Hola, quisiera más detalles o consultar el stock disponible para adquirir esta licencia.`
    );
    window.open(`https://api.whatsapp.com/send?phone=${whatsappAdmin}&text=${textoMensaje}`, '_blank');
  };

  const parsearCaracteristicas = (descripcionStr) => {
    if (!descripcionStr) return [];
    const lineas = descripcionStr
      .split(/\r?\n|•|-/)
      .map(l => l.trim())
      .filter(l => l.length > 0);
    return lineas.length > 0 ? lineas : [descripcionStr];
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Banner Principal */}
      <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 mb-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-emerald-500/10 pointer-events-none" />
        <div className="space-y-4 max-w-2xl text-center md:text-left z-10">
          <span className="bg-sky-500/10 text-sky-400 font-bold text-xs px-3.5 py-1.5 rounded-full border border-sky-500/20 tracking-widest uppercase">
            Catálogo Oficial - Informatics
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-100 tracking-tight leading-tight">
            Licencias de Software e Inteligencia Artificial
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Compra tus licencias premium y perfiles de streaming de manera garantizada. Haz clic en cualquier producto para ver sus características completas y valoraciones.
          </p>
        </div>
      </div>

      {/* Controles de Búsqueda y Filtro */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        {/* Buscador */}
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Buscar producto o licencia..."
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-all text-sm"
          />
          <Search className="absolute left-4 top-3.5 text-slate-600 w-4 h-4" />
        </div>

        {/* Filtros de Categorías */}
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {[
            { id: 'Todos', label: 'Todos', icon: Info },
            { id: 'Software', label: 'Software', icon: Monitor },
            { id: 'Streaming', label: 'Streaming', icon: Tv },
            { id: 'IA', label: 'Inteligencia Artificial', icon: BrainCircuit }
          ].map((cat) => {
            const Icon = cat.icon;
            const activo = filtro === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setFiltro(cat.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 whitespace-nowrap ${activo
                  ? 'bg-sky-500 text-slate-955 shadow-lg shadow-sky-500/25'
                  : 'bg-slate-955 text-slate-400 border border-slate-850 hover:bg-slate-900 hover:text-slate-100'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid del Catálogo */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl max-w-xl mx-auto p-8 shadow-2xl">
          <p className="text-slate-400">No encontramos productos que coincidan con la búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-2 sm:p-4">
          {productosFiltrados.map((prod) => {
            const id = prod.id || prod.productoId;
            const badge = getBadgeDuracion(prod.duracionMeses);
            const esAgregado = productoAgregadoId === id;
            const promedioEstrellas = obtenerPromedioEstrellas(id);

            return (
              <div
                key={id}
                onClick={() => setProductoSeleccionado(prod)}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md hover:shadow-xl hover:border-slate-700 transition-all duration-300 flex flex-col justify-between group cursor-pointer transform hover:-translate-y-1 relative"
              >
                {/* Imagen */}
                <div className="relative w-full aspect-square overflow-hidden bg-slate-950 rounded-xl mb-3">
                  <CachedImage
                    src={prod.imagenUrl || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=300&q=80'}
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=300&q=80'; }}
                    alt={prod.nombre}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-md tracking-wider ${prod.categoria === 'Software' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 backdrop-blur-md' :
                      prod.categoria === 'Streaming' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 backdrop-blur-md' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md'
                      }`}>
                      {prod.categoria}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md backdrop-blur-md ${badge.clase}`}>
                      {badge.texto}
                    </span>
                  </div>

                  {/* Indicador Ver Detalles flotante */}
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-sky-500 text-slate-955 text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" />
                      Ver Características
                    </span>
                  </div>
                </div>

                {/* Contenido */}
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-100 line-clamp-1 group-hover:text-sky-400 transition-colors">
                        {prod.nombre}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-amber-400">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="font-bold text-[11px] text-slate-300">{promedioEstrellas}</span>
                    </div>

                    <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed min-h-[34px]">
                      {prod.descripcion}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-800/80">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest">Precio</span>
                      <span className="text-lg font-bold text-emerald-400">
                        S/ {Number(prod.precio).toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleAgregar(prod, e)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs transition-all duration-300 active:scale-95 ${esAgregado
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

      {/* --- MODAL FLOTANTE DE DETALLE DE PRODUCTO FULL RESPONSIVE --- */}
      {productoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-955/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative p-5 sm:p-8 space-y-6 text-slate-100">
            {/* Botón de cierre */}
            <button
              onClick={() => setProductoSeleccionado(null)}
              className="absolute top-4 right-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white p-2 rounded-full transition-colors z-20"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Layout de Encabezado de Producto (2 Columnas en Escritorio) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Imagen del Producto */}
              <div className="relative aspect-square w-full bg-slate-955 rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
                <CachedImage
                  src={productoSeleccionado.imagenUrl || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=300&q=80'}
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=300&q=80'; }}
                  alt={productoSeleccionado.nombre}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  <span className={`text-[11px] font-extrabold uppercase px-3 py-1 rounded-full shadow-md backdrop-blur-md ${
                    productoSeleccionado.categoria === 'Software' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                    productoSeleccionado.categoria === 'Streaming' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {productoSeleccionado.categoria}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full shadow-md backdrop-blur-md ${getBadgeDuracion(productoSeleccionado.duracionMeses).clase}`}>
                    {getBadgeDuracion(productoSeleccionado.duracionMeses).texto}
                  </span>
                </div>
              </div>

              {/* Información y Precio */}
              <div className="space-y-4 flex flex-col justify-between h-full">
                <div>
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">Detalles de la Licencia</span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 mt-1 mb-2">
                    {productoSeleccionado.nombre}
                  </h2>

                  {/* Rating Estrellas */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-slate-200">
                      {obtenerPromedioEstrellas(productoSeleccionado.id || productoSeleccionado.productoId)} / 5.0
                    </span>
                    <span className="text-xs text-slate-500">
                      ({obtenerReseñasProducto(productoSeleccionado.id || productoSeleccionado.productoId).length} valoraciones)
                    </span>
                  </div>

                  {/* Lista de Características Formateadas */}
                  <div className="space-y-2 bg-slate-955/60 border border-slate-800 p-4 rounded-2xl">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-sky-400" />
                      Características del Producto:
                    </h4>
                    <ul className="space-y-2 pt-1">
                      {parsearCaracteristicas(productoSeleccionado.descripcion).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-300 leading-snug">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Precio y Botones de Acción */}
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Precio Oficial:</span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
                      S/ {Number(productoSeleccionado.precio).toFixed(2)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Botón WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleAbrirWhatsAppProducto(productoSeleccionado)}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-955 font-bold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-xs shadow-lg hover:shadow-emerald-500/20 active:scale-95"
                    >
                      <WhatsAppIconSVG className="w-4 h-4" />
                      Consultar en WhatsApp
                    </button>

                    {/* Botón Comprar */}
                    <button
                      type="button"
                      onClick={(e) => {
                        handleAgregar(productoSeleccionado, e);
                        setProductoSeleccionado(null);
                      }}
                      className="w-full bg-sky-500 hover:bg-sky-400 text-slate-955 font-bold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-xs shadow-lg hover:shadow-sky-500/20 active:scale-95"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Agregar al Carrito
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* --- SECCIÓN DE RESEÑAS Y COMENTARIOS DE CLIENTES --- */}
            <div className="pt-6 border-t border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-sky-400" />
                  Opiniones de Clientes Satisfechos
                </h3>
                <span className="text-xs bg-slate-900 text-sky-400 px-3 py-1 rounded-full border border-slate-800 font-bold">
                  Garantía & Experiencia
                </span>
              </div>

              {/* Lista de Comentarios Existentes */}
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                {obtenerReseñasProducto(productoSeleccionado.id || productoSeleccionado.productoId).map((res) => (
                  <div key={res.id} className="bg-slate-955/70 border border-slate-850 p-3.5 rounded-xl space-y-1.5">
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
                    <p className="text-xs text-slate-400 leading-relaxed">
                      "{res.comentario}"
                    </p>
                  </div>
                ))}
              </div>

              {/* Formulario para Dejar un Nuevo Comentario */}
              <form 
                onSubmit={(e) => handleGuardarReseña(e, productoSeleccionado.id || productoSeleccionado.productoId)} 
                className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3"
              >
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                  Dejar una Valoración de esta Licencia
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tu Nombre</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. José Gonzales"
                      value={nuevoComentario.nombre}
                      onChange={(e) => setNuevoComentario(prev => ({ ...prev, nombre: e.target.value }))}
                      className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Calificación</label>
                    <select
                      value={nuevoComentario.estrellas}
                      onChange={(e) => setNuevoComentario(prev => ({ ...prev, estrellas: Number(e.target.value) }))}
                      className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    >
                      <option value="5">★★★★★ (5 Estrellas - Excelente)</option>
                      <option value="4">★★★★☆ (4 Estrellas - Muy Bueno)</option>
                      <option value="3">★★★☆☆ (3 Estrellas - Bueno)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Comentario</label>
                  <textarea
                    required
                    rows="2"
                    placeholder="Escribe tu experiencia con el producto o la velocidad de entrega..."
                    value={nuevoComentario.texto}
                    onChange={(e) => setNuevoComentario(prev => ({ ...prev, texto: e.target.value }))}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 resize-none"
                  />
                </div>

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
      )}
    </div>
  );
}
