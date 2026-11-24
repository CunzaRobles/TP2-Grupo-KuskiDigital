'use strict';

// Usuarios de prueba: uno por cada rol administrativo y dos clientes de referencia
// (historias de usuario María Quispe y Anna Becker). Contraseñas cifradas con bcrypt.
// La contraseña de todas las cuentas sale de SEED_PASSWORD (backend/.env): las credenciales no
// se publican en el repositorio, se entregan por canal privado.

const bcrypt = require('bcryptjs');

const BCRYPT_ROUNDS = 10;
// Solo para una base local de desarrollo. Fuera de NODE_ENV=development, SEED_PASSWORD es
// obligatoria. Las mismas cuentas viven en la base compartida de Supabase: al sembrarla, define
// SEED_PASSWORD aunque estés en desarrollo.
const PASSWORD_DESARROLLO = 'kuski-desarrollo-2026';

function passwordSemilla() {
  const definida = process.env.SEED_PASSWORD?.trim();
  if (definida) {
    if (definida.length < 8) throw new Error('SEED_PASSWORD debe tener al menos 8 caracteres.');
    return definida;
  }
  const entorno = process.env.NODE_ENV ?? 'development';
  if (entorno !== 'development') {
    throw new Error(`Define SEED_PASSWORD en backend/.env: es obligatoria con NODE_ENV=${entorno}.`);
  }
  console.warn(
    'SEED_PASSWORD no está definida: los usuarios de prueba usan la contraseña por defecto de desarrollo. No la uses en una base compartida.',
  );
  return PASSWORD_DESARROLLO;
}

// prettier-ignore
const usuarios = [
  { nombre: 'Rosa', apellido: 'Huamán Condori', correo: 'gerente@kuski.pe', rol: 'admin_gerente', telefono: '+51 984 100 200' },
  { nombre: 'Luis', apellido: 'Mamani Ccori', correo: 'ventas@kuski.pe', rol: 'admin_ventas', telefono: '+51 984 100 201' },
  { nombre: 'Carmen', apellido: 'Quispe Yupanqui', correo: 'logistica@kuski.pe', rol: 'admin_logistica', telefono: '+51 984 100 202' },
  { nombre: 'María', apellido: 'Quispe', correo: 'maria.quispe@example.com', rol: 'cliente', telefono: '+51 987 654 321', pais_codigo: 'PE', idioma_preferido: 'es', moneda_preferida: 'PEN' },
  { nombre: 'Anna', apellido: 'Becker', correo: 'anna.becker@example.com', rol: 'cliente', telefono: '+49 30 1234 5678', pais_codigo: 'DE', idioma_preferido: 'de', moneda_preferida: 'EUR' },
];

const direcciones = {
  'maria.quispe@example.com': {
    nombre_destinatario: 'María Quispe',
    pais_codigo: 'PE',
    ciudad: 'Cusco',
    direccion: 'Av. de la Cultura 1520, Dpto. 302, Wanchaq',
    codigo_postal: '08002',
    telefono: '+51 987 654 321',
  },
  'anna.becker@example.com': {
    nombre_destinatario: 'Anna Becker',
    pais_codigo: 'DE',
    ciudad: 'Berlin',
    direccion: 'Kastanienallee 12',
    codigo_postal: '10435',
    telefono: '+49 30 1234 5678',
  },
};

module.exports = {
  async up(queryInterface) {
    const passwordHash = await bcrypt.hash(passwordSemilla(), BCRYPT_ROUNDS);
    const filas = usuarios.map((u) => ({
      pais_codigo: 'PE',
      idioma_preferido: 'es',
      moneda_preferida: 'PEN',
      ...u,
      password_hash: passwordHash,
    }));

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkInsert('usuarios', filas, { transaction });

      const [ids] = await queryInterface.sequelize.query(
        'SELECT id, correo FROM usuarios WHERE correo IN (:correos)',
        { replacements: { correos: Object.keys(direcciones) }, transaction },
      );
      await queryInterface.bulkInsert(
        'direcciones',
        ids.map(({ id, correo }) => ({
          usuario_id: id,
          es_principal: true,
          ...direcciones[correo],
        })),
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    // direcciones se borra en cascada
    await queryInterface.bulkDelete('usuarios', { correo: usuarios.map((u) => u.correo) });
  },
};
