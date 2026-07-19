import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { env } from './config/env.js';
import { createApp } from './app.js';
import { authService } from './services/auth.service.js';
import { realtime } from './services/realtime.service.js';

const app = createApp();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: env.clientUrl,
    credentials: true
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token || typeof token !== 'string') return next();
  const user = authService.verify(token);
  if (user) {
    socket.data.user = user;
  }
  next();
});

io.on('connection', (socket) => {
  const user = socket.data.user;
  if (user?.role === 'STUDENT') socket.join(`student:${user.id}`);
  if (user?.role === 'VENDOR' && user.vendorId) socket.join(`vendor:${user.vendorId}`);
  socket.on('queue:watch', () => socket.join('queue'));
});

realtime.attach(io);

httpServer.listen(env.port, () => {
  console.log(`${env.appName} API listening on http://localhost:${env.port}`);
});
