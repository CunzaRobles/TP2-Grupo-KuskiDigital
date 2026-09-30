import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Combina clases condicionales y resuelve conflictos de Tailwind (convención de shadcn/ui).
export const cn = (...inputs) => twMerge(clsx(inputs));
