import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AndeanDivider } from '@/components/ui/andean-divider';
import { Button } from '@/components/ui/button';
import { Ilustracion } from '@/components/ui/empty-state';
import { Link } from '@/lib/motion/enlaces';

const CATEGORIAS = ['cafe', 'superalimentos', 'textiles', 'artesania'];

// 404 con la voz de la marca: explica qué pasó y ofrece caminos para seguir comprando.
export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <section className="container-page grid min-h-[70dvh] place-content-center justify-items-center gap-6 py-section text-center">
      <title>{`${t('noEncontrado.titulo')} · Kuski`}</title>
      <meta name="robots" content="noindex" />
      <div className="relative">
        <Ilustracion objeto="busqueda" className="w-64 sm:w-80" />
        <p
          className="absolute inset-x-0 -bottom-4 font-display text-display leading-none text-primary"
          aria-hidden="true"
        >
          404
        </p>
      </div>
      <AndeanDivider variant="ornament" className="mt-6 w-48" />
      <p className="eyebrow text-link">{t('noEncontrado.eyebrow')}</p>
      <h1 className="max-w-xl text-h2">{t('noEncontrado.titulo')}</h1>
      <p className="max-w-md text-muted-foreground">{t('noEncontrado.descripcion')}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link to="/catalogo">
            {t('noEncontrado.catalogo')}
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/">{t('noEncontrado.volver')}</Link>
        </Button>
      </div>
      <nav aria-label={t('noEncontrado.sugerencias')} className="grid gap-3 pt-4">
        <p className="text-sm text-muted-foreground">{t('noEncontrado.sugerencias')}</p>
        <ul className="flex flex-wrap justify-center gap-2">
          {CATEGORIAS.map((slug) => (
            <li key={slug}>
              <Link
                to={`/catalogo?categoria=${slug}`}
                className="inline-flex h-9 items-center rounded-full border px-4 text-sm font-semibold transition-colors hover:border-foreground hover:bg-secondary"
              >
                {t(`catalogo.categorias.${slug}.nombre`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
