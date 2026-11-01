import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersApi } from '../api';
import {
  CreditCard,
  ShieldCheck,
  Truck,
  Store,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Lock,
} from 'lucide-react';

export default function Checkout() {
  const { cart, refreshCart, showToast } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    shipping_full_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username : '',
    shipping_phone: user?.phone_number || '',
    shipping_address: user?.address || '',
    shipping_city: '',
    shipping_state: '',
    shipping_postal_code: '',
    shipping_country: 'United States',
    payment_method: 'card_simulation',
  });

  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (cart.is_empty) {
    return (
      <div className="container" style={{ padding: '4rem 1.25rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '480px', margin: '0 auto', padding: '3rem' }}>
          <h2>Your Cart is Empty</h2>
          <p style={{ color: '#64748b', margin: '1rem 0 1.5rem' }}>Add some products before proceeding to checkout.</p>
          <Link to="/products" className="btn btn-primary">Browse Catalog</Link>
        </div>
      </div>
    );
  }

  // Group items by store for sub-order review
  const itemsByStore = cart.items.reduce((acc, item) => {
    const key = item.store_name || 'Store';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await ordersApi.checkout(formData);
      await refreshCart();
      showToast('Order placed successfully!', 'success');
      navigate(`/orders/${res.order.id}`);
    } catch (err) {
      setError(err.message || 'Checkout failed. Please review your address and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.25rem 4rem' }}>
      <div style={{ maxWidth: '640px', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0f172a' }}>Checkout</h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Complete your shipping address. Products are reserved atomically in the database.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
          {/* Left Column: Shipping & Payment Form */}
          <div>
            {/* 1. Shipping Address */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={18} color="#4f46e5" /> Shipping Address
              </h3>

              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. John Doe"
                  value={formData.shipping_full_name}
                  onChange={(e) => setFormData({ ...formData, shipping_full_name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    className="form-control"
                    placeholder="+1 (555) 000-0000"
                    value={formData.shipping_phone}
                    onChange={(e) => setFormData({ ...formData, shipping_phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.shipping_country}
                    onChange={(e) => setFormData({ ...formData, shipping_country: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Street Address *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="Street address, apartment, suite, unit"
                  value={formData.shipping_address}
                  onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="City"
                    value={formData.shipping_city}
                    onChange={(e) => setFormData({ ...formData, shipping_city: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">State / Region</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="CA"
                    value={formData.shipping_state}
                    onChange={(e) => setFormData({ ...formData, shipping_state: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Postal Code *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="94105"
                    value={formData.shipping_postal_code}
                    onChange={(e) => setFormData({ ...formData, shipping_postal_code: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* 2. Payment Method Simulation */}
            <div className="card">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={18} color="#4f46e5" /> Payment Method
              </h3>

              <div
                style={{
                  border: '2px solid #4f46e5',
                  background: '#eef2ff',
                  borderRadius: '10px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ background: '#4f46e5', color: '#fff', padding: '8px', borderRadius: '8px' }}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a' }}>Simulated Instant Card Payment</div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>Safe mock card transaction (Auto-approved)</div>
                </div>
                <span className="badge badge-success" style={{ marginLeft: 'auto' }}>Active</span>
              </div>

              <div className="form-group">
                <label className="form-label">Mock Card Number</label>
                <input
                  type="text"
                  readOnly
                  className="form-control"
                  value={cardNumber}
                  style={{ background: '#f8fafc', color: '#64748b', cursor: 'default' }}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Multi-Vendor Order Review & Confirmation */}
          <div>
            <div className="card" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '1.25rem', color: '#0f172a' }}>
                Multi-Vendor Review
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
                {Object.entries(itemsByStore).map(([storeName, items]) => (
                  <div
                    key={storeName}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '10px 14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.8125rem', color: '#4f46e5', marginBottom: '6px' }}>
                      <Store size={14} /> Sub-Order from {storeName}
                    </div>
                    <ul style={{ listStyle: 'none', fontSize: '0.8125rem', color: '#334155' }}>
                      {items.map((it) => (
                        <li key={it.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                          <span>{it.quantity}x {it.product_name}</span>
                          <span style={{ fontWeight: 600 }}>${it.line_total}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Total Calculation */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <span>Items total</span>
                  <span>${cart.total_price}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <span>Shipping</span>
                  <span className="badge badge-success">Free</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '0.5rem', borderTop: '1px dashed #e2e8f0' }}>
                  <span style={{ fontSize: '1.125rem', fontWeight: 800 }}>Total Due</span>
                  <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#4f46e5' }}>${cart.total_price}</span>
                </div>
              </div>

              {/* Place Order CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginBottom: '1rem' }}
                id="place-order-btn"
              >
                {loading ? 'Processing Atomic Order...' : `Pay $${cart.total_price} & Place Order`}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                <Lock size={13} />
                <span>Encrypted 256-Bit Atomic Transaction</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
