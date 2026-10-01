import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/toast';
import { useCarrito } from './carrito-context';
import { volarAlCarrito } from './volar-al-carrito';

// Agregar al carrito desde una tarjeta sin salir de la página: hace volar la foto (`imagen`)
// hasta el icono del header y avisa con un toast (o indica que no queda más stock).
export function useAgregarProducto() {
  const { t } = useTranslation();
  const { agregar, iconoCarritoRef, abrir } = useCarrito();

  return (producto, imagen) => {
    if (agregar(producto) > 0) {
      volarAlCarrito(imagen, iconoCarritoRef.current);
      toast.success(t('carrito.agregado'), {
        description: producto.nombre,
        action: { label: t('carrito.verCarrito'), onClick: abrir },
      });
    } else {
      toast.info(t('carrito.sinMasStock'), { description: producto.nombre });
    }
  };
}
