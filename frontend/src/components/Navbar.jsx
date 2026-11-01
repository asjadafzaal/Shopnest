import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  ShoppingBag,
  ShoppingCart,
  Search,
  User,
  LogOut,
  Store,
  Layers,
  Package,
  ExternalLink,
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isSeller, logout } = useAuth();
  const { cart } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #e2e8f0',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: '70px', gap: '1.5rem' }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)',
            }}
          >
            <ShoppingBag size={20} />
          </div>
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
              Shop<span style={{ color: '#4f46e5' }}>Nest</span>
            </span>
          </div>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '460px', position: 'relative' }}>
          <Search
            size={18}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
          />
          <input
            type="text"
            className="form-control"
            placeholder="Search products across verified sellers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              paddingLeft: '38px',
              height: '42px',
              borderRadius: '9999px',
              background: '#f8fafc',
            }}
          />
        </form>

        {/* Center / Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.875rem', fontWeight: 600 }}>
          <Link to="/products" style={{ color: '#334155', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Layers size={16} /> Explore
          </Link>
          <Link to="/stores" style={{ color: '#334155', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Store size={16} /> Stores
          </Link>
        </nav>

        {/* Right Section / Auth & Cart */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Cart Icon Button */}
          <Link
            to="/cart"
            className="btn btn-secondary btn-sm"
            style={{ position: 'relative', padding: '0.5rem 0.875rem' }}
            id="nav-cart-btn"
          >
            <ShoppingCart size={18} />
            <span style={{ fontWeight: 600 }}>Cart</span>
            {cart.total_items > 0 && (
              <span
                style={{
                  background: '#4f46e5',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  borderRadius: '9999px',
                  padding: '2px 7px',
                  marginLeft: '4px',
                }}
              >
                {cart.total_items}
              </span>
            )}
          </Link>

          {/* User Status / Role Navigation */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {isSeller ? (
                <Link to="/seller" className="btn btn-outline btn-sm">
                  <Store size={15} /> Seller Portal
                </Link>
              ) : (
                <Link to="/orders" className="btn btn-secondary btn-sm">
                  <Package size={15} /> My Orders
                </Link>
              )}

              {user.is_staff && (
                <a
                  href="/admin/"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  title="Open Django Admin"
                >
                  Admin <ExternalLink size={13} />
                </a>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '4px 10px',
                  background: '#f1f5f9',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                }}
              >
                <User size={15} color="#4f46e5" />
                <span style={{ fontWeight: 600 }}>{user.username}</span>
                <span className="badge badge-primary" style={{ fontSize: '0.6875rem' }}>
                  {user.role}
                </span>
              </div>

              <button
                onClick={logout}
                className="btn btn-secondary btn-sm"
                title="Log Out"
                style={{ padding: '0.5rem' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
