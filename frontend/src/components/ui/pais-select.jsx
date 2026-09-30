import { useTranslation } from 'react-i18next';
import { banderaPais, paisesOrdenados } from '@/lib/paises';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

/**
 * Selector de país con bandera y nombre en el idioma actual.
 * Recibe los props de <Field> (id, aria-*) para conectarse a su etiqueta y error.
 */
export function PaisSelect({ value, onValueChange, placeholder, ...controlProps }) {
  const { i18n } = useTranslation();
  const paises = paisesOrdenados(i18n.resolvedLanguage);

  return (
    <Select value={value || undefined} onValueChange={onValueChange}>
      <SelectTrigger {...controlProps}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {paises.map(({ codigo, nombre }) => (
          <SelectItem key={codigo} value={codigo}>
            <span aria-hidden="true" className="mr-2">
              {banderaPais(codigo)}
            </span>
            {nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
