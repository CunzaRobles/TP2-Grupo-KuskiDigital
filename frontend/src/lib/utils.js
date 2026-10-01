import { clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// tailwind-merge no conoce las escalas propias de tokens.css: sin esto trata `text-h3` como un
// color (y lo descarta ante `text-link`), no reemplaza `shadow-soft` con `shadow-none` ni
// `rounded-field` con `rounded-none`.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      shadow: [
        'soft',
        'card',
        'lift',
        'drawer',
        'field',
        'surface',
        'surface-hover',
        'overlay',
        'sheet',
      ],
      radius: ['item', 'field', 'button', 'surface', 'popover', 'dialog'],
      text: ['display', 'h1', 'h2', 'h3', 'h4', 'lead', 'eyebrow'],
    },
  },
});

// Combina clases condicionales y resuelve conflictos de Tailwind (convención de shadcn/ui).
export const cn = (...inputs) => twMerge(clsx(inputs));
