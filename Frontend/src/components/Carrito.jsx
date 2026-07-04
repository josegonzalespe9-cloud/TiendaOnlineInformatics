import React, { useState, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { ShoppingBag, Trash2, Plus, Minus, CreditCard, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_URL } from '../services/api';
import CachedImage from './CachedImage';

export default function Carrito() {
  const { cartItems, cartTotal, updateQuantity, removeFromCart, clearCart, user } = useCart();
  const [loading, setLoading] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  const successModalRef = useRef(null);

  const handleCheckout = async () => {
    try {
      if (!user) {
        alert('Debe iniciar sesión para procesar su compra.');
        return;
      }

      if (cartItems.length === 0) {
        alert('El carrito está vacío.');
        return;
      }

      setLoading(true);

      const itemsDto = cartItems.map(item => ({
        productoId: item.id,
        cantidad: item.cantidad
      }));

      // Petición HTTP al Backend de .NET 10
      const response = await fetch(`${API_URL}/api/ordenes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          usuarioId: user.id,
          items: itemsDto
        })
      });

      if (!response.ok) {
        throw new Error('Error al procesar el pedido en el servidor');
      }

      const data = await response.json();
      
      // Guardamos la URL de WhatsApp devuelta por el Backend
      setRedirectUrl(data.redirectUrl);
      setShowModal(true);
      
      // Limpiar el carrito de compras local
      clearCart();
    } catch (error) {
      console.error("Error en checkout:", error);
      alert('Hubo un inconveniente al procesar tu compra. Por favor, intenta de nuevo o comunícate con soporte.');
    } finally {
      setLoading(false);
    }
  };

  const handleRedirect = () => {
    // Verificación lógica estricta del elemento modal antes de redirigir
    if (showModal) {
      window.open(redirectUrl, '_blank');
      setShowModal(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 flex flex-col items-center max-w-xl mx-auto shadow-2xl">
          <div className="bg-slate-950 p-6 rounded-full text-slate-600 mb-6 border border-slate-800">
            <ShoppingBag className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-4">Tu carrito está vacío</h2>
          <p className="text-slate-400 mb-8 max-w-sm">
            Explora nuestro catálogo y agrega las mejores licencias de software, herramientas de IA y accesos de streaming.
          </p>
          <Link
            to="/"
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-8 py-3.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-sky-500/20"
          >
            Ver Catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold text-slate-100 mb-8 tracking-tight flex items-center gap-3">
        <ShoppingBag className="w-8 h-8 text-sky-400" />
        Carrito de Compras
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de productos */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 md:p-6 flex flex-col sm:flex-row items-center gap-4 hover:border-slate-700 transition-all duration-300"
            >
              {/* Imagen */}
              <CachedImage
                src={item.imagenUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500"}
                alt={item.nombre}
                className="w-20 h-20 rounded-xl object-cover border border-slate-800"
              />

              {/* Nombre y Categoria */}
              <div className="flex-1 text-center sm:text-left">
                <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-1 border ${
                  item.categoria === 'Software' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                  item.categoria === 'Streaming' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {item.categoria}
                </span>
                <h3 className="text-lg font-bold text-slate-100">{item.nombre}</h3>
                <p className="text-slate-400 text-sm mt-1">S/ {item.precio.toFixed(2)} c/u</p>
              </div>

              {/* Cantidad y total de fila */}
              <div className="flex items-center gap-4 mt-4 sm:mt-0">
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                  <button
                    onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                    className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-all"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center text-slate-100 font-bold text-sm">
                    {item.cantidad}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                    className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-right min-w-[70px]">
                  <p className="text-emerald-400 font-bold">S/ {(item.precio * item.cantidad).toFixed(2)}</p>
                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                  title="Eliminar producto"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen de orden */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit space-y-6 shadow-2xl">
          <h2 className="text-xl font-bold text-slate-100 pb-4 border-b border-slate-800 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-sky-400" />
            Resumen de Orden
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span>S/ {cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Costo de envío / Entrega</span>
              <span className="text-emerald-400 font-semibold">Gratis (Digital)</span>
            </div>
            <div className="pt-4 border-t border-slate-800 flex justify-between text-base font-bold text-slate-100">
              <span>Total</span>
              <span className="text-emerald-400 text-lg">S/ {cartTotal.toFixed(2)}</span>
            </div>
          </div>

          {user ? (
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-4 shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98]"
            >
              {loading ? 'Procesando...' : 'Confirmar Pedido (Mago de Oz)'}
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center mt-4">
              <p className="text-slate-400 text-sm mb-3">Inicia sesión para poder realizar tu pedido.</p>
              <Link
                to="/login"
                className="inline-block bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-6 py-2 rounded-lg text-sm transition-all"
              >
                Iniciar Sesión
              </Link>
            </div>
          )}

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 space-y-2">
            <p className="font-semibold text-slate-300">💡 Flujo Mago de Oz:</p>
            <p>Al confirmar el pedido, registramos tu compra y congelamos el precio. Serás redirigido a WhatsApp para concretar el pago manual y recibir tus credenciales de forma inmediata.</p>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación Exitosa (Wizard of Oz) */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          id="modal-success-overlay"
        >
          {/* Validación lógica estricta del elemento modal */}
          <div
            ref={successModalRef}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-8 text-center space-y-6"
            id="modal-success-container"
          >
            <div className="mx-auto bg-emerald-500/10 w-20 h-20 rounded-full flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-100">¡Pedido Registrado!</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Tu orden ha sido guardada en nuestra base de datos bajo el estado <span className="text-emerald-400 font-semibold">Pendiente</span>.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Para completar el pago (Yape/Plin/Transferencia) y recibir tu clave digital, haz clic en el siguiente botón para conversar con nuestro administrador por WhatsApp.
              </p>
            </div>

            <button
              onClick={handleRedirect}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-emerald-500/20"
            >
              Ir a WhatsApp Corporativo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
