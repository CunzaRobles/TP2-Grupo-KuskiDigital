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

  // Ni matchMedia, que GSAP consulta al importarse (y useReducedMotion al renderizar). Sin
  // preferencias: movimiento completo. Las pruebas pueden reemplazarla para simular otra.
  window.matchMedia ??= (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  });

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
