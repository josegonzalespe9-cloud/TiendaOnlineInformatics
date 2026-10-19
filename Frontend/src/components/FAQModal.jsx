import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, ShieldCheck, Zap, Laptop, ExternalLink, HelpCircle, FileText } from 'lucide-react';

export default function FAQModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('office_comparativa');

  if (!isOpen) return null;

  const tabs = [
    { id: 'office_comparativa', label: '📊 ¿Cuál Office Elegir?', icon: '📊' },
    { id: 'licencias_pc', label: '💻 OEM vs Retail (Windows/PC)', icon: '💻' },
    { id: 'streaming_garantias', label: '🎬 Streaming & Garantía Hogar', icon: '🎬' },
    { id: 'instaladores_oficiales', label: '📥 Enlaces Oficiales Microsoft', icon: '📥' },
    { id: 'garantia_envio', label: '⏱️ Tiempos & SLA de Soporte', icon: '⏱️' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-xl font-bold">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
                Guía de Activación & Centro de Soporte Técnico
              </h2>
              <p className="text-xs text-slate-400">Todo lo que necesitas saber antes y después de comprar tu licencia</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full p-2 transition-all"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/70 overflow-x-auto scrollbar-none">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[170px] py-3.5 px-4 text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-2 border-b-2 ${
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
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-sm flex-1">
          {/* TAB 1: Comparativa Office */}
          {activeTab === 'office_comparativa' && (
            <div className="space-y-6">
              <div className="bg-slate-850 border border-slate-750 p-5 rounded-2xl space-y-3">
                <h3 className="text-base font-bold text-cyan-300 flex items-center gap-2">
                  <span>⚡</span> Comparativa: Office 2024 Pro Plus vs Office 365 vs Cuentas Educativas
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Muchos usuarios tienen malas experiencias en internet comprando cuentas universitarias baratas donde pierden sus archivos. En Informatics te explicamos la diferencia real:
                </p>

                {/* Tabla Comparativa */}
                <div className="overflow-x-auto rounded-xl border border-slate-800 mt-3">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3">Característica</th>
                        <th className="p-3 text-cyan-400">Office 2024 Pro Plus</th>
                        <th className="p-3 text-emerald-400">Office 365 Anual</th>
                        <th className="p-3 text-rose-400">Cuentas .edu (Internet)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                      <tr>
                        <td className="p-3 font-semibold">Tipo de Pago</td>
                        <td className="p-3 font-bold text-emerald-400">Único de por vida</td>
                        <td className="p-3">Suscripción anual</td>
                        <td className="p-3 text-rose-400">Pago único (Riesgoso)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Dispositivos</td>
                        <td className="p-3">1 Computadora (Windows)</td>
                        <td className="p-3">Hasta 5 PCs, Mac y Celulares</td>
                        <td className="p-3">Variable</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Nube OneDrive</td>
                        <td className="p-3">Usa tus 5GB gratis</td>
                        <td className="p-3 font-bold text-cyan-400">1 TB (1024 GB) Seguro</td>
                        <td className="p-3 text-rose-400">⚠️ Riesgo de pérdida si cae la escuela</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Instalación Oficial</td>
                        <td className="p-3">setup.office.com directo</td>
                        <td className="p-3">portal.office.com</td>
                        <td className="p-3 text-slate-400">portal.office.com</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Ideal Para</td>
                        <td className="p-3">Quien no quiere pagar mensualidades jamás</td>
                        <td className="p-3">Quien requiere nube OneDrive y sincronizar móvil</td>
                        <td className="p-3 text-slate-500">No recomendado para datos críticos</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-sky-500/10 border border-sky-500/20 p-4 rounded-xl text-xs space-y-2">
                <span className="font-bold text-sky-300 flex items-center gap-1.5 uppercase tracking-wide">
                  <ShieldCheck className="w-4 h-4" /> Recomendación Informatics:
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Si solo trabajas en tu PC de escritorio o Laptop con Windows y no necesitas almacenamiento en la nube, <strong>Office Profesional Plus 2024</strong> es la mejor compra calidad-precio. Si usas MacBook, iPhone o requieres respaldo de 1 TB, elige <strong>Office Hogar y Empresas 2024</strong> o <strong>Office 365</strong>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: OEM vs Retail */}
          {activeTab === 'licencias_pc' && (
            <div className="space-y-5">
              <div className="bg-slate-850 border border-slate-750 p-5 rounded-2xl space-y-3">
                <h3 className="text-base font-bold text-cyan-300 flex items-center gap-2">
                  <span>🔑</span> ¿Qué es una Licencia OEM vs una Licencia Retail de Windows?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                    <span className="bg-sky-500/10 text-sky-400 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                      Licencia OEM (Original Equipment Manufacturer)
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      Se enlaza digitalmente a la <strong>placa madre (Motherboard)</strong> de tu computadora. Si formateas tu PC o reinstalas Windows 10/11 en ese mismo equipo, se reactiva automáticamente sin pedirte la clave. No es transferible a otra computadora distinta.
                    </p>
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                    <span className="bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                      Licencia Retail / Bind
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      Se vincula a tu <strong>cuenta personal de Microsoft (Outlook o Hotmail)</strong>. Te permite desvincularla si en el futuro compras una computadora completamente nueva y transferir tu licencia.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-850 border border-slate-750 p-5 rounded-2xl space-y-2 text-xs">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" /> ¿Cómo activo Windows 10 u 11 en 3 pasos?
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-2">
                  <li>Ve a <strong className="text-white">Inicio &gt; Configuración &gt; Sistema &gt; Activación</strong>.</li>
                  <li>Haz clic en <strong className="text-cyan-400">"Cambiar la clave de producto"</strong>.</li>
                  <li>Pega el código de 25 caracteres recibido en tu pedido y pulsa <strong className="text-white">"Activar"</strong>.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: Streaming & Garantías */}
          {activeTab === 'streaming_garantias' && (
            <div className="space-y-5">
              <div className="bg-slate-850 border border-slate-750 p-5 rounded-2xl space-y-3">
                <h3 className="text-base font-bold text-cyan-300 flex items-center gap-2">
                  <span>🍿</span> ¿Cómo funcionan las cuentas de Streaming y la protección de Hogar?
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sabemos que plataformas como Netflix aplican restricciones por hogar principal. En Informatics aplicamos los siguientes estándares:
                </p>

                <div className="space-y-3 text-xs pt-1">
                  <div className="flex items-start gap-2.5 bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block">Perfil Privado con PIN de Seguridad:</strong>
                      <span className="text-slate-400">Tu historial, listas de reproducción y recomendaciones son exclusivamente tuyos. Nadie más entra a tu perfil.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block">Código de Hogar en Smart TV:</strong>
                      <span className="text-slate-400">Si tu Smart TV solicita actualización temporal de hogar, nos escribes a WhatsApp y te proporcionamos el código de verificación en cuestión de minutos.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block">Spotify & YouTube a tu Propio Correo:</strong>
                      <span className="text-slate-400">No te entregamos un correo descartable ajeno; activamos la suscripción premium sobre tu propia cuenta existente para que no pierdas tu música ni tus suscriptores.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Enlaces Oficiales */}
          {activeTab === 'instaladores_oficiales' && (
            <div className="space-y-5">
              <div className="bg-slate-850 border border-slate-750 p-5 rounded-2xl space-y-3">
                <h3 className="text-base font-bold text-cyan-300 flex items-center gap-2">
                  <span>📥</span> Descargas Oficiales de los Desarrolladores (Cero Malware ni Cracks)
                </h3>
                <p className="text-xs text-slate-400">
                  Nunca descargues programas de enlaces sospechosos o activadores KMS piratas que infecten tu computadora. Utiliza siempre los portales oficiales:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                  <a 
                    href="https://setup.office.com" 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-xl flex items-center justify-between transition-all group"
                  >
                    <div>
                      <strong className="text-slate-100 group-hover:text-cyan-400 block">setup.office.com</strong>
                      <span className="text-[10px] text-slate-400">Descarga oficial de Office 2021 / 2024</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
                  </a>

                  <a 
                    href="https://www.microsoft.com/software-download" 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-xl flex items-center justify-between transition-all group"
                  >
                    <div>
                      <strong className="text-slate-100 group-hover:text-cyan-400 block">Microsoft Media Creation</strong>
                      <span className="text-[10px] text-slate-400">ISO oficial de Windows 10 y 11 Pro</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
                  </a>

                  <a 
                    href="https://www.internetdownloadmanager.com/download.html" 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-xl flex items-center justify-between transition-all group"
                  >
                    <div>
                      <strong className="text-slate-100 group-hover:text-cyan-400 block">Internet Download Manager</strong>
                      <span className="text-[10px] text-slate-400">Instalador oficial Tonec Inc.</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
                  </a>

                  <a 
                    href="https://www.eset.com/la/hogar/internet-security/descarga/" 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-xl flex items-center justify-between transition-all group"
                  >
                    <div>
                      <strong className="text-slate-100 group-hover:text-cyan-400 block">ESET Live Installer</strong>
                      <span className="text-[10px] text-slate-400">Antivirus y banca segura oficial</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Tiempos y SLA */}
          {activeTab === 'garantia_envio' && (
            <div className="space-y-5">
              <div className="bg-slate-850 border border-slate-750 p-5 rounded-2xl space-y-3">
                <h3 className="text-base font-bold text-cyan-300 flex items-center gap-2">
                  <span>⏱️</span> Tiempos de Entrega & Garantía de Satisfacción
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                    <strong className="text-emerald-400 text-sm block">⚡ Entrega Inmediata (5 a 15 Minutos)</strong>
                    <p className="text-slate-300 leading-relaxed">
                      En cuanto validas tu pago por Yape, Plin o transferencia bancaria, tu orden se procesa de forma prioritaria y la clave se despliega directamente en tu panel de cliente y en WhatsApp.
                    </p>
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                    <strong className="text-cyan-400 text-sm block">🛡️ SLA de Soporte Anti-Caídas (&lt; 2 Horas)</strong>
                    <p className="text-slate-300 leading-relaxed">
                      Si alguna clave o perfil presenta intermitencia, nuestro equipo técnico de soporte te responde y soluciona o reemplaza el acceso en menos de 2 horas garantizadas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
          <a
            href="https://wa.me/51984497138?text=Hola%20Informatics,%20tengo%20una%20consulta%20técnica%20sobre%20una%20licencia"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 font-medium transition-all"
          >
            <span>💬 ¿Dudas con la instalación? Asesoría gratuita por WhatsApp</span>
          </a>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-955 rounded-xl shadow-lg transition-all active:scale-95"
          >
            Cerrar Guía
          </button>
        </div>
      </div>
    </div>
  );
}
