/**
 * Utility function to open bill in new tab for printing
 */

export interface BillData {
  billNumber: string;
  tableNumber: string;
  date: string;
  time: string;
  items: {
    name: string;
    qty: number;
    price: number;
  }[];
  discount: number;
  paymentMethod: string;
}

export function openBillPrint(billData: BillData): void {
  // Prepare bill data
  const encodedData = encodeURIComponent(JSON.stringify(billData));
  
  // Get the base URL of the application
  const baseUrl = window.location.origin;
  
  // Create the bill URL with data as query parameter
  const billUrl = `${baseUrl}/bill.html?data=${encodedData}`;
  
  // Open in new tab
  window.open(billUrl, '_blank');
}

/**
 * Alternative function if you want to generate bill content directly
 */
export function printBillContent(billData: BillData): void {
  // Create a new window
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  if (!printWindow) {
    alert('Please disable pop-up blockers to print the bill');
    return;
  }

  // Calculate totals
  let subtotal = 0;
  billData.items.forEach(item => {
    subtotal += item.price * item.qty;
  });

  const discountAmount = (subtotal * billData.discount) / 100;
  const discountedSubtotal = subtotal - discountAmount;
  const tax = discountedSubtotal * 0.10;
  const total = discountedSubtotal + tax;

  // Create HTML content
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bill Receipt - Spatial Cafe System</title>
        <link rel="stylesheet" href="${window.location.origin}/bill.css">
    </head>
    <body>
        <div class="bill-container">
            <div class="bill-wrapper">
                <div class="bill-header">
                    <h1 class="cafe-name">SPATIAL CAFE</h1>
                    <p class="cafe-tagline">Quality Coffee & Pastries</p>
                    <hr class="divider">
                </div>

                <div class="bill-info">
                    <div class="info-row">
                        <span class="label">Bill #:</span>
                        <span class="value">${billData.billNumber}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Table:</span>
                        <span class="value">${billData.tableNumber}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Date:</span>
                        <span class="value">${billData.date}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Time:</span>
                        <span class="value">${billData.time}</span>
                    </div>
                </div>

                <hr class="divider">

                <table class="items-table">
                    <thead>
                        <tr>
                            <th class="col-item">Item</th>
                            <th class="col-qty">Qty</th>
                            <th class="col-price">Price</th>
                            <th class="col-total">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${billData.items.map(item => `
                            <tr>
                                <td class="col-item">${item.name}</td>
                                <td class="col-qty">${item.qty}</td>
                                <td class="col-price">Rs. ${item.price.toFixed(2)}</td>
                                <td class="col-total">Rs. ${(item.price * item.qty).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <hr class="divider">

                <div class="bill-summary">
                    <div class="summary-row">
                        <span class="label">Subtotal:</span>
                        <span class="value">Rs. ${subtotal.toFixed(2)}</span>
                    </div>
                    ${billData.discount > 0 ? `
                        <div class="summary-row">
                            <span class="label">Discount (${billData.discount}%):</span>
                            <span class="value discount">-Rs. ${discountAmount.toFixed(2)}</span>
                        </div>
                    ` : ''}
                    <div class="summary-row">
                        <span class="label">Tax (10%):</span>
                        <span class="value">Rs. ${tax.toFixed(2)}</span>
                    </div>
                    <div class="summary-row total-row">
                        <span class="label">Total:</span>
                        <span class="value total-amount">Rs. ${total.toFixed(2)}</span>
                    </div>
                </div>

                <hr class="divider">

                <div class="payment-method">
                    <div class="info-row">
                        <span class="label">Payment Method:</span>
                        <span class="value">${billData.paymentMethod}</span>
                    </div>
                </div>

                <div class="bill-footer">
                    <p>Thank you for your visit!</p>
                    <p class="footer-text">Please visit again</p>
                    <p class="footer-text contact">+1 (234) 567-8900 | www.spatialcafe.com</p>
                </div>

                <div class="print-instructions">
                    <p>📄 Use Ctrl+P or Cmd+P to print this bill</p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;

  // Write content to the new window
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Open print dialog after content loads
  printWindow.addEventListener('load', () => {
    setTimeout(() => {
      printWindow.print();
    }, 500);
  });
}
