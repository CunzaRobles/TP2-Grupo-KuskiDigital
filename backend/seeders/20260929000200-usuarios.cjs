'use strict';

// Usuarios de prueba: uno por cada rol administrativo y dos clientes de referencia
// (historias de usuario María Quispe y Anna Becker). Contraseñas cifradas con bcrypt.
// Las credenciales están documentadas en el README (solo para desarrollo).

const bcrypt = require('bcrypt');

const PASSWORD_ADMIN = 'KuskiAdmin2026!';
const PASSWORD_CLIENTE = 'KuskiCliente2026!';
const BCRYPT_ROUNDS = 10;

// prettier-ignore
const usuarios = [
  { nombre: 'Rosa', apellido: 'Huamán Condori', correo: 'gerente@kuski.pe', rol: 'admin_gerente', telefono: '+51 984 100 200', password: PASSWORD_ADMIN },
  { nombre: 'Luis', apellido: 'Mamani Ccori', correo: 'ventas@kuski.pe', rol: 'admin_ventas', telefono: '+51 984 100 201', password: PASSWORD_ADMIN },
  { nombre: 'Carmen', apellido: 'Quispe Yupanqui', correo: 'logistica@kuski.pe', rol: 'admin_logistica', telefono: '+51 984 100 202', password: PASSWORD_ADMIN },
  { nombre: 'María', apellido: 'Quispe', correo: 'maria.quispe@example.com', rol: 'cliente', telefono: '+51 987 654 321', pais_codigo: 'PE', idioma_preferido: 'es', moneda_preferida: 'PEN', password: PASSWORD_CLIENTE },
  { nombre: 'Anna', apellido: 'Becker', correo: 'anna.becker@example.com', rol: 'cliente', telefono: '+49 30 1234 5678', pais_codigo: 'DE', idioma_preferido: 'de', moneda_preferida: 'EUR', password: PASSWORD_CLIENTE },
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
    const filas = await Promise.all(
      usuarios.map(async ({ password, ...u }) => ({
        pais_codigo: 'PE',
        idioma_preferido: 'es',
        moneda_preferida: 'PEN',
        ...u,
        password_hash: await bcrypt.hash(password, BCRYPT_ROUNDS),
      })),
    );

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
