import { Clock, TicketCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { appConfig } from '../config/appConfig';
import { api } from '../services/api';
import type { PublicQueueDisplay } from '../types/domain';
import { StatusBadge } from './StatusBadge';

const formatTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(value));

export const PublicQueueCard = () => {
  const [current, setCurrent] = useState<PublicQueueDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadQueue = useCallback(() => {
    api
      .publicQueueDisplay()
      .then(({ current }) => {
        setCurrent(current);
        setError('');
      })
      .catch(() => setError('Queue display is temporarily unavailable'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadQueue();
    const refresh = window.setInterval(loadQueue, appConfig.queueRefreshMs);
    const socket = io(appConfig.socketUrl);
    socket.emit('queue:watch');
    socket.on('queue:updated', loadQueue);
    return () => {
      window.clearInterval(refresh);
      socket.disconnect();
    };
  }, [loadQueue]);

  if (loading) {
    return (
      <div className="public-queue-card" aria-live="polite">
        <TicketCheck size={34} />
        <span>Loading queue display</span>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="public-queue-card empty" aria-live="polite">
        <TicketCheck size={34} />
        <strong>No queue number called yet</strong>
        <span>{error || 'Ready orders will appear after staff call a queue number.'}</span>
      </div>
    );
  }

  return (
    <div className="public-queue-card active" aria-live="polite">
      <div className="public-queue-topline">
        <span>{current.queueStatus === 'CALLED' ? 'Now serving' : 'Ready ticket'}</span>
        <StatusBadge value={current.status} />
      </div>
      <strong className="public-queue-number">{current.queueNumber}</strong>
      <dl>
        <div>
          <dt>Order</dt>
          <dd>#{current.orderId.slice(0, 8).toUpperCase()}</dd>
        </div>
        <div>
          <dt>Outlet</dt>
          <dd>{current.vendorName}</dd>
        </div>
        <div>
          <dt>Pickup</dt>
          <dd>{current.message}</dd>
        </div>
        <div>
          <dt>Wait</dt>
          <dd>{current.estimatedWait > 0 ? `${current.estimatedWait} min` : 'Proceed now'}</dd>
        </div>
      </dl>
      <span className="public-queue-time">
        <Clock size={15} />
        Updated {formatTime(current.lastUpdated)}
      </span>
    </div>
  );
};
