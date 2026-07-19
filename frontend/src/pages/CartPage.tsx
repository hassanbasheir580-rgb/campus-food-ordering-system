import { CalendarClock, CreditCard, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { formatCurrency } from '../config/appConfig';
import { paymentMethodLabels } from '../constants/status';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import type { PaymentMethod, TimeSlot } from '../types/domain';

export const CartPage = () => {
  const { items, totalPrice, updateQuantity, removeItem, clearCart } = useCart();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TNG');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const vendorId = items[0]?.menuItem.vendorId;

  useEffect(() => {
    if (!vendorId) return;
    api.timeSlots(vendorId).then(({ timeSlots }) => setSlots(timeSlots));
  }, [vendorId]);

  const selectedTime = useMemo(() => slots.find((slot) => slot.id === selectedSlot), [selectedSlot, slots]);

  const checkout = async () => {
    setSubmitting(true);
    try {
      const result = await api.createOrder({
        items: items.map((item) => ({ menuItemId: item.menuItem.id, quantity: item.quantity, customizations: item.customizations })),
        paymentMethod,
        timeSlotId: selectedSlot || undefined,
        scheduledPickupTime: selectedTime?.startTime,
        fulfillmentType: 'PICKUP'
      });
      if (result.paymentSucceeded) {
        toast.success(`Order confirmed. Queue ${result.order.queueTicket?.queueNumber ?? ''}`);
        clearCart();
        navigate('/student/track');
      } else {
        toast.error('Mock payment failed. Please retry with another method.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!items.length) {
    return (
      <>
        <PageHeader eyebrow="Cart" title="Checkout and schedule" />
        <EmptyState icon={ShoppingCart} title="Your cart is empty" message="Add available campus menu items before checkout." />
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Cart" title="Checkout and schedule" />
      <div className="checkout-grid">
        <section className="cart-list">
          {items.map((item) => (
            <article className="cart-row" key={item.menuItem.id}>
              <img src={item.menuItem.imageUrl} alt="" />
              <div>
                <h3>{item.menuItem.name}</h3>
                <p>{item.menuItem.vendorName}</p>
                <strong>{formatCurrency(item.menuItem.price)}</strong>
              </div>
              <div className="qty-control" aria-label={`Quantity for ${item.menuItem.name}`}>
                <button onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)} aria-label="Decrease quantity">
                  <Minus size={15} />
                </button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.menuItem.id, Math.min(item.menuItem.stock, item.quantity + 1))} aria-label="Increase quantity">
                  <Plus size={15} />
                </button>
              </div>
              <button className="icon-button danger" onClick={() => removeItem(item.menuItem.id)} aria-label="Remove item">
                <Trash2 size={17} />
              </button>
            </article>
          ))}
        </section>

        <aside className="checkout-panel">
          <h2>Payment</h2>
          <label>
            <CalendarClock size={17} />
            Schedule pickup
            <select value={selectedSlot} onChange={(event) => setSelectedSlot(event.target.value)}>
              <option value="">As soon as possible</option>
              {slots.map((slot) => (
                <option value={slot.id} key={slot.id} disabled={slot.bookedCount >= slot.capacity}>
                  {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                  {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({slot.capacity - slot.bookedCount} left)
                </option>
              ))}
            </select>
          </label>
          <label>
            <CreditCard size={17} />
            Payment method
            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}>
              {Object.entries(paymentMethodLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="summary-lines">
            <span>
              Subtotal <strong>{formatCurrency(totalPrice)}</strong>
            </span>
            <span className="grand-total">
              Total <strong>{formatCurrency(totalPrice)}</strong>
            </span>
          </div>
          <button className="primary-button full" onClick={checkout} disabled={submitting}>
            {submitting ? 'Processing mock payment...' : 'Place order'}
          </button>
        </aside>
      </div>
    </>
  );
};
