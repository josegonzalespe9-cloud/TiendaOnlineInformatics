import React, { createContext, useState, useEffect, useContext } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const stored = localStorage.getItem('informatics_cart');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Error al cargar el carrito desde localStorage:", e);
      return [];
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('informatics_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error("Error al cargar el usuario desde localStorage:", e);
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('informatics_token') || null;
  });

  useEffect(() => {
    try {
      localStorage.setItem('informatics_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error("Error al guardar el carrito en localStorage:", e);
    }
  }, [cartItems]);

  const login = (userData, jwtToken) => {
    try {
      setUser(userData);
      setToken(jwtToken);
      localStorage.setItem('informatics_user', JSON.stringify(userData));
      localStorage.setItem('informatics_token', jwtToken);
    } catch (e) {
      console.error("Error al guardar la sesión en localStorage:", e);
    }
  };

  const logout = () => {
    try {
      setUser(null);
      setToken(null);
      localStorage.removeItem('informatics_user');
      localStorage.removeItem('informatics_token');
    } catch (e) {
      console.error("Error al limpiar la sesión de localStorage:", e);
    }
  };

  const addToCart = (product) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.id === product.id);
      if (existing) {
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prevItems, { ...product, cantidad: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, cantidad) => {
    if (cantidad <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, cantidad } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce(
    (total, item) => total + item.precio * item.cantidad,
    0
  );

  const cartItemsCount = cartItems.reduce((total, item) => total + item.cantidad, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        user,
        token,
        cartTotal,
        cartItemsCount,
        login,
        logout,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
