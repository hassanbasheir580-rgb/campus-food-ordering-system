import { BellRing, CheckCheck, RefreshCcw, TicketCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { formatCurrency } from '../config/appConfig';
import { useLiveRefresh } from '../hooks/useLiveRefresh';
import { api } from '../services/api';
import type { Order } from '../types/domain';

export const StaffQueuePage = () => {
  const [queue, setQueue] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQueue = useCallback(() => {
    api
      .staffQueue()
      .then(({ queue }) => setQueue(queue))
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Queue could not be loaded'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useLiveRefresh(loadQueue);

  const currentCalled = useMemo(() => queue.find((order) => order.status === 'CALLED'), [queue]);
  const readyOrders = queue.filter((order) => order.status === 'READY');

  const callOrder = async (orderId?: string) => {
    try {
      const result = await api.staffCallNext(orderId);
      toast.success(`Queue ${result.order.queueTicket?.queueNumber} called`);
      loadQueue();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Queue number could not be called');
    }
  };

  const completeOrder = async (orderId: string) => {
    try {
      await api.staffComplete(orderId);
      toast.success('Pickup confirmed');
      loadQueue();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Pickup could not be confirmed');
    }
  };

  if (loading) return <LoadingState />;

  return (
    <>
      <PageHeader eyebrow="Staff Queue" title="Call and confirm pickups">
        <button className="ghost-button" onClick={loadQueue}>
          <RefreshCcw size={17} />
          Refresh
        </button>
      </PageHeader>

      <section className="staff-display">
        <div className="current-ticket">
          <span>Now serving</span>
          <strong>{currentCalled?.queueTicket?.queueNumber ?? '---'}</strong>
          <p>{currentCalled ? currentCalled.studentName : 'No ticket currently called'}</p>
        </div>
        <div className="staff-controls">
          <button className="primary-button" onClick={() => callOrder(readyOrders[0]?.id)} disabled={!readyOrders.length}>
            <BellRing size={18} />
            Call next ready order
          </button>
          {currentCalled ? (
            <button className="ghost-button" onClick={() => completeOrder(currentCalled.id)}>
              <CheckCheck size={18} />
              Confirm pickup
            </button>
          ) : null}
        </div>
      </section>

      {queue.length === 0 ? (
        <EmptyState icon={TicketCheck} title="Queue is clear" message="Ready and waiting orders will appear here." />
      ) : (
        <section className="queue-table">
          {queue.map((order) => (
            <article className="staff-ticket" key={order.id}>
              <div>
                <strong>{order.queueTicket?.queueNumber ?? 'No ticket'}</strong>
                <span>{order.studentName}</span>
              </div>
              <p>{order.items.map((item) => `${item.quantity}x ${item.menuName}`).join(', ')}</p>
              <span>{formatCurrency(order.totalPrice)}</span>
              <StatusBadge value={order.status} />
              <div className="button-row">
                {order.status === 'READY' ? (
                  <button className="primary-button small" onClick={() => callOrder(order.id)}>
                    Call
                  </button>
                ) : null}
                {order.status === 'CALLED' ? (
                  <button className="ghost-button small" onClick={() => completeOrder(order.id)}>
                    Complete
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      )}
    </>
  );
};
