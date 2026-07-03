import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

export default function BotonSoporteFloat() {
  const [isOpen, setIsOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [tipoIncidencia, setTipoIncidencia] = useState('Licencia');
  
  const modalRef = useRef(null);

  // Cerrar el modal al presionar escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      if (!nombre.trim() || !mensaje.trim()) {
        alert('Por favor complete todos los campos.');
        return;
      }

      // Preparar el mensaje dinámico para WhatsApp
      const whatsappAdmin = '51900000000';
      const mensajeWhatsApp = encodeURIComponent(
        `*SOPORTE TÉCNICO INFORMATICS*\n\n` +
        `*Cliente:* ${nombre}\n` +
        `*Tipo:* ${tipoIncidencia}\n` +
        `*Consulta:* ${mensaje}\n\n` +
        `Enviado desde la sección web de soporte.`
      );

      const url = `https://api.whatsapp.com/send?phone=${whatsappAdmin}&text=${mensajeWhatsApp}`;
      
      // Cerrar modal de forma segura
      setIsOpen(false);
      setNombre('');
      setMensaje('');
      
      // Abrir en pestaña nueva
      window.open(url, '_blank');
    } catch (error) {
      console.error("Error en formulario de soporte:", error);
    }
  };

  const toggleModal = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={toggleModal}
        className="fixed bottom-6 right-6 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold p-4 rounded-full shadow-lg hover:shadow-sky-500/50 transition-all duration-300 z-50 flex items-center justify-center transform hover:scale-110"
        title="Soporte Técnico en Vivo"
        id="btn-soporte-float"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Modal de Soporte */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300"
          id="modal-soporte-overlay"
        >
          {/* Validación lógica estricta para evitar manipulación si no existe */}
          <div
            ref={modalRef}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all duration-300"
            id="modal-soporte-container"
          >
            {/* Cabecera */}
            <div className="bg-slate-800/50 p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-sky-400 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-sky-400" />
                Soporte en Línea
              </h3>
              <button
                onClick={() => {
                  // Validación de renderizado del modal antes de cerrar
                  if (modalRef.current) {
                    setIsOpen(false);
                  }
                }}
                className="text-slate-400 hover:text-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Tu Nombre
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-all"
                  placeholder="Ej. José Gonzales"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Tipo de Incidencia
                </label>
                <select
                  value={tipoIncidencia}
                  onChange={(e) => setTipoIncidencia(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 focus:outline-none focus:border-sky-500 transition-all"
                >
                  <option value="Licencia">Problema con Licencia</option>
                  <option value="Streaming">Acceso a Streaming / Perfil</option>
                  <option value="Pago">Dudas sobre Pagos</option>
                  <option value="Otro">Otra consulta</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  ¿Cómo podemos ayudarte?
                </label>
                <textarea
                  required
                  rows="3"
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-all resize-none"
                  placeholder="Describe detalladamente el problema..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-2 shadow-lg hover:shadow-emerald-500/20"
              >
                <Send className="w-4 h-4" />
                Contactar por WhatsApp
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
