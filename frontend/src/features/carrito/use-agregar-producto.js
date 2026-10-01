import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/toast';
import { useCarrito } from './carrito-context';
import { volarAlCarrito } from './volar-al-carrito';

// Agregar al carrito desde una tarjeta sin salir de la página: hace volar la foto (`imagen`)
// hasta el icono del header, donde rebota el contador. La confirmación la da el propio botón
// ("Agregado"); solo si no queda stock se avisa con un toast. Devuelve si se agregó.
export function useAgregarProducto() {
  const { t } = useTranslation();
  const { agregar, iconoCarritoRef } = useCarrito();

  return (producto, imagen) => {
    if (agregar(producto) > 0) {
      volarAlCarrito(imagen, iconoCarritoRef.current);
      return true;
    }
    toast.info(t('carrito.sinMasStock'), { description: producto.nombre });
    return false;
  };
}
