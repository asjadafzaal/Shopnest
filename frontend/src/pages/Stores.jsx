import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sellersApi } from '../api';
import { Store, ArrowRight, ShieldCheck, Search } from 'lucide-react';

export default function Stores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchStores() {
      setLoading(true);
      try {
        const res = await sellersApi.getStores();
        setStores(res.results || []);
      } catch (err) {
        console.error('Failed to load stores:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStores();
  }, []);

  const filteredStores = stores.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="container" style={{ padding: '2.5rem 1.25rem' }}>
      <div style={{ maxWidth: '640px', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4f46e5', fontWeight: 700, fontSize: '0.875rem' }}>
          <ShieldCheck size={16} /> VERIFIED SELLERS
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
          Explore Independent Storefronts
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.6 }}>
          Shop directly from approved marketplace vendors. Each store handles their own product listings and fulfillment independently.
        </p>

        {/* Store Search */}
        <div style={{ position: 'relative', marginTop: '1.25rem' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search stores by brand name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '38px', height: '42px', borderRadius: '10px' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading verified stores...</div>
      ) : filteredStores.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredStores.map((store) => (
            <Link
              key={store.id}
              to={`/stores/${store.slug}`}
              className="card card-hover"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                    color: '#4338ca',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Store size={26} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>{store.name}</h3>
                  <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>by {store.seller_name}</span>
                </div>
              </div>

              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6, flex: 1 }}>
                {store.description || 'Independent marketplace merchant specializing in high quality goods.'}
              </p>

              <div
                style={{
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span className="badge badge-primary">{store.product_count} Products Listed</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Browse Store <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#64748b' }}>No stores match "{search}".</p>
        </div>
      )}
    </div>
  );
}
