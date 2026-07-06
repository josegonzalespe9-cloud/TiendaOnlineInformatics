import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';

const WhatsAppSVG = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className} 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.863-9.864.001-2.63-1.019-5.101-2.871-6.958C16.612 1.926 14.14 1.079 11.516 1.079c-5.442 0-9.87 4.42-9.874 9.865-.001 1.79.471 3.541 1.367 5.084L1.936 22.06l6.23-1.635zM15.95 13.1c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-1.62-.8-2.77-1.6-3.87-3.5-.29-.5-.07-.77.16-.99.2-.2.4-.48.6-.72.2-.24.27-.4.4-.67.13-.27.06-.5-.03-.7-.09-.2-.76-1.83-1.04-2.5-.28-.68-.56-.58-.76-.59-.2-.01-.43-.01-.66-.01-.23 0-.6.09-.91.43-.31.34-1.18 1.15-1.18 2.8 0 1.65 1.2 3.25 1.37 3.47.17.22 2.36 3.59 5.71 5.04.8.34 1.43.55 1.92.71.8.25 1.53.22 2.11.13.64-.1 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.18-.46-.3z" />
  </svg>
);

export default function BotonSoporteFloat() {
  const [isOpen, setIsOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [tipoIncidencia, setTipoIncidencia] = useState('Licencia');
  
  const modalRef = useRef(null);
  const location = useLocation();

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

  const handleButtonClick = () => {
    const whatsappAdmin = '51984497138';
    if (location.pathname === '/carrito') {
      // Mensaje parametrizado directo de ayuda con el pago si está en el carrito
      const mensajePago = 'Hola, requiero ayuda para concretar el pago de mi pedido de Informatics';
      const url = `https://api.whatsapp.com/send?phone=${whatsappAdmin}&text=${encodeURIComponent(mensajePago)}`;
      window.open(url, '_blank');
    } else {
      // Si está en cualquier otra vista, se abre el modal normal de Soporte
      setIsOpen(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      if (!nombre.trim() || !mensaje.trim()) {
        alert('Por favor complete todos los campos.');
        return;
      }

      // Preparar el mensaje dinámico para WhatsApp
      const whatsappAdmin = '51984497138';
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

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={handleButtonClick}
        className="fixed bottom-6 right-6 bg-emerald-500 hover:bg-emerald-400 text-white font-bold p-4 rounded-full shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 z-50 flex items-center justify-center transform hover:scale-110"
        title="Soporte Técnico en Vivo"
        id="btn-soporte-float"
      >
        <WhatsAppSVG className="w-6 h-6 fill-current text-white" />
      </button>

      {/* Modal de Soporte */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300"
          id="modal-soporte-overlay"
        >
          <div
            ref={modalRef}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all duration-300"
            id="modal-soporte-container"
          >
            {/* Cabecera */}
            <div className="bg-slate-800/50 p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-sky-400 flex items-center gap-2">
                <WhatsAppSVG className="w-6 h-6 fill-current text-white bg-emerald-500 rounded-full p-1" />
                Soporte en Línea
              </h3>
              <button
                onClick={() => {
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
                <WhatsAppSVG className="w-6 h-6 fill-current text-white" />
                Contactar por WhatsApp
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
