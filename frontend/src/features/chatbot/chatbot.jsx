import { MessageCircle, SendHorizontal, X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/lib/http';
import { Link } from '@/lib/motion/enlaces';
import { usePortalContainer } from '@/lib/portal-container';
import { cn } from '@/lib/utils';
import { useMensajeChatbot } from './api';

const MAX_CARACTERES = 300;
const SUGERENCIAS_INICIALES = ['envio', 'pedido', 'pago', 'asesor'];

const CLASE_ENLACE =
  'font-semibold text-link underline decoration-1 underline-offset-4 hover:decoration-2';

// Enlace de una respuesta: rutas de la tienda con el router (y se cierra el panel); WhatsApp y
// correo, fuera de la tienda.
function EnlaceRespuesta({ enlace, onNavegar }) {
  if (enlace.url.startsWith('/')) {
    return (
      <Link to={enlace.url} onClick={onNavegar} className={CLASE_ENLACE}>
        {enlace.texto}
      </Link>
    );
  }
  const externo = enlace.url.startsWith('http');
  return (
    <a
      href={enlace.url}
      className={CLASE_ENLACE}
      {...(externo && { target: '_blank', rel: 'noreferrer' })}
    >
      {enlace.texto}
    </a>
  );
}

function Mensaje({ mensaje, onNavegar }) {
  const { t } = useTranslation();
  const delUsuario = mensaje.autor === 'usuario';

  return (
    <li className={cn('flex', delUsuario ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'grid max-w-[85%] gap-2 rounded-surface px-3.5 py-2.5 text-sm leading-relaxed',
          delUsuario
            ? 'bg-foreground text-background'
            : 'border border-border bg-surface text-foreground',
          mensaje.error && 'border-destructive/40 text-destructive',
        )}
      >
        <p className="whitespace-pre-line">
          <span className="sr-only">{delUsuario ? t('chatbot.tu') : t('chatbot.asistente')}: </span>
          {mensaje.texto}
        </p>
        {mensaje.enlaces?.length > 0 && (
          <ul className="grid gap-1">
            {mensaje.enlaces.map((enlace) => (
              <li key={enlace.url}>
                <EnlaceRespuesta enlace={enlace} onNavegar={onNavegar} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

// Tres puntos mientras llega la respuesta (estáticos con movimiento reducido).
function Escribiendo() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
      <span className="flex gap-1" aria-hidden="true">
        {[0, 150, 300].map((retraso) => (
          <span
            key={retraso}
            className="size-1.5 animate-pulse rounded-full bg-muted-foreground motion-reduce:animate-none"
            style={{ animationDelay: `${retraso}ms` }}
          />
        ))}
      </span>
      {t('chatbot.escribiendo')}
    </div>
  );
}

/**
 * Asistente virtual de la tienda: botón flotante (abajo a la derecha) que abre un panel de chat.
 * El historial vive en memoria mientras dure la visita (el layout no se desmonta al navegar).
 * Panel modal de Radix: foco atrapado, Esc cierra y el foco vuelve al botón. Las respuestas se
 * anuncian con role="log" (aria-live polite). Va por debajo de drawers y diálogos (z-30), así
 * nunca tapa el botón de pago del carrito.
 */
export function Chatbot() {
  const { t, i18n } = useTranslation();
  const container = usePortalContainer();
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const siguienteId = useRef(1);
  const lista = useRef(null);
  const campo = useRef(null);
  const consulta = useMensajeChatbot();

  // Lleva la conversación al último mensaje (sin desplazamiento suave)
  useEffect(() => {
    if (lista.current) lista.current.scrollTop = lista.current.scrollHeight;
  }, [mensajes, consulta.isPending, abierto]);

  const agregar = (mensaje) =>
    setMensajes((actuales) => [...actuales, { id: siguienteId.current++, ...mensaje }]);

  const enviar = (contenido) => {
    const mensaje = contenido.trim().slice(0, MAX_CARACTERES);
    if (!mensaje || consulta.isPending) return;
    agregar({ autor: 'usuario', texto: mensaje });
    setTexto('');
    // El foco vuelve al campo (también si se envió con un chip o con el botón)
    campo.current?.focus();
    consulta.mutate(
      { mensaje, idioma: i18n.resolvedLanguage ?? 'es' },
      {
        onSuccess: (respuesta) => agregar({ autor: 'bot', ...respuesta }),
        onError: (error) =>
          agregar({
            autor: 'bot',
            error: true,
            texto:
              error instanceof ApiError && error.code === 'RATE_LIMITED'
                ? t('chatbot.errorLimite')
                : t('chatbot.error'),
          }),
      },
    );
  };

  const ultimoBot = mensajes.findLast((m) => m.autor === 'bot' && !m.error);
  const sugerencias =
    ultimoBot?.sugerencias?.length > 0
      ? ultimoBot.sugerencias
      : SUGERENCIAS_INICIALES.map((clave) => t(`chatbot.sugerencias.${clave}`));

  return (
    <DialogPrimitive.Root open={abierto} onOpenChange={setAbierto}>
      <DialogPrimitive.Trigger
        aria-label={t(abierto ? 'chatbot.cerrar' : 'chatbot.abrir')}
        className={cn(
          'fixed right-4 bottom-4 z-30 inline-flex size-14 items-center justify-center rounded-full sm:right-6 sm:bottom-6',
          'bg-primary text-primary-foreground shadow-overlay ring-2 ring-niebla transition-colors duration-200 ease-andino hover:bg-primary-hover',
          'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring print:hidden',
        )}
      >
        {abierto ? (
          <X className="size-6" aria-hidden="true" />
        ) : (
          <MessageCircle className="size-6" aria-hidden="true" />
        )}
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal container={container}>
        <DialogPrimitive.Content
          data-slot="chatbot"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            campo.current?.focus();
          }}
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex h-[min(85dvh,40rem)] flex-col border border-border bg-popover text-popover-foreground shadow-overlay',
            'rounded-t-dialog sm:inset-x-auto sm:right-6 sm:bottom-24 sm:h-[min(36rem,calc(100dvh-8rem))] sm:w-[24rem] sm:rounded-dialog',
            'duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 motion-reduce:animate-none',
          )}
        >
          <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
            <div className="grid gap-0.5">
              <DialogPrimitive.Title className="font-display text-base font-medium">
                {t('chatbot.titulo')}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-xs text-muted-foreground">
                {t('chatbot.descripcion')}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              aria-label={t('chatbot.cerrar')}
              className="-mr-1.5 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <X className="size-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          </header>

          <div
            ref={lista}
            className="grid flex-1 content-start gap-3 overflow-y-auto overscroll-contain p-4"
          >
            <ol
              role="log"
              aria-live="polite"
              aria-label={t('chatbot.conversacion')}
              aria-busy={consulta.isPending || undefined}
              className="grid gap-3"
            >
              <Mensaje mensaje={{ autor: 'bot', texto: t('chatbot.bienvenida') }} />
              {mensajes.map((m) => (
                <Mensaje key={m.id} mensaje={m} onNavegar={() => setAbierto(false)} />
              ))}
            </ol>
            {consulta.isPending && <Escribiendo />}
          </div>

          <div className="grid gap-3 border-t border-border p-3">
            <ul aria-label={t('chatbot.sugerenciasTitulo')} className="flex flex-wrap gap-2">
              {sugerencias.map((sugerencia) => (
                <li key={sugerencia}>
                  <button
                    type="button"
                    onClick={() => enviar(sugerencia)}
                    aria-disabled={consulta.isPending || undefined}
                    className="min-h-9 rounded-full border border-input bg-card px-3 py-1.5 text-left text-xs font-semibold transition-colors hover:border-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-disabled:opacity-50"
                  >
                    {sugerencia}
                  </button>
                </li>
              ))}
            </ul>
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                enviar(texto);
              }}
            >
              <label htmlFor="chatbot-mensaje" className="sr-only">
                {t('chatbot.campo')}
              </label>
              <input
                id="chatbot-mensaje"
                ref={campo}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                maxLength={MAX_CARACTERES}
                autoComplete="off"
                placeholder={t('chatbot.placeholder')}
                className="h-11 min-w-0 flex-1 rounded-field border border-input bg-card px-3.5 text-base text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring sm:text-sm"
              />
              <button
                type="submit"
                aria-label={t('chatbot.enviar')}
                disabled={!texto.trim() || consulta.isPending}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
              >
                <SendHorizontal className="size-5" aria-hidden="true" />
              </button>
            </form>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
