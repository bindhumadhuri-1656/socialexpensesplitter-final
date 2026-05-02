import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const GroupDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balancesData, setBalancesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    splitType: 'EQUAL'
  });

  useEffect(() => {
    fetchGroupDetails();
    fetchExpenses();
    fetchBalances();
  }, [id]);

  const fetchGroupDetails = async () => {
    try {
      const res = await api.get(`/groups/${id}`);
      setGroup(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await api.get(`/expenses/group/${id}`);
      setExpenses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalances = async () => {
    try {
      const res = await api.get(`/groups/${id}/balances`);
      setBalancesData(res.data);
    } catch (err) {
      console.error('Failed to fetch balances', err);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', {
        ...expenseForm,
        groupId: id,
        amount: Number(expenseForm.amount),
        paidBy: user.id, // currently logged in user pays
        splits: [] // simplifies for 'EQUAL' split at the moment
      });
      setShowExpenseModal(false);
      setExpenseForm({ description: '', amount: '', splitType: 'EQUAL' });
      fetchExpenses();
      fetchBalances();
    } catch (err) {
      console.error('Failed to add expense', err);
    }
  };

  const handleSearchUsers = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    try {
      const res = await api.get(`/users?search=${searchQuery}`);
      const existingMemberIds = group.members.map(m => m._id);
      setSearchResults(res.data.filter(u => !existingMemberIds.includes(u._id)));
    } catch (err) {
      console.error('Failed to search users', err);
    }
  };

  const handleAddMember = async (userId) => {
    try {
      const updatedMembers = [...group.members.map(m => m._id), userId];
      await api.put(`/groups/${id}/members`, { members: updatedMembers });
      setShowAddMemberModal(false);
      setSearchQuery('');
      setSearchResults([]);
      fetchGroupDetails();
    } catch (err) {
      console.error('Failed to add member', err);
    }
  };

  const handleSettleUp = async (settlement) => {
    try {
      await api.post('/settlements', {
        groupId: id,
        paidBy: settlement.from.id,
        paidTo: settlement.to.id,
        amount: settlement.amount
      });
      // Refresh balances and expenses
      fetchBalances();
    } catch (err) {
      console.error('Failed to settle up', err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!group) return <div>Group not found</div>;

  return (
    <div className="animate-fade-in">
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h2>{group.name}</h2>
        <p className="text-muted mt-1">Created by {group.createdBy.name}</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {group.members.map(member => (
            <span key={member._id} style={{ 
              background: 'rgba(255,255,255,0.1)', 
              padding: '0.25rem 0.75rem', 
              borderRadius: '20px', 
              fontSize: '0.85rem' 
            }}>
              {member.name} {member._id === user.id ? '(You)' : ''}
            </span>
          ))}
          <button 
            className="btn" 
            style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem', borderRadius: '20px', border: '1px dashed var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)' }}
            onClick={() => setShowAddMemberModal(true)}
          >
            + Add Member
          </button>
        </div>
      </div>

      {showAddMemberModal && (
        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
          <h4>Add Member to Group</h4>
          <form onSubmit={handleSearchUsers} style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by name or email" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary">Search</button>
            <button type="button" className="btn" onClick={() => { setShowAddMemberModal(false); setSearchResults([]); setSearchQuery(''); }}>Cancel</button>
          </form>

          {searchResults.length > 0 && (
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {searchResults.map(u => (
                <div key={u._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>{u.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                  </div>
                  <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handleAddMember(u._id)}>
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
          {searchResults.length === 0 && searchQuery && (
             <p className="text-muted mt-2" style={{ fontSize: '0.9rem' }}>No users found (or all matching users are already in the group).</p>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem', alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Expenses</h3>
            <button className="btn btn-primary" onClick={() => setShowExpenseModal(true)}>+ Add Expense</button>
          </div>


      {showExpenseModal && (
        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
          <h4>Add New Expense</h4>
          <form onSubmit={handleAddExpense} style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input type="text" className="form-control" value={expenseForm.description} onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Amount</label>
              <input type="number" className="form-control" value={expenseForm.amount} onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})} required min="0.01" step="0.01" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginRight: '1rem' }}>Save Expense</button>
            <button type="button" className="btn" onClick={() => setShowExpenseModal(false)}>Cancel</button>
          </form>
        </div>
      )}

      {expenses.length === 0 ? (
        <div className="glass-panel text-center text-muted">
          No expenses recorded yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {expenses.map(exp => (
            <div key={exp._id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
              <div>
                <h4 style={{ marginBottom: '0.25rem' }}>{exp.description}</h4>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                  Paid by <span style={{ color: 'var(--text-primary)' }}>{exp.paidBy.name}</span> on {new Date(exp.date).toLocaleDateString()}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--accent-primary)' }}>
                  ${exp.amount.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.8rem' }} className="text-muted">
                  {exp.splitType} split
                </div>
              </div>
            </div>
          
          ))}
        </div>
      )}
      </div>

      <div>
        <div style={{ marginBottom: '1rem' }}>
          <h3>Balances & Settlements</h3>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          {balancesData && balancesData.suggestedSettlements.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Suggested Transfers</h4>
              {balancesData.suggestedSettlements.map((settlement, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  background: 'rgba(0,0,0,0.15)',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontWeight: '500', color: '#f8fafc' }}>
                      {settlement.from.id === user.id ? 'You' : settlement.from.name}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>owes</span>
                    <span style={{ fontWeight: '500', color: '#f8fafc' }}>
                      {settlement.to.id === user.id ? 'You' : settlement.to.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontWeight: '600', color: 'var(--danger)', fontSize: '1.2rem' }}>
                      ${settlement.amount.toFixed(2)}
                    </div>
                    {settlement.from.id === user.id && (
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                        onClick={() => handleSettleUp(settlement)}
                      >
                        Settle Up
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <p className="text-muted text-center" style={{ margin: '2rem 0' }}>All settled up! No balances owe money.</p>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default GroupDetails;
