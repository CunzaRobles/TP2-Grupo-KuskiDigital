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
- **Frontend:** React 19 + Vite 8 (versiones ya instaladas, aprobadas por el equipo), React Router, Tailwind CSS v4 (`@tailwindcss/vite`), shadcn/ui (Radix), Motion (Framer Motion), GSAP + `@gsap/react` (ScrollTrigger, SplitText y CustomEase; gratuitos), Lenis (scroll suave), TanStack Query, react-i18next, Recharts, react-leaflet, lucide-react. Usar siempre versiones compatibles con React 19 y Vite 8.
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

## Dirección de diseño de la tienda: "Del valle a la puna"

Lo único de Kuski es la **altitud de origen** de sus productos: de 1,050 msnm (Quillabamba) a 3,760 msnm (Chinchero), según `comunidades.altitud_msnm`. La identidad se construye sobre ese dato real. Respetar la **estructura** de los wireframes.

- **Paleta (tokens en `frontend/src/styles/tokens.css`):** Puna `#1B2440` (texto y banda oscura), Cochinilla `#A3123A` (**único acento**: CTA, "+", contador del carrito, marcador de altitud; hover `#7C1232`), Ichu `#C9A55A`, Musgo `#3E5A3A` (estados de éxito y certificaciones), Niebla `#EEF0EC` (fondo), Blanco `#FFFFFF` (superficies).
- **Tokens derivados (aprobados):**
  - `--color-niebla-texto` `#5B6270`: texto secundario (5.34:1 sobre Niebla).
  - `--color-niebla-borde` `#838A82`: borde de inputs y controles (3.09:1 sobre Niebla, 3.55:1 sobre Blanco).
  - `--color-error` `#9A3412`: errores y acciones destructivas, siempre con ícono (6.37:1 sobre Niebla). Nunca Cochinilla para errores.
- **Reglas de contraste:** Ichu solo sobre Puna (6.56:1) o como relleno detrás de texto Puna; **nunca como texto ni línea con significado sobre Niebla/Blanco** (2.03:1). Cochinilla nunca sobre Puna (1.97:1): en la banda Puna el botón es Niebla con texto Puna y el foco es Niebla. Blanco y Niebla casi no contrastan (1.09:1): las superficies se separan con bordes finos (Puna al 12–15 %), no con sombras. `tokens.test.js` verifica los pares.
- **Tipografía:** Unbounded (h1, h2 y cifras de altitud; peso 500–600, `hyphens: auto` por el alemán) + Hanken Grotesk (texto, h3/h4, nombres de producto, precios con `tabular-nums`). Google Fonts.
- **Motivo:** el perfil de altitud de las comunidades, las marcas de una regla y las curvas de nivel, en bordes, divisores y como capa sutil sobre la foto del hero. Ya no se usa el patrón textil en la tienda.
- **Radios con jerarquía** (utilidades semánticas; la tienda y `.admin` les dan valores distintos): `rounded-full` para indicadores (badges, contador, pasos, botones de icono) → `rounded-item` 2 px (ítems de lista, skeletons, checkbox) → `rounded-field` y `rounded-button` 6 px → `rounded-surface` 10 px (tarjetas, avisos) → `rounded-popover` 12 px (menús, toasts) → `rounded-dialog` 16 px (diálogos, hoja inferior). Las fotos no llevan radio.
- **Elevación:** solo proyecta sombra lo que flota sobre la página (`shadow-overlay` en popovers, diálogos y toasts; `shadow-sheet` en drawers). `shadow-field` y `shadow-surface` no tienen sombra en la tienda: campos y superficies se separan con bordes finos. El botón primario es Cochinilla.
- **Movimiento:** un solo momento memorable, el **recorrido "Del valle a la puna"** de la sección de categorías (al bajar con el scroll se sube en altitud; ver Home). La única animación automática de la carga es la entrada del hero: el titular por líneas con SplitText (máscara, nunca letra por letra), luego el texto, el CTA y la indicación de scroll; 1.2 s como máximo en total. El resto, movimiento solo como respuesta a acciones del usuario (agregar al carrito, abrir drawer, hover, cambio de país, cambio de ruta). Respetar `prefers-reduced-motion` (el marcador salta sin transición).
  - Todo vive en `frontend/src/lib/motion/`: tokens de duración (`ruta` 180 ms, `rapida` 200, `base` 300, `lenta` 400) y curvas (`salida`, `suave`) espejados en `--duracion-*` / `--curva-*` de `tokens.css`; `useReducedMotion`; GSAP con sus plugins registrados una vez (`lib/motion/gsap`, curvas con nombre `'salida'`/`'suave'`; SplitText aparte en `lib/motion/split-text`); `LenisProvider` sincronizado con ScrollTrigger.
  - Lenis solo en la tienda (el admin conserva el scroll nativo); se detiene mientras Radix bloquea el scroll (modales).
  - **Cambio de ruta:** fundido corto con View Transitions (`::view-transition-*(root)`); el header no se funde. Sin soporte, fundido de entrada con Motion (`TransicionRuta`). En la tienda, `Link`/`NavLink` se importan de `@/lib/motion/enlaces` y `useNavigate` de `@/lib/motion/use-navigate` (activan las View Transitions por defecto).
  - **Elemento compartido:** la foto de una tarjeta de producto se expande hasta la foto principal de la ficha (`producto-imagen`, `features/producto/use-enlace-producto.js`, que además precarga la ficha con la intención del usuario). Nunca dos elementos con el mismo nombre en la página: los relacionados de una ficha no lo comparten.
  - Con movimiento reducido: sin Lenis, sin View Transitions ni elemento compartido; lo esencial (que el estado cambie) se ve sin transición.
