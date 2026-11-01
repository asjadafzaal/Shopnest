import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersApi } from '../api';
import { Package, ChevronRight, Store, Calendar, ArrowRight } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await ordersApi.getOrders();
        setOrders(res.results || []);
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <span className="badge badge-success">Completed</span>;
      case 'processing': return <span className="badge badge-primary">Processing</span>;
      case 'cancelled': return <span className="badge badge-danger">Cancelled</span>;
      default: return <span className="badge badge-accent">Pending</span>;
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.25rem 4rem' }}>
      <div style={{ maxWidth: '640px', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0f172a' }}>My Order History</h1>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Track past orders, inspect seller sub-order shipments, and review fulfillment status.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading orders...</div>
      ) : orders.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {orders.map((order) => (
            <div key={order.id} className="card card-hover" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#0f172a' }}>
                      Order #{order.order_number}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#64748b' }}>
                    <Calendar size={13} />
                    <span>{new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                    ${order.total_amount}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{order.total_items_count} items</span>
                </div>
              </div>

              {/* Vendors in this order */}
              <div
                style={{
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '0.875rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#475569' }}>
                  <Store size={14} color="#4f46e5" />
                  <span>Stores: <strong>{order.stores?.join(', ') || 'Independent Sellers'}</strong></span>
                </div>

                <Link
                  to={`/orders/${order.id}`}
                  className="btn btn-outline btn-sm"
                  style={{ gap: '4px' }}
                >
                  View Details & Tracking <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Package size={48} style={{ color: '#94a3b8', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No orders placed yet</h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            When you purchase items from our independent stores, your order and tracking numbers will appear here.
          </p>
          <Link to="/products" className="btn btn-primary">Browse Products</Link>
        </div>
      )}
    </div>
  );
}
