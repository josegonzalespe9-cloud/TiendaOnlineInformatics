import React, { useState } from 'react';

export default function FAQModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('windows_office');

  if (!isOpen) return null;

  const tabs = [
    { id: 'windows_office', label: '💻 Windows & Office', icon: '💻' },
    { id: 'streaming_ia', label: '🎬 Streaming & IA', icon: '🎬' },
    { id: 'garantia', label: '🛡️ Garantía & Soporte', icon: '🛡️' },
    { id: 'envio', label: '⏱️ Tiempos de Entrega', icon: '⏱️' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/70 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/60 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-xl font-bold">
              ?
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">Preguntas Frecuentes & Guías de Activación</h2>
              <p className="text-xs text-slate-400">Resuelve tus dudas e instala tus licencias paso a paso</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg p-2 transition-all"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-700/60 bg-slate-950/60 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[140px] py-3.5 px-4 text-xs font-semibold tracking-wider transition-all flex items-center justify-center gap-2 border-b-2 ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-slate-300 text-sm flex-1">
          {activeTab === 'windows_office' && (
            <div className="space-y-6">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-3">
                <h3 className="text-base font-semibold text-cyan-400 flex items-center gap-2">
                  <span>🔑</span> ¿Cómo activo mi Licencia de Windows 10 o Windows 11?
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 text-xs sm:text-sm pl-2">
                  <li>Ve a <strong className="text-white">Inicio → Configuración → Sistema → Activación</strong>.</li>
                  <li>Haz clic en <strong className="text-cyan-300">"Cambiar la clave de producto"</strong>.</li>
                  <li>Ingresa el código de 25 caracteres recibido en tu pedido.</li>
                  <li>Presiona <strong className="text-white">Siguiente → Activar</strong>. ¡Listo! Tu Windows quedará activado de forma permanente.</li>
                </ol>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-3">
                <h3 className="text-base font-semibold text-cyan-400 flex items-center gap-2">
                  <span>📦</span> ¿Cómo instalo y activo Office 2021 o 2024?
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 text-xs sm:text-sm pl-2">
                  <li>Ingresa al portal oficial de Microsoft: <strong className="text-cyan-300">setup.office.com</strong>.</li>
                  <li>Inicia sesión con tu cuenta personal de Microsoft.</li>
                  <li>Ingresa la clave de producto entregada por Informatics.</li>
                  <li>Descarga e instala la suite oficial directamente desde Microsoft.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'streaming_ia' && (
            <div className="space-y-6">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-3">
                <h3 className="text-base font-semibold text-cyan-400 flex items-center gap-2">
                  <span>🎬</span> ¿Cómo funcionan las cuentas de Streaming (Netflix, HBO, Disney+)?
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed">
                  Al adquirir un perfil de streaming, recibirás el correo y contraseña junto con el nombre de tu perfil privado asignado y un PIN de seguridad opcional. Podrás disfrutar contenido en UHD 4K sin interrupciones.
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-3">
                <h3 className="text-base font-semibold text-cyan-400 flex items-center gap-2">
                  <span>🤖</span> ¿Cómo accedo a ChatGPT Plus o Canva Pro?
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed">
                  Para <strong className="text-white">Canva Pro</strong>, recibirás un enlace de invitación directa para unir tu cuenta personal al equipo Pro con almacenamiento ilimitado. Para <strong className="text-white">ChatGPT Plus</strong>, se te brindan las credenciales directas de acceso privado.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'garantia' && (
            <div className="space-y-6">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-3">
                <h3 className="text-base font-semibold text-cyan-400 flex items-center gap-2">
                  <span>🛡️</span> ¿Qué garantía tienen mis compras?
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed">
                  Todas las licencias de software permanente tienen <strong className="text-white">garantía de por vida</strong> o contra cambio de hardware. Las cuentas de suscripción mensual/anual tienen garantía total durante toda la duración contratada con reemplazo inmediato en caso de inconvenientes.
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-3">
                <h3 className="text-base font-semibold text-cyan-400 flex items-center gap-2">
                  <span>💬</span> ¿Cómo contacto a Soporte Técnico?
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed">
                  Puedes presionar el botón flotante de WhatsApp o escribir directamente a nuestro canal oficial para recibir atención prioritaria de lunes a domingo.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'envio' && (
            <div className="space-y-6">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-3">
                <h3 className="text-base font-semibold text-cyan-400 flex items-center gap-2">
                  <span>⚡</span> ¿En cuánto tiempo entregan las licencias?
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed">
                  El tiempo estimado de entrega es de <strong className="text-emerald-400 font-semibold">inmediato a máximo 15 minutos</strong> tras confirmar tu pago vía Yape, Plin o transferencia bancaria.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center">
          <a
            href="https://wa.me/51984497138?text=Hola%20Informatics,%20tengo%20una%20consulta%20sobre%20mi%20licencia"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 font-medium transition-all"
          >
            <span>💬 ¿Necesitas ayuda personalizada? Escríbenos a WhatsApp</span>
          </a>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl shadow-lg transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
