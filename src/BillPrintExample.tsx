import React from 'react';
import { openBillPrint, printBillContent } from './printBill';
import type { BillData } from './printBill';

/**
 * Example component showing how to use the bill printing functionality
 */
export function BillPrintExample() {
  // Sample bill data
  const sampleBillData: BillData = {
    billNumber: 'B-2024-001234',
    tableNumber: 'T5',
    date: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }),
    time: new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    }),
    items: [
      { name: 'Cafe Latte', qty: 2, price: 5.50 },
      { name: 'Croissant', qty: 1, price: 3.50 },
      { name: 'Iced Coffee', qty: 1, price: 4.00 },
      { name: 'Chocolate Cake', qty: 2, price: 6.50 }
    ],
    discount: 10, // 10% discount
    paymentMethod: 'Credit Card'
  };

  const handlePrintBill = () => {
    // Option 1: Open bill in new tab (recommended)
    openBillPrint(sampleBillData);
    
    // Option 2: Print directly in new window
    // printBillContent(sampleBillData);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Bill Print Demo</h2>
      <button 
        onClick={handlePrintBill}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        🖨️ Print Bill
      </button>
      <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
        Click the button to open the bill in a new tab for printing
      </p>
    </div>
  );
}

export default BillPrintExample;
