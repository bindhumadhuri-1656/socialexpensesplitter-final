import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await api.get('/groups');
      setGroups(res.data);
    } catch (err) {
      console.error('Failed to fetch groups', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await api.post('/groups', { name: newGroupName });
      setNewGroupName('');
      setShowCreateModal(false);
      fetchGroups();
    } catch (err) {
      console.error('Failed to create group', err);
    }
  };

  if (loading) return <div className="text-center mt-2">Loading dashboard...</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Your Groups</h2>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ Create Group</button>
      </div>

      {showCreateModal && (
        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
          <h3>Create New Group</h3>
          <form onSubmit={handleCreateGroup} style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Group Name" 
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary">Create</button>
            <button type="button" className="btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
          </form>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="glass-panel text-center text-muted">
          <p>You are not part of any groups yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {groups.map(group => (
            <Link to={`/groups/${group._id}`} key={group._id} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="glass-panel" style={{ cursor: 'pointer' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>{group.name}</h3>
                <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                  {group.members.length} members
                </p>
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                  <span style={{ fontSize: '0.85rem' }} className="text-success">
                    Click to view details
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
