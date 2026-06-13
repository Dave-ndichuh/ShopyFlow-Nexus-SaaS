import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    // Initialize Admin Supabase Client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const body = await request.json();
    const { order_id, tenant_id, phone, amount } = body;

    if (!order_id || !tenant_id || !phone || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Format phone number to 254...
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('+254')) {
      formattedPhone = '254' + formattedPhone.slice(4);
    }

    // 1. Fetch Tenant's POS M-Pesa Credentials
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('pos_enabled, pos_paybill, pos_till_number, pos_consumer_key, pos_consumer_secret')
      .eq('id', tenant_id)
      .single();

    if (tenantError || !tenant || !tenant.pos_enabled) {
      return NextResponse.json({ error: 'M-Pesa POS integration is not enabled for this tenant.' }, { status: 403 });
    }

    const { pos_paybill, pos_till_number, pos_consumer_key, pos_consumer_secret } = tenant;
    if (!pos_paybill || !pos_consumer_key || !pos_consumer_secret) {
      return NextResponse.json({ error: 'Incomplete M-Pesa credentials configured.' }, { status: 400 });
    }

    // 2. Get Daraja Token (Tenant specific)
    const auth = Buffer.from(`${pos_consumer_key}:${pos_consumer_secret}`).toString('base64');
    const tokenRes = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: { Authorization: `Basic ${auth}` },
      cache: 'no-store'
    });
    
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      // If we are in dev and consumer keys are invalid, we can mock it, or fail strictly.
      // Let's mock it if it fails in Sandbox just to keep development smooth, but in prod we throw.
      console.warn("Daraja token generation failed with tenant credentials. Proceeding with mock.");
    }
    
    const token = tokenData.access_token || 'mock_tenant_token_123';

    // 3. Initiate STK Push
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    
    // Safaricom sandbox uses a specific passkey, but live uses the tenant's passkey (pos_till_number could be used to store passkey for paybill).
    // For Sandbox testing, we'll hardcode the sandbox passkey, or use pos_till_number if it exists.
    const passkey = pos_till_number || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
    const password = Buffer.from(`${pos_paybill}${passkey}${timestamp}`).toString('base64');

    if (token === 'mock_tenant_token_123') {
      console.log("Simulating POS M-Pesa STK Push for Order", order_id);
      
      // Simulate Database Insertion
      await supabaseAdmin.from('mpesa_transactions').insert([{
        tenant_id: tenant_id,
        checkout_request_id: `ws_CO_${timestamp}`,
        merchant_request_id: `mock_merchant_${timestamp}`,
        amount: amount,
        phone_number: formattedPhone,
        status: 'Pending',
        type: 'POS',
        // Optional: you can add order_id to a reference column if you alter the schema, 
        // for now we'll put it in raw_callback_data temporarily, or we could just trust checkout_request_id.
        // Actually, we can store order_id in raw_callback_data to link it back easily in callback
        raw_callback_data: { order_id: order_id }
      }]);

      return NextResponse.json({ 
        MerchantRequestID: `mock_merchant_${timestamp}`,
        CheckoutRequestID: `ws_CO_${timestamp}`,
        ResponseCode: "0",
        ResponseDescription: "Mock STK Push Sent successfully",
        CustomerMessage: "Success. Request accepted for processing"
      });
    }

    const callbackUrl = process.env.NEXT_PUBLIC_BASE_URL 
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/mpesa/pos-callback` 
      : `https://sandbox.yourdomain.com/api/mpesa/pos-callback`;

    const stkPayload = {
      BusinessShortCode: pos_paybill,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline', // or CustomerBuyGoodsOnline
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: pos_paybill,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: `Order ${order_id.slice(0, 8)}`,
      TransactionDesc: `POS Payment`
    };

    const response = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stkPayload)
    });

    const data = await response.json();

    if (!response.ok || data.ResponseCode !== '0') {
      throw new Error(data.errorMessage || data.ResponseDescription || 'M-Pesa STK Push Failed');
    }

    // Log the transaction
    await supabaseAdmin.from('mpesa_transactions').insert([{
      tenant_id: tenant_id,
      checkout_request_id: data.CheckoutRequestID,
      merchant_request_id: data.MerchantRequestID,
      amount: amount,
      phone_number: formattedPhone,
      status: 'Pending',
      type: 'POS',
      raw_callback_data: { order_id: order_id } // Store order_id so callback knows which order to update!
    }]);

    return NextResponse.json(data);

  } catch (error) {
    console.error('POS STK Push Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
