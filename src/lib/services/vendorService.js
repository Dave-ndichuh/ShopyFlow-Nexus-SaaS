/**
 * Vendor Service
 * Handles operations for suppliers/vendors.
 */
export const VendorService = {
  /**
   * Get all vendors for a tenant
   */
  async getVendors(supabase, tenantId) {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  /**
   * Create a new vendor
   */
  async createVendor(supabase, tenantId, vendorData) {
    const { data, error } = await supabase
      .from('vendors')
      .insert([{ ...vendorData, tenant_id: tenantId }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Update an existing vendor
   */
  async updateVendor(supabase, id, vendorData) {
    const { data, error } = await supabase
      .from('vendors')
      .update(vendorData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Delete a vendor
   */
  async deleteVendor(supabase, id) {
    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};
