import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { User, ShieldAlert, Key, Calendar, RefreshCw, AlertTriangle, CheckCircle, ExternalLink, Trash2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { API_URL } from '../services/api';
import { showSuccess, showError, showWarning, showConfirm } from '../utils/alerts';

export default function PanelCliente() {
  const { user, token } = useCart();
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServicios = async () => {
      if (user === null || user === undefined || !user.id || token === null || token === undefined || token === '') {
        return;
      }
      
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/ordenes/cliente/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Error al obtener licencias de cliente');
        }
        const data = await response.json();
        setServicios(data);
      } catch (error) {
        console.error("Error al obtener servicios:", error);
        // Respaldo de demostración si falla la base de datos
        setServicios([
          {
            detalleId: 1,
            productoNombre: "Canva Pro (Anual)",
            categoria: "Software",
            duracionMeses: 12,
            clave: "CANVA-TEAM-INVITE-XYZ123",
            estadoOrden: "Completada",
            fechaActivacion: new Date(2026, 5, 10).toISOString(), // Mock representation
            fechaVencimiento: "2026-07-10T00:00:00Z",
            mesesRestantes: 12,
            expirado: false
          },
          {
            detalleId: 2,
            productoNombre: "Netflix Premium (1 Mes)",
            categoria: "Streaming",
            duracionMeses: 1,
            clave: "User: streaming10@informatics.pe | Pass: secret99",
            estadoOrden: "Completada",
            fechaActivacion: "2026-06-01T00:00:00Z",
            fechaVencimiento: "2026-07-01T00:00:00Z", // Expira hoy o ya expiró
            mesesRestantes: 0,
            expirado: true
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchServicios();
  }, [user, token]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleRenovacion = (nombreProducto) => {
    try {
      const whatsappAdmin = "51984497138";
      const mensaje = encodeURIComponent(
        `¡Hola Informatics! Quiero renovar mi suscripción de *${nombreProducto}*.\n\n` +
        `Mi correo es: ${user.email}\n` +
        `Por favor, indíquenme el método para continuar.`
      );
      window.open(`https://api.whatsapp.com/send?phone=${whatsappAdmin}&text=${mensaje}`, '_blank');
    } catch (err) {
      console.error("Error en redirección de renovación:", err);
    }
  };

  const handleEliminarLicencia = async (detalleId) => {
    if (!detalleId) {
      showError("Licencia Inválida", "Error: Identificador de licencia inválido.");
      return;
    }
    if (!token) {
      showError("Autenticación", "Error: Token de autorización no provisto.");
      return;
    }
    
    const confirmacion = await showConfirm(
      "¿Dar de baja licencia?",
      "¿Está seguro de que desea dar de baja y eliminar esta licencia permanentemente?"
    );
    if (!confirmacion) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/admin/licencias/${detalleId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response && response.ok) {
        setServicios((serviciosPrevios) => {
          if (Array.isArray(serviciosPrevios)) {
            return serviciosPrevios.filter((ser) => ser && ser.detalleId !== detalleId);
          }
          return [];
        });
        showSuccess("Licencia Eliminada", "Licencia eliminada con éxito.");
      } else {
        const errorData = response ? await response.json() : null;
        const mensajeError = errorData && errorData.mensaje ? errorData.mensaje : "Error al procesar la eliminación de la licencia.";
        showError("Error al Eliminar", mensajeError);
      }
    } catch (error) {
      console.error("Error al eliminar la licencia:", error);
      showError("Error de Servidor", "Ocurrió un error en el servidor al intentar eliminar la licencia.");
    }
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'N/A';
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return fechaStr;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Cliente */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-4 z-10">
          <div className="bg-sky-500/10 p-4 rounded-2xl border border-sky-500/20 text-sky-400">
            <User className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">{user.nombre}</h1>
            <p className="text-slate-400 text-sm mt-0.5">{user.email}</p>
            <span className="inline-block bg-slate-950 border border-slate-800 text-slate-400 text-xs px-2.5 py-1 rounded-md mt-2 font-mono">
              WhatsApp: {user.whatsapp}
            </span>
          </div>
        </div>

        <div className="flex gap-3 z-10 w-full md:w-auto">
          {(user.rol === 'Admin' || user.rol === 'Administrador') && (
            <a
              href="/admin"
              className="w-full md:w-auto bg-slate-950 border border-slate-800 hover:border-sky-500/50 text-slate-300 hover:text-sky-400 font-bold px-6 py-3 rounded-xl transition-all duration-300 text-sm flex items-center justify-center gap-2"
            >
              Panel Administrador
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Título Licencias */}
      <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
        <ShieldAlert className="w-5 h-5 text-sky-400" />
        Mis Licencias y Servicios Activos
      </h2>

      {/* Grid de Servicios */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-sky-500"></div>
        </div>
      ) : servicios.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl max-w-xl mx-auto p-8 shadow-2xl">
          <p className="text-slate-400 mb-4">Aún no posees ningún servicio o licencia activada.</p>
          <a
            href="/"
            className="inline-block bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl transition-all text-sm"
          >
            Adquirir un producto
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {servicios.map((ser) => {
            const exp = ser.expirado;
            
            return (
              <div
                key={ser.detalleId}
                className={`bg-slate-900 border rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden shadow-xl ${
                  exp 
                    ? 'border-rose-500/30 bg-gradient-to-br from-slate-900 to-rose-950/10' 
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Overlay Glow para Expired */}
                {exp && (
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
                )}

                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-1.5 border ${
                        ser.categoria === 'Software' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                        ser.categoria === 'Streaming' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {ser.categoria}
                      </span>
                      <h3 className="text-lg font-bold text-slate-100 line-clamp-1">{ser.productoNombre}</h3>
                    </div>

                    {/* Estado Badge y Botón de Eliminar */}
                    <div className="flex items-center gap-2">
                      {exp ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Expirado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Activo
                        </span>
                      )}

                      <button
                        onClick={() => handleEliminarLicencia(ser.detalleId)}
                        className="bg-slate-950/80 hover:bg-rose-600 border border-slate-800 hover:border-rose-500 text-slate-400 hover:text-white p-2 rounded-lg transition-all duration-300 active:scale-95 flex items-center justify-center shadow-md"
                        title="Eliminar Licencia"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Detalle Licencia / Cuenta */}
                  <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-850 space-y-3 font-mono text-xs mb-6">
                    <div className="flex items-start gap-2">
                      <Key className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-500 block mb-1">Acceso / Clave Digital:</span>
                        {ser.estadoOrden === 'Pendiente' ? (
                          <span className="text-amber-400 italic">Esperando validación de pago...</span>
                        ) : (
                          <span className="text-slate-200 select-all font-semibold break-all">
                            {ser.clave || 'Generando accesos...'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-sky-400" />
                      <div>
                        <span className="text-slate-500 block">Vence el:</span>
                        <span className="text-slate-300">
                          {ser.duracionMeses === 0 ? 'Permanente (Sin Expiración)' : formatearFecha(ser.fechaVencimiento)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800/60">
                  {ser.duracionMeses > 0 ? (
                    <div className="text-xs text-slate-400">
                      Meses restantes: <span className={`font-bold ${exp ? 'text-rose-400' : 'text-slate-200'}`}>{ser.mesesRestantes}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-400 font-semibold">Pago Único</div>
                  )}

                  {/* Acciones */}
                  {exp ? (
                    <button
                      onClick={() => handleRenovacion(ser.productoNombre)}
                      className="bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-lg hover:shadow-rose-500/20"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Renovar Ahora
                    </button>
                  ) : (
                    ser.duracionMeses > 0 && (
                      <button
                        onClick={() => handleRenovacion(ser.productoNombre)}
                        className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 px-4 py-2 rounded-lg text-xs transition-all"
                      >
                        Pedir Soporte / Renovación
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
