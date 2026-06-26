# Spatial Cafe System Report


This project is a full-stack cafe floor management system with a React + Vite frontend and a FastAPI backend.

Key points:
- Frontend: `src/App.tsx`, `src/types.ts`, `src/data.ts`, `src/style.css`, `src/main.tsx`
- Backend: `backend/app/main.py`, `backend/app/models.py`, `backend/app/database.py`, `backend/app/seed.py`, `backend/app/schemas.py`
- Proxy: `vite.config.ts` forwards `/api` to backend `http://127.0.0.1:8000`
- Database: PostgreSQL via SQLAlchemy using `pg8000`, configured through `backend/.env` and `backend/.env.example`
- Local dev commands: `npm run dev`, `npm run backend:dev`, `npm run dev:all`

If asked to "read report and resume", use this document as the primary source of truth for project structure, running instructions, backend endpoints, and frontend behavior.

---

## Project Overview

Spatial Cafe System allows a cafe manager to:
- design multi-floor layouts on a grid
- add, move, resize, and remove tables
- update table statuses
- manage menu items
- add orders to tables, including custom orders
- edit order quantity and notes
- clear all orders for a table
- view billing calculations (subtotal, tax, discount, grand total)
- view live analytics for revenue, busiest tables, most ordered items, and peak hours

The frontend is a React application bundled with Vite. The backend is a FastAPI application exposing CRUD endpoints backed by PostgreSQL.

## Stack

- Frontend: React 18, TypeScript, Vite
- Backend: FastAPI, SQLAlchemy, PostgreSQL
- Styles: plain CSS in `src/style.css`
- Dev utilities: `concurrently` for running frontend and backend together

## File Structure

Root:
- `package.json` — frontend scripts and dependencies
- `vite.config.ts` — Vite config with `/api` proxy to backend
- `README.md` — project overview and setup
- `report.md` — implementation report
- `report2.md` — alternate project notes and backend restoration guide
- `src/` — frontend source files
- `backend/` — backend source files

Frontend:
- `src/App.tsx` — main app logic and UI
- `src/main.tsx` — React entry point
- `src/types.ts` — TypeScript data models used by frontend
- `src/data.ts` — initial menu data used before backend loads
- `src/style.css` — layout and component styling

Backend:
- `backend/app/main.py` — FastAPI app and routes
- `backend/app/models.py` — SQLAlchemy database models
- `backend/app/schemas.py` — Pydantic request/response schemas
- `backend/app/database.py` — DB engine, session provider, init logic
- `backend/app/seed.py` — initial seed data generation
- `backend/requirements.txt` — Python dependency list
- `backend/README.md` — backend setup and API reference
- `backend/.env.example` — PostgreSQL connection example

---

## Frontend Implementation Details

### App entry and setup

- `src/main.tsx` mounts `<App />` inside `#root`.
- `src/App.tsx` contains the entire UI and application state.

### Data types

`src/types.ts` exports:
- `TableStatus` — union of `Available`, `Reserved`, `Occupied`, `Cleaning`, `Disabled`
- `OrderItem` — order metadata and billing fields
- `Table` — table position, capacity, status, orders, discount
- `Floor` — grid dimensions and tables
- `MenuItem` — menu item id, name, price, category

### Initial state

- `defaultFloors` defines a sample `Main Floor` with two tables and one sample order.
- `MENU_ITEMS` in `src/data.ts` provides default menu items used before backend load.

### Backend data loading

- `loadAppData()` fetches concurrently from backend endpoints:
  - `GET /api/menu-items`
  - `GET /api/floors`
  - `GET /api/tables`
  - `GET /api/orders`
- Orders are mapped to tables by `table_id`.
- Tables are attached to floors by `floor_id`.
- Parsed data is stored in frontend state so the app can render floors, tables, and orders.

### API service helpers

- `fetchJson<T>(path, init?)` performs fetch with JSON handling and error propagation.
- `transformOrder`, `transformTable`, `transformFloor` convert backend response shapes into frontend models.

### Grid and table operations

- `getTableAt(row, col)` checks whether a cell is occupied.
- `isCellAvailable(row, col)` validates a new table placement.
- `addTable(row, col)` posts to `/api/tables` and appends the created table.
- `removeTable(tableId)` deletes a table via `/api/tables/{tableId}` and updates state.
- `removeFloor()` deletes the current floor via `/api/floors/{floorId}`.
- `handleAddFloor()` creates a new floor via `/api/floors`.

### Table movement and resizing

- Drag state is managed by `dragState` and drag events on the grid container.
- `moveTable(tableId, row, col)` updates local state and sends a PATCH update.
- `resizeTable(tableId, deltaRows, deltaCols)` adjusts row/column spans and patches backend.
- `updateTable(tableId, partial)` applies local updates and sends PATCH to `/api/tables/{tableId}`.

### Orders and billing

- `addOrderItem(tableId, itemId)` adds a menu item order, merging quantities for duplicate items with no notes.
- `addCustomOrderItem(tableId)` posts a custom order with `menu_item_id: null`.
- `updateOrderQty(tableId, orderId, qty)` adjusts quantity or removes order if qty <= 0.
- `updateOrderNotes(tableId, orderId, notes)` patches order notes.
- `removeOrderItem(tableId, orderId)` deletes the order.
- `clearTableOrders(tableId)` deletes all orders for a table via `/api/tables/{tableId}/orders`.

