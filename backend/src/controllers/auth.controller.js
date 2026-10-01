import { COOKIE_SESION, env } from '../config/env.js';
import * as authService from '../services/auth.service.js';

const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

// Sin `domain`: la cookie queda en el dominio del frontend, que reenvía /api a la API.
const opcionesCookie = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.NODE_ENV === 'production',
  path: '/',
};

const iniciarSesion = (res, token) =>
  res.cookie(COOKIE_SESION, token, { ...opcionesCookie, maxAge: SIETE_DIAS_MS });

export const registro = async (req, res) => {
  const { usuario, token } = await authService.registrar(req.validated.body);
  iniciarSesion(res, token);
  res.status(201).json({ data: { usuario } });
};

export const login = async (req, res) => {
  const { usuario, token } = await authService.login(req.validated.body);
  iniciarSesion(res, token);
  res.json({ data: { usuario } });
};

export const logout = (_req, res) => {
  res.clearCookie(COOKIE_SESION, opcionesCookie);
  res.json({ data: { ok: true } });
};

// Sin sesión responde 200 con usuario null (no 401): la tienda lo consulta en cada carga y un
// visitante anónimo no es un error.
export const me = async (req, res) => {
  const usuario = req.usuario ? await authService.perfil(req.usuario.id) : null;
  res.json({ data: { usuario } });
};
