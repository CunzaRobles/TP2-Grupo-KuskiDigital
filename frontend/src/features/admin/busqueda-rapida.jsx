import { Box, CornerDownLeft, LoaderCircle, Receipt, Search, User } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { useDeferredValue, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { DialogOverlay } from '@/components/ui/dialog';
import { formatMoney } from '@/lib/format';
import { usePortalContainer } from '@/lib/portal-container';
import { cn } from '@/lib/utils';
import { useBusquedaAdmin } from './api';
import { puede } from './permisos';
import { seccionesDe } from './secciones';

const normalizar = (texto) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/**
 * Resultados agrupados: secciones del panel (filtradas en el cliente) y productos, pedidos y
 * usuarios (API, solo los grupos que el rol puede ver). Cada resultado sabe a dónde lleva.
 */
function useResultados(q, rol) {
  const { t, i18n } = useTranslation();
  const texto = normalizar(q.trim());
  const { data, isFetching } = useBusquedaAdmin(q.trim());
  const remotos = q.trim().length >= 2 ? data : null;

  const secciones = seccionesDe(rol)
    .filter((s) => !texto || normalizar(t(`admin.secciones.${s.clave}`)).includes(texto))
    .map((s) => ({
      id: `seccion-${s.clave}`,
      Icono: s.Icono,
      titulo: t(`admin.secciones.${s.clave}`),
      detalle: t('admin.buscar.irA'),
      ruta: s.ruta,
    }));

  const productos = (remotos?.productos ?? []).map((p) => ({
    id: `producto-${p.id}`,
    Icono: Box,
    titulo: p.nombre,
    detalle: `${p.sku} · ${t('admin.inventarioPage.stockN', { count: p.stock })}`,
    ruta: puede(rol, 'productos')
      ? `/admin/productos/${p.id}`
      : `/admin/inventario?q=${encodeURIComponent(p.sku)}`,
  }));

  const pedidos = (remotos?.pedidos ?? []).map((p) => ({
    id: `pedido-${p.codigo}`,
    Icono: Receipt,
    titulo: p.codigo,
    detalle: `${p.destinatario} · ${t(`pedidos.estados.${p.estado}`)} · ${formatMoney(p.totalPen, 'PEN', i18n.language)}`,
    ruta: `/admin/pedidos?codigo=${p.codigo}`,
  }));

  const usuarios = (remotos?.usuarios ?? []).map((u) => ({
    id: `usuario-${u.id}`,
    Icono: User,
    titulo: u.nombre,
    detalle: `${u.correo} · ${t(`admin.roles.${u.rol}`)}`,
    ruta: `/admin/usuarios?q=${encodeURIComponent(u.correo)}`,
  }));

  const grupos = [
    { clave: 'secciones', items: secciones },
    { clave: 'productos', items: productos },
    { clave: 'pedidos', items: pedidos },
    { clave: 'usuarios', items: usuarios },
  ].filter((g) => g.items.length);

  return { grupos, planos: grupos.flatMap((g) => g.items), cargando: isFetching };
}

// Contenido del diálogo: Radix lo desmonta al cerrar, así cada apertura empieza de cero.
function Contenido({ onCerrar, rol }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const listaId = useId();
  const [q, setQ] = useState('');
  const consulta = useDeferredValue(q);
  const [activo, setActivo] = useState(0);
  const { grupos, planos, cargando } = useResultados(consulta, rol);

  const indiceActivo = Math.min(activo, Math.max(planos.length - 1, 0));

  const ir = (item) => {
    onCerrar();
    navigate(item.ruta);
  };

  const alTeclear = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActivo((i) => (planos.length ? (i + 1) % planos.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActivo((i) => (planos.length ? (i - 1 + planos.length) % planos.length : 0));
    } else if (e.key === 'Enter' && planos[indiceActivo]) {
      e.preventDefault();
      ir(planos[indiceActivo]);
    }
  };

  const idOpcion = (item) => `${listaId}-${item.id}`;

  return (
    <>
      <DialogPrimitive.Title className="sr-only">{t('admin.buscar.titulo')}</DialogPrimitive.Title>
      <DialogPrimitive.Description className="sr-only">
        {t('admin.buscar.ayuda')}
      </DialogPrimitive.Description>
      <div className="flex items-center gap-3 border-b px-4">
        {cargando ? (
          <LoaderCircle
            className="size-5 shrink-0 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
        ) : (
          <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        )}
        <input
          autoFocus
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActivo(0);
          }}
          onKeyDown={alTeclear}
          placeholder={t('admin.buscar.placeholder')}
          className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          role="combobox"
          aria-expanded="true"
          aria-controls={listaId}
          aria-autocomplete="list"
          aria-activedescendant={planos[indiceActivo] ? idOpcion(planos[indiceActivo]) : undefined}
          aria-label={t('admin.buscar.titulo')}
        />
        <kbd className="rounded border bg-surface px-1.5 py-0.5 text-xs text-muted-foreground">
          Esc
        </kbd>
      </div>

      <div id={listaId} role="listbox" className="max-h-[60dvh] overflow-y-auto p-2">
        {grupos.length === 0 && (
          <p className="px-3 py-10 text-center text-sm text-muted-foreground">
            {q.trim().length < 2
              ? t('admin.buscar.minimo')
              : t('admin.buscar.sinResultados', { q })}
          </p>
        )}
        {grupos.map((grupo) => (
          <div key={grupo.clave} role="group" aria-label={t(`admin.buscar.grupos.${grupo.clave}`)}>
            <p className="eyebrow px-3 pt-3 pb-1.5 text-muted-foreground">
              {t(`admin.buscar.grupos.${grupo.clave}`)}
            </p>
            {grupo.items.map((item) => {
              const seleccionado = planos[indiceActivo]?.id === item.id;
              return (
                <div
                  key={item.id}
                  id={idOpcion(item)}
                  role="option"
                  aria-selected={seleccionado}
                  onMouseEnter={() => setActivo(planos.indexOf(item))}
                  onClick={() => ir(item)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5',
                    seleccionado && 'bg-secondary',
                  )}
                >
                  <item.Icono
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="grid min-w-0 flex-1">
                    <span className="truncate text-sm font-semibold">{item.titulo}</span>
                    <span className="truncate text-xs text-muted-foreground">{item.detalle}</span>
                  </span>
                  {seleccionado && (
                    <CornerDownLeft
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p className="border-t bg-surface px-4 py-2 text-xs text-muted-foreground">
        {t('admin.buscar.ayuda')}
      </p>
    </>
  );
}

/** Búsqueda rápida del panel (Ctrl+K / ⌘K): secciones, productos, pedidos y usuarios. */
export function BusquedaRapida({ abierta, onCerrar, rol }) {
  const container = usePortalContainer();

  return (
    <DialogPrimitive.Root open={abierta} onOpenChange={(o) => !o && onCerrar()}>
      <DialogPrimitive.Portal container={container}>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            'fixed top-[12dvh] left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden',
            'rounded-2xl border bg-popover text-popover-foreground shadow-lift',
            'duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          )}
        >
          <Contenido onCerrar={onCerrar} rol={rol} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
