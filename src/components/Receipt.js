import React from 'react';

export default function Receipt({ transaction, cart, subtotal, vat, grandTotal, tenant }) {
  if (!transaction) return null;

  // Extract dynamic metadata
  const trxDate = transaction.created_at ? new Date(transaction.created_at) : new Date();
  const dateStr = trxDate.toLocaleDateString();
  const timeStr = trxDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const cashierId = transaction.user_id ? `User-${transaction.user_id.split('-')[0]}` : 'Admin';
  
  const paymentMethod = transaction.payment_method || 'Cash';
  const cashAmt = Number(transaction.amount_paid) || 0;
  
  const discountAmt = Number(transaction.discount_total) || 0;
  
  const isCredit = transaction.payment_status === 'unpaid';

  return (
    <div className="receipt-print-area">
      {/* 1. Brand & Header Block */}
      <div className="receipt-header">
        <h2 className="receipt-store-name">{tenant?.name || 'Nexus SaaS'}</h2>
        <p className="receipt-store-meta">Powered by Nexus</p>
      </div>

      <div className="receipt-divider" />

      {/* 2. Metadata Block */}
      <div className="receipt-meta">
        <div className="meta-row">
          <span>Receipt #:</span>
          <span className="meta-val">TRX-{transaction.TRANS_ID}</span>
        </div>
        <div className="meta-row">
          <span>Date:</span>
          <span className="meta-val">{dateStr} {timeStr}</span>
        </div>
        <div className="meta-row">
          <span>Cashier:</span>
          <span className="meta-val">{cashierId}</span>
        </div>
        <div className="meta-row">
          <span>Payment:</span>
          <span className="meta-val">{paymentMethod}</span>
        </div>
        {isCredit && creditDueDate && (
          <div className="meta-row">
            <span>Due Date:</span>
            <span className="meta-val">{new Date(creditDueDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <div className="receipt-divider" />

      {/* 3. Items Block */}
      <table className="receipt-items">
        <thead>
          <tr>
            <th className="col-item">Item</th>
            <th className="col-qty">Qty</th>
            <th className="col-total">Total</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item, idx) => (
            <tr key={idx} className="item-row">
              <td className="col-item">{item.NAME}</td>
              <td className="col-qty">{item.quantity}</td>
              <td className="col-total">{(item.PRICE * item.quantity).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="receipt-divider" />

      {/* 4. Totals Block */}
      <div className="receipt-totals">
        <div className="total-row">
          <span>Subtotal</span>
          <span>{subtotal.toLocaleString()}</span>
        </div>

        {discountAmt !== 0 && (
          <div className="total-row">
            <span>{discountAmt > 0 ? 'Discount' : 'Surcharge'}</span>
            <span>{discountAmt > 0 ? '-' : '+'} {Math.abs(discountAmt).toLocaleString()}</span>
          </div>
        )}

        {vat > 0 && (
          <div className="total-row">
            <span>VAT</span>
            <span>{vat.toLocaleString()}</span>
          </div>
        )}

        <div className="total-row grand-total">
          <span>TOTAL</span>
          <span>Ksh {grandTotal.toLocaleString()}</span>
        </div>
      </div>

      {/* Optional Split Payment Details */}
      {paymentMethod === 'Hybrid' && (
        <div className="receipt-hybrid">
          <div className="receipt-divider" />
          <div className="meta-row">
            <span>Paid via Cash:</span>
            <span>{cashAmt.toLocaleString()}</span>
          </div>
          <div className="meta-row">
            <span>Paid via M-Pesa:</span>
            <span>{mpesaAmt.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* 5. Footer Block */}
      <div className="receipt-footer">
        <p>Thank you for your business!</p>
        <p>Goods once sold are not returnable.</p>
        <p className="receipt-signature">www.jobeaauto.co.ke</p>
      </div>

    </div>
  );
}
