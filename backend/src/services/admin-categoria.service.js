import * as categoriaRepository from '../repositories/categoria.repository.js';
import { AppError } from '../utils/app-error.js';
import { slugify } from '../utils/slug.js';

const categoriaNoEncontrada = () =>
  new AppError(404, 'CATEGORIA_NO_ENCONTRADA', 'No encontramos esa categoría');

const toCategoriaDTO = (c) => ({
  id: c.id,
  nombre: c.nombre,
  slug: c.slug,
  descripcion: c.descripcion,
  imagenUrl: c.imagenUrl,
  orden: c.orden,
  totalProductos: c.totalProductos ?? 0,
  productosActivos: c.productosActivos ?? 0,
});

const validarUnicos = async ({ nombre, slug }, excluirId) => {
  const conflictos = await categoriaRepository.findConflictos({ nombre, slug }, excluirId);
  if (conflictos.nombre) {
    throw new AppError(409, 'CATEGORIA_DUPLICADA', `Ya existe la categoría "${nombre}"`);
  }
  if (conflictos.slug)
    throw new AppError(409, 'SLUG_EN_USO', `Ya existe una categoría con la URL "${slug}"`);
};

export const listarCategorias = async () =>
  (await categoriaRepository.findAll()).map(toCategoriaDTO);

export const crearCategoria = async (datos) => {
  const slug = datos.slug || slugify(datos.nombre);
  await validarUnicos({ nombre: datos.nombre, slug });
  return toCategoriaDTO(await categoriaRepository.create({ ...datos, slug }));
};

export const actualizarCategoria = async (id, cambios) => {
  if (!(await categoriaRepository.findById(id))) throw categoriaNoEncontrada();
  await validarUnicos({ nombre: cambios.nombre, slug: cambios.slug }, id);
  return toCategoriaDTO(await categoriaRepository.update(id, cambios));
};

// Solo se elimina si no tiene productos (ni inactivos): productos.categoria_id es RESTRICT.
export const eliminarCategoria = async (id) => {
  const categoria = await categoriaRepository.findById(id);
  if (!categoria) throw categoriaNoEncontrada();
  if (categoria.totalProductos > 0) {
    throw new AppError(
      409,
      'CATEGORIA_CON_PRODUCTOS',
      `La categoría tiene ${categoria.totalProductos} productos: muévelos a otra antes de eliminarla`,
    );
  }
  await categoriaRepository.remove(id);
};
