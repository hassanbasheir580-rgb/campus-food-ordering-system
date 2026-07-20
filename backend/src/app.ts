import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { getDb } from './database/connection.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import adminRoutes from './routes/admin.routes.js';
import authRoutes from './routes/auth.routes.js';
import menuRoutes from './routes/menu.routes.js';
import orderRoutes from './routes/order.routes.js';
import queueRoutes from './routes/queue.routes.js';
import staffRoutes from './routes/staff.routes.js';
import vendorRoutes from './routes/vendor.routes.js';

export const createApp = () => {
  getDb();
  const app = express();

  app.use(helmet());
  const allowedOrigins = [
  env.clientUrl,
  "https://campus-food-ordering-system-frontend-i53qd13qe-hassan-basheir.vercel.app"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  })
);
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(env.nodeEnv === 'test' ? 'tiny' : 'dev'));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, appName: env.appName, version: '3.0.0' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/menu', menuRoutes);
  app.use('/api/queue', queueRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/vendor', vendorRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/staff', staffRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
