'use strict';

// Libro de Reclamaciones virtual (Ley 29571, arts. 150-151, modificados por la Ley 32495;
// D.S. 011-2011-PCM, modificado por el D.S. 101-2022-PCM). Una fila por hoja de reclamación.
// Como el resto del esquema: RLS activado sin políticas (la API pública de Supabase no la ve)
// y actualizado_en mantenido por fn_set_actualizado_en() del baseline.

const UP = `
  CREATE TYPE tipo_reclamacion   AS ENUM ('reclamo', 'queja');
  CREATE TYPE estado_reclamacion AS ENUM ('recibido', 'en_atencion', 'respondido');
  CREATE TYPE tipo_documento     AS ENUM ('DNI', 'CE', 'PASAPORTE');
  CREATE TYPE bien_contratado    AS ENUM ('producto', 'servicio');

  CREATE TABLE reclamaciones (
    id                    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo                VARCHAR(20)        NOT NULL,            -- LR-2026-000001
    tipo                  tipo_reclamacion   NOT NULL,
    estado                estado_reclamacion NOT NULL DEFAULT 'recibido',
    -- Consumidor
    nombre                VARCHAR(150)       NOT NULL,
    tipo_documento        tipo_documento     NOT NULL,
    numero_documento      VARCHAR(20)        NOT NULL,
    domicilio             VARCHAR(255)       NOT NULL,
    telefono              VARCHAR(20)        NOT NULL,
    correo                VARCHAR(150)       NOT NULL,
    menor_de_edad         BOOLEAN            NOT NULL DEFAULT FALSE,
    apoderado_nombre      VARCHAR(150),                           -- padre o madre del menor
    -- Bien contratado
    bien_contratado       bien_contratado    NOT NULL,
    pedido_codigo         VARCHAR(20),                            -- KD-000123 (opcional)
    monto_reclamado       NUMERIC(12,2),                          -- en soles (opcional)
    descripcion           VARCHAR(500)       NOT NULL,
    -- Detalle de la reclamación y pedido del consumidor
    detalle               TEXT               NOT NULL,
    pedido_consumidor     TEXT               NOT NULL,
    -- Respuesta del proveedor
    respuesta             TEXT,
    respondido_por        INT                REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_respuesta       TIMESTAMPTZ,
    fecha_limite          DATE               NOT NULL,            -- 15 días hábiles
    creado_en             TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    actualizado_en        TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_reclamaciones_codigo UNIQUE (codigo),
    CONSTRAINT ck_reclamaciones_codigo CHECK (codigo ~ '^LR-[0-9]{4}-[0-9]{6}$'),
    CONSTRAINT ck_reclamaciones_pedido CHECK (pedido_codigo IS NULL OR pedido_codigo ~ '^KD-[0-9]{6}$'),
    CONSTRAINT ck_reclamaciones_monto CHECK (monto_reclamado IS NULL OR monto_reclamado > 0),
    CONSTRAINT ck_reclamaciones_apoderado CHECK (NOT menor_de_edad OR apoderado_nombre IS NOT NULL),
    CONSTRAINT ck_reclamaciones_respuesta CHECK (
      estado <> 'respondido' OR (respuesta IS NOT NULL AND fecha_respuesta IS NOT NULL)
    )
  );

  CREATE INDEX ix_reclamaciones_estado_fecha ON reclamaciones (estado, creado_en DESC);

  CREATE TRIGGER trg_reclamaciones_actualizado BEFORE UPDATE ON reclamaciones
    FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();

  ALTER TABLE reclamaciones ENABLE ROW LEVEL SECURITY;
`;

const DOWN = `
  DROP TABLE IF EXISTS reclamaciones;
  DROP TYPE IF EXISTS bien_contratado;
  DROP TYPE IF EXISTS tipo_documento;
  DROP TYPE IF EXISTS estado_reclamacion;
  DROP TYPE IF EXISTS tipo_reclamacion;
`;

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction((transaction) =>
      queryInterface.sequelize.query(UP, { transaction }),
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction((transaction) =>
      queryInterface.sequelize.query(DOWN, { transaction }),
    );
  },
};
