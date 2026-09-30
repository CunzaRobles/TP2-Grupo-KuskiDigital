# CLAUDE.md — Kuski Digital

Contexto del proyecto para Claude Code. Léelo antes de cualquier tarea en este repositorio.

## Qué es este proyecto

Kuski Digital es la tienda e-commerce de **Kuski Agroindustria S.A.** (Cusco, Perú). Vende más de 40 productos de la biodiversidad andina: café orgánico, superalimentos, textiles de alpaca y artesanía. Cada producto proviene de una comunidad productora identificada.

Es un proyecto universitario (Taller de Proyectos, Universidad Continental), pero **la página web debe ser real, funcional y de calidad profesional**. Lo que está fuera de la web se **simula**:

| Real (se programa de verdad)                           | Simulado (mock con interfaz intercambiable)               |
| ------------------------------------------------------ | --------------------------------------------------------- |
| Frontend completo (tienda + panel admin)               | Pasarela de pago (Tarjeta, PayPal, Yape/Plin)             |
| API REST en Express                                    | Cálculo de envío internacional (courier/DHL)              |
| Base de datos PostgreSQL en Supabase con datos semilla | Tipo de cambio (tabla fija PEN/USD/EUR)                   |
| Autenticación con roles                                | Correos de confirmación (se loguean en consola)           |
| Carrito, pedidos, inventario, reportes                 | Tracking del pedido (cambio de estado manual desde admin) |

Las simulaciones deben verse reales en la interfaz (estados de carga, aprobado/rechazado, número de operación). Viven en `backend/src/adapters/` detrás de una interfaz, para poder cambiarse por el proveedor real sin tocar la lógica de negocio.

## Equipo (autores en commits y documentación)

- Brandon Cunza Robles — Líder de proyecto / integrador (revisa y fusiona PRs)
- Jose Alexandro Lopez Mamani — Backend e infraestructura
- Roberto Israel Meza Oroe — Frontend React

## Stack (100% gratuito, no cambiar sin consultar)

- Node.js 24 LTS (fijado en `.nvmrc`), npm 11, npm workspaces (un solo `package-lock.json` en la raíz)
- **Frontend:** React 19 + Vite 8 (versiones ya instaladas, aprobadas por el equipo), React Router, Tailwind CSS v4 (`@tailwindcss/vite`), shadcn/ui (Radix), Motion (Framer Motion), TanStack Query, react-i18next, Recharts, react-leaflet, lucide-react. Usar siempre versiones compatibles con React 19 y Vite 8.
- **Backend:** Express 5 (`"type": "module"`), Sequelize 6 + sequelize-cli (migraciones, seeders y config en `.cjs`), PostgreSQL en **Supabase** (conexión por `DATABASE_URL` con SSL, Session pooler), Zod, bcrypt, jsonwebtoken, helmet, cors, express-rate-limit
- **Pruebas:** Vitest (+ Testing Library), Supertest, Cypress (E2E)
- **Calidad:** ESLint + Prettier
- **Base de datos:** Supabase se usa SOLO como PostgreSQL (y Storage para imágenes de productos). NO usar Supabase Auth ni `supabase-js` en el frontend: todo pasa por la API Express (arquitectura N-Layer). La `service_role` key solo vive en `backend/.env`.

## Estructura objetivo del repositorio

