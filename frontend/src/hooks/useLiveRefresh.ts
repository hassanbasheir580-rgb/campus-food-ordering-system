import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { appConfig } from '../config/appConfig';
import { useAuth } from '../context/AuthContext';

export const useLiveRefresh = (onRefresh: () => void) => {
  const { token } = useAuth();

  useEffect(() => {
    const socket = io(appConfig.socketUrl, { auth: { token } });
    socket.emit('queue:watch');
    socket.on('order:updated', onRefresh);
    socket.on('queue:updated', onRefresh);
    return () => {
      socket.disconnect();
    };
  }, [onRefresh, token]);
};
