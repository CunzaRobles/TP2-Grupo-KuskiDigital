// Cliente HTTP de la API Express. La sesión viaja en la cookie httpOnly kuski_token,
// por eso todas las peticiones usan credentials: 'include'.
// La API responde { data } o { error: { code, message, details? } }.

export const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Omite undefined, null y ''; los arreglos se envían como valores repetidos (?categoria=a&categoria=b)
export const toQueryString = (params = {}) => {
  const qs = new URLSearchParams();
  for (const [clave, valor] of Object.entries(params)) {
    const valores = Array.isArray(valor) ? valor : [valor];
    for (const v of valores) {
      if (v !== undefined && v !== null && v !== '') qs.append(clave, String(v));
    }
  }
  const texto = qs.toString();
  return texto ? `?${texto}` : '';
};

const leerJson = async (res) => {
  if (res.status === 204) return null;
  const texto = await res.text();
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
};

// FormData (subida de imágenes) viaja tal cual: el navegador fija el Content-Type multipart.
export async function request(path, { method = 'GET', body, params, signal, headers } = {}) {
  const esFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  let res;
  try {
    res = await fetch(`${API_BASE}${path}${toQueryString(params)}`, {
      method,
      credentials: 'include',
      signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && !esFormData && { 'Content-Type': 'application/json' }),
        ...headers,
      },
      body: body === undefined || esFormData ? body : JSON.stringify(body),
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError(0, 'NETWORK_ERROR', 'No se pudo conectar con el servidor');
  }

  const json = await leerJson(res);

  if (!res.ok) {
    const error = json?.error;
    throw new ApiError(
      res.status,
      error?.code ?? 'HTTP_ERROR',
      error?.message ?? `Error ${res.status}`,
      error?.details,
    );
  }

  return json?.data ?? null;
}

export const http = {
  get: (path, opciones) => request(path, { ...opciones, method: 'GET' }),
  post: (path, body, opciones) => request(path, { ...opciones, method: 'POST', body }),
  put: (path, body, opciones) => request(path, { ...opciones, method: 'PUT', body }),
  patch: (path, body, opciones) => request(path, { ...opciones, method: 'PATCH', body }),
  delete: (path, opciones) => request(path, { ...opciones, method: 'DELETE' }),
};
