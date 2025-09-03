import React from 'react'
import { useToastStore } from '../toastStore'
import type { ToastMessage } from '../uploadTypes'

const toastStyles: React.CSSProperties = {
  position: 'fixed',
  bottom: 20,
  right: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  zIndex: 9999,
  maxWidth: '400px'
}

const toastItemStyles = (type: ToastMessage['type']): React.CSSProperties => ({
  padding: '12px 20px',
  borderRadius: 8,
  backgroundColor: type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  animation: 'slideIn 0.3s ease-out',
  fontSize: '14px',
  fontWeight: 500
})

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()
  
  if (toasts.length === 0) return null
  
  return (
    <div style={toastStyles}>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      {toasts.map((toast) => (
        <div key={toast.id} style={toastItemStyles(toast.type)}>
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '18px',
              padding: 0,
              opacity: 0.8
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
