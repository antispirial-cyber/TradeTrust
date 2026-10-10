import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [cursorTooltips, setCursorTooltips] = useState([]);

  const showToast = useCallback((message, duration = 2500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const showComingSoon = useCallback((event) => {
    if (event && (event.clientX !== undefined || (event.nativeEvent && event.nativeEvent.clientX !== undefined))) {
      const clientX = event.clientX ?? event.nativeEvent.clientX;
      const clientY = event.clientY ?? event.nativeEvent.clientY;
      const tipId = Date.now() + Math.random();

      setCursorTooltips((prev) => [
        ...prev,
        { id: tipId, x: clientX, y: clientY, text: 'Coming Soon' }
      ]);

      setTimeout(() => {
        setCursorTooltips((prev) => prev.filter((t) => t.id !== tipId));
      }, 1800);
    } else {
      showToast('Coming Soon');
    }
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showComingSoon }}>
      {children}

      {/* Floating tooltip right above cursor */}
      {cursorTooltips.map((tip) => (
        <div
          key={tip.id}
          style={{
            position: 'fixed',
            left: `${tip.x}px`,
            top: `${tip.y - 36}px`,
            transform: 'translateX(-50%)',
            zIndex: 10000,
            pointerEvents: 'none',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--accent-color)',
            boxShadow: 'var(--shadow-modal)',
            padding: '5px 12px',
            borderRadius: 'var(--input-radius)',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            animation: 'fadeInUp 0.15s ease-out'
          }}
        >
          {tip.text}
        </div>
      ))}

      {/* Standard top notifications container */}
      <div
        className="toast-container"
        style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          pointerEvents: 'none'
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-modal)',
              padding: '10px 18px',
              borderRadius: 'var(--card-radius)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
