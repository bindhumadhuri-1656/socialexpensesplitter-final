import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar glass-panel" style={{ padding: '1rem 2rem', marginBottom: '2rem' }}>
      <Link to="/" className="nav-brand">SplitEase</Link>
      <div className="nav-links">
        {user ? (
          <>
            <span className="nav-link text-muted" style={{ display: 'flex', alignItems: 'center' }}>
              Welcome, {user.name}
            </span>
            <Link to="/dashboard" className="nav-link btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Dashboard</Link>
            <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '0.5rem 1rem' }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Login</Link>
            <Link to="/register" className="nav-link btn" style={{ padding: '0.5rem 1rem', border: '1px solid var(--glass-border)' }}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
