# Casos de prueba — Pruebas unitarias (Sprints 1 y 2)

Guía Práctica 07. Cada caso es un `it()` cuyo nombre empieza con su ID y sigue la estructura Arrange-Act-Assert. Ninguna prueba se conecta a Supabase ni modifica datos:

- **Sprint 1 (UT-01 a UT-10):** funciones independientes, sin red ni base de datos.
- **Sprint 2 (UT-11 a UT-24):** lógica de negocio y CRUD con dobles de prueba (`vi.fn`, `vi.mock`, `vi.spyOn`). Los repositorios y `withTransaction` están simulados en `backend/tests/setup/mock-repositories.js`; cada archivo prepara datos limpios en `beforeEach` y llama a `vi.clearAllMocks()` entre casos.

Ejecución: `npm run test:coverage` (raíz) el 2026-10-01: **488/488 pruebas aprobadas** (frontend 169/169 en 29.6 s, backend 319/319 en 5.6 s). Cobertura de líneas de `backend/src/services`: **97.5 %**.

## Sprint 1 — Funciones independientes

| ID    | Archivo                                        | Nombre del `it()`                                                       | Resultado |
| ----- | ---------------------------------------------- | ----------------------------------------------------------------------- | --------- |
| UT-01 | `backend/tests/unit/checkout.calculos.test.js` | UT-01: calcula IGV del 18% para Perú                                    | ✅ Pasa   |
| UT-02 | `backend/tests/unit/checkout.calculos.test.js` | UT-02: no cobra IGV a un envío a Alemania                               | ✅ Pasa   |
| UT-03 | `backend/tests/unit/exchange.test.js`          | UT-03: convierte 100.00 PEN a USD con 1 USD = 3.75 PEN (26.67)          | ✅ Pasa   |
| UT-04 | `backend/tests/unit/exchange.test.js`          | UT-04: convertir 100.00 PEN a PEN devuelve el mismo monto               | ✅ Pasa   |
| UT-05 | `backend/tests/unit/shipping.test.js`          | UT-05: asigna la zona de envío según el país (PE, BR, US, DE, JP)       | ✅ Pasa   |
| UT-06 | `backend/tests/unit/shipping.test.js`          | UT-06: express a Europa de 550 g cuesta 203.00 (170 + 60/kg)            | ✅ Pasa   |
| UT-07 | `backend/tests/unit/checkout.calculos.test.js` | UT-07: suma subtotal y envío sin IGV para Alemania (total 458.00)       | ✅ Pasa   |
| UT-08 | `backend/tests/unit/pedidos.utils.test.js`     | UT-08: genera el código KD-000001 para el pedido 1                      | ✅ Pasa   |
| UT-09 | `backend/tests/unit/validators.test.js`        | UT-09: rechaza el correo incompleto "maria@"                            | ✅ Pasa   |
| UT-10 | `frontend/src/lib/currency.test.js`            | UT-10: formatea 1234.5 PEN como "S/ 1,234.50" y EUR con € y 2 decimales | ✅ Pasa   |

## Sprint 2 — Lógica de negocio y CRUD

| ID    | Archivo                                                  | Nombre del `it()`                                                                     | Dobles de prueba                                                | Resultado |
| ----- | -------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------- | --------- |
| UT-11 | `backend/tests/unit/payments.test.js`                    | UT-11: tarjeta terminada en 4242 → aprobado con número de operación                   | — (pasarela simulada sin latencia)                              | ✅ Pasa   |
| UT-12 | `backend/tests/unit/payments.test.js`                    | UT-12: tarjeta terminada en 0002 → rechazado con mensaje                              | —                                                               | ✅ Pasa   |
| UT-13 | `backend/tests/unit/payments.test.js`                    | UT-13: Yape → aprobado con código de 6 dígitos                                        | —                                                               | ✅ Pasa   |
| UT-14 | `backend/tests/unit/pedido.service.test.js`              | UT-14: con stock suficiente → crea pedido, descuenta stock y registra el kardex       | Repositorios, transacción, `spyOn` de la pasarela y del correo  | ✅ Pasa   |
| UT-15 | `backend/tests/unit/pedido.service.test.js`              | UT-15: cantidad mayor al stock → STOCK_INSUFICIENTE y no crea el pedido               | Repositorios, transacción                                       | ✅ Pasa   |
| UT-16 | `backend/tests/unit/pedido.service.test.js`              | UT-16: pago rechazado → se llama al rollback de la transacción                        | Transacción falsa con `commit`/`rollback` observables           | ✅ Pasa   |
| UT-17 | `backend/tests/unit/producto.service.test.js`            | UT-17: crear con SKU existente → error SKU_EN_USO                                     | `productoRepository.findConflictos`, `catalogoRepository`       | ✅ Pasa   |
| UT-18 | `backend/tests/unit/producto.service.test.js`            | UT-18: actualizar con stock -5 → error de validación y no guarda                      | Repositorios (Supertest sobre `PUT /admin/productos/:id`)       | ✅ Pasa   |
| UT-19 | `backend/tests/unit/inventario.service.test.js`          | UT-19: salida de 10 con stock 4 → STOCK_INSUFICIENTE y stock sin cambios              | `productoRepository`, `inventarioRepository`                    | ✅ Pasa   |
| UT-20 | `backend/tests/unit/auth.middleware.test.js`             | UT-20: requireRol("admin_gerente") con usuario cliente → 403 y no pasa al controlador | `req`, `res` y `next` falsos                                    | ✅ Pasa   |
| UT-21 | `backend/tests/unit/auth.service.test.js`                | UT-21: contraseña incorrecta → error CREDENCIALES_INVALIDAS                           | `vi.mock('bcrypt')`, `usuarioRepository`                        | ✅ Pasa   |
| UT-22 | `backend/tests/integration/productos.api.test.js`        | UT-22: con repositorio simulado de 3 productos → 200 y { data } con 3 elementos       | `productoRepository.findCatalogo` (Supertest sobre la app real) | ✅ Pasa   |
| UT-23 | `frontend/src/features/catalogo/product-card.test.jsx`   | UT-23: muestra nombre, precio, comunidad y altitud                                    | Contexto del carrito falso                                      | ✅ Pasa   |
| UT-24 | `frontend/src/features/checkout/checkout-pasos.test.jsx` | UT-24: con un campo obligatorio vacío no avanza al paso 2 y muestra el error          | `onContinuar` espiado; mismo reducer que la página del checkout | ✅ Pasa   |

