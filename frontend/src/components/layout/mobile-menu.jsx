import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';
import { AndeanDivider } from '@/components/ui/andean-divider';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { Logo } from './logo';
import { CurrencySelect, LanguageSelect } from './preference-selects';

// Menú móvil: panel lateral con la navegación y las preferencias de idioma y moneda.
export function MobileMenu({ open, onOpenChange, enlaces }) {
  const { t } = useTranslation();
  const cerrar = () => onOpenChange(false);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="left" className="text-foreground">
        <DrawerHeader className="border-b-0">
          <DrawerTitle className="sr-only">{t('nav.menu')}</DrawerTitle>
          <DrawerDescription className="sr-only">{t('marca.lema')}</DrawerDescription>
          <Logo />
        </DrawerHeader>

        <DrawerBody className="grid content-start gap-8">
          <nav aria-label={t('nav.principal')}>
            <ul className="grid">
              {[{ to: '/', clave: 'nav.inicio', end: true }, ...enlaces].map(
                ({ to, clave, end }) => (
                  <li key={to} className="border-b">
                    <NavLink
                      to={to}
                      end={end}
                      onClick={cerrar}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center justify-between py-4 font-serif text-h3 transition-colors hover:text-link',
                          isActive && 'text-link',
                        )
                      }
                    >
                      {t(clave)}
                      <ArrowRight
                        className="size-5 -translate-x-1 opacity-0 transition duration-300 ease-andino group-hover:translate-x-0 group-hover:opacity-100"
                        aria-hidden="true"
                      />
                    </NavLink>
                  </li>
                ),
              )}
            </ul>
          </nav>

          <AndeanDivider variant="ornament" />

          <div className="grid gap-3">
            <p className="eyebrow text-muted-foreground">{t('nav.preferencias')}</p>
            <div className="flex flex-wrap gap-2">
              <LanguageSelect className="border-input bg-card" />
              <CurrencySelect className="border-input bg-card" />
            </div>
          </div>
        </DrawerBody>

        <DrawerFooter>
          <p className="text-sm text-muted-foreground">{t('marca.lema')}</p>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
