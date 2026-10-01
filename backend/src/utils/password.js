import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 10;

export const hashPassword = (password) => bcrypt.hash(password, BCRYPT_ROUNDS);

export const compararPassword = (password, hash) => bcrypt.compare(password, hash);
