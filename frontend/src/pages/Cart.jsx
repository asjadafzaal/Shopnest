import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  Store,
  ShieldCheck,
  AlertCircle,
  Truck,
} from 'lucide-react';

export default function Cart() {
  const { cart, loading, updateQuantity, removeFromCart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: '4rem 1.25rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '480px', margin: '0 auto', padding: '3rem' }}>
          <ShoppingBag size={48} style={{ color: '#4f46e5', margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>Your Cart is Waiting</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            Please log in or create an account to view and manage your shopping cart.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/login" className="btn btn-primary">Log In</Link>
            <Link to="/register" className="btn btn-secondary">Register</Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.is_empty) {
    return (
      <div className="container" style={{ padding: '4rem 1.25rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto', padding: '3rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#eef2ff',
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <ShoppingBag size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Your Cart is Empty</h2>
          <p style={{ color: '#64748b', marginBottom: '1.75rem', lineHeight: 1.6 }}>
            Looks like you haven't added anything to your cart yet. Explore thousands of items from verified independent stores!
          </p>
          <Link to="/products" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  // Group cart items by store name for multi-vendor transparency
  const itemsByStore = cart.items.reduce((acc, item) => {
    const storeKey = item.store_name || 'Independent Store';
    if (!acc[storeKey]) {
      acc[storeKey] = {
        storeSlug: item.store_slug,
        items: [],
        subtotal: 0,
      };
    }
    acc[storeKey].items.push(item);
    acc[storeKey].subtotal += parseFloat(item.line_total);
    return acc;
  }, {});

  const distinctStoresCount = Object.keys(itemsByStore).length;

  return (
    <div className="container" style={{ padding: '2.5rem 1.25rem 4rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0f172a' }}>Shopping Cart</h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            {cart.total_items} items across {distinctStoresCount} {distinctStoresCount === 1 ? 'store' : 'independent stores'}
          </p>
        </div>
        <button
          onClick={clearCart}
          className="btn btn-secondary btn-sm"
          style={{ color: '#ef4444' }}
        >
          <Trash2 size={14} /> Clear Cart
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
        {/* Left Column: Multi-Vendor Item Groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {Object.entries(itemsByStore).map(([storeName, group]) => (
            <div key={storeName} className="card" style={{ padding: '0', overflow: 'hidden' }}>
              {/* Store Header Banner */}
              <div
                style={{
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  padding: '10px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Store size={16} color="#4f46e5" />
                  <Link
                    to={`/stores/${group.storeSlug}`}
                    style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a' }}
                  >
                    {storeName}
                  </Link>
                </div>
                <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>
                  Subtotal: ${group.subtotal.toFixed(2)}
                </span>
              </div>

              {/* Items List */}
              <div style={{ padding: '0.75rem 1.25rem' }}>
                {group.items.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem 0',
                      borderBottom: idx === group.items.length - 1 ? 'none' : '1px solid #f1f5f9',
                    }}
                  >
                    {/* Item Image or Fallback */}
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '8px',
                        background: '#f1f5f9',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {item.image ? (
                        <img src={item.image} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Store size={20} color="#94a3b8" />
                      )}
                    </div>

                    {/* Title & Unit Price */}
                    <div style={{ flex: 1, minWidth: '180px' }}>
                      <Link
                        to={`/products/${item.product_slug}`}
                        style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '4px' }}
                      >
                        {item.product_name}
                      </Link>
                      <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                        ${item.unit_price} each
                      </span>
                    </div>

                    {/* Quantity Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        disabled={item.quantity <= 1}
                        style={{ width: '32px', height: '32px', background: '#f8fafc', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                      >
                        -
                      </button>
                      <span style={{ width: '36px', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600 }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock_available}
                        style={{ width: '32px', height: '32px', background: '#f8fafc', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                        title={item.quantity >= item.stock_available ? 'Maximum available stock reached' : ''}
                      >
                        +
                      </button>
                    </div>

                    {/* Line Total */}
                    <div style={{ width: '90px', textAlign: 'right' }}>
                      <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#0f172a' }}>
                        ${item.line_total}
                      </span>
                    </div>

                    {/* Remove Action */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '6px', color: '#94a3b8' }}
                      title="Remove item"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Order Summary Card */}
        <div style={{ position: 'sticky', top: '90px' }}>
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1.25rem', color: '#0f172a' }}>
              Order Summary
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9375rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Subtotal ({cart.total_items} items)</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>${cart.total_price}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Estimated Shipping</span>
                <span className="badge badge-success">Free Marketplace Delivery</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Estimated Tax</span>
                <span style={{ color: '#0f172a' }}>$0.00</span>
              </div>
            </div>

            <div
              style={{
                borderTop: '1px solid #e2e8f0',
                paddingTop: '1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a' }}>Total</span>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#4f46e5' }}>
                ${cart.total_price}
              </span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              Proceed to Checkout <ArrowRight size={18} />
            </button>

            {/* Multi-Vendor Disclaimer */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '0.75rem',
                color: '#64748b',
                display: 'flex',
                gap: '8px',
                lineHeight: 1.5,
              }}
            >
              <Truck size={18} color="#0ea5e9" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                Your order contains items from <strong>{distinctStoresCount} independent {distinctStoresCount === 1 ? 'store' : 'stores'}</strong>.
                Each vendor will prepare and fulfill their shipment with individual tracking numbers.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
