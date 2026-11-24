import { CircleAlert, MessageSquareReply, Timer } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { formatDate, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useReclamacionesAdmin, useResponderReclamacion } from './api';
import { mensajeErrorAdmin as mensajeError } from './errores';
import { FilaVacia, PageHeader, PaginacionAdmin, Tabla, Td } from './ui';
import { useFiltrosUrl } from './use-filtros';

const ESTADOS = ['recibido', 'en_atencion', 'respondido'];
const VARIANTE_ESTADO = { recibido: 'outline', en_atencion: 'maiz', respondido: 'verde' };
const TODOS = 'todos';
// Con 3 días hábiles o menos, la hoja se marca como urgente.
const DIAS_URGENTE = 3;

// Fecha AAAA-MM-DD (sin hora), sin desfase por zona horaria.
const fechaDia = (iso, idioma) => formatDate(`${iso}T12:00:00`, idioma, { dateStyle: 'medium' });

function EstadoReclamacion({ estado }) {
  const { t } = useTranslation();
  return (
    <Badge variant={VARIANTE_ESTADO[estado]}>
      {t(`admin.reclamacionesPage.estados.${estado}`)}
    </Badge>
  );
}

/** Días hábiles hasta la fecha límite: en rojo y con ícono si quedan 3 o menos (o venció). */
export function DiasRestantes({ dias }) {
  const { t } = useTranslation();
  if (dias == null) {
    return <span className="text-muted-foreground">{t('admin.reclamacionesPage.respondida')}</span>;
  }
  const urgente = dias <= DIAS_URGENTE;
  const texto =
    dias < 0
      ? t('admin.reclamacionesPage.vencida', { count: -dias })
      : dias === 0
        ? t('admin.reclamacionesPage.venceHoy')
        : t('admin.reclamacionesPage.dias', { count: dias });
  const Icono = urgente ? CircleAlert : Timer;

  return (
    <span
      data-urgente={urgente || undefined}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap tabular-nums',
        urgente ? 'font-semibold text-destructive' : 'text-foreground',
      )}
    >
      <Icono className="size-4" aria-hidden="true" />
      {texto}
    </span>
  );
}

