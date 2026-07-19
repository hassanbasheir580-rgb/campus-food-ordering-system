import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import type { CartItem, MenuItem } from '../types/domain';
import { storage } from '../services/storage';

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (menuItem: MenuItem, quantity?: number) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const loadCart = (): CartItem[] => {
  const raw = storage.getCart();
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CartItem[];
  } catch {
    storage.clearCart();
    return [];
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    storage.setCart(JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0),
      addItem(menuItem, quantity = 1) {
        if (!menuItem.isAvailable || menuItem.stock <= 0) {
          toast.error('This item is unavailable');
          return;
        }
        setItems((current) => {
          const vendorId = current[0]?.menuItem.vendorId;
          if (vendorId && vendorId !== menuItem.vendorId) {
            toast.error('Please checkout current vendor items before ordering from another outlet');
            return current;
          }
          const existing = current.find((item) => item.menuItem.id === menuItem.id);
          if (!existing) {
            toast.success(`${menuItem.name} added to cart`);
            return [...current, { menuItem, quantity }];
          }
          toast.success(`${menuItem.name} quantity updated`);
          return current.map((item) =>
            item.menuItem.id === menuItem.id
              ? { ...item, quantity: Math.min(menuItem.stock, item.quantity + quantity) }
              : item
          );
        });
      },
      updateQuantity(menuItemId, quantity) {
        setItems((current) =>
          quantity <= 0
            ? current.filter((item) => item.menuItem.id !== menuItemId)
            : current.map((item) => (item.menuItem.id === menuItemId ? { ...item, quantity } : item))
        );
      },
      removeItem(menuItemId) {
        setItems((current) => current.filter((item) => item.menuItem.id !== menuItemId));
      },
      clearCart() {
        setItems([]);
        storage.clearCart();
      }
    }),
    [items]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
