/**
 * Expense Service
 * Handles operations for expense categories and expenses.
 */
export const ExpenseService = {
  /**
   * Get all expense categories for a tenant
   */
  async getCategories(supabase, tenantId) {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name');
    
    if (error) throw error;
    return data;
  },

  /**
   * Create a new expense category
   */
  async createCategory(supabase, tenantId, payload) {
    const { data, error } = await supabase
      .from('expense_categories')
      .insert({ ...payload, tenant_id: tenantId })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  /**
   * Get expenses for a tenant and branch within an optional date range
   */
  async getExpenses(supabase, tenantId, branchId, startDate = null, endDate = null) {
    let query = supabase
      .from('expenses')
      .select('*, expense_categories(name)')
      .eq('tenant_id', tenantId);

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }
    
    if (startDate) {
      query = query.gte('expense_date', startDate);
    }
    
    if (endDate) {
      query = query.lte('expense_date', endDate);
    }

    const { data, error } = await query.order('expense_date', { ascending: false });
    
    if (error) throw error;
    return data.map(exp => ({
      ...exp,
      category_name: exp.expense_categories?.name || 'Unknown'
    }));
  },

  /**
   * Record a new expense
   */
  async recordExpense(supabase, tenantId, branchId, userId, payload) {
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        ...payload,
        tenant_id: tenantId,
        branch_id: branchId,
        user_id: userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete an expense
   */
  async deleteExpense(supabase, expenseId) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) throw error;
    return true;
  }
};
