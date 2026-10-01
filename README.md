# Kuski Digital

Tienda e-commerce de **Kuski Agroindustria S.A.** (Cusco, Perú): café orgánico, superalimentos, textiles de alpaca y artesanía, cada producto trazable hasta su comunidad productora.

Proyecto del curso Taller de Proyectos — Universidad Continental.

## Estructura

Monorepo con npm workspaces y un único `package-lock.json` en la raíz.

```
.
├── frontend/          # React 19 + Vite 8 (puerto 5173)
│   ├── src/
│   │   ├── app/               # providers, router, layouts (TiendaLayout, AdminLayout) y páginas genéricas (404)
│   │   ├── features/          # una carpeta por funcionalidad (home, catalogo, checkout, admin…)
│   │   ├── components/ui/     # design system: shadcn/ui (Radix) + componentes propios
│   │   ├── components/layout/ # header, footer, logo, selectores de idioma y moneda
│   │   ├── lib/               # cliente HTTP, QueryClient, i18n, moneda, formateo, motion
│   │   ├── locales/           # es.json, en.json, de.json
│   │   └── styles/            # tokens.css (design tokens) y globals.css (Tailwind v4)
│   └── components.json    # configuración de shadcn/ui (alias @/ → src/)
├── backend/           # API REST en Express 5 (puerto 3000)
│   ├── src/
│   │   ├── config/        # env, conexión Sequelize (database.js) y config de sequelize-cli (database.cjs)
│   │   ├── models/        # 19 modelos Sequelize + asociaciones (index.js)
│   │   ├── repositories/  # única capa que usa Sequelize
│   │   ├── services/      # reglas de negocio
│   │   ├── controllers/   # capa HTTP
│   │   ├── routes/        # prefijo /api/v1
│   │   ├── middleware/    # auth (requireAuth, requireRol), validación Zod, rate limit, 404 y errores
│   │   ├── schemas/       # esquemas Zod
│   │   ├── adapters/      # proveedores externos simulados: payments, shipping, exchange, email
│   │   ├── utils/         # AppError, dinero, JWT y contraseñas
│   │   ├── app.js         # configuración de Express (se importa en las pruebas)
│   │   └── server.js      # arranque: conecta a la base y hace listen
│   ├── database/          # esquema SQL (01_), datos base (02_) y datos semilla (seed-data/)
│   ├── migrations/        # migraciones sequelize-cli (.cjs)
│   ├── seeders/           # seeders sequelize-cli (.cjs)
│   ├── scripts/test-db.js # comprueba la conexión y cuenta tablas y productos
│   ├── tests/             # Vitest + Supertest (tests/integration usa la base real)
│   ├── .sequelizerc
│   └── .env.example
├── docs/              # documentación técnica (openapi.yaml)
├── package.json       # workspaces: ["frontend", "backend"]
└── .nvmrc             # Node 24
```

## Requisitos

- **Node.js 24** (con nvm: `nvm use`)
- npm 11 (viene con Node 24)
- La base de datos es PostgreSQL en **Supabase**; no hace falta Docker.

## Instalación

```bash
npm install
```

Instala las dependencias de ambos workspaces desde la raíz. No ejecutes `npm install` dentro de `frontend/` o `backend/`: eso crearía lockfiles separados. Para añadir un paquete a un workspace:

```bash
npm install <paquete> -w frontend
npm install -D <paquete> -w backend
```

## Variables de entorno

Copia la plantilla y completa los valores:

```bash
cp backend/.env.example backend/.env
```

| Variable                                        | Descripción                                                                                             |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `PORT`                                          | Puerto de la API (por defecto `3000`).                                                                  |
| `DATABASE_URL`                                  | Cadena de conexión de Supabase: _Project Settings → Database → Connection string → **Session pooler**_. |
| `JWT_SECRET`                                    | Secreto para firmar los tokens JWT. Obligatorio en producción (en desarrollo hay uno por defecto).      |
| `JWT_EXPIRES_IN`                                | Duración de la sesión (por defecto `7d`).                                                               |
| `CORS_ORIGIN`                                   | Orígenes permitidos por CORS, separados por comas (por defecto `http://localhost:5173`).                |
| `PAGO_LATENCIA_MIN_MS` / `PAGO_LATENCIA_MAX_MS` | Latencia simulada de la pasarela de pago (por defecto 1000–2000 ms; 0 en pruebas).                      |
| `SUPABASE_URL`                                  | URL del proyecto de Supabase (_Project Settings → API_). Solo para Storage (fotos de productos).        |
| `SUPABASE_SERVICE_ROLE_KEY`                     | Clave secreta (`service_role` o `sb_secret_…`). Solo vive en el backend, nunca en el frontend.          |
| `SUPABASE_STORAGE_BUCKET`                       | Bucket público de las fotos de productos (por defecto `productos`).                                     |

