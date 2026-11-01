import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { catalogApi } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingCart,
  Store,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
  Layers,
  ChevronRight,
  Package,
  Star,
  MessageSquare,
} from 'lucide-react';

export default function ProductDetail() {
  const { slug } = useParams();
  const { addToCart, showToast } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState(null);

  // Review Form State
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      setError(null);
      try {
        const data = await catalogApi.getProductDetail(slug);
        setProduct(data);
        setReviews(data.reviews || []);
        if (data.images && data.images.length > 0) {
          const primary = data.images.find((img) => img.is_primary) || data.images[0];
          setSelectedImage(primary.image);
        }
      } catch (err) {
        setError(err.message || 'Product not found');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please log in to submit a review.', 'info');
      return;
    }
    if (!newComment.trim()) {
      setReviewError('Please provide a comment for your review.');
      return;
    }
    setSubmittingReview(true);
    setReviewError(null);
    try {
      const created = await catalogApi.createProductReview(slug, {
        rating: Number(newRating),
        title: newTitle.trim(),
        comment: newComment.trim(),
      });
      setReviews((prev) => [created, ...prev]);
      setReviewSuccess(true);
      setNewTitle('');
      setNewComment('');
      showToast('Thank you! Your review has been posted.', 'success');
    } catch (err) {
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product || !product.in_stock || adding) return;
    setAdding(true);
    const success = await addToCart(product.id, quantity);
    setAdding(false);
    if (success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>Loading product details...</div>;
  }

  if (error || !product) {
    return (
      <div className="container" style={{ padding: '4rem 1.25rem', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto', padding: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Product Not Found</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>The product you are looking for does not exist or is currently inactive.</p>
          <Link to="/products" className="btn btn-primary">Browse All Products</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1.25rem 4rem' }}>
      {/* Breadcrumb Navigation */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#64748b', marginBottom: '1.5rem' }}>
        <Link to="/" style={{ color: 'inherit' }}>Home</Link>
        <ChevronRight size={14} />
        <Link to="/products" style={{ color: 'inherit' }}>Products</Link>
        <ChevronRight size={14} />
        <Link to={`/products?category=${product.category}`} style={{ color: 'inherit' }}>{product.category_name}</Link>
        <ChevronRight size={14} />
        <span style={{ color: '#0f172a', fontWeight: 600 }}>{product.name}</span>
      </nav>

      {/* Main Product Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '3rem', alignItems: 'start' }}>
        {/* Left: Images Column */}
        <div>
          <div
            style={{
              width: '100%',
              height: '420px',
              borderRadius: '16px',
              overflow: 'hidden',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #e2e8f0',
              marginBottom: '1rem',
            }}
          >
            {selectedImage ? (
              <img src={selectedImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                <Package size={48} style={{ margin: '0 auto 8px' }} />
                <span>No product image available</span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto' }}>
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.image)}
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '8px',
                    border: selectedImage === img.image ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                    padding: '2px',
                    background: '#fff',
                    cursor: 'pointer',
                    overflow: 'hidden',
                  }}
                >
                  <img src={img.image} alt={img.alt_text || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details & Purchase Options */}
        <div>
          {/* Seller Store Banner Card */}
          <Link
            to={`/stores/${product.store_slug}`}
            className="card card-hover"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem 1.25rem',
              marginBottom: '1.25rem',
              borderRadius: '12px',
              border: '1px solid #e0e7ff',
              background: '#f8fafc',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#e0e7ff',
                color: '#4338ca',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Store size={18} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Sold and fulfilled directly by</span>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>{product.store_name}</h4>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: '#4f46e5', fontWeight: 600 }}>
              Visit Store →
            </span>
          </Link>

          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.25, marginBottom: '0.75rem' }}>
            {product.name}
          </h1>

          {/* Pricing Box */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.875rem', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a' }}>
              ${product.price}
            </span>
            {product.compare_at_price && (
              <>
                <span style={{ fontSize: '1.125rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                  ${product.compare_at_price}
                </span>
                <span className="badge badge-danger">
                  Save {product.discount_percentage}%
                </span>
              </>
            )}
          </div>

          {/* Stock Availability */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <span className={`badge ${product.in_stock ? 'badge-success' : 'badge-danger'}`} style={{ padding: '6px 12px', fontSize: '0.8125rem' }}>
              {product.in_stock ? `In Stock (${product.stock} units available)` : 'Currently Out of Stock'}
            </span>
            {product.sku && (
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>SKU: {product.sku}</span>
            )}
          </div>

          {/* Description */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', marginBottom: '1.75rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.5rem' }}>Description</h3>
            <p style={{ color: '#475569', fontSize: '0.9375rem', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {product.description}
            </p>
          </div>

          {/* JSONField Dynamic Attributes Breakdown */}
          {product.attributes && Object.keys(product.attributes).length > 0 && (
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', marginBottom: '1.75rem' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.75rem' }}>Specifications</h3>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}
              >
                {Object.entries(product.attributes).map(([key, val], idx) => (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      padding: '8px 14px',
                      fontSize: '0.875rem',
                      background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                      borderBottom: idx === Object.keys(product.attributes).length - 1 ? 'none' : '1px solid #f1f5f9',
                    }}
                  >
                    <span style={{ width: '140px', fontWeight: 600, color: '#64748b', textTransform: 'capitalize' }}>
                      {key.replace('_', ' ')}
                    </span>
                    <span style={{ color: '#0f172a', fontWeight: 500 }}>
                      {Array.isArray(val) ? val.join(', ') : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quantity and Add to Cart Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1 || !product.in_stock}
                style={{ width: '40px', height: '44px', background: '#f8fafc', border: 'none', cursor: 'pointer', fontWeight: 700 }}
              >
                -
              </button>
              <span style={{ width: '44px', textAlign: 'center', fontWeight: 700, fontSize: '0.9375rem' }}>
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                disabled={quantity >= product.stock || !product.in_stock}
                style={{ width: '40px', height: '44px', background: '#f8fafc', border: 'none', cursor: 'pointer', fontWeight: 700 }}
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!product.in_stock || adding}
              className={`btn btn-lg ${added ? 'btn-secondary' : 'btn-primary'}`}
              style={{ flex: 1 }}
            >
              {added ? (
                <>
                  <Check size={20} color="#10b981" /> Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingCart size={20} /> Add to Cart (${(parseFloat(product.price) * quantity).toFixed(2)})
                </>
              )}
            </button>
          </div>

          {/* Marketplace Buyer Guarantees */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid #e2e8f0',
              fontSize: '0.8125rem',
              color: '#64748b',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="#4f46e5" />
              <span>Verified Merchant Guarantee</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Truck size={18} color="#0ea5e9" />
              <span>Independent Direct Fulfillment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews & Ratings Section */}
      <div style={{ marginTop: '3.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0f172a' }}>
              Customer Reviews ({reviews.length})
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <div style={{ display: 'flex', color: '#f59e0b' }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={16}
                    fill={s <= Math.round(product.average_rating || 0) ? '#f59e0b' : 'none'}
                    color="#f59e0b"
                  />
                ))}
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a' }}>
                {product.average_rating ? `${product.average_rating} out of 5` : 'No reviews yet'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '2rem' }}>
          {/* Reviews List */}
          <div>
            {reviews.length === 0 ? (
              <div className="card" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                <MessageSquare size={36} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
                <p style={{ fontWeight: 600 }}>Be the first to review this product!</p>
                <p style={{ fontSize: '0.875rem' }}>Share your verified feedback with the ShopNest community.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reviews.map((rev) => (
                  <div key={rev.id} className="card" style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{rev.username}</span>
                        {rev.is_verified_purchase && (
                          <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {new Date(rev.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', color: '#f59e0b', marginBottom: '0.5rem' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          fill={s <= rev.rating ? '#f59e0b' : 'none'}
                          color="#f59e0b"
                        />
                      ))}
                    </div>

                    {rev.title && (
                      <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.375rem', color: '#1e293b' }}>
                        {rev.title}
                      </h4>
                    )}
                    <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6 }}>{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Review Card */}
          <div>
            <div className="card" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>
                Leave a Review
              </h3>

              {!isAuthenticated ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
                    Sign in to your customer account to submit a rating and review for this product.
                  </p>
                  <Link to="/login" className="btn btn-outline btn-sm" style={{ width: '100%' }}>
                    Log In to Review
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview}>
                  {reviewError && (
                    <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '0.8125rem', marginBottom: '1rem' }}>
                      {reviewError}
                    </div>
                  )}

                  {reviewSuccess && (
                    <div style={{ padding: '8px 12px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', color: '#047857', fontSize: '0.8125rem', marginBottom: '1rem' }}>
                      Your review has been successfully submitted!
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Rating</label>
                    <div style={{ display: 'flex', gap: '0.5rem', cursor: 'pointer' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                        >
                          <Star
                            size={22}
                            fill={star <= newRating ? '#f59e0b' : 'none'}
                            color="#f59e0b"
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Headline (optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Excellent sound quality!"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Review Details</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      placeholder="Write your thoughts on build quality, battery life, design..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submittingReview}
                    style={{ width: '100%' }}
                  >
                    {submittingReview ? 'Submitting...' : 'Post Review'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
