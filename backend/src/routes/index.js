import { Router } from 'express';
import adminRoutes from './admin.routes.js';
import authRoutes from './auth.routes.js';
import carritoRoutes from './carrito.routes.js';
import catalogoRoutes from './catalogo.routes.js';
import checkoutRoutes from './checkout.routes.js';
import direccionRoutes from './direccion.routes.js';
import docsRoutes from './docs.routes.js';
import healthRoutes from './health.routes.js';
import pedidoRoutes from './pedido.routes.js';
import productoRoutes from './producto.routes.js';

// Router de la API v1 (montado en /api/v1)
const router = Router();

router.use('/health', healthRoutes);
router.use('/docs', docsRoutes);
router.use('/auth', authRoutes);
router.use('/productos', productoRoutes);
router.use('/', catalogoRoutes);
router.use('/carrito', carritoRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/pedidos', pedidoRoutes);
router.use('/direcciones', direccionRoutes);
router.use('/admin', adminRoutes);

export default router;
