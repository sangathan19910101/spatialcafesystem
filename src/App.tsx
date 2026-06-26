import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MENU_ITEMS } from './data';
import { openBillPrint, type BillData } from './printBill';
import type { Floor, MenuItem, OrderItem, Table, TableStatus } from './types';

const statusColors: Record<TableStatus, string> = {
  Available: '#84cc16',
  Reserved: '#eab308',
  Occupied: '#dc2626',
  Cleaning: '#f59e0b',
  Disabled: '#6b7280'
};

const defaultFloors: Floor[] = [
  {
    id: 'floor-1',
    name: 'Main Floor',
    rows: 6,
    cols: 10,
    tables: [
      {
        id: 'table-1',
        name: 'T1',
        row: 0,
        col: 0,
        rowSpan: 1,
        colSpan: 2,
        capacity: 4,
        status: 'Available',
        orders: [],
        discount: 0
      },
      {
        id: 'table-2',
        name: 'T2',
        row: 2,
        col: 3,
        rowSpan: 1,
        colSpan: 2,
        capacity: 4,
        status: 'Reserved',
        orders: [
          {
            orderId: 1,
            itemId: 'latte',
            name: 'Cafe Latte',
            qty: 1,
            price: 5.5,
            notes: '',
            addedAt: new Date().toISOString()
          }
        ],
        discount: 0
      }
    ]
  }
];

const taxRate = 0.08;

interface DragState {
  tableId: string;
  offsetX: number;
  offsetY: number;
}

