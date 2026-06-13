/**
 * Contact Service
 * Handles operations for customers/clients.
 */
export const ContactService = {
  /**
   * Get all contacts for a tenant
   */
  async getContacts(supabase, tenantId) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  /**
   * Create a new contact
   */
  async createContact(supabase, tenantId, contactData) {
    const { data, error } = await supabase
      .from('contacts')
      .insert([{ ...contactData, tenant_id: tenantId }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Update an existing contact
   */
  async updateContact(supabase, id, contactData) {
    const { data, error } = await supabase
      .from('contacts')
      .update(contactData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Delete a contact
   */
  async deleteContact(supabase, id) {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};
