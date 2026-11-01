import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Lock, User, Mail, Phone, Store, AlertCircle } from 'lucide-react';

export default function Register() {
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    role: 'customer',
    password: '',
    password_confirm: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      await register(formData);
      // Auto-login upon registration
      await login(formData.username, formData.password);
      if (formData.role === 'seller') {
        navigate('/seller');
      } else {
        navigate('/products');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '3.5rem 1.25rem 5rem' }}>
      <div className="card" style={{ maxWidth: '500px', margin: '0 auto', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <ShoppingBag size={24} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.375rem' }}>
            Create Your Account
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Join ShopNest as a customer or open your independent storefront
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Role Selector */}
          <div className="form-group">
            <label className="form-label">I want to register as a:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'customer' })}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: formData.role === 'customer' ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                  background: formData.role === 'customer' ? '#eef2ff' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <User size={20} color={formData.role === 'customer' ? '#4f46e5' : '#64748b'} style={{ margin: '0 auto 4px' }} />
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: formData.role === 'customer' ? '#4f46e5' : '#0f172a' }}>
                  Customer
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>Shop & place orders</div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'seller' })}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: formData.role === 'seller' ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                  background: formData.role === 'seller' ? '#eef2ff' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <Store size={20} color={formData.role === 'seller' ? '#4f46e5' : '#64748b'} style={{ margin: '0 auto 4px' }} />
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: formData.role === 'seller' ? '#4f46e5' : '#0f172a' }}>
                  Merchant Seller
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>Open a store & sell</div>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Jane"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Doe"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Username *</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="unique_username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              required
              className="form-control"
              placeholder="jane@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-control"
              placeholder="+1 (555) 123-4567"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                type="password"
                required
                className="form-control"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input
                type="password"
                required
                className="form-control"
                placeholder="••••••••"
                value={formData.password_confirm}
                onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', marginBottom: '1.5rem' }}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#4f46e5', fontWeight: 700 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
