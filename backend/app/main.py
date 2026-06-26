from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import get_session, init_db
from .models import Floor, MenuItem, OrderItem, Table
from .schemas import (
    FloorCreate,
    FloorRead,
    MenuItemCreate,
    MenuItemRead,
    OrderItemCreate,
    OrderItemRead,
    OrderItemUpdate,
    TableCreate,
    TableRead,
    TableUpdate,
)
from .seed import create_initial_data

app = FastAPI(
    title='Spatial Cafe Backend',
    description='FastAPI backend for the Spatial Cafe System using PostgreSQL.',
    version='0.1.0',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.on_event('startup')
def on_startup() -> None:
    try:
        init_db()
        create_initial_data()
    except Exception as e:
        print(f'Warning: Could not initialize database on startup: {e}')


@app.get('/health')
def health() -> dict[str, str]:
    return {'status': 'ok'}


@app.get('/floors', response_model=list[FloorRead])
def read_floors(session: Session = Depends(get_session)) -> list[FloorRead]:
    floors = session.execute(select(Floor)).scalars().all()
    return floors


@app.post('/floors', response_model=FloorRead, status_code=status.HTTP_201_CREATED)
def create_floor(floor: FloorCreate, session: Session = Depends(get_session)) -> FloorRead:
    db_floor = Floor(**floor.dict())
    session.add(db_floor)
    session.commit()
    session.refresh(db_floor)
    return db_floor


@app.delete('/floors/{floor_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_floor(floor_id: str, session: Session = Depends(get_session)) -> None:
    db_floor = session.get(Floor, floor_id)
    if not db_floor:
        raise HTTPException(status_code=404, detail='Floor not found')
    session.delete(db_floor)
    session.commit()


@app.get('/tables', response_model=list[TableRead])
def read_tables(session: Session = Depends(get_session)) -> list[TableRead]:
    tables = session.execute(select(Table)).scalars().all()
    return tables


@app.post('/tables', response_model=TableRead, status_code=status.HTTP_201_CREATED)
def create_table(table: TableCreate, session: Session = Depends(get_session)) -> TableRead:
    if not session.get(Floor, table.floor_id):
        raise HTTPException(status_code=404, detail='Floor not found')
    db_table = Table(**table.dict())
    session.add(db_table)
    session.commit()
    session.refresh(db_table)
    return db_table


@app.patch('/tables/{table_id}', response_model=TableRead)
def update_table(table_id: str, table: TableUpdate, session: Session = Depends(get_session)) -> TableRead:
    db_table = session.get(Table, table_id)
    if not db_table:
        raise HTTPException(status_code=404, detail='Table not found')
    updated = table.dict(exclude_unset=True)
    for key, value in updated.items():
        setattr(db_table, key, value)
    session.add(db_table)
    session.commit()
    session.refresh(db_table)
    return db_table


@app.delete('/tables/{table_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_table(table_id: str, session: Session = Depends(get_session)) -> None:
    db_table = session.get(Table, table_id)
    if not db_table:
        raise HTTPException(status_code=404, detail='Table not found')
    session.delete(db_table)
    session.commit()


@app.delete('/tables/{table_id}/orders', status_code=status.HTTP_204_NO_CONTENT)
def delete_table_orders(table_id: str, session: Session = Depends(get_session)) -> None:
    db_table = session.get(Table, table_id)
    if not db_table:
        raise HTTPException(status_code=404, detail='Table not found')
    for order in list(db_table.orders):
        session.delete(order)
    session.commit()


@app.get('/menu-items', response_model=list[MenuItemRead])
def read_menu_items(session: Session = Depends(get_session)) -> list[MenuItemRead]:
    items = session.execute(select(MenuItem)).scalars().all()
    return items


@app.post('/menu-items', response_model=MenuItemRead, status_code=status.HTTP_201_CREATED)
def create_menu_item(item: MenuItemCreate, session: Session = Depends(get_session)) -> MenuItemRead:
    db_item = MenuItem(**item.dict())
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


@app.delete('/menu-items/{item_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_menu_item(item_id: str, session: Session = Depends(get_session)) -> None:
    db_item = session.get(MenuItem, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail='Menu item not found')
    session.delete(db_item)
    session.commit()


@app.get('/orders', response_model=list[OrderItemRead])
def read_orders(session: Session = Depends(get_session)) -> list[OrderItemRead]:
    orders = session.execute(select(OrderItem)).scalars().all()
    return orders


@app.post('/orders', response_model=OrderItemRead, status_code=status.HTTP_201_CREATED)
def create_order(order: OrderItemCreate, session: Session = Depends(get_session)) -> OrderItemRead:
    if not session.get(Table, order.table_id):
        raise HTTPException(status_code=404, detail='Table not found')
    if order.menu_item_id and not session.get(MenuItem, order.menu_item_id):
        raise HTTPException(status_code=404, detail='Menu item not found')
    db_order = OrderItem(**order.dict())
    session.add(db_order)
    session.commit()
    session.refresh(db_order)
    return db_order


@app.patch('/orders/{order_id}', response_model=OrderItemRead)
def update_order(order_id: int, order: OrderItemUpdate, session: Session = Depends(get_session)) -> OrderItemRead:
    db_order = session.get(OrderItem, order_id)
    if not db_order:
        raise HTTPException(status_code=404, detail='Order not found')
    updated = order.dict(exclude_unset=True)
    for key, value in updated.items():
        setattr(db_order, key, value)
    session.add(db_order)
    session.commit()
    session.refresh(db_order)
    return db_order


@app.delete('/orders/{order_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, session: Session = Depends(get_session)) -> None:
    db_order = session.get(OrderItem, order_id)
    if not db_order:
        raise HTTPException(status_code=404, detail='Order not found')
    session.delete(db_order)
    session.commit()
