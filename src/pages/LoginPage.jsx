import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TermsModal } from '../components/modals/TermsModal';
import { ContactModal } from '../components/modals/ContactModal';
import { AdminLoginModal } from '../components/modals/AdminLoginModal';
import './LoginPage.css';

const CLUSTERS = [
  'Zaveri Bazaar',
  'Dadar Market',
  'Mangaldas Market',
  'Lamington Road',
  'Crawford Market'
];

const SECTORS = [
  'Ornaments & Jewellery',
  'Gold & Silver Jewellery',
  'Precious Stones',
  'Fabrics',
  'Electronics',
  'Stationery'
];

export function LoginPage({ initialTab }) {
  const [searchParams] = useSearchParams();
  const tabFromQuery = searchParams.get('tab');
  const promptFromQuery = searchParams.get('prompt');

  const [activeTab, setActiveTab] = useState(initialTab || (tabFromQuery === 'register' ? 'register' : 'login'));
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Modals
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Login form state (pre-filled with seed account for instant evaluation)
  const [phone, setPhone] = useState('9820012345');
  const [password, setPassword] = useState('password123');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regBusinessDesc, setRegBusinessDesc] = useState('');
  const [regRole, setRegRole] = useState('RETAILER'); // 'WHOLESALER' | 'RETAILER'
  const [regCluster, setRegCluster] = useState('Zaveri Bazaar');
  const [regSector, setRegSector] = useState('Ornaments & Jewellery');
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    } else if (tabFromQuery === 'register') {
      setActiveTab('register');
    }
  }, [initialTab, tabFromQuery]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login({ phone, password });
      if (res.success) {
        if (res.data?.role === 'ADMIN') {
          showToast('Welcome, Market Association Administrator!');
          navigate('/admin');
        } else {
          showToast('Welcome back, ' + (res.data.name || 'Trader') + '!');
          navigate('/dashboard');
        }
      } else {
        alert(res.message || 'Login failed. Please check credentials.');
      }
    } catch (err) {
      alert('Login error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await register({
        name: regName,
        phone: regPhone,
        businessName: regBusinessName,
        businessDesc: regBusinessDesc,
        role: regRole,
        cluster: regCluster,
        sector: regSector,
        password: regPassword
      });
      if (res.success) {
        showToast('Account registered successfully! Welcome to TradeTrust.');
        navigate('/dashboard');
      } else {
        alert(res.message || 'Registration failed');
      }
    } catch (err) {
      alert('Registration error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const res = await login({ phone: '9820012345', password: 'password123' });
      if (res.success) {
        showToast('Signed in as Rajesh Mehta (Seed Account)');
        navigate('/dashboard');
      } else {
        alert(res.message || 'Demo login failed');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPromptMessage = () => {
    if (promptFromQuery === 'ledger') return '🔒 Please sign in to access your Private Credit Ledger.';
    if (promptFromQuery === 'notifications') return '🔔 Please sign in to view your Market Alerts & Notifications.';
    if (promptFromQuery === 'profile') return '👤 Please sign in to access your Personal Trader Profile.';
    return null;
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        <div className="login-logo-container">
          <img src="/logo.png" alt="TradeTrust" className="login-logo-img" />
          <p className="login-tagline">Know who you're trading with.</p>
        </div>

        {getPromptMessage() && (
          <div style={{
            background: 'rgba(30, 111, 251, 0.1)',
            border: '1px solid rgba(30, 111, 251, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            fontSize: 'var(--text-xs)',
            color: 'var(--accent-blue)',
            fontWeight: 600,
            marginBottom: 'var(--space-md)',
            textAlign: 'center'
          }}>
            {getPromptMessage()}
          </div>
        )}

        <div style={{ marginBottom: 'var(--space-md)' }}>
          <button
            type="button"
            className="modal-btn-primary"
            style={{ width: '100%', padding: '10px 14px', background: 'var(--accent-blue)', color: '#fff', borderRadius: 'var(--radius-md)' }}
            onClick={handleDemoLogin}
            disabled={loading}
          >
            ⚡ 1-Click Demo Login (Rajesh Mehta)
          </button>
        </div>

        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`login-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            Register Business
          </button>
        </div>

        {activeTab === 'login' ? (
          <form className="login-form" onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">Phone Number or Username</label>
              <input
                type="text"
                placeholder="10-digit mobile number or 'Admin'"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                placeholder="Account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Sign In to TradeTrust'}
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label className="form-label">Trader Full Name</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Shah"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                placeholder="10-digit mobile"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Business / Shop Name</label>
              <input
                type="text"
                placeholder="e.g. Shah Gems & Jewellery"
                value={regBusinessName}
                onChange={(e) => setRegBusinessName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Trader Role</label>
              <div className="role-toggle-group">
                <button
                  type="button"
                  className={`role-toggle-btn ${regRole === 'WHOLESALER' ? 'active' : ''}`}
                  onClick={() => setRegRole('WHOLESALER')}
                >
                  Wholesaler
                </button>
                <button
                  type="button"
                  className={`role-toggle-btn ${regRole === 'RETAILER' ? 'active' : ''}`}
                  onClick={() => setRegRole('RETAILER')}
                >
                  Retailer
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">Cluster Market</label>
                <select
                  value={regCluster}
                  onChange={(e) => setRegCluster(e.target.value)}
                  className="browse-select"
                >
                  {CLUSTERS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Sector</label>
                <select
                  value={regSector}
                  onChange={(e) => setRegSector(e.target.value)}
                  className="browse-select"
                >
                  {SECTORS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Business Description</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: '60px' }}
                placeholder="Briefly describe your merchandise and trading terms..."
                value={regBusinessDesc}
                onChange={(e) => setRegBusinessDesc(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Create Password</label>
              <input
                type="password"
                placeholder="Min 6 characters"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>
        )}

        <div className="login-footer-links" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setIsTermsOpen(true)}>
              Terms & Conditions
            </span>
            <span>•</span>
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setIsContactOpen(true)}>
              Contact Support
            </span>
          </div>
          <span
            className="admin-access-link"
            style={{ fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer' }}
            onClick={() => setIsAdminModalOpen(true)}
            title="Access Market Association Administrator Desk"
          >
            🏛️ Market Association Arbitration Desk (Admin)
          </span>
        </div>
      </div>

      {isTermsOpen && <TermsModal onClose={() => setIsTermsOpen(false)} />}
      {isContactOpen && <ContactModal onClose={() => setIsContactOpen(false)} />}
      {isAdminModalOpen && <AdminLoginModal onClose={() => setIsAdminModalOpen(false)} />}
    </div>
  );
}
