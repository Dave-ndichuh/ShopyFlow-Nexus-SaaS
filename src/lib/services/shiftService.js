export const ShiftService = {
  async getActiveShift(supabase, tenantId, branchId, userId) {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('branch_id', branchId)
      .eq('user_id', userId)
      .eq('status', 'open')
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows returned
    return data || null;
  },

  async openShift(supabase, tenantId, branchId, userId, startingCash) {
    const { data, error } = await supabase
      .from('shifts')
      .insert({
        tenant_id: tenantId,
        branch_id: branchId,
        user_id: userId,
        status: 'open',
        starting_cash: startingCash
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async closeShift(supabase, shiftId, actualCash, expectedCash, notes) {
    const discrepancy = actualCash - expectedCash;
    const { data, error } = await supabase
      .from('shifts')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
        expected_cash: expectedCash,
        actual_cash: actualCash,
        discrepancy: discrepancy,
        notes: notes
      })
      .eq('id', shiftId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getCashMovements(supabase, shiftId) {
    const { data, error } = await supabase
      .from('cash_movements')
      .select('*')
      .eq('shift_id', shiftId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async recordCashMovement(supabase, tenantId, shiftId, type, amount, reason) {
    const { data, error } = await supabase
      .from('cash_movements')
      .insert({
        tenant_id: tenantId,
        shift_id: shiftId,
        type: type, // 'pay_in', 'pay_out'
        amount: amount,
        reason: reason
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getShiftHistory(supabase, tenantId, branchId) {
    const { data, error } = await supabase
      .from('shifts')
      .select(`
        *,
        auth_users:user_id (email, raw_user_meta_data)
      `)
      .eq('tenant_id', tenantId)
      .eq('branch_id', branchId)
      .order('opened_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    // Map auth_users to users (for consistency if needed)
    return data.map(shift => ({
      ...shift,
      user_name: shift.auth_users?.raw_user_meta_data?.name || shift.auth_users?.email || 'Unknown'
    }));
  },

  async getShiftSalesTotal(supabase, shiftId) {
    // Only count cash sales for the expected drawer cash
    const { data, error } = await supabase
      .from('orders')
      .select('amount_paid')
      .eq('shift_id', shiftId)
      .eq('payment_method', 'Cash')
      .in('status', ['completed', 'pending']); // Only completed orders usually, but M-Pesa is pending

    if (error) throw error;
    
    return data.reduce((sum, order) => sum + (Number(order.amount_paid) || 0), 0);
  }
};
