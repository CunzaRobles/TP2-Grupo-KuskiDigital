import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrency } from '@/lib/currency';
import { IDIOMAS } from '@/lib/format';
import { cn } from '@/lib/utils';

const trigger =
  'h-9 w-auto gap-1.5 border-transparent bg-transparent px-2.5 text-sm font-semibold shadow-none hover:bg-secondary';

export function LanguageSelect({ className }) {
  const { t, i18n } = useTranslation();

  return (
    <Select value={i18n.resolvedLanguage} onValueChange={(idioma) => i18n.changeLanguage(idioma)}>
      <SelectTrigger
        size="sm"
        aria-label={t('preferencias.idioma')}
        className={cn(trigger, className)}
      >
        <Globe className="size-4" aria-hidden="true" />
        <SelectValue>{i18n.resolvedLanguage?.toUpperCase()}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end" className="w-40">
        {IDIOMAS.map((idioma) => (
          <SelectItem key={idioma} value={idioma} lang={idioma}>
            {t(`preferencias.idiomas.${idioma}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function CurrencySelect({ className }) {
  const { t } = useTranslation();
  const { moneda, setMoneda, monedas } = useCurrency();

  return (
    <Select value={moneda} onValueChange={setMoneda}>
      <SelectTrigger
        size="sm"
        aria-label={t('preferencias.moneda')}
        className={cn(trigger, className)}
      >
        <SelectValue>{moneda}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end" className="w-44">
        {monedas.map((codigo) => (
          <SelectItem key={codigo} value={codigo}>
            {codigo} · {t(`preferencias.monedas.${codigo}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
