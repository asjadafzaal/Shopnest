import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { catalogApi, sellersApi } from '../api';
import ProductCard from '../components/ProductCard';
import {
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Store,
  Layers,
  TrendingUp,
  Tag,
  CheckCircle2,
} from 'lucide-react';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [featRes, catRes, storeRes, statsRes] = await Promise.all([
          catalogApi.getProducts({ featured: true }),
          catalogApi.getCategories(true),
          sellersApi.getStores(),
          catalogApi.getAnalytics().catch(() => null),
        ]);

        setFeaturedProducts(featRes.results || []);
        setCategories(catRes || []);
        setStores(storeRes.results || []);
        setAnalytics(statsRes);
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          color: '#ffffff',
          padding: '4.5rem 0 5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(0,0,0,0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '680px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(8px)',
                borderRadius: '9999px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                marginBottom: '1.25rem',
              }}
            >
              <Sparkles size={15} color="#fbbf24" />
              <span>Multi-Vendor Marketplace Powered by Django & PostgreSQL</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: '-1px',
                marginBottom: '1.25rem',
              }}
            >
              Shop directly from passionate, verified independent stores.
            </h1>

            <p style={{ fontSize: '1.125rem', color: '#c7d2fe', lineHeight: 1.6, marginBottom: '2rem' }}>
              Discover smartphones, audio gear, sustainable apparel, and lifestyle essentials with transparent multi-vendor checkout and individual seller tracking.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <Link to="/products" className="btn btn-primary btn-lg" style={{ background: '#ffffff', color: '#312e81' }}>
                <ShoppingBag size={18} /> Explore Catalog
              </Link>
              <Link to="/stores" className="btn btn-outline btn-lg" style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#ffffff' }}>
                <Store size={18} /> Browse Stores
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Bar */}
      {analytics && (
        <section style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '1.5rem 0' }}>
          <div className="container">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1.5rem',
                textAlign: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#4f46e5' }}>
                  {analytics.price_stats?.total_products || 0}+
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>Active Products</div>
              </div>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0ea5e9' }}>
                  {stores.length}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>Approved Stores</div>
              </div>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>
                  ${analytics.price_stats?.avg_price || '0.00'}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>Average Price</div>
              </div>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>
                  100%
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>Atomic Stock Safety</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section style={{ padding: '3.5rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4f46e5', fontWeight: 700, fontSize: '0.875rem' }}>
                <TrendingUp size={16} /> POPULAR CHOICES
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Featured Products</h2>
            </div>
            <Link to="/products?featured=true" className="btn btn-secondary btn-sm">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading products...</div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid-products">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: '#64748b' }}>No featured products currently available.</p>
            </div>
          )}
        </div>
      </section>

      {/* Shop By Category */}
      <section style={{ background: '#ffffff', padding: '3.5rem 0', borderTop: '1px solid #e2e8f0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '580px', margin: '0 auto 2.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
              Browse By Category
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9375rem' }}>
              Find exactly what you need organized by department and curated collections.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.slug}`}
                className="card card-hover"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.25rem',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: '#eef2ff',
                    color: '#4f46e5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Layers size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{cat.name}</h3>
                  <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                    {cat.children?.length > 0 ? `${cat.children.length} subcategories` : 'Explore department'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Verified Independent Stores Banner */}
      <section style={{ padding: '3.5rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0ea5e9', fontWeight: 700, fontSize: '0.875rem' }}>
                <CheckCircle2 size={16} /> INDEPENDENT SELLERS
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Meet Our Stores</h2>
            </div>
            <Link to="/stores" className="btn btn-secondary btn-sm">
              All stores <ArrowRight size={14} />
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {stores.map((store) => (
              <Link
                key={store.id}
                to={`/stores/${store.slug}`}
                className="card card-hover"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                      color: '#4338ca',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Store size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a' }}>{store.name}</h3>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>by {store.seller_name}</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5 }}>
                  {store.description || 'Verified independent marketplace seller.'}
                </p>
                <div style={{ marginTop: 'auto', paddingTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="badge badge-primary">{store.product_count} Products</span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Visit Store <ArrowRight size={13} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
