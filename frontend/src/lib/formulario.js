import { useState } from 'react';

// Formularios validados con Zod. Los mensajes de los esquemas son claves de i18n
// ('validacion.correo'); la interfaz los traduce al mostrarlos.

/** ZodError → { campo: clave } con el primer error de cada campo (rutas anidadas con '.'). */
export const aErrores = (error) => {
  const errores = {};
  for (const issue of error.issues) {
    const campo = issue.path.join('.');
    if (!(campo in errores)) errores[campo] = issue.message;
  }
  return errores;
};

export const validar = (schema, valores) => {
  const resultado = schema.safeParse(valores);
  return resultado.success
    ? { datos: resultado.data, errores: {} }
    : { datos: null, errores: aErrores(resultado.error) };
};

/**
 * Estado de un formulario: valores, errores y envío.
 * - Antes del primer envío no se muestran errores (no se regaña mientras se escribe).
 * - Después, cada cambio vuelve a validar y el error desaparece en cuanto se corrige.
 * - Al enviar con errores, el foco va al primer campo inválido.
 */
export function useFormulario(schema, inicial) {
  const [valores, setValores] = useState(inicial);
  const [errores, setErrores] = useState({});
  const [intentado, setIntentado] = useState(false);

  const cambiar = (campo, valor) => {
    const nuevos = { ...valores, [campo]: valor };
    setValores(nuevos);
    if (intentado) setErrores(validar(schema, nuevos).errores);
  };

  const enviar = (alValidar) => (evento) => {
    evento?.preventDefault();
    const formulario = evento?.currentTarget;
    setIntentado(true);
    const resultado = validar(schema, valores);
    setErrores(resultado.errores);
    if (resultado.datos) {
      alValidar(resultado.datos);
    } else if (formulario?.querySelector) {
      // Tras pintar los errores, lleva el foco al primer campo marcado
      requestAnimationFrame(() => formulario.querySelector('[aria-invalid="true"]')?.focus());
    }
  };

  // Props para <Input>: <Input {...campo('correo')} />
  const campo = (nombre) => ({
    name: nombre,
    value: valores[nombre] ?? '',
    onChange: (e) => cambiar(nombre, e.target.value),
  });

  return { valores, setValores, errores, setErrores, cambiar, enviar, campo };
}

/**
 * Validación de valores que viven en otro componente (p. ej. los pasos del checkout, cuyo
 * estado guarda la página para poder volver atrás sin perder datos). Los errores se derivan
 * de los valores actuales y solo se muestran después del primer intento.
 */
export function useValidacion(schema, valores) {
  const [intentado, setIntentado] = useState(false);
  const errores = intentado ? validar(schema, valores).errores : {};

  // Devuelve los datos válidos o null (y enfoca el primer campo con error dentro de `raiz`).
  const comprobar = (raiz) => {
    setIntentado(true);
    const resultado = validar(schema, valores);
    if (!resultado.datos && raiz?.querySelector) {
      requestAnimationFrame(() => raiz.querySelector('[aria-invalid="true"]')?.focus());
    }
    return resultado.datos;
  };

  return { errores, comprobar };
}
