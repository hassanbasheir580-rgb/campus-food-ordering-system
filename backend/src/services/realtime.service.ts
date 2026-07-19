import type { Server } from 'socket.io';
import type { OrderDetails } from '../types/domain.js';

let io: Server | null = null;

export const realtime = {
  attach(server: Server) {
    io = server;
  },

  orderUpdated(order: OrderDetails) {
    io?.to(`student:${order.studentId}`).emit('order:updated', order);
    io?.to(`vendor:${order.vendorId}`).emit('order:updated', order);
    io?.emit('queue:updated');
  },

  queueUpdated() {
    io?.emit('queue:updated');
  }
};
