import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { FileText, Key, Calendar, AlertTriangle, CheckSquare, RefreshCw, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { API_URL } from '../services/api';

export default function AdminPanel() {
  const { user } = useCart();
  const [ordenes, setOrdenes] = useState([]);
  const [renovaciones, setRenovaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrden, setSelectedOrden] = useState(null);
  const [clavesForm, setClavesForm] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const modalRef = useRef(null);

  useEffect(() => {
    if (!user || user.rol !== 'Administrador') return;
    fetchAdminData();
  }, [user]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Obtener órdenes de la API
      const resOrdenes = await fetch(`${API_URL}/api/admin/ordenes`);
      if (resOrdenes.ok) {
        const dataOrd = await resOrdenes.json();
        setOrdenes(dataOrd);
      }

      // Obtener alertas de renovación en exactamente 5 días
      const resRenovaciones = await fetch(`${API_URL}/api/admin/renovaciones`);
      if (resRenovaciones.ok) {
        const dataRen = await resRenovaciones.json();
        setRenovaciones(dataRen);
      }
    } catch (e) {
      console.error("Error al obtener datos administrativos:", e);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.rol !== 'Administrador') {
    return <Navigate to="/" replace />;
  }

  const openCompletarModal = (orden) => {
    setSelectedOrden(orden);
    // Inicializar inputs de claves vacíos o placeholders
    const inicial = {};
    orden.detalles.forEach(d => {
      inicial[d.id] = '';
    });
    setClavesForm(inicial);
    setIsModalOpen(true);
  };

  const handleClaveChange = (detalleId, valor) => {
    setClavesForm(prev => ({
      ...prev,
      [detalleId]: valor
    }));
  };

  const submitCompletarOrden = async (e) => {
    e.preventDefault();
    if (!selectedOrden) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/ordenes/${selectedOrden.id}/completar`, {
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
      
      // Cerrar modal de forma segura
      if (modalRef.current || isModalOpen) {
        setIsModalOpen(false);
        setSelectedOrden(null);
      }

      // Recargar datos administrativos
      await fetchAdminData();
    } catch (err) {
      console.error("Error al procesar completado de orden:", err);
      alert('Error en el servidor al completar la orden.');
    }
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    const f = new Date(fechaStr);
    return f.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      {/* Cabecera */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20 text-rose-400">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Panel Administrativo Backoffice</h1>
            <p className="text-slate-400 text-sm mt-0.5">Control temporal de licencias y monitoreo de WhatsApp</p>
          </div>
        </div>

        <button
          onClick={fetchAdminData}
          className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 p-3 rounded-xl transition-all"
          title="Recargar Datos"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Grid: Renovaciones y Órdenes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lado Izquierdo: Dashboard Renovaciones (1/3) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <h2 className="text-lg font-bold text-slate-100 pb-3 border-b border-slate-850 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Alertas de Renovación (5 días)
            </h2>

            {renovaciones.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm bg-slate-950 rounded-xl border border-slate-900">
                No hay licencias programadas para expirar exactamente en 5 días.
              </div>
            ) : (
              <div className="space-y-4">
                {renovaciones.map((ren) => (
                  <div
                    key={ren.detalleId}
                    className="bg-slate-950 p-4 rounded-xl border border-amber-500/20 space-y-2 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 left-0 h-1 bg-amber-500/30" />
                    <p className="text-xs font-bold text-amber-400">Vence en 5 días</p>
                    <h3 className="text-sm font-bold text-slate-100">{ren.productoNombre}</h3>
                    <div className="text-xs text-slate-400 space-y-1">
                      <p><span className="text-slate-500">Cliente:</span> {ren.clienteNombre}</p>
                      <p><span className="text-slate-500">WhatsApp:</span> {ren.clienteWhatsApp}</p>
                    </div>

                    <a
                      href={`https://api.whatsapp.com/send?phone=${ren.clienteWhatsApp}&text=${encodeURIComponent(
                        `Hola ${ren.clienteNombre}, te saludamos de Informatics. Queremos recordarte que tu suscripción de *${ren.productoNombre}* vencerá en 5 días. ¿Deseas renovarla?`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block w-full bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 text-amber-400 text-center text-xs font-bold py-2 rounded-lg transition-all mt-2"
                    >
                      Alertar por WhatsApp
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Lado Derecho: Órdenes Pendientes/Completadas (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <h2 className="text-lg font-bold text-slate-100 pb-3 border-b border-slate-850 flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-400" />
              Gestión de Órdenes Comerciales
            </h2>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
              </div>
            ) : ordenes.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No se han registrado órdenes en la plataforma.
              </div>
            ) : (
              <div className="space-y-4">
                {ordenes.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-slate-950 border border-slate-850 rounded-xl p-5 hover:border-slate-800 transition-all space-y-4"
                  >
                    {/* Fila superior */}
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <span className="text-xs text-slate-500">Pedido N°</span>
                        <h3 className="text-base font-bold text-slate-100">#{ord.id}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-500">Fecha</span>
                        <p className="text-xs text-slate-300 font-mono">{formatearFecha(ord.fechaCreacion)}</p>
                      </div>
                      <div>
                        <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${
                          ord.estado === 'Pendiente' 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {ord.estado}
                        </span>
                      </div>
                    </div>

                    {/* Cliente Info */}
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-850 text-xs text-slate-400 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <p><span className="text-slate-500">Cliente:</span> {ord.usuario?.nombre}</p>
                      <p><span className="text-slate-500">WhatsApp:</span> {ord.usuario?.whatsapp}</p>
                      <p><span className="text-slate-500">Email:</span> {ord.usuario?.email}</p>
                    </div>

                    {/* Items */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Productos:</p>
                      {ord.detalles.map((d) => (
                        <div key={d.id} className="flex justify-between text-xs text-slate-350">
                          <span>{d.producto?.nombre} x{d.cantidad}</span>
                          <span className="font-mono text-emerald-400">S/ {(d.precioUnitario * d.cantidad).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Fila final */}
                    <div className="pt-3 border-t border-slate-850 flex justify-between items-center flex-wrap gap-4">
                      <div>
                        <span className="text-xs text-slate-500">Total Facturado</span>
                        <p className="text-base font-bold text-emerald-400">S/ {ord.total.toFixed(2)}</p>
                      </div>

                      {ord.estado === 'Pendiente' && (
                        <button
                          onClick={() => openCompletarModal(ord)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-md active:scale-95"
                        >
                          <CheckSquare className="w-4 h-4" />
                          Aprovisionar y Completar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para ingresar claves de activación */}
      {isModalOpen && selectedOrden && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          id="modal-admin-overlay"
        >
          {/* Validación lógica estricta del elemento modal */}
          <div
            ref={modalRef}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
            id="modal-admin-container"
          >
            {/* Cabecera */}
            <div className="bg-slate-800/50 p-5 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-sky-400 flex items-center gap-2">
                <Key className="w-5 h-5" />
                Asignación de Claves (Orden #{selectedOrden.id})
              </h3>
              <button
                onClick={() => {
                  if (modalRef.current || isModalOpen) {
                    setIsModalOpen(false);
                    setSelectedOrden(null);
                  }
                }}
                className="text-slate-400 hover:text-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={submitCompletarOrden} className="p-6 space-y-6">
              <p className="text-slate-450 text-xs">
                Ingresa las claves de activación, invitaciones a equipos o credenciales de perfil asignados a cada producto para esta orden. Al completar, se calculará el periodo de vigencia correspondiente.
              </p>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {selectedOrden.detalles.map((d) => (
                  <div key={d.id} className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-200">{d.producto?.nombre}</span>
                      <span className="text-slate-500 uppercase tracking-widest">
                        {d.producto?.duracionMeses === 0 ? 'Perpetuo' : `${d.producto?.duracionMeses} Meses`}
                      </span>
                    </div>

                    <input
                      type="text"
                      required
                      placeholder="Ingrese código de activación o credenciales..."
                      value={clavesForm[d.id] || ''}
                      onChange={(e) => handleClaveChange(d.id, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-all font-mono"
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-4 shadow-lg hover:shadow-emerald-500/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                Activar Licencias y Completar Orden
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
