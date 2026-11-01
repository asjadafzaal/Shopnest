import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ordersApi } from '../api';
import {
  Package,
  ArrowLeft,
  Truck,
  Store,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrderDetail() {
      try {
        const data = await ordersApi.getOrderDetail(id);
        setOrder(data);
      } catch (err) {
        setError(err.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    }
    fetchOrderDetail();
  }, [id]);

  const getFulfillmentBadge = (status) => {
    switch (status) {
      case 'delivered':
        return <span className="badge badge-success"><CheckCircle size={12} /> Delivered</span>;
      case 'shipped':
        return <span className="badge badge-primary"><Truck size={12} /> Shipped</span>;
      case 'processing':
        return <span className="badge badge-accent"><Clock size={12} /> Processing</span>;
      default:
        return <span className="badge badge-muted"><Clock size={12} /> Pending</span>;
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>Loading order details...</div>;
  }

  if (error || !order) {
    return (
      <div className="container" style={{ padding: '4rem 1.25rem', textAlign: 'center' }}>
        <h2>Order Not Found</h2>
        <Link to="/orders" className="btn btn-primary" style={{ marginTop: '1rem' }}>Return to Orders</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1.25rem 4rem' }}>
      <Link to="/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: '#64748b', marginBottom: '1.25rem' }}>
        <ArrowLeft size={14} /> Back to order history
      </Link>

      {/* Header Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          color: '#ffffff',
          padding: '2rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Order #{order.order_number}</h1>
              <span className="badge badge-success" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                Payment Confirmed
              </span>
            </div>
            <p style={{ color: '#c7d2fe', fontSize: '0.875rem' }}>
              Placed on {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.875rem', color: '#c7d2fe' }}>Total Order Value</span>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>${order.total_amount}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        {/* Left Column: Seller Sub-Orders Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
            Fulfillment by Seller Stores ({order.seller_orders?.length || 0})
          </h2>

          {order.seller_orders?.map((so) => (
            <div key={so.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
              {/* Sub-Order Header */}
              <div
                style={{
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <Store size={18} color="#4f46e5" />
                  <Link to={`/stores/${so.store_slug}`} style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                    {so.store_name}
                  </Link>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {getFulfillmentBadge(so.status)}
                  <span style={{ fontSize: '0.9375rem', fontWeight: 700 }}>
                    Subtotal: ${so.subtotal}
                  </span>
                </div>
              </div>

              {/* Tracking Information Banner (if provided by seller) */}
              {so.tracking_number && (
                <div
                  style={{
                    background: '#eef2ff',
                    borderBottom: '1px solid #e0e7ff',
                    padding: '10px 18px',
                    fontSize: '0.8125rem',
                    color: '#3730a3',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <Truck size={16} />
                  <span>
                    Tracking Reference: <strong>{so.tracking_number}</strong>
                    {so.notes && ` — ${so.notes}`}
                  </span>
                </div>
              )}

              {/* Snapshotted Items Table */}
              <div style={{ padding: '1rem 1.25rem' }}>
                <ul style={{ listStyle: 'none' }}>
                  {so.items?.map((item) => (
                    <li
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        fontSize: '0.875rem',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.product_name}</span>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {item.quantity} unit(s) @ ${item.price}
                        </div>
                      </div>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>${item.line_total}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Shipping & Summary Recap */}
        <div>
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={18} color="#4f46e5" /> Shipping Details
            </h3>
            <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.6 }}>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{order.shipping_full_name}</div>
              <div>{order.shipping_address}</div>
              <div>{order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}</div>
              <div>{order.shipping_country}</div>
              <div style={{ marginTop: '0.5rem', color: '#64748b' }}>Phone: {order.shipping_phone}</div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="#10b981" /> Order Guarantees
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.8125rem', color: '#64748b' }}>
              <li>✓ Multi-vendor atomic inventory deduction verified</li>
              <li>✓ Historical unit price snapshotted at purchase</li>
              <li>✓ Direct seller store communication supported</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
