import { ImagePlus, LoaderCircle, Star, Trash2, TriangleAlert } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { mensajeErrorAdmin as mensajeError } from './errores';
import { cn } from '@/lib/utils';
import { useActualizarImagen, useEliminarImagen } from './api';
import { MAX_IMAGENES, TAMANO_MAX, TIPOS_IMAGEN } from './cola-imagenes';

function Tarjeta({ src, alt, children, estado, principal }) {
  return (
    <li
      className={cn(
        'group relative aspect-square overflow-hidden rounded-lg border bg-muted',
        principal && 'ring-2 ring-primary ring-offset-2 ring-offset-card',
      )}
    >
      <img
        src={src}
        alt={alt}
        className={cn('size-full object-cover', estado === 'subiendo' && 'opacity-50')}
      />
      {estado === 'subiendo' && (
        <span className="absolute inset-0 grid place-content-center">
          <LoaderCircle className="size-6 animate-spin text-primary" aria-hidden="true" />
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-1 bg-linear-to-t from-cafe/70 to-transparent p-1.5 pt-6">
        {children}
      </div>
    </li>
  );
}

/**
 * Galería del formulario de producto: imágenes guardadas (principal, eliminar) y fotos nuevas
 * con vista previa. Con producto existente se suben al elegirlas; al crear, se suben después
 * de guardar el producto.
 */
export function ImagenesProducto({ productoId, imagenes = [], cola, onAgregar, onQuitar }) {
  const { t } = useTranslation();
  const input = useRef(null);
  const [arrastrando, setArrastrando] = useState(false);
  const actualizar = useActualizarImagen();
  const eliminar = useEliminarImagen();
  const total = imagenes.length + cola.length;
  const lleno = total >= MAX_IMAGENES;

  const elegir = (lista) => {
    const archivos = [...lista];
    const validos = [];
    for (const archivo of archivos) {
      if (!TIPOS_IMAGEN.includes(archivo.type)) {
        toast.error(t('admin.imagenes.tipoInvalido', { nombre: archivo.name }));
      } else if (archivo.size > TAMANO_MAX) {
        toast.error(t('admin.imagenes.muyGrande', { nombre: archivo.name }));
      } else {
        validos.push(archivo);
      }
    }
    const disponibles = MAX_IMAGENES - total;
    if (validos.length > disponibles)
      toast.error(t('admin.imagenes.limite', { max: MAX_IMAGENES }));
    if (validos.length && disponibles > 0) onAgregar(validos.slice(0, disponibles));
  };

  const hacerPrincipal = (imagen) =>
    actualizar.mutate(
      { productoId, imagenId: imagen.id, cambios: { esPrincipal: true } },
      { onError: (e) => toast.error(mensajeError(t, e)) },
    );

  const borrar = (imagen) =>
    eliminar.mutate(
      { productoId, imagenId: imagen.id },
      {
        onSuccess: () => toast.success(t('admin.imagenes.eliminada')),
        onError: (e) => toast.error(mensajeError(t, e)),
      },
    );

  return (
    <div className="grid gap-4">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {imagenes.map((img) => (
          <Tarjeta key={img.id} src={img.url} alt={img.textoAlt ?? ''} principal={img.esPrincipal}>
            {img.esPrincipal ? (
              <Badge variant="primary">
                <Star aria-hidden="true" />
                {t('admin.imagenes.principal')}
              </Badge>
            ) : (
              <Button
                size="icon-sm"
                variant="secondary"
                className="size-8"
                onClick={() => hacerPrincipal(img)}
                disabled={actualizar.isPending}
                aria-label={t('admin.imagenes.hacerPrincipal')}
                title={t('admin.imagenes.hacerPrincipal')}
              >
                <Star aria-hidden="true" />
              </Button>
            )}
            <Button
              size="icon-sm"
              variant="secondary"
              className="ml-auto size-8 text-destructive"
              onClick={() => borrar(img)}
              disabled={eliminar.isPending}
              aria-label={t('admin.imagenes.eliminar')}
              title={t('admin.imagenes.eliminar')}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </Tarjeta>
        ))}
        {cola.map((item) => (
          <Tarjeta key={item.id} src={item.preview} alt={item.archivo.name} estado={item.estado}>
            <Badge variant={item.estado === 'error' ? 'destructive' : 'neutral'}>
              {item.estado === 'error' && <TriangleAlert aria-hidden="true" />}
              {t(`admin.imagenes.estados.${item.estado}`)}
            </Badge>
            {item.estado !== 'subiendo' && (
              <Button
                size="icon-sm"
                variant="secondary"
                className="size-8"
                onClick={() => onQuitar(item.id)}
                aria-label={t('admin.imagenes.quitar', { nombre: item.archivo.name })}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            )}
          </Tarjeta>
        ))}
      </ul>

      {cola.some((i) => i.estado === 'error') && (
        <p className="text-sm text-destructive" role="alert">
          {mensajeError(t, cola.find((i) => i.estado === 'error').error)}
        </p>
      )}

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          if (!lleno) elegir(e.dataTransfer.files);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors',
          arrastrando ? 'border-primary bg-primary/5' : 'border-input hover:border-foreground',
          lleno && 'pointer-events-none opacity-50',
        )}
      >
        <ImagePlus className="size-7 text-primary" aria-hidden="true" />
        <span className="font-semibold">{t('admin.imagenes.elegir')}</span>
        <span className="text-sm text-muted-foreground">
          {t('admin.imagenes.ayuda', { max: MAX_IMAGENES, total })}
        </span>
        <input
          ref={input}
          type="file"
          accept={TIPOS_IMAGEN.join(',')}
          multiple
          className="sr-only"
          disabled={lleno}
          onChange={(e) => {
            elegir(e.target.files);
            e.target.value = '';
          }}
        />
      </label>
    </div>
  );
}
