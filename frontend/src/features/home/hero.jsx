import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/motion/enlaces';
import { PerfilAltitud } from './perfil-altitud';

// Placeholder de Unsplash (verificado): Machu Picchu y el Huayna Picchu al atardecer.
const FOTO = 'https://images.unsplash.com/photo-1531065208531-4036c0dba3ca';
const ANCHOS = [480, 768, 1024, 1440];
const srcDe = (ancho) => `${FOTO}?auto=format&fit=crop&w=${ancho}&q=75`;

// Hero estático (sin parallax ni animaciones de entrada): título, un único CTA, foto y el
// perfil de altitud de las comunidades. El único momento animado de la home es el recorrido.
export function Hero() {
  const { t } = useTranslation();

  return (
    <section
      aria-labelledby="hero-titulo"
      className="container-page grid gap-10 pt-10 pb-section sm:pt-16 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-16 lg:gap-y-14"
    >
      <div className="grid content-end gap-6 lg:pb-4">
        <h1 id="hero-titulo" className="max-w-[14ch] text-display">
          {t('home.hero.titulo')}
        </h1>
        <p className="max-w-xl text-lead text-muted-foreground">{t('home.hero.descripcion')}</p>
        <div className="pt-2">
          <Button asChild size="lg">
            <Link to="/catalogo">{t('home.hero.cta')}</Link>
          </Button>
        </div>
      </div>

      <img
        src={srcDe(1024)}
        srcSet={ANCHOS.map((a) => `${srcDe(a)} ${a}w`).join(', ')}
        sizes="(min-width: 1024px) 40vw, 100vw"
        alt={t('home.hero.imagenAlt')}
        fetchPriority="high"
        decoding="async"
        className="aspect-4/3 w-full bg-muted object-cover object-[center_40%] lg:aspect-4/5"
      />

      <PerfilAltitud className="lg:col-span-2" />
    </section>
  );
}
