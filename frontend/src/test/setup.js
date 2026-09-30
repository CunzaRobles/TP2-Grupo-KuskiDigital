import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';

// Las pruebas en entorno node (p. ej. tokens.test.js) no tienen DOM ni i18n.
const hayDom = typeof window !== 'undefined';

if (hayDom) {
  // jsdom no implementa IntersectionObserver (lo usa useInView de Motion). El stub nunca
  // notifica: lo que depende de entrar en pantalla (p. ej. el mapa) no se monta en las pruebas.
  window.IntersectionObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };

  // Tampoco implementa ResizeObserver (lo usan RadioGroup y Checkbox de Radix).
  window.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  const { default: i18n } = await import('@/lib/i18n');
  const { cleanup } = await import('@testing-library/react');

  beforeEach(async () => {
    await i18n.changeLanguage('es');
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });
}
