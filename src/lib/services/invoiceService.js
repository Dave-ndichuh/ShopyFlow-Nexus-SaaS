export const InvoiceService = {
  getInvoices: async (supabase, tenantId, branchId = null) => {
    let query = supabase
      .from('invoices')
      .select(`*, invoice_details(*)`)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  createInvoice: async (supabase, tenantId, branchId, invoiceData, items) => {
    // 1. Insert Invoice
    const { data: inv, error: invError } = await supabase
      .from('invoices')
      .insert([{
        tenant_id: tenantId,
        branch_id: branchId,
        customer_name: invoiceData.customer_name,
        customer_phone: invoiceData.customer_phone,
        customer_email: invoiceData.customer_email,
        customer_address: invoiceData.customer_address,
        notes: invoiceData.notes,
        subtotal: invoiceData.subtotal,
        tax_amount: invoiceData.tax_amount,
        grand_total: invoiceData.grand_total,
        status: invoiceData.status || 'Pending',
        created_by: invoiceData.employeeId
      }])
      .select()
      .single();

    if (invError) throw invError;

    // 2. Insert Items
    if (items && items.length > 0) {
      const detailsToInsert = items.map(i => ({
        tenant_id: tenantId,
        invoice_id: inv.id,
        item_id: i.item_id,
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
        subtotal: i.subtotal
      }));

      const { error: detailsError } = await supabase
        .from('invoice_details')
        .insert(detailsToInsert);
        
      if (detailsError) throw detailsError;
    }

    return inv;
  },

  markAsPaid: async (supabase, tenantId, invoiceId, transactionId) => {
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'Paid', transaction_id: transactionId })
      .eq('tenant_id', tenantId)
      .eq('id', invoiceId);
      
    if (error) throw error;
  },
  
  deleteInvoice: async (supabase, tenantId, invoiceId) => {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', invoiceId);
      
    if (error) throw error;
  }
};
