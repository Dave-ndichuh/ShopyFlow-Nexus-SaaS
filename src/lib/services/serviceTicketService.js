export const ServiceTicketService = {
  getTickets: async (supabase, tenantId, branchId = null, employeeId = null) => {
    let query = supabase
      .from('service_tickets')
      .select(`
        *,
        customer:contacts(first_name, last_name),
        service_ticket_items(id, item_id, quantity, unit_price, subtotal, catalog_items(name))
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (branchId) query = query.eq('branch_id', branchId);
    if (employeeId) query = query.eq('employee_id', employeeId);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  createTicket: async (supabase, tenantId, branchId, ticketData) => {
    const { data, error } = await supabase
      .from('service_tickets')
      .insert([{
        tenant_id: tenantId,
        branch_id: branchId,
        ...ticketData
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateTicket: async (supabase, tenantId, ticketId, updates) => {
    const { error } = await supabase
      .from('service_tickets')
      .update(updates)
      .eq('tenant_id', tenantId)
      .eq('id', ticketId);

    if (error) throw error;
  },

  deleteTicket: async (supabase, tenantId, ticketId) => {
    const { error } = await supabase
      .from('service_tickets')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', ticketId);
      
    if (error) throw error;
  },

  addPartToTicket: async (supabase, tenantId, ticketId, item) => {
    const { error } = await supabase
      .from('service_ticket_items')
      .insert([{
        tenant_id: tenantId,
        ticket_id: ticketId,
        item_id: item.item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal
      }]);

    if (error) throw error;
  },

  removePartFromTicket: async (supabase, tenantId, partId) => {
    const { error } = await supabase
      .from('service_ticket_items')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', partId);

    if (error) throw error;
  }
};
