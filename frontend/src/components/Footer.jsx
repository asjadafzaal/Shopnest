import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ShieldCheck, Truck, RefreshCw, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', marginTop: 'auto' }}>
      {/* Value Proposition Highlights */}
      <div style={{ borderBottom: '1px solid #f1f5f9', padding: '2.5rem 0' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: '#eef2ff', padding: '12px', borderRadius: '12px', color: '#4f46e5' }}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Verified Sellers</h4>
                <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>Every store vetted by platform admins</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '12px', color: '#10b981' }}>
                <Truck size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Direct Fulfillment</h4>
                <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>Independent tracking per seller</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '12px', color: '#d97706' }}>
                <RefreshCw size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Atomic Checkout</h4>
                <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>Guaranteed live stock reservation</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container" style={{ padding: '3rem 1.25rem 2rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2.5rem',
            marginBottom: '2.5rem',
          }}
        >
          {/* Brand Col */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <ShoppingBag size={18} />
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>ShopNest</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6, marginBottom: '1rem' }}>
              A modern multi-vendor marketplace connecting passionate independent sellers directly with everyday customers.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {/* <span className="badge badge-primary">Django 5</span>
              <span className="badge badge-success">PostgreSQL 18</span>
              <span className="badge badge-accent">React + Vite</span> */}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '1rem' }}>
              Marketplace
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem', color: '#64748b' }}>
              <li><Link to="/products" style={{ color: 'inherit' }}>Explore All Products</Link></li>
              <li><Link to="/stores" style={{ color: 'inherit' }}>Browse Verified Stores</Link></li>
              <li><Link to="/products?featured=true" style={{ color: 'inherit' }}>Featured Deals</Link></li>
              <li><Link to="/cart" style={{ color: 'inherit' }}>Shopping Cart</Link></li>
            </ul>
          </div>

          {/* For Sellers */}
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '1rem' }}>
              Selling on ShopNest
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem', color: '#64748b' }}>
              <li><Link to="/register" style={{ color: 'inherit' }}>Open a Storefront</Link></li>
              <li><Link to="/seller" style={{ color: 'inherit' }}>Seller Dashboard</Link></li>
              <li><a href="/admin/" target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>Platform Administration</a></li>
              <li><a href="/api/docs/" target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>Swagger API Docs</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: '1px solid #f1f5f9',
            paddingTop: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8125rem',
            color: '#94a3b8',
            gap: '1rem',
          }}
        >
          <p>© 2026 ShopNest Multi-Vendor Marketplace. Crafted with care.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span>Powered by Django ORM & PostgreSQL</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
