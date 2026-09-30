import { MARIA } from '../support/e2e';

/**
 * CP-090 · Compra completa de un cliente.
 * Catálogo → producto → carrito → login → checkout (4 pasos) → confirmación.
 * Historia de María Quispe: compra desde Cusco, en soles, y paga con Yape.
 *
 * Usa la API y la base de datos reales: crea un pedido de prueba y descuenta 1 unidad de stock.
 */
describe('CP-090 · Compra completa: catálogo → producto → carrito → login → checkout → confirmación', () => {
  beforeEach(() => {
    cy.vaciarCarritoDe(MARIA);
  });

  it('María compra un producto con Yape y ve la confirmación con su tracking', () => {
    // 1. Catálogo: abre el primer producto con stock
    cy.visitarTienda('/catalogo');
    cy.findHeading(1, 'Todo el catálogo');
    // Espera a que la grilla termine de cargar (sin skeletons ni resultados atenuados)
    cy.get('main ul[aria-busy]').should('not.exist');
    cy.get('main ul li article')
      .not(':contains("Agotado")')
      .first()
      .find('h3 a')
      .then(($enlace) => {
        cy.wrap($enlace.text()).as('producto');
        cy.wrap($enlace).click();
      });

    // 2. Ficha de producto: agrega al carrito (se abre el drawer)
    cy.location('pathname').should('match', /^\/producto\//);
    cy.get('@producto').then((nombre) => {
      cy.get('h1').should('have.text', nombre);
    });
    cy.contains('button', 'Agregar al carrito').click();
    cy.get('[role="dialog"]').within(() => {
      cy.contains('h2', 'Tu carrito');
      cy.contains('a', 'Ver resumen del carrito').click();
    });

    // 3. Carrito: resumen sin costos ocultos y paso al checkout
    cy.location('pathname').should('eq', '/carrito');
    cy.get('@producto').then((nombre) => {
      cy.contains('main a', nombre).should('be.visible');
    });
    cy.contains('Se calcula en el checkout');
    cy.contains('a', 'Continuar con la compra').click();

    // 4. Login: el checkout exige sesión y vuelve a él al iniciarla
    cy.location('pathname').should('eq', '/login');
    cy.location('search').should('eq', '?redirect=%2Fcheckout');
    cy.get('input[type="email"]').type(MARIA.correo);
    cy.get('input[autocomplete="current-password"]').type(MARIA.password, { log: false });
    cy.contains('button[type="submit"]', 'Iniciar sesión').click();

    // 5. Checkout · Envío: la dirección principal de María (Cusco) viene elegida
    cy.location('pathname').should('eq', '/checkout');
    cy.findHeading(2, '¿A dónde enviamos tu pedido?');
    cy.get('[role="radio"][data-state="checked"]').should('contain', 'Cusco');
    cy.get('section[aria-labelledby="resumen-pedido"]').within(() => {
      cy.get('@producto').then((nombre) => cy.contains(nombre));
      cy.contains('IGV (18 %)');
      cy.contains('Elige el país para ver el total').should('not.exist');
    });
    cy.contains('button', 'Continuar al método de envío').click();

    // 6. Método de envío: opciones con precio y días visibles
    cy.findHeading(2, 'Elige cómo quieres recibirlo');
    cy.get('[role="radio"]').should('have.length', 2);
    cy.contains('[role="radio"]', 'Estándar').should('contain', 'días').and('contain', 'S/');
    cy.contains('[role="radio"]', 'Estándar').click();
    cy.contains('button', /^Continuar$/).click();

    // 7. Pago con Yape
    cy.findHeading(2, '¿Cómo quieres pagar?');
    cy.contains('[role="radio"]', 'Yape').click();
    cy.get('input[type="tel"]').type('987654321');
    cy.contains('button', 'Revisar el pedido').click();

    // 8. Confirmar: repaso y pago con estado "procesando"
    cy.findHeading(2, 'Revisa y confirma tu pedido');
    cy.contains('Yape · 987 *** 321');
    cy.contains('button', /^Pagar S\//).click();
    cy.contains('[role="dialog"]', 'Procesando tu pago').should('be.visible');

    // 9. Confirmación: código del pedido, código de aprobación de Yape y tracking
    cy.location('pathname', { timeout: 20_000 }).should('match', /^\/pedido\/KD-\d{6,}$/);
    cy.findHeading(1, '¡Gracias, María! Tu pedido está confirmado');
    cy.get('[data-testid="codigo-pedido"]')
      .invoke('text')
      .should('match', /^KD-\d{6,}$/);
    cy.get('[data-testid="codigo-aprobacion"]')
      .invoke('text')
      .should('match', /^\d{6}$/);
    cy.get('section[aria-labelledby="tracking-titulo"]').within(() => {
      cy.get('[aria-current="step"]').should('contain', 'Confirmado');
      cy.contains('Preparando');
      cy.contains('En tránsito');
      cy.contains('Entregado');
    });

    // El carrito quedó vacío y el pedido aparece en "Mis pedidos"
    cy.get('[data-testid="codigo-pedido"]')
      .invoke('text')
      .then((codigo) => {
        cy.get('button[aria-label^="Abrir carrito"]').should(
          'have.attr',
          'aria-label',
          'Abrir carrito, 0 productos',
        );
        cy.contains('a', 'Ver mis pedidos').click();
        cy.location('pathname').should('eq', '/cuenta');
        cy.contains('article', codigo).should('contain', 'Confirmado');
      });
  });
});
