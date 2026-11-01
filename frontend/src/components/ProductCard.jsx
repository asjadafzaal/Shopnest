import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Store, Check, AlertCircle } from 'lucide-react';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.in_stock || adding) return;

    setAdding(true);
    const success = await addToCart(product.id, 1);
    setAdding(false);
    if (success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    }
  };

  return (
    <div
      className="card card-hover"
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        overflow: 'hidden',
        position: 'relative',
        height: '100%',
      }}
    >
      {/* Discount Badge */}
      {product.discount_percentage > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 2,
            background: '#ef4444',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.75rem',
            padding: '3px 8px',
            borderRadius: '6px',
            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)',
          }}
        >
          -{product.discount_percentage}%
        </div>
      )}

      {/* Featured Badge */}
      {product.is_featured && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 2,
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.6875rem',
            padding: '3px 8px',
            borderRadius: '6px',
            boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)',
            textTransform: 'uppercase',
          }}
        >
          Featured
        </div>
      )}

      {/* Product Image Area */}
      <Link
        to={`/products/${product.slug}`}
        style={{
          display: 'block',
          width: '100%',
          height: '200px',
          background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {product.primary_image ? (
          <img
            src={product.primary_image}
            alt={product.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
              }}
            >
              <Store size={24} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{product.category_name}</span>
          </div>
        )}
      </Link>

      {/* Product Content Details */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Store Name Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
          <Store size={13} color="#64748b" />
          <Link
            to={`/stores/${product.store_slug}`}
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#64748b',
              textDecoration: 'none',
            }}
            onClick={(e) => e.stopPropagation()}
            className="store-link"
          >
            {product.store_name}
          </Link>
        </div>

        {/* Title */}
        <Link
          to={`/products/${product.slug}`}
          style={{
            fontSize: '0.9375rem',
            fontWeight: 700,
            color: '#0f172a',
            lineHeight: 1.4,
            marginBottom: '0.75rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {product.name}
        </Link>

        {/* Price & Stock Line */}
        <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              ${product.price}
            </span>
            {product.compare_at_price && (
              <span style={{ fontSize: '0.8125rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                ${product.compare_at_price}
              </span>
            )}
            <span
              className={`badge ${product.in_stock ? 'badge-success' : 'badge-danger'}`}
              style={{ marginLeft: 'auto', fontSize: '0.6875rem' }}
            >
              {product.in_stock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          {/* Quick Add to Cart Button */}
          <button
            onClick={handleAdd}
            disabled={!product.in_stock || adding}
            className={`btn ${added ? 'btn-secondary' : 'btn-primary'}`}
            style={{
              width: '100%',
              padding: '0.5rem',
              fontSize: '0.8125rem',
              borderRadius: '8px',
            }}
          >
            {added ? (
              <>
                <Check size={16} color="#10b981" /> Added
              </>
            ) : product.in_stock ? (
              <>
                <ShoppingCart size={16} /> Add to Cart
              </>
            ) : (
              <>
                <AlertCircle size={16} /> Sold Out
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
