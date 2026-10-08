import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FilterBar } from '../components/browse/FilterBar';
import { TraderCard } from '../components/browse/TraderCard';
import { CourseworkPortfolio } from '../components/common/CourseworkPortfolio';
import { getTraders } from '../api/traders';
import { toggleConnectTrader } from '../api/connections';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import './BrowsePage.css';

export function BrowsePage() {
  const [traders, setTraders] = useState([]);
  const [search, setSearch] = useState('');
  const [cluster, setCluster] = useState('All Clusters');
  const [sector, setSector] = useState('All Sectors');
  const [role, setRole] = useState('All Roles');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { user } = useAuth();

  const fetchTradersList = async () => {
    setLoading(true);
    try {
      const res = await getTraders({
        cluster,
        sector,
        role,
        search
      });
      if (res.success) {
        setTraders(res.data);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTradersList();

    const handleUpdate = () => {
      fetchTradersList();
    };

    window.addEventListener('tradetrust_score_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    return () => {
      window.removeEventListener('tradetrust_score_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, [cluster, sector, role]);

  const handleSearchSubmit = () => {
    fetchTradersList();
  };

  const handleConnectToggle = async (traderId) => {
    const res = await toggleConnectTrader(traderId);
    if (res.success) {
      const isNowConnected = res.data.connectionStatus === 'connected';
      showToast(isNowConnected ? `Connected with ${res.data.businessName}` : `Disconnected`);
      setTraders((prev) =>
        prev.map((t) => (t.id === traderId ? res.data : t))
      );
    }
  };

  return (
    <div className="browse-page">
      {/* Registration callout banner for unauthenticated bazaar merchants */}
      {!user && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(90deg, rgba(30, 111, 251, 0.1) 0%, rgba(30, 111, 251, 0.03) 100%)',
          border: '1px solid rgba(30, 111, 251, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 16px',
          marginBottom: 'var(--space-md)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-secondary)'
        }}>
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>Are you a Mumbai Bazaar Trader?</strong> Public browsing is free. Register your business to start building your verified Trust Score.
          </div>
          <Link
            to="/register"
            style={{
              background: 'var(--accent-blue)',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              textDecoration: 'none',
              marginLeft: 'var(--space-md)',
              whiteSpace: 'nowrap'
            }}
          >
            Register Free
          </Link>
        </div>
      )}

      {/* Filter and Search Bar at the very top of registry */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        cluster={cluster}
        onClusterChange={setCluster}
        sector={sector}
        onSectorChange={setSector}
        role={role}
        onRoleChange={setRole}
        resultCount={traders.length}
        onSearchSubmit={handleSearchSubmit}
      />

      {/* Trader Cards Grid */}
      <div className="browse-grid">
        {traders.length === 0 && !loading && (
          <div className="browse-empty-state">
            <h3>No traders found matching your criteria.</h3>
            <p style={{ marginTop: '8px', fontSize: 'var(--text-sm)' }}>
              Try clearing filters or searching with a different commodity sector or market lane.
            </p>
          </div>
        )}

        {traders.map((trader) => (
          <TraderCard
            key={trader.id}
            trader={trader}
            onConnectToggle={handleConnectToggle}
          />
        ))}
      </div>

      {/* Dedicated Coursework & Evaluation Portfolio at the very bottom of Browse Registry */}
      <CourseworkPortfolio />
    </div>
  );
}
