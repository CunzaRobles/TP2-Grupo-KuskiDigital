export default function Catalogo() {
  const producto = {
    nombre: "Café Orgánico KuskiDigital",
    precio: "S/ 18.50",
    origen: "Cusco, Perú"
  };

  return (
    <div style={{ border: '1px solid #0070f3', borderRadius: '8px', padding: '16px', margin: '20px 0' }}>
      <h2>Módulo de Catálogo - Vista Previa (KuskiDigital)</h2>
      <p><strong>Producto:</strong> {producto.nombre}</p>
      <p><strong>Precio:</strong> {producto.precio}</p>
      <p><strong>Origen:</strong> {producto.origen}</p>
      <small>Desarrollado por: Roberto Meza</small>
    </div>
  );
}