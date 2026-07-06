import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { 
  FileText, Key, AlertTriangle, CheckSquare, RefreshCw, 
  ShieldAlert, CheckCircle2, Package, Users, BarChart3, Plus, 
  Trash2, Edit3, Save, X, Search, ChevronLeft, ChevronRight, TrendingUp, Info, Eye, EyeOff
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { API_URL } from '../services/api';

export default function AdminPanel() {
  const { user } = useCart();
  const [tab, setTab] = useState('ordenes'); // 'ordenes' | 'productos' | 'clientes' | 'reportes'

  // --- ESTADOS PARA ÓRDENES ---
  const [ordenes, setOrdenes] = useState([]);
  const [renovaciones, setRenovaciones] = useState([]);
  const [loadingOrdenes, setLoadingOrdenes] = useState(true);
  const [clavesForm, setClavesForm] = useState({});
  const [activeOrderInputId, setActiveOrderInputId] = useState(null);
  const [editingOrderInputId, setEditingOrderInputId] = useState(null);
  const [editOrderItems, setEditOrderItems] = useState([]); // List of { productoId, cantidad, nombre }

  // --- ESTADOS PARA PRODUCTOS (CRUD) ---
  const [productos, setProductos] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(true);
  const [showProductForm, setShowProductForm] = useState(null); // 'create' | 'edit'
  const [editingProducto, setEditingProducto] = useState(null);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [productForm, setProductForm] = useState({
    nombre: '',
    descripcion: '',
    precio: 0,
    duracionMeses: 0,
    categoria: 'Software',
    imagenUrl: '',
    costoProveedor: 0
  });

  // --- ESTADOS PARA CLIENTES (CRUD) ---
  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [searchClienteQuery, setSearchClienteQuery] = useState('');
  const [currentClientePage, setCurrentClientePage] = useState(1);
  const clientesPerPage = 8;
  const [showClienteForm, setShowClienteForm] = useState(null); // 'create' | 'edit'
  const [editingCliente, setEditingCliente] = useState(null);
  const [showClientPass, setShowClientPass] = useState(false);
  const [showResetPass, setShowResetPass] = useState(false);
  const [clienteForm, setClienteForm] = useState({
    nombre: '',
    email: '',
    dni: '',
    telefono: '',
    passwordInicial: '',
    asignarNuevaContrasena: ''
  });

  // --- ESTADOS PARA REPORTES ---
  const [reportes, setReportes] = useState(null);
  const [loadingReportes, setLoadingReportes] = useState(true);

  // --- 0. FUNCIONES DE AYUDA / FORMATEO ---
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'N/A';
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      console.error("Error al formatear fecha:", e);
      return fechaStr;
    }
  };

  const formatImageUrl = (url) => {
    if (!url) return '/placeholder.png'; 
    if (url.startsWith('http://') || url.startsWith('https://')) return url;

    // Si es una de tus imágenes estáticas de la tienda alojadas en el frontend:
    const imagenesLocales = [
      'filmora', 'canva', 'adobe', 'autodesk', 'capcut', 'eset', 'chatgpt', 'office',
      'autocad', 'gemini', 'hbomax', 'netflix', 'nitro', 'paramount', 'prime', 
      'spotify', 'supergrok', 'windows', 'youtube'
    ];
    const esLocal = imagenesLocales.some(img => url.toLowerCase().includes(img));

    if (esLocal) {
      return url.startsWith('/') ? url : `/${url}`; // Lo sirve Vercel de su propia carpeta public
    }

    // Si no es local, se concatena limpiamente con el backend de Render:
    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${cleanUrl}`;
  };

  // --- EFECTO DE CARGA INICIAL Y CAMBIO DE PESTAÑA ---
  useEffect(() => {
    if (!user || (user.rol !== 'Admin' && user.rol !== 'Administrador')) return;
    
    if (tab === 'ordenes') {
      fetchAdminData();
    } else if (tab === 'productos') {
      fetchProductos();
    } else if (tab === 'clientes') {
      fetchClientes();
    } else if (tab === 'reportes') {
      fetchReportes();
    }
  }, [user, tab]);

  // --- 1. MÓDULO DE ÓRDENES: OBTENER DATOS ---
  const fetchAdminData = async () => {
    try {
      setLoadingOrdenes(true);
      const resOrdenes = await fetch(`${API_URL}/api/admin/ordenes`);
      if (resOrdenes.ok) {
        const dataOrd = await resOrdenes.json();
        setOrdenes(dataOrd);
      } else {
        throw new Error('Error al conectar con el endpoint de órdenes.');
      }
      const resRenovaciones = await fetch(`${API_URL}/api/admin/renovaciones`);
      if (resRenovaciones.ok) {
        const dataRen = await resRenovaciones.json();
        setRenovaciones(dataRen);
      } else {
        throw new Error('Error al conectar con el endpoint de renovaciones.');
      }
    } catch (e) {
      console.error("Error al obtener datos de órdenes:", e);
    } finally {
      setLoadingOrdenes(false);
    }
  };

  // --- 1. MÓDULO DE ÓRDENES: ACCIONES ---
  const startCompletarOrden = (orden) => {
    setActiveOrderInputId(orden.id);
    setEditingOrderInputId(null);
    const inicial = {};
    orden.detalles.forEach(d => {
      inicial[d.id] = '';
    });
    setClavesForm(inicial);
  };

  const handleClaveChange = (detalleId, valor) => {
    setClavesForm(prev => ({
      ...prev,
      [detalleId]: valor
    }));
  };

  const submitCompletarOrden = async (ordenId) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/ordenes/${ordenId}/completar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clavesPorDetalle: clavesForm
        })
      });

      if (!response.ok) {
        throw new Error('Error al completar la orden');
      }

      alert('¡Orden completada y licencias enviadas con éxito!');
      setActiveOrderInputId(null);
      await fetchAdminData();
    } catch (err) {
      console.error("Error al procesar completado de orden:", err);
      alert('Error en el servidor al completar la orden.');
    }
  };

  const handleCancelarOrden = async (ordenId) => {
    if (!window.confirm('¿Está seguro de que desea cancelar esta orden de forma definitiva?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/admin/ordenes/${ordenId}/cancelar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cancelar la orden');
      }

      alert('¡Orden cancelada con éxito!');
      await fetchAdminData();
    } catch (err) {
      console.error("Error al cancelar la orden:", err);
      alert('Error en el servidor al cancelar la orden.');
    }
  };

  // --- 1. MÓDULO DE ÓRDENES: EDITAR CANTIDADES INLINE ---
  const startEditarOrden = (orden) => {
    setEditingOrderInputId(orden.id);
    setActiveOrderInputId(null);
    const items = orden.detalles.map(d => ({
      productoId: d.productoId,
      cantidad: d.cantidad,
      nombre: d.producto?.nombre || 'Producto Desconocido'
    }));
    setEditOrderItems(items);
  };

  const handleEditQuantityChange = (productoId, delta) => {
    setEditOrderItems(prev => prev.map(item => {
      if (item.productoId === productoId) {
        const nuevaCantidad = Math.max(1, item.cantidad + delta);
        return { ...item, cantidad: nuevaCantidad };
      }
      return item;
    }));
  };

  const handleRemoveItemFromEdit = (productoId) => {
    if (editOrderItems.length === 1) {
      alert("Para remover todos los productos, por favor utiliza el botón de Cancelar Orden principal");
      return;
    }
    setEditOrderItems(prev => prev.filter(item => item.productoId !== productoId));
  };

  const submitEditarOrden = async (ordenId) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/ordenes/${ordenId}/editar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: editOrderItems.map(item => ({
            productoId: item.productoId,
            cantidad: item.cantidad
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Error al editar la orden');
      }

      alert('¡Orden editada y total recalculado con éxito!');
      setEditingOrderInputId(null);
      await fetchAdminData();
    } catch (err) {
      console.error("Error al editar la orden:", err);
      alert('Error en el servidor al editar la orden.');
    }
  };

  // --- 2. MÓDULO DE PRODUCTOS: CRUD ---
  const fetchProductos = async () => {
    try {
      setLoadingProductos(true);
      const res = await fetch(`${API_URL}/api/admin/productos`);
      if (res.ok) {
        const data = await res.json();
        setProductos(data);
      } else {
        throw new Error('Error al conectar con el catálogo de productos.');
      }
    } catch (e) {
      console.error("Error al obtener productos:", e);
    } finally {
      setLoadingProductos(false);
    }
  };

  const openAddProduct = () => {
    setProductForm({
      nombre: '',
      descripcion: '',
      precio: 0,
      duracionMeses: 0,
      categoria: 'Software',
      imagenUrl: '',
      costoProveedor: 0
    });
    setEditingProducto(null);
    setShowProductForm('create');
  };

  const handleEditClick = (prod) => {
    if (!prod) return;
    const id = prod.id || prod.productoId;
    if (!id) {
      alert("Error: No se pudo extraer el identificador del producto.");
      return;
    }

    setProductForm({
      nombre: prod.nombre,
      descripcion: prod.descripcion || '',
      precio: prod.precio,
      duracionMeses: prod.duracionMeses,
      categoria: prod.categoria,
      imagenUrl: prod.imagenUrl || '',
      costoProveedor: prod.costoProveedor || 0
    });
    setEditingProducto(prod);
    setShowProductForm('edit');
  };

  const handleProductInputChange = (key, value) => {
    setProductForm(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const submitProductForm = async (e) => {
    e.preventDefault();
    try {
      const id = editingProducto?.id || editingProducto?.productoId;
      const url = showProductForm === 'create' 
        ? `${API_URL}/api/admin/productos`
        : `${API_URL}/api/admin/productos/${id}`;
      
      const method = showProductForm === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productForm)
      });

      if (!response.ok) {
        throw new Error('Error al guardar el producto');
      }

      alert(showProductForm === 'create' ? 'Producto agregado con éxito!' : 'Producto actualizado con éxito!');
      setShowProductForm(null);
      await fetchProductos();
    } catch (err) {
      console.error("Error al guardar producto:", err);
      alert('Error en el servidor al guardar el producto.');
    }
  };

  const eliminarProducto = async (prodId) => {
    if (!prodId) {
      alert("Error: No se pudo encontrar el identificador del producto.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/admin/productos/${prodId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 409) {
        const errData = await response.json();
        alert(errData.mensaje || 'No se puede eliminar el producto.');
        return;
      }

      if (!response.ok) {
        throw new Error('Error al eliminar el producto');
      }

      alert('¡Producto desactivado con éxito!');
      await fetchProductos();
    } catch (err) {
      console.error("Error al eliminar producto:", err);
      alert('Error en el servidor al eliminar el producto.');
    }
  };

  const deleteProduct = eliminarProducto;

  // --- 3. MÓDULO DE CLIENTES: CRUD ---
  const fetchClientes = async () => {
    try {
      setLoadingClientes(true);
      const res = await fetch(`${API_URL}/api/admin/clientes`);
      if (res.ok) {
        const data = await res.json();
        setClientes(data);
      } else {
        throw new Error('Error al obtener la lista de clientes.');
      }
    } catch (e) {
      console.error("Error al obtener clientes:", e);
    } finally {
      setLoadingClientes(false);
    }
  };

  const openAddCliente = () => {
    setClienteForm({
      nombre: '',
      email: '',
      dni: '',
      telefono: '',
      passwordInicial: '',
      asignarNuevaContrasena: ''
    });
    setEditingCliente(null);
    setShowClientPass(false);
    setShowResetPass(false);
    setShowClienteForm('create');
  };

  const openEditCliente = (c) => {
    setClienteForm({
      nombre: c.nombre,
      email: c.email,
      dni: c.dni || '',
      telefono: c.telefono || c.whatsapp || '',
      passwordInicial: '',
      asignarNuevaContrasena: ''
    });
    setEditingCliente(c);
    setShowClientPass(false);
    setShowResetPass(false);
    setShowClienteForm('edit');
  };

  const submitClienteForm = async (e) => {
    e.preventDefault();
    try {
      if (showClienteForm === 'create') {
        const response = await fetch(`${API_URL}/api/admin/clientes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nombre: clienteForm.nombre,
            email: clienteForm.email,
            dni: clienteForm.dni,
            telefono: clienteForm.telefono,
            passwordInicial: clienteForm.passwordInicial
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.mensaje || 'Error al registrar el cliente');
        }

        alert('¡Cliente creado y guardado con éxito!');
      } else {
        const id = editingCliente.id;
        const response = await fetch(`${API_URL}/api/admin/clientes/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nombre: clienteForm.nombre,
            email: clienteForm.email,
            dni: clienteForm.dni,
            telefono: clienteForm.telefono,
            asignarNuevaContrasena: clienteForm.asignarNuevaContrasena
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.mensaje || 'Error al actualizar el cliente');
        }

        alert('¡Cliente actualizado con éxito!');
      }

      setShowClienteForm(null);
      await fetchClientes();
    } catch (err) {
      console.error("Error al guardar cliente:", err);
      alert(err.message || 'Error en el servidor al guardar el cliente.');
    }
  };

  const deleteCliente = async (cliente) => {
    if (!cliente) return;
    const id = cliente.id;
    if (!id) {
      alert("Error: No se pudo encontrar el identificador del cliente.");
      return;
    }

    if (!window.confirm(`¿Está seguro de que desea dar de baja al cliente "${cliente.nombre}"?`)) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/clientes/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al desactivar el cliente');
      }

      alert('¡Cliente dado de baja con éxito!');
      await fetchClientes();
    } catch (err) {
      console.error("Error al dar de baja al cliente:", err);
      alert('Error en el servidor al dar de baja al cliente.');
    }
  };

  // --- 4. MÓDULO DE REPORTES: CONSOLIDADO ---
  const fetchReportes = async () => {
    try {
      setLoadingReportes(true);
      const res = await fetch(`${API_URL}/api/admin/reportes`);
      if (res.ok) {
        const data = await res.json();
        setReportes(data);
      } else {
        throw new Error('Error al obtener reporte financiero.');
      }
    } catch (e) {
      console.error("Error al obtener reporte financiero:", e);
    } finally {
      setLoadingReportes(false);
    }
  };

  // --- FILTER CLIENTES ---
  const clientesFiltrados = clientes.filter(c => 
    c.nombre.toLowerCase().includes(searchClienteQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchClienteQuery.toLowerCase())
  );

  // Paginación de Clientes
  const totalClientePages = Math.ceil(clientesFiltrados.length / clientesPerPage);
  const indexOfLastCliente = currentClientePage * clientesPerPage;
  const indexOfFirstCliente = indexOfLastCliente - clientesPerPage;
  const currentClientes = clientesFiltrados.slice(indexOfFirstCliente, indexOfLastCliente);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Cabecera */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20 text-rose-400">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Panel Administrativo Backoffice</h1>
            <p className="text-slate-400 text-sm mt-0.5">Control completo de licencias y monitoreo de WhatsApp</p>
          </div>
        </div>

        <div className="flex gap-2">
          {tab === 'ordenes' && (
            <button
              onClick={fetchAdminData}
              className="bg-slate-955 border border-slate-800 hover:border-slate-700 text-slate-300 p-3 rounded-xl transition-all"
              title="Recargar Datos"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          )}
          {tab === 'productos' && (
            <button
              onClick={fetchProductos}
              className="bg-slate-955 border border-slate-800 hover:border-slate-700 text-slate-300 p-3 rounded-xl transition-all"
              title="Recargar Productos"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          )}
          {tab === 'clientes' && (
            <button
              onClick={fetchClientes}
              className="bg-slate-955 border border-slate-800 hover:border-slate-700 text-slate-300 p-3 rounded-xl transition-all"
              title="Recargar Clientes"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          )}
          {tab === 'reportes' && (
            <button
              onClick={fetchReportes}
              className="bg-slate-955 border border-slate-800 hover:border-slate-700 text-slate-300 p-3 rounded-xl transition-all"
              title="Recargar Reportes"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Pestañas de Navegación del Panel */}
      <div className="flex border-b border-slate-800 gap-4 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setTab('ordenes')}
          className={`pb-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            tab === 'ordenes' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4.5 h-4.5" />
          Órdenes Comerciales
        </button>
        <button
          onClick={() => setTab('productos')}
          className={`pb-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            tab === 'productos' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-4.5 h-4.5" />
          Catálogo de Productos
        </button>
        <button
          onClick={() => setTab('clientes')}
          className={`pb-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            tab === 'clientes' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4.5 h-4.5" />
          Gestión de Clientes
        </button>
        <button
          onClick={() => setTab('reportes')}
          className={`pb-3 font-bold text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            tab === 'reportes' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4.5 h-4.5" />
          Reportes Financieros
        </button>
      </div>

      {/* --- TAB 1: ÓRDENES COMERCIALES --- */}
      {tab === 'ordenes' && (
        <div className="space-y-8">
          {/* Dashboard de Alertas de Renovación */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Notificaciones Prioritarias (Expiración ≤ 5 días)
            </h2>
            {renovaciones.length === 0 ? (
              <p className="text-slate-505 text-sm">No hay servicios programados para expirar en 5 días o menos.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renovaciones.map((ren) => (
                  <div 
                    key={ren.detalleId} 
                    className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <p className="text-sm text-slate-200 font-medium">
                        La cuenta de {ren.clienteNombre} vence en 5 días. Prepara el stock con el proveedor
                      </p>
                      <p className="text-xs text-slate-505">
                        Producto: <span className="text-slate-400">{ren.productoNombre}</span> | Vence: {formatearFecha(ren.fechaVencimiento)}
                      </p>
                    </div>
                    <a
                      href={`https://api.whatsapp.com/send?phone=${ren.clienteWhatsApp}&text=${encodeURIComponent(
                        `Hola ${ren.clienteNombre}, te saludamos de Informatics. Queremos recordarte que tu suscripción de *${ren.productoNombre}* vencerá en 5 días. ¿Deseas renovarla?`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-slate-955 text-xs font-bold py-2 px-4 rounded-xl transition-all text-center"
                    >
                      Alertar WhatsApp
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tabla de Órdenes */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-400" />
              Gestión de Órdenes Comerciales
            </h2>

            {loadingOrdenes ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
              </div>
            ) : ordenes.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No se han registrado órdenes en la plataforma.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="min-w-full divide-y divide-slate-800 text-sm text-left">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4">WhatsApp</th>
                      <th className="px-6 py-4">Producto(s)</th>
                      <th className="px-6 py-4">Total</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4">Acción / Aprovisionamiento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                    {ordenes.map((ord) => (
                      <React.Fragment key={ord.id}>
                        <tr className="hover:bg-slate-900/80 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-bold text-slate-200">{ord.usuario?.nombre}</div>
                            <div className="text-xs text-slate-505">{ord.usuario?.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-slate-300">
                            <a 
                              href={`https://api.whatsapp.com/send?phone=${ord.usuario?.whatsapp}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sky-400 hover:underline"
                            >
                              {ord.usuario?.whatsapp}
                            </a>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              {ord.detalles.map((d) => (
                                <div key={d.id} className="text-slate-300 text-xs">
                                  {d.producto?.nombre} <span className="text-slate-500">x{d.cantidad}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-emerald-400 font-bold font-mono">
                            S/ {ord.total.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${
                              ord.estado === 'Pendiente' 
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                : ord.estado === 'Cancelada'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {ord.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {ord.estado === 'Pendiente' ? (
                              activeOrderInputId === ord.id ? (
                                <span className="text-xs text-slate-500 font-medium">Asignando claves...</span>
                              ) : editingOrderInputId === ord.id ? (
                                <span className="text-xs text-slate-505 font-medium">Editando pedido...</span>
                              ) : (
                                <div className="flex gap-2 flex-wrap">
                                  <button
                                    onClick={() => startCompletarOrden(ord)}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-955 font-bold py-1.5 px-3 rounded-lg text-xs transition-all flex items-center gap-1 active:scale-95"
                                  >
                                    <CheckSquare className="w-3.5 h-3.5" />
                                    Completar
                                  </button>
                                  <button
                                    onClick={() => startEditarOrden(ord)}
                                    className="bg-sky-500 hover:bg-sky-400 text-slate-955 font-bold py-1.5 px-3 rounded-lg text-xs transition-all flex items-center gap-1 active:scale-95"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleCancelarOrden(ord.id)}
                                    className="bg-red-655 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-xs transition-all font-bold active:scale-95"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              )
                            ) : ord.estado === 'Cancelada' ? (
                              <span className="text-xs text-rose-500 font-bold uppercase tracking-wider">Cancelada</span>
                            ) : (
                              <div className="space-y-1 max-w-xs">
                                {ord.detalles.map((d) => (
                                  <div key={d.id} className="text-xs text-slate-400 truncate font-mono" title={d.clave}>
                                    <span className="text-slate-655 font-sans">{d.producto?.nombre}:</span> {d.clave}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                        
                        {/* Fila de ingreso controlado de claves (Textarea Multilínea con Contraste Elevado) */}
                        {activeOrderInputId === ord.id && (
                          <tr className="bg-slate-955/40">
                            <td colSpan="6" className="px-6 py-4">
                              <div className="bg-slate-955/80 border border-slate-800 rounded-xl p-4 space-y-4 max-w-2xl">
                                <h4 className="text-xs font-bold text-sky-400 flex items-center gap-1 uppercase tracking-wider">
                                  <Key className="w-3.5 h-3.5" />
                                  Ingreso de Claves de Licencia - Orden #{ord.id}
                                </h4>
                                <div className="grid grid-cols-1 gap-4">
                                  {ord.detalles.map((d) => (
                                    <div key={d.id} className="flex flex-col gap-2 bg-slate-900 p-3 rounded-lg border border-slate-800">
                                      <span className="text-xs font-bold text-slate-355">{d.producto?.nombre}</span>
                                      <textarea
                                        rows={3}
                                        required
                                        placeholder="Ingresa la clave o credenciales de activación (puedes ingresar varias líneas)..."
                                        value={clavesForm[d.id] || ''}
                                        onChange={(e) => handleClaveChange(d.id, e.target.value)}
                                        className="bg-[#1e293b] text-white border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg w-full p-2.5 text-xs font-mono resize-y"
                                      />
                                    </div>
                                  ))}
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => setActiveOrderInputId(null)}
                                    className="bg-slate-955 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs px-4 py-2 rounded-lg transition-all"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={() => submitCompletarOrden(ord.id)}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-955 font-bold text-xs px-4 py-2 rounded-lg transition-all flex items-center gap-1"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Guardar y Aprobar
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* Fila para editar cantidades de orden pendiente con botón de eliminar ítems */}
                        {editingOrderInputId === ord.id && (
                          <tr className="bg-slate-950/40">
                            <td colSpan="6" className="px-6 py-4">
                              <div className="bg-slate-955/80 border border-slate-800 rounded-xl p-4 space-y-4 max-w-2xl">
                                <h4 className="text-xs font-bold text-sky-400 flex items-center gap-1 uppercase tracking-wider">
                                  <Edit3 className="w-3.5 h-3.5" />
                                  Modificar Cantidades del Pedido - Orden #{ord.id}
                                </h4>
                                <div className="grid grid-cols-1 gap-3">
                                  {editOrderItems.map((item) => (
                                    <div key={item.productoId} className="flex items-center justify-between gap-4 bg-slate-900 p-3 rounded-lg border border-slate-800">
                                      <span className="text-xs font-bold text-slate-355">{item.nombre}</span>
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center bg-slate-955 border border-slate-800 rounded-lg">
                                          <button
                                            type="button"
                                            onClick={() => handleEditQuantityChange(item.productoId, -1)}
                                            className="px-2 py-1 text-slate-400 hover:text-slate-200"
                                          >
                                            -
                                          </button>
                                          <span className="px-3 text-xs font-bold text-slate-200">{item.cantidad}</span>
                                          <button
                                            type="button"
                                            onClick={() => handleEditQuantityChange(item.productoId, 1)}
                                            className="px-2 py-1 text-slate-400 hover:text-slate-200"
                                          >
                                            +
                                          </button>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveItemFromEdit(item.productoId)}
                                          className="text-red-500 hover:text-red-400 ml-4 font-bold text-xs flex items-center gap-1 active:scale-95"
                                          title="Eliminar ítem"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          Eliminar
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => setEditingOrderInputId(null)}
                                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs px-4 py-2 rounded-lg transition-all"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={() => submitEditarOrden(ord.id)}
                                    className="bg-sky-500 hover:bg-sky-400 text-slate-955 font-bold text-xs px-4 py-2 rounded-lg transition-all flex items-center gap-1"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                    Actualizar Pedido
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: CATÁLOGO DE PRODUCTOS (CRUD) --- */}
      {tab === 'productos' && (
        <div className="space-y-6">
          {/* Botón de Agregar */}
          <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <span className="text-slate-300 font-bold text-sm">Catálogo Oficial de Licencias</span>
            {!showProductForm && (
              <button
                onClick={openAddProduct}
                className="bg-sky-500 hover:bg-sky-400 text-slate-955 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Agregar Producto
              </button>
            )}
          </div>

          {/* Formulario de Agregar / Editar (Modal Flotante Centrado con Contraste Elevado) */}
          {showProductForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto relative">
                <button
                  type="button"
                  onClick={() => setShowProductForm(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Cerrar modal"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
                  <Package className="w-5 h-5 text-sky-400" />
                  {showProductForm === 'create' ? 'Nuevo Producto' : 'Editar Producto'}
                </h3>
                
                <form onSubmit={submitProductForm} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Nombre del Producto</label>
                    <input
                      type="text"
                      required
                      value={productForm.nombre}
                      onChange={(e) => handleProductInputChange('nombre', e.target.value)}
                      className="bg-[#1e293b] text-white border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg w-full p-2.5 text-sm"
                      placeholder="Ej. Photoshop CC Anual"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Categoría</label>
                    <select
                      value={productForm.categoria}
                      onChange={(e) => handleProductInputChange('categoria', e.target.value)}
                      className="bg-[#1e293b] text-white border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg w-full p-2.5 text-sm"
                    >
                      <option value="Software" className="bg-[#0f172a] text-slate-205">Software</option>
                      <option value="Streaming" className="bg-[#0f172a] text-slate-205">Streaming</option>
                      <option value="IA" className="bg-[#0f172a] text-slate-205">Inteligencia Artificial (IA)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Descripción Comercial</label>
                    <textarea
                      required
                      rows="3"
                      value={productForm.descripcion}
                      onChange={(e) => handleProductInputChange('descripcion', e.target.value)}
                      className="bg-[#1e293b] text-white border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg w-full p-2.5 text-sm resize-none"
                      placeholder="Introduce características del producto..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Duración en Meses (0 = Perpetuo)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="120"
                      value={productForm.duracionMeses}
                      onChange={(e) => handleProductInputChange('duracionMeses', parseInt(e.target.value) || 0)}
                      className="bg-[#1e293b] text-white border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg w-full p-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Imagen Relativa (/nombre.png)</label>
                    <input
                      type="text"
                      required
                      value={productForm.imagenUrl}
                      onChange={(e) => handleProductInputChange('imagenUrl', e.target.value)}
                      className="bg-[#1e293b] text-white border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg w-full p-2.5 text-sm font-mono"
                      placeholder="/canva.png"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Precio de Venta (S/ )</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0.01"
                      value={productForm.precio}
                      onChange={(e) => handleProductInputChange('precio', parseFloat(e.target.value) || 0)}
                      className="bg-[#1e293b] text-white border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg w-full p-2.5 text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Costo del Proveedor (S/ )</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0.00"
                      value={productForm.costoProveedor}
                      onChange={(e) => handleProductInputChange('costoProveedor', parseFloat(e.target.value) || 0)}
                      className="bg-[#1e293b] text-white border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg w-full p-2.5 text-sm font-mono"
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowProductForm(null)}
                      className="bg-slate-955 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs px-5 py-3 rounded-xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-955 font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md active:scale-95"
                    >
                      Guardar Producto
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Tabla de Productos */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            {loadingProductos ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
              </div>
            ) : productos.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No hay productos en el catálogo.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="min-w-full divide-y divide-slate-800 text-sm text-left">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Producto</th>
                      <th className="px-6 py-4">Categoría</th>
                      <th className="px-6 py-4">Duración</th>
                      <th className="px-6 py-4">Precio Venta</th>
                      <th className="px-6 py-4">Costo Proveedor</th>
                      <th className="px-6 py-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                    {productos.map((prod) => (
                      <tr key={prod.id || prod.productoId} className="hover:bg-slate-900/80 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                          <img 
                            src={formatImageUrl(prod.imagenUrl)} 
                            alt={prod.nombre} 
                            className="w-10 h-10 object-cover rounded-lg border border-slate-800"
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=300&q=80'; }}
                          />
                          <div>
                            <div className="font-bold text-slate-200">{prod.nombre}</div>
                            <div className="text-xs text-slate-505 truncate max-w-xs">{prod.descripcion}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-block text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                            prod.categoria === 'Software' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                            prod.categoria === 'Streaming' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {prod.categoria}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-300 font-medium">
                          {prod.duracionMeses === 0 ? 'Permanente' : `${prod.duracionMeses} Meses`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-emerald-400 font-bold font-mono">
                          S/ {prod.precio.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-rose-400 font-bold font-mono">
                          S/ {(prod.costoProveedor || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditClick(prod)}
                              className="bg-slate-955 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-sky-400 p-2 rounded-lg transition-all"
                              title="Editar"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setProductoAEliminar(prod)}
                              className="bg-slate-955 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-rose-500 p-2 rounded-lg transition-all"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 3: GESTIÓN DE CLIENTES (CRUD INTEGRAL) --- */}
      {tab === 'clientes' && (
        <div className="space-y-6">
          {/* Header de Gestión de Clientes */}
          <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-400" />
              Gestión de Clientes Registrados
            </h2>
            <div className="flex items-center gap-4">
              {/* Buscador Rápido con Contraste */}
              <div className="relative w-72">
                <input
                  type="text"
                  placeholder="Buscar por nombre o correo..."
                  value={searchClienteQuery}
                  onChange={(e) => {
                    setSearchClienteQuery(e.target.value);
                    setCurrentClientePage(1);
                  }}
                  className="w-full bg-[#1e293b] text-white border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg p-2.5 text-xs placeholder-slate-400 transition-all pl-10"
                />
                <Search className="absolute left-3.5 top-2.5 text-slate-655 w-4 h-4" />
              </div>
              {!showClienteForm && (
                <button
                  onClick={openAddCliente}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-955 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Cliente
                </button>
              )}
            </div>
          </div>

          {/* Formulario de Agregar / Editar Cliente (Modal Flotante Centrado) */}
          {showClienteForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto relative">
                <button
                  type="button"
                  onClick={() => setShowClienteForm(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Cerrar modal"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-sky-400" />
                  {showClienteForm === 'create' ? 'Nuevo Cliente' : 'Editar Cliente'}
                </h3>
                
                <form onSubmit={submitClienteForm} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Nombre Completo</label>
                    <input
                      type="text"
                      required
                      value={clienteForm.nombre}
                      onChange={(e) => setClienteForm(prev => ({ ...prev, nombre: e.target.value }))}
                      className="bg-[#1e293b] text-white border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg w-full p-2.5 text-sm"
                      placeholder="Ej. José Gonzales"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Correo Electrónico</label>
                    <input
                      type="email"
                      required
                      value={clienteForm.email}
                      onChange={(e) => setClienteForm(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-[#1e293b] text-white border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg w-full p-2.5 text-sm"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">DNI</label>
                    <input
                      type="text"
                      value={clienteForm.dni}
                      onChange={(e) => setClienteForm(prev => ({ ...prev, dni: e.target.value }))}
                      className="bg-[#1e293b] text-white border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg w-full p-2.5 text-sm font-mono"
                      placeholder="Número de DNI"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Teléfono / WhatsApp</label>
                    <input
                      type="text"
                      value={clienteForm.telefono}
                      onChange={(e) => setClienteForm(prev => ({ ...prev, telefono: e.target.value }))}
                      className="bg-[#1e293b] text-white border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg w-full p-2.5 text-sm font-mono"
                      placeholder="Ej. +51984497138"
                    />
                  </div>

                  {showClienteForm === 'create' ? (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Contraseña Inicial</label>
                      <div className="relative w-full">
                        <input
                          type={showClientPass ? "text" : "password"}
                          className="w-full bg-[#1e293b] text-white border border-slate-700 rounded-lg p-2.5 pr-10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                          placeholder="Contraseña del cliente"
                          value={clienteForm.passwordInicial}
                          onChange={(e) => setClienteForm(prev => ({ ...prev, passwordInicial: e.target.value }))}
                          required
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                          onClick={() => setShowClientPass(!showClientPass)}
                        >
                          {showClientPass ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Asignar Nueva Contraseña (Opcional)</label>
                      <div className="relative w-full">
                        <input
                          type={showResetPass ? "text" : "password"}
                          className="w-full bg-[#1e293b] text-white border border-slate-700 rounded-lg p-2.5 pr-10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                          placeholder="Ingresa contraseña para restablecer, o deja vacío para mantener la actual"
                          value={clienteForm.asignarNuevaContrasena}
                          onChange={(e) => setClienteForm(prev => ({ ...prev, asignarNuevaContrasena: e.target.value }))}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                          onClick={() => setShowResetPass(!showResetPass)}
                        >
                          {showResetPass ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowClienteForm(null)}
                      className="bg-slate-955 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs px-5 py-3 rounded-xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-955 font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md active:scale-95"
                    >
                      Guardar Cliente
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Tabla de Clientes */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            {loadingClientes ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
              </div>
            ) : clientesFiltrados.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No se encontraron clientes registrados.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="min-w-full divide-y divide-slate-800 text-sm text-left">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-xs tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Cliente</th>
                        <th className="px-6 py-4">Correo</th>
                        <th className="px-6 py-4">DNI</th>
                        <th className="px-6 py-4">Teléfono</th>
                        <th className="px-6 py-4 text-center">Pedidos</th>
                        <th className="px-6 py-4">Inversión</th>
                        <th className="px-6 py-4">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                      {currentClientes.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-900/80 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-200">{c.nombre}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-400 font-mono">{c.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-slate-300">{c.dni || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap font-mono">
                            <a 
                              href={`https://api.whatsapp.com/send?phone=${c.telefono || c.whatsapp}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-sky-400 hover:underline"
                            >
                              {c.telefono || c.whatsapp}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-slate-300 font-bold">{c.totalPedidosCompletados}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-emerald-400 font-bold font-mono">S/ {c.totalInvertido.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditCliente(c)}
                                className="bg-slate-955 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-sky-400 p-2 rounded-lg transition-all"
                                title="Editar"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteCliente(c)}
                                className="bg-slate-955 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-rose-500 p-2 rounded-lg transition-all"
                                title="Dar de baja"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Controles de Paginación */}
                {totalClientePages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-850 pt-4">
                    <p className="text-xs text-slate-505">
                      Mostrando del <span className="font-bold text-slate-400">{indexOfFirstCliente + 1}</span> al <span className="font-bold text-slate-400">{Math.min(indexOfLastCliente, clientesFiltrados.length)}</span> de <span className="font-bold text-slate-400">{clientesFiltrados.length}</span> clientes.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentClientePage(prev => Math.max(1, prev - 1))}
                        disabled={currentClientePage === 1}
                        className="bg-slate-955 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 p-2 rounded-lg text-slate-400 disabled:opacity-40 transition-all active:scale-95"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentClientePage(prev => Math.min(totalClientePages, prev + 1))}
                        disabled={currentClientePage === totalClientePages}
                        className="bg-slate-955 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 p-2 rounded-lg text-slate-400 disabled:opacity-40 transition-all active:scale-95"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 4: REPORTES FINANCIEROS Y METRICAS --- */}
      {tab === 'reportes' && (
        <div className="space-y-8">
          {loadingReportes ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
            </div>
          ) : !reportes ? (
            <div className="text-center py-12 text-slate-505 text-sm bg-slate-900 border border-slate-800 rounded-3xl">
              Error al compilar reporte financiero consolidado.
            </div>
          ) : (
            <>
              {/* Tarjetas de Resumen Financiero con Gradientes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Ingresos Brutos */}
                <div className="bg-gradient-to-r from-sky-600 to-indigo-700 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between h-40">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-100">Ingresos Brutos</span>
                    <TrendingUp className="w-5 h-5 text-sky-200" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold text-white font-mono">
                      S/ {reportes.ingresosBrutos.toFixed(2)}
                    </h3>
                    <p className="text-sky-200 text-xs mt-1">Facturación total histórica</p>
                  </div>
                </div>

                {/* Costos de Operación */}
                <div className="bg-gradient-to-r from-rose-600 to-red-750 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between h-40">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-100">Costos de Operación</span>
                    <Package className="w-5 h-5 text-rose-200" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold text-white font-mono">
                      S/ {reportes.costosOperacion.toFixed(2)}
                    </h3>
                    <p className="text-rose-200 text-xs mt-1">Acumulado costo proveedores</p>
                  </div>
                </div>

                {/* Ganancia Neta Real */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between h-40">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Ganancia Neta Real</span>
                    <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold text-white font-mono">
                      S/ {reportes.gananciaNetaReal.toFixed(2)}
                    </h3>
                    <p className="text-emerald-200 text-xs mt-1">Margen libre real generado</p>
                  </div>
                </div>
              </div>

              {/* Licencias Despachadas por Categoría */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
                <h2 className="text-lg font-bold text-slate-100 pb-3 border-b border-slate-800 flex items-center gap-2">
                  <Package className="w-5 h-5 text-sky-400" />
                  Volumen de Licencias Despachadas por Categoría
                </h2>

                {reportes.licenciasPorCategoria.length === 0 ? (
                  <p className="text-slate-505 text-sm text-center py-6">Aún no se han despachado licencias en el sistema.</p>
                ) : (
                  <div className="space-y-4">
                    {reportes.licenciasPorCategoria.map((cat, index) => {
                      const total = reportes.licenciasPorCategoria.reduce((sum, item) => sum + item.cantidad, 0);
                      const porcentaje = total > 0 ? (cat.cantidad / total) * 100 : 0;
                      
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-xs font-bold text-slate-355 font-bold">
                            <span>{cat.categoria}</span>
                            <span>{cat.cantidad} unidades ({porcentaje.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-850">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                cat.categoria === 'Software' ? 'bg-sky-500' :
                                cat.categoria === 'Streaming' ? 'bg-purple-500' :
                                'bg-emerald-500'
                              }`} 
                              style={{ width: `${porcentaje}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal de Confirmación de Eliminación de Producto */}
      {productoAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Confirmar Eliminación
            </h3>
            <p className="text-slate-350 text-sm mb-6 leading-relaxed">
              ¿Está seguro de que desea eliminar el producto <span className="text-white font-semibold">"{productoAEliminar.nombre}"</span> del catálogo?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setProductoAEliminar(null)}
                className="bg-slate-955 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs px-4 py-2.5 rounded-lg transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = productoAEliminar.id || productoAEliminar.productoId;
                  await eliminarProducto(id);
                  setProductoAEliminar(null);
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all active:scale-95"
              >
                Aceptar/Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
