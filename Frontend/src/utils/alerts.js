import Swal from 'sweetalert2';

// Mixin base con el diseño oscuro unificado
const darkSwal = Swal.mixin({
  background: '#0f172a', // slate-900
  color: '#f1f5f9', // slate-100
  customClass: {
    popup: 'border border-slate-800 rounded-3xl font-sans',
    title: 'text-xl font-extrabold text-slate-100 px-6 pt-6',
    htmlContainer: 'text-sm text-slate-400 px-6 pb-2 leading-relaxed',
    actions: 'p-6 flex justify-center gap-3',
    confirmButton: 'px-5 py-2.5 bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 rounded-xl font-bold text-xs shadow-md transition-all uppercase tracking-wider',
    cancelButton: 'px-5 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-350 rounded-xl font-bold text-xs shadow-md transition-all uppercase tracking-wider'
  },
  buttonsStyling: false
});

// Mixin para notificaciones tipo Toast rápidas y no intrusivas
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#1e293b', // slate-800
  color: '#f8fafc',
  customClass: {
    popup: 'border border-slate-700/60 rounded-2xl shadow-2xl p-4'
  },
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
});

/**
 * Muestra una notificación rápida tipo Toast
 * @param {string} message 
 * @param {'success'|'error'|'warning'|'info'} icon 
 */
export const showToast = (message, icon = 'success') => {
  Toast.fire({
    icon: icon,
    title: message
  });
};

/**
 * Muestra un diálogo de alerta modal oscuro
 * @param {string} title 
 * @param {string} text 
 * @param {'success'|'error'|'warning'|'info'} icon 
 */
export const showAlert = (title, text, icon = 'info') => {
  return darkSwal.fire({
    title,
    text,
    icon,
    confirmButtonText: 'Entendido'
  });
};

export const showSuccess = (title, text) => showAlert(title, text, 'success');
export const showError = (title, text) => showAlert(title, text, 'error');
export const showWarning = (title, text) => showAlert(title, text, 'warning');

/**
 * Muestra un diálogo de confirmación de acción con opciones Sí/No
 * @param {string} title 
 * @param {string} text 
 * @param {string} confirmText 
 * @param {string} cancelText 
 * @returns {Promise<boolean>} Retorna true si el usuario confirma, false de lo contrario
 */
export const showConfirm = async (title, text, confirmText = 'Sí, continuar', cancelText = 'Cancelar') => {
  const result = await darkSwal.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    customClass: {
      confirmButton: 'px-5 py-2.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-xl font-bold text-xs shadow-md transition-all uppercase tracking-wider',
      cancelButton: 'px-5 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-350 rounded-xl font-bold text-xs shadow-md transition-all uppercase tracking-wider ml-2'
    }
  });
  return result.isConfirmed;
};