function App() {
  const apiBase = import.meta.env.VITE_API_BASE ?? '/api';
  const formatCurrency = (v: number) => `Rs. ${v.toFixed(2)}`;
  const [floors, setFloors] = useState<Floor[]>(defaultFloors);
  const [activeFloorId, setActiveFloorId] = useState(defaultFloors[0].id);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [newTableName, setNewTableName] = useState('T3');
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [newTableRow, setNewTableRow] = useState(0);
  const [newTableCol, setNewTableCol] = useState(0);
  const [newOrderName, setNewOrderName] = useState('');
  const [newOrderPrice, setNewOrderPrice] = useState(0);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS);
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuPrice, setNewMenuPrice] = useState(0);
  const [newMenuCategory, setNewMenuCategory] = useState('Beverage');
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const currentFloor = floors.find((floor) => floor.id === activeFloorId) ?? floors[0];

  const fetchJson = async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(`${apiBase}${path}`, init);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${response.status} ${response.statusText}: ${text}`);
    }
    return response.json();
  };

  const transformOrder = (order: any): OrderItem => ({
    orderId: order.id,
    itemId: order.menu_item_id ?? `custom-${order.id}`,
    name: order.name,
    qty: order.qty,
    price: order.price,
    notes: order.notes ?? '',
    addedAt: order.added_at
  });

  const transformTable = (table: any): Table => ({
    id: table.id,
    name: table.name,
    row: table.row,
    col: table.col,
    rowSpan: table.row_span,
    colSpan: table.col_span,
    capacity: table.capacity,
    status: table.status as TableStatus,
    discount: table.discount ?? 0,
    orders: (table.orders ?? []).map(transformOrder)
  });

  const transformFloor = (floor: any): Floor => ({
    id: floor.id,
    name: floor.name,
    rows: floor.rows,
    cols: floor.cols,
    tables: (floor.tables ?? []).map(transformTable)
  });

  const loadAppData = async () => {
    try {
      const [menuResponse, floorsResponse, tablesResponse, ordersResponse] = await Promise.all([
        fetchJson<MenuItem[]>('/menu-items'),
        fetchJson<any[]>('/floors'),
        fetchJson<any[]>('/tables'),
        fetchJson<any[]>('/orders')
      ]);
      setMenuItems(menuResponse);
      
      // Map orders to tables
      const ordersByTable = ordersResponse.reduce((acc, order) => {
        if (!acc[order.table_id]) acc[order.table_id] = [];
        acc[order.table_id].push(transformOrder(order));
        return acc;
      }, {} as Record<string, OrderItem[]>);
      
      // Map tables to floors and add orders
      const tablesByFloor = tablesResponse.reduce((acc, table) => {
        if (!acc[table.floor_id]) acc[table.floor_id] = [];
        acc[table.floor_id].push({
          ...transformTable(table),
          orders: ordersByTable[table.id] || []
        });
        return acc;
      }, {} as Record<string, Table[]>);
      
      const parsedFloors = floorsResponse.map(floor => ({
        ...transformFloor(floor),
        tables: tablesByFloor[floor.id] || []
      }));
      
      if (parsedFloors.length > 0) {
        setFloors(parsedFloors);
        if (!parsedFloors.some((floor) => floor.id === activeFloorId)) {
          setActiveFloorId(parsedFloors[0].id);
          setSelectedTableId(null);
        }
      }
    } catch (error) {
      console.error('Failed to load backend data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppData();
  }, []);

  const updateFloor = (update: Partial<Floor>) => {
    setFloors((prev) => prev.map((floor) => (floor.id === activeFloorId ? { ...floor, ...update } : floor)));
  };

  const setFloorTables = (tables: Table[]) => updateFloor({ tables });

  const getTableAt = (row: number, col: number) => currentFloor.tables.find((table) => {
    return row >= table.row && row < table.row + table.rowSpan && col >= table.col && col < table.col + table.colSpan;
  });

  const serializeTableUpdate = (partial: Partial<Table>) => {
    const payload: Record<string, unknown> = {};
    if (partial.name !== undefined) payload.name = partial.name;
    if (partial.row !== undefined) payload.row = partial.row;
    if (partial.col !== undefined) payload.col = partial.col;
    if (partial.rowSpan !== undefined) payload.row_span = partial.rowSpan;
    if (partial.colSpan !== undefined) payload.col_span = partial.colSpan;
    if (partial.capacity !== undefined) payload.capacity = partial.capacity;
    if (partial.status !== undefined) payload.status = partial.status;
    if (partial.discount !== undefined) payload.discount = partial.discount;
    return payload;
  };

  const patchTableBackend = async (tableId: string, partial: Partial<Table>) => {
    const payload = serializeTableUpdate(partial);
    if (Object.keys(payload).length === 0) return;
    await fetchJson(`/tables/${tableId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  };

  const serializeOrderUpdate = (partial: Partial<OrderItem>) => {
    const payload: Record<string, unknown> = {};
    if (partial.qty !== undefined) payload.qty = partial.qty;
    if (partial.notes !== undefined) payload.notes = partial.notes;
    return payload;
  };

  const patchOrderBackend = async (orderId: number, partial: Partial<OrderItem>) => {
    const payload = serializeOrderUpdate(partial);
    if (Object.keys(payload).length === 0) return;
    await fetchJson(`/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  };

  const deleteOrderBackend = async (orderId: number) => {
    await fetchJson(`/orders/${orderId}`, { method: 'DELETE' });
  };

  const deleteTableOrdersBackend = async (tableId: string) => {
    await fetchJson(`/tables/${tableId}/orders`, { method: 'DELETE' });
  };

  const addTable = async (row: number, col: number) => {
    const payload = {
      name: newTableName || `T${currentFloor.tables.length + 1}`,
      floor_id: activeFloorId,
      row,
      col,
      row_span: 1,
      col_span: 2,
      capacity: newTableCapacity,
      status: 'Available',
      discount: 0
    };
    try {
      const created = await fetchJson<any>('/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setFloorTables([...currentFloor.tables, transformTable(created)]);
      setSelectedTableId(created.id);
      setNewTableName(`T${currentFloor.tables.length + 2}`);
    } catch (error) {
      console.error('Add table failed:', error);
    }
  };

  const isCellAvailable = (row: number, col: number) => {
    return row >= 0 && row < currentFloor.rows && col >= 0 && col < currentFloor.cols && !getTableAt(row, col);
  };

  const addTableAtPosition = () => {
    if (!isCellAvailable(newTableRow, newTableCol)) return;
    void addTable(newTableRow, newTableCol);
  };

  const removeTable = async (tableId: string) => {
    setFloorTables(currentFloor.tables.filter((table) => table.id !== tableId));
    if (selectedTableId === tableId) {
      setSelectedTableId(null);
    }
    try {
      await fetchJson(`/tables/${tableId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Delete table failed:', error);
    }
  };

  const removeFloor = async () => {
    if (floors.length <= 1) return;
    const nextFloorId = floors.find((floor) => floor.id !== activeFloorId)?.id ?? floors[0].id;
    setFloors((prev) => prev.filter((floor) => floor.id !== activeFloorId));
    setActiveFloorId(nextFloorId);
    setSelectedTableId(null);
    try {
      await fetchJson(`/floors/${activeFloorId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Delete floor failed:', error);
    }
  };

  const moveTable = (tableId: string, row: number, col: number) => {
    updateTable(tableId, { row, col });
    void patchTableBackend(tableId, { row, col });
  };

  const resizeTable = (tableId: string, deltaRows: number, deltaCols: number) => {
    const table = currentFloor.tables.find((item) => item.id === tableId);
    if (!table) return;
    const rowSpan = Math.max(1, Math.min(currentFloor.rows - table.row, table.rowSpan + deltaRows));
    const colSpan = Math.max(1, Math.min(currentFloor.cols - table.col, table.colSpan + deltaCols));
    updateTable(tableId, { rowSpan, colSpan });
    void patchTableBackend(tableId, { rowSpan, colSpan });
  };

  const updateTable = (tableId: string, partial: Partial<Table>) => {
    setFloorTables(currentFloor.tables.map((table) => (table.id === tableId ? { ...table, ...partial } : table)));
    void patchTableBackend(tableId, partial);
  };

  const addOrderItem = async (tableId: string, itemId: string) => {
    const item = menuItems.find((menu) => menu.id === itemId);
    if (!item) return;
    const table = currentFloor.tables.find((itemTable) => itemTable.id === tableId);
    if (!table) return;

    const existing = table.orders.find((order) => order.itemId === itemId && order.notes === '');
    if (existing?.orderId) {
      const updatedQty = existing.qty + 1;
      setFloorTables(
        currentFloor.tables.map((tableRow) => {
          if (tableRow.id !== tableId) return tableRow;
          return {
            ...tableRow,
            orders: tableRow.orders.map((orderRow) =>
              orderRow.orderId === existing.orderId ? { ...orderRow, qty: updatedQty } : orderRow
            )
          };
        })
      );
      void patchOrderBackend(existing.orderId, { qty: updatedQty });
      return;
    }

    try {
      const newOrder = await fetchJson<any>('/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_id: tableId,
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          qty: 1,
          notes: ''
        })
      });
      const createdOrder = transformOrder(newOrder);
      setFloorTables(
        currentFloor.tables.map((tableRow) =>
          tableRow.id === tableId ? { ...tableRow, orders: [...tableRow.orders, createdOrder] } : tableRow
        )
      );
    } catch (error) {
      console.error('Add order failed:', error);
    }
  };

  const updateOrderQty = async (tableId: string, orderId: number | undefined, qty: number) => {
    if (orderId == null) return;
    if (qty <= 0) {
      await removeOrderItem(tableId, orderId);
      return;
    }
    setFloorTables(
      currentFloor.tables.map((tableRow) =>
        tableRow.id === tableId
          ? { ...tableRow, orders: tableRow.orders.map((orderRow) => (orderRow.orderId === orderId ? { ...orderRow, qty } : orderRow)) }
          : tableRow
      )
    );
    void patchOrderBackend(orderId, { qty });
  };

  const updateOrderNotes = async (tableId: string, orderId: number | undefined, notes: string) => {
    if (orderId == null) return;
    setFloorTables(
      currentFloor.tables.map((tableRow) =>
        tableRow.id === tableId
          ? { ...tableRow, orders: tableRow.orders.map((orderRow) => (orderRow.orderId === orderId ? { ...orderRow, notes } : orderRow)) }
          : tableRow
      )
    );
    void patchOrderBackend(orderId, { notes });
  };

  const removeOrderItem = async (tableId: string, orderId: number | undefined) => {
    if (orderId == null) return;
    setFloorTables(
      currentFloor.tables.map((tableRow) =>
        tableRow.id === tableId
          ? { ...tableRow, orders: tableRow.orders.filter((orderRow) => orderRow.orderId !== orderId) }
          : tableRow
      )
    );
    await deleteOrderBackend(orderId);
  };

  const addCustomOrderItem = async (tableId: string) => {
    const name = newOrderName.trim();
    if (!name || newOrderPrice <= 0) return;
    try {
      const newOrder = await fetchJson<any>('/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_id: tableId,
          menu_item_id: null,
          name,
          price: newOrderPrice,
          qty: 1,
          notes: ''
        })
      });
      setFloorTables(
        currentFloor.tables.map((tableRow) =>
          tableRow.id === tableId
            ? { ...tableRow, orders: [...tableRow.orders, transformOrder(newOrder)] }
            : tableRow
        )
      );
      setNewOrderName('');
      setNewOrderPrice(0);
      setSelectedTableId(tableId);
    } catch (error) {
      console.error('Add custom order failed:', error);
    }
  };

  const clearTableOrders = async (tableId: string) => {
    updateTable(tableId, { orders: [] });
    await deleteTableOrdersBackend(tableId);
  };

  const addMenuItem = async () => {
    const name = newMenuName.trim();
    if (!name || newMenuPrice <= 0) return;
    try {
      const newItem = await fetchJson<MenuItem>('/menu-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category: newMenuCategory, price: newMenuPrice })
      });
      setMenuItems((prev) => [...prev, newItem]);
      setNewMenuName('');
      setNewMenuPrice(0);
    } catch (error) {
      console.error('Add menu item failed:', error);
    }
  };

  const removeMenuItem = async (itemId: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== itemId));
    try {
      await fetchJson(`/menu-items/${itemId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Delete menu item failed:', error);
    }
  };

  const handleAddFloor = async () => {
    try {
      const newFloor = await fetchJson<any>('/floors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `Floor ${floors.length + 1}`, rows: 6, cols: 10 })
      });
      const parsed = transformFloor(newFloor);
      setFloors((prev) => [...prev, parsed]);
      setActiveFloorId(parsed.id);
      setSelectedTableId(null);
    } catch (error) {
      console.error('Create floor failed:', error);
    }
  };

  const handleGridUpdate = (key: 'rows' | 'cols', value: number) => {
    const adjusted = Math.max(3, Math.min(12, value));
    updateFloor({ [key]: adjusted } as Partial<Floor>);
  };

  const selectedTable = currentFloor.tables.find((table) => table.id === selectedTableId) ?? null;

  const analytics = useMemo(() => {
    const allOrders = floors.flatMap((floor) => floor.tables.flatMap((table) => table.orders.map((order) => ({ floor, table, order }))));
    const revenue = allOrders.reduce((sum, { order }) => sum + order.price * order.qty, 0);
    const tableSales = floors
      .flatMap((floor) => floor.tables.map((table) => ({ table, orders: table.orders })))
      .map(({ table, orders }) => ({ table, totalItems: orders.reduce((count, order) => count + order.qty, 0), revenue: orders.reduce((sum, order) => sum + order.price * order.qty, 0) }));
    const busiest = [...tableSales].sort((a, b) => b.totalItems - a.totalItems).slice(0, 3);
    const itemCounts = allOrders.reduce<Record<string, number>>((acc, { order }) => {
      acc[order.name] = (acc[order.name] || 0) + order.qty;
      return acc;
    }, {});
    const mostOrdered = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    const hoursCount = allOrders.reduce<Record<string, number>>((acc, { order }) => {
      const hour = new Date(order.addedAt).getHours();
      const label = `${hour.toString().padStart(2, '0')}:00`;
      acc[label] = (acc[label] || 0) + order.qty;
      return acc;
    }, {});
    const peakHours = Object.entries(hoursCount).sort((a, b) => b[1] - a[1]).slice(0, 3);
    return {
      revenue,
      busiest,
      mostOrdered,
      peakHours
    };
  }, [floors]);

  useEffect(() => {
    if (!dragState || !containerRef.current) return;
    const handleMove = (event: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const table = currentFloor.tables.find((entry) => entry.id === dragState.tableId);
      if (!table) return;
      const x = event.clientX - rect.left - dragState.offsetX;
      const y = event.clientY - rect.top - dragState.offsetY;
      const nextCol = Math.max(0, Math.min(currentFloor.cols - table.colSpan, Math.floor((x / rect.width) * currentFloor.cols + 0.5)));
      const nextRow = Math.max(0, Math.min(currentFloor.rows - table.rowSpan, Math.floor((y / rect.height) * currentFloor.rows + 0.5)));
      if (nextRow !== table.row || nextCol !== table.col) {
        moveTable(table.id, nextRow, nextCol);
      }
    };
    const handleUp = () => setDragState(null);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragState, currentFloor, moveTable]);

  const handleTablePointerDown = (event: React.PointerEvent<HTMLDivElement>, table: Table) => {
    event.stopPropagation();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const offsetX = event.clientX - rect.left - (table.col / currentFloor.cols) * rect.width;
    const offsetY = event.clientY - rect.top - (table.row / currentFloor.rows) * rect.height;
    setDragState({ tableId: table.id, offsetX, offsetY });
  };

  const handlePrintBill = (table: Table) => {
    if (table.orders.length === 0) {
      alert('No orders to print');
      return;
    }

    // Generate unique bill number
    const billNumber = `B-${Date.now().toString().slice(-6)}`;
    
    // Calculate totals
    let subtotal = 0;
    table.orders.forEach(order => {
      subtotal += order.price * order.qty;
    });

    const discountPercent = table.discount > 0 ? Math.round((table.discount / (subtotal + subtotal * taxRate)) * 100) : 0;
    const discountedSubtotal = subtotal - table.discount;
    const billTax = discountedSubtotal * taxRate;
    const total = discountedSubtotal + billTax;

    // Prepare bill data
    const billData: BillData = {
      billNumber,
      tableNumber: table.name,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      items: table.orders.map(order => ({
        name: order.name,
        qty: order.qty,
        price: order.price
      })),
      discount: discountPercent,
      paymentMethod: 'Cash'
    };

    // Open bill in new tab
    openBillPrint(billData);
  };

  const subtotal = selectedTable ? selectedTable.orders.reduce((sum, item) => sum + item.price * item.qty, 0) : 0;
  const tax = subtotal * taxRate;
  const discount = selectedTable ? selectedTable.discount : 0;
  const grandTotal = Math.max(0, subtotal + tax - discount);

  if (isLoading) {
    return (
      <div className="app-shell">
        <header className="topbar">
          <div>
            <h1>Spatial Cafe System</h1>
            <p>Loading data from backend...</p>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>Spatial Cafe System</h1>
          <p>Design floors, manage tables, orders, billing, and analytics.</p>
        </div>
        <div className="status-pill">Live status updates included</div>
      </header>

      <div className="layout-shell">
        <aside className="sidebar left-sidebar">
          <section>
            <h2>Floors</h2>
            <div className="floor-list">
              {floors.map((floor) => (
                <button
                  key={floor.id}
                  className={floor.id === activeFloorId ? 'active' : ''}
                  onClick={() => {
                    setActiveFloorId(floor.id);
                    setSelectedTableId(null);
                  }}
                >
                  {floor.name}
                </button>
              ))}
            </div>
            <button className="primary-button add-floor-btn" onClick={handleAddFloor}>Add Floor</button>
            <button className="primary-button" onClick={removeFloor} disabled={floors.length <= 1} style={{ marginTop: '10px', background: '#ef4444' }}>
              Remove Current Floor
            </button>
          </section>

          <section>
            <h2>Layout</h2>
            <div className="control-row">
              <label>
                Rows
                <input
                  type="number"
                  min={3}
                  max={12}
                  value={currentFloor.rows}
                  onChange={(event) => handleGridUpdate('rows', Number(event.target.value))}
                />
              </label>
              <label>
                Columns
                <input
                  type="number"
                  min={4}
                  max={14}
                  value={currentFloor.cols}
                  onChange={(event) => handleGridUpdate('cols', Number(event.target.value))}
                />
              </label>
            </div>
            <div className="control-row">
              <label>
                Row
                <input
                  type="number"
                  min={0}
                  max={currentFloor.rows - 1}
                  value={newTableRow}
                  onChange={(event) => setNewTableRow(Number(event.target.value))}
                />
              </label>
              <label>
                Column
                <input
                  type="number"
                  min={0}
                  max={currentFloor.cols - 1}
                  value={newTableCol}
                  onChange={(event) => setNewTableCol(Number(event.target.value))}
                />
              </label>
            </div>
            <button className="primary-button" onClick={addTableAtPosition} disabled={!isCellAvailable(newTableRow, newTableCol)}>
              Add Table
            </button>
          </section>

          <section>
            <h2>New Table</h2>
            <label>
              Table name
              <input value={newTableName} onChange={(event) => setNewTableName(event.target.value)} />
            </label>
            <label>
              Capacity
              <input
                type="number"
                min={1}
                max={12}
                value={newTableCapacity}
                onChange={(event) => setNewTableCapacity(Number(event.target.value))}
              />
            </label>
            <p className="hint">Add a new table by selecting row/column and clicking Add Table.</p>
          </section>

          <section>
            <h2>Menu Management</h2>
            <label>
              Item name
              <input
                value={newMenuName}
                onChange={(event) => setNewMenuName(event.target.value)}
                placeholder="New product"
              />
            </label>
            <label>
              Price
              <input
                type="number"
                min={0.01}
                step={0.01}
                value={newMenuPrice}
                onChange={(event) => setNewMenuPrice(Number(event.target.value))}
              />
            </label>
            <label>
              Category
              <input
                value={newMenuCategory}
                onChange={(event) => setNewMenuCategory(event.target.value)}
              />
            </label>
            <button
              className="primary-button"
              onClick={addMenuItem}
              disabled={!newMenuName.trim() || newMenuPrice <= 0}
            >
              Add Menu Item
            </button>
            <div className="menu-items-list">
              {menuItems.map((item) => (
                <div key={item.id} className="status-row">
                  <div>
                    <strong>{item.name}</strong>
                    <div>{formatCurrency(item.price)} · {item.category}</div>
                  </div>
                  <button className="danger-button" onClick={() => removeMenuItem(item.id)}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <main className="workspace">
          <div className="floor-header">
            <h2>{currentFloor.name}</h2>
            <div>{currentFloor.rows} rows × {currentFloor.cols} columns</div>
          </div>

          <div className="grid-pane">
            <div
              className="layout-grid"
              ref={containerRef}
              style={{
                gridTemplateColumns: `repeat(${currentFloor.cols}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${currentFloor.rows}, minmax(0, 1fr))`
              }}
            >
              {Array.from({ length: currentFloor.rows * currentFloor.cols }).map((_, index) => {
                const row = Math.floor(index / currentFloor.cols);
                const col = index % currentFloor.cols;
                return <div key={`${row}-${col}`} className="grid-cell" data-row={row} data-col={col} />;
              })}
              {currentFloor.tables.map((table) => {
                const top = (table.row / currentFloor.rows) * 100;
                const left = (table.col / currentFloor.cols) * 100;
                const width = (table.colSpan / currentFloor.cols) * 100;
                const height = (table.rowSpan / currentFloor.rows) * 100;
                return (
                  <div
                    key={table.id}
                    className={`table-card ${table.id === selectedTableId ? 'selected' : ''}`}
                    style={{
                      top: `calc(${top}% + 1px)`,
                      left: `calc(${left}% + 1px)`,
                      width: `calc(${width}% - 2px)`,
                      height: `calc(${height}% - 2px)`
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedTableId(table.id);
                    }}
                  >
                    <div
                      className="table-handle"
                      onPointerDown={(event) => handleTablePointerDown(event, table)}
                    >
                      ↕↔
                    </div>
                    <div className="table-label">
                      <strong>{table.name}</strong>
                      <span>{table.capacity} seats</span>
                    </div>
                    <div className="table-status" style={{ background: statusColors[table.status] }}>
                      {table.status}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="hint">Drag a table by the handle, then click to edit orders or status.</p>
          </div>
        </main>

        <aside className="sidebar right-sidebar">
              {selectedTable ? (
            <section>
              <h2>Table {selectedTable.name}</h2>
              <div className="detail-grid">
                <label>
                  Name
                  <input
                    value={selectedTable.name}
                    onChange={(event) => updateTable(selectedTable.id, { name: event.target.value })}
                  />
                </label>
                <label>
                  Capacity
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={selectedTable.capacity}
                    onChange={(event) => updateTable(selectedTable.id, { capacity: Number(event.target.value) })}
                  />
                </label>
                <label>
                  Status
                  <select
                    value={selectedTable.status}
                    onChange={(event) => updateTable(selectedTable.id, { status: event.target.value as TableStatus })}
                  >
                    {Object.keys(statusColors).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="control-row">
                <button onClick={() => resizeTable(selectedTable.id, 0, 1)}>Wider</button>
                <button onClick={() => resizeTable(selectedTable.id, 0, -1)}>Narrower</button>
                <button onClick={() => resizeTable(selectedTable.id, 1, 0)}>Taller</button>
                <button onClick={() => resizeTable(selectedTable.id, -1, 0)}>Shorter</button>
              </div>
              <div className="control-row">
                <button className="danger-button" onClick={() => removeTable(selectedTable.id)}>
                  Delete Table
                </button>
              </div>

              <div className="printable-receipt">
              <section>
                <h3>Order</h3>
                <div className="menu-list">
                  {menuItems.map((item) => (
                    <button key={item.id} onClick={() => addOrderItem(selectedTable.id, item.id)}>
                      + {item.name} ({formatCurrency(item.price)})
                    </button>
                  ))}
                </div>
                <section className="custom-order-form">
                  <h4>Add custom dish / drink</h4>
                  <label>
                    Product name
                    <input
                      type="text"
                      value={newOrderName}
                      onChange={(event) => setNewOrderName(event.target.value)}
                      placeholder="e.g. Avocado Toast"
                    />
                  </label>
                  <label>
                    Amount
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={newOrderPrice}
                      onChange={(event) => setNewOrderPrice(Number(event.target.value))}
                    />
                  </label>
                  <button
                    className="primary-button"
                    onClick={() => addCustomOrderItem(selectedTable.id)}
                    disabled={!newOrderName.trim() || newOrderPrice <= 0}
                  >
                    Add to Order
                  </button>
                </section>
                <div className="control-row">
                  <button className="danger-button" onClick={() => clearTableOrders(selectedTable.id)}>
                    Clear All Orders
                  </button>
                </div>
                {selectedTable.orders.length === 0 ? (
                  <p className="hint">No orders yet. Add items from the menu above or create a custom item.</p>
                ) : (
                  <div className="order-list">
                    {selectedTable.orders.map((order) => (
                      <div key={order.orderId ?? order.itemId} className="order-item">
                        <div>
                          <strong>{order.name}</strong>
                          <div>{formatCurrency(order.price * order.qty)} total</div>
                        </div>
                        <div className="order-controls">
                          <input
                            type="number"
                            min={1}
                            value={order.qty}
                            onChange={(event) => updateOrderQty(selectedTable.id, order.orderId, Number(event.target.value))}
                          />
                          <button className="danger-button" onClick={() => removeOrderItem(selectedTable.id, order.orderId)}>
                            Remove
                          </button>
                        </div>
                        <label>
                          Notes
                          <input
                            type="text"
                            value={order.notes}
                            placeholder="Special requests"
                            onChange={(event) => updateOrderNotes(selectedTable.id, order.orderId, event.target.value)}
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h3>Billing</h3>
                <div className="billing-row">
                  <span>Subtotal</span>
                  <strong>{formatCurrency(subtotal)}</strong>
                </div>
                <div className="billing-row">
                  <span>Tax ({(taxRate * 100).toFixed(0)}%)</span>
                  <strong>{formatCurrency(tax)}</strong>
                </div>
                <label>
                  Discount
                  <input
                    type="number"
                    min={0}
                    max={subtotal + tax}
                    value={discount}
                    onChange={(event) => updateTable(selectedTable.id, { discount: Number(event.target.value) })}
                  />
                </label>
                <div className="billing-total">
                  <span>Grand total</span>
                  <strong>{formatCurrency(grandTotal)}</strong>
                </div>
                <button className="primary-button" onClick={() => handlePrintBill(selectedTable)}>
                  🖨️ Print Bill
                </button>
              </section>

              {/* Print-only formatted receipt */}
              <div className="receipt-print-only" aria-hidden="true">
                <div className="receipt-header"><strong>{currentFloor.name} - Table {selectedTable.name}</strong></div>
                {(() => {
                  const groups: Record<string, typeof selectedTable.orders> = {};
                  selectedTable.orders.forEach((o) => {
                    const menu = menuItems.find((m) => m.id === o.itemId);
                    const cat = menu?.category ?? 'Misc';
                    if (!groups[cat]) groups[cat] = [];
                    groups[cat].push(o);
                  });
                  const total = selectedTable.orders.reduce((s, o) => s + o.price * o.qty, 0);
                  return (
                    <>
                      {Object.entries(groups).map(([cat, items]) => (
                        <div key={cat} className="receipt-group">
                          <div className="receipt-group-title">{cat}</div>
                          {items.map((it) => (
                            <div key={it.orderId ?? it.itemId} className="receipt-line">
                              <div className="receipt-name">{it.name}{it.qty > 1 ? ` x${it.qty}` : ''}</div>
                              <div className="receipt-dots" />
                              <div className="receipt-price">{formatCurrency(it.price * it.qty)}</div>
                            </div>
                          ))}
                        </div>
                      ))}
                      <div className="receipt-total receipt-line">
                        <div className="receipt-name"><strong>Total</strong></div>
                        <div className="receipt-dots" />
                        <div className="receipt-price"><strong>{formatCurrency(total)}</strong></div>
                      </div>
                    </>
                  );
                })()}
              </div>
              </div>
            </section>
          ) : (
            <section>
              <h2>Analytics</h2>
              <div className="metric-card">
                <span>Daily revenue</span>
                <strong>{formatCurrency(analytics.revenue)}</strong>
              </div>
              <div className="metric-card">
                <span>Busiest tables</span>
                <ul>
                  {analytics.busiest.map((entry) => (
                    <li key={entry.table.id}>
                      {entry.table.name} — {entry.totalItems} items
                    </li>
                  ))}
                </ul>
              </div>
              <div className="metric-card">
                <span>Most ordered food</span>
                <ul>
                  {analytics.mostOrdered.length === 0 ? (
                    <li>None yet</li>
                  ) : (
                    analytics.mostOrdered.map(([name, count]) => <li key={name}>{name} — {count}</li>)
                  )}
                </ul>
              </div>
              <div className="metric-card">
                <span>Peak hours</span>
                <ul>
                  {analytics.peakHours.length === 0 ? <li>None yet</li> : analytics.peakHours.map(([hour, count]) => <li key={hour}>{hour} — {count}</li>)}
                </ul>
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

export default App;
