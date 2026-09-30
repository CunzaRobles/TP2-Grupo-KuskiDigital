import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

/**
 * Contenedor de un paso del checkout: título (recibe el foco al cambiar de paso, así el lector
 * de pantalla anuncia dónde está) y botones Volver / Continuar.
 */
export function Paso({
  titulo,
  descripcion,
  children,
  onVolver,
  onContinuar,
  textoContinuar,
  continuarDeshabilitado = false,
  cargando = false,
  iconoContinuar = <ArrowRight aria-hidden="true" />,
}) {
  const { t } = useTranslation();
  const tituloRef = useRef(null);

  useEffect(() => {
    tituloRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onContinuar?.(e.currentTarget);
      }}
      className="grid gap-6"
    >
      <header className="grid gap-2">
        <h2 ref={tituloRef} tabIndex={-1} className="text-h3 outline-none">
          {titulo}
        </h2>
        {descripcion && <p className="text-muted-foreground">{descripcion}</p>}
      </header>

      {children}

      <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        {onVolver ? (
          <Button variant="ghost" onClick={onVolver} disabled={cargando}>
            <ArrowLeft aria-hidden="true" />
            {t('checkout.volver')}
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" size="lg" loading={cargando} disabled={continuarDeshabilitado}>
          {textoContinuar ?? t('checkout.continuar')}
          {!cargando && iconoContinuar}
        </Button>
      </div>
    </form>
  );
}
