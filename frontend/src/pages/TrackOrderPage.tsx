import { MessageSquareText, PackageCheck, RefreshCcw, Star, Ticket } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { OrderStepper } from '../components/OrderStepper';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { formatCurrency } from '../config/appConfig';
import { useLiveRefresh } from '../hooks/useLiveRefresh';
import { api } from '../services/api';
import type { Order } from '../types/domain';

export const TrackOrderPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const loadOrders = useCallback(() => {
    api
      .myOrders()
      .then(({ orders }) => {
        setOrders(orders);
        setSelectedId((current) => current || orders[0]?.id || '');
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Orders could not be loaded'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useLiveRefresh(loadOrders);

  const selected = useMemo(() => orders.find((order) => order.id === selectedId) ?? orders[0], [orders, selectedId]);

  const submitReview = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    try {
      await api.submitReview(selected.id, rating, comment);
      toast.success('Review submitted');
      setComment('');
      loadOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Review could not be submitted');
    }
  };

  if (loading) return <LoadingState />;

  if (!orders.length) {
    return (
      <>
        <PageHeader eyebrow="Order Tracking" title="Track queue status" />
        <EmptyState icon={PackageCheck} title="No orders yet" message="Place an order to see queue and status updates here." />
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Order Tracking" title="Track queue status">
        <button className="ghost-button" onClick={loadOrders}>
          <RefreshCcw size={17} />
          Refresh
        </button>
      </PageHeader>

      <div className="tracking-grid">
        <aside className="order-list">
          {orders.map((order) => (
            <button className={order.id === selected?.id ? 'active' : ''} key={order.id} onClick={() => setSelectedId(order.id)}>
              <span>{order.vendorName}</span>
              <strong>{formatCurrency(order.totalPrice)}</strong>
              <StatusBadge value={order.status} />
            </button>
          ))}
        </aside>

        {selected ? (
          <section className="tracking-panel">
            <div className="tracking-head">
              <div>
                <span>Order #{selected.id.slice(0, 8).toUpperCase()}</span>
                <h2>{selected.vendorName}</h2>
              </div>
              <StatusBadge value={selected.status} />
            </div>
            <OrderStepper status={selected.status} />
            <div className="queue-display">
              <Ticket size={34} />
              <div>
                <span>Queue number</span>
                <strong>{selected.queueTicket?.queueNumber ?? 'Not assigned'}</strong>
              </div>
              <div>
                <span>Estimated wait</span>
                <strong>{selected.queueTicket ? `${selected.queueTicket.estimatedWait} min` : '-'}</strong>
              </div>
            </div>
            <div className="order-items-list">
              {selected.items.map((item) => (
                <div key={item.id}>
                  <span>
                    {item.quantity}x {item.menuName}
                  </span>
                  <strong>{formatCurrency(item.subtotal)}</strong>
                </div>
              ))}
            </div>
            {selected.payment ? (
              <div className="payment-strip">
                <span>{selected.payment.transactionRef}</span>
                <StatusBadge value={selected.payment.status} />
              </div>
            ) : null}

            {selected.status === 'COMPLETED' && !selected.review ? (
              <form className="review-form" onSubmit={submitReview}>
                <h3>
                  <MessageSquareText size={18} />
                  Submit review
                </h3>
                <label>
                  Rating
                  <select value={rating} onChange={(event) => setRating(Number(event.target.value))}>
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option value={value} key={value}>
                        {value} stars
                      </option>
                    ))}
                  </select>
                </label>
                <textarea value={comment} onChange={(event) => setComment(event.target.value)} required minLength={3} placeholder="How was the order experience?" />
                <button className="primary-button small">
                  <Star size={16} />
                  Submit Review
                </button>
              </form>
            ) : null}

            {selected.review ? (
              <div className="review-note">
                <Star size={18} />
                <span>
                  {selected.review.rating}/5 - {selected.review.comment}
                </span>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </>
  );
};
