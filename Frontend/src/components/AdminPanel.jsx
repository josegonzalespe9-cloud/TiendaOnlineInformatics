import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { FileText, Key, AlertTriangle, CheckSquare, RefreshCw, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { API_URL } from '../services/api';

export default function AdminPanel() {
  const { user } = useCart();
  const [ordenes, setOrdenes] = useState([]);
  const [renovaciones, setRenovaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clavesForm, setClavesForm] = useState({});
  const [activeOrderInputId, setActiveOrderInputId] = useState(null);

  useEffect(() => {
    if (!user || (user.rol !== 'Admin' && user.rol !== 'Administrador')) return;
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

      // Obtener alertas de renovación en un plazo menor o igual a 5 días
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

  if (!user || (user.rol !== 'Admin' && user.rol !== 'Administrador')) {
    return <Navigate to="/" replace />;
  }

  const startCompletarOrden = (orden) => {
    setActiveOrderInputId(orden.id);
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

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    const f = new Date(fechaStr);
    return f.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
  };

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

        <button
          onClick={fetchAdminData}
          className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 p-3 rounded-xl transition-all"
          title="Recargar Datos"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Dashboard de Alertas de Renovación */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Notificaciones Prioritarias (Expiración ≤ 5 días)
        </h2>
        {renovaciones.length === 0 ? (
          <p className="text-slate-500 text-sm">No hay servicios programados para expirar en 5 días o menos.</p>
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
                  <p className="text-xs text-slate-500">
                    Producto: <span className="text-slate-400">{ren.productoNombre}</span> | Vence: {formatearFecha(ren.fechaVencimiento)}
                  </p>
                </div>
                <a
                  href={`https://api.whatsapp.com/send?phone=${ren.clienteWhatsApp}&text=${encodeURIComponent(
                    `Hola ${ren.clienteNombre}, te saludamos de Informatics. Queremos recordarte que tu suscripción de *${ren.productoNombre}* vencerá en 5 días. ¿Deseas renovarla?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-slate-950 text-xs font-bold py-2 px-4 rounded-xl transition-all text-center"
                >
                  Alertar WhatsApp
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gestión de Órdenes */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
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
                        <div className="text-xs text-slate-500">{ord.usuario?.email}</div>
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
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => startCompletarOrden(ord)}
                                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-1.5 px-3 rounded-lg text-xs transition-all flex items-center gap-1"
                              >
                                <CheckSquare className="w-3.5 h-3.5" />
                                Completar
                              </button>
                              <button
                                onClick={() => handleCancelarOrden(ord.id)}
                                className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs transition-all font-bold"
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
                    
                    {/* Fila de ingreso controlado de claves (si está seleccionada para completar) */}
                    {activeOrderInputId === ord.id && (
                      <tr className="bg-slate-950/40">
                        <td colSpan="6" className="px-6 py-4">
                          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4 max-w-2xl">
                            <h4 className="text-xs font-bold text-sky-400 flex items-center gap-1 uppercase tracking-wider">
                              <Key className="w-3.5 h-3.5" />
                              Ingreso de Claves de Licencia - Orden #{ord.id}
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                              {ord.detalles.map((d) => (
                                <div key={d.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900 p-3 rounded-lg border border-slate-800">
                                  <span className="text-xs font-bold text-slate-300">{d.producto?.nombre}</span>
                                  <input
                                    type="text"
                                    required
                                    placeholder="Ingresa la clave de activación del proveedor..."
                                    value={clavesForm[d.id] || ''}
                                    onChange={(e) => handleClaveChange(d.id, e.target.value)}
                                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 w-full sm:w-80 font-mono"
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setActiveOrderInputId(null)}
                                className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs px-4 py-2 rounded-lg transition-all"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => submitCompletarOrden(ord.id)}
                                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition-all flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Guardar y Aprobar
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
  );
}
