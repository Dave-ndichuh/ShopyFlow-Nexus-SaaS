'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/components/AuthGuard';
import { ExpenseService } from '@/lib/services/expenseService';
import { Plus, Trash2, Search, X, Settings, TrendingDown } from 'lucide-react';

export default function ExpensesPage() {
  const { activeTenant, activeBranch, user } = useAuth();
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Expense Modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category_id: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    reference_no: '',
    notes: ''
  });

  // Category Modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const fetchData = async () => {
    if (!activeTenant || !activeBranch) return;
    setLoading(true);
    try {
      const cats = await ExpenseService.getCategories(supabase, activeTenant.id);
      setCategories(cats || []);

      const exps = await ExpenseService.getExpenses(supabase, activeTenant.id, activeBranch.id);
      setExpenses(exps || []);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTenant, activeBranch]);

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!activeTenant || !activeBranch || !user) return;
    
    try {
      await ExpenseService.recordExpense(supabase, activeTenant.id, activeBranch.id, user.id, {
        category_id: expenseForm.category_id,
        amount: Number(expenseForm.amount),
        expense_date: expenseForm.expense_date,
        reference_no: expenseForm.reference_no,
        notes: expenseForm.notes
      });
      setShowExpenseModal(false);
      setExpenseForm({ ...expenseForm, amount: '', reference_no: '', notes: '' });
      fetchData();
    } catch (err) {
      alert("Failed to save expense: " + err.message);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!activeTenant || !newCategoryName.trim()) return;
    
    try {
      await ExpenseService.createCategory(supabase, activeTenant.id, { name: newCategoryName.trim() });
      setNewCategoryName('');
      fetchData();
    } catch (err) {
      alert("Failed to create category: " + err.message);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm('Are you sure you want to delete this expense? This affects historical reporting.')) return;
    try {
      await ExpenseService.deleteExpense(supabase, id);
      fetchData();
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  const filteredExpenses = expenses.filter(e => 
    e.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.reference_no?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="heading-1" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <TrendingDown size={28} className="text-destructive" />
            Operating Expenses
          </h1>
          <p className="text-muted">Track overheads to accurately calculate Net Profit.</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowCategoryModal(true)}>
            <Settings size={18} /> Manage Categories
          </button>
          <button className="btn btn-primary" onClick={() => setShowExpenseModal(true)}>
            <Plus size={18} /> Record Expense
          </button>
        </div>
      </div>

      <div className="glass table-wrapper">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-start' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
            <input 
              type="text" 
              placeholder="Search expenses..." 
              className="input" 
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Reference / Notes</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading expenses...</td></tr>
            ) : filteredExpenses.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>No expenses recorded yet.</td></tr>
            ) : (
              filteredExpenses.map((exp) => (
                <tr key={exp.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(exp.expense_date).toLocaleDateString()}</td>
                  <td><span className="badge badge-secondary">{exp.category_name}</span></td>
                  <td>
                    {exp.notes && <div style={{ fontWeight: 500 }}>{exp.notes}</div>}
                    {exp.reference_no && <div className="text-muted" style={{ fontSize: '0.875rem' }}>Ref: {exp.reference_no}</div>}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--destructive)' }}>
                    -Ksh {Number(exp.amount).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-destructive" style={{ padding: '0.5rem' }} title="Delete" onClick={() => handleDeleteExpense(exp.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Expense Modal */}
      {showExpenseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '2rem' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', background: 'var(--background)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <h3 className="heading-2" style={{ margin: 0 }}>Record Expense</h3>
              <button onClick={() => setShowExpenseModal(false)}><X size={20} className="text-muted" /></button>
            </div>
            
            <form onSubmit={handleSaveExpense} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Category</label>
                  <select 
                    className="input" 
                    value={expenseForm.category_id} 
                    onChange={e => setExpenseForm({...expenseForm, category_id: e.target.value})}
                    required
                  >
                    <option value="">Select...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Date</label>
                  <input 
                    type="date" 
                    className="input" 
                    value={expenseForm.expense_date} 
                    onChange={e => setExpenseForm({...expenseForm, expense_date: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Amount (Ksh)</label>
                <input 
                  type="number" 
                  min="0" 
                  step="0.01"
                  className="input" 
                  placeholder="0.00" 
                  value={expenseForm.amount} 
                  onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Reference No (Optional)</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Receipt / Invoice No" 
                  value={expenseForm.reference_no} 
                  onChange={e => setExpenseForm({...expenseForm, reference_no: e.target.value})}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Notes / Description</label>
                <textarea 
                  className="input" 
                  rows={2} 
                  value={expenseForm.notes} 
                  onChange={e => setExpenseForm({...expenseForm, notes: e.target.value})}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-secondary" style={{ marginRight: '1rem' }} onClick={() => setShowExpenseModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2.5rem' }}>Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories Modal */}
      {showCategoryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '2rem' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', background: 'var(--background)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <h3 className="heading-2" style={{ margin: 0 }}>Expense Categories</h3>
              <button onClick={() => setShowCategoryModal(false)}><X size={20} className="text-muted" /></button>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="New category name..." 
                  value={newCategoryName} 
                  onChange={e => setNewCategoryName(e.target.value)} 
                  required 
                />
                <button type="submit" className="btn btn-primary">Add</button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                {categories.length === 0 ? (
                  <div className="text-muted" style={{ textAlign: 'center', padding: '1rem' }}>No categories created.</div>
                ) : (
                  categories.map(c => (
                    <div key={c.id} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 500 }}>{c.name}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