function Filtros({ filtros, actualizar, limpiar, hayFiltros }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-end gap-3">
      <Field label={t('admin.filtros.estado')} className="w-44">
        {(props) => (
          <Select
            value={filtros.estado || TODOS}
            onValueChange={(v) => actualizar({ estado: v === TODOS ? '' : v })}
          >
            <SelectTrigger size="sm" {...props}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>{t('admin.filtros.todos')}</SelectItem>
              {ESTADOS.map((estado) => (
                <SelectItem key={estado} value={estado}>
                  {t(`admin.reclamacionesPage.estados.${estado}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Field>
      <Field label={t('admin.filtros.desde')} className="w-40">
        <Input
          type="date"
          className="h-9"
          value={filtros.desde}
          max={filtros.hasta || undefined}
          onChange={(e) => actualizar({ desde: e.target.value })}
        />
      </Field>
      <Field label={t('admin.filtros.hasta')} className="w-40">
        <Input
          type="date"
          className="h-9"
          value={filtros.hasta}
          min={filtros.desde || undefined}
          onChange={(e) => actualizar({ hasta: e.target.value })}
        />
      </Field>
      {hayFiltros && (
        <Button variant="ghost" size="sm" onClick={limpiar}>
          {t('admin.filtros.limpiar')}
        </Button>
      )}
    </div>
  );
}

function Dato({ etiqueta, children }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {etiqueta}
      </dt>
      <dd className="text-sm whitespace-pre-line">{children}</dd>
    </div>
  );
}

// Pasar a "en atención" o registrar la respuesta (se envía al consumidor por correo).
function Responder({ hoja }) {
  const { t } = useTranslation();
  const responder = useResponderReclamacion();
  const [respuesta, setRespuesta] = useState('');
  const [intentado, setIntentado] = useState(false);
  const corta = respuesta.trim().length < 20;

  const aplicar = (estado) =>
    responder.mutate(
      { id: hoja.id, estado, respuesta: estado === 'respondido' ? respuesta.trim() : undefined },
      {
        onSuccess: () =>
          toast.success(t('admin.reclamacionesPage.actualizada', { codigo: hoja.codigo })),
      },
    );

  return (
    <form
      noValidate
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setIntentado(true);
        if (!corta) aplicar('respondido');
      }}
    >
      {responder.isError && <Alert variante="error" titulo={mensajeError(t, responder.error)} />}
      <Field
        label={t('admin.reclamacionesPage.respuesta')}
        hint={t('admin.reclamacionesPage.respuestaAyuda')}
        error={intentado && corta ? t('admin.reclamacionesPage.respuestaCorta') : undefined}
      >
        <Textarea
          rows={5}
          maxLength={5000}
          value={respuesta}
          onChange={(e) => setRespuesta(e.target.value)}
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          loading={responder.isPending && responder.variables?.estado === 'respondido'}
          disabled={responder.isPending}
        >
          <MessageSquareReply aria-hidden="true" />
          {t('admin.reclamacionesPage.enviarRespuesta')}
        </Button>
        {hoja.estado === 'recibido' && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => aplicar('en_atencion')}
            loading={responder.isPending && responder.variables?.estado === 'en_atencion'}
            disabled={responder.isPending}
          >
            {t('admin.reclamacionesPage.marcarEnAtencion')}
          </Button>
        )}
      </div>
    </form>
  );
}

function DetalleReclamacion({ hoja }) {
  const { t, i18n } = useTranslation();
  const idioma = i18n.language;
  const { consumidor, bien } = hoja;

  return (
    <>
      <DrawerBody className="grid content-start gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <EstadoReclamacion estado={hoja.estado} />
          <Badge variant="outline">{t(`reclamaciones.tipos.${hoja.tipo}.nombre`)}</Badge>
          <DiasRestantes dias={hoja.diasRestantes} />
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Dato etiqueta={t('admin.tabla.fecha')}>
            {formatDate(hoja.creadoEn, idioma, { dateStyle: 'long', timeStyle: 'short' })}
          </Dato>
          <Dato etiqueta={t('reclamaciones.constancia.fechaLimite')}>
            {fechaDia(hoja.fechaLimite, idioma)}
          </Dato>
          <Dato etiqueta={t('admin.reclamacionesPage.tabla.consumidor')}>
            <span className="grid">
              <span className="font-semibold">{consumidor.nombre}</span>
              <span className="text-muted-foreground">
                {t(`reclamaciones.documentos.${consumidor.tipoDocumento}`)}{' '}
                {consumidor.numeroDocumento}
              </span>
              {consumidor.menorDeEdad && (
                <span className="text-muted-foreground">
                  {t('reclamaciones.campos.apoderadoNombre')}: {consumidor.apoderadoNombre}
                </span>
              )}
            </span>
          </Dato>
          <Dato etiqueta={t('admin.reclamacionesPage.contacto')}>
            <span className="grid">
              <a href={`mailto:${consumidor.correo}`} className="text-link underline">
                {consumidor.correo}
              </a>
              <span>{consumidor.telefono}</span>
              <span className="text-muted-foreground">{consumidor.domicilio}</span>
            </span>
          </Dato>
          <Dato etiqueta={t(`reclamaciones.bienes.${bien.tipo}`)}>
            <span className="grid">
              <span>{bien.descripcion}</span>
              {bien.pedidoCodigo && (
                <span className="text-muted-foreground">
                  {t('admin.tabla.pedido')}: {bien.pedidoCodigo}
                </span>
              )}
              {bien.montoReclamado != null && (
                <span className="text-muted-foreground">
                  {formatMoney(bien.montoReclamado, 'PEN', idioma)}
                </span>
              )}
            </span>
          </Dato>
        </dl>
        <dl className="grid gap-4">
          <Dato etiqueta={t('reclamaciones.campos.detalle')}>{hoja.detalle}</Dato>
          <Dato etiqueta={t('reclamaciones.campos.pedidoConsumidor')}>{hoja.pedidoConsumidor}</Dato>
          {hoja.respuesta && (
            <Dato etiqueta={t('admin.reclamacionesPage.respuesta')}>
              <span className="grid gap-1">
                <span>{hoja.respuesta.texto}</span>
                <span className="text-xs text-muted-foreground">
                  {t('admin.reclamacionesPage.respondidaPor', {
                    nombre: hoja.respuesta.respondidoPor ?? '—',
                    fecha: formatDate(hoja.respuesta.fecha, idioma, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }),
                  })}
                </span>
              </span>
            </Dato>
          )}
        </dl>
      </DrawerBody>
      {hoja.estado !== 'respondido' && (
        <DrawerFooter>
          <Responder key={hoja.id} hoja={hoja} />
        </DrawerFooter>
      )}
    </>
  );
}

export function ReclamacionesPage() {
  const { t, i18n } = useTranslation();
  const idioma = i18n.language;
  const [params, setParams] = useSearchParams();
  const abierta = Number(params.get('id')) || null;
  const { filtros, page, actualizar, limpiar, hayFiltros, setPage } = useFiltrosUrl([
    'estado',
    'desde',
    'hasta',
  ]);
  const query = {
    page,
    estado: filtros.estado || undefined,
    desde: filtros.desde || undefined,
    hasta: filtros.hasta || undefined,
  };
  const { data, isPending, isError, error, isPlaceholderData } = useReclamacionesAdmin(query);
  const hoja = data?.items.find((r) => r.id === abierta);

  const abrir = (id) =>
    setParams((p) => {
      const n = new URLSearchParams(p);
      if (id) n.set('id', String(id));
      else n.delete('id');
      return n;
    });

  const columnas = [
    { clave: 'codigo', etiqueta: t('admin.reclamacionesPage.tabla.codigo') },
    { clave: 'fecha', etiqueta: t('admin.tabla.fecha') },
    { clave: 'tipo', etiqueta: t('admin.reclamacionesPage.tabla.tipo') },
    { clave: 'consumidor', etiqueta: t('admin.reclamacionesPage.tabla.consumidor') },
    { clave: 'estado', etiqueta: t('admin.tabla.estado') },
    { clave: 'plazo', etiqueta: t('admin.reclamacionesPage.tabla.plazo') },
    { clave: 'accion', etiqueta: <span className="sr-only">{t('admin.tabla.acciones')}</span> },
  ];

  return (
    <>
      <title>{`${t('admin.secciones.reclamaciones')} · Kuski`}</title>
      <PageHeader
        titulo={t('admin.secciones.reclamaciones')}
        descripcion={t('admin.reclamacionesPage.descripcion')}
      />
      <Filtros
        filtros={filtros}
        actualizar={actualizar}
        limpiar={limpiar}
        hayFiltros={hayFiltros}
      />
      {isError && <Alert variante="error" titulo={mensajeError(t, error)} />}

      <Tabla
        caption={t('admin.secciones.reclamaciones')}
        columnas={columnas}
        cargando={isPending}
        className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}
      >
        {data?.items.length === 0 && (
          <FilaVacia columnas={columnas.length}>{t('admin.tabla.sinResultados')}</FilaVacia>
        )}
        {data?.items.map((r) => (
          <tr key={r.id} className="hover:bg-secondary/50">
            <Td className="font-semibold whitespace-nowrap tabular-nums">{r.codigo}</Td>
            <Td className="whitespace-nowrap text-muted-foreground">
              {formatDate(r.creadoEn, idioma, { dateStyle: 'medium' })}
            </Td>
            <Td>{t(`reclamaciones.tipos.${r.tipo}.nombre`)}</Td>
            <Td>
              <span className="grid">
                <span className="font-semibold">{r.consumidor.nombre}</span>
                <span className="text-xs text-muted-foreground">{r.consumidor.correo}</span>
              </span>
            </Td>
            <Td>
              <EstadoReclamacion estado={r.estado} />
            </Td>
            <Td>
              <DiasRestantes dias={r.diasRestantes} />
            </Td>
            <Td alinear="derecha">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => abrir(r.id)}
                aria-label={`${t('admin.pedidosPage.gestionar')} ${r.codigo}`}
              >
                {t('admin.pedidosPage.gestionar')}
              </Button>
            </Td>
          </tr>
        ))}
      </Tabla>
      <PaginacionAdmin pagination={data?.pagination} onPage={setPage} />

      <Drawer open={Boolean(abierta)} onOpenChange={(o) => !o && abrir(null)}>
        <DrawerContent className="max-w-xl">
          <DrawerHeader>
            <DrawerTitle>
              {hoja
                ? t('admin.reclamacionesPage.detalleTitulo', { codigo: hoja.codigo })
                : t('admin.secciones.reclamaciones')}
            </DrawerTitle>
            <DrawerDescription>{t('admin.reclamacionesPage.detalleDescripcion')}</DrawerDescription>
          </DrawerHeader>
          {hoja ? (
            <DetalleReclamacion hoja={hoja} />
          ) : (
            <DrawerBody>
              <p className="text-muted-foreground">{t('admin.reclamacionesPage.noEncontrada')}</p>
            </DrawerBody>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
