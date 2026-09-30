# Kuski Digital

Tienda e-commerce de **Kuski Agroindustria S.A.** (Cusco, Perú): café orgánico, superalimentos, textiles de alpaca y artesanía, cada producto trazable hasta su comunidad productora.

Proyecto del curso Taller de Proyectos — Universidad Continental.

## Estructura

Monorepo con npm workspaces y un único `package-lock.json` en la raíz.

```
.
├── frontend/          # React 19 + Vite 8 (puerto 5173)
├── backend/           # API REST en Express 5 (puerto 3000)
│   ├── src/
│   │   ├── app.js     # configuración de Express (se importa en las pruebas)
│   │   └── server.js  # arranque: lee .env y hace listen
│   ├── tests/         # Vitest + Supertest
│   ├── database/      # scripts SQL del esquema
│   └── .env.example
├── docs/              # documentación técnica
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

| Variable       | Descripción                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| `PORT`         | Puerto de la API (por defecto `3000`).                                                                  |
| `DATABASE_URL` | Cadena de conexión de Supabase: _Project Settings → Database → Connection string → **Session pooler**_. |
| `JWT_SECRET`   | Secreto para firmar los tokens JWT.                                                                     |

`backend/.env` nunca se sube al repositorio.

## Desarrollo

```bash
npm run dev
```

Levanta los dos servidores en paralelo:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000 (por ejemplo, http://localhost:3000/api/productos)

En desarrollo, Vite redirige las peticiones a `/api` hacia el backend. Por eso el frontend llama a `fetch('/api/...')` sin escribir el host.

## Scripts (desde la raíz)

| Comando                | Qué hace                                               |
| ---------------------- | ------------------------------------------------------ |
| `npm run dev`          | Frontend (Vite) y backend (`node --watch`) en paralelo |
| `npm run build`        | Build de producción del frontend en `frontend/dist`    |
| `npm run lint`         | ESLint en cada workspace                               |
| `npm test`             | Pruebas de cada workspace (Vitest)                     |
| `npm run format`       | Formatea el código con Prettier                        |
| `npm run format:check` | Comprueba el formato sin modificar archivos            |

Para ejecutar un script en un solo workspace: `npm run <script> -w backend`.

## Equipo

- Brandon Cunza Robles — Líder de proyecto / integrador
- Jose Alexandro Lopez Mamani — Backend e infraestructura
- Roberto Israel Meza Oroe — Frontend React
