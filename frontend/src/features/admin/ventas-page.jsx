import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Alert } from '@/components/ui/alert';
import { EstadoPedido } from '@/features/pedidos/tracking';
import { mensajeErrorAdmin as mensajeError } from './errores';
import { formatDate, formatMoney, formatNumber } from '@/lib/format';
import { banderaPais, nombrePais } from '@/lib/paises';
import { useVentas } from './api';
import { aQueryPedidos, CLAVES_FILTROS_PEDIDOS } from './constantes';
import { FiltrosPedidos } from './filtros-pedidos';
import { FilaVacia, PageHeader, PaginacionAdmin, Tabla, Td } from './ui';
import { useFiltrosUrl } from './use-filtros';

function Resumen({ resumen, cargando }) {
  const { t, i18n } = useTranslation();
  const idioma = i18n.language;
  const cifras = [
    { clave: 'ingresos', valor: formatMoney(resumen?.ingresosPen, 'PEN', idioma) },
    { clave: 'ventas', valor: formatNumber(resumen?.ventas ?? 0, idioma) },
    { clave: 'ticket', valor: formatMoney(resumen?.ticketPromedioPen, 'PEN', idioma) },
    { clave: 'pedidos', valor: formatNumber(resumen?.pedidos ?? 0, idioma) },
  ];
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border shadow-soft lg:grid-cols-4">
      {cifras.map((c) => (
        <div key={c.clave} className="grid gap-1 bg-card p-4">
          <dt className="text-sm text-muted-foreground">
            {t(`admin.ventasPage.resumen.${c.clave}`)}
          </dt>
          <dd className="text-xl font-semibold tabular-nums">{cargando ? '—' : c.valor}</dd>
        </div>
      ))}
    </dl>
  );
}

export function VentasPage() {
  const { t, i18n } = useTranslation();
  const idioma = i18n.language;
  const { filtros, page, actualizar, limpiar, hayFiltros, setPage } =
    useFiltrosUrl(CLAVES_FILTROS_PEDIDOS);
  const { data, isPending, isError, error, isPlaceholderData } = useVentas(
    aQueryPedidos(filtros, page),
  );

  const columnas = [
    { clave: 'codigo', etiqueta: t('admin.tabla.pedido') },
    { clave: 'fecha', etiqueta: t('admin.tabla.fecha') },
    { clave: 'cliente', etiqueta: t('admin.tabla.cliente') },
    { clave: 'pais', etiqueta: t('admin.tabla.pais') },
    { clave: 'pago', etiqueta: t('admin.tabla.pago') },
    { clave: 'estado', etiqueta: t('admin.tabla.estado') },
    { clave: 'total', etiqueta: t('admin.tabla.totalPen'), alinear: 'derecha' },
  ];

  return (
    <>
      <title>{`${t('admin.secciones.ventas')} · Kuski`}</title>
      <PageHeader
        titulo={t('admin.secciones.ventas')}
        descripcion={t('admin.ventasPage.descripcion')}
      />
      <FiltrosPedidos
        filtros={filtros}
        actualizar={actualizar}
        limpiar={limpiar}
        hayFiltros={hayFiltros}
      />
      {isError && <Alert variante="error" titulo={mensajeError(t, error)} />}
      <Resumen resumen={data?.resumen} cargando={isPending} />

      <Tabla
        caption={t('admin.secciones.ventas')}
        columnas={columnas}
        cargando={isPending}
        className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}
      >
        {data?.items.length === 0 && (
          <FilaVacia columnas={columnas.length}>{t('admin.tabla.sinResultados')}</FilaVacia>
        )}
        {data?.items.map((v) => (
          <tr key={v.codigo} className="hover:bg-secondary/50">
            <Td>
              <Link
                to={`/admin/pedidos?codigo=${v.codigo}`}
                className="font-semibold text-link hover:underline"
              >
                {v.codigo}
              </Link>
            </Td>
            <Td className="whitespace-nowrap text-muted-foreground">
              {formatDate(v.creadoEn, idioma, { dateStyle: 'medium', timeStyle: 'short' })}
            </Td>
            <Td>
              <span className="grid">
                <span className="font-semibold">{v.cliente?.nombre}</span>
                <span className="text-xs text-muted-foreground">{v.cliente?.correo}</span>
              </span>
            </Td>
            <Td className="whitespace-nowrap">
              <span aria-hidden="true">{banderaPais(v.paisCodigo)}</span>{' '}
              {nombrePais(v.paisCodigo, idioma)}
            </Td>
            <Td className="whitespace-nowrap">
              {v.pago ? t(`admin.metodosPago.${v.pago.metodo}`) : '—'}
            </Td>
            <Td>
              <EstadoPedido estado={v.estado} />
            </Td>
            <Td alinear="derecha">
              <span className="grid">
                <span className="font-semibold">{formatMoney(v.totalPen, 'PEN', idioma)}</span>
                {v.moneda !== 'PEN' && (
                  <span className="text-xs text-muted-foreground">
                    {formatMoney(v.totalMoneda, v.moneda, idioma)}
                  </span>
                )}
              </span>
            </Td>
          </tr>
        ))}
      </Tabla>
      <PaginacionAdmin pagination={data?.pagination} onPage={setPage} />
    </>
  );
}