Billing calculations for the selected table:
- `subtotal` = sum of `price * qty`
- `tax` = 8% of subtotal
- `discount` = table discount input
- `grandTotal` = `max(0, subtotal + tax - discount)`

### Menu management

- `addMenuItem()` posts a new menu item to `/api/menu-items`.
- `removeMenuItem(itemId)` deletes a menu item.

### Analytics dashboard

Computed from current `floors` state:
- total revenue from all orders
- busiest tables by items ordered
- most ordered food names and quantities
- peak hours based on `addedAt`

### UI and interactions

- Left sidebar: floor selection, add/remove floors, layout controls, add table, menu management.
- Main workspace: grid layout with draggable/resizable table cards.
- Right sidebar: selected table details and order panel, or analytics when no table is selected.

### Persisted vs non-persisted updates

- Floor rows/columns are updated locally and persisted only when floors are created or deleted.
- Table creation, table updates, orders, and menu items are persisted via backend API calls.

---

## Backend Implementation Details

### Database configuration

`backend/app/database.py`:
- loads `.env` variables using `python-dotenv`
- default `DATABASE_URL` is `postgresql+pg8000://sfs_user:1234@localhost:5432/sfs_db`
- creates SQLAlchemy engine with `create_engine`
- `init_db()` creates tables from SQLAlchemy metadata
- `get_session()` yields a database session

### Models and schemas

`backend/app/models.py` defines:
- `Floor`
- `Table`
- `MenuItem`
- `OrderItem`

Relationships:
- `Floor` has many `Table`
- `Table` belongs to `Floor` and has many `OrderItem`
- `OrderItem` optionally belongs to `MenuItem`

`backend/app/schemas.py` defines Pydantic schemas for create/read/update payloads.

### Seed data

`backend/app/seed.py` runs on startup when the database is empty and creates:
- default floor data
- default menu items: `Cafe Latte`, `Espresso`, `Cheesecake`
- default tables and orders

### FastAPI routes

`backend/app/main.py` exposes these routes:

Health
- `GET /health` — returns `{ "status": "ok" }`

Floor endpoints
- `GET /floors` — returns list of floors
- `POST /floors` — create new floor
- `DELETE /floors/{floor_id}` — delete floor

Table endpoints
- `GET /tables` — return all tables
- `POST /tables` — create table
- `PATCH /tables/{table_id}` — update table fields
- `DELETE /tables/{table_id}` — delete table
- `DELETE /tables/{table_id}/orders` — delete all orders for a table

Menu endpoints
- `GET /menu-items` — return all menu items
- `POST /menu-items` — create menu item
- `DELETE /menu-items/{item_id}` — delete menu item

Order endpoints
- `GET /orders` — return all orders
- `POST /orders` — create order
- `PATCH /orders/{order_id}` — update order quantity or notes
- `DELETE /orders/{order_id}` — delete order

### Payload shapes

Example create floor:
```json
{ "name": "Floor 2", "rows": 6, "cols": 10 }
```

Example create table:
```json
{
  "name": "T3",
  "floor_id": "floor-uuid",
  "row": 0,
  "col": 0,
  "row_span": 1,
  "col_span": 2,
  "capacity": 4,
  "status": "Available",
  "discount": 0
}
```

Example create menu item:
```json
{
  "name": "Fancy Tea",
  "category": "Beverage",
  "price": 4.5
}
```

Example create order:
```json
{
  "table_id": "table-uuid",
  "menu_item_id": "latte",
  "name": "Cafe Latte",
  "price": 5.5,
  "qty": 1,
  "notes": ""
}
```

Example patch table:
```json
{
  "row": 2,
  "col": 4,
  "status": "Occupied",
  "discount": 2.5
}
```

Example patch order:
```json
{
  "qty": 2,
  "notes": "No sugar"
}
```

## Running Locally

### Frontend

From workspace root:
```bash
npm install
npm run dev
```

### Backend

From `backend/`:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Ensure PostgreSQL has the `sfs_db` database and `sfs_user` user with password `1234`
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Full dev mode

From workspace root:
```bash
npm run dev:all
```

### Notes

- Frontend uses `VITE_API_BASE` when provided, otherwise `/api`.
- Vite proxy rewrites `/api` to backend root.
- Backend startup runs `init_db()` and `create_initial_data()`.
- `backend/.env` now points to PostgreSQL `sfs_db` by default.
- A legacy SQLite file `backend/spatial_cafe.db` is present in the repo, but the configured backend depends on PostgreSQL.

## Known Behavior and Important Details

- Table movement is implemented by dragging the handle on the table card.
- Table resize uses fixed buttons for wider/narrower/taller/shorter.
- Table grid layout is relative to the active floor's `rows` and `cols`.
- Floor dimension changes are local to the frontend and are not persisted to backend fields beyond floor creation/deletion.
- Orders are mapped from backend response to their table via `table_id`.
- The frontend displays analytics when no table is selected.

## Recommended AI Resume Workflow

When resuming work on this repository, use this document:
1. Start with the project summary and stack sections.
2. Review `src/App.tsx` for UI logic and API calls.
3. Review `backend/app/main.py` for the available endpoints.
4. Use the `Running Locally` section to reproduce the environment.
5. For any requested feature or bug, locate the related frontend or backend file from the `File Structure` section.

---

End of report.
