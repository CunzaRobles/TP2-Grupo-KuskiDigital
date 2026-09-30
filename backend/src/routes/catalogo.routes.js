import { Router } from 'express';
import * as catalogoController from '../controllers/catalogo.controller.js';

// Datos de apoyo del catálogo y del bloque de trazabilidad (públicos).
const router = Router();

router.get('/categorias', catalogoController.categorias);
router.get('/comunidades', catalogoController.comunidades);
router.get('/certificaciones', catalogoController.certificaciones);
router.get('/estadisticas/trazabilidad', catalogoController.trazabilidad);

export default router;
