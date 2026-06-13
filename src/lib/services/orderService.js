/**
 * Order Service
 * Handles operations for sales, orders, and transactions.
 */
export const OrderService = {
  /**
   * Get all orders for a tenant
   */
  async getOrders(supabase, tenantId) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        contacts(first_name, last_name, name:first_name)
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    // Map contact details for generic access
    return data.map(order => ({
      ...order,
      contact_name: order.contacts ? `${order.contacts.first_name || ''} ${order.contacts.last_name || ''}`.trim() : 'Walk-in'
    }));
  },

  /**
   * Create a new order with its items
   */
  async createOrder(supabase, tenantId, branchId, orderData, orderItems) {
    // 1. Insert Order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{ 
        ...orderData, 
        tenant_id: tenantId,
        branch_id: branchId 
      }])
      .select()
      .single();
    
    if (orderError) throw orderError;

    // 2. Insert Order Items
    if (orderItems && orderItems.length > 0) {
      const itemsToInsert = orderItems.map(item => ({
        tenant_id: tenantId,
        order_id: order.id,
        item_id: item.item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        tax: item.tax || 0
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // 3. Optional: Trigger Inventory Movements
      // Depending on whether we want this service to orchestrate inventory automatically
      // We can create movements for products (not services).
    }

    return order;
  },

  /**
   * Get order details by ID
   */
  async getOrderDetails(supabase, orderId) {
    const { data, error } = await supabase
      .from('order_items')
      .select('*, catalog_items(name)')
      .eq('order_id', orderId);
      
    if (error) throw error;
    return data;
  }
};
