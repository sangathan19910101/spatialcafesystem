# Spatial Cafe System

A React + Vite application for designing cafe floors, managing table statuses, taking orders, and analyzing revenue.

## Features

- Multi-floor layout designer
- Custom grid size and table placement
- Drag and resize tables
- Table status colors for Available, Reserved, Occupied, Cleaning, Disabled
- Order management with menu selection, quantity, notes, and removal
- Auto-calculated subtotal, tax, discount, and grand total
- Analytics dashboard for busiest tables, revenue, most ordered food, and peak hours

## Requirements

Before running the application, install the following software on your machine:

- Node.js and npm
  - Recommended: Node.js 18.x or newer
- Python 3.10 or newer
- PostgreSQL database server
- Git (optional, if you clone the repository)

## Frontend Dependencies

The frontend uses:

- React
- Vite
- TypeScript
- concurrently

Install frontend dependencies from the project root.

## Backend Dependencies

The backend uses:

- Python
- FastAPI
- Uvicorn
- SQLAlchemy
- python-dotenv
- httpx
- pg8000

These are listed in `backend/requirements.txt`.

## How to Run

### 1. Install frontend dependencies

From the project root:

```bash
cd /home/yi-zaha/temp/code-insider/Spatial_Cafe_System
npm install
```

### 2. Prepare the backend environment

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

### 3. Configure the database

The backend reads the database URL from `backend/.env`.

The default example is:

```env
DATABASE_URL=postgresql+pg8000://sfs_user:1234@localhost:5432/sfs_db
```

If you use the default settings, create a PostgreSQL database and user with matching credentials:

- Database: `sfs_db`
- User: `sfs_user`
- Password: `1234`
- Host: `localhost`
- Port: `5432`

If you need a different database configuration, update `backend/.env` before starting.

### 4. Start the backend

From `backend/`:

```bash
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at `http://localhost:8000`.

### 5. Start the frontend

From the project root:

```bash
npm run dev
```

The frontend will usually be available at `http://localhost:5173`.

### 6. Run both frontend and backend together

From the project root:

```bash
npm run dev:all
```

This starts the backend and frontend in parallel.

### 7. Build for production

From the project root:

```bash
npm run build
```

This compiles TypeScript and builds the Vite production bundle.

## Notes

- If you do not have PostgreSQL installed, install it before running the backend.
- If your system Python is `python` instead of `python3`, replace `python3` with `python` in the commands.
- The backend automatically creates database tables on startup, if the configured database is reachable.
