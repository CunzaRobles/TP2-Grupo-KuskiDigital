import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const limitar = (n, min, max) => Math.min(max, Math.max(min, n));

/**
 * Selector de cantidad accesible: botones − / + (≥ 36 px) y campo editable.
 * `max` suele ser el stock disponible.
 */
export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
  disabled = false,
  className,
  label,
}) {
  const { t } = useTranslation();
  const [borrador, setBorrador] = useState(null);

  const confirmar = (texto) => {
    const n = parseInt(texto, 10);
    setBorrador(null);
    if (Number.isFinite(n) && n !== value) onChange(limitar(n, min, max));
  };

  const boton =
    'inline-flex items-center justify-center text-foreground transition-colors duration-200 hover:bg-secondary disabled:pointer-events-none disabled:opacity-40';
  const dim = size === 'sm' ? 'size-9' : 'size-11';

  return (
    <div
      data-slot="quantity-selector"
      className={cn(
        'inline-flex items-center overflow-hidden rounded-field border border-input bg-card',
        disabled && 'opacity-50',
        className,
      )}
    >
      <button
        type="button"
        className={cn(boton, dim)}
        onClick={() => onChange(limitar(value - 1, min, max))}
        disabled={disabled || value <= min}
        aria-label={t('ui.disminuir')}
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={label ?? t('ui.cantidad')}
        className="w-10 rounded-item bg-transparent text-center font-semibold tabular-nums"
        value={borrador ?? value}
        disabled={disabled}
        onChange={(e) => setBorrador(e.target.value.replace(/\D/g, ''))}
        onBlur={(e) => confirmar(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') confirmar(e.currentTarget.value);
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            onChange(limitar(value + 1, min, max));
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            onChange(limitar(value - 1, min, max));
          }
        }}
      />
      <button
        type="button"
        className={cn(boton, dim)}
        onClick={() => onChange(limitar(value + 1, min, max))}
        disabled={disabled || value >= max}
        aria-label={t('ui.aumentar')}
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
