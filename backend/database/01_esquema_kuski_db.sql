-- =====================================================================
-- KUSKI DIGITAL — Esquema de base de datos v2.1 (PostgreSQL 15+ / Supabase)
-- Plataforma E-commerce Global para Productos de la Biodiversidad Andina
-- Kuski Agroindustria S.A. — Cusco, Perú
--
-- Compatible con Supabase (SQL Editor) y con PostgreSQL local.
-- v2.1: limpieza por objeto (no borra el esquema public de Supabase),
--       RLS activado en todas las tablas, vistas con security_invoker
--       y search_path fijo en la función.
--
-- Cambios respecto a v1.0 (Documento Técnico) y Ficha ER:
--   * Unifica ambos modelos en uno solo (19 tablas).
--   * Sintaxis nativa PostgreSQL (IDENTITY, ENUM, TIMESTAMPTZ, triggers).
--   * Recupera la trazabilidad: tabla COMUNIDADES (antes PROVEEDOR).
--   * Certificaciones normalizadas (4FN, recomendación del Documento Técnico).
--   * Snapshot de precios y dirección en el pedido (historial inmutable).
--   * Roles administrativos: gerente, ventas, logística.
--   * Tablas de soporte para la simulación: tipos de cambio y tarifas de envío.
--   * Historial de estados del pedido para el tracking.
--
-- Ejecutar en el SQL Editor de Supabase, o en local conectado a kuski_db.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Limpieza (permite re-ejecutar el script en desarrollo)
--    ⚠ Borra las tablas de Kuski y sus datos. Nunca en producción.
-- ---------------------------------------------------------------------
DROP VIEW IF EXISTS v_productos_mas_vendidos, v_ventas_por_pais, v_productos_stock_bajo;
DROP TABLE IF EXISTS
  movimientos_inventario, envios, pagos, pedido_estados, pedido_items, pedidos,
  tarifas_envio, tipos_cambio, carrito_items, carritos, resenas,
  producto_certificaciones, certificaciones, producto_imagenes, productos,
  comunidades, categorias, direcciones, usuarios
  CASCADE;
DROP TYPE IF EXISTS rol_usuario, tipo_movimiento, estado_pedido, metodo_pago,
  estado_pago, metodo_envio, zona_envio;
DROP FUNCTION IF EXISTS fn_set_actualizado_en();

-- ---------------------------------------------------------------------
-- 1. Tipos enumerados
-- ---------------------------------------------------------------------
CREATE TYPE rol_usuario      AS ENUM ('cliente', 'admin_gerente', 'admin_ventas', 'admin_logistica');
CREATE TYPE tipo_movimiento  AS ENUM ('entrada', 'salida', 'ajuste');
CREATE TYPE estado_pedido    AS ENUM ('pendiente', 'pagado', 'preparando', 'en_transito', 'entregado', 'cancelado');
CREATE TYPE metodo_pago      AS ENUM ('tarjeta', 'paypal', 'yape', 'plin');
CREATE TYPE estado_pago      AS ENUM ('pendiente', 'aprobado', 'rechazado', 'reembolsado');
CREATE TYPE metodo_envio     AS ENUM ('estandar', 'express');
CREATE TYPE zona_envio       AS ENUM ('nacional', 'latam', 'norteamerica', 'europa', 'resto_mundo');

-- ---------------------------------------------------------------------
-- 2. Función para actualizar automáticamente "actualizado_en"
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_set_actualizado_en()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$;