`backend/.env` nunca se sube al repositorio.

El frontend no necesita variables para funcionar. Las opcionales (`VITE_API_URL`, `VITE_MAP_TILES_URL`, `VITE_MAP_TILES_ATTRIBUTION`) están documentadas en `frontend/.env.example`.

## Base de datos

PostgreSQL en Supabase. El esquema se gestiona **solo con migraciones** de Sequelize (nunca `sync()`):

- `backend/migrations/20260929000000-baseline-esquema-kuski.cjs` ejecuta `backend/database/01_esquema_kuski_db.sql` completo (19 tablas, ENUMs, índices, triggers, vistas y RLS). Su `down` elimina todos esos objetos.
- Cada cambio posterior del esquema va en una **migración nueva**; no se edita la baseline.
- `20260930000000-rls-tablas-sequelize.cjs` activa RLS en la tabla de control `sequelize_meta` (y en la de seeders, si existiera), así el Security Advisor de Supabase queda sin errores aunque se recree la base.
- Los seeders replican `02_datos_base_kuski_db.sql` y amplían el catálogo: 4 categorías, 8 comunidades de Cusco, 4 certificaciones, tipos de cambio y tarifas de envío simulados, **44 productos** (2 imágenes placeholder de Unsplash cada uno, certificaciones y movimiento de inventario inicial) y 5 usuarios de prueba. Los datos del catálogo están en `backend/database/seed-data/catalogo.cjs`.

> Solo el responsable de backend ejecuta migraciones sobre el proyecto compartido de Supabase. `db:reset` **borra y recrea** todas las tablas de Kuski.

```bash
npm run db:migrate        # aplica las migraciones pendientes
npm run db:seed           # carga los datos semilla (sobre una base recién migrada)
npm run db:reset          # deshace todas las migraciones, migra y siembra de nuevo
npm run db:test           # comprueba la conexión: tablas (19/19) y número de productos
```

### Usuarios de prueba

Solo para desarrollo; las contraseñas se guardan cifradas con bcrypt.

| Rol               | Correo                     | Contraseña          | Notas                     |
| ----------------- | -------------------------- | ------------------- | ------------------------- |
| `admin_gerente`   | `gerente@kuski.pe`         | `KuskiAdmin2026!`   |                           |
| `admin_ventas`    | `ventas@kuski.pe`          | `KuskiAdmin2026!`   |                           |
| `admin_logistica` | `logistica@kuski.pe`       | `KuskiAdmin2026!`   |                           |
| `cliente`         | `maria.quispe@example.com` | `KuskiCliente2026!` | Perú, español, PEN, Cusco |
| `cliente`         | `anna.becker@example.com`  | `KuskiCliente2026!` | Alemania, alemán, EUR     |

## API

Prefijo `/api/v1`. Documentación interactiva (Swagger UI) en **http://localhost:3000/api/v1/docs**, generada desde [`docs/openapi.yaml`](docs/openapi.yaml); la especificación en JSON está en `/api/v1/docs/openapi.json`.

Las respuestas tienen la forma `{ data }` o `{ error: { code, message, details? } }`. Las listas paginadas devuelven `{ data: { items, pagination: { page, limit, total, totalPages } } }`. Los endpoints con precios aceptan `?moneda=PEN|USD|EUR`.