- **Prohibido:** antetítulos en mayúsculas sobre los títulos, resaltar una palabra del titular, todas las tarjetas iguales con la misma sombra, degradados decorativos, "→" en botones, animaciones de aparición (fade-up) por sección, parallax (única excepción: las montañas del recorrido de categorías), contadores animados.
- **Precisión del concepto:** la puna empieza alrededor de 4,000 m; ninguna comunidad actual llega. La regla va de 1,000 a 4,000 m con la puna como horizonte; no afirmar que un producto viene de la puna.
- **Imágenes:** placeholders (Unsplash por categoría) hasta tener fotos reales; `loading="lazy"`, relación de aspecto fija.
- **Panel admin:** conserva la dirección anterior "editorial andino" (café, terracota, crema; Fraunces + Manrope; botones en píldora), aislada en la clase `.admin` de `tokens.css` que aplica `ThemeScope`; sus fuentes las carga `ThemeScope` al abrir el admin.

### Pantallas de la tienda (estructura de los wireframes)

1. **Header persistente:** fondo Niebla sólido con línea inferior; en la home es transparente (texto y foco Niebla) sobre el hero hasta que se hace scroll; logo, navegación, selector de idioma (ES/EN/DE) y de moneda (PEN/USD/EUR), carrito con contador (se mueve solo al agregar). Se vuelve compacto al hacer scroll.
2. **Home:**
   - Hero a pantalla completa con la foto del valle (punto de partida del recorrido), velo Puna de legibilidad, curvas de nivel y la regla del altímetro en el borde: titular corto, texto, un único CTA "Explorar catálogo" (Niebla con texto Puna, porque va sobre fondo oscuro) y la indicación de scroll con la altitud de la comunidad más baja (1,050 msnm). Debajo, el perfil de altitud de las comunidades (SVG con datos de la API).
   - Categorías (4): el recorrido "Del valle a la puna" con GSAP ScrollTrigger. En escritorio la sección queda fija (pin); un altímetro de cinta (Ichu sobre una franja Puna) sube de la comunidad más baja a la más alta (1,050 → 3,760 msnm); el fondo cambia de piso por altitud (Musgo < 2,000 m, Ichu < 3,000 m, Puna; texto Niebla, Puna y Niebla); tres planos de montaña en SVG con parallax suave; cada categoría aparece a la altitud de su `comunidadPrincipal` (`GET /api/v1/categorias`) con foto, comunidad de origen y enlace "Ver café", etc. Solo se animan transform y opacity. En móvil, sin pin: lista vertical con el altímetro como línea lateral. Con movimiento reducido, versión estática (cuatro columnas en escritorio).
   - Destacados: grilla con bordes (el primero grande); hover con segunda imagen, comunidad y altitud; botón "+" que agrega sin salir, con animación hacia el carrito.
   - Trazabilidad: lista estática de las comunidades de menor a mayor altitud (con su región natural), luego mapa interactivo de Cusco con pines y cifras estáticas de `/estadisticas/trazabilidad`.
   - Footer: banda Puna (la otra es el final del recorrido de categorías), con el perfil de altitud como borde superior.
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
