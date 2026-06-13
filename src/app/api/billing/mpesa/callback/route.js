import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const data = await request.json();
    console.log('M-Pesa Callback Received:', JSON.stringify(data, null, 2));

    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const stkCallback = data?.Body?.stkCallback;
    if (!stkCallback) {
      return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 });
    }

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    // Fetch the pending transaction from our DB
    const { data: transaction, error: fetchError } = await supabaseAdmin
      .from('mpesa_transactions')
      .select('*')
      .eq('checkout_request_id', CheckoutRequestID)
      .single();

    if (fetchError || !transaction) {
      console.error('Transaction not found for CheckoutRequestID:', CheckoutRequestID);
      // Still return 200 to acknowledge receipt to Safaricom
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' });
    }

    let receiptNumber = null;
    let transactionDate = null;
    const isSuccess = ResultCode === 0;

    if (isSuccess && CallbackMetadata?.Item) {
      const getMetaValue = (name) => {
        const item = CallbackMetadata.Item.find((i) => i.Name === name);
        return item ? item.Value : null;
      };
      
      receiptNumber = getMetaValue('MpesaReceiptNumber');
      const dateStr = getMetaValue('TransactionDate')?.toString(); // Format: YYYYMMDDHHmmss
      
      if (dateStr && dateStr.length === 14) {
        const year = dateStr.slice(0, 4);
        const month = dateStr.slice(4, 6);
        const day = dateStr.slice(6, 8);
        const hour = dateStr.slice(8, 10);
        const minute = dateStr.slice(10, 12);
        const second = dateStr.slice(12, 14);
        transactionDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+03:00`).toISOString();
      }
    }

    // Update Mpesa Transaction Status
    await supabaseAdmin
      .from('mpesa_transactions')
      .update({
        status: isSuccess ? 'Completed' : 'Failed',
        receipt_number: receiptNumber,
        transaction_date: transactionDate,
        raw_callback_data: data
      })
      .eq('id', transaction.id);

    // If it was a SaaS subscription payment and it succeeded, activate their subscription
    if (isSuccess && transaction.type === 'SaaS') {
      const { data: existingSub } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('tenant_id', transaction.tenant_id)
        .single();

      const newValidUntil = new Date();
      newValidUntil.setDate(newValidUntil.getDate() + 30); // Add 30 days

      if (existingSub) {
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'Active',
            amount_paid: Number(existingSub.amount_paid || 0) + Number(transaction.amount),
            valid_until: newValidUntil.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSub.id);
      } else {
        await supabaseAdmin
          .from('subscriptions')
          .insert([{
            tenant_id: transaction.tenant_id,
            status: 'Active',
            amount_paid: Number(transaction.amount),
            valid_until: newValidUntil.toISOString()
          }]);
      }
    }

    // Must return 200 OK so Safaricom knows we received the callback
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' });

  } catch (error) {
    console.error('M-Pesa Callback Error:', error);
    return NextResponse.json({ ResultCode: 1, ResultDesc: error.message }, { status: 500 });
  }
}
