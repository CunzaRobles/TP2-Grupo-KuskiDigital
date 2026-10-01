# Casos de prueba — Pruebas unitarias (Sprint 1)

Guía Práctica 07: funciones independientes, sin red ni base de datos. Cada caso es un `it()` cuyo nombre empieza con su ID y sigue la estructura Arrange-Act-Assert.

Ejecución: `npm test` (raíz) el 2026-10-01: frontend 167/167 y backend 307/307 pruebas aprobadas.

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

## Funciones probadas

Nombre de la guía → función real en el código:

| Guía                  | Función real                                                                        | Ubicación                                                      |
| --------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `calcularIGV`         | `calcularIGV(baseImponiblePen, paisCodigo)`                                         | `backend/src/utils/checkout-calculos.js`                       |
| `calcularTotales`     | `calcularTotales(subtotalPen, envioPen, paisCodigo)`                                | `backend/src/utils/checkout-calculos.js`                       |
| `convertirMoneda`     | `convertirDesdePen(montoPen, valorEnPen)` + `TablaExchangeRateProvider.obtenerTasa` | `backend/src/utils/money.js`, `backend/src/adapters/exchange/` |
| `obtenerZona`         | `zonaDePais(paisCodigo)`                                                            | `backend/src/adapters/shipping/zonas.js`                       |
| `calcularCostoEnvio`  | `calcularCostoEnvio(tarifa, pesoG)`                                                 | `backend/src/adapters/shipping/mock-shipping-provider.js`      |
| `generarCodigoPedido` | `formatearCodigo(id)`                                                               | `backend/src/utils/pedidos.js`                                 |
| `registroSchema`      | `registroBody`                                                                      | `backend/src/schemas/auth.schema.js`                           |
| `formatCurrency`      | `formatMoney(monto, moneda, idioma)`                                                | `frontend/src/lib/format.js`                                   |

Notas:

- El IGV grava productos + envío (base imponible), por eso `calcularTotales` aplica `calcularIGV(subtotal + envío, país)`.
- UT-03 y UT-04 usan el proveedor de tipo de cambio con una tabla en memoria (los mismos valores que `tipos_cambio`), no la base de datos.
- UT-06 recibe la tarifa `europa / express` (170.00 + 60.00 por kg) tal como la entrega PostgreSQL (NUMERIC como string).
