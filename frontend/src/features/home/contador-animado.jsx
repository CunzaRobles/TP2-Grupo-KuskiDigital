import { animate, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { EASE_ANDINO } from '@/lib/motion';
import { formatNumber } from '@/lib/format';

/**
 * Cifra que cuenta desde 0 la primera vez que entra en pantalla. Escribe directo en el DOM
 * (sin re-render por cuadro). El lector de pantalla recibe siempre el valor final.
 */
export function ContadorAnimado({ valor, className }) {
  const { i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const ref = useRef(null);
  const enVista = useInView(ref, { once: true, margin: '0px 0px -15% 0px' });
  const reducirMovimiento = useReducedMotion();
  const final = formatNumber(valor, idioma);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enVista) return;
    if (reducirMovimiento) {
      el.textContent = final;
      return;
    }
    const controles = animate(0, valor, {
      duration: 1.4,
      ease: EASE_ANDINO,
      onUpdate: (v) => {
        el.textContent = formatNumber(Math.round(v), idioma);
      },
    });
    return () => controles.stop();
  }, [enVista, reducirMovimiento, valor, idioma, final]);

  return (
    <span className={className}>
      <span ref={ref} aria-hidden="true" className="tabular-nums">
        {reducirMovimiento ? final : formatNumber(0, idioma)}
      </span>
      <span className="sr-only">{final}</span>
    </span>
  );
}
