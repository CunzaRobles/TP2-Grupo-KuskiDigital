import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { i18nListo } from '@/lib/i18n';
import { Providers } from './app/providers';
import { createRouter } from './app/router';
import './styles/globals.css';

const router = createRouter();

// Con el idioma detectado ya cargado (inmediato en español; una descarga corta en EN/DE).
await i18nListo.catch(() => {});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
);
