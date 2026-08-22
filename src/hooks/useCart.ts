// ============================================================
// hooks/useCart.ts — Cart Logic with Bonus Discount
// ============================================================
import { useState, useCallback } from "react";
import { CartItem, getCart, setCart, getDiscountedPrice, getSavings } from "../config/data";

export function useCart() {
  const [cart, setCartState] = useState<CartItem[]>(getCart());
  const [isCartOpen, setIsCartOpen] = useState(false); // ✅ إضافة حالة فتح السلة

  const syncCart = useCallback((items: CartItem[]) => {
    setCart(items);
    setCartState(items);
  }, []);

  const addToCart = useCallback(
    (item: Omit<CartItem, "quantity" | "originalPrice">, quantity: number = 1) => {
      const current = getCart();
      const existing = current.find((c) => c.medicineId === item.medicineId);
      
      const discountedPrice = getDiscountedPrice(item.price, item.bonus || '', quantity);
      
      let updated: CartItem[];
      if (existing) {
        const newQuantity = existing.quantity + quantity;
        const newDiscountedPrice = getDiscountedPrice(item.price, item.bonus || '', newQuantity);
        updated = current.map((c) =>
          c.medicineId === item.medicineId
            ? { ...c, quantity: newQuantity, price: newDiscountedPrice }
            : c
        );
      } else {
        updated = [
          ...current,
          {
            ...item,
            quantity,
            price: discountedPrice,
            originalPrice: item.price,
          },
        ];
      }
      syncCart(updated);
    },
    [syncCart]
  );

  const removeFromCart = useCallback(
    (medicineId: string) => {
      const updated = getCart().filter((c) => c.medicineId !== medicineId);
      syncCart(updated);
    },
    [syncCart]
  );

  const updateQuantity = useCallback(
    (medicineId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(medicineId);
        return;
      }
      const updated = getCart().map((c) => {
        if (c.medicineId === medicineId) {
          const discountedPrice = getDiscountedPrice(c.originalPrice || c.price, c.bonus || '', quantity);
          return { ...c, quantity, price: discountedPrice };
        }
        return c;
      });
      syncCart(updated);
    },
    [syncCart, removeFromCart]
  );

  const clearCart = useCallback(() => {
    syncCart([]);
  }, [syncCart]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const savingsTotal = cart.reduce((sum, item) => {
    const original = item.originalPrice || item.price;
    const discounted = item.price;
    return sum + (original - discounted) * item.quantity;
  }, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    savingsTotal,
    cartCount,
    isCartOpen,
    setIsCartOpen,
  };
}
