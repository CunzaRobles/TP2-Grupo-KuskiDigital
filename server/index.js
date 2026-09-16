import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint de productos de biodiversidad andina
app.get('/api/productos', (req, res) => {
  res.json([
    { id: 1, nombre: 'Café Orgánico Valle Inca', precio: 28.5, stock: 40, categoria: 'Granos' },
    { id: 2, nombre: 'Textil de Alpaca Baby', precio: 120.0, stock: 12, categoria: 'Artesanía' },
    { id: 3, nombre: 'Quinua Real Roja (500g)', precio: 14.0, stock: 80, categoria: 'Granos' },
    { id: 4, nombre: 'Miel de Penca Sagrada', precio: 32.0, stock: 25, categoria: 'Naturistas' }
  ]);
});

// Endpoint simulado para recepción de pedidos
app.post('/api/pedidos', (req, res) => {
  const pedido = req.body;
  res.status(201).json({
    mensaje: 'Pedido registrado con éxito en PachaMarket',
    idSimulado: Math.floor(Math.random() * 1000) + 1,
    detalle: pedido
  });
});

app.listen(3000, () => console.log('Servidor Mock activo en http://localhost:3000'));