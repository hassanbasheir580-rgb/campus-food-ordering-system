import dotenv from 'dotenv';
import { resolve } from 'node:path';

dotenv.config();

const numberFromEnv = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  appName: process.env.APP_NAME ?? 'Campus Food Ordering and Management System',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: numberFromEnv(process.env.PORT, 4000),
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  databaseUrl: resolve(process.cwd(), process.env.DATABASE_URL ?? './data/campus_food.sqlite'),
  jwtSecret: process.env.JWT_SECRET ?? 'local-demo-secret-change-me',
  mockPaymentSuccessRate: Math.max(
    0,
    Math.min(1, numberFromEnv(process.env.MOCK_PAYMENT_SUCCESS_RATE, 0.9))
  ),
  queuePrefix: process.env.QUEUE_PREFIX ?? 'A'
};
