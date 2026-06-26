export type TableStatus = 'Available' | 'Reserved' | 'Occupied' | 'Cleaning' | 'Disabled';

export interface OrderItem {
  orderId?: number;
  itemId: string;
  name: string;
  qty: number;
  price: number;
  notes: string;
  addedAt: string;
}

export interface Table {
  id: string;
  name: string;
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
  capacity: number;
  status: TableStatus;
  orders: OrderItem[];
  discount: number;
}

export interface Floor {
  id: string;
  name: string;
  rows: number;
  cols: number;
  tables: Table[];
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}
