import { CreditCard, Lock, Smartphone, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioCard, RadioCardGroup } from '@/components/ui/radio-card';
import { useCurrency } from '@/lib/currency';
import { useValidacion } from '@/lib/formulario';
import { cn } from '@/lib/utils';
import { Paso } from './paso';
import { METODOS_PAGO, METODOS_SOLO_PEN, validacionPago } from './schemas';
import {
  detectarMarca,
  formatearNumero,
  formatearVencimiento,
  largoCvv,
  soloDigitos,
} from './tarjeta';
import { TarjetaVisual } from './tarjeta-visual';

const ICONOS = { tarjeta: CreditCard, paypal: Wallet, yape: Smartphone, plin: Smartphone };

function FormularioTarjeta({ tarjeta, errores, onCambiar }) {
  const { t } = useTranslation();
  const marca = detectarMarca(tarjeta.numero);
  const error = (campo) => errores[campo] && t(errores[campo]);
  const cambiar = (campo, valor) => onCambiar({ tarjeta: { ...tarjeta, [campo]: valor } });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-center">
      <TarjetaVisual tarjeta={tarjeta} />
      <div className="grid gap-4">
        <Field
          label={t('checkout.pago.tarjeta.numero')}
          error={error('numero')}
          hint={
            marca && t('checkout.pago.tarjeta.marca', { marca: t(`checkout.pago.marcas.${marca}`) })
          }
        >
          <Input
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="1234 5678 9012 3456"
            value={formatearNumero(tarjeta.numero)}
            onChange={(e) => cambiar('numero', soloDigitos(e.target.value))}
            className="font-mono tabular-nums"
          />
        </Field>
        <Field label={t('checkout.pago.tarjeta.titular')} error={error('titular')}>
          <Input
            autoComplete="cc-name"
            value={tarjeta.titular}
            onChange={(e) => cambiar('titular', e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('checkout.pago.tarjeta.vencimiento')} error={error('vencimiento')}>
            <Input
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/AA"
              maxLength={5}
              value={tarjeta.vencimiento}
              onChange={(e) =>
                cambiar('vencimiento', formatearVencimiento(e.target.value, tarjeta.vencimiento))
              }
            />
          </Field>
          <Field label={t('checkout.pago.tarjeta.cvv')} error={error('cvv')}>
            <Input
              type="password"
              inputMode="numeric"
              autoComplete="cc-csc"
              maxLength={largoCvv(marca)}
              placeholder={marca === 'amex' ? '1234' : '123'}
              value={tarjeta.cvv}
              onChange={(e) => cambiar('cvv', soloDigitos(e.target.value))}
            />
          </Field>
        </div>
        <p className="rounded-lg bg-surface p-3 text-xs text-muted-foreground">
          {t('checkout.pago.tarjeta.prueba')}
        </p>
      </div>
    </div>
  );
}

function FormularioPaypal({ correo, errores, onCambiar }) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-4">
      <Field
        label={t('checkout.pago.paypal.correo')}
        error={errores.correoPaypal && t(errores.correoPaypal)}
      >
        <Input
          type="email"
          autoComplete="email"
          value={correo}
          onChange={(e) => onCambiar({ correoPaypal: e.target.value })}
        />
      </Field>
      <p className="text-sm text-muted-foreground">{t('checkout.pago.paypal.nota')}</p>
    </div>
  );
}

function FormularioCelular({ metodo, telefono, errores, onCambiar }) {
  const { t } = useTranslation();
  const nombre = t(`checkout.pago.metodos.${metodo}`);
  return (
    <div className="grid gap-4">
      <Field
        label={t('checkout.pago.celular.label', { app: nombre })}
        hint={t('checkout.pago.celular.ayuda')}
        error={errores.telefono && t(errores.telefono)}
      >
        <Input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="987 654 321"
          value={telefono}
          onChange={(e) => onCambiar({ telefono: e.target.value })}
        />
      </Field>
      <p className="text-sm text-muted-foreground">
        {t('checkout.pago.celular.nota', { app: nombre })}
      </p>
    </div>
  );
}

