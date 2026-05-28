import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { phone, amount } = await req.json();

    if (!phone || !amount) {
      return NextResponse.json({ error: 'Phone and amount are required' }, { status: 400 });
    }

    // --- M-PESA DARAJA CREDENTIALS ---
    // In production, these should be in .env.local
    const consumerKey = process.env.MPESA_CONSUMER_KEY || 'YOUR_CONSUMER_KEY';
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET || 'YOUR_CONSUMER_SECRET';
    const passkey = process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
    const shortcode = process.env.MPESA_SHORTCODE || '174379';
    
    // 1. Generate Auth Token
    const authString = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    // Note: To test in sandbox, you need real sandbox keys. If keys are placeholder, we return a mock success
    // so the POS UI can continue without crashing during development.
    if (consumerKey === 'YOUR_CONSUMER_KEY') {
      console.warn('M-Pesa API keys are not set. Simulating successful STK Push for local dev.');
      return NextResponse.json({
        ResponseCode: "0",
        CustomerMessage: "Success. Request accepted for processing (SIMULATED)",
        CheckoutRequestID: `ws_CO_${Date.now()}`
      });
    }

    const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${authString}`
      }
    });
    
    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      throw new Error('Failed to generate M-Pesa token');
    }

    const accessToken = tokenData.access_token;

    // 2. Generate Password
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14); // YYYYMMDDHHmmss
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    // 3. Initiate STK Push
    // Format phone: Safaricom expects 2547...
    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.slice(1);
    if (formattedPhone.startsWith('+')) formattedPhone = formattedPhone.slice(1);

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount), // Safaricom expects integer amounts
      PartyA: formattedPhone, // Customer phone
      PartyB: shortcode,
      PhoneNumber: formattedPhone, // Customer phone
      CallBackURL: process.env.MPESA_CALLBACK_URL || "https://mydomain.com/path",
      AccountReference: "AutoSparesPOS",
      TransactionDesc: "Payment for Auto Parts"
    };

    const stkResponse = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const stkData = await stkResponse.json();
    return NextResponse.json(stkData);

  } catch (error) {
    console.error('M-Pesa Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
