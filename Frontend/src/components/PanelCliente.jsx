import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { 
  User, ShieldAlert, Key, Calendar, RefreshCw, AlertTriangle, 
  CheckCircle, ExternalLink, Trash2, BellRing, Copy, Check, 
  Download, HelpCircle, ChevronDown, ChevronUp, MessageSquare
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { API_URL } from '../services/api';
import { showSuccess, showError, showConfirm, showToast } from '../utils/alerts';

export default function PanelCliente() {
  const { user, token } = useCart();
  const [servicios, setServicios] = useState([]);
  const [alertasRenovacion, setAlertasRenovacion] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claveCopiadaId, setClaveCopiadaId] = useState(null);
  const [instruccionesVisiblesId, setInstruccionesVisiblesId] = useState(null);

  useEffect(() => {
    const fetchServicios = async () => {
      if (!user || !user.id || !token) {
        return;
      }
      
      try {
        setLoading(true);
        // 1. Obtener servicios del cliente
        const response = await fetch(`${API_URL}/api/ordenes/cliente/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setServicios(data);
        }

        // 2. Obtener licencias por vencer en 7 días para el banner de alertas
        const resAlertas = await fetch(`${API_URL}/api/licencias/renovaciones/${user.id}`);
        if (resAlertas.ok) {
          const dataAlertas = await resAlertas.json();
          setAlertasRenovacion(dataAlertas);
        }
      } catch (error) {
        console.error("Error al obtener servicios:", error);
        setServicios([
          {
            detalleId: 1,
            productoNombre: "Office Profesional Plus 2024",
            categoria: "Software",
            duracionMeses: 0,
            clave: "N9P7T-VK8XX-462B2-B67DF-QWP2Y",
            estadoOrden: "Completada",
            fechaActivacion: new Date(2026, 8, 1).toISOString(),
            fechaVencimiento: null,
            mesesRestantes: 0,
            expirado: false
          },
          {
            detalleId: 2,
            productoNombre: "Netflix Premium (1 Mes)",
            categoria: "Streaming",
            duracionMeses: 1,
            clave: "Cuenta: cliente_vip@informatics.pe | Perfil: 4 (PIN: 8892)",
            estadoOrden: "Completada",
            fechaActivacion: new Date().toISOString(),
            fechaVencimiento: new Date(Date.now() + 25 * 86400000).toISOString(),
            mesesRestantes: 1,
            expirado: false
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

  const handleCopiarClave = (clave, id) => {
    if (!clave || clave === 'Generando accesos...') return;
    navigator.clipboard.writeText(clave);
    setClaveCopiadaId(id);
    showToast('¡Clave copiada al portapapeles!', 'success');
    setTimeout(() => {
      setClaveCopiadaId(null);
    }, 2000);
  };

  const obtenerUrlDescarga = (nombreProd) => {
    const n = (nombreProd || '').toLowerCase();
    if (n.includes('office')) return 'https://setup.office.com';
    if (n.includes('windows')) return 'https://www.microsoft.com/software-download';
    if (n.includes('eset')) return 'https://www.eset.com/la/hogar/internet-security/descarga/';
    if (n.includes('idm') || n.includes('internet download')) return 'https://www.internetdownloadmanager.com/download.html';
    if (n.includes('winrar')) return 'https://www.win-rar.com/download.html';
    if (n.includes('netflix')) return 'https://www.netflix.com';
    if (n.includes('spotify')) return 'https://open.spotify.com';
    return null;
  };

  const handleSoporteLicencia = (ser) => {
    const whatsappAdmin = "51984497138";
    const mensaje = encodeURIComponent(
      `*SOPORTE PRIORITARIO DE LICENCIA - INFORMATICS*\n\n` +
      `*Producto:* ${ser.productoNombre}\n` +
      `*ID Detalle:* #${ser.detalleId}\n` +
      `*Clave / Acceso:* ${ser.clave || 'No entregada'}\n` +
      `*Cliente:* ${user.nombre} (${user.email})\n\n` +
      `Hola, necesito asistencia técnica con la activación de esta licencia en mi equipo.`
    );
    window.open(`https://api.whatsapp.com/send?phone=${whatsappAdmin}&text=${mensaje}`, '_blank');
  };

  const handleRenovacion = (nombreProducto) => {
    try {
      const whatsappAdmin = "51984497138";
      const mensaje = encodeURIComponent(
        `¡Hola Informatics! Deseo renovar mi suscripción de *${nombreProducto}*.\n\n` +
        `Cliente: ${user.nombre}\n` +
        `Correo: ${user.email}\n` +
        `Por favor, indíquenme las cuentas de pago para extender mi acceso.`
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
      "¿Está seguro de que desea dar de baja y eliminar esta licencia permanentemente de su panel?"
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
        setAlertasRenovacion((prev) => prev.filter(a => a.detalleId !== detalleId));
        showSuccess("Licencia Eliminada", "Licencia eliminada con éxito.");
      } else {
        const errorData = response ? await response.json() : null;
        const mensajeError = errorData && errorData.mensaje ? errorData.mensaje : "Error al procesar la eliminación.";
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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-100">{user.nombre}</h1>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Cliente Verificado
              </span>
            </div>
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

      {/* Banner de Alertas de Renovación Próxima */}
      {alertasRenovacion.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 border border-amber-500/30 rounded-2xl p-5 mb-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 text-amber-400 p-3 rounded-xl border border-amber-500/30">
              <BellRing className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-300">
                ⚠️ Alerta de Renovación Próxima ({alertasRenovacion.length} {alertasRenovacion.length === 1 ? 'Licencia' : 'Licencias'})
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {alertasRenovacion.length === 1 
                  ? `Tu suscripción de "${alertasRenovacion[0].productoNombre}" vence pronto. Renueva ahora para no perder tu acceso.`
                  : 'Tienes licencias a punto de vencer. Garantiza la continuidad de tus servicios en 1 clic.'}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => handleRenovacion(alertasRenovacion.map(a => a.productoNombre).join(', '))}
            className="w-full sm:w-auto whitespace-nowrap bg-amber-500 hover:bg-amber-400 text-slate-955 font-extrabold px-5 py-2.5 rounded-xl text-xs transition-all shadow-lg hover:shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Renovar Licencia en 1 Clic
          </button>
        </div>
      )}

      {/* Título Casillero Digital */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Key className="w-5 h-5 text-sky-400" />
          Casillero Digital de Licencias & Accesos
        </h2>
        <span className="text-xs text-slate-400 hidden sm:inline">
          Copia tus claves con 1 clic y descarga instaladores oficiales
        </span>
      </div>

      {/* Grid de Servicios */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-sky-500"></div>
        </div>
      ) : servicios.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-3xl max-w-xl mx-auto p-8 shadow-2xl">
          <p className="text-slate-400 mb-4">Aún no posees ningún servicio o licencia activada.</p>
          <a
            href="/"
            className="inline-block bg-sky-500 hover:bg-sky-400 text-slate-955 font-bold px-6 py-2.5 rounded-xl transition-all text-sm"
          >
            Explorar Catálogo de Software
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {servicios.map((ser) => {
            const exp = ser.expirado;
            const urlDescarga = obtenerUrlDescarga(ser.productoNombre);
            const esCopiado = claveCopiadaId === ser.detalleId;
            const mostrandoInstrucciones = instruccionesVisiblesId === ser.detalleId;
            
            return (
              <div
                key={ser.detalleId}
                className={`bg-slate-900 border rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden shadow-xl ${
                  exp 
                    ? 'border-rose-500/30 bg-gradient-to-br from-slate-900 to-rose-950/10' 
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
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
                      <h3 className="text-lg font-black text-slate-100 line-clamp-1">{ser.productoNombre}</h3>
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
                          Genuina / Activa
                        </span>
                      )}

                      <button
                        onClick={() => handleEliminarLicencia(ser.detalleId)}
                        className="bg-slate-950/80 hover:bg-rose-600 border border-slate-800 hover:border-rose-500 text-slate-400 hover:text-white p-2 rounded-xl transition-all duration-300 active:scale-95 flex items-center justify-center shadow-md"
                        title="Eliminar de mi panel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Casillero Digital con Copiado en 1 Clic */}
                  <div className="bg-slate-955 rounded-2xl p-4 border border-slate-800 space-y-3 font-mono text-xs mb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        <Key className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-slate-500 block mb-1 text-[11px] font-sans font-bold uppercase tracking-wider">
                            Clave / Credenciales:
                          </span>
                          {ser.estadoOrden === 'Pendiente' ? (
                            <span className="text-amber-400 italic">Esperando validación de pago...</span>
                          ) : (
                            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-mono font-bold select-all break-all text-xs tracking-wider">
                              {ser.clave || 'Generando accesos...'}
                            </div>
                          )}
                        </div>
                      </div>

                      {ser.clave && ser.estadoOrden !== 'Pendiente' && (
                        <button
                          onClick={() => handleCopiarClave(ser.clave, ser.detalleId)}
                          className={`p-2.5 rounded-xl border transition-all flex items-center gap-1 font-sans text-xs font-bold ${
                            esCopiado 
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                              : 'bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border-slate-800'
                          }`}
                          title="Copiar Clave al Portapapeles"
                        >
                          {esCopiado ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          <span className="hidden sm:inline">{esCopiado ? 'Copiado' : 'Copiar'}</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-850 text-[11px] font-sans">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-sky-400" />
                        <span>Vigencia:</span>
                        <strong className="text-slate-200">
                          {ser.duracionMeses === 0 ? 'Perpetua (De por vida)' : formatearFecha(ser.fechaVencimiento)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Enlaces de Utilidad para Aficionados */}
                  <div className="flex flex-wrap gap-2 mb-4 font-sans text-xs">
                    {urlDescarga && (
                      <a
                        href={urlDescarga}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-cyan-400 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Descargar Instalador Oficial
                      </a>
                    )}

                    <button
                      onClick={() => setInstruccionesVisiblesId(mostrandoInstrucciones ? null : ser.detalleId)}
                      className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                      {mostrandoInstrucciones ? 'Ocultar Guía' : 'Ver Cómo Activar'}
                      {mostrandoInstrucciones ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Acordeón de Instrucciones */}
                  {mostrandoInstrucciones && (
                    <div className="bg-slate-955 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-2 mb-4 animate-fade-in font-sans">
                      <span className="font-bold text-amber-300 block uppercase text-[10px] tracking-wider">
                        Pasos Rápidos de Activación:
                      </span>
                      <ol className="list-decimal list-inside space-y-1 text-slate-300">
                        <li>Copia la clave de producto con el botón "Copiar".</li>
                        <li>Descarga e instala el software desde el instalador oficial o abre la aplicación.</li>
                        <li>Ingresa la clave en la sección de activación y valida directamente en los servidores de la plataforma.</li>
                      </ol>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800/60 font-sans">
                  <button
                    onClick={() => handleSoporteLicencia(ser)}
                    className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    Soporte SLA WhatsApp
                  </button>

                  {/* Acciones de Renovación */}
                  {exp ? (
                    <button
                      onClick={() => handleRenovacion(ser.productoNombre)}
                      className="bg-rose-500 hover:bg-rose-400 text-slate-955 font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-lg"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Renovar Ahora
                    </button>
                  ) : (
                    ser.duracionMeses > 0 && (
                      <button
                        onClick={() => handleRenovacion(ser.productoNombre)}
                        className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                        Renovar
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
