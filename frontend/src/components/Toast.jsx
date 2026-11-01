import React from 'react';
import { useCart } from '../context/CartContext';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function Toast() {
  const { toast } = useCart();
  if (!toast) return null;

  const icons = {
    success: <CheckCircle size={18} color="#10b981" />,
    danger: <AlertCircle size={18} color="#ef4444" />,
    info: <Info size={18} color="#0ea5e9" />,
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '12px 18px',
        boxShadow: '0 12px 24px rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        maxWidth: '380px',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      {icons[toast.type] || icons.info}
      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0f172a' }}>
        {toast.message}
      </span>
    </div>
  );
}
