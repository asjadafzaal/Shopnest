import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi } from '../api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({
    items: [],
    total_items: 0,
    total_price: '0.00',
    is_empty: true,
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart({ items: [], total_items: 0, total_price: '0.00', is_empty: true });
      return;
    }
    try {
      setLoading(true);
      const data = await cartApi.getCart();
      setCart(data);
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      showToast('Please login to add items to your cart.', 'info');
      return false;
    }
    try {
      const res = await cartApi.addItem(productId, quantity);
      setCart(res.cart);
      showToast(res.message || 'Added to cart!', 'success');
      return true;
    } catch (err) {
      showToast(err.message || 'Failed to add item', 'danger');
      return false;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      const res = await cartApi.updateItem(itemId, quantity);
      setCart(res.cart);
      showToast('Cart updated', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update quantity', 'danger');
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const res = await cartApi.removeItem(itemId);
      setCart(res.cart);
      showToast(res.message || 'Item removed', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to remove item', 'danger');
    }
  };

  const clearCart = async () => {
    try {
      const res = await cartApi.clearCart();
      setCart(res.cart);
      showToast('Cart cleared', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to clear cart', 'danger');
    }
  };

  const value = {
    cart,
    loading,
    toast,
    showToast,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
