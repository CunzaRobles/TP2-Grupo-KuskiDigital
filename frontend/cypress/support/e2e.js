// Comandos comunes de las pruebas E2E.

const API = '/api/v1';

// Cliente de prueba de los datos semilla (backend/seeders/20260929000200-usuarios.cjs).
export const MARIA = { correo: 'maria.quispe@example.com', password: 'KuskiCliente2026!' };

// Tienda en español y soles, sin carrito de invitado ni sesión previos.
Cypress.Commands.add('visitarTienda', (ruta) =>
  cy.visit(ruta, {
    onBeforeLoad(win) {
      win.localStorage.setItem('kuski.idioma', 'es');
      win.localStorage.setItem('kuski.moneda', 'PEN');
    },
  }),
);

/**
 * Deja vacío el carrito guardado de un usuario (por la API, sin pasar por la interfaz) para que
 * cada ejecución empiece igual aunque una anterior haya fallado a mitad del flujo.
 */
Cypress.Commands.add('vaciarCarritoDe', ({ correo, password }) => {
  cy.request('POST', `${API}/auth/login`, { correo, password });
  cy.request(`${API}/carrito`).then(({ body }) => {
    for (const item of body.data.items) cy.request('DELETE', `${API}/carrito/items/${item.id}`);
  });
  cy.request('POST', `${API}/auth/logout`);
  cy.clearCookies();
});

// Encabezado visible de un nivel dado con ese texto.
Cypress.Commands.add('findHeading', (nivel, texto) =>
  cy.contains(`h${nivel}`, texto).should('be.visible'),
);
