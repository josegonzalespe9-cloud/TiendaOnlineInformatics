import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Search, Monitor, Tv, BrainCircuit, ShoppingCart, Info, Check } from 'lucide-react';
import { API_URL } from '../services/api';

export default function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [filtro, setFiltro] = useState('Todos');
  const [buscar, setBuscar] = useState('');
  const [loading, setLoading] = useState(true);
  const [productoAgregadoId, setProductoAgregadoId] = useState(null);

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
          { id: 1, nombre: "Canva Pro (Anual)", descripcion: "Acceso premium administrado mediante equipo", precio: 49.90, duracionMeses: 12, categoria: "Software", imagenUrl: "/canva.png" },
          { id: 2, nombre: "CapCut Pro (Anual)", descripcion: "Edición de video premium anual", precio: 69.90, duracionMeses: 12, categoria: "Software", imagenUrl: "/capcut.png" },
          { id: 3, nombre: "ESET Internet Security", descripcion: "Activación retail de 365 días", precio: 39.90, duracionMeses: 12, categoria: "Software", imagenUrl: "/eset.png" },
          { id: 4, nombre: "Windows 11 Pro", descripcion: "Licencia OEM enlazada al hardware del equipo", precio: 29.90, duracionMeses: 0, categoria: "Software", imagenUrl: "/windows.png" },
          { id: 5, nombre: "ChatGPT Plus (1 Mes)", descripcion: "Acceso compartido perfil premium", precio: 19.90, duracionMeses: 1, categoria: "IA", imagenUrl: "/chatgpt.png" },
          { id: 6, nombre: "Netflix Premium (1 Mes)", descripcion: "Cuenta completa o pantalla ultra HD", precio: 15.00, duracionMeses: 1, categoria: "Streaming", imagenUrl: "/netflix.png" },
          { id: 7, nombre: "HBO Max (1 Mes)", descripcion: "Perfil de streaming mensual", precio: 12.00, duracionMeses: 1, categoria: "Streaming", imagenUrl: "/hbomax.png" }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, []);

  const handleAgregar = (producto) => {
    addToCart(producto);
    setProductoAgregadoId(producto.id);
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
    const cumpleBusqueda = prod.nombre.toLowerCase().includes(buscar.toLowerCase()) || 
                          prod.descripcion.toLowerCase().includes(buscar.toLowerCase());
    return cumpleFiltro && cumpleBusqueda;
  });

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
            Compra tus licencias premium y perfiles de streaming de manera garantizada. Aprovisionamiento seguro con soporte técnico directo en minutos.
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
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 whitespace-nowrap ${
                  activo
                    ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/25'
                    : 'bg-slate-950 text-slate-400 border border-slate-850 hover:bg-slate-900 hover:text-slate-100'
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {productosFiltrados.map((prod) => {
            const badge = getBadgeDuracion(prod.duracionMeses);
            const esAgregado = productoAgregadoId === prod.id;
            
            return (
              <div
                key={prod.id}
                className="bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:border-sky-500/50 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1.5 shadow-lg hover:shadow-sky-500/10 group"
              >
                {/* Imagen */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-950 border-b border-slate-800">
                  <img
                    src={prod.imagenUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500"}
                    alt={prod.nombre}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-md tracking-wider ${
                      prod.categoria === 'Software' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                      prod.categoria === 'Streaming' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {prod.categoria}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md ${badge.clase}`}>
                      {badge.texto}
                    </span>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2 mb-4">
                    <h3 className="text-base font-bold text-slate-100 line-clamp-1 group-hover:text-sky-400 transition-colors">
                      {prod.nombre}
                    </h3>
                    <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed min-h-[32px]">
                      {prod.descripcion}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest">Precio</span>
                      <span className="text-lg font-bold text-emerald-400">
                        S/ {prod.precio.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAgregar(prod)}
                      className={`p-3 rounded-xl transition-all duration-300 flex items-center justify-center transform active:scale-95 ${
                        esAgregado
                          ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                          : 'bg-slate-950 text-slate-300 hover:text-sky-400 border border-slate-800 hover:border-sky-500/30'
                      }`}
                      title="Agregar al Carrito"
                    >
                      {esAgregado ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <ShoppingCart className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
