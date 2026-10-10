import React from 'react';
import { SearchIcon, ChevronDownIcon } from '../common/Icons';
import { CLUSTERS, SECTORS, ROLES } from '../../constants';
import './FilterBar.css';

const CLUSTER_OPTIONS = ['All Clusters', ...CLUSTERS];
const SECTOR_OPTIONS = ['All Sectors', ...SECTORS];
const ROLE_OPTIONS = ['All Roles', ...ROLES];

export function FilterBar({
  search,
  onSearchChange,
  cluster,
  onClusterChange,
  sector,
  onSectorChange,
  role,
  onRoleChange,
  resultCount = 0,
  onSearchSubmit
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      onSearchSubmit();
    }
  };

  return (
    <div>
      <div className="browse-filter-container">
        <div className="browse-search-row">
          <div className="browse-search-input-wrapper">
            <span className="browse-search-icon">
              <SearchIcon size={18} />
            </span>
            <input
              type="text"
              className="browse-search-input"
              placeholder="Search traders by business name or phone..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <button
            type="button"
            className="browse-search-btn"
            onClick={onSearchSubmit}
          >
            Search
          </button>
        </div>

        <div className="browse-dropdowns-row">
          <div className="browse-filter-group">
            <label className="browse-filter-label">CLUSTER / BAZAAR</label>
            <div className="browse-select-wrapper">
              <select
                className="browse-select"
                value={cluster}
                onChange={(e) => onClusterChange(e.target.value)}
              >
                {CLUSTER_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span className="browse-select-caret">
                <ChevronDownIcon size={14} />
              </span>
            </div>
          </div>

          <div className="browse-filter-group">
            <label className="browse-filter-label">COMMODITY SECTOR</label>
            <div className="browse-select-wrapper">
              <select
                className="browse-select"
                value={sector}
                onChange={(e) => onSectorChange(e.target.value)}
              >
                {SECTOR_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span className="browse-select-caret">
                <ChevronDownIcon size={14} />
              </span>
            </div>
          </div>

          <div className="browse-filter-group">
            <label className="browse-filter-label">TRADER ROLE</label>
            <div className="browse-select-wrapper">
              <select
                className="browse-select"
                value={role}
                onChange={(e) => onRoleChange(e.target.value)}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <span className="browse-select-caret">
                <ChevronDownIcon size={14} />
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="browse-results-bar">
        <div className="browse-results-count">
          Showing <strong>{resultCount}</strong> {cluster !== 'All Clusters' ? `traders in ${cluster}` : 'registered traders'}
        </div>
        <div className="browse-results-sort">
          <span>Sorted by Trust Score (High to Low)</span>
        </div>
      </div>
    </div>
  );
}
