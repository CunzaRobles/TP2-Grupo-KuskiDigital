import { createContext, useContext } from 'react';

export const CarritoContext = createContext(null);

export const carritoKeys = {
  servidorTodos: ['carrito', 'servidor'],
  servidor: (moneda) => ['carrito', 'servidor', { moneda }],
  invitado: (moneda, items) => ['carrito', 'invitado', { moneda, items }],
};

/**
 * {
 *   carrito: { moneda, lineas, subtotal, totalUnidades }  (ver carrito-lineas.js)
 *   totalUnidades, cargando, actualizando, sincronizando (fusión tras el login),
 *   agregar(producto, cantidad) → unidades agregadas (al instante),
 *   cambiarCantidad(productoId, cantidad), quitar(productoId), cantidadEn(productoId),
 *   abierto, setAbierto, abrir()  (drawer lateral),
 *   iconoCarritoRef               (destino de la animación "volar al carrito")
 * }
 */
export const useCarrito = () => {
  const ctx = useContext(CarritoContext);
  if (!ctx) throw new Error('useCarrito debe usarse dentro de <CarritoProvider>');
  return ctx;
};