```
kuski-digital/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/              # router, providers, layouts (tienda y admin)
│   │   ├── features/
│   │   │   ├── home/
│   │   │   ├── catalogo/
│   │   │   ├── producto/
│   │   │   ├── carrito/      # drawer lateral
│   │   │   ├── checkout/     # 4 pasos
│   │   │   ├── pedidos/      # confirmación y tracking
│   │   │   ├── auth/
│   │   │   ├── cuenta/
│   │   │   └── admin/        # dashboard, ventas, inventario, categorías, usuarios, estadísticas
│   │   ├── components/ui/    # design system (shadcn + propios)
│   │   ├── components/layout/
│   │   ├── lib/              # http client, i18n, currency, utils
│   │   ├── locales/          # es, en, de
│   │   └── styles/           # tokens y globals
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── models/           # Sequelize + asociaciones
│   │   ├── repositories/     # única capa que usa Sequelize
│   │   ├── services/         # reglas de negocio
│   │   ├── controllers/      # capa HTTP
│   │   ├── routes/           # prefijo /api/v1
│   │   ├── middleware/       # auth, roles, validación, errores
│   │   ├── adapters/
│   │   │   ├── payments/     # PaymentGateway + MockPaymentGateway
│   │   │   ├── shipping/     # ShippingProvider + MockShippingProvider
│   │   │   └── exchange/     # ExchangeRateProvider + tabla fija
│   │   └── app.js / server.js
│   ├── database/             # 01_esquema_kuski_db.sql, 02_datos_base_kuski_db.sql
│   ├── migrations/
│   ├── seeders/
│   ├── tests/
│   ├── .env                  # DATABASE_URL de Supabase (NO se sube)
│   ├── .env.example
│   └── package.json
├── docs/                     # modelo-er.md, openapi.yaml, diagramas
├── .github/workflows/ci.yml
├── .nvmrc
├── package.json              # workspaces: ["frontend", "backend"]
└── README.md
```

## Arquitectura (debe coincidir con los documentos del proyecto)

N-Layer / Clean Architecture: `routes → controllers → services → repositories → models`. Cada capa solo conoce a la inmediata inferior. Los servicios nunca importan Sequelize ni Express. Los proveedores externos entran solo por `adapters/`.

## Modelo de datos (PostgreSQL / Supabase)

Fuente de verdad: `backend/database/01_esquema_kuski_db.sql` (19 tablas, RLS activado sin políticas para bloquear la API pública de Supabase) y el diagrama `docs/modelo-er.md`. Resumen:

Tablas: `usuarios` (rol: cliente | admin_gerente | admin_ventas | admin_logistica), `direcciones`, `categorias`, `comunidades` (proveedor: razón social, comunidad de origen, región, altitud_msnm, lat, lng, descripción), `productos` (FK categoría y comunidad; precio_base en PEN, stock, peso_g, certificaciones, destacado), `producto_imagenes`, `movimientos_inventario` (kardex: entrada | salida | ajuste), `carritos`, `carrito_items`, `pedidos` (moneda, tipo_cambio, subtotal, envío, IGV, total, estado: pendiente → pagado → preparando → en_transito → entregado | cancelado), `pedido_items`, `pagos` (método, estado, número de operación simulado), `envios` (país destino, método estándar | express, transportista, código de seguimiento), `resenas` (calificación 1–5).

Usar migraciones de Sequelize (nada de `sync()`): una migración baseline que ejecuta el script SQL y luego una migración nueva por cada cambio. Solo el responsable de backend ejecuta migraciones sobre el proyecto compartido de Supabase. Tablas adicionales del modelo: `certificaciones`, `producto_certificaciones`, `pedido_estados` (historial para tracking), `tipos_cambio` y `tarifas_envio` (soporte de la simulación). Los seeders cargan 4 categorías, alrededor de 8 comunidades de Cusco, más de 40 productos con descripciones reales y creíbles, y un usuario por cada rol admin.

## Reglas de negocio clave

- Validar stock antes de crear el pedido; descontarlo y registrar el movimiento en el kardex dentro de una transacción.
- Los precios se guardan en PEN; la conversión a USD/EUR se hace en el backend con el ExchangeRateProvider, y el tipo de cambio queda guardado en el pedido.
- IGV del 18% solo para envíos dentro de Perú.
- El costo de envío depende del país, del peso y del método (estándar 12–18 días, express 4–7 días).
- Pago simulado: aprueba por defecto. Una tarjeta terminada en `0002` se rechaza (para demostrar el manejo de errores). Yape/Plin muestra un código de aprobación.

## Dirección de diseño: "editorial andino"

