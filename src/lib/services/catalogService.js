/**
 * Catalog Service
 * Handles operations for products and services.
 */
export const CatalogService = {
  /**
   * Get all catalog items for a tenant
   */
  async getItems(supabase, tenantId) {
    const { data, error } = await supabase
      .from('catalog_items')
      .select('*, categories(name)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  /**
   * Create a new catalog item
   */
  async createItem(supabase, tenantId, itemData) {
    const { data, error } = await supabase
      .from('catalog_items')
      .insert([{ ...itemData, tenant_id: tenantId }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Update an existing catalog item
   */
  async updateItem(supabase, id, itemData) {
    const { data, error } = await supabase
      .from('catalog_items')
      .update(itemData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Delete a catalog item
   */
  async deleteItem(supabase, id) {
    const { error } = await supabase
      .from('catalog_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },
  
  /**
   * Get Categories
   */
  async getCategories(supabase, tenantId) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name');
      
    if (error) throw error;
    return data;
  }
};