## Funciones probadas

Nombre de la guía → función real en el código:

| Guía                                    | Función real                                                                                 | Ubicación                                                                               |
| --------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `calcularIGV`                           | `calcularIGV(baseImponiblePen, paisCodigo)`                                                  | `backend/src/utils/checkout-calculos.js`                                                |
| `calcularTotales`                       | `calcularTotales(subtotalPen, envioPen, paisCodigo)`                                         | `backend/src/utils/checkout-calculos.js`                                                |
| `convertirMoneda`                       | `convertirDesdePen(montoPen, valorEnPen)` + `TablaExchangeRateProvider.obtenerTasa`          | `backend/src/utils/money.js`, `backend/src/adapters/exchange/`                          |
| `obtenerZona`                           | `zonaDePais(paisCodigo)`                                                                     | `backend/src/adapters/shipping/zonas.js`                                                |
| `calcularCostoEnvio`                    | `calcularCostoEnvio(tarifa, pesoG)`                                                          | `backend/src/adapters/shipping/mock-shipping-provider.js`                               |
| `generarCodigoPedido`                   | `formatearCodigo(id)`                                                                        | `backend/src/utils/pedidos.js`                                                          |
| `registroSchema`                        | `registroBody`                                                                               | `backend/src/schemas/auth.schema.js`                                                    |
| `formatCurrency`                        | `formatMoney(monto, moneda, idioma)`                                                         | `frontend/src/lib/format.js`                                                            |
| `MockPaymentGateway`                    | `MockPaymentGateway.procesarPago(solicitud)`                                                 | `backend/src/adapters/payments/mock-payment-gateway.js`                                 |
| `PedidoService.crear`                   | `crearPedido(usuarioId, datos)`                                                              | `backend/src/services/pedido.service.js`                                                |
| `ProductoService.crear` / `.actualizar` | `crearProducto(admin, datos)` / `actualizarProducto(id, cambios)` + `actualizarProductoBody` | `backend/src/services/admin-producto.service.js`, `backend/src/schemas/admin.schema.js` |
| `InventarioService.registrarMovimiento` | `registrarMovimiento(admin, movimiento)`                                                     | `backend/src/services/admin-inventario.service.js`                                      |
| `requireRol`                            | `requireRol(...roles)`                                                                       | `backend/src/middleware/auth.js`                                                        |
| `AuthService.login`                     | `login({ correo, password })`                                                                | `backend/src/services/auth.service.js`                                                  |
| `<ProductCard />`                       | `ProductCard`                                                                                | `frontend/src/features/catalogo/product-card.jsx`                                       |
| Checkout, paso 1                        | `PasoEnvio` + `checkoutReducer`                                                              | `frontend/src/features/checkout/paso-envio.jsx`, `estado.js`                            |

## Notas

- El IGV grava productos + envío (base imponible), por eso `calcularTotales` aplica `calcularIGV(subtotal + envío, país)`.
- UT-03 y UT-04 usan el proveedor de tipo de cambio con una tabla en memoria (los mismos valores que `tipos_cambio`), no la base de datos.
- UT-06 recibe la tarifa `europa / express` (170.00 + 60.00 por kg) tal como la entrega PostgreSQL (NUMERIC como string).
- **UT-15:** el stock se valida antes de crear el pedido (`construirLineas`, con las filas bloqueadas por `findParaVenta`), así que no se llama a `pedidoRepository.create` ni a la pasarela.
- **UT-16:** `withTransaction` se reemplaza por una transacción falsa que llama a `commit()` si el callback termina y a `rollback()` si lanza, como `sequelize.transaction`. El pago rechazado lanza `PAGO_RECHAZADO` (402) dentro de la transacción.
- **UT-17:** el código real del error es `SKU_EN_USO` (409), no `SKU_DUPLICADO`.
- **UT-18:** el stock no se edita en la ficha del producto, solo con movimientos de inventario (kardex). `actualizarProductoBody` descarta `stock`, así que `{ stock: -5 }` no tiene campos válidos y la API responde `400 VALIDATION_ERROR` antes de llegar al servicio.
- **UT-20:** como todo middleware de Express, `requireRol` llama a `next(error)` con un `AppError` 403 `SIN_PERMISO` (el manejador de errores responde el 403). Lo que nunca ocurre es `next()` sin argumentos, que pasaría al controlador.
- **UT-22:** vive en `tests/integration/` porque prueba la API completa (rutas → controlador → servicio), pero con el repositorio simulado, así que forma parte de `npm test`. Las pruebas contra la base real se llaman `*-db.test.js` y solo corren con `npm run test:integration`.
- **UT-24:** el checkout exige sesión y toma el correo de la cuenta, así que el paso 1 (Envío) no tiene campo de correo. El caso equivalente deja vacío el nombre de quien recibe (y la dirección) del formulario de dirección nueva.
