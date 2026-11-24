import { DocumentoLegal } from './documento-legal';

// Páginas legales de la tienda (/terminos y /privacidad), enlazadas desde el pie y el registro.
export const TerminosPage = () => <DocumentoLegal documento="terminos" />;
export const PrivacidadPage = () => <DocumentoLegal documento="privacidad" />;