/**
 * Paso 3 · Pago (simulado): tarjeta, PayPal, Yape o Plin. Yape y Plin operan solo en soles:
 * con otra moneda se ofrecen deshabilitados, con un atajo para pagar en PEN.
 */
export function PasoPago({ pago, rechazo, onCambiar, onVolver, onContinuar }) {
  const { t } = useTranslation();
  const { moneda, setMoneda } = useCurrency();
  const soloPenNoDisponible = moneda !== 'PEN';
  const metodoValido =
    pago.metodo && !(soloPenNoDisponible && METODOS_SOLO_PEN.includes(pago.metodo));
  const [schema, valores] = validacionPago(pago);
  const { errores, comprobar } = useValidacion(schema, valores);

  const continuar = (formulario) => {
    if (!metodoValido) return;
    const datos = comprobar(formulario);
    if (datos) onContinuar(datos);
  };

  return (
    <Paso
      titulo={t('checkout.pago.titulo')}
      descripcion={t('checkout.pago.descripcion')}
      onVolver={onVolver}
      onContinuar={continuar}
      continuarDeshabilitado={!metodoValido}
      textoContinuar={t('checkout.pago.continuar')}
    >
      {rechazo && (
        <Alert variante="error" titulo={t('checkout.pago.rechazado.titulo')}>
          <p>{rechazo.mensaje}</p>
          {rechazo.numeroOperacion && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t('checkout.pago.rechazado.operacion', { numero: rechazo.numeroOperacion })}
            </p>
          )}
          <p className="mt-1">{t('checkout.pago.rechazado.ayuda')}</p>
        </Alert>
      )}

      <RadioCardGroup
        value={pago.metodo ?? ''}
        onValueChange={(metodo) => onCambiar({ metodo })}
        aria-label={t('checkout.pago.elegir')}
        className="grid-cols-2 lg:grid-cols-4"
      >
        {METODOS_PAGO.map((metodo) => {
          const Icono = ICONOS[metodo];
          const deshabilitado = soloPenNoDisponible && METODOS_SOLO_PEN.includes(metodo);
          return (
            <RadioCard
              key={metodo}
              value={metodo}
              disabled={deshabilitado}
              className="items-center"
            >
              <span className="flex items-center gap-2 font-semibold">
                <Icono className="size-4 text-verde" aria-hidden="true" />
                {t(`checkout.pago.metodos.${metodo}`)}
              </span>
              {deshabilitado && (
                <span className="text-xs text-muted-foreground">{t('checkout.pago.soloPen')}</span>
              )}
            </RadioCard>
          );
        })}
      </RadioCardGroup>

      {soloPenNoDisponible && (
        <Alert
          variante="info"
          titulo={t('checkout.pago.yapeSoles.titulo')}
          accion={
            <Button variant="secondary" size="sm" onClick={() => setMoneda('PEN')}>
              {t('checkout.pago.yapeSoles.accion')}
            </Button>
          }
        >
          {t('checkout.pago.yapeSoles.detalle', { moneda })}
        </Alert>
      )}

      <div className={cn(!metodoValido && 'hidden')}>
        {pago.metodo === 'tarjeta' && (
          <FormularioTarjeta tarjeta={pago.tarjeta} errores={errores} onCambiar={onCambiar} />
        )}
        {pago.metodo === 'paypal' && (
          <FormularioPaypal correo={pago.correoPaypal} errores={errores} onCambiar={onCambiar} />
        )}
        {(pago.metodo === 'yape' || pago.metodo === 'plin') && (
          <FormularioCelular
            metodo={pago.metodo}
            telefono={pago.telefono}
            errores={errores}
            onCambiar={onCambiar}
          />
        )}
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="size-3.5" aria-hidden="true" />
        {t('checkout.pago.seguro')}
      </p>
    </Paso>
  );
}
