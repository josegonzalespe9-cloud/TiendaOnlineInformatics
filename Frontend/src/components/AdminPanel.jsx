import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { 
  FileText, Key, AlertTriangle, CheckSquare, RefreshCw, 
  ShieldAlert, CheckCircle2, Package, Users, BarChart3, Plus, 
  Trash2, Edit3, Save, X, Search, ChevronLeft, ChevronRight, TrendingUp, 
  Info, Eye, EyeOff, Download, Tag, Sparkles, Send, Share2, 
  FileSpreadsheet, DollarSign, Percent, Filter, ShieldCheck, Flame, 
  ArrowUpRight, Clock, MessageSquare, Copy, Check,
  Activity, Radio, Smartphone, Monitor, Tablet, Globe, ShoppingCart
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { API_URL } from '../services/api';
import { showSuccess, showError, showWarning, showConfirm, showToast } from '../utils/alerts';

export default function AdminPanel() {
  const { user, token, logout } = useCart();
  const [tab, setTab] = useState('ordenes'); // 'ordenes' | 'productos' | 'clientes' | 'cupones' | 'reportes' | 'visitas'

  const handleAuthExpired = () => {
    showWarning('Sesión Expirada', 'Tu sesión administrativa ha caducado. Por favor, inicia sesión nuevamente.');
    logout();
  };

  // --- FILTROS Y BÚSQUEDAS GLOBALES ---
  const [searchOrderQuery, setSearchOrderQuery] = useState('');
  const [filterOrderStatus, setFilterOrderStatus] = useState('Todos'); // 'Todos' | 'Pendiente' | 'Completada' | 'Cancelada'
  const [sortOrder, setSortOrder] = useState('recientes'); // 'recientes' | 'mayor_monto'
  
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [filterProductCategory, setFilterProductCategory] = useState('Todos'); // 'Todos' | 'Software' | 'Streaming' | 'IA'
  const [filterProductVisibility, setFilterProductVisibility] = useState('Todos'); // 'Todos' | 'Visibles' | 'Ocultos'
  const [togglingVisibilityId, setTogglingVisibilityId] = useState(null);

  // --- REFS Y ESTADOS PARA SCROLL LATERAL STICKY SINCRONIZADO ---
  const tableContainerRef = useRef(null);
  const stickyScrollRef = useRef(null);
  const [tableScrollMetrics, setTableScrollMetrics] = useState({
    scrollLeft: 0,
    scrollWidth: 0,
    clientWidth: 0,
    maxScroll: 0,
    canScroll: false
  });

  const [searchCuponQuery, setSearchCuponQuery] = useState('');

  // --- ESTADOS PARA MARKETING DIGITAL ---
  const [campaignType, setCampaignType] = useState('renovacion'); // 'renovacion' | 'lanzamiento' | 'recuperacion'
  const [selectedMarketingCoupon, setSelectedMarketingCoupon] = useState('');
  const [copiedMarketing, setCopiedMarketing] = useState(false);

  // --- ESTADOS Y HANDLERS PARA CUPONES ---
  const [cupones, setCupones] = useState([]);
  const [loadingCupones, setLoadingCupones] = useState(false);
  const [cuponForm, setCuponForm] = useState({
    codigo: '',
    porcentajeDescuento: '10',
    montoDescuentoFijo: '0',
    esPorcentaje: true,
    usosMaximos: '100'
  });

  // --- ESTADOS PARA ÓRDENES ---
  const [ordenes, setOrdenes] = useState([]);
  const [renovaciones, setRenovaciones] = useState([]);
  const [loadingOrdenes, setLoadingOrdenes] = useState(true);
  const [clavesForm, setClavesForm] = useState({});
  const [activeOrderInputId, setActiveOrderInputId] = useState(null);
  const [editingOrderInputId, setEditingOrderInputId] = useState(null);
  const [editOrderItems, setEditOrderItems] = useState([]);

  // --- ESTADOS PARA PRODUCTOS (CRUD) ---
  const [productos, setProductos] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(true);
  const [showProductForm, setShowProductForm] = useState(null); // 'create' | 'edit'
  const [editingProducto, setEditingProducto] = useState(null);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [productForm, setProductForm] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    duracionMeses: '',
    categoria: 'Software',
    imagenUrl: '',
    costoProveedor: '',
    activo: true
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [useManualImageUrl, setUseManualImageUrl] = useState(false);
  const [nuevaCaracteristicaTexto, setNuevaCaracteristicaTexto] = useState('');

  // --- ESTADOS PARA CLIENTES (CRUD) ---
  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [searchClienteQuery, setSearchClienteQuery] = useState('');
  const [currentClientePage, setCurrentClientePage] = useState(1);
  const clientesPerPage = 8;
  const [showClienteForm, setShowClienteForm] = useState(null);
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

  const [selectedCliente, setSelectedCliente] = useState(null);
  const [clienteHistory, setClienteHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // --- ESTADOS PARA REPORTES ---
  const [reportes, setReportes] = useState(null);
  const [loadingReportes, setLoadingReportes] = useState(true);

  // --- ESTADOS PARA ANALÍTICA Y TRÁFICO WEB EN VIVO ---
  const [visitasData, setVisitasData] = useState(null);
  const [loadingVisitas, setLoadingVisitas] = useState(false);
  const [autoRefreshVisitas, setAutoRefreshVisitas] = useState(true);
  const [filtroTipoVisita, setFiltroTipoVisita] = useState('todos'); // 'todos' | 'online' | 'usuarios'
  const [searchVisitaQuery, setSearchVisitaQuery] = useState('');
  const [ultimaActualizacionVisitas, setUltimaActualizacionVisitas] = useState(null);

  // --- ESTADOS PARA PACKS & COMBOS (CRUD) ---
  const [combos, setCombos] = useState([]);
  const [loadingCombos, setLoadingCombos] = useState(false);
  const [searchComboQuery, setSearchComboQuery] = useState('');
  const [filterComboVisibility, setFilterComboVisibility] = useState('Todos'); // 'Todos' | 'Activos' | 'Ocultos'
  const [togglingComboId, setTogglingComboId] = useState(null);
  const [showComboForm, setShowComboForm] = useState(null); // 'create' | 'edit'
  const [editingCombo, setEditingCombo] = useState(null);
  const [comboAEliminar, setComboAEliminar] = useState(null);
  const [nuevoItemTexto, setNuevoItemTexto] = useState('');
  const [comboForm, setComboForm] = useState({
    nombre: '',
    subtitulo: '',
    descripcion: '',
    precioOriginal: '',
    precioCombo: '',
    ahorro: '',
    badge: 'Oferta Especial',
    items: [],
    activo: true,
    ordenVisual: 1
  });

  // --- 0. FUNCIONES DE AYUDA Y FORMATEO ---
  const formatearTiempoTranscurrido = (fechaStr) => {
    if (!fechaStr) return 'N/A';
    try {
      const fecha = new Date(fechaStr);
      const diffMs = Date.now() - fecha.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return `Hace ${Math.max(1, diffSec)}s`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `Hace ${diffMin}m`;
      const diffHoras = Math.floor(diffMin / 60);
      if (diffHoras < 24) return `Hace ${diffHoras}h`;
      return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch {
      return fechaStr;
    }
  };
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
    if (!url) return 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=300&q=80'; 
    if (url.startsWith('http://') || url.startsWith('https://')) return url;

    const imagenesLocales = [
      'filmora', 'canva', 'adobe', 'autodesk', 'capcut', 'eset', 'chatgpt', 'office',
      'autocad', 'gemini', 'hbomax', 'netflix', 'nitro', 'paramount', 'prime', 
      'spotify', 'supergrok', 'windows', 'youtube', 'winrar', 'idm', 'malwarebytes', 'nordvpn'
    ];
    const esLocal = imagenesLocales.some(img => url.toLowerCase().includes(img));

    if (esLocal) {
      return url.startsWith('/') ? url : `/${url}`;
    }

    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${cleanUrl}`;
  };

  // --- EFECTO DE CARGA INICIAL Y CAMBIO DE PESTAÑA ---
  useEffect(() => {
    if (!user || (user.rol !== 'Admin' && user.rol !== 'Administrador') || !token) {
      return;
    }
    
    // Carga de órdenes y productos para tener métricas globales siempre disponibles
    fetchAdminData();
    fetchProductos();
    fetchClientes();
    fetchCupones();
    fetchReportes();
    fetchVisitas(true);
    fetchCombos();
  }, [user, token]);

  useEffect(() => {
    if (tab === 'cupones') fetchCupones();
    if (tab === 'reportes') fetchReportes();
    if (tab === 'productos') fetchProductos();
    if (tab === 'clientes') fetchClientes();
    if (tab === 'ordenes') fetchAdminData();
    if (tab === 'visitas') fetchVisitas();
    if (tab === 'combos') fetchCombos();
  }, [tab]);

  // --- 1. MÓDULO DE ÓRDENES: OBTENER DATOS ---
  const fetchAdminData = async (retryCount = 0) => {
    if (!token) return;
    try {
      setLoadingOrdenes(true);
      const resOrdenes = await fetch(`${API_URL}/api/admin/ordenes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resOrdenes.status === 401) {
        handleAuthExpired();
        return;
      }
      if (resOrdenes.ok) {
        const dataOrd = await resOrdenes.json();
        setOrdenes(dataOrd);
      } else if (retryCount < 2) {
        setTimeout(() => fetchAdminData(retryCount + 1), 3000);
      }
      const resRenovaciones = await fetch(`${API_URL}/api/admin/renovaciones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resRenovaciones.ok) {
        const dataRen = await resRenovaciones.json();
        setRenovaciones(dataRen);
      }
    } catch (e) {
      console.error("Error al obtener datos de órdenes:", e);
      if (retryCount < 2) {
        setTimeout(() => fetchAdminData(retryCount + 1), 3000);
      }
    } finally {
      setLoadingOrdenes(false);
    }
  };

  // --- 1. ACCIONES DE ÓRDENES ---
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

  // Generador automático de claves sugeridas con formato oficial de software
  const generarClaveSugerida = (detalleId, productoNombre = '') => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const genBloque = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    
    let claveGenerada = '';
    const p = productoNombre.toLowerCase();

    if (p.includes('windows') || p.includes('office') || p.includes('visio') || p.includes('project')) {
      // Formato Microsoft estándar de 25 caracteres: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
      claveGenerada = `${genBloque(5)}-${genBloque(5)}-${genBloque(5)}-${genBloque(5)}-${genBloque(5)}`;
    } else if (p.includes('eset') || p.includes('idm')) {
      // Formato ESET / Antivirus: XXXX-XXXX-XXXX-XXXX-XXXX
      claveGenerada = `${genBloque(4)}-${genBloque(4)}-${genBloque(4)}-${genBloque(4)}-${genBloque(4)}`;
    } else if (p.includes('netflix') || p.includes('hbo') || p.includes('disney') || p.includes('prime')) {
      // Formato Streaming con PIN
      const pin = Math.floor(1000 + Math.random() * 9000);
      claveGenerada = `Cuenta: stream_${genBloque(4).toLowerCase()}@informatics.pe | Clave: Pass${genBloque(4)}! | Perfil Asignado con PIN: ${pin}`;
    } else {
      claveGenerada = `KEY-${genBloque(5)}-${genBloque(5)}-${genBloque(5)}`;
    }

    handleClaveChange(detalleId, claveGenerada);
    showToast('¡Clave sugerida generada automáticamente!', 'success');
  };

  const submitCompletarOrden = async (ordenId) => {
    if (!token || !ordenId) {
      showError("Error", "Token de autorización o identificador de orden no provisto.");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/admin/ordenes/${ordenId}/completar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          clavesPorDetalle: clavesForm
        })
      });

      if (!response.ok) {
        throw new Error('Error al completar la orden');
      }

      showSuccess('¡Orden Completada!', 'Las licencias han sido asignadas al casillero digital del cliente.');
      setActiveOrderInputId(null);
      await fetchAdminData();
    } catch (err) {
      console.error("Error al procesar completado de orden:", err);
      showError('Error', 'No se pudo completar la orden en el servidor.');
    }
  };

  const handleCancelarOrden = async (ordenId) => {
    if (!token || !ordenId) return;
    const confirmacion = await showConfirm(
      '¿Cancelar Orden?',
      '¿Está seguro de que desea cancelar esta orden de forma definitiva?'
    );
    if (!confirmacion) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/ordenes/${ordenId}/cancelar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Error al cancelar');
      showSuccess('Cancelada', 'La orden fue marcada como cancelada.');
      await fetchAdminData();
    } catch (err) {
      console.error("Error:", err);
      showError('Error', 'Inconveniente al cancelar la orden.');
    }
  };

  // --- 1. EDITAR CANTIDADES INLINE ---
  const startEditarOrden = (orden) => {
    setEditingOrderInputId(orden.id);
    setActiveOrderInputId(null);
    const items = orden.detalles.map(d => ({
      productoId: d.productoId,
      cantidad: d.cantidad,
      nombre: d.producto?.nombre || 'Producto'
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
      showWarning("Aviso", "Para remover todos los productos, por favor utiliza Cancelar Orden.");
      return;
    }
    setEditOrderItems(prev => prev.filter(item => item.productoId !== productoId));
  };

  const submitEditarOrden = async (ordenId) => {
    if (!token || !ordenId) return;
    try {
      const response = await fetch(`${API_URL}/api/admin/ordenes/${ordenId}/editar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: editOrderItems.map(item => ({
            productoId: item.productoId,
            cantidad: item.cantidad
          }))
        })
      });

      if (!response.ok) throw new Error('Error al editar');
      showSuccess('Orden Editada', 'El total ha sido recalculado con éxito.');
      setEditingOrderInputId(null);
      await fetchAdminData();
    } catch (err) {
      console.error(err);
      showError('Error', 'No se pudo editar el pedido.');
    }
  };

  // --- 1. MENSAJE Y NOTIFICACIÓN POR WHATSAPP ---
  const handleEnviarNotificacionWhatsApp = (ord) => {
    if (!ord || !ord.usuario) return;
    const whatsappCliente = ord.usuario.whatsApp || ord.usuario.whatsapp || ord.usuario.telefono || '';
    let numeroLimpio = whatsappCliente.replace(/\D/g, '');
    if (numeroLimpio.length === 9) numeroLimpio = '51' + numeroLimpio;

    let mensajeClaves = ord.detalles?.map(d => `🔑 *${d.producto?.nombre || 'Licencia'}*: \`${d.clave || 'Activada'}\``).join('\n') || '';

    const mensaje = encodeURIComponent(
      `¡Hola ${ord.usuario.nombre}! 🚀 Tu pedido *#${ord.id}* en Informatics ha sido aprobado y entregado.\n\n` +
      `*Tus Accesos / Licencias Digitales:*\n${mensajeClaves}\n\n` +
      `*Centro de Descargas & Guías:* https://informatics.local/\n` +
      `*Garantía:* Tu compra cuenta con reposición garantizada 100%.\n\n` +
      `¡Gracias por tu confianza!`
    );

    window.open(`https://api.whatsapp.com/send?phone=${numeroLimpio}&text=${mensaje}`, '_blank');
  };

  // --- EXPORTAR ÓRDENES A CSV (GESTIÓN ADMINISTRATIVA) ---
  const exportarOrdenesCSV = () => {
    if (ordenes.length === 0) {
      showWarning('Sin Datos', 'No hay órdenes disponibles para exportar.');
      return;
    }

    const headers = ['ID_Orden', 'Fecha', 'Cliente_Nombre', 'Cliente_Email', 'WhatsApp', 'Productos', 'Total_Soles', 'Estado'];
    const rows = ordenes.map(o => [
      o.id,
      formatearFecha(o.fechaCreacion),
      `"${(o.usuario?.nombre || '').replace(/"/g, '""')}"`,
      o.usuario?.email || '',
      o.usuario?.whatsapp || '',
      `"${o.detalles.map(d => `${d.producto?.nombre} x${d.cantidad}`).join('; ')}"`,
      o.total.toFixed(2),
      o.estado
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ordenes_informatics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Archivo CSV descargado con éxito', 'success');
  };

  // --- 2. PRODUCTOS: CRUD & HANDLERS ---
  const fetchProductos = async (retryCount = 0) => {
    if (!token) return;
    try {
      setLoadingProductos(true);
      const res = await fetch(`${API_URL}/api/admin/productos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleAuthExpired();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setProductos(data);
      } else if (retryCount < 2) {
        setTimeout(() => fetchProductos(retryCount + 1), 3000);
      }
    } catch (e) {
      console.error(e);
      if (retryCount < 2) {
        setTimeout(() => fetchProductos(retryCount + 1), 3000);
      }
    } finally {
      setLoadingProductos(false);
    }
  };

  const handleProductInputChange = (field, value) => {
    setProductForm(prev => ({ ...prev, [field]: value }));
  };

  const agregarCaracteristicaAForm = (textoPredefinido = null) => {
    const textoAAgregar = textoPredefinido || nuevaCaracteristicaTexto;
    if (!textoAAgregar.trim()) return;
    const actual = productForm.descripcion || '';
    const actualizado = actual.trim() ? `${actual.trim()}\n• ${textoAAgregar.trim()}` : `• ${textoAAgregar.trim()}`;
    setProductForm(prev => ({ ...prev, descripcion: actualizado }));
    if (!textoPredefinido) setNuevaCaracteristicaTexto('');
  };

  const removerCaracteristica = (indexToRemove) => {
    const lineas = (productForm.descripcion || '').split(/\r?\n/).filter(l => l.trim().length > 0);
    const filtradas = lineas.filter((_, idx) => idx !== indexToRemove);
    setProductForm(prev => ({ ...prev, descripcion: filtradas.join('\n') }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showWarning('Formato inválido', 'Selecciona una imagen válida (PNG, JPG, WEBP).');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_URL}/api/admin/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setProductForm(prev => ({ ...prev, imagenUrl: data.url }));
        showToast('Imagen subida con éxito', 'success');
      } else {
        showError('Error', 'No se pudo subir la imagen.');
      }
    } catch (err) {
      console.error(err);
      showError('Error', 'Inconveniente de conexión al subir imagen.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEditClick = (prod) => {
    setEditingProducto(prod);
    setShowProductForm('edit');
    setProductForm({
      nombre: prod.nombre,
      descripcion: prod.descripcion || '',
      precio: prod.precio.toString(),
      duracionMeses: prod.duracionMeses.toString(),
      categoria: prod.categoria,
      imagenUrl: prod.imagenUrl || '',
      costoProveedor: (prod.costoProveedor || 0).toString(),
      activo: prod.activo !== false
    });
  };

  const submitProductForm = async (e) => {
    e.preventDefault();
    if (!token) return;

    try {
      const payload = {
        nombre: productForm.nombre.trim(),
        descripcion: productForm.descripcion.trim(),
        precio: parseFloat(productForm.precio),
        duracionMeses: parseInt(productForm.duracionMeses, 10),
        categoria: productForm.categoria,
        imagenUrl: productForm.imagenUrl.trim(),
        costoProveedor: parseFloat(productForm.costoProveedor) || 0,
        activo: productForm.activo !== undefined ? productForm.activo : true
      };

      let url = `${API_URL}/api/admin/productos`;
      let method = 'POST';

      if (showProductForm === 'edit' && editingProducto) {
        const id = editingProducto.id || editingProducto.productoId;
        url = `${API_URL}/api/admin/productos/${id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showSuccess(
          showProductForm === 'edit' ? '¡Producto Actualizado!' : '¡Producto Creado!',
          `"${payload.nombre}" se guardó en el catálogo.`
        );
        setShowProductForm(null);
        setEditingProducto(null);
        await fetchProductos();
      } else {
        const errData = await res.json();
        showError('Error', errData.mensaje || 'No se pudo guardar el producto.');
      }
    } catch (err) {
      console.error(err);
      showError('Error', 'Error en el servidor al guardar.');
    }
  };

  const eliminarProducto = async (prodId) => {
    if (!token || !prodId) return;
    try {
      const response = await fetch(`${API_URL}/api/admin/productos/${prodId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showSuccess('¡Desactivado!', 'El producto fue ocultado del catálogo público. Puedes reactivarlo cuando tengas stock.');
        await fetchProductos();
      } else {
        const err = await response.json();
        showError('No se pudo eliminar', err.mensaje || 'Error al eliminar.');
      }
    } catch (err) {
      console.error(err);
      showError('Error', 'Fallo de conexión al eliminar producto.');
    }
  };

  // --- INTERRUPTOR DE VISIBILIDAD RÁPIDA (PÚBLICO / GESTIÓN OCULTO) ---
  const handleToggleVisibilidad = async (prodId) => {
    if (!token || !prodId) return;
    try {
      setTogglingVisibilityId(prodId);

      const prodActual = productos.find(p => (p.id || p.productoId) === prodId);
      const nuevoActivo = prodActual ? !prodActual.activo : true;

      let success = false;
      let mensajeResultado = nuevoActivo 
        ? '🟢 Producto ahora es VISIBLE en la tienda pública' 
        : '🟡 Producto oculto (Modo Gestión / Sin Stock)';

      // 1. Intentar endpoint dedicado de toggle
      try {
        const response = await fetch(`${API_URL}/api/admin/productos/${prodId}/toggle-visibilidad`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          success = true;
          if (data.mensaje) mensajeResultado = data.mensaje;
        }
      } catch (e) {
        console.warn("Endpoint toggle-visibilidad falló, intentando actualización de modelo:", e);
      }

      // 2. Si el endpoint dedicado no está desplegado aún en producción, actualizar mediante PUT /api/admin/productos/{id}
      if (!success && prodActual) {
        try {
          const payload = {
            nombre: prodActual.nombre,
            descripcion: prodActual.descripcion || '',
            precio: prodActual.precio,
            duracionMeses: prodActual.duracionMeses,
            categoria: prodActual.categoria,
            imagenUrl: prodActual.imagenUrl || '',
            costoProveedor: prodActual.costoProveedor || 0,
            activo: nuevoActivo
          };

          const resUpdate = await fetch(`${API_URL}/api/admin/productos/${prodId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });

          if (resUpdate.ok) {
            success = true;
          }
        } catch (e) {
          console.error("Error en fallback de actualización:", e);
        }
      }

      if (success) {
        setProductos(prev => prev.map(p => {
          const id = p.id || p.productoId;
          if (id === prodId) {
            return { ...p, activo: nuevoActivo };
          }
          return p;
        }));

        showToast(mensajeResultado, nuevoActivo ? 'success' : 'info');
      } else {
        showError('Error', 'No se pudo alternar la visibilidad en el servidor.');
      }
    } catch (err) {
      console.error("Error al alternar visibilidad:", err);
      showError('Error', 'Inconveniente al cambiar la visibilidad del producto.');
    } finally {
      setTogglingVisibilityId(null);
    }
  };

  // --- 3. CLIENTES: CRUD & HANDLERS ---
  const fetchClientes = async (retryCount = 0) => {
    if (!token) return;
    try {
      setLoadingClientes(true);
      const res = await fetch(`${API_URL}/api/admin/clientes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleAuthExpired();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setClientes(data);
      } else if (retryCount < 2) {
        setTimeout(() => fetchClientes(retryCount + 1), 3000);
      }
    } catch (e) {
      console.error(e);
      if (retryCount < 2) {
        setTimeout(() => fetchClientes(retryCount + 1), 3000);
      }
    } finally {
      setLoadingClientes(false);
    }
  };

  const fetchClienteHistory = async (cliente) => {
    if (!cliente || !cliente.id || !token) return;
    try {
      setLoadingHistory(true);
      setSelectedCliente(cliente);
      const res = await fetch(`${API_URL}/api/ordenes/cliente/${cliente.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setClienteHistory(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const openAddCliente = () => {
    setEditingCliente(null);
    setShowClienteForm('create');
    setClienteForm({
      nombre: '',
      email: '',
      dni: '',
      telefono: '',
      passwordInicial: '',
      asignarNuevaContrasena: ''
    });
  };

  const openEditCliente = (c) => {
    setEditingCliente(c);
    setShowClienteForm('edit');
    setClienteForm({
      nombre: c.nombre || '',
      email: c.email || '',
      dni: c.dni || '',
      telefono: c.telefono || c.whatsApp || c.whatsapp || '',
      passwordInicial: '',
      asignarNuevaContrasena: ''
    });
  };

  const submitClienteForm = async (e) => {
    e.preventDefault();
    if (!token) return;

    try {
      const isEdit = showClienteForm === 'edit' && editingCliente;
      const url = isEdit 
        ? `${API_URL}/api/admin/clientes/${editingCliente.id}`
        : `${API_URL}/api/admin/clientes`;
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        nombre: clienteForm.nombre.trim(),
        email: clienteForm.email.trim(),
        dni: clienteForm.dni.trim(),
        telefono: clienteForm.telefono.trim(),
        ...(isEdit 
          ? { nuevaContrasena: clienteForm.asignarNuevaContrasena.trim() || null }
          : { passwordInicial: clienteForm.passwordInicial.trim() }
        )
      };

      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showSuccess(isEdit ? '¡Cliente Actualizado!' : '¡Cliente Creado!', `Se guardaron los datos de ${payload.nombre}.`);
        setShowClienteForm(null);
        setEditingCliente(null);
        await fetchClientes();
      } else {
        const err = await res.json();
        showError('Error', err.mensaje || 'No se pudo guardar el cliente.');
      }
    } catch (err) {
      console.error(err);
      showError('Error', 'Fallo al conectar con el servidor.');
    }
  };

  // --- 4. CUPONES & MARKETING HANDLERS ---
  const fetchCupones = async () => {
    if (!token) return;
    try {
      setLoadingCupones(true);
      const res = await fetch(`${API_URL}/api/cupones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCupones(data);
        if (data.length > 0 && !selectedMarketingCoupon) {
          setSelectedMarketingCoupon(data[0].codigo);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCupones(false);
    }
  };

  const submitCuponForm = async (e) => {
    e.preventDefault();
    if (!token || !cuponForm.codigo.trim()) return;

    try {
      const payload = {
        codigo: cuponForm.codigo.trim().toUpperCase(),
        porcentajeDescuento: parseFloat(cuponForm.porcentajeDescuento) || 0,
        montoDescuentoFijo: parseFloat(cuponForm.montoDescuentoFijo) || 0,
        esPorcentaje: cuponForm.esPorcentaje,
        usosMaximos: parseInt(cuponForm.usosMaximos, 10) || 100,
        activo: true
      };

      const res = await fetch(`${API_URL}/api/cupones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showSuccess("¡Cupón Creado!", `El código ${payload.codigo} está activo.`);
        setCuponForm({
          codigo: '',
          porcentajeDescuento: '10',
          montoDescuentoFijo: '0',
          esPorcentaje: true,
          usosMaximos: '100'
        });
        await fetchCupones();
      } else {
        const errData = await res.json();
        showError("Error", errData.mensaje || "No se pudo registrar el cupón.");
      }
    } catch (err) {
      console.error(err);
      showError("Error", "Inconveniente al procesar cupón.");
    }
  };

  const handleToggleCuponEstado = async (cuponId) => {
    if (!token || !cuponId) return;
    try {
      const res = await fetch(`${API_URL}/api/cupones/${cuponId}/estado`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) await fetchCupones();
    } catch (err) {
      console.error(err);
    }
  };

  // --- 5. REPORTES FINANCIEROS ---
  const fetchReportes = async () => {
    if (!token) return;
    try {
      setLoadingReportes(true);
      const res = await fetch(`${API_URL}/api/admin/reportes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReportes(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingReportes(false);
    }
  };

  // --- 6. ANALÍTICA Y TRÁFICO WEB EN VIVO ---
  const fetchVisitas = async (silencioso = false) => {
    if (!token) return;
    try {
      if (!silencioso) setLoadingVisitas(true);
      const res = await fetch(`${API_URL}/api/admin/visitas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVisitasData(data);
        setUltimaActualizacionVisitas(new Date());
      }
    } catch (err) {
      console.error("Error al cargar analítica de visitas:", err);
    } finally {
      if (!silencioso) setLoadingVisitas(false);
    }
  };

  // Auto-refresco en vivo para la pestaña de Tráfico
  useEffect(() => {
    if (tab === 'visitas' && autoRefreshVisitas && token) {
      const interval = setInterval(() => {
        fetchVisitas(true);
      }, 15000); // 15 segundos
      return () => clearInterval(interval);
    }
  }, [tab, autoRefreshVisitas, token]);

  // --- 7. MÓDULO DE PACKS & COMBOS PRO DE AHORRO ---
  const fetchCombos = async (retryCount = 0) => {
    if (!token) return;
    try {
      setLoadingCombos(true);
      const res = await fetch(`${API_URL}/api/admin/combos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleAuthExpired();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setCombos(Array.isArray(data) ? data : []);
      } else if (retryCount < 2) {
        setTimeout(() => fetchCombos(retryCount + 1), 3000);
      }
    } catch (e) {
      console.error("Error al obtener combos:", e);
      if (retryCount < 2) {
        setTimeout(() => fetchCombos(retryCount + 1), 3000);
      }
    } finally {
      setLoadingCombos(false);
    }
  };

  const openAddCombo = () => {
    setEditingCombo(null);
    setShowComboForm('create');
    setNuevoItemTexto('');
    setComboForm({
      nombre: '',
      subtitulo: '',
      descripcion: '',
      precioOriginal: '',
      precioCombo: '',
      ahorro: '',
      badge: 'Oferta Especial',
      items: [],
      activo: true,
      ordenVisual: combos.length + 1
    });
  };

  const openEditCombo = (c) => {
    setEditingCombo(c);
    setShowComboForm('edit');
    setNuevoItemTexto('');
    setComboForm({
      nombre: c.nombre || '',
      subtitulo: c.subtitulo || '',
      descripcion: c.descripcion || '',
      precioOriginal: c.precioOriginal ?? '',
      precioCombo: c.precioCombo ?? '',
      ahorro: c.ahorro ?? '',
      badge: c.badge || 'Oferta Especial',
      items: Array.isArray(c.items) ? [...c.items] : [],
      activo: c.activo ?? true,
      ordenVisual: c.ordenVisual ?? 0
    });
  };

  const handleToggleComboVisibility = async (combo) => {
    if (!token || !combo || !combo.id) return;
    try {
      setTogglingComboId(combo.id);
      const res = await fetch(`${API_URL}/api/admin/combos/${combo.id}/toggle-visibilidad`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleAuthExpired();
        return;
      }
      if (res.ok) {
        const result = await res.json();
        setCombos(prev => prev.map(c => c.id === combo.id ? { ...c, activo: result.activo } : c));
        showToast(result.mensaje || (result.activo ? 'Combo activado' : 'Combo ocultado'), 'info');
      } else {
        showError('Error', 'No se pudo actualizar el estado del combo.');
      }
    } catch (e) {
      console.error(e);
      showError('Error', 'Inconveniente de conexión al alternar combo.');
    } finally {
      setTogglingComboId(null);
    }
  };

  const handlePrecioChange = (campo, valor) => {
    setComboForm(prev => {
      const nuevoForm = { ...prev, [campo]: valor };
      const orig = parseFloat(campo === 'precioOriginal' ? valor : prev.precioOriginal) || 0;
      const com = parseFloat(campo === 'precioCombo' ? valor : prev.precioCombo) || 0;
      if (orig > com && com > 0) {
        nuevoForm.ahorro = (orig - com).toFixed(2);
      }
      return nuevoForm;
    });
  };

  const handleToggleProductInCombo = (productoNombre) => {
    setComboForm(prev => {
      const exists = prev.items.some(it => it.toLowerCase() === productoNombre.toLowerCase());
      if (exists) {
        return { ...prev, items: prev.items.filter(it => it.toLowerCase() !== productoNombre.toLowerCase()) };
      } else {
        return { ...prev, items: [...prev.items, productoNombre] };
      }
    });
  };

  const handleAddCustomItem = () => {
    const texto = nuevoItemTexto.trim();
    if (!texto) return;
    if (!comboForm.items.some(it => it.toLowerCase() === texto.toLowerCase())) {
      setComboForm(prev => ({ ...prev, items: [...prev.items, texto] }));
    }
    setNuevoItemTexto('');
  };

  const submitComboForm = async (e) => {
    e.preventDefault();
    if (!token) return;

    if (!comboForm.nombre.trim()) {
      showWarning('Campo Requerido', 'El nombre del combo es obligatorio.');
      return;
    }
    const pOriginal = parseFloat(comboForm.precioOriginal);
    const pCombo = parseFloat(comboForm.precioCombo);
    if (isNaN(pOriginal) || isNaN(pCombo) || pOriginal <= 0 || pCombo <= 0) {
      showWarning('Precios Inválidos', 'Debes ingresar precios válidos mayores a 0.');
      return;
    }
    if (comboForm.items.length === 0) {
      showWarning('Productos Faltantes', 'Agrega al menos 1 producto incluido en este combo.');
      return;
    }

    try {
      const isEdit = showComboForm === 'edit' && editingCombo;
      const url = isEdit 
        ? `${API_URL}/api/admin/combos/${editingCombo.id}`
        : `${API_URL}/api/admin/combos`;
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        nombre: comboForm.nombre.trim(),
        subtitulo: comboForm.subtitulo?.trim() || '',
        descripcion: comboForm.descripcion?.trim() || '',
        precioOriginal: pOriginal,
        precioCombo: pCombo,
        ahorro: parseFloat(comboForm.ahorro) || Math.max(0, pOriginal - pCombo),
        badge: comboForm.badge?.trim() || 'Oferta Especial',
        items: comboForm.items,
        activo: comboForm.activo,
        ordenVisual: parseInt(comboForm.ordenVisual, 10) || 0
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.status === 401) {
        handleAuthExpired();
        return;
      }

      if (res.ok) {
        showSuccess(
          isEdit ? '¡Combo Actualizado!' : '¡Combo Creado!',
          `El paquete "${payload.nombre}" ha sido guardado exitosamente.`
        );
        setShowComboForm(null);
        setEditingCombo(null);
        await fetchCombos();
      } else {
        const err = await res.json();
        showError('Error', err.mensaje || 'No se pudo guardar el combo.');
      }
    } catch (err) {
      console.error(err);
      showError('Error', 'Inconveniente al procesar la solicitud.');
    }
  };

  const eliminarCombo = async (comboId) => {
    if (!token || !comboId) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/combos/${comboId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleAuthExpired();
        return;
      }
      if (res.ok) {
        showSuccess('Combo Eliminado', 'El pack ha sido retirado del sistema.');
        await fetchCombos();
      } else {
        const err = await res.json();
        showError('Error', err.mensaje || 'No se pudo eliminar el combo.');
      }
    } catch (err) {
      console.error(err);
      showError('Error', 'Inconveniente al eliminar el combo.');
    }
  };

  // --- CÁLCULO DE KPIS GLOBALES PARA EL DASHBOARD EJECUTIVO ---
  const metricasGlobales = useMemo(() => {
    const ordenesCompletadas = ordenes.filter(o => o.estado === 'Completada');
    const totalIngresos = ordenesCompletadas.reduce((sum, o) => sum + (o.total || 0), 0);
    
    let totalCosto = 0;
    ordenesCompletadas.forEach(o => {
      o.detalles?.forEach(d => {
        const costo = d.producto?.costoProveedor || 0;
        totalCosto += costo * (d.cantidad || 1);
      });
    });

    const gananciaNeta = totalIngresos - totalCosto;
    const margenPorcentaje = totalIngresos > 0 ? (gananciaNeta / totalIngresos) * 100 : 0;
    const ordenesPendientesCount = ordenes.filter(o => o.estado === 'Pendiente').length;
    const renovacionesCount = renovaciones.length;
    const ticketPromedio = ordenesCompletadas.length > 0 ? totalIngresos / ordenesCompletadas.length : 0;

    return {
      totalIngresos,
      gananciaNeta,
      margenPorcentaje,
      ordenesPendientesCount,
      renovacionesCount,
      totalProductos: productos.length,
      productosVisibles: productos.filter(p => p.activo !== false).length,
      productosOcultos: productos.filter(p => p.activo === false).length,
      totalClientes: clientes.length,
      ticketPromedio
    };
  }, [ordenes, renovaciones, productos, clientes]);

  // --- FILTRADO DE ÓRDENES ---
  const ordenesFiltradas = useMemo(() => {
    return ordenes
      .filter(ord => {
        const matchesStatus = filterOrderStatus === 'Todos' || ord.estado === filterOrderStatus;
        const q = searchOrderQuery.toLowerCase();
        const matchesQuery = 
          ord.id.toString().includes(q) ||
          (ord.usuario?.nombre || '').toLowerCase().includes(q) ||
          (ord.usuario?.email || '').toLowerCase().includes(q) ||
          (ord.usuario?.whatsapp || '').toLowerCase().includes(q) ||
          ord.detalles?.some(d => (d.producto?.nombre || '').toLowerCase().includes(q));
        return matchesStatus && matchesQuery;
      })
      .sort((a, b) => {
        if (sortOrder === 'mayor_monto') return b.total - a.total;
        return new Date(b.fechaCreacion) - new Date(a.fechaCreacion);
      });
  }, [ordenes, filterOrderStatus, searchOrderQuery, sortOrder]);

  // --- FILTRADO DE PRODUCTOS ---
  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      const matchesCat = filterProductCategory === 'Todos' || p.categoria === filterProductCategory;
      const matchesVis = 
        filterProductVisibility === 'Todos' || 
        (filterProductVisibility === 'Visibles' && p.activo !== false) ||
        (filterProductVisibility === 'Ocultos' && p.activo === false);
      const q = searchProductQuery.toLowerCase();
      const matchesQ = 
        (p.nombre || '').toLowerCase().includes(q) ||
        (p.descripcion || '').toLowerCase().includes(q);
      return matchesCat && matchesVis && matchesQ;
    });
  }, [productos, filterProductCategory, filterProductVisibility, searchProductQuery]);

  // --- FILTRADO DE PACKS & COMBOS ---
  const combosFiltrados = useMemo(() => {
    return combos.filter(c => {
      const matchesVis = 
        filterComboVisibility === 'Todos' || 
        (filterComboVisibility === 'Activos' && c.activo !== false) ||
        (filterComboVisibility === 'Ocultos' && c.activo === false);
      const q = searchComboQuery.toLowerCase();
      const matchesQ = 
        (c.nombre || '').toLowerCase().includes(q) ||
        (c.subtitulo || '').toLowerCase().includes(q) ||
        (c.descripcion || '').toLowerCase().includes(q) ||
        (c.items || []).some(it => (it || '').toLowerCase().includes(q));
      return matchesVis && matchesQ;
    }).sort((a, b) => (a.ordenVisual || 0) - (b.ordenVisual || 0));
  }, [combos, filterComboVisibility, searchComboQuery]);

  // --- CONTROL Y SINCRONIZACIÓN DEL SCROLL LATERAL STICKY DE PRODUCTOS ---
  const updateScrollMetrics = () => {
    if (!tableContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tableContainerRef.current;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    setTableScrollMetrics({
      scrollLeft,
      scrollWidth,
      clientWidth,
      maxScroll,
      canScroll: maxScroll > 5
    });
  };

  const handleTableScroll = () => {
    if (!tableContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tableContainerRef.current;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    setTableScrollMetrics(prev => ({
      ...prev,
      scrollLeft,
      scrollWidth,
      clientWidth,
      maxScroll,
      canScroll: maxScroll > 5
    }));

    if (stickyScrollRef.current && Math.abs(stickyScrollRef.current.scrollLeft - scrollLeft) > 2) {
      stickyScrollRef.current.scrollLeft = scrollLeft;
    }
  };

  const handleStickyTrackScroll = (e) => {
    const newLeft = e.target.scrollLeft;
    if (tableContainerRef.current && Math.abs(tableContainerRef.current.scrollLeft - newLeft) > 2) {
      tableContainerRef.current.scrollLeft = newLeft;
    }
    setTableScrollMetrics(prev => ({ ...prev, scrollLeft: newLeft }));
  };

  const handleSliderScroll = (e) => {
    const newLeft = Number(e.target.value);
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollLeft = newLeft;
    }
    if (stickyScrollRef.current) {
      stickyScrollRef.current.scrollLeft = newLeft;
    }
    setTableScrollMetrics(prev => ({ ...prev, scrollLeft: newLeft }));
  };

  const scrollToSide = (direction) => {
    if (!tableContainerRef.current) return;
    const target = direction === 'right' ? (tableScrollMetrics.maxScroll || 1200) : 0;
    tableContainerRef.current.scrollTo({ left: target, behavior: 'smooth' });
    if (stickyScrollRef.current) {
      stickyScrollRef.current.scrollTo({ left: target, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    updateScrollMetrics();
    const timer = setTimeout(updateScrollMetrics, 350);
    window.addEventListener('resize', updateScrollMetrics);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateScrollMetrics);
    };
  }, [productosFiltrados, tab]);

  // --- GENERADOR DE TEXTO DE CAMPAÑA MARKETING ---
  const mensajeCampanaMarketing = useMemo(() => {
    const cuponElegido = selectedMarketingCoupon || 'INFORMATICS10';
    if (campaignType === 'renovacion') {
      return (
        `¡Hola [Nombre]! 👋 Te saludamos de Informatics.\n\n` +
        `Notamos que tu licencia/suscripción está próxima a vencer. Queremos premiar tu fidelidad con un *descuento exclusivo de renovación*:\n\n` +
        `🎁 Usa el cupón: *${cuponElegido}*\n` +
        `⚡ Válido en: https://tienda-online-informatics.vercel.app/\n\n` +
        `Garantiza la continuidad de tu servicio sin interrupciones. ¿Te gustaría que te ayudemos a renovar en 1 minuto?`
      );
    } else if (campaignType === 'lanzamiento') {
      return (
        `🚀 *¡Novedades en Informatics!* 💻\n\n` +
        `Ya tenemos disponibles en stock inmediato:\n` +
        `✨ Office 2024 Pro Plus (Licencia Permanente de por vida)\n` +
        `✨ Windows 11 Pro Oficial (Activación directa Microsoft)\n` +
        `✨ Claude Pro & ChatGPT Plus con IA avanzada\n\n` +
        `Aprovecha el cupón *${cuponElegido}* para un descuento especial hoy:\n` +
        `👉 https://tienda-online-informatics.vercel.app/\n\n` +
        `¡Entrega garantizada en menos de 15 minutos!`
      );
    } else {
      return (
        `¡Hola [Nombre]! Te extrañamos en Informatics 💎\n\n` +
        `Queremos que sigas disfrutando del mejor software y streaming al mejor precio. Hemos reactivado para ti el cupón:\n\n` +
        `🎟️ Código VIP: *${cuponElegido}*\n` +
        `🌐 Accede aquí: https://tienda-online-informatics.vercel.app/\n\n` +
        `Si necesitas asesoría con algún programa o cuenta, estamos atentos a este chat.`
      );
    }
  }, [campaignType, selectedMarketingCoupon]);

  const handleCopiarMensajeCampana = () => {
    navigator.clipboard.writeText(mensajeCampanaMarketing);
    setCopiedMarketing(true);
    showToast('¡Plantilla copiada al portapapeles!', 'success');
    setTimeout(() => setCopiedMarketing(false), 2000);
  };

  if (!user || (user.rol !== 'Admin' && user.rol !== 'Administrador')) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in font-sans">
      
      {/* --- 1. CABECERA EJECUTIVA DE ADMINISTRACIÓN & MARKETING --- */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-emerald-500/10 pointer-events-none" />
        <div className="flex items-center gap-4 z-10">
          <div className="bg-gradient-to-br from-sky-500 to-indigo-600 p-4 rounded-2xl text-slate-950 shadow-lg shadow-sky-500/20">
            <ShieldAlert className="w-8 h-8 text-slate-950 font-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
                Panel de Control & Growth
              </h1>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Operativo 24/7
              </span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Administración de inventario, despacho de licencias, marketing digital y analítica comercial
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 z-10 w-full md:w-auto">
          <button
            onClick={() => {
              fetchAdminData();
              fetchProductos();
              fetchClientes();
              fetchCupones();
              fetchReportes();
              fetchVisitas(true);
              showToast('Datos actualizados en tiempo real', 'info');
            }}
            className="w-full md:w-auto bg-slate-955 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-2 shadow-sm"
            title="Refrescar métricas del sistema"
          >
            <RefreshCw className="w-4 h-4 text-sky-400" />
            Sincronizar Datos
          </button>
        </div>
      </div>

      {/* --- 2. TARJETAS DE KPIS EJECUTIVOS GLOBALES --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Ingresos Totales */}
        <div 
          onClick={() => setTab('reportes')}
          className="bg-slate-900 border border-slate-800 hover:border-sky-500/40 rounded-2xl p-5 shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-0.5"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ingresos Totales</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-100 font-mono">
            S/ {metricasGlobales.totalIngresos.toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Margen: ~{metricasGlobales.margenPorcentaje.toFixed(0)}% (S/ {metricasGlobales.gananciaNeta.toFixed(0)})
          </div>
        </div>

        {/* KPI 2: Órdenes Pendientes */}
        <div 
          onClick={() => { setTab('ordenes'); setFilterOrderStatus('Pendiente'); }}
          className={`border rounded-2xl p-5 shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-0.5 ${
            metricasGlobales.ordenesPendientesCount > 0 
              ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-400' 
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Despachos Pendientes</span>
            <div className={`p-2 rounded-xl border ${
              metricasGlobales.ordenesPendientesCount > 0 
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-100 font-mono">
            {metricasGlobales.ordenesPendientesCount}
          </div>
          <div className="text-[11px] text-amber-300 font-semibold mt-1">
            {metricasGlobales.ordenesPendientesCount > 0 ? '⚠️ Requiere entrega inmediata' : '✓ Todo despachado al día'}
          </div>
        </div>

        {/* KPI 3: Alertas de Renovación (Retención) */}
        <div 
          onClick={() => { setTab('ordenes'); }}
          className="bg-slate-900 border border-slate-800 hover:border-rose-500/40 rounded-2xl p-5 shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-0.5"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Vencimientos (≤ 5 días)</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-100 font-mono">
            {metricasGlobales.renovacionesCount}
          </div>
          <div className="text-[11px] text-rose-400 font-medium mt-1">
            Oportunidad de recompra / WhatsApp
          </div>
        </div>

        {/* KPI 4: Ticket Promedio y Clientes */}
        <div 
          onClick={() => setTab('clientes')}
          className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-0.5"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Clientes & Ticket AOV</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-100 font-mono">
            {metricasGlobales.totalClientes} <span className="text-xs text-slate-400 font-normal">clientes</span>
          </div>
          <div className="text-[11px] text-indigo-300 font-medium mt-1">
            Ticket promedio: S/ {metricasGlobales.ticketPromedio.toFixed(2)}
          </div>
        </div>
      </div>

      {/* --- 3. BARRA DE PESTAÑAS MEJORADA CON BADGES --- */}
      <div className="flex border-b border-slate-800 gap-2 sm:gap-4 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'ordenes', label: 'Órdenes Comerciales', icon: FileText, badge: metricasGlobales.ordenesPendientesCount > 0 ? `${metricasGlobales.ordenesPendientesCount} pendientes` : `${ordenes.length}` },
          { id: 'productos', label: 'Catálogo de Productos', icon: Package, badge: `${metricasGlobales.productosVisibles} activos` },
          { id: 'combos', label: 'Packs & Combos', icon: Flame, badge: `${combos.length} packs` },
          { id: 'clientes', label: 'Gestión de Clientes', icon: Users, badge: `${clientes.length}` },
          { id: 'cupones', label: 'Marketing & Cupones', icon: Sparkles, badge: 'Growth' },
          { id: 'reportes', label: 'Finanzas & Analítica', icon: BarChart3, badge: 'SLA' },
          { id: 'visitas', label: 'Tráfico en Vivo', icon: Activity, badge: visitasData ? `${visitasData.enLineaAhora} en vivo` : 'Radar' }
        ].map((item) => {
          const Icon = item.icon;
          const activo = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`pb-3.5 px-3 font-bold text-xs sm:text-sm transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
                activo 
                  ? 'border-sky-500 text-sky-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                activo 
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' 
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {item.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* --- TAB 1: GESTIÓN DE ÓRDENES COMERCIALES --- */}
      {/* ========================================================================= */}
      {tab === 'ordenes' && (
        <div className="space-y-6">
          {/* Dashboard Alertas de Renovación Inmediata */}
          {renovaciones.length > 0 && (
            <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-xl space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-amber-500/10 text-amber-400 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-amber-500/20 uppercase tracking-widest">
                Retención de Clientes
              </div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
                Vencimientos Próximos (≤ 5 Días) - Contacto de Retención
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renovaciones.map((ren) => (
                  <div 
                    key={ren.detalleId} 
                    className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <p className="text-xs text-slate-200 font-bold">
                        Cliente: <span className="text-sky-400">{ren.clienteNombre}</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        {ren.productoNombre} | Vence: <strong className="text-amber-400">{formatearFecha(ren.fechaVencimiento)}</strong>
                      </p>
                    </div>
                    <a
                      href={`https://api.whatsapp.com/send?phone=${ren.clienteWhatsApp}&text=${encodeURIComponent(
                        `Hola ${ren.clienteNombre}, te saludamos de Informatics. Tu suscripción de *${ren.productoNombre}* vence en 5 días. ¿Deseas renovarla hoy con entrega garantizada?`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-955 text-xs font-bold py-2 px-3.5 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Alertar WhatsApp
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Controles de Búsqueda, Filtrado y Exportación de Órdenes */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col lg:flex-row justify-between items-center gap-4">
            {/* Buscador Universal */}
            <div className="relative w-full lg:w-96">
              <input
                type="text"
                placeholder="Buscar por ID, Cliente, Correo o Producto..."
                value={searchOrderQuery}
                onChange={(e) => setSearchOrderQuery(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 border border-slate-800 focus:border-sky-500 rounded-xl pl-10 pr-4 py-2.5 text-xs placeholder-slate-500 transition-all outline-none"
              />
              <Search className="absolute left-3.5 top-3 text-slate-500 w-4 h-4" />
            </div>

            {/* Filtros de Estado */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto text-xs pb-1 lg:pb-0 scrollbar-none">
              {['Todos', 'Pendiente', 'Completada', 'Cancelada'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterOrderStatus(status)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                    filterOrderStatus === status 
                      ? 'bg-sky-500 text-slate-955 shadow-md' 
                      : 'bg-slate-955 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {status}
                </button>
              ))}

              {/* Botón Exportar CSV */}
              <button
                onClick={exportarOrdenesCSV}
                className="ml-2 bg-slate-955 hover:bg-slate-800 border border-slate-800 text-emerald-400 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm whitespace-nowrap"
                title="Descargar reporte en Excel / CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Descargar CSV
              </button>
            </div>
          </div>

          {/* Tabla de Órdenes */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                Listado de Pedidos ({ordenesFiltradas.length} órdenes encontradas)
              </h2>
              <span className="text-xs text-slate-400 hidden sm:inline">
                Aprobación y entrega en 1 clic
              </span>
            </div>

            {loadingOrdenes ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
              </div>
            ) : ordenesFiltradas.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No hay pedidos que coincidan con la búsqueda o filtro seleccionado.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="min-w-full divide-y divide-slate-800 text-sm text-left">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] tracking-wider font-semibold">
                    <tr>
                      <th className="px-6 py-4">Orden / Fecha</th>
                      <th className="px-6 py-4">Cliente / Contacto</th>
                      <th className="px-6 py-4">Producto(s) Comprados</th>
                      <th className="px-6 py-4">Total</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4">Aprovisionamiento / Entrega</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                    {ordenesFiltradas.map((ord) => (
                      <React.Fragment key={ord.id}>
                        <tr className="hover:bg-slate-900/80 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-mono font-bold text-sky-400">#{ord.id}</div>
                            <div className="text-xs text-slate-400">{formatearFecha(ord.fechaCreacion)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-bold text-slate-200">{ord.usuario?.nombre || 'Cliente'}</div>
                            <div className="text-xs text-slate-400">{ord.usuario?.email}</div>
                            <a 
                              href={`https://api.whatsapp.com/send?phone=${ord.usuario?.whatsapp}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:underline text-xs font-mono"
                            >
                              📱 {ord.usuario?.whatsapp}
                            </a>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              {ord.detalles.map((d) => (
                                <div key={d.id} className="text-slate-300 text-xs">
                                  {d.producto?.nombre} <span className="text-slate-500 font-bold">x{d.cantidad}</span>
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
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' 
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
                                <span className="text-xs text-sky-400 font-medium">Asignando claves...</span>
                              ) : editingOrderInputId === ord.id ? (
                                <span className="text-xs text-slate-400 font-medium">Modificando cantidades...</span>
                              ) : (
                                <div className="flex gap-2 flex-wrap">
                                  <button
                                    onClick={() => startCompletarOrden(ord)}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-955 font-bold py-1.5 px-3 rounded-xl text-xs transition-all flex items-center gap-1 active:scale-95 shadow-md shadow-emerald-500/20"
                                  >
                                    <CheckSquare className="w-3.5 h-3.5" />
                                    Entregar Clave
                                  </button>
                                  <button
                                    onClick={() => startEditarOrden(ord)}
                                    className="bg-slate-955 hover:bg-slate-800 text-slate-300 border border-slate-800 py-1.5 px-3 rounded-xl text-xs transition-all flex items-center gap-1"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleCancelarOrden(ord.id)}
                                    className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 text-xs transition-all font-bold"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              )
                            ) : ord.estado === 'Cancelada' ? (
                              <span className="text-xs text-rose-400 font-bold uppercase tracking-wider">Cancelada</span>
                            ) : (
                              <div className="space-y-2 max-w-xs">
                                {ord.detalles.map((d) => (
                                  <div key={d.id} className="text-xs text-slate-300 font-mono truncate" title={d.clave}>
                                    <span className="text-slate-400 font-sans">{d.producto?.nombre}:</span> {d.clave}
                                  </div>
                                ))}
                                <button
                                  onClick={() => handleEnviarNotificacionWhatsApp(ord)}
                                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-3 py-1 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  Reenviar WhatsApp
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>

                        {/* Asignación de Claves con Generador Sugerido Inteligente */}
                        {activeOrderInputId === ord.id && (
                          <tr className="bg-slate-955">
                            <td colSpan="6" className="px-6 py-4">
                              <div className="bg-slate-900 border border-sky-500/30 rounded-2xl p-5 space-y-4 max-w-2xl shadow-xl">
                                <div className="flex justify-between items-center">
                                  <h4 className="text-xs font-bold text-sky-400 flex items-center gap-1.5 uppercase tracking-wider">
                                    <Key className="w-4 h-4" />
                                    Aprovisionamiento de Claves de Licencia - Orden #{ord.id}
                                  </h4>
                                  <span className="text-[10px] text-slate-400">
                                    Genera códigos en formato oficial o ingresa los provistos por tu mayorista
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                  {ord.detalles.map((d) => (
                                    <div key={d.id} className="flex flex-col gap-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
                                      <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-200">
                                          {d.producto?.nombre}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => generarClaveSugerida(d.id, d.producto?.nombre)}
                                          className="text-[10px] bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all"
                                        >
                                          <Sparkles className="w-3 h-3" />
                                          ⚡ Generar Clave Sugerida
                                        </button>
                                      </div>

                                      <textarea
                                        rows={2}
                                        required
                                        placeholder="Ingresa la clave de activación o credenciales..."
                                        value={clavesForm[d.id] || ''}
                                        onChange={(e) => handleClaveChange(d.id, e.target.value)}
                                        className="bg-slate-900 text-slate-100 border border-slate-800 focus:border-sky-500 rounded-xl w-full p-2.5 text-xs font-mono resize-y outline-none"
                                      />
                                    </div>
                                  ))}
                                </div>

                                <div className="flex gap-2 justify-end pt-2">
                                  <button
                                    onClick={() => setActiveOrderInputId(null)}
                                    className="bg-slate-955 border border-slate-800 text-slate-400 text-xs px-4 py-2 rounded-xl transition-all"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={() => submitCompletarOrden(ord.id)}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-955 font-bold text-xs px-5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Guardar, Aprobar & Despachar
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* Modificación de Cantidades */}
                        {editingOrderInputId === ord.id && (
                          <tr className="bg-slate-955">
                            <td colSpan="6" className="px-6 py-4">
                              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 max-w-2xl">
                                <h4 className="text-xs font-bold text-sky-400 flex items-center gap-1.5 uppercase tracking-wider">
                                  <Edit3 className="w-4 h-4" /> Modificar Cantidades - Pedido #{ord.id}
                                </h4>
                                <div className="grid grid-cols-1 gap-3">
                                  {editOrderItems.map((item) => (
                                    <div key={item.productoId} className="flex items-center justify-between gap-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
                                      <span className="text-xs font-bold text-slate-200">{item.nombre}</span>
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg">
                                          <button
                                            onClick={() => handleEditQuantityChange(item.productoId, -1)}
                                            className="px-2.5 py-1 text-slate-400 hover:text-white"
                                          >
                                            -
                                          </button>
                                          <span className="px-3 text-xs font-mono font-bold text-sky-400">{item.cantidad}</span>
                                          <button
                                            onClick={() => handleEditQuantityChange(item.productoId, 1)}
                                            className="px-2.5 py-1 text-slate-400 hover:text-white"
                                          >
                                            +
                                          </button>
                                        </div>
                                        <button
                                          onClick={() => handleRemoveItemFromEdit(item.productoId)}
                                          className="text-rose-500 hover:text-rose-400 p-1"
                                          title="Remover Ítem"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex gap-2 justify-end pt-2">
                                  <button
                                    onClick={() => setEditingOrderInputId(null)}
                                    className="bg-slate-955 border border-slate-800 text-slate-400 text-xs px-4 py-2 rounded-xl"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={() => submitEditarOrden(ord.id)}
                                    className="bg-sky-500 hover:bg-sky-400 text-slate-955 font-bold text-xs px-4 py-2 rounded-xl"
                                  >
                                    Recalcular y Guardar
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

      {/* ========================================================================= */}
      {/* --- TAB 2: CATÁLOGO DE PRODUCTOS (CRUD & ANÁLISIS DE MÁRGENES) --- */}
      {/* ========================================================================= */}
      {tab === 'productos' && (
        <div className="space-y-6">
          {/* Barra Superior con Buscador, Filtro de Categoría, Filtro de Visibilidad y Botón Nuevo */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1">
              {/* Buscador de Productos */}
              <div className="relative w-full md:w-72">
                <input
                  type="text"
                  placeholder="Buscar producto o descripción..."
                  value={searchProductQuery}
                  onChange={(e) => setSearchProductQuery(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 border border-slate-800 focus:border-sky-500 rounded-xl pl-10 pr-4 py-2 text-xs outline-none"
                />
                <Search className="absolute left-3.5 top-2.5 text-slate-500 w-4 h-4" />
              </div>

              {/* Filtro de Categorías */}
              <div className="flex gap-1.5 overflow-x-auto text-xs pb-1 md:pb-0">
                {['Todos', 'Software', 'Streaming', 'IA'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterProductCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                      filterProductCategory === cat 
                        ? 'bg-sky-500 text-slate-955 shadow-md shadow-sky-500/20' 
                        : 'bg-slate-955 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Filtro de Visibilidad Pública (Interruptor / Tabs) */}
              <div className="flex gap-1.5 overflow-x-auto text-xs pb-1 md:pb-0 border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0 md:pl-3">
                {[
                  { id: 'Todos', label: `Todos (${productos.length})` },
                  { id: 'Visibles', label: `🟢 Visibles (${productos.filter(p => p.activo !== false).length})` },
                  { id: 'Ocultos', label: `🟡 Ocultos (${productos.filter(p => p.activo === false).length})` }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFilterProductVisibility(item.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap text-xs ${
                      filterProductVisibility === item.id 
                        ? 'bg-emerald-500 text-slate-955 shadow-md shadow-emerald-500/20' 
                        : 'bg-slate-955 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {!showProductForm && (
              <button
                onClick={() => {
                  setShowProductForm('create');
                  setEditingProducto(null);
                  setProductForm({
                    nombre: '',
                    descripcion: '',
                    precio: '',
                    duracionMeses: '',
                    categoria: 'Software',
                    imagenUrl: '',
                    costoProveedor: '',
                    activo: true
                  });
                }}
                className="w-full xl:w-auto bg-sky-500 hover:bg-sky-400 text-slate-955 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Nuevo Producto
              </button>
            )}
          </div>

          {/* Formulario Crear/Editar Producto */}
          {showProductForm && (
            <div className="bg-slate-900 border border-sky-500/30 rounded-3xl p-6 shadow-2xl relative">
              <button
                onClick={() => setShowProductForm(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-slate-100 mb-6 flex items-center gap-2">
                <Package className="w-5 h-5 text-sky-400" />
                {showProductForm === 'create' ? 'Crear Nuevo Producto en Catálogo' : 'Editar Información de Producto'}
              </h3>

              <form onSubmit={submitProductForm} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Nombre</label>
                  <input
                    type="text"
                    required
                    value={productForm.nombre}
                    onChange={(e) => handleProductInputChange('nombre', e.target.value)}
                    className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-2.5 text-xs outline-none focus:border-sky-500"
                    placeholder="Ej. Office Profesional Plus 2024"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Categoría</label>
                  <select
                    value={productForm.categoria}
                    onChange={(e) => handleProductInputChange('categoria', e.target.value)}
                    className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-2.5 text-xs outline-none focus:border-sky-500"
                  >
                    <option value="Software">Software</option>
                    <option value="Streaming">Streaming</option>
                    <option value="IA">Inteligencia Artificial (IA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Precio Venta (S/ )</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.precio}
                    onChange={(e) => handleProductInputChange('precio', e.target.value)}
                    className="w-full bg-slate-950 text-emerald-400 font-mono font-bold border border-slate-800 rounded-xl p-2.5 text-xs outline-none focus:border-sky-500"
                    placeholder="45.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Costo Proveedor (S/ )</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.costoProveedor}
                    onChange={(e) => handleProductInputChange('costoProveedor', e.target.value)}
                    className="w-full bg-slate-950 text-rose-400 font-mono font-bold border border-slate-800 rounded-xl p-2.5 text-xs outline-none focus:border-sky-500"
                    placeholder="20.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Duración (Meses: 0 = Perpetuo)</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    required
                    value={productForm.duracionMeses}
                    onChange={(e) => handleProductInputChange('duracionMeses', e.target.value)}
                    className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-2.5 text-xs outline-none focus:border-sky-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Ruta de Imagen</label>
                  <input
                    type="text"
                    required
                    value={productForm.imagenUrl}
                    onChange={(e) => handleProductInputChange('imagenUrl', e.target.value)}
                    className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl p-2.5 text-xs font-mono outline-none focus:border-sky-500"
                    placeholder="/office2024.png o https://..."
                  />
                </div>

                {/* Gestor de Características */}
                <div className="md:col-span-2 bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-sky-400 uppercase">Características / Puntos Clave:</span>
                    <span className="text-[10px] text-slate-500">Se muestran con viñetas al cliente</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={nuevaCaracteristicaTexto}
                      onChange={(e) => setNuevaCaracteristicaTexto(e.target.value)}
                      placeholder="Ej. Descarga limpia setup.office.com, Activación de por vida..."
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => agregarCaracteristicaAForm()}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-955 font-bold px-3 py-2 rounded-xl text-xs"
                    >
                      Añadir
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['Licencia 100% Oficial', 'Entrega Inmediata', 'Compatible con Windows 11', 'Garantía Total'].map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => agregarCaracteristicaAForm(sug)}
                        className="text-[10px] bg-slate-900 text-slate-400 hover:text-sky-300 border border-slate-800 px-2 py-0.5 rounded-lg"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={3}
                    value={productForm.descripcion}
                    onChange={(e) => handleProductInputChange('descripcion', e.target.value)}
                    className="w-full bg-slate-900 text-slate-200 border border-slate-800 rounded-xl p-2.5 text-xs outline-none"
                    placeholder="Descripción o lista de puntos..."
                  />
                </div>

                {/* Switch de Visibilidad Inicial en Formulario */}
                <div className="md:col-span-2 bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${
                      productForm.activo !== false 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {productForm.activo !== false ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                        <span>{productForm.activo !== false ? 'Producto Visible al Público' : 'Producto Oculto (Modo Gestión / Sin Stock)'}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                          productForm.activo !== false ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {productForm.activo !== false ? 'Público' : 'Oculto'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {productForm.activo !== false 
                          ? 'Los clientes podrán ver, buscar y agregar este producto al carrito.' 
                          : 'Oculto en la tienda para clientes. Ideal si estás gestionando stock o precios con tu proveedor.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProductForm(prev => ({ ...prev, activo: !prev.activo }))}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      productForm.activo !== false ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        productForm.activo !== false ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowProductForm(null)}
                    className="bg-slate-955 border border-slate-800 text-slate-400 text-xs px-4 py-2 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-sky-500 hover:bg-sky-400 text-slate-955 font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg active:scale-95"
                  >
                    Guardar Producto
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tabla de Productos con Margen de Ganancia */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-base font-bold text-slate-100 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="w-5 h-5 text-sky-400" />
                Catálogo de Productos ({productosFiltrados.length} {filterProductVisibility !== 'Todos' ? `• ${filterProductVisibility}` : ''})
              </span>
              <span className="text-xs text-slate-400 font-normal">
                Márgenes calculados en tiempo real • Control de Visibilidad Instantáneo
              </span>
            </h2>

            {loadingProductos ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
              </div>
            ) : productosFiltrados.length === 0 ? (
              <div className="text-center py-12 px-4 bg-slate-955/60 border border-slate-800 rounded-2xl max-w-lg mx-auto space-y-3">
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-full w-12 h-12 flex items-center justify-center mx-auto border border-amber-500/20">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-200">
                  {productos.length === 0 
                    ? 'No se pudieron cargar los productos del servidor.' 
                    : `No hay productos que coincidan con estos filtros.`}
                </h3>
                <p className="text-xs text-slate-400">
                  {productos.length === 0 
                    ? 'Verifica la conexión con el backend o intenta recargar.' 
                    : `Hay ${productos.length} productos en total registrados en tu base de datos (${productos.filter(p => p.activo !== false).length} visibles, ${productos.filter(p => p.activo === false).length} ocultos).`}
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  {productos.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => fetchProductos()}
                      className="bg-sky-500 hover:bg-sky-400 text-slate-955 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Reintentar Carga
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterProductCategory('Todos');
                        setFilterProductVisibility('Todos');
                        setSearchProductQuery('');
                      }}
                      className="bg-sky-500 hover:bg-sky-400 text-slate-955 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Restablecer Filtros (Mostrar los {productos.length} Productos)
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div 
                  ref={tableContainerRef}
                  onScroll={handleTableScroll}
                  className="overflow-x-auto rounded-2xl border border-slate-800 horizontal-table-scrollbar scroll-smooth"
                >
                <table className="min-w-full divide-y divide-slate-800 text-sm text-left">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] tracking-wider font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4">Producto</th>
                      <th className="px-6 py-4">Categoría</th>
                      <th className="px-6 py-4">Duración</th>
                      <th className="px-6 py-4">Precio Venta</th>
                      <th className="px-6 py-4">Costo Proveedor</th>
                      <th className="px-6 py-4">Margen de Ganancia</th>
                      <th className="px-6 py-4 text-center">Visibilidad Pública</th>
                      <th className="px-6 py-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                    {productosFiltrados.map((prod) => {
                      const id = prod.id || prod.productoId;
                      const venta = prod.precio || 0;
                      const costo = prod.costoProveedor || 0;
                      const margenSoles = venta - costo;
                      const margenPct = venta > 0 ? (margenSoles / venta) * 100 : 0;

                      return (
                        <tr key={id} className="hover:bg-slate-900/80 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                            <img 
                              src={formatImageUrl(prod.imagenUrl)} 
                              alt={prod.nombre} 
                              className="w-10 h-10 object-cover rounded-xl border border-slate-800"
                              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=300&q=80'; }}
                            />
                            <div>
                              <div className="font-bold text-slate-200 flex items-center gap-2">
                                <span>{prod.nombre}</span>
                                {prod.activo === false && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    Oculto
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 truncate max-w-xs">{prod.descripcion}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border bg-slate-950 text-slate-300 border-slate-800">
                              {prod.categoria}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-300 text-xs">
                            {prod.duracionMeses === 0 ? 'Permanente' : `${prod.duracionMeses} Meses`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-emerald-400 font-bold font-mono">
                            S/ {venta.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-rose-400 font-bold font-mono text-xs">
                            S/ {costo.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-lg ${
                              margenSoles >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400'
                            }`}>
                              +S/ {margenSoles.toFixed(2)} ({margenPct.toFixed(0)}%)
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleVisibilidad(id)}
                              disabled={togglingVisibilityId === id}
                              className={`group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm ${
                                prod.activo !== false
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-400'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-400'
                              } ${togglingVisibilityId === id ? 'opacity-50 cursor-wait' : 'cursor-pointer active:scale-95'}`}
                              title={prod.activo !== false ? 'Actualmente VISIBLE en tienda pública. Clic para ocultar en modo gestión.' : 'Actualmente OCULTO en modo borrador. Clic para hacer público a los clientes.'}
                            >
                              {/* Interruptor Switch Deslizable */}
                              <div className={`w-8 h-4.5 rounded-full transition-colors relative flex items-center p-0.5 ${
                                prod.activo !== false ? 'bg-emerald-500' : 'bg-slate-700'
                              }`}>
                                <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                                  prod.activo !== false ? 'translate-x-3.5' : 'translate-x-0'
                                }`} />
                              </div>

                              <span className="flex items-center gap-1 font-semibold">
                                {prod.activo !== false ? (
                                  <>
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Visible</span>
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5" />
                                    <span>Oculto</span>
                                  </>
                                )}
                              </span>
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleEditClick(prod)}
                                className="bg-slate-955 hover:bg-slate-800 border border-slate-800 text-sky-400 p-2 rounded-xl transition-all"
                                title="Editar Producto"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setProductoAEliminar(prod)}
                                className="bg-slate-955 hover:bg-slate-800 border border-slate-800 text-rose-500 p-2 rounded-xl transition-all"
                                title="Ocultar / Desactivar Producto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Barra de Desplazamiento Horizontal Sticky (Permanece visible abajo mientras scrolleas verticalmente) */}
              <div className="sticky bottom-3 z-30 mt-4 bg-slate-950/95 backdrop-blur-xl border border-sky-500/40 rounded-2xl p-3 sm:p-4 shadow-2xl shadow-black/90 space-y-2.5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  {/* Botón Izquierdo: Volver al inicio */}
                  <button
                    type="button"
                    onClick={() => scrollToSide('left')}
                    disabled={tableScrollMetrics.scrollLeft <= 5}
                    className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all ${
                      tableScrollMetrics.scrollLeft <= 5
                        ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed opacity-50'
                        : 'bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-700 hover:border-sky-500/50 cursor-pointer active:scale-95 shadow-sm'
                    }`}
                    title="Desplazar al inicio para ver detalles del producto"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>⬅️ Detalles del Producto</span>
                  </button>

                  {/* Indicador Central Informativo */}
                  <div className="flex items-center gap-2 text-slate-300 font-medium text-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[11px] sm:text-xs text-slate-300">
                      Desliza lateralmente para activar o desactivar el interruptor
                    </span>
                  </div>

                  {/* Botón Derecho: Ir directamente al Interruptor */}
                  <button
                    type="button"
                    onClick={() => scrollToSide('right')}
                    disabled={tableScrollMetrics.maxScroll > 0 && tableScrollMetrics.scrollLeft >= tableScrollMetrics.maxScroll - 5}
                    className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all ${
                      tableScrollMetrics.maxScroll > 0 && tableScrollMetrics.scrollLeft >= tableScrollMetrics.maxScroll - 5
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-not-allowed opacity-70'
                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 hover:border-emerald-400 shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95'
                    }`}
                    title="Desplazar a la derecha para ver y alternar el interruptor"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Interruptor de Visibilidad ➡️</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Controles de Desplazamiento Sincronizados (Pista de Scroll Nativo + Slider Rápido) */}
                <div className="pt-1 flex items-center gap-3">
                  <span className="text-[11px] uppercase font-bold text-sky-400 hidden md:inline whitespace-nowrap flex items-center gap-1">
                    <span>Deslizar:</span>
                  </span>
                  
                  {/* Pista de Scrollbar Nativo Sincronizado */}
                  <div
                    ref={stickyScrollRef}
                    onScroll={handleStickyTrackScroll}
                    className="flex-1 overflow-x-auto horizontal-table-scrollbar h-4 rounded-full bg-slate-900/90 border border-slate-800"
                    title="Arrastra esta barra horizontal para desplazarte"
                  >
                    <div style={{ width: `${Math.max(tableScrollMetrics.scrollWidth, 1400)}px`, height: '1px' }} />
                  </div>

                  {/* Slider Rápido de Rango */}
                  <input
                    type="range"
                    min={0}
                    max={tableScrollMetrics.maxScroll || 500}
                    value={tableScrollMetrics.scrollLeft || 0}
                    onChange={handleSliderScroll}
                    className="w-32 sm:w-48 accent-emerald-400 cursor-pointer"
                    title="Arrastra el control para deslizar lateralmente hacia el interruptor"
                  />
                </div>
              </div>
            </>
          )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* --- TAB: GESTIÓN DE PACKS & COMBOS PRO DE AHORRO --- */}
      {/* ========================================================================= */}
      {tab === 'combos' && (
        <div className="space-y-6">
          {/* Cabecera & Controles de Packs & Combos */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Flame className="w-5 h-5 animate-pulse" />
                </span>
                <h2 className="text-xl font-black text-slate-100">
                  Packs & Combos Pro de Ahorro
                </h2>
                <span className="text-xs bg-amber-500/20 text-amber-300 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  {combos.filter(c => c.activo).length} Activos en Tienda
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Configura paquetes con descuento para impulsar el ticket promedio y facilitar la compra en 1 solo clic.
              </p>
            </div>

            <button
              onClick={openAddCombo}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Crear Nuevo Pack
            </button>
          </div>

          {/* Barra de Filtros y Búsqueda de Combos */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Buscar pack o producto incluido..."
                value={searchComboQuery}
                onChange={(e) => setSearchComboQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <Search className="absolute left-3 top-2.5 text-slate-500 w-3.5 h-3.5" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Visibilidad:</span>
              {['Todos', 'Activos', 'Ocultos'].map((estado) => (
                <button
                  key={estado}
                  onClick={() => setFilterComboVisibility(estado)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterComboVisibility === estado
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {estado}
                </button>
              ))}
            </div>
          </div>

          {/* Modal Formulario para Crear / Editar Combo */}
          {showComboForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
              <div className="bg-[#0f172a] border border-amber-500/30 rounded-3xl shadow-2xl max-w-2xl w-full p-6 md:p-8 relative my-8">
                <button
                  type="button"
                  onClick={() => setShowComboForm(null)}
                  className="absolute top-6 right-6 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 mb-6">
                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Flame className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-black text-slate-100">
                      {showComboForm === 'edit' ? 'Editar Pack de Ahorro' : 'Crear Nuevo Pack de Ahorro'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Define el nombre, precios y selecciona qué licencias se añadirán al carrito juntas.
                    </p>
                  </div>
                </div>

                <form onSubmit={submitComboForm} className="space-y-4 text-xs">
                  {/* Nombre y Subtítulo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Nombre del Combo *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: 🔥 Combo Formateo PC Master"
                        value={comboForm.nombre}
                        onChange={(e) => setComboForm({ ...comboForm, nombre: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Subtítulo / Gancho Comercial</label>
                      <input
                        type="text"
                        placeholder="Ej: Windows 11 Pro + Office 2024 Pro Plus + ESET"
                        value={comboForm.subtitulo}
                        onChange={(e) => setComboForm({ ...comboForm, subtitulo: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Descripción Atractiva *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Explica qué problema soluciona este pack y por qué conviene llevarlo junto..."
                      value={comboForm.descripcion}
                      onChange={(e) => setComboForm({ ...comboForm, descripcion: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Precios y Ahorro */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-955 p-4 rounded-2xl border border-slate-800">
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Precio Original (S/) *</label>
                      <input
                        type="number"
                        step="0.10"
                        min="0"
                        required
                        placeholder="114.80"
                        value={comboForm.precioOriginal}
                        onChange={(e) => handlePrecioChange('precioOriginal', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 font-mono font-bold outline-none focus:border-amber-500"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Suma sin descuento</span>
                    </div>

                    <div>
                      <label className="font-bold text-emerald-400 block mb-1">Precio Combo Oferta (S/) *</label>
                      <input
                        type="number"
                        step="0.10"
                        min="0"
                        required
                        placeholder="89.90"
                        value={comboForm.precioCombo}
                        onChange={(e) => handlePrecioChange('precioCombo', e.target.value)}
                        className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl p-2.5 text-emerald-300 font-mono font-bold outline-none focus:border-emerald-400"
                      />
                      <span className="text-[10px] text-emerald-500/80 mt-0.5 block">Precio final que paga</span>
                    </div>

                    <div>
                      <label className="font-bold text-amber-400 block mb-1">Ahorro Visible (S/)</label>
                      <input
                        type="number"
                        step="0.10"
                        min="0"
                        placeholder="24.90"
                        value={comboForm.ahorro}
                        onChange={(e) => setComboForm({ ...comboForm, ahorro: e.target.value })}
                        className="w-full bg-slate-900 border border-amber-500/40 rounded-xl p-2.5 text-amber-300 font-mono font-bold outline-none focus:border-amber-400"
                      />
                      <span className="text-[10px] text-amber-500/80 mt-0.5 block">Calculado automáticamente</span>
                    </div>
                  </div>

                  {/* Badge y Orden Visual */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Badge / Etiqueta Visual</label>
                      <input
                        type="text"
                        placeholder="Ej: Más Vendido para Técnicos, Ahorro del 25%"
                        value={comboForm.badge}
                        onChange={(e) => setComboForm({ ...comboForm, badge: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Orden de Posición (1 = Primero)</label>
                      <input
                        type="number"
                        min="0"
                        value={comboForm.ordenVisual}
                        onChange={(e) => setComboForm({ ...comboForm, ordenVisual: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Selector Interactivo de Productos Incluidos */}
                  <div className="bg-slate-955 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-200">
                        Productos Incluidos en este Pack ({comboForm.items.length}) *
                      </label>
                      <span className="text-[10px] text-slate-400">
                        Al comprar el combo se añadirán estos productos al carrito
                      </span>
                    </div>

                    {/* Pills de productos ya agregados */}
                    <div className="flex flex-wrap gap-2 min-h-[36px] p-2 bg-slate-900 rounded-xl border border-slate-800">
                      {comboForm.items.length === 0 ? (
                        <span className="text-slate-500 text-xs italic">
                          No has añadido productos aún. Haz clic abajo en el catálogo o escribe uno manual.
                        </span>
                      ) : (
                        comboForm.items.map((item, idx) => (
                          <span
                            key={idx}
                            className="bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            <span>{item}</span>
                            <button
                              type="button"
                              onClick={() => setComboForm({
                                ...comboForm,
                                items: comboForm.items.filter((_, i) => i !== idx)
                              })}
                              className="text-amber-400 hover:text-rose-400 ml-1 font-bold"
                            >
                              ✕
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    {/* Selector Rápido desde Catálogo de Productos */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Selección Rápida desde Catálogo Activo:
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-900/60 rounded-xl border border-slate-800 scrollbar-thin">
                        {productos.filter(p => p.activo !== false).map((prod) => {
                          const isSelected = comboForm.items.some(it => it.toLowerCase() === prod.nombre.toLowerCase());
                          return (
                            <button
                              key={prod.id}
                              type="button"
                              onClick={() => handleToggleProductInCombo(prod.nombre)}
                              className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-amber-500 text-slate-955 font-bold shadow-sm'
                                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60'
                              }`}
                            >
                              <span>{isSelected ? '✓' : '+'}</span>
                              <span>{prod.nombre}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Agregar ítem manual o personalizado */}
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="O escribe el nombre de otro software o servicio..."
                        value={nuevoItemTexto}
                        onChange={(e) => setNuevoItemTexto(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomItem();
                          }
                        }}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomItem}
                        className="bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold px-4 py-2 rounded-xl transition-all"
                      >
                        Añadir
                      </button>
                    </div>
                  </div>

                  {/* Interruptor de Visibilidad */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-955 rounded-2xl border border-slate-800">
                    <div>
                      <span className="font-bold text-slate-200 block">
                        Visible en Tienda Pública
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {comboForm.activo ? 'Se muestra de inmediato a los clientes en el catálogo.' : 'Oculto en borrador, los clientes no podrán verlo.'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setComboForm({ ...comboForm, activo: !comboForm.activo })}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        comboForm.activo ? 'bg-emerald-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          comboForm.activo ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowComboForm(null)}
                      className="bg-slate-955 border border-slate-800 text-slate-400 text-xs px-4 py-2 rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-955 font-black text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 active:scale-95"
                    >
                      {showComboForm === 'edit' ? 'Guardar Cambios' : 'Crear Pack'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Grid de Cards de Combos */}
          {loadingCombos ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
            </div>
          ) : combosFiltrados.length === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-full w-12 h-12 flex items-center justify-center mx-auto border border-amber-500/20">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">
                {combos.length === 0 ? 'No hay combos registrados todavía.' : 'No hay combos con este filtro de búsqueda.'}
              </h3>
              <p className="text-xs text-slate-400">
                Crea tu primer pack promocional para aumentar tus ventas.
              </p>
              {combos.length === 0 && (
                <button
                  onClick={openAddCombo}
                  className="bg-amber-500 text-slate-955 font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 transition-all shadow-md active:scale-95 mt-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Crear Primer Pack
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {combosFiltrados.map((combo) => (
                <div
                  key={combo.id}
                  className={`bg-slate-900 border rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all duration-300 relative overflow-hidden group hover:-translate-y-1 ${
                    combo.activo
                      ? 'border-slate-800 hover:border-amber-500/40'
                      : 'border-slate-800/60 opacity-70 bg-slate-955/60'
                  }`}
                >
                  {/* Etiqueta de Ahorro superior */}
                  <div className="absolute top-0 right-0 bg-amber-500/10 border-l border-b border-amber-500/30 text-amber-400 text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                    Ahorro S/ {Number(combo.ahorro || (combo.precioOriginal - combo.precioCombo) || 0).toFixed(2)}
                  </div>

                  <div>
                    {/* Header: Estado & Badge */}
                    <div className="flex items-center gap-2 mb-2 pr-28">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                        combo.activo
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {combo.activo ? 'En Tienda' : 'Oculto'}
                      </span>
                      {combo.badge && (
                        <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest truncate">
                          {combo.badge}
                        </span>
                      )}
                    </div>

                    {/* Nombre y Subtítulo */}
                    <h3 className="text-base font-black text-slate-100 group-hover:text-amber-300 transition-colors">
                      {combo.nombre}
                    </h3>
                    {combo.subtitulo && (
                      <p className="text-xs text-amber-400/90 font-medium mt-1">
                        {combo.subtitulo}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-2 mb-4 leading-relaxed line-clamp-2">
                      {combo.descripcion}
                    </p>

                    {/* Lista de Productos Incluidos */}
                    <div className="space-y-1.5 mb-5 bg-slate-955 p-3.5 rounded-2xl border border-slate-850">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        Incluye {(combo.items || []).length} Licencias:
                      </span>
                      {(combo.items || []).map((it, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span className="truncate">{it}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Precios & Acciones */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 line-through block">
                        Antes S/ {Number(combo.precioOriginal || 0).toFixed(2)}
                      </span>
                      <span className="text-xl font-black text-emerald-400 font-mono">
                        S/ {Number(combo.precioCombo || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Switch de visibilidad rápida */}
                      <button
                        type="button"
                        onClick={() => handleToggleComboVisibility(combo)}
                        disabled={togglingComboId === combo.id}
                        className={`p-2 rounded-xl border transition-all ${
                          combo.activo
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                        }`}
                        title={combo.activo ? 'Ocultar combo de la tienda' : 'Mostrar combo en la tienda'}
                      >
                        {togglingComboId === combo.id ? (
                          <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        ) : combo.activo ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>

                      {/* Editar */}
                      <button
                        type="button"
                        onClick={() => openEditCombo(combo)}
                        className="bg-slate-800 hover:bg-slate-750 border border-slate-700 text-sky-400 p-2 rounded-xl transition-all"
                        title="Editar Pack"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Eliminar */}
                      <button
                        type="button"
                        onClick={() => setComboAEliminar(combo)}
                        className="bg-slate-800 hover:bg-slate-750 border border-slate-700 text-rose-400 p-2 rounded-xl transition-all"
                        title="Eliminar Pack"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Confirmación de Eliminación de Combo */}
      {comboAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 relative">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Eliminar Pack de Ahorro
            </h3>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              ¿Está seguro de que desea eliminar permanentemente el pack <span className="text-white font-bold">"{comboAEliminar.nombre}"</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setComboAEliminar(null)}
                className="bg-slate-955 border border-slate-800 text-slate-400 text-xs px-4 py-2 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = comboAEliminar.id;
                  await eliminarCombo(id);
                  setComboAEliminar(null);
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all active:scale-95"
              >
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* --- TAB 3: GESTIÓN DE CLIENTES & RETENCIÓN --- */}
      {/* ========================================================================= */}
      {tab === 'clientes' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Buscar cliente por nombre o correo..."
                value={searchClienteQuery}
                onChange={(e) => setSearchClienteQuery(e.target.value)}
                className="w-full bg-slate-950 text-white border border-slate-800 focus:border-sky-500 rounded-xl pl-10 pr-4 py-2 text-xs outline-none"
              />
              <Search className="absolute left-3.5 top-2.5 text-slate-500 w-4 h-4" />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={openAddCliente}
                className="bg-sky-500 hover:bg-sky-400 text-slate-955 font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Registrar Cliente
              </button>
            </div>
          </div>

          {/* Formulario Cliente */}
          {showClienteForm && (
            <div className="bg-slate-900 border border-sky-500/30 rounded-3xl p-6 shadow-2xl relative">
              <button
                onClick={() => setShowClienteForm(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-400" />
                {showClienteForm === 'create' ? 'Registrar Nuevo Cliente' : 'Editar Datos del Cliente'}
              </h3>

              <form onSubmit={submitClienteForm} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={clienteForm.nombre}
                    onChange={(e) => setClienteForm({ ...clienteForm, nombre: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={clienteForm.email}
                    onChange={(e) => setClienteForm({ ...clienteForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">WhatsApp / Teléfono</label>
                  <input
                    type="text"
                    required
                    value={clienteForm.telefono}
                    onChange={(e) => setClienteForm({ ...clienteForm, telefono: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">DNI (Opcional)</label>
                  <input
                    type="text"
                    value={clienteForm.dni}
                    onChange={(e) => setClienteForm({ ...clienteForm, dni: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                  />
                </div>
                {showClienteForm === 'create' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Contraseña Inicial</label>
                    <input
                      type="password"
                      required
                      value={clienteForm.passwordInicial}
                      onChange={(e) => setClienteForm({ ...clienteForm, passwordInicial: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Asignar Nueva Contraseña (Opcional)</label>
                    <input
                      type="password"
                      placeholder="Dejar en blanco para mantener la actual"
                      value={clienteForm.asignarNuevaContrasena}
                      onChange={(e) => setClienteForm({ ...clienteForm, asignarNuevaContrasena: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                    />
                  </div>
                )}

                <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowClienteForm(null)}
                    className="bg-slate-955 border border-slate-800 text-slate-400 text-xs px-4 py-2 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-sky-500 hover:bg-sky-400 text-slate-955 font-bold text-xs px-5 py-2 rounded-xl"
                  >
                    Guardar Cliente
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tabla de Clientes */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-base font-bold text-slate-100 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-400" />
                Base de Datos de Clientes ({clientes.length} Registrados)
              </span>
            </h2>

            {loadingClientes ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="min-w-full divide-y divide-slate-800 text-sm text-left">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] tracking-wider font-semibold">
                    <tr>
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">WhatsApp</th>
                      <th className="px-6 py-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                    {clientes
                      .filter(c => 
                        (c.nombre || '').toLowerCase().includes(searchClienteQuery.toLowerCase()) ||
                        (c.email || '').toLowerCase().includes(searchClienteQuery.toLowerCase())
                      )
                      .map((c) => (
                        <tr key={c.id} className="hover:bg-slate-900/80 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-200">
                            {c.nombre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-xs">
                            {c.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <a 
                              href={`https://api.whatsapp.com/send?phone=${c.telefono || c.whatsApp}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:underline font-mono text-xs"
                            >
                              📱 {c.telefono || c.whatsApp || 'Sin número'}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => fetchClienteHistory(c)}
                                className="bg-slate-955 hover:bg-slate-800 border border-slate-800 text-sky-400 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1"
                                title="Ver Historial de Licencias"
                              >
                                <Key className="w-3.5 h-3.5" />
                                Licencias
                              </button>
                              <button
                                onClick={() => openEditCliente(c)}
                                className="bg-slate-955 hover:bg-slate-800 border border-slate-800 text-slate-300 p-2 rounded-xl"
                                title="Editar Datos"
                              >
                                <Edit3 className="w-4 h-4" />
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

          {/* Modal Historial de Licencias del Cliente */}
          {selectedCliente && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-[#0f172a] border border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative space-y-4">
                <button
                  onClick={() => setSelectedCliente(null)}
                  className="absolute top-6 right-6 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Key className="w-5 h-5 text-sky-400" />
                  Historial de Licencias de {selectedCliente.nombre}
                </h3>

                {loadingHistory ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
                  </div>
                ) : clienteHistory.length === 0 ? (
                  <p className="text-slate-500 text-xs text-center py-6">El cliente no registra licencias activadas.</p>
                ) : (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {clienteHistory.map((lic, idx) => (
                      <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                        <div>
                          <strong className="text-slate-200 block">{lic.productoNombre}</strong>
                          <span className="text-slate-400 font-mono text-[11px]">Clave: {lic.clave || 'No asignada'}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          lic.expirado ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {lic.expirado ? 'Vencida' : 'Activa'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* --- TAB 4: MARKETING DIGITAL & CUPONES DE DESCUENTO --- */}
      {/* ========================================================================= */}
      {tab === 'cupones' && (
        <div className="space-y-8">
          
          {/* MÓDULO INNOVADOR: GENERADOR DE CAMPAÑAS DE MARKETING DIGITAL POR WHATSAPP */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
                  Módulo de Crecimiento & Marketing Digital
                </span>
                <h2 className="text-xl font-black text-slate-100 mt-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  Generador de Campañas & Copywriting para WhatsApp / Redes
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Redacta copies de alta conversión con cupones integrados para retención, venta cruzada o reactivación.
                </p>
              </div>
            </div>

            {/* Controles de la Campaña */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Objetivo de la Campaña</label>
                <select
                  value={campaignType}
                  onChange={(e) => setCampaignType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 outline-none focus:border-indigo-400"
                >
                  <option value="renovacion">1. Retención: Renovación de Suscripciones</option>
                  <option value="lanzamiento">2. Venta Cruzada: Lanzamiento de Productos</option>
                  <option value="recuperacion">3. Reactivación: Clientes Inactivos VIP</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Cupón Vinculado a la Campaña</label>
                <select
                  value={selectedMarketingCoupon}
                  onChange={(e) => setSelectedMarketingCoupon(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 outline-none focus:border-indigo-400 font-mono font-bold"
                >
                  {cupones.filter(c => c.activo).map((c) => (
                    <option key={c.id} value={c.codigo}>
                      {c.codigo} ({c.esPorcentaje ? `${c.porcentajeDescuento}%` : `S/ ${c.montoDescuentoFijo}`})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleCopiarMensajeCampana}
                  className="w-full bg-indigo-500 hover:bg-indigo-400 text-slate-955 font-bold p-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                >
                  {copiedMarketing ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
                  {copiedMarketing ? '¡Mensaje Copiado!' : 'Copiar Plantilla de Difusión'}
                </button>
              </div>
            </div>

            {/* Vista Previa del Copy Marketing */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                Vista previa del Copy optimizado para WhatsApp:
              </span>
              <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed select-all">
                {mensajeCampanaMarketing}
              </pre>
            </div>
          </div>

          {/* Formulario de Creación de Cupones */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Tag className="w-5 h-5 text-cyan-400" />
              Crear Nuevo Código Promocional
            </h2>

            <form onSubmit={submitCuponForm} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Código</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. VIP2026"
                  value={cuponForm.codigo}
                  onChange={(e) => setCuponForm({ ...cuponForm, codigo: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white uppercase font-mono font-bold outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Tipo</label>
                <select
                  value={cuponForm.esPorcentaje ? 'porcentaje' : 'fijo'}
                  onChange={(e) => setCuponForm({ ...cuponForm, esPorcentaje: e.target.value === 'porcentaje' })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-cyan-400"
                >
                  <option value="porcentaje">Porcentaje (%)</option>
                  <option value="fijo">Monto Fijo (S/)</option>
                </select>
              </div>

              {cuponForm.esPorcentaje ? (
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Descuento (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={cuponForm.porcentajeDescuento}
                    onChange={(e) => setCuponForm({ ...cuponForm, porcentajeDescuento: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Descuento (S/)</label>
                  <input
                    type="number"
                    step="0.50"
                    min="1"
                    required
                    value={cuponForm.montoDescuentoFijo}
                    onChange={(e) => setCuponForm({ ...cuponForm, montoDescuentoFijo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Usos Máximos</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={cuponForm.usosMaximos}
                  onChange={(e) => setCuponForm({ ...cuponForm, usosMaximos: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-955 font-bold p-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Activar Cupón
                </button>
              </div>
            </form>
          </div>

          {/* Tabla de Cupones con Analítica de Usos */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-cyan-400" />
              Cupones Activos & Rendimiento de Campañas ({cupones.length})
            </h2>

            {loadingCupones ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
              </div>
            ) : cupones.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">No hay cupones creados aún.</div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="min-w-full divide-y divide-slate-800 text-sm text-left">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] tracking-wider font-semibold">
                    <tr>
                      <th className="px-6 py-4">Código</th>
                      <th className="px-6 py-4">Descuento</th>
                      <th className="px-6 py-4">Uso / Capacidad</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                    {cupones.map((c) => {
                      const porcentajeUso = c.usosMaximos > 0 ? (c.usosActuales / c.usosMaximos) * 100 : 0;
                      return (
                        <tr key={c.id} className="hover:bg-slate-900/80 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-sky-400">
                            {c.codigo}
                          </td>
                          <td className="px-6 py-4 font-bold text-emerald-400 font-mono">
                            {c.esPorcentaje ? `${c.porcentajeDescuento}%` : `S/ ${c.montoDescuentoFijo.toFixed(2)}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <span className="text-xs text-slate-300 font-mono">
                                {c.usosActuales} / {c.usosMaximos} canjes
                              </span>
                              <div className="w-28 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                                <div 
                                  className="h-full bg-cyan-400 rounded-full" 
                                  style={{ width: `${Math.min(100, porcentajeUso)}%` }} 
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              c.activo ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {c.activo ? 'Activo' : 'Pausado'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleToggleCuponEstado(c.id)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                                c.activo 
                                  ? 'bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20' 
                                  : 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-955 border border-emerald-500/20'
                              }`}
                            >
                              {c.activo ? 'Desactivar' : 'Reactivar'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* --- TAB 5: REPORTES FINANCIEROS & MÉTRICAS --- */}
      {/* ========================================================================= */}
      {tab === 'reportes' && (
        <div className="space-y-8">
          {loadingReportes ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
            </div>
          ) : !reportes ? (
            <div className="text-center py-12 text-slate-500 text-sm bg-slate-900 border border-slate-800 rounded-3xl">
              Error al compilar reporte financiero consolidado.
            </div>
          ) : (
            <>
              {/* Tarjetas de Resumen Financiero */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                <div className="bg-gradient-to-r from-rose-600 to-red-700 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between h-40">
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
                <h2 className="text-base font-bold text-slate-100 pb-3 border-b border-slate-800 flex items-center gap-2">
                  <Package className="w-5 h-5 text-sky-400" />
                  Distribución de Ventas por Categoría de Producto
                </h2>

                {reportes.licenciasPorCategoria.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-6">Aún no se han despachado licencias en el sistema.</p>
                ) : (
                  <div className="space-y-4">
                    {reportes.licenciasPorCategoria.map((cat, index) => {
                      const total = reportes.licenciasPorCategoria.reduce((sum, item) => sum + item.cantidad, 0);
                      const porcentaje = total > 0 ? (cat.cantidad / total) * 100 : 0;
                      
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-xs font-bold text-slate-300">
                            <span>{cat.categoria}</span>
                            <span>{cat.cantidad} licencias ({porcentaje.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
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

      {/* ========================================================================= */}
      {/* --- TAB 6: TRÁFICO WEB EN VIVO Y ANALÍTICA EN TIEMPO REAL --- */}
      {/* ========================================================================= */}
      {tab === 'visitas' && (
        <div className="space-y-6 animate-fade-in">
          {/* Cabecera Interactiva y Controles de Radar */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/40 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </div>
                <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  Tráfico Web y Analítica en Vivo
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Monitoreo activo de visitantes, páginas vistas, dispositivos y sesiones conectadas en tiempo real.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Botón de Auto-actualizar Toggle */}
              <button
                type="button"
                onClick={() => setAutoRefreshVisitas(!autoRefreshVisitas)}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition-all flex items-center gap-2 ${
                  autoRefreshVisitas 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Radio className={`w-3.5 h-3.5 ${autoRefreshVisitas ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                {autoRefreshVisitas ? 'Auto-refresco 15s: Activo' : 'Auto-refresco: Pausado'}
              </button>

              {/* Botón Refrescar Manual */}
              <button
                type="button"
                onClick={() => fetchVisitas()}
                disabled={loadingVisitas}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-sky-500/20 active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingVisitas ? 'animate-spin' : ''}`} />
                Actualizar
              </button>

              {ultimaActualizacionVisitas && (
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  Sincronizado: {ultimaActualizacionVisitas.toLocaleTimeString('es-PE')}
                </span>
              )}
            </div>
          </div>

          {/* 4 KPIs Clave */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: En Línea Ahora */}
            <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">En Línea Ahora</span>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
              <div className="text-3xl font-black text-emerald-400">
                {visitasData?.enLineaAhora ?? 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                Activos en los últimos 10 min
              </p>
            </div>

            {/* KPI 2: Visitas Hoy */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-sky-500/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Visitas Hoy</span>
                <Eye className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-3xl font-black text-slate-100">
                {visitasData?.visitasHoy ?? 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-sky-400" />
                Páginas vistas desde medianoche
              </p>
            </div>

            {/* KPI 3: Visitantes Únicos */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-indigo-500/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Visitantes Únicos</span>
                <Users className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-3xl font-black text-slate-100">
                {visitasData?.visitantesUnicos ?? 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-indigo-400" />
                Sesiones únicas registradas
              </p>
            </div>

            {/* KPI 4: Total Histórico */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Histórico</span>
                <Globe className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-black text-slate-100">
                {visitasData?.totalVisitas ?? 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Interacciones globales
              </p>
            </div>
          </div>

          {/* Gráficas / Desgloses Secundarios */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Top Páginas Más Vistas */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-sky-400" />
                  Páginas Más Populares
                </h3>
                <span className="text-[10px] text-slate-500 font-bold uppercase">Top 10</span>
              </div>

              <div className="space-y-3">
                {(!visitasData?.paginasMasVistas || visitasData.paginasMasVistas.length === 0) ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">Sin datos de navegación aún.</p>
                ) : (
                  (() => {
                    const maxVisitas = Math.max(...visitasData.paginasMasVistas.map(p => p.total), 1);
                    return visitasData.paginasMasVistas.map((item, idx) => {
                      const pct = Math.round((item.total / maxVisitas) * 100);
                      const etiqueta = item.ruta === '/' ? 'Inicio / Catálogo' : item.ruta;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-300 truncate max-w-[200px]" title={item.ruta}>
                              {etiqueta}
                            </span>
                            <span className="font-bold text-sky-400">{item.total} {item.total === 1 ? 'vista' : 'vistas'}</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            </div>

            {/* 2. Dispositivos */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  Dispositivos de Entrada
                </h3>
                <span className="text-[10px] text-slate-500 font-bold uppercase">Distribución</span>
              </div>

              <div className="space-y-3">
                {(!visitasData?.porDispositivo || visitasData.porDispositivo.length === 0) ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">Esperando visitas...</p>
                ) : (
                  (() => {
                    const totalDisp = visitasData.porDispositivo.reduce((s, d) => s + d.total, 0) || 1;
                    return visitasData.porDispositivo.map((item, idx) => {
                      const pct = Math.round((item.total / totalDisp) * 100);
                      const isMovil = item.dispositivo?.toLowerCase().includes('móvil') || item.dispositivo?.toLowerCase().includes('movil');
                      const isTablet = item.dispositivo?.toLowerCase().includes('tablet');
                      const IconDisp = isTablet ? Tablet : (isMovil ? Smartphone : Monitor);

                      return (
                        <div key={idx} className="bg-slate-955 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-slate-800 p-2 rounded-xl text-emerald-400">
                              <IconDisp className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-200">{item.dispositivo}</p>
                              <p className="text-[10px] text-slate-400">{item.total} sesiones ({pct}%)</p>
                            </div>
                          </div>
                          <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                            {pct}%
                          </span>
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            </div>

            {/* 3. Fuentes / Canales de Tráfico */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-indigo-400" />
                  Fuentes de Tráfico
                </h3>
                <span className="text-[10px] text-slate-500 font-bold uppercase">Referrers</span>
              </div>

              <div className="space-y-3">
                {(!visitasData?.porOrigen || visitasData.porOrigen.length === 0) ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">Sin orígenes registrados.</p>
                ) : (
                  (() => {
                    const totalOrig = visitasData.porOrigen.reduce((s, o) => s + o.total, 0) || 1;
                    return visitasData.porOrigen.map((item, idx) => {
                      const pct = Math.round((item.total / totalOrig) * 100);
                      const esWhatsApp = item.origen?.toLowerCase().includes('whatsapp');
                      const esGoogle = item.origen?.toLowerCase().includes('google');

                      return (
                        <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-955 border border-slate-800">
                          <div className="flex items-center gap-2 truncate">
                            <span className={`w-2 h-2 rounded-full ${esWhatsApp ? 'bg-emerald-400' : esGoogle ? 'bg-sky-400' : 'bg-slate-500'}`}></span>
                            <span className="font-semibold text-slate-200 truncate">{item.origen}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-medium">{item.total}</span>
                            <span className="text-[10px] text-indigo-300 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">{pct}%</span>
                          </div>
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            </div>
          </div>

          {/* Recuperación de Carritos Abandonados */}
          {visitasData?.carritosAbandonados && visitasData.carritosAbandonados.length > 0 && (
            <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-xl space-y-4 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500/15 text-amber-400 p-2.5 rounded-2xl border border-amber-500/30">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                      Carritos Sin Finalizar ({visitasData.carritosAbandonados.length})
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Visitantes que exploraron el carrito en las últimas 24 horas sin completar su pedido.
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-400">
                  <span className="text-amber-400 font-bold">Oportunidad de Retargeting:</span> Ofrece un cupón por WhatsApp.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {visitasData.carritosAbandonados.slice(0, 6).map((cart, idx) => {
                  const tieneCliente = !!cart.usuarioNombre;
                  const mensajeWhatsapp = encodeURIComponent(
                    `¡Hola ${cart.usuarioNombre || 'amigo(a)'}! Notamos que estuviste revisando tu carrito en Informatics Store.\n\n` +
                    `Queremos que disfrutes tu software favorito, por eso te dejamos este cupón de descuento especial: *DESCUENTO10*.\n\n` +
                    `Completa tu pedido aquí: https://informatics.pe/carrito\n¿Tienes alguna duda con el pago?`
                  );

                  return (
                    <div key={idx} className="bg-slate-955 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3 hover:border-amber-500/40 transition-colors">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-bold text-slate-200">
                            {tieneCliente ? cart.usuarioNombre : `Anónimo (${cart.sessionId ? cart.sessionId.slice(-6) : 'N/A'})`}
                          </span>
                          <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            {formatearTiempoTranscurrido(cart.fecha)}
                          </span>
                        </div>
                        {cart.usuarioEmail && (
                          <p className="text-[11px] text-slate-400 truncate mb-1">{cart.usuarioEmail}</p>
                        )}
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {cart.totalVisitas} {cart.totalVisitas === 1 ? 'visita al carrito' : 'visitas al carrito'} · {cart.dispositivo}
                        </p>
                      </div>

                      {tieneCliente ? (
                        <a
                          href={`https://api.whatsapp.com/send?text=${mensajeWhatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold py-1.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Recuperar por WhatsApp
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic text-center py-1">
                          Visitante no autenticado
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Registro de Actividad en Vivo (Feed de Últimas Visitas) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  Bitácora de Navegación en Tiempo Real
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Últimos 50 movimientos registrados en la plataforma.
                </p>
              </div>

              {/* Filtros rápidos y buscador */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-grow sm:flex-grow-0">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filtrar por ruta o usuario..."
                    value={searchVisitaQuery}
                    onChange={(e) => setSearchVisitaQuery(e.target.value)}
                    className="bg-slate-955 border border-slate-800 text-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-xl focus:border-sky-500 outline-none w-full sm:w-48"
                  />
                </div>

                <div className="flex items-center bg-slate-955 border border-slate-800 rounded-xl p-0.5 text-xs">
                  <button
                    onClick={() => setFiltroTipoVisita('todos')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      filtroTipoVisita === 'todos' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setFiltroTipoVisita('online')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                      filtroTipoVisita === 'online' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    En Línea
                  </button>
                  <button
                    onClick={() => setFiltroTipoVisita('usuarios')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      filtroTipoVisita === 'usuarios' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Clientes
                  </button>
                </div>
              </div>
            </div>

            {/* Tabla de Visitas */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Usuario / Visitante</th>
                    <th className="py-3 px-4">Ruta / Página</th>
                    <th className="py-3 px-4">Dispositivo & SO</th>
                    <th className="py-3 px-4">Origen</th>
                    <th className="py-3 px-4 text-right">Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {(() => {
                    const ultimas = visitasData?.ultimasVisitas || [];
                    const filtradas = ultimas.filter(v => {
                      if (filtroTipoVisita === 'online' && !v.enLinea) return false;
                      if (filtroTipoVisita === 'usuarios' && !v.usuarioNombre) return false;
                      if (searchVisitaQuery) {
                        const q = searchVisitaQuery.toLowerCase();
                        const matchRuta = v.ruta?.toLowerCase().includes(q);
                        const matchUser = v.usuarioNombre?.toLowerCase().includes(q) || v.usuarioEmail?.toLowerCase().includes(q);
                        const matchDisp = v.dispositivo?.toLowerCase().includes(q) || v.navegador?.toLowerCase().includes(q);
                        if (!matchRuta && !matchUser && !matchDisp) return false;
                      }
                      return true;
                    });

                    if (filtradas.length === 0) {
                      return (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-500 italic">
                            No se encontraron registros que coincidan con los filtros aplicados.
                          </td>
                        </tr>
                      );
                    }

                    return filtradas.map((visita) => (
                      <tr key={visita.id} className="hover:bg-slate-800/40 transition-colors">
                        {/* Estado */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {visita.enLinea ? (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              En Línea
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-semibold bg-slate-800 px-2 py-0.5 rounded-full">
                              {formatearTiempoTranscurrido(visita.fechaCreacion)}
                            </span>
                          )}
                        </td>

                        {/* Usuario */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {visita.usuarioNombre ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-[10px]">
                                {visita.usuarioNombre.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-200">{visita.usuarioNombre}</p>
                                <p className="text-[10px] text-slate-400">{visita.usuarioEmail}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Users className="w-3.5 h-3.5 text-slate-500" />
                              <span className="font-mono text-[11px]">Anónimo ({visita.sessionId ? visita.sessionId.slice(-6) : 'N/A'})</span>
                            </div>
                          )}
                        </td>

                        {/* Ruta */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20 text-[11px]">
                              {visita.ruta}
                            </span>
                            {visita.tituloPagina && visita.tituloPagina !== 'Informatics Store' && (
                              <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                                {visita.tituloPagina}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Dispositivo & Navegador */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="text-slate-300 flex items-center gap-1.5 text-[11px]">
                            <span className="font-semibold">{visita.dispositivo}</span>
                            <span className="text-slate-600">·</span>
                            <span className="text-slate-400">{visita.sistemaOperativo}</span>
                            <span className="text-slate-600">·</span>
                            <span className="text-slate-400">{visita.navegador}</span>
                          </div>
                        </td>

                        {/* Origen */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            visita.referrer?.toLowerCase().includes('whatsapp')
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : visita.referrer?.toLowerCase().includes('google')
                              ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {visita.referrer || 'Directo'}
                          </span>
                        </td>

                        {/* Hora */}
                        <td className="py-3 px-4 text-right whitespace-nowrap text-slate-400 text-[11px]">
                          {visita.fechaCreacion ? new Date(visita.fechaCreacion).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A'}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación de Producto */}
      {productoAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 relative">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Confirmar Desactivación
            </h3>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              ¿Está seguro de que desea retirar del catálogo el producto <span className="text-white font-bold">"{productoAEliminar.nombre}"</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setProductoAEliminar(null)}
                className="bg-slate-955 border border-slate-800 text-slate-400 text-xs px-4 py-2 rounded-xl transition-all"
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
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all active:scale-95"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
