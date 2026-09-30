// Valida params, query y body con esquemas Zod.
// En Express 5 req.query es de solo lectura, así que los datos ya validados
// (con coerción y valores por defecto) quedan en req.validated.
export const validate = (schemas) => (req, _res, next) => {
  req.validated = {};
  for (const key of ['params', 'query', 'body']) {
    if (schemas[key]) req.validated[key] = schemas[key].parse(req[key] ?? {});
  }
  next();
};
