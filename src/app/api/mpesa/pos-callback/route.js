import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const body = await request.json();
    console.log("M-Pesa POS Callback Received:", JSON.stringify(body, null, 2));

    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) {
      return NextResponse.json({ error: 'Invalid callback format' }, { status: 400 });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    let receiptNumber = null;
    if (ResultCode === 0 && CallbackMetadata?.Item) {
      const receiptItem = CallbackMetadata.Item.find(item => item.Name === 'MpesaReceiptNumber');
      receiptNumber = receiptItem ? receiptItem.Value : null;
    }

    const status = ResultCode === 0 ? 'Completed' : 'Failed';

    // 1. Update the Transaction Record
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('mpesa_transactions')
      .update({
        status: status,
        receipt_number: receiptNumber,
        raw_callback_data: {
          ...stkCallback, // Append new callback data
          order_id: undefined // We'll extract order_id before overwriting, wait!
        }
      })
      .eq('checkout_request_id', CheckoutRequestID)
      .select()
      .single();

    // Since we overwrote raw_callback_data, we should be careful. 
    // Actually, let's fetch the transaction first to preserve the order_id!
    const { data: existingTx } = await supabaseAdmin
      .from('mpesa_transactions')
      .select('raw_callback_data, tenant_id')
      .eq('checkout_request_id', CheckoutRequestID)
      .single();

    const orderId = existingTx?.raw_callback_data?.order_id;

    // Now update with merged callback data
    await supabaseAdmin
      .from('mpesa_transactions')
      .update({
        status: status,
        receipt_number: receiptNumber,
        raw_callback_data: {
          ...stkCallback,
          order_id: orderId // Preserve the order_id
        }
      })
      .eq('checkout_request_id', CheckoutRequestID);

    // 2. If Successful, Update the POS Order
    if (ResultCode === 0 && orderId && existingTx?.tenant_id) {
      // Mark the order as Paid
      const { error: orderError } = await supabaseAdmin
        .from('orders')
        .update({ payment_status: 'paid' })
        .eq('id', orderId)
        .eq('tenant_id', existingTx.tenant_id);

      if (orderError) {
        console.error("Failed to update POS order status:", orderError);
      } else {
        console.log(`Order ${orderId} successfully marked as PAID from POS M-Pesa Callback.`);
      }
    } else if (ResultCode !== 0) {
      console.log(`POS Payment Failed: ${ResultDesc}`);
      // Depending on requirements, we might update order status to 'failed_payment' or something similar.
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });

  } catch (error) {
    console.error('POS Callback Error:', error);
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Internal Server Error" }, { status: 500 });
  }
}
