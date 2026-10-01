// Mientras se descarga una ruta diferida en la primera carga (admin, /design, checkout…).
// React Router lo pide como HydrateFallback; sin él avisa en consola.
export function CargaInicial() {
  return <div className="min-h-dvh bg-background" aria-busy="true" />;
}
