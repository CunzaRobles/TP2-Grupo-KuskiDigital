import { useTranslation } from 'react-i18next';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { NavLink } from '@/lib/motion/enlaces';
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
                          'flex items-center py-4 font-heading text-h3 font-semibold transition-colors hover:text-link',
                          isActive && 'text-link',
                        )
                      }
                    >
                      {t(clave)}
                    </NavLink>
                  </li>
                ),
              )}
            </ul>
          </nav>

          <div className="grid gap-3">
            <p className="text-sm font-semibold text-muted-foreground">{t('nav.preferencias')}</p>
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
