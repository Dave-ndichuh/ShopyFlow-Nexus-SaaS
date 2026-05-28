import React from 'react';

export default function Receipt({ transaction, cart, subtotal, vat, grandTotal }) {
  if (!transaction) return null;

  return (
    <div className="receipt-print-area" style={{ display: 'none', background: 'white', color: 'black', width: '300px', padding: '20px', fontFamily: 'monospace' }}>
      <div style={{ textAlign: 'center', borderBottom: '1px dashed black', paddingBottom: '10px', marginBottom: '10px' }}>
        <h2 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>AUTO SPARES PRO</h2>
        <p style={{ margin: 0, fontSize: '12px' }}>Nairobi, Kenya</p>
        <p style={{ margin: 0, fontSize: '12px' }}>Tel: +254 700 000 000</p>
      </div>

      <div style={{ fontSize: '12px', marginBottom: '10px' }}>
        <p style={{ margin: '2px 0' }}><strong>Receipt #:</strong> TRX-{transaction.TRANS_ID}</p>
        <p style={{ margin: '2px 0' }}><strong>Date:</strong> {new Date().toLocaleString()}</p>
        <p style={{ margin: '2px 0' }}><strong>Cashier:</strong> Admin</p>
        <p style={{ margin: '2px 0' }}><strong>Payment:</strong> {transaction.PAYMENT_METHOD}</p>
      </div>

      <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', marginBottom: '10px' }}>
        <thead>
          <tr style={{ borderBottom: '1px dashed black' }}>
            <th style={{ textAlign: 'left', paddingBottom: '5px' }}>Item</th>
            <th style={{ textAlign: 'center', paddingBottom: '5px' }}>Qty</th>
            <th style={{ textAlign: 'right', paddingBottom: '5px' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item, idx) => (
            <tr key={idx}>
              <td style={{ padding: '5px 0' }}>{item.NAME}</td>
              <td style={{ textAlign: 'center' }}>{item.quantity}</td>
              <td style={{ textAlign: 'right' }}>{(item.PRICE * item.quantity).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ fontSize: '12px', borderTop: '1px dashed black', paddingTop: '10px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span>Subtotal:</span>
          <span>Ksh {subtotal.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span>VAT (16%):</span>
          <span>Ksh {vat.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '5px' }}>
          <span>Total:</span>
          <span>Ksh {grandTotal.toLocaleString()}</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '12px' }}>
        <p style={{ margin: 0 }}>Thank you for your business!</p>
        <p style={{ margin: '5px 0 0 0' }}>Goods once sold are not returnable.</p>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-print-area, .receipt-print-area * {
            visibility: visible;
            display: block !important;
          }
          .receipt-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
