import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sellersApi, catalogApi, ordersApi } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Store, DollarSign, Package, TrendingUp, Truck, Plus, Trash2,
  CheckCircle, Clock, AlertTriangle, Send, ShieldCheck, Loader,
  ChevronRight, RefreshCw, XCircle,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Step 1 – No seller profile yet (should never happen for new flow, but fallback)
// ---------------------------------------------------------------------------
function StepNoProfile({ onRefresh }) {
  return (
    <div className="card" style={{ maxWidth: 520, margin: '6rem auto', textAlign: 'center', padding: '3rem 2.5rem' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
        <Store size={30} color="#4f46e5" />
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>No Seller Profile Found</h2>
      <p style={{ color: '#64748b', fontSize: '0.9375rem', marginBottom: '2rem' }}>
        Your seller profile wasn't created automatically. Click below to set it up and begin the approval process.
      </p>
      <button className="btn btn-primary" onClick={onRefresh}>
        <RefreshCw size={16} /> Check Again / Setup Profile
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 – Profile created, waiting for admin approval
// ---------------------------------------------------------------------------
function StepPendingApproval({ profile, onRefresh }) {
  return (
    <div className="card" style={{ maxWidth: 560, margin: '6rem auto', textAlign: 'center', padding: '3rem 2.5rem' }}>
      {/* Progress Steps */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 700, fontSize: '0.8125rem' }}>
          <CheckCircle size={18} /> Profile Submitted
        </div>
        <div style={{ width: 40, height: 2, background: '#f59e0b' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontWeight: 700, fontSize: '0.8125rem' }}>
          <Clock size={18} /> Admin Review
        </div>
        <div style={{ width: 40, height: 2, background: '#e2e8f0' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontWeight: 700, fontSize: '0.8125rem' }}>
          <Store size={18} /> Open Store
        </div>
      </div>

      <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fffbeb', border: '3px solid #f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
        <Clock size={32} color="#f59e0b" />
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
        Pending Admin Approval
      </h2>
      <p style={{ color: '#64748b', fontSize: '0.9375rem', marginBottom: '0.75rem' }}>
        Your seller profile for <strong>"{profile?.business_name}"</strong> has been submitted and is awaiting review by a platform administrator.
      </p>
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '2rem' }}>
        Once approved, you'll be able to create your store and start listing products.
      </p>

      {/* Info box */}
      <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '1rem 1.25rem', textAlign: 'left', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#0369a1' }}>
        <strong>What happens next?</strong>
        <ul style={{ margin: '0.5rem 0 0 1rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <li>The platform admin will review your business details.</li>
          <li>You'll be approved or notified with a reason if rejected.</li>
          <li>After approval, you can open your store and list products.</li>
        </ul>
      </div>

      <button className="btn btn-secondary" onClick={onRefresh} style={{ gap: 8 }}>
        <RefreshCw size={15} /> Refresh Status
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 – Rejected
// ---------------------------------------------------------------------------
function StepRejected({ profile, onRefresh }) {
  return (
    <div className="card" style={{ maxWidth: 520, margin: '6rem auto', textAlign: 'center', padding: '3rem 2.5rem' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fef2f2', border: '3px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
        <XCircle size={32} color="#ef4444" />
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Application Rejected</h2>
      <p style={{ color: '#64748b', fontSize: '0.9375rem', marginBottom: '0.75rem' }}>
        Unfortunately your seller profile was not approved.
      </p>
      {profile?.rejection_reason && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '1rem', textAlign: 'left', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#b91c1c' }}>
          <strong>Reason:</strong> {profile.rejection_reason}
        </div>
      )}
      <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '2rem' }}>
        Contact the platform administrators for further assistance.
      </p>
      <button className="btn btn-secondary" onClick={onRefresh}><RefreshCw size={15} /> Check Again</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4 – Approved, but no store yet → Show "Create Store" form
// ---------------------------------------------------------------------------
function StepCreateStore({ onStoreCreated }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await sellersApi.saveSellerStore(form, false);
      onStoreCreated();
    } catch (err) {
      setError(err.message || 'Failed to create store');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 520, margin: '5rem auto', padding: '2.5rem' }}>
      {/* Progress Steps */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 700, fontSize: '0.8125rem' }}>
          <CheckCircle size={18} /> Approved
        </div>
        <div style={{ width: 40, height: 2, background: '#4f46e5' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4f46e5', fontWeight: 700, fontSize: '0.8125rem' }}>
          <Store size={18} /> Create Store
        </div>
        <div style={{ width: 40, height: 2, background: '#e2e8f0' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontWeight: 700, fontSize: '0.8125rem' }}>
          <Package size={18} /> List Products
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4', border: '3px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <ShieldCheck size={26} color="#10b981" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
          You're Approved! 🎉
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.9375rem' }}>
          Your seller account is verified. Now set up your storefront to start selling.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
          <AlertTriangle size={16} /> <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Store Name *</label>
          <input
            type="text"
            required
            className="form-control"
            placeholder="e.g. TechZone Direct"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Store Description</label>
          <textarea
            rows="3"
            className="form-control"
            placeholder="Tell shoppers about your store..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
          {loading ? 'Creating Store...' : <><Store size={16} /> Launch My Store</>}
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Full Active Dashboard (profile approved + store exists)
// ---------------------------------------------------------------------------
function ActiveDashboard({ storeName }) {
  const [activeTab, setActiveTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', compare_at_price: '', stock: '', sku: '', category: '', description: '' });
  const [sellerOrders, setSellerOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [trackingForm, setTrackingForm] = useState({ status: '', tracking_number: '', notes: '' });
  const [notification, setNotification] = useState(null);

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try { setAnalytics(await sellersApi.getSellerAnalytics()); }
    catch (err) { console.error('Analytics load error:', err); }
    finally { setAnalyticsLoading(false); }
  };

  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([catalogApi.getSellerProducts(), catalogApi.getCategories(false)]);
      setProducts(prodRes.results || prodRes || []);
      const cats = catRes.results || catRes || [];
      setCategories(cats);
      if (cats.length > 0) setNewProduct((p) => ({ ...p, category: cats[0].id }));
    } catch (err) { console.error('Products load error:', err); }
    finally { setProductsLoading(false); }
  };

  const loadOrders = async () => {
    setOrdersLoading(true);
    try { setSellerOrders((await ordersApi.getSellerOrders(statusFilter)).results || []); }
    catch (err) { console.error('Orders load error:', err); }
    finally { setOrdersLoading(false); }
  };

  useEffect(() => { loadAnalytics(); }, []);
  useEffect(() => {
    if (activeTab === 'products') loadProducts();
    if (activeTab === 'orders') loadOrders();
  }, [activeTab, statusFilter]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await catalogApi.createSellerProduct({
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        compare_at_price: newProduct.compare_at_price ? parseFloat(newProduct.compare_at_price) : null,
        stock: parseInt(newProduct.stock, 10),
        sku: newProduct.sku,
        category: parseInt(newProduct.category, 10),
        description: newProduct.description,
      });
      notify('Product listed successfully!');
      setShowAddModal(false);
      setNewProduct({ name: '', price: '', compare_at_price: '', stock: '', sku: '', category: categories[0]?.id || '', description: '' });
      loadProducts();
    } catch (err) { notify(err.message || 'Failed to create product', 'danger'); }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try { await catalogApi.deleteSellerProduct(id); notify('Product deleted.'); loadProducts(); }
    catch (err) { notify(err.message || 'Failed to delete product', 'danger'); }
  };

  const handleUpdateStatus = async (orderId) => {
    try {
      await ordersApi.updateFulfillmentStatus(orderId, trackingForm);
      notify('Fulfillment status updated!');
      setUpdatingOrderId(null);
      loadOrders(); loadAnalytics();
    } catch (err) { notify(err.message || 'Update failed', 'danger'); }
  };

  const tabStyle = (tab) => ({
    padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: 700,
    fontSize: '0.875rem', cursor: 'pointer',
    background: activeTab === tab ? '#ffffff' : 'transparent',
    color: activeTab === tab ? '#4f46e5' : '#64748b',
    boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
  });

  return (
    <div className="container" style={{ padding: '2.5rem 1.25rem 4rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4f46e5', fontWeight: 700, fontSize: '0.875rem' }}>
            <Store size={16} /> MERCHANT PORTAL
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
            {analytics?.store_name || storeName || 'Seller Dashboard'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Manage your store catalog, inspect real-time sales metrics, and fulfill customer shipments.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', background: '#e2e8f0', padding: '4px', borderRadius: '10px' }}>
          <button style={tabStyle('analytics')} onClick={() => setActiveTab('analytics')}>Overview & Sales</button>
          <button style={tabStyle('products')} onClick={() => setActiveTab('products')}>My Products</button>
          <button style={tabStyle('orders')} onClick={() => setActiveTab('orders')}>Fulfillment Orders</button>
        </div>
      </div>

      {notification && (
        <div className={`alert alert-${notification.type}`} style={{ marginBottom: '1.5rem' }}>
          <span>{notification.msg}</span>
        </div>
      )}

      {/* TAB: Analytics */}
      {activeTab === 'analytics' && (
        <div>
          {analyticsLoading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading business analytics...</div>
          ) : analytics ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                {[
                  { label: 'TOTAL REVENUE', value: `$${analytics.overview?.total_revenue || '0.00'}`, sub: 'Live calculated from sub-orders', color: '#4f46e5', Icon: DollarSign },
                  { label: 'ORDERS RECEIVED', value: analytics.overview?.total_orders || 0, sub: `Avg: $${analytics.overview?.avg_order_value || '0.00'} / order`, color: '#0ea5e9', Icon: Package },
                  { label: 'UNITS SOLD', value: analytics.overview?.total_units_sold || 0, sub: 'Individual products shipped', color: '#10b981', Icon: TrendingUp },
                  { label: 'ACTIVE PRODUCTS', value: analytics.inventory?.active_products || 0, sub: `${analytics.inventory?.low_stock_products || 0} low stock items`, color: '#f59e0b', Icon: Store },
                ].map(({ label, value, sub, color, Icon }) => (
                  <div key={label} className="card" style={{ padding: '1.5rem', borderLeft: `4px solid ${color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.8125rem', fontWeight: 600 }}>
                      <span>{label}</span><Icon size={18} color={color} />
                    </div>
                    <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 4px' }}>{value}</div>
                    <span style={{ fontSize: '0.75rem', color: '#10b981' }}>{sub}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                <div className="card">
                  <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, marginBottom: '1.25rem', color: '#0f172a' }}>Fulfillment Pipeline</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    {[
                      { label: 'Pending Action', key: 'pending', Icon: Clock, color: '#d97706', badge: 'badge-accent' },
                      { label: 'Processing & Packaging', key: 'processing', Icon: Package, color: '#4f46e5', badge: 'badge-primary' },
                      { label: 'Shipped / In Transit', key: 'shipped', Icon: Truck, color: '#0ea5e9', badge: 'badge-primary' },
                      { label: 'Delivered Successfully', key: 'delivered', Icon: CheckCircle, color: '#10b981', badge: 'badge-success' },
                    ].map(({ label, key, Icon, color, badge }) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem' }}>
                          <Icon size={16} color={color} /> {label}
                        </span>
                        <span className={`badge ${badge}`}>{analytics.orders_by_status?.[key] || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, marginBottom: '1.25rem', color: '#0f172a' }}>Top Selling Products</h3>
                  {analytics.top_selling_products?.length > 0 ? (
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                      {analytics.top_selling_products.map((item, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.product_name}</div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.units_sold} units sold</span>
                          </div>
                          <span style={{ fontWeight: 800, color: '#4f46e5' }}>${item.total_revenue}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No orders fulfilled yet.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p>No seller store data available.</p>
          )}
        </div>
      )}

      {/* TAB: Products */}
      {activeTab === 'products' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Store Products ({products.length})</h2>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-sm"><Plus size={16} /> Add Product</button>
          </div>

          {productsLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading products...</div>
          ) : products.length > 0 ? (
            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    {['Product', 'SKU', 'Price', 'Stock', 'Status', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: '12px 18px', textAlign: h === 'Actions' ? 'right' : 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 18px', fontWeight: 700, color: '#0f172a' }}>
                        <Link to={`/products/${p.slug}`} style={{ color: 'inherit' }}>{p.name}</Link>
                      </td>
                      <td style={{ padding: '12px 18px', color: '#64748b' }}>{p.sku || '-'}</td>
                      <td style={{ padding: '12px 18px', fontWeight: 700 }}>${p.price}</td>
                      <td style={{ padding: '12px 18px' }}>
                        <span className={`badge ${p.stock > 5 ? 'badge-success' : p.stock > 0 ? 'badge-accent' : 'badge-danger'}`}>{p.stock} units</span>
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <span className={`badge ${p.is_active ? 'badge-primary' : 'badge-muted'}`}>{p.is_active ? 'Active' : 'Draft'}</span>
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                        <button onClick={() => handleDeleteProduct(p.id)} className="btn btn-secondary btn-sm" style={{ padding: '6px', color: '#ef4444' }} title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <Package size={48} style={{ color: '#94a3b8', margin: '0 auto 1rem' }} />
              <h3>Your store doesn't have any products yet</h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.5rem 0 1.5rem' }}>Add your first product to start accepting orders!</p>
              <button onClick={() => setShowAddModal(true)} className="btn btn-primary"><Plus size={16} /> Add First Product</button>
            </div>
          )}

          {/* Add Product Modal */}
          {showAddModal && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem' }}>
              <div className="card" style={{ width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>List New Product</h3>
                  <button onClick={() => setShowAddModal(false)} className="btn btn-secondary btn-sm">✕</button>
                </div>
                <form onSubmit={handleAddProduct}>
                  <div className="form-group">
                    <label className="form-label">Product Name *</label>
                    <input type="text" required className="form-control" placeholder="e.g. Wireless Pro Earbuds" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Price ($) *</label>
                      <input type="number" step="0.01" required className="form-control" placeholder="49.99" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Original Price (optional)</label>
                      <input type="number" step="0.01" className="form-control" placeholder="69.99" value={newProduct.compare_at_price} onChange={(e) => setNewProduct({ ...newProduct, compare_at_price: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Stock Quantity *</label>
                      <input type="number" min="0" required className="form-control" placeholder="25" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">SKU (optional)</label>
                      <input type="text" className="form-control" placeholder="TECH-001" value={newProduct.sku} onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select className="form-control" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}>
                      {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Detailed Description *</label>
                    <textarea rows="4" required className="form-control" placeholder="Describe specifications, dimensions, features..." value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                    <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn btn-primary">Save & Publish Product</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: Orders */}
      {activeTab === 'orders' && (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Store Sub-Orders ({sellerOrders.length})</h2>
              <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>Only orders containing items from your store appear here.</p>
            </div>
            <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 180, height: 38 }}>
              <option value="">All Statuses</option>
              {['pending', 'processing', 'shipped', 'delivered'].map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          {ordersLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading orders...</div>
          ) : sellerOrders.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {sellerOrders.map((so) => (
                <div key={so.id} className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: 4 }}>
                        <span style={{ fontSize: '1.0625rem', fontWeight: 800 }}>Order #{so.order_number}</span>
                        <span className={`badge ${so.status === 'delivered' ? 'badge-success' : so.status === 'shipped' ? 'badge-primary' : 'badge-accent'}`}>{so.status}</span>
                      </div>
                      <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>Customer: <strong>{so.customer_username}</strong></span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4f46e5' }}>${so.subtotal}</div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(so.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Items to Ship:</span>
                    <ul style={{ listStyle: 'none', marginTop: 4, fontSize: '0.875rem' }}>
                      {so.items?.map((it) => (
                        <li key={it.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                          <span>{it.quantity}x {it.product_name}</span><span style={{ fontWeight: 600 }}>${it.line_total}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {so.tracking_number && (
                    <div style={{ fontSize: '0.8125rem', color: '#3730a3', background: '#eef2ff', padding: '6px 12px', borderRadius: 6, marginBottom: '1rem' }}>
                      Tracking: <strong>{so.tracking_number}</strong> {so.notes && `(${so.notes})`}
                    </div>
                  )}

                  {updatingOrderId === so.id ? (
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        {[
                          { label: 'Fulfillment Status', key: 'status', type: 'select', options: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] },
                          { label: 'Tracking Code', key: 'tracking_number', type: 'text', placeholder: 'TRACK-12345' },
                          { label: 'Notes for Buyer', key: 'notes', type: 'text', placeholder: 'Shipped via Courier' },
                        ].map(({ label, key, type, options, placeholder }) => (
                          <div key={key}>
                            <label className="form-label" style={{ fontSize: '0.75rem' }}>{label}</label>
                            {type === 'select' ? (
                              <select className="form-control" value={trackingForm[key]} onChange={(e) => setTrackingForm({ ...trackingForm, [key]: e.target.value })} style={{ height: 36, fontSize: '0.8125rem' }}>
                                {options.map((o) => (<option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>))}
                              </select>
                            ) : (
                              <input type="text" className="form-control" placeholder={placeholder} value={trackingForm[key]} onChange={(e) => setTrackingForm({ ...trackingForm, [key]: e.target.value })} style={{ height: 36, fontSize: '0.8125rem' }} />
                            )}
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => setUpdatingOrderId(null)} className="btn btn-secondary btn-sm">Cancel</button>
                        <button onClick={() => handleUpdateStatus(so.id)} className="btn btn-primary btn-sm">Save Changes</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                      <button onClick={() => { setUpdatingOrderId(so.id); setTrackingForm({ status: so.status, tracking_number: so.tracking_number || '', notes: so.notes || '' }); }} className="btn btn-primary btn-sm">
                        <Truck size={14} /> Update Tracking & Status
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: '#64748b' }}>No orders currently match the selected filter.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root Component — State Machine Router
// ---------------------------------------------------------------------------
export default function SellerDashboard() {
  const [onboarding, setOnboarding] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await sellersApi.getOnboardingStatus();
      setOnboarding(data);
    } catch (err) {
      console.error('Onboarding status error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem', color: '#64748b' }}>
        <Loader size={36} style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ fontWeight: 600 }}>Loading your seller portal...</p>
      </div>
    );
  }

  if (!onboarding) return null;

  const { step } = onboarding;

  if (step === 'no_profile') return <StepNoProfile onRefresh={fetchStatus} />;
  if (step === 'pending') return <StepPendingApproval profile={onboarding.profile} onRefresh={fetchStatus} />;
  if (step === 'rejected') return <StepRejected profile={onboarding.profile} onRefresh={fetchStatus} />;
  if (step === 'approved') return <StepCreateStore onStoreCreated={fetchStatus} />;
  if (step === 'has_store') return <ActiveDashboard storeName={onboarding.store?.name} />;

  return <StepPendingApproval profile={onboarding.profile} onRefresh={fetchStatus} />;
}
