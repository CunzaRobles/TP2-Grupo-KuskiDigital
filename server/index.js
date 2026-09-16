import express from 'express';
import cors from 'cors';
const app = express();

app.use(cors());
app.use(express.json());

// Endpoint simulado del catálogo
app.get('/api/productos', (req, res) => {
  res.json([
    { id: 1, nombre: 'Café orgánico', precio: 18.5, stock: 42 },
    { id: 2, nombre: 'Textil de alpaca', precio: 45.0, stock: 15 }
  ]);
});

app.listen(3000, () => console.log('Mock server activo en http://localhost:3000'));