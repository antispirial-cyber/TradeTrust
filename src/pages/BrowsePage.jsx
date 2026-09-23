import React, { useState, useEffect } from 'react';
import { FilterBar } from '../components/browse/FilterBar';
import { TraderCard } from '../components/browse/TraderCard';
import { BlankDropbox } from '../components/common/BlankDropbox';
import { getTraders } from '../api/traders';
import { toggleConnectTrader } from '../api/connections';
import { useToast } from '../context/ToastContext';
import './BrowsePage.css';

export function BrowsePage() {
  const [traders, setTraders] = useState([]);
  const [search, setSearch] = useState('');
  const [cluster, setCluster] = useState('All Clusters');
  const [sector, setSector] = useState('All Sectors');
  const [role, setRole] = useState('All Roles');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

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
      {/* Blank file upload dropbox on homepage per specification */}
      <div className="browse-dropbox-wrapper">
        <BlankDropbox onFileSelect={(file) => showToast(`Document uploaded: ${file.name}`)} />
      </div>

      {/* Filter and Search Bar matching screenshot */}
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
    </div>
  );
}
