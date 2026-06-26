# Spatial Cafe Backend

This folder contains the FastAPI + PostgreSQL backend for the Spatial Cafe System.

## Setup

1. Create a Python virtual environment:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Copy or update `.env` to use your PostgreSQL connection settings:

```bash
cp .env.example .env
```

4. Ensure PostgreSQL has the `sfs_db` database and `sfs_user` user configured with password `1234`.

5. Run the backend:

```bash
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

- `GET /health`
- `GET /floors`
- `POST /floors`
- `DELETE /floors/{floor_id}`
- `GET /tables`
- `POST /tables`
- `PATCH /tables/{table_id}`
- `DELETE /tables/{table_id}`
- `DELETE /tables/{table_id}/orders`
- `GET /menu-items`
- `POST /menu-items`
- `DELETE /menu-items/{item_id}`
- `GET /orders`
- `POST /orders`
- `PATCH /orders/{order_id}`
- `DELETE /orders/{order_id}`

The backend uses PostgreSQL and automatically creates the database schema on startup.