| Método         | Ruta                            | Acceso  | Descripción                                                                                                                                                                           |
| -------------- | ------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET            | `/health`                       | Público | Estado de la API y de la base (`503 DB_UNAVAILABLE` si no responde).                                                                                                                  |
| POST           | `/auth/registro`                | Público | Crea un cliente e inicia sesión. Correo de bienvenida simulado.                                                                                                                       |
| POST           | `/auth/login`                   | Público | Inicia sesión: JWT en la cookie httpOnly `kuski_token` (SameSite lax, Secure en producción).                                                                                          |
| POST           | `/auth/logout`                  | Público | Borra la cookie de sesión.                                                                                                                                                            |
| GET            | `/auth/me`                      | Público | Usuario actual; sin sesión responde `usuario: null` (no 401).                                                                                                                         |
| GET            | `/productos`                    | Público | Catálogo. Query: `categoria`, `comunidad`, `certificacion`, `precio_min`, `precio_max`, `q`, `orden`, `page`, `limit`, `moneda`.                                                      |
| GET            | `/productos/destacados`         | Público | Destacados del home.                                                                                                                                                                  |
| GET            | `/productos/:slug`              | Público | Ficha: imágenes, comunidad con coordenadas, certificaciones, reseñas, promedio y distribución.                                                                                        |
| GET            | `/productos/:slug/relacionados` | Público | Relacionados: misma categoría primero, completa con destacados. Query: `moneda`, `limit` (4).                                                                                         |
| GET            | `/categorias`                   | Público | Categorías con número de productos y rango de altitud de origen (`altitudMin`/`altitudMax`).                                                                                          |
| GET            | `/comunidades`                  | Público | Comunidades con coordenadas (mapa).                                                                                                                                                   |
| GET            | `/certificaciones`              | Público | Certificaciones (filtro del catálogo).                                                                                                                                                |
| GET            | `/estadisticas/trazabilidad`    | Público | Comunidades, familias, productos y países.                                                                                                                                            |
| GET            | `/carrito`                      | Sesión  | Carrito del usuario con totales.                                                                                                                                                      |
| POST           | `/carrito/items`                | Sesión  | Agrega un producto (suma si ya estaba; valida stock).                                                                                                                                 |
| PATCH / DELETE | `/carrito/items/:id`            | Sesión  | Cambia la cantidad o quita un ítem.                                                                                                                                                   |
| POST           | `/carrito/fusionar`             | Sesión  | Une el carrito de invitado (localStorage) al iniciar sesión; ajusta al stock y devuelve `ajustes`.                                                                                    |
| POST           | `/carrito/invitado`             | Público | Precios del carrito de invitado en la moneda pedida, con stock y avisos (no guarda nada).                                                                                             |
| POST           | `/checkout/cotizar`             | Público | Subtotal, opciones de envío estándar/express, IGV (solo PE), tipo de cambio y total.                                                                                                  |
| POST           | `/pedidos`                      | Sesión  | Crea el pedido con el carrito en una transacción (stock, kardex, pago, envío, tracking, código `KD-000001`). Con `guardarDireccion`, guarda la dirección nueva si el pago se aprueba. |
| GET            | `/pedidos`                      | Sesión  | Mis pedidos, con los pasos del tracking.                                                                                                                                              |
| GET            | `/pedidos/:codigo`              | Sesión  | Detalle y tracking (el cliente solo ve los suyos; los admin, todos). Montos de los ítems también en la moneda del pedido.                                                             |
| GET / POST     | `/direcciones`                  | Sesión  | Mis direcciones (la principal primero) / guardar una (la primera es la principal; máx. 10).                                                                                           |
| PATCH / DELETE | `/direcciones/:id`              | Sesión  | Editar o marcar como principal / borrar (si era la principal, pasa a serlo la más reciente).                                                                                          |

Seguridad: helmet, CORS (solo `CORS_ORIGIN`, con credenciales), un límite de 300 peticiones cada 15 minutos por IP en `/api` y de 20 intentos en login y registro.

### Panel admin (`/api/v1/admin`)

Cada ruta exige sesión, **vuelve a leer el rol y el estado de la cuenta en la base** (`requireSesionVigente`: un cambio de rol o una cuenta desactivada surten efecto al instante, sin esperar a que caduque el JWT) y comprueba el permiso de su sección con `requireRol` antes de validar los datos. La matriz vive en `backend/src/config/permisos.js` y su copia en `frontend/src/features/admin/permisos.js` (una prueba verifica que coincidan).

| Sección                                    | Gerencia | Ventas | Logística |
| ------------------------------------------ | :------: | :----: | :-------: |
| Dashboard, ventas, estadísticas            |    ✔     |   ✔    |           |
| Pedidos (consultar)                        |    ✔     |   ✔    |     ✔     |
| Pedidos (cambiar estado)                   |    ✔     |        |     ✔     |
| Inventario y kardex                        |    ✔     |        |     ✔     |
| Productos e imágenes, categorías, usuarios |    ✔     |        |           |