-- =====================================================================
-- MÓDULO USUARIOS
-- =====================================================================
CREATE TABLE usuarios (
  id                 INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre             VARCHAR(100) NOT NULL,
  apellido           VARCHAR(100) NOT NULL,
  correo             VARCHAR(150) NOT NULL,
  password_hash      VARCHAR(255) NOT NULL,           -- bcrypt, nunca texto plano
  telefono           VARCHAR(20),
  pais_codigo        CHAR(2)      NOT NULL DEFAULT 'PE', -- ISO 3166-1 alfa-2
  idioma_preferido   CHAR(2)      NOT NULL DEFAULT 'es'
                       CHECK (idioma_preferido IN ('es', 'en', 'de')),
  moneda_preferida   CHAR(3)      NOT NULL DEFAULT 'PEN',
  rol                rol_usuario  NOT NULL DEFAULT 'cliente',
  activo             BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  actualizado_en     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_usuarios_correo UNIQUE (correo)
);

CREATE TABLE direcciones (
  id                    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id            INT          NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre_destinatario   VARCHAR(150) NOT NULL,
  pais_codigo           CHAR(2)      NOT NULL,
  ciudad                VARCHAR(100) NOT NULL,
  direccion             VARCHAR(255) NOT NULL,
  codigo_postal         VARCHAR(20),
  telefono              VARCHAR(20),
  es_principal          BOOLEAN      NOT NULL DEFAULT FALSE,
  creado_en             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
-- Solo una dirección principal por usuario
CREATE UNIQUE INDEX uk_direcciones_principal
  ON direcciones (usuario_id) WHERE es_principal;

-- =====================================================================
-- MÓDULO CATÁLOGO Y TRAZABILIDAD
-- =====================================================================
CREATE TABLE categorias (
  id            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  slug          VARCHAR(120) NOT NULL,
  descripcion   TEXT,
  imagen_url    VARCHAR(500),
  orden         SMALLINT     NOT NULL DEFAULT 0,
  CONSTRAINT uk_categorias_nombre UNIQUE (nombre),
  CONSTRAINT uk_categorias_slug   UNIQUE (slug)
);

-- Comunidades productoras (proveedores). Base del bloque de trazabilidad y del mapa.
CREATE TABLE comunidades (
  id                      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre                  VARCHAR(150) NOT NULL,
  razon_social            VARCHAR(150),
  region                  VARCHAR(100) NOT NULL DEFAULT 'Cusco',
  provincia               VARCHAR(100),
  altitud_msnm            INT          CHECK (altitud_msnm BETWEEN 0 AND 6000),
  latitud                 NUMERIC(9,6) CHECK (latitud  BETWEEN -90  AND 90),
  longitud                NUMERIC(9,6) CHECK (longitud BETWEEN -180 AND 180),
  familias_beneficiadas   INT          CHECK (familias_beneficiadas >= 0),
  descripcion             TEXT,
  imagen_url              VARCHAR(500),
  CONSTRAINT uk_comunidades_nombre UNIQUE (nombre)
);

CREATE TABLE productos (
  id                 INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sku                VARCHAR(30)   NOT NULL,
  nombre             VARCHAR(150)  NOT NULL,
  slug               VARCHAR(170)  NOT NULL,
  descripcion        TEXT,
  precio_base_pen    NUMERIC(10,2) NOT NULL CHECK (precio_base_pen > 0),
  stock              INT           NOT NULL DEFAULT 0 CHECK (stock >= 0),
  stock_minimo       INT           NOT NULL DEFAULT 5 CHECK (stock_minimo >= 0),
  peso_g             INT           NOT NULL CHECK (peso_g > 0),  -- para calcular envío
  destacado          BOOLEAN       NOT NULL DEFAULT FALSE,
  activo             BOOLEAN       NOT NULL DEFAULT TRUE,
  categoria_id       INT           NOT NULL REFERENCES categorias(id)  ON DELETE RESTRICT,
  comunidad_id       INT           NOT NULL REFERENCES comunidades(id) ON DELETE RESTRICT,
  creado_en          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  actualizado_en     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_productos_sku  UNIQUE (sku),
  CONSTRAINT uk_productos_slug UNIQUE (slug)
);

CREATE TABLE producto_imagenes (
  id             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  producto_id    INT          NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  url            VARCHAR(500) NOT NULL,
  texto_alt      VARCHAR(200),
  orden          SMALLINT     NOT NULL DEFAULT 0,
  es_principal   BOOLEAN      NOT NULL DEFAULT FALSE
);
CREATE UNIQUE INDEX uk_producto_imagen_principal
  ON producto_imagenes (producto_id) WHERE es_principal;

-- Certificaciones (orgánico, comercio justo, etc.) — relación N:M normalizada (4FN)
CREATE TABLE certificaciones (
  id                INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre            VARCHAR(100) NOT NULL,
  entidad_emisora   VARCHAR(150),
  CONSTRAINT uk_certificaciones_nombre UNIQUE (nombre)
);

CREATE TABLE producto_certificaciones (
  producto_id        INT NOT NULL REFERENCES productos(id)       ON DELETE CASCADE,
  certificacion_id   INT NOT NULL REFERENCES certificaciones(id) ON DELETE CASCADE,
  CONSTRAINT pk_producto_certificaciones PRIMARY KEY (producto_id, certificacion_id)
);

CREATE TABLE resenas (
  id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id      INT         NOT NULL REFERENCES usuarios(id)  ON DELETE CASCADE,
  producto_id     INT         NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  calificacion    SMALLINT    NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  comentario      TEXT,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_resenas_usuario_producto UNIQUE (usuario_id, producto_id)
);

-- =====================================================================
-- MÓDULO CARRITO
-- =====================================================================
CREATE TABLE carritos (
  id               INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id       INT         NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_carritos_usuario UNIQUE (usuario_id)   -- un carrito activo por usuario
);

CREATE TABLE carrito_items (
  id            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  carrito_id    INT NOT NULL REFERENCES carritos(id)  ON DELETE CASCADE,
  producto_id   INT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cantidad      INT NOT NULL CHECK (cantidad > 0),
  CONSTRAINT uk_carrito_items UNIQUE (carrito_id, producto_id)
);

-- =====================================================================
-- MÓDULO SIMULACIÓN (tipo de cambio y tarifas de envío)
-- =====================================================================
CREATE TABLE tipos_cambio (
  moneda_codigo    CHAR(3)       PRIMARY KEY,           -- PEN, USD, EUR
  simbolo          VARCHAR(5)    NOT NULL,
  valor_en_pen     NUMERIC(10,4) NOT NULL CHECK (valor_en_pen > 0), -- 1 unidad = X soles
  actualizado_en   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE tarifas_envio (
  id                  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  zona                zona_envio    NOT NULL,
  metodo              metodo_envio  NOT NULL,
  transportista       VARCHAR(100)  NOT NULL,
  costo_base_pen      NUMERIC(10,2) NOT NULL CHECK (costo_base_pen >= 0),
  costo_por_kg_pen    NUMERIC(10,2) NOT NULL CHECK (costo_por_kg_pen >= 0),
  dias_min            SMALLINT      NOT NULL CHECK (dias_min > 0),
  dias_max            SMALLINT      NOT NULL,
  CONSTRAINT ck_tarifas_dias CHECK (dias_max >= dias_min),
  CONSTRAINT uk_tarifas_zona_metodo UNIQUE (zona, metodo)
);

-- =====================================================================
-- MÓDULO PEDIDOS, PAGOS Y ENVÍOS
-- =====================================================================
CREATE TABLE pedidos (
  id                  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo              VARCHAR(20)   NOT NULL,             -- ej. KD-000123 (visible al cliente)
  usuario_id          INT           NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  estado              estado_pedido NOT NULL DEFAULT 'pendiente',
  -- Moneda y tipo de cambio congelados al momento de la compra
  moneda              CHAR(3)       NOT NULL REFERENCES tipos_cambio(moneda_codigo),
  tipo_cambio         NUMERIC(10,4) NOT NULL CHECK (tipo_cambio > 0),
  subtotal_pen        NUMERIC(12,2) NOT NULL CHECK (subtotal_pen >= 0),
  costo_envio_pen     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (costo_envio_pen >= 0),
  igv_pen             NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (igv_pen >= 0), -- 18% solo Perú
  total_pen           NUMERIC(12,2) NOT NULL CHECK (total_pen >= 0),
  total_moneda        NUMERIC(12,2) NOT NULL CHECK (total_moneda >= 0),
  -- Snapshot de la dirección (el pedido no cambia si el cliente edita su dirección)
  envio_destinatario  VARCHAR(150)  NOT NULL,
  envio_pais_codigo   CHAR(2)       NOT NULL,
  envio_ciudad        VARCHAR(100)  NOT NULL,
  envio_direccion     VARCHAR(255)  NOT NULL,
  envio_codigo_postal VARCHAR(20),
  envio_telefono      VARCHAR(20),
  creado_en           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  actualizado_en      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_pedidos_codigo UNIQUE (codigo),
  CONSTRAINT ck_pedidos_total CHECK (total_pen = subtotal_pen + costo_envio_pen + igv_pen)
);

CREATE TABLE pedido_items (
  id                    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pedido_id             INT           NOT NULL REFERENCES pedidos(id)   ON DELETE CASCADE,
  producto_id           INT           NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  nombre_producto       VARCHAR(150)  NOT NULL,  -- snapshot
  cantidad              INT           NOT NULL CHECK (cantidad > 0),
  precio_unitario_pen   NUMERIC(10,2) NOT NULL CHECK (precio_unitario_pen > 0), -- snapshot
  subtotal_pen          NUMERIC(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario_pen) STORED,
  CONSTRAINT uk_pedido_items UNIQUE (pedido_id, producto_id)
);

-- Historial de estados: alimenta el tracking visual (Confirmado → ... → Entregado)
CREATE TABLE pedido_estados (
  id            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pedido_id     INT           NOT NULL REFERENCES pedidos(id)  ON DELETE CASCADE,
  estado        estado_pedido NOT NULL,
  comentario    VARCHAR(255),
  usuario_id    INT           REFERENCES usuarios(id) ON DELETE SET NULL, -- admin que lo cambió
  creado_en     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE pagos (
  id                  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pedido_id           INT           NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  metodo              metodo_pago   NOT NULL,
  estado              estado_pago   NOT NULL DEFAULT 'pendiente',
  pasarela            VARCHAR(50)   NOT NULL DEFAULT 'simulada', -- futuro: izipay, niubiz
  monto               NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  moneda              CHAR(3)       NOT NULL REFERENCES tipos_cambio(moneda_codigo),
  numero_operacion    VARCHAR(40),
  tarjeta_ultimos4    CHAR(4),      -- solo los 4 últimos dígitos; NUNCA el número completo
  mensaje_respuesta   VARCHAR(255),
  creado_en           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_pagos_pedido UNIQUE (pedido_id)
);

CREATE TABLE envios (
  id                   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pedido_id            INT          NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  tarifa_envio_id      INT          NOT NULL REFERENCES tarifas_envio(id) ON DELETE RESTRICT,
  transportista        VARCHAR(100) NOT NULL,
  metodo               metodo_envio NOT NULL,
  codigo_seguimiento   VARCHAR(80),
  peso_total_g         INT          NOT NULL CHECK (peso_total_g > 0),
  fecha_estimada       DATE,
  fecha_entrega        DATE,
  creado_en            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_envios_pedido UNIQUE (pedido_id)
);

-- =====================================================================
-- MÓDULO INVENTARIO (kardex)
-- =====================================================================
CREATE TABLE movimientos_inventario (
  id                 INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  producto_id        INT             NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  tipo               tipo_movimiento NOT NULL,
  cantidad           INT             NOT NULL CHECK (cantidad <> 0), -- negativo en salidas/ajustes a la baja
  stock_resultante   INT             NOT NULL CHECK (stock_resultante >= 0),
  motivo             VARCHAR(255),
  usuario_id         INT             REFERENCES usuarios(id) ON DELETE SET NULL, -- admin responsable
  pedido_id          INT             REFERENCES pedidos(id)  ON DELETE SET NULL, -- si la salida fue por venta
  creado_en          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 3. Índices para consultas frecuentes (FKs y filtros del catálogo)
-- ---------------------------------------------------------------------
CREATE INDEX ix_direcciones_usuario     ON direcciones (usuario_id);
CREATE INDEX ix_productos_categoria     ON productos (categoria_id);
CREATE INDEX ix_productos_comunidad     ON productos (comunidad_id);
CREATE INDEX ix_productos_destacados    ON productos (destacado) WHERE activo;
CREATE INDEX ix_producto_imagenes_prod  ON producto_imagenes (producto_id);
CREATE INDEX ix_resenas_producto        ON resenas (producto_id);
CREATE INDEX ix_pedidos_usuario         ON pedidos (usuario_id);
CREATE INDEX ix_pedidos_estado_fecha    ON pedidos (estado, creado_en DESC);
CREATE INDEX ix_pedido_items_producto   ON pedido_items (producto_id);
CREATE INDEX ix_pedido_estados_pedido   ON pedido_estados (pedido_id, creado_en);
CREATE INDEX ix_movimientos_producto    ON movimientos_inventario (producto_id, creado_en DESC);

-- ---------------------------------------------------------------------
-- 4. Triggers de "actualizado_en"
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_usuarios_actualizado  BEFORE UPDATE ON usuarios  FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();
CREATE TRIGGER trg_productos_actualizado BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();
CREATE TRIGGER trg_carritos_actualizado  BEFORE UPDATE ON carritos  FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();
CREATE TRIGGER trg_pedidos_actualizado   BEFORE UPDATE ON pedidos   FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();

-- ---------------------------------------------------------------------
-- 5. Vistas de apoyo para el panel administrador
--    security_invoker: la vista respeta los permisos de quien consulta
-- ---------------------------------------------------------------------
CREATE VIEW v_productos_stock_bajo WITH (security_invoker = true) AS
SELECT p.id, p.sku, p.nombre, p.stock, p.stock_minimo, c.nombre AS categoria
FROM productos p
JOIN categorias c ON c.id = p.categoria_id
WHERE p.activo AND p.stock <= p.stock_minimo;

CREATE VIEW v_ventas_por_pais WITH (security_invoker = true) AS
SELECT envio_pais_codigo AS pais,
       COUNT(*)          AS pedidos,
       SUM(total_pen)    AS total_pen
FROM pedidos
WHERE estado NOT IN ('pendiente', 'cancelado')
GROUP BY envio_pais_codigo;

CREATE VIEW v_productos_mas_vendidos WITH (security_invoker = true) AS
SELECT pi.producto_id, pi.nombre_producto,
       SUM(pi.cantidad)     AS unidades,
       SUM(pi.subtotal_pen) AS total_pen
FROM pedido_items pi
JOIN pedidos pe ON pe.id = pi.pedido_id
WHERE pe.estado NOT IN ('pendiente', 'cancelado')
GROUP BY pi.producto_id, pi.nombre_producto;

-- ---------------------------------------------------------------------
-- 6. Seguridad: Row Level Security (RLS)
--    Supabase expone el esquema public por su API REST. Al activar RLS
--    SIN políticas, nadie puede leer ni escribir por esa API.
--    El backend Express se conecta como dueño de las tablas (usuario
--    postgres), por lo que no se ve afectado: toda la lógica y los
--    permisos pasan por la API propia de Kuski (arquitectura N-Layer).
-- ---------------------------------------------------------------------
ALTER TABLE usuarios                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE direcciones              ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias               ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunidades              ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto_imagenes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificaciones          ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto_certificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE resenas                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE carritos                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE carrito_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_cambio             ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarifas_envio            ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_items             ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_estados           ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE envios                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario   ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- Fin del esquema — Kuski_DB v2.1
-- =====================================================================