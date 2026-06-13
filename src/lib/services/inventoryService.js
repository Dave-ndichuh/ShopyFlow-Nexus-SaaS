/**
 * Inventory Service
 * Handles operations for stock balances and movements.
 */
export const InventoryService = {
  /**
   * Get inventory balances for a tenant's branch
   */
  async getBalances(supabase, tenantId, branchId) {
    const { data, error } = await supabase
      .from('inventory_balances')
      .select('*, catalog_items(name, sku, cost_price, selling_price)')
      .eq('tenant_id', tenantId)
      .eq('branch_id', branchId);
    
    if (error) throw error;
    return data;
  },

  /**
   * Record an inventory movement (restock, adjustment, sale, transfer)
   * This automatically triggers the database function to update `inventory_balances`
   */
  async recordMovement(supabase, tenantId, branchId, movementData) {
    const { data, error } = await supabase
      .from('inventory_movements')
      .insert([{
        tenant_id: tenantId,
        branch_id: branchId,
        ...movementData
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Batch record inventory movements
   */
  async recordMovementsBulk(supabase, tenantId, branchId, movementsList) {
    const payloads = movementsList.map(m => ({
        tenant_id: tenantId,
        branch_id: branchId,
        ...m
    }));
    
    const { data, error } = await supabase
      .from('inventory_movements')
      .insert(payloads)
      .select();
      
    if (error) throw error;
    return data;
  }
};
