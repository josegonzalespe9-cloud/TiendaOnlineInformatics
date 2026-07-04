import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('informatics_token');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return <Navigate to="/" replace />;
    }

    // El segundo elemento es el payload codificado en Base64Url
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonPayload);
    const role = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload["rol"] || payload["role"];

    if (role !== 'Admin') {
      return <Navigate to="/" replace />;
    }

    return children;
  } catch (error) {
    console.error("Error decodificando token en ProtectedRoute:", error);
    return <Navigate to="/" replace />;
  }
}
