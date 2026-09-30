'use strict';

// Activa RLS (sin políticas) en las tablas de control de sequelize-cli, igual que en las 19
// tablas del esquema: así la API REST pública de Supabase no puede leerlas ni escribirlas y el
// Security Advisor no marca "RLS disabled in public". La API Express se conecta como dueña de
// las tablas, por lo que no le afecta.
//
// - sequelize_meta: migraciones aplicadas (migrationStorageTableName en src/config/database.cjs).
// - sequelize_data / SequelizeData: registro de seeders, solo si algún día se configura
//   seederStorage: 'sequelize' (hoy los seeders no se registran). Ojo: esa tabla la crea
//   db:seed, después de migrar; en ese caso habría que activar RLS también tras sembrar.

const TABLAS = ['sequelize_meta', 'sequelize_data', 'SequelizeMeta', 'SequelizeData'];

// Recorre solo las tablas que existen en public (format %I cita cada nombre).
const alterarRls = (accion) => `
  DO $$
  DECLARE t text;
  BEGIN
    FOR t IN
      SELECT tablename FROM pg_catalog.pg_tables
       WHERE schemaname = 'public' AND tablename = ANY (ARRAY[${TABLAS.map((n) => `'${n}'`).join(', ')}])
    LOOP
      EXECUTE format('ALTER TABLE public.%I ${accion} ROW LEVEL SECURITY', t);
    END LOOP;
  END
  $$;
`;

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(alterarRls('ENABLE'));
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(alterarRls('DISABLE'));
  },
};
