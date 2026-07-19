import { Check } from 'lucide-react';
import { orderStatusLabels, orderStatusSteps } from '../constants/status';
import type { OrderStatus } from '../types/domain';

export const OrderStepper = ({ status }: { status: OrderStatus }) => {
  const currentIndex = orderStatusSteps.indexOf(status);
  const isTerminal = ['CANCELLED', 'REJECTED'].includes(status);

  return (
    <div className="order-stepper" aria-label="Order status">
      {orderStatusSteps.map((step, index) => {
        const reached = !isTerminal && currentIndex >= index;
        return (
          <div className={`step ${reached ? 'step-reached' : ''}`} key={step}>
            <span>{reached ? <Check size={14} /> : index + 1}</span>
            <small>{orderStatusLabels[step]}</small>
          </div>
        );
      })}
      {isTerminal ? <strong className="terminal-status">{orderStatusLabels[status]}</strong> : null}
    </div>
  );
};
