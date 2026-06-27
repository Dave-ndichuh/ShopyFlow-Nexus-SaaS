'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/components/AuthGuard';
import { ShiftService } from '@/lib/services/shiftService';
import { Clock, DollarSign, LogOut, ArrowDownRight, ArrowUpRight, History } from 'lucide-react';

export default function ShiftsPage() {
  const { activeTenant, activeBranch, user } = useAuth();
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);

  const [activeShift, setActiveShift] = useState(null);
  const [movements, setMovements] = useState([]);
  const [history, setHistory] = useState([]);

  // Modals
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementType, setMovementType] = useState('pay_in');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('');

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [actualCash, setActualCash] = useState('');

  const fetchData = async () => {
    if (!activeTenant || !activeBranch || !user) return;
    setLoading(true);
    try {
      const shift = await ShiftService.getActiveShift(supabase, activeTenant.id, activeBranch.id, user.id);
      setActiveShift(shift);

      if (shift) {
        const movs = await ShiftService.getCashMovements(supabase, shift.id);
        setMovements(movs);
      }

      // Fetch history for managers (for now everyone can see branch history)
      const hist = await ShiftService.getShiftHistory(supabase, activeTenant.id, activeBranch.id);
      setHistory(hist);
    } catch (err) {
      console.error('Error fetching shift data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTenant, activeBranch, user]);

  const handleMovement = async (e) => {
    e.preventDefault();
    if (!activeShift) return;
    try {
      await ShiftService.recordCashMovement(
        supabase, 
        activeTenant.id, 
        activeShift.id, 
        movementType, 
        Number(movementAmount), 
        movementReason
      );
      setShowMovementModal(false);
      setMovementAmount('');
      setMovementReason('');
      fetchData(); // Refresh movements
    } catch (err) {
      alert("Failed to record cash movement: " + err.message);
    }
  };

  const handleCloseShift = async (e) => {
    e.preventDefault();
    if (!activeShift) return;
    try {
      // 1. Calculate expected cash
      const cashSales = await ShiftService.getShiftSalesTotal(supabase, activeShift.id);
      const payIns = movements.filter(m => m.type === 'pay_in').reduce((sum, m) => sum + Number(m.amount), 0);
      const payOuts = movements.filter(m => m.type === 'pay_out').reduce((sum, m) => sum + Number(m.amount), 0);
      
      const expectedCash = Number(activeShift.starting_cash) + cashSales + payIns - payOuts;

      await ShiftService.closeShift(supabase, activeShift.id, Number(actualCash), expectedCash, "Closed via dashboard");
      
      setShowCloseModal(false);
      setActualCash('');
      fetchData(); // Refresh page state
    } catch (err) {
      alert("Failed to close shift: " + err.message);
    }
  };

  if (!activeBranch) {
    return <div className="p-8 text-center text-muted">Please select a branch first.</div>;
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="heading-1" style={{ margin: 0 }}>Shift Management</h1>
          <p className="text-muted">Manage your cash drawer and view shift history.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>Loading shift data...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
          
          {/* Active Shift Panel */}
          <div className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <Clock size={24} className="text-primary" />
              <h2 className="heading-2" style={{ margin: 0 }}>Active Shift</h2>
            </div>

            {activeShift ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div className="text-muted" style={{ fontSize: '0.875rem' }}>Status</div>
                    <div style={{ fontWeight: 600, color: 'var(--success)' }}>OPEN</div>
                  </div>
                  <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div className="text-muted" style={{ fontSize: '0.875rem' }}>Starting Float</div>
                    <div style={{ fontWeight: 600 }}>Ksh {Number(activeShift.starting_cash).toLocaleString()}</div>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Cash Movements</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setMovementType('pay_in'); setShowMovementModal(true); }}>
                      <ArrowDownRight size={16} className="text-success" /> Pay In
                    </button>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setMovementType('pay_out'); setShowMovementModal(true); }}>
                      <ArrowUpRight size={16} className="text-destructive" /> Pay Out
                    </button>
                  </div>
                  
                  {movements.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                      {movements.map(m => (
                        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(0,0,0,0.1)', borderRadius: 'var(--radius)' }}>
                          <div>
                            <span className={`badge ${m.type === 'pay_in' ? 'badge-success' : 'badge-destructive'}`} style={{ marginRight: '0.5rem' }}>
                              {m.type === 'pay_in' ? 'IN' : 'OUT'}
                            </span>
                            <span style={{ fontSize: '0.875rem' }}>{m.reason}</span>
                          </div>
                          <span style={{ fontWeight: 600 }}>Ksh {Number(m.amount).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted" style={{ fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>No cash movements yet.</div>
                  )}
                </div>

                <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', marginTop: 'auto' }} onClick={() => setShowCloseModal(true)}>
                  <LogOut size={18} /> Close Shift (Z-Report)
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--muted-foreground)' }}>
                <Clock size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                <p>No active shift.</p>
                <p style={{ fontSize: '0.875rem' }}>Go to the POS terminal to open a new shift.</p>
              </div>
            )}
          </div>

          {/* Shift History */}
          <div className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <History size={24} className="text-primary" />
              <h2 className="heading-2" style={{ margin: 0 }}>Shift History</h2>
            </div>
            
            <div className="table-wrapper" style={{ flex: 1, maxHeight: '500px' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Cashier</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Discrepancy</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center' }}>No shifts recorded yet.</td></tr>
                  ) : (
                    history.map(h => (
                      <tr key={h.id}>
                        <td style={{ fontSize: '0.875rem' }}>
                          <div>{new Date(h.opened_at).toLocaleDateString()}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>{new Date(h.opened_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </td>
                        <td>{h.user_name}</td>
                        <td>
                          <span className={`badge ${h.status === 'open' ? 'badge-success' : 'badge-secondary'}`}>
                            {h.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {h.status === 'closed' ? (
                            <span style={{ fontWeight: 600, color: h.discrepancy < 0 ? 'var(--destructive)' : h.discrepancy > 0 ? 'var(--success)' : 'inherit' }}>
                              {h.discrepancy > 0 ? '+' : ''}{Number(h.discrepancy).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Cash Movement Modal */}
      {showMovementModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '2rem' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', background: 'var(--background)', padding: '1.5rem' }}>
            <h3 className="heading-2" style={{ marginBottom: '1.5rem' }}>Record {movementType === 'pay_in' ? 'Pay In' : 'Pay Out'}</h3>
            <form onSubmit={handleMovement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Amount (Ksh)</label>
                <input type="number" min="1" className="input" value={movementAmount} onChange={e => setMovementAmount(e.target.value)} required />
              </div>
              <div>
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Reason</label>
                <input type="text" className="input" placeholder="e.g. Bought shop supplies" value={movementReason} onChange={e => setMovementReason(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowMovementModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Blind Close Modal */}
      {showCloseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '2rem' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', background: 'var(--background)', padding: '2rem', textAlign: 'center' }}>
            <DollarSign size={48} className="text-primary" style={{ margin: '0 auto 1rem' }} />
            <h2 className="heading-2" style={{ marginBottom: '0.5rem' }}>Count Drawer</h2>
            <p className="text-muted" style={{ marginBottom: '2rem' }}>Please count all the cash currently in your drawer and enter the total below.</p>
            
            <form onSubmit={handleCloseShift} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <input 
                  type="number" 
                  min="0"
                  className="input" 
                  placeholder="Total Cash Amount" 
                  value={actualCash} 
                  onChange={e => setActualCash(e.target.value)} 
                  required 
                  style={{ fontSize: '1.5rem', textAlign: 'center', padding: '1rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCloseModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Confirm Close</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
