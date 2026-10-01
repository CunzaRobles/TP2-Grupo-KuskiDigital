import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { EASE_ANDINO } from '@/lib/motion';

// Placeholder de Unsplash (verificado): Machu Picchu y el Huayna Picchu al atardecer.
const FOTO = 'https://images.unsplash.com/photo-1531065208531-4036c0dba3ca';
const ANCHOS = [768, 1280, 1920, 2560];
const srcDe = (ancho) => `${FOTO}?auto=format&fit=crop&w=${ancho}&q=75`;

const entrada = {
  oculto: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE_ANDINO, delay: 0.15 + i * 0.1 },
  }),
};

// El título es el elemento LCP del home: solo se desliza, sin partir de opacidad 0 (el
// navegador no cuenta un elemento invisible como pintado y el LCP se retrasaría).
const entradaTitulo = {
  oculto: { y: 24 },
  visible: { y: 0, transition: { duration: 0.4, ease: EASE_ANDINO, delay: 0.1 } },
};

// Hero a pantalla completa (queda debajo del header transparente) con parallax leve y un solo CTA.
export function Hero() {
  const { t } = useTranslation();
  const ref = useRef(null);
  const reducirMovimiento = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);

  return (
    <section
      ref={ref}
      aria-labelledby="hero-titulo"
      className="relative isolate flex min-h-dvh items-end overflow-hidden bg-cafe text-alpaca"
    >
      <motion.div
        className="absolute inset-x-0 -top-[5%] -z-20 h-[115%]"
        style={reducirMovimiento ? undefined : { y }}
      >
        <img
          src={srcDe(1920)}
          srcSet={ANCHOS.map((a) => `${srcDe(a)} ${a}w`).join(', ')}
          sizes="100vw"
          alt={t('home.hero.imagenAlt')}
          fetchPriority="high"
          decoding="async"
          className="size-full object-cover object-[center_40%]"
        />
      </motion.div>
      {/* Velo café: legibilidad AA del texto claro sobre cualquier zona de la foto */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-t from-cafe via-cafe/55 to-cafe/25"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-r from-cafe/60 via-transparent to-transparent"
      />
      {/* Franja superior más oscura: legibilidad del header transparente sobre el cielo */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-48 bg-linear-to-b from-cafe/60 to-transparent"
      />

      <div className="container-page grid gap-6 pt-40 pb-16 sm:pb-24">
        <motion.p
          className="eyebrow text-maiz"
          variants={entrada}
          initial="oculto"
          animate="visible"
          custom={0}
        >
          {t('home.hero.eyebrow')}
        </motion.p>
        <motion.h1
          id="hero-titulo"
          className="max-w-4xl text-display"
          variants={entradaTitulo}
          initial="oculto"
          animate="visible"
        >
          {t('home.hero.titulo')}
        </motion.h1>
        <motion.p
          className="max-w-xl text-lead text-alpaca/85"
          variants={entrada}
          initial="oculto"
          animate="visible"
          custom={2}
        >
          {t('home.hero.descripcion')}
        </motion.p>
        <motion.div variants={entrada} initial="oculto" animate="visible" custom={3}>
          <Button asChild size="lg" className="mt-2">
            <Link to="/catalogo">
              {t('home.hero.cta')}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