| Método                    | Ruta                                       | Descripción                                                                                                                                                        |
| ------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET                       | `/admin/dashboard`                         | KPIs del mes (ingresos PEN, pedidos, ticket promedio, stock bajo) con variación frente al mismo tramo del mes anterior, sparklines de 30 días y serie de 12 meses. |
| GET                       | `/admin/ventas`                            | Ventas con filtros `desde`, `hasta`, `pais`, `estado`, `metodo_pago`, `q` y paginación, más el resumen del filtro completo.                                        |
| GET                       | `/admin/estadisticas`                      | Ventas por país y top 10 de productos (vistas `v_ventas_por_pais` y `v_productos_mas_vendidos`).                                                                   |
| GET                       | `/admin/pedidos`, `/admin/pedidos/:codigo` | Cola de pedidos (mismos filtros) y detalle con cliente y transiciones posibles.                                                                                    |
| PATCH                     | `/admin/pedidos/:codigo/estado`            | Cambia el estado (tracking simulado) y lo registra en `pedido_estados` con el admin responsable.                                                                   |
| GET / POST                | `/admin/productos`                         | Productos (incluidos los desactivados) / crear (el stock inicial entra al kardex).                                                                                 |
| GET / PUT / DELETE        | `/admin/productos/:id`                     | Ficha, edición (el stock no se edita aquí) y baja lógica (`activo = false`).                                                                                       |
| POST                      | `/admin/productos/:id/imagenes`            | Sube una foto (multipart, campo `imagen`; JPG/PNG/WebP de hasta 5 MB, se verifica el contenido real) a Supabase Storage y guarda su URL pública.                   |
| PATCH / DELETE            | `/admin/productos/:id/imagenes/:imagenId`  | Marcar como principal, orden o texto alternativo / eliminar (también borra el archivo del bucket).                                                                 |
| GET                       | `/admin/inventario`                        | Productos por stock ascendente (`?stock_bajo=true`).                                                                                                               |
| POST                      | `/admin/inventario/movimientos`            | Entrada, salida o ajuste (stock contado) en una transacción con bloqueo de fila; nunca deja stock negativo.                                                        |
| GET                       | `/admin/inventario/:id/movimientos`        | Historial kardex paginado.                                                                                                                                         |
| GET / POST / PUT / DELETE | `/admin/categorias[/:id]`                  | CRUD de categorías; no se elimina una con productos (409).                                                                                                         |
| GET / POST / PATCH        | `/admin/usuarios[/:id]`                    | Usuarios con filtros, alta de cuentas del equipo y cambio de rol o estado (nadie puede cambiar su propio rol ni desactivarse).                                     |
| GET                       | `/admin/buscar?q=`                         | Búsqueda rápida (Ctrl+K): productos, pedidos y usuarios, solo los grupos que el rol puede ver.                                                                     |

**Tracking simulado:** `pagado → preparando → en_transito → entregado`; se puede cancelar mientras el pedido no haya salido del almacén. `entregado` guarda la fecha de entrega y `cancelado` devuelve el stock (entrada en el kardex) y marca el pago como `reembolsado`. Cada cambio envía un correo simulado al cliente.

### Reglas de la compra

- **Envío:** la zona sale del país (`nacional` = PE, `latam`, `norteamerica`, `europa`, `resto_mundo`) y el costo es `costo_base + costo_por_kg × kg`, según `tarifas_envio`.
- **IGV:** 18 % sobre productos + envío, solo si el destino es Perú.
- **Moneda:** los precios se guardan en PEN; cada monto se convierte con `tipos_cambio` y el total es la suma de lo convertido (el desglose cuadra al céntimo). El tipo de cambio queda congelado en el pedido.
- **Pedido:** si el pago se rechaza, se deshace todo (no queda pedido y el stock no cambia) y responde `402 PAGO_RECHAZADO`. El código `KD-` sale del id del pedido, así que un intento rechazado deja un hueco en la numeración.

### Simulaciones (`backend/src/adapters/`)

Cada proveedor externo tiene una interfaz y una implementación simulada. Para usar el proveedor real basta con cambiar la instancia en el `index.js` de su carpeta.

| Adapter                              | Simulación                                                                                                                                                                                                                                                  |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `payments/MockPaymentGateway`        | Aprueba por defecto; una tarjeta terminada en **0002** se rechaza; Yape y Plin (solo PEN) devuelven un código de aprobación de 6 dígitos; tarda 1–2 s. Solo se guardan los 4 últimos dígitos de la tarjeta.                                                 |
| `shipping/MockShippingProvider`      | Cotiza con `tarifas_envio` y genera un código de seguimiento con el formato del transportista (Olva, Serpost, DHL).                                                                                                                                         |
| `exchange/TablaExchangeRateProvider` | Tabla fija `tipos_cambio` (PEN/USD/EUR).                                                                                                                                                                                                                    |
| `storage/SupabaseStorageProvider`    | **Real** (no simulado): sube las fotos al bucket público de Supabase Storage con la clave secreta del backend. En pruebas se usa `MemoriaStorageProvider`; sin credenciales, la subida responde `503 STORAGE_NO_CONFIGURADO` y el resto de la API funciona. |
| `email/ConsoleEmailSender`           | Imprime los correos (bienvenida y confirmación del pedido) en la consola del servidor.                                                                                                                                                                      |

