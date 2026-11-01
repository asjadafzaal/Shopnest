import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { sellersApi, catalogApi } from '../api';
import ProductCard from '../components/ProductCard';
import { Store, Mail, Phone, MapPin, Package, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function StorePage() {
  const { slug } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStoreAndProducts() {
      setLoading(true);
      try {
        const storeData = await sellersApi.getStoreDetail(slug);
        setStore(storeData);

        const prodRes = await catalogApi.getProducts({ store: slug });
        setProducts(prodRes.results || []);
      } catch (err) {
        console.error('Failed to load store data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStoreAndProducts();
  }, [slug]);

  if (loading) {
    return <div className="container" style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>Loading store...</div>;
  }

  if (!store) {
    return (
      <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>
        <h2>Store Not Found</h2>
        <Link to="/stores" className="btn btn-primary" style={{ marginTop: '1rem' }}>Browse All Stores</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Store Hero Banner */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '2.5rem 0' }}>
        <div className="container">
          <Link to="/stores" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: '#64748b', marginBottom: '1rem' }}>
            <ArrowLeft size={14} /> Back to all stores
          </Link>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '1.5rem', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Store size={32} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{store.name}</h1>
                  <span className="badge badge-success" style={{ gap: '3px' }}>
                    <ShieldCheck size={12} /> Verified Merchant
                  </span>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                  Operated by <strong>{store.seller_profile?.business_name || store.seller_name}</strong>
                </p>
              </div>
            </div>

            {/* Store Contact Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8125rem', color: '#64748b' }}>
              {store.seller_profile?.business_email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: '#f8fafc', padding: '6px 10px', borderRadius: '8px' }}>
                  <Mail size={14} color="#4f46e5" /> {store.seller_profile.business_email}
                </div>
              )}
              {store.seller_profile?.business_phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: '#f8fafc', padding: '6px 10px', borderRadius: '8px' }}>
                  <Phone size={14} color="#10b981" /> {store.seller_profile.business_phone}
                </div>
              )}
            </div>
          </div>

          {store.description && (
            <p style={{ marginTop: '1.25rem', color: '#475569', fontSize: '0.9375rem', maxWidth: '780px', lineHeight: 1.6 }}>
              {store.description}
            </p>
          )}
        </div>
      </div>

      {/* Store Products */}
      <div className="container" style={{ padding: '2.5rem 1.25rem 4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
            Products from {store.name} ({products.length})
          </h2>
        </div>

        {products.length > 0 ? (
          <div className="grid-products">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <Package size={32} style={{ color: '#94a3b8', margin: '0 auto 8px' }} />
            <p style={{ color: '#64748b' }}>This store does not currently have any active products listed.</p>
          </div>
        )}
      </div>
    </div>
  );
}
