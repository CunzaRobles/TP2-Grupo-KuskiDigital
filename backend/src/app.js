import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import { apiLimiter } from './middleware/rate-limit.js';
import apiV1 from './routes/index.js';

const app = express();

// Detrás del proxy de Vercel: req.secure y req.ip salen de X-Forwarded-*, así funcionan la
// cookie `secure` y el límite de peticiones por IP.
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGINS,
    credentials: true,
  }),
);
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use('/api', apiLimiter);

app.use('/api/v1', apiV1);

app.use(notFound);
app.use(errorHandler);

// Vercel (Express zero-config) usa esta exportación; app.listen solo vive en server.js.
export default app;