Debe sentirse como una marca premium de origen, no como una plantilla genérica de tienda. Respetar la **estructura** de los wireframes, elevando la estética.

- **Paleta (tokens en CSS / Tailwind):** café profundo `#2B1D14`, terracota/achiote `#B5532C`, dorado maíz `#D9A441`, crema quinua `#F5EFE4`, blanco alpaca `#FBF9F5`, verde andino `#4F6B4A`. Contraste AA mínimo.
- **Tipografía:** Fraunces (títulos, serif) + Manrope (texto). Escala tipográfica generosa.
- **Motivo:** patrón geométrico inspirado en textiles andinos, usado de forma sutil en divisores y bordes, nunca como fondo cargado.
- **Movimiento:** Framer Motion con transiciones suaves (200–400 ms). Respetar `prefers-reduced-motion`.
- **Imágenes:** placeholders elegantes (Unsplash por categoría o SVG) hasta tener fotos reales; `loading="lazy"`, relación de aspecto fija.

### Pantallas de la tienda (estructura de los wireframes)

1. **Header persistente:** logo, navegación, selector de idioma (ES/EN/DE) y de moneda (PEN/USD/EUR), carrito con contador animado. Se vuelve compacto al hacer scroll.
2. **Home:**
   - Hero a pantalla completa con leve parallax y un único CTA "Explorar catálogo".
   - Categorías en grilla bento (4).
   - Destacados: tarjeta con hover que muestra segunda imagen, comunidad y altitud; botón "+" que agrega sin salir, con animación hacia el carrito.
   - Bloque de trazabilidad: mapa interactivo de Cusco con pines por comunidad, más contadores animados (24 comunidades, 31 países).
   - Footer.
3. **Catálogo:** filtros (categoría, precio, comunidad, certificación), orden, skeletons de carga y estado vacío cuidado.
4. **Detalle de producto:** galería con zoom, panel de compra fijo (sticky), selector de cantidad, pestañas (Descripción / Origen / Reseñas) y línea de tiempo del origen (cosecha → proceso → envío).
5. **Carrito:** drawer lateral, más una página de resumen.
6. **Checkout en 4 pasos** (Envío → Método de envío → Pago → Confirmar):
   - Stepper con progreso; permite volver atrás sin perder datos.
   - Resumen del pedido fijo a la derecha.
   - El envío y el tipo de cambio se recalculan con animación al cambiar el país.
   - Nunca mostrar costos ocultos.
7. **Confirmación:** número de pedido y tracking visual (Confirmado → Preparando → En tránsito → Entregado).
8. Login, Registro, Mi cuenta (pedidos y direcciones) y 404.

### Panel admin

Layout con sidebar, modo claro/oscuro, KPIs con sparklines, gráfico mensual (Recharts), tabla de ventas con filtros, inventario con edición de stock en línea más historial kardex, CRUD de productos con subida de imágenes, estadísticas por país y top productos, y búsqueda rápida con Ctrl+K. El acceso por rol se aplica en el frontend (ruta protegida) **y** en el backend (middleware).

Cuentan como historias de usuario de referencia: **María Quispe** (Cusco, móvil, Yape, abandona si hay más de 4 pasos o costos ocultos) y **Anna Becker** (Alemania, laptop, EUR, quiere trazabilidad y tiempos de envío claros). Mobile-first.

## Convenciones

- Código y nombres de dominio en español (producto, pedido); utilidades técnicas en inglés está bien.
- Conventional commits (`feat(catalogo): ...`, `fix(api): ...`). Una rama por funcionalidad: `feature/<nombre>`.
- La API responde `{ data }` o `{ error: { code, message } }`. Validación con Zod en cada endpoint.
- Secretos solo en `.env` (nunca commitear); mantener `.env.example` actualizado.
- Cada funcionalidad nueva incluye al menos una prueba.
- Antes de cambios grandes: proponer un plan y esperar aprobación.
- Al terminar cada fase: correr `npm run lint` y `npm test`, y actualizar el README.

