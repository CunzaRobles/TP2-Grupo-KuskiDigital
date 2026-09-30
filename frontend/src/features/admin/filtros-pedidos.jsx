import { Search, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { banderaPais, paisesOrdenados } from '@/lib/paises';
import { ESTADOS, METODOS_PAGO } from './constantes';

const TODOS = 'todos';

// Select con opción "Todos" (Radix no admite value="").
function SelectFiltro({ label, valor, onChange, opciones }) {
  const { t } = useTranslation();
  return (
    <Field label={label}>
      {(props) => (
        <Select value={valor || TODOS} onValueChange={(v) => onChange(v === TODOS ? '' : v)}>
          <SelectTrigger size="sm" {...props}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>{t('admin.filtros.todos')}</SelectItem>
            {opciones.map((o) => (
              <SelectItem key={o.valor} value={o.valor}>
                {o.etiqueta}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </Field>
  );
}

// Buscador que aplica el filtro al enviar (Enter), no en cada tecla.
export function BuscadorFiltro({ valor, onBuscar, placeholder, label }) {
  const { t } = useTranslation();
  const [texto, setTexto] = useState(valor);
  const [anterior, setAnterior] = useState(valor);
  // Si el filtro cambia desde fuera (p. ej. "Limpiar"), el campo lo refleja.
  if (valor !== anterior) {
    setAnterior(valor);
    setTexto(valor);
  }

  return (
    <form
      role="search"
      className="grid gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        onBuscar(texto.trim());
      }}
    >
      <Field label={label ?? t('admin.filtros.buscar')}>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={placeholder}
            className="h-9 pl-9 text-sm"
            enterKeyHint="search"
          />
        </div>
      </Field>
    </form>
  );
}

/** Filtros de ventas y pedidos: texto, rango de fechas, país, estado y método de pago. */
export function FiltrosPedidos({ filtros, actualizar, limpiar, hayFiltros }) {
  const { t, i18n } = useTranslation();

  return (
    <div className="grid gap-3 rounded-xl border bg-card p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(5,minmax(0,1fr))_auto] lg:items-end">
      <BuscadorFiltro
        valor={filtros.q}
        onBuscar={(q) => actualizar({ q })}
        placeholder={t('admin.filtros.buscarPedido')}
      />
      <Field label={t('admin.filtros.desde')}>
        <Input
          type="date"
          value={filtros.desde}
          max={filtros.hasta || undefined}
          onChange={(e) => actualizar({ desde: e.target.value })}
          className="h-9 text-sm"
        />
      </Field>
      <Field label={t('admin.filtros.hasta')}>
        <Input
          type="date"
          value={filtros.hasta}
          min={filtros.desde || undefined}
          onChange={(e) => actualizar({ hasta: e.target.value })}
          className="h-9 text-sm"
        />
      </Field>
      <SelectFiltro
        label={t('admin.filtros.pais')}
        valor={filtros.pais}
        onChange={(pais) => actualizar({ pais })}
        opciones={paisesOrdenados(i18n.language).map((p) => ({
          valor: p.codigo,
          etiqueta: `${banderaPais(p.codigo)} ${p.nombre}`,
        }))}
      />
      <SelectFiltro
        label={t('admin.filtros.estado')}
        valor={filtros.estado}
        onChange={(estado) => actualizar({ estado })}
        opciones={ESTADOS.map((e) => ({ valor: e, etiqueta: t(`pedidos.estados.${e}`) }))}
      />
      <SelectFiltro
        label={t('admin.filtros.metodoPago')}
        valor={filtros.metodo_pago}
        onChange={(metodo_pago) => actualizar({ metodo_pago })}
        opciones={METODOS_PAGO.map((m) => ({ valor: m, etiqueta: t(`admin.metodosPago.${m}`) }))}
      />
      <Button variant="ghost" size="sm" onClick={limpiar} disabled={!hayFiltros}>
        <X aria-hidden="true" />
        {t('admin.filtros.limpiar')}
      </Button>
    </div>
  );
}
