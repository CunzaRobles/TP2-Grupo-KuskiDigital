import { COOKIE_SESION, env } from '../config/env.js';
import * as authService from '../services/auth.service.js';

const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

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

export const me = async (req, res) => {
  const usuario = await authService.perfil(req.usuario.id);
  res.json({ data: { usuario } });
};