## Convenciones del backend (ya implementadas)

- **Config de base de datos:** `backend/src/config/database.cjs` la comparten sequelize-cli (vía `backend/.sequelizerc`) y la instancia de la API (`src/config/database.js`, pool máx. 5). `.env` se carga con una ruta absoluta, así que los scripts funcionan desde cualquier directorio. La tabla de control de migraciones es `sequelize_meta`.
- **Migraciones:** la baseline `migrations/20260929000000-baseline-esquema-kuski.cjs` ejecuta `database/01_esquema_kuski_db.sql`. No se edita: cada cambio del esquema va en una migración nueva.
- **Seeders:** `seeders/*.cjs` (catálogo base → usuarios → productos). Los datos del catálogo viven en `database/seed-data/catalogo.cjs` (fuera de `seeders/` para que sequelize-cli no los ejecute). Las URLs de Unsplash están verificadas: si agregas otras, comprueba que respondan 200 y que la foto corresponda a la categoría.
- **Modelos:** atributos en camelCase (`precioBasePen`, `categoriaId`), mapeados a snake_case con `underscored`. `Usuario` oculta `passwordHash` por defecto; para leerlo, usa `Usuario.scope('conPassword')`. `pedido_items.subtotal_pen` es una columna GENERATED: el modelo nunca la escribe. Los ENUM están en `src/models/enums.js`; reutilízalos en los esquemas Zod.
- **Repositorios:** devuelven objetos planos (`get({ plain: true })`). Los servicios convierten NUMERIC (string en pg) a número en sus DTO.
- **Validación:** `validate({ query, body, params })` deja los datos parseados en `req.validated` (en Express 5, `req.query` es de solo lectura).
- **Errores:** lanza `AppError(status, code, message, details?)` desde los servicios; `middleware/error-handler.js` da el formato de salida.
- **Transacciones:** los servicios usan `withTransaction(async (tx) => ...)` de `repositories/transaction.repository.js` y pasan `tx` (opaco) a cada función de repositorio, que lo recibe como último parámetro. Así los servicios nunca importan Sequelize.
- **Adapters:** los servicios importan la instancia de `adapters/<tipo>/index.js`, nunca la clase Mock. Montos en PEN con `utils/money.js` (`redondear`, `convertirDesdePen`).
- **Auth:** JWT en la cookie httpOnly `kuski_token`; `requireAuth`, `optionalAuth` y `requireRol(...roles)` en `middleware/auth.js` dejan `{ id, rol }` en `req.usuario`. `ROLES_ADMIN` está en `models/enums.js`.
- **Documentación:** cada endpoint nuevo se documenta en `docs/openapi.yaml` (Swagger UI en `/api/v1/docs`); `tests/docs.test.js` comprueba que las rutas estén documentadas.
- **Paginación:** `{ data: { items, pagination: { page, limit, total, totalPages } } }`.
- **Pruebas:** las unitarias (proyecto `unit` de `vitest.config.js`) usan los mocks de TODOS los repositorios de `tests/setup/mock-repositories.js` (sin base de datos; `mockReset` entre pruebas). Cada repositorio o función nueva se agrega ahí. Para las sesiones, usa `tests/helpers/sesion.js` (`cookieDe`). Las de `tests/integration/` usan Supabase y se omiten si no hay `DATABASE_URL`.
- **Detalle de Sequelize:** las consultas crudas a `information_schema.tables` devuelven un formato especial; usa `pg_catalog.pg_tables`.

## Comandos (tras la reestructuración)

- `npm install` — instala ambos workspaces
- Configurar `backend/.env` con `DATABASE_URL` de Supabase (ver README)
- `npm run db:migrate` / `npm run db:seed` / `npm run db:reset` (undo all + migrate + seed; recrea las tablas)
- `npm run db:test` — conexión, conteo de tablas (19/19) y de productos
- `npm run dev` — frontend (5173) + backend (3000) en paralelo
- `npm test` / `npm run lint`
