# Bill Printing System Guide

This is a complete bill printing solution for the Spatial Cafe System. It includes a separate HTML template and CSS styling optimized for printing receipts.

## Files Created

- **`bill.html`** - Standalone bill template with automatic print dialog
- **`bill.css`** - Professional receipt styling with print optimization
- **`src/printBill.ts`** - Utility functions to handle bill printing
- **`src/BillPrintExample.tsx`** - Example React component showing integration

## Features

✅ Professional receipt layout
✅ Opens in new browser tab
✅ Auto-triggers print dialog
✅ Responsive design
✅ Print-optimized styling (80mm thermal receipt format)
✅ Supports discounts and tax calculations
✅ Payment method tracking
✅ Mobile-friendly

## Usage

### Option 1: Using the `openBillPrint()` function (Recommended)

```tsx
import { openBillPrint, type BillData } from './printBill';

const billData: BillData = {
  billNumber: 'B-2024-001234',
  tableNumber: 'T1',
  date: '26 Jun 2024',
  time: '10:30 AM',
  items: [
    { name: 'Cafe Latte', qty: 2, price: 5.50 },
    { name: 'Croissant', qty: 1, price: 3.50 }
  ],
  discount: 10,  // 10% discount
  paymentMethod: 'Cash'
};

// Open bill in new tab
const handlePrint = () => {
  openBillPrint(billData);
};
```

### Option 2: Using the `printBillContent()` function

This generates the bill content directly without needing the separate HTML file:

```tsx
import { printBillContent, type BillData } from './printBill';

const handlePrint = () => {
  printBillContent(billData);
};
```

## Integration with Your App

### 1. Add Print Button to Your Order Component

```tsx
import { openBillPrint, type BillData } from './printBill';

function OrderPanel({ table, orders }) {
  const handlePrintBill = () => {
    const billData: BillData = {
      billNumber: generateBillNumber(),
      tableNumber: table.name,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      items: orders.map(order => ({
        name: order.name,
        qty: order.qty,
        price: order.price
      })),
      discount: table.discount || 0,
      paymentMethod: 'Cash' // or get from user selection
    };
    
    openBillPrint(billData);
  };

  return (
    <div>
      {/* Your order details here */}
      <button onClick={handlePrintBill}>
        🖨️ Print Bill
      </button>
    </div>
  );
}
```

### 2. Add Print Button to Table Context Menu

```tsx
function TableContextMenu({ table, onPrint }) {
  return (
    <div className="context-menu">
      <button onClick={() => onPrint(table)}>Print Bill</button>
      <button>Check Out</button>
      <button>Add Tip</button>
    </div>
  );
}
```

## Data Structure

The `BillData` interface:

```typescript
interface BillData {
  billNumber: string;      // Unique bill identifier
  tableNumber: string;     // Table name/number
  date: string;            // Date string (e.g., "26 Jun 2024")
  time: string;            // Time string (e.g., "10:30 AM")
  items: {
    name: string;          // Item name
    qty: number;           // Quantity
    price: number;         // Price per item
  }[];
  discount: number;        // Discount percentage (0-100)
  paymentMethod: string;   // Payment method (Cash, Card, etc.)
}
```

## Printing Features

### Automatic Print Dialog
The bill automatically opens the print dialog when the page loads (configurable in `bill.html`).

### Print Shortcuts
- **Desktop**: `Ctrl+P` (Windows) or `Cmd+P` (Mac)
- **Mobile**: Use browser's print option

### Receipt Format
The bill is optimized for:
- **80mm thermal printers** (standard POS receipts)
- **A4 printing** (can print on regular paper too)
- **Mobile viewing** (responsive design)

### Customization

Edit `bill.html` to customize:
- Cafe name and tagline
- Contact information
- Footer message
- Currency symbol

Edit `bill.css` to customize:
- Colors and fonts
- Layout spacing
- Header/footer styling
- Print dimensions

## Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers

## Pop-up Blocker Note

If users have pop-up blockers enabled, they may see an error. Add this user-friendly message:

```tsx
const handlePrintBill = () => {
  const newWindow = window.open(billUrl, '_blank');
  if (!newWindow) {
    alert('Please disable pop-up blockers to print the bill');
  }
};
```

## Advanced: Generate Bill Number

```typescript
function generateBillNumber(): string {
  const date = new Date();
  const timestamp = date.getTime().toString().slice(-6);
  return `B-${date.getFullYear()}-${timestamp}`;
}
```

## Testing

1. Import `BillPrintExample` component in your App.tsx to test:
   ```tsx
   import BillPrintExample from './BillPrintExample';
   
   // In your App component:
   <BillPrintExample />
   ```

2. Click "Print Bill" button to open bill in new tab
3. Print or save as PDF

## Support

For issues or customization needs:
- Check browser console for errors
- Ensure `bill.html` and `bill.css` are in the project root
- Verify data format matches the `BillData` interface