## Desarrollo

```bash
npm run dev
```

Levanta los dos servidores en paralelo:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000 (por ejemplo, http://localhost:3000/api/v1/health)

En desarrollo, Vite redirige las peticiones a `/api` hacia el backend. Por eso el frontend llama a `fetch('/api/...')` sin escribir el host.

### Frontend y design system

- **Design system:** abre http://localhost:5173/design (solo en desarrollo; no entra al build). Muestra la paleta de la tienda con sus ratios de contraste (y la del admin), la tipografía, los radios y la elevación semánticos, el motivo de la regla, los tokens de movimiento (con una demo en GSAP) y todos los componentes de `components/ui` con los tokens de la tienda, del admin claro y del admin oscuro.
- **Tokens:** `src/styles/tokens.css` define la paleta de la tienda "Del valle a la puna" (Puna, Cochinilla como único acento, Ichu, Musgo, Niebla y los derivados `niebla-texto`, `niebla-borde` y `error`), la tipografía (Unbounded + Hanken Grotesk desde Google Fonts; utilidades `font-display` y `font-heading`), la escala tipográfica (`text-display`, `text-h1`…`text-h4`, `text-lead`), los radios, las sombras, los espaciados (`py-section`, `container-page`) y los tokens semánticos (`bg-primary`, `text-muted-foreground`…). Las reglas de uso están en CLAUDE.md ("Dirección de diseño de la tienda"). `src/styles/tokens.test.js` verifica el contraste AA de la tienda, del admin claro y del admin oscuro, y las reglas de la paleta (Ichu nunca como texto sobre Niebla, Cochinilla nunca sobre Puna).
- **Panel admin:** conserva la dirección "editorial andino" (café, terracota, crema; Fraunces + Manrope). `<ThemeScope>` aplica la clase `.admin`, que redefine tokens, fuentes y escala tipográfica, y carga Fraunces y Manrope solo cuando se abre el admin. El modo oscuro solo existe ahí (`<ThemeScope theme="dark">`); la tienda siempre es clara.
- **`cn()`** (`src/lib/utils.js`) registra en tailwind-merge las sombras y tamaños de texto propios, para que `text-h3` no se confunda con un color ni `shadow-soft` sobreviva a `shadow-none`.
- **Componentes (`components/ui`):** Button, Input, Field, Select, Badge, Card, Drawer, Dialog, Tabs, Skeleton, Toaster/toast, Stepper, Price, QuantitySelector, MarcasRegla, AndeanDivider (admin) y ThemeScope. Usan radios (`rounded-item`, `rounded-field`, `rounded-button`, `rounded-surface`, `rounded-popover`, `rounded-dialog`) y elevación (`shadow-field`, `shadow-surface`, `shadow-overlay`, `shadow-sheet`) semánticos: en la tienda solo proyecta sombra lo que flota, y `.admin` les da los valores de antes. Para añadir componentes de shadcn/ui: `npx shadcn@latest add <componente>` desde `frontend/` (usa `components.json`).
- **API:** usa `http` de `src/lib/http.js` (envía la cookie de sesión y convierte `{ error }` en `ApiError`) dentro de TanStack Query. La moneda activa (`useCurrency()`, persistida en `localStorage`) se envía como `?moneda=`: el backend convierte los precios y `<Price>` solo los formatea.
- **i18n:** `react-i18next` con detección del idioma del navegador; los textos viven en `src/locales/{es,en,de}.json`.
- **Movimiento (`src/lib/motion/`):** tokens de duración y curva compartidos por Motion, GSAP y CSS (`tokens.js` ↔ `--duracion-*` / `--curva-*`, verificados en `tokens.test.js`); `useReducedMotion`; GSAP con ScrollTrigger y CustomEase registrados en `gsap.js` (SplitText aparte, en `split-text.js`); `LenisProvider` (scroll suave solo en la tienda, movido por el ticker de GSAP y sincronizado con ScrollTrigger; se detiene con los modales). En la tienda hay un solo momento animado (el recorrido de altitud de la home); el resto responde a acciones del usuario. Con `prefers-reduced-motion` no hay Lenis, ni View Transitions, ni animaciones CSS.
- **Transiciones entre páginas:** fundido corto con la View Transitions API (`Link`/`NavLink` de `lib/motion/enlaces.jsx` y `useNavigate` de `lib/motion/use-navigate.js` la activan por defecto; el header no se funde). Sin soporte, `TransicionRuta` funde la página entrante con Motion. La foto de una tarjeta de producto se expande hasta la foto principal de la ficha (elemento compartido `producto-imagen`, `features/producto/use-enlace-producto.js`, que precarga la ficha al pasar el cursor, enfocar o tocar).

### Home (`src/features/home`)

Sigue la estructura del wireframe: header → hero → categorías → destacados → trazabilidad → footer.

- **Header** (`components/layout/site-header.jsx`): fijo, con fondo Niebla sólido; al hacer scroll se compacta. Tiene selector de idioma y moneda, contador animado del carrito (abre el drawer del carrito) y menú móvil (`mobile-menu.jsx`, panel lateral).
- **Hero** (estático): título, un único CTA "Explorar catálogo", foto y el perfil de altitud de las comunidades (`perfil-altitud.jsx`, desde `GET /comunidades`).
- **Categorías** (`categorias-altitud.jsx`): las 4 categorías escalonadas según su rango de altitud (`altitudMin`/`altitudMax` de `GET /categorias`); cada una enlaza a `/catalogo?categoria=<slug>`.
- **Destacados:** `GET /productos/destacados?moneda=` en una grilla con bordes (el primero grande; el enlace al catálogo completa la última fila). Al pasar el cursor cambia a la segunda foto; muestra altitud y comunidad. El botón "+" (`use-agregar-producto.js`, compartido con la tarjeta del catálogo) agrega al carrito sin salir de la página, hace volar la foto hasta el icono del carrito y muestra un aviso con "Ver carrito".
- **Trazabilidad:** el recorrido de altitud (`recorrido-altitud.jsx`): las comunidades, de menor a mayor altitud, con su región natural; la que cruza el centro de la pantalla mueve el marcador de una regla fija de 1,000 a 4,000 msnm (barra superior en móvil). Después, cifras estáticas (`GET /estadisticas/trazabilidad`) y el mapa react-leaflet de las comunidades (`GET /comunidades`) con pines propios y popup (altitud, productos, familias). Leaflet se carga en diferido cuando el mapa se acerca a la pantalla. CARTO Positron ahora exige API key, así que por defecto se usan los tiles equivalentes de Stadia "Alidade Smooth" (configurables con `VITE_MAP_TILES_URL`).
- **Footer:** la única banda Puna de la tienda, con las marcas de la regla de altitud como borde (`components/ui/marcas-regla.jsx`), enlaces, redes y sello de pago seguro.
- Cada bloque muestra skeletons mientras carga y un error con "Reintentar" si su petición falla, sin romper el resto de la página.

### Catálogo (`/catalogo`, `src/features/catalogo`)

- Filtros por categoría, precio, comunidad y certificación, más búsqueda por texto y orden. **La URL es la fuente de verdad** (`filtros.js`): `?categoria=cafe,textiles&comunidad=1&certificacion=2&precio_min=10&precio_max=80&q=alpaca&orden=precio_asc&page=2`, el mismo formato que `GET /productos`, así que los enlaces del home (`?categoria=`, `?comunidad=`) y el botón "atrás" funcionan. Cualquier cambio de filtro vuelve a la página 1.
- El rango de precio se expresa en la moneda elegida; si el visitante cambia de moneda, el rango se quita en vez de reinterpretarse.
- Escritorio: barra lateral fija. Móvil: botón "Filtros (n)" que abre un drawer con "Ver N productos". Chips de filtros activos con "Limpiar filtros".
- Paginación con enlaces reales (12 por página), skeletons en la primera carga, la grilla anterior atenuada mientras llega la nueva y un estado vacío ilustrado (`components/ui/empty-state.jsx`).

### Ficha de producto (`/producto/:slug`, `src/features/producto`)

- Galería con miniaturas, zoom que sigue al cursor (solo con mouse) y visor ampliado (también para pantallas táctiles).
- Panel de compra fijo (sticky) en escritorio: categoría, calificación (lleva a Reseñas), precio en la moneda elegida, certificaciones, comunidad y altitud, estado de stock ("solo quedan N"), cantidad limitada al stock menos lo que ya está en el carrito, **Agregar al carrito** (abre el drawer) y **Comprar ahora** (agrega y va a `/checkout`).
- Pestañas Descripción (con ficha técnica) / Origen (ficha de la comunidad y mini mapa con Leaflet, cargado solo al abrir la pestaña) / Reseñas (promedio, distribución y lista).
- Línea de tiempo del origen (cosecha → proceso → envío) con textos por categoría que incluyen la comunidad y la altitud reales, y productos relacionados.

### Carrito (`src/features/carrito`)

- **Invitado:** vive en `localStorage` (`kuski.carrito`, sincronizado entre pestañas). Los precios en la moneda elegida, el stock actual y los avisos llegan de `POST /carrito/invitado`.
- **Con sesión:** vive en la API (`/carrito`). Los cambios se ven al instante (actualización optimista) y se confirman con la respuesta; si falla, se muestra un aviso y se recarga el carrito. Al detectar la sesión (`GET /auth/me`, `features/auth/api.js`), el carrito de invitado se fusiona con `POST /carrito/fusionar` y se borra de `localStorage`.
- Ambos modos exponen la misma forma (`carrito-lineas.js`) a la interfaz: el **drawer lateral** (se abre desde el header y al agregar desde la ficha) y la página **`/carrito`** con el resumen. Los montos siempre están en la moneda elegida; el envío y el IGV se anuncian como "se calcula en el checkout" (nunca se ocultan). Con productos sin stock suficiente o no disponibles, el paso al checkout se bloquea hasta ajustarlos.

### Cuenta y acceso (`src/features/auth`, `src/features/cuenta`)

- **Login** (`/login`) y **Registro** (`/registro`): validación con Zod en el navegador (mismas reglas que el backend, mensajes traducidos, foco en el primer error), requisitos de la contraseña a la vista y errores de la API en su campo (p. ej. `CORREO_EN_USO`) o en un aviso (`CREDENCIALES_INVALIDAS`, límite de intentos, sin conexión). `?redirect=` devuelve a la página de origen (solo rutas internas). Al iniciar sesión, el carrito de invitado se fusiona con el de la cuenta.
- `RequireAuth` protege `/checkout`, `/pedido/:codigo` y `/cuenta`: sin sesión lleva al login y vuelve después. La API aplica la misma regla con `requireAuth`.
- **Mi cuenta** (`/cuenta`): mis pedidos (paginados, con estado y tracking compacto) y mis direcciones (`/cuenta/direcciones`: agregar, marcar como principal y eliminar con confirmación). Cerrar sesión borra de la caché los datos privados.

### Checkout (`/checkout`, `src/features/checkout`)

- 4 pasos: **Envío → Método de envío → Pago → Confirmar**, con el `Stepper` del design system. El estado vive en la página (`estado.js`): volver a un paso anterior no pierde lo escrito.
- **Envío:** la dirección principal viene elegida; se puede elegir otra guardada o escribir una nueva (y guardarla en la cuenta). Al cambiar de país se llama a `POST /checkout/cotizar`.
- **Resumen** fijo a la derecha (debajo en móvil): productos, subtotal, envío, IGV (solo Perú; fuera de Perú se muestra "no aplica"), tipo de cambio si la moneda no es PEN y total. Los montos se animan al recalcularse. Lo que aún no se puede calcular se dice ("elige el país") en lugar de ocultarse.
- **Método de envío:** estándar y express con transportista, días, fecha estimada de llegada y precio.
- **Pago simulado:** tarjeta (detecta Visa, Mastercard y American Express, formatea y enmascara el número, valida con Luhn, vencimiento y CVV, con vista previa de la tarjeta), PayPal, y Yape o Plin (solo en soles: con otra moneda se ofrecen deshabilitados, con un botón para pasar a PEN). Tarjetas de prueba: `4111 1111 1111 1111` se aprueba; una tarjeta terminada en `0002` (`4000 0000 0000 0002`) se rechaza.
- **Confirmar:** repaso editable y botón "Pagar S/ …" con el total exacto. Mientras la pasarela responde (1–2 s) se muestra "Procesando tu pago" (no se puede cerrar). Un rechazo vuelve al paso de pago con el aviso, conserva los datos y borra solo el CVV.

### Confirmación y tracking (`/pedido/:codigo`, `src/features/pedidos`)

- Código del pedido (copiable), código de aprobación de Yape/Plin, tracking visual **Confirmado → Preparando → En tránsito → Entregado** con la fecha de cada paso, productos y montos en la moneda del pedido (con el tipo de cambio aplicado), pago, envío con código de seguimiento y dirección.
- La misma página sirve de detalle desde "Mis pedidos".

### Panel admin (`/admin`, `src/features/admin`)

- **Acceso:** `/admin/login` (el mismo login de la API). Sin sesión, cualquier ruta del panel lleva al login y vuelve después; una cuenta de cliente ve un aviso. Cada sección se protege con `RequirePermiso` según la matriz de permisos, y `/admin` lleva a la primera sección del rol (logística empieza en Pedidos).
- **Layout:** sidebar agrupado y colapsable (se recuerda), drawer en móvil, menú filtrado por rol, modo claro/oscuro y búsqueda rápida **Ctrl+K / ⌘K** (secciones, productos, pedidos y usuarios, con teclado).
- **Dashboard:** KPIs con variación y sparklines, ingresos mensuales en Recharts (también como tabla), pedidos por atender y productos por reponer.
- **Ventas y Pedidos:** tablas con filtros en la URL (fecha, país, estado, método de pago y texto). Pedidos abre el detalle en un panel lateral con tracking, historial y cambio de estado (cancelar pide confirmación).
- **Productos:** listado con filtros y formulario con validación, certificaciones, visibilidad y fotos con vista previa (arrastrar y soltar; al crear, se suben después de guardar el producto).
- **Inventario:** stock editable en línea (Enter guarda como ajuste, Escape cancela), entradas y salidas con motivo, e historial kardex.
- **Categorías, Usuarios y Estadísticas de mercado** (ventas por país y ranking de productos).
- Los gráficos usan una sola serie con el token `--chart-1` (terracota validada en claro y oscuro).

### 404

- Página con ilustración y voz de la marca, salida al catálogo o al inicio y accesos a las cuatro categorías.

## Scripts (desde la raíz)

| Comando                   | Qué hace                                               |
| ------------------------- | ------------------------------------------------------ |
| `npm run dev`             | Frontend (Vite) y backend (`node --watch`) en paralelo |
| `npm run build`           | Build de producción del frontend en `frontend/dist`    |
| `npm run lint`            | ESLint en cada workspace                               |
| `npm test`                | Pruebas de cada workspace (Vitest)                     |
| `npm run e2e`             | Pruebas E2E con Cypress (requiere `npm run dev`)       |
| `npm run db:migrate`      | Aplica las migraciones pendientes                      |
| `npm run db:migrate:undo` | Deshace la última migración                            |
| `npm run db:seed`         | Carga todos los seeders                                |
| `npm run db:reset`        | Deshace todas las migraciones, migra y siembra         |
| `npm run db:test`         | Comprueba la conexión y cuenta tablas y productos      |
| `npm run format`          | Formatea el código con Prettier                        |
| `npm run format:check`    | Comprueba el formato sin modificar archivos            |

Para ejecutar un script en un solo workspace: `npm run <script> -w backend`.

### Pruebas del frontend

- `frontend/src/**/*.test.{js,jsx}` usan Vitest + Testing Library en jsdom: cliente HTTP, formateo de moneda, contexto de moneda, componentes base, router, contraste AA de los tokens, carrito (invitado, con sesión, fusión y actualización optimista), home, catálogo (filtros ⇄ URL, orden, búsqueda, drawer móvil, estado vacío), ficha de producto (galería, pestañas, agregar al carrito, agotado y 404), login y registro (validación, errores, redirección, fusión del carrito), checkout (cotización por país, métodos de envío, Yape, rechazo con la tarjeta 0002, dirección nueva, volver sin perder datos), tarjeta (marca, formato, Luhn, vencimiento), Mi cuenta y 404, con la API simulada (`src/test/tienda.jsx`).

### Pruebas E2E (Cypress)

- `frontend/cypress/e2e/cp-090-compra-completa.cy.js` — **CP-090**: catálogo → producto → carrito → login → checkout (dirección guardada, envío estándar, Yape) → confirmación con código de pedido, código de aprobación y tracking → "Mis pedidos".
- Corre contra la app real: primero `npm run dev` (frontend 5173 + API 3000 con los datos semilla) y luego `npm run e2e` (o `npm run e2e:open -w frontend` para la interfaz de Cypress). Usa la clienta de prueba María Quispe, vacía su carrito por la API antes de empezar y **crea un pedido real** (descuenta 1 unidad de stock).
- Si Vite arrancó en otro puerto, indícalo con `CYPRESS_BASE_URL=http://localhost:5174`.
- En la terminal integrada de VS Code, Cypress falla con `bad option: --smoke-test` porque VS Code define `ELECTRON_RUN_AS_NODE`: ejecútalo desde otra terminal o sin esa variable (`env -u ELECTRON_RUN_AS_NODE npm run e2e` en Git Bash).

### Pruebas del backend

- `backend/tests/*.test.js` (proyecto `unit`) usan Supertest con **toda** la capa de repositorios simulada en `tests/setup/mock-repositories.js`, así que **no necesitan base de datos** (sirven para CI). Si agregas un repositorio o una función de repositorio, agrégala también ahí.
- `backend/tests/integration/` consulta la base real de Supabase y se ejecuta solo si existe `DATABASE_URL`; sin ella, se omite.

## Equipo

- Brandon Cunza Robles — Líder de proyecto / integrador
- Jose Alexandro Lopez Mamani — Backend e infraestructura
- Roberto Israel Meza Oroe — Frontend React
