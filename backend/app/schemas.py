from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class FloorBase(BaseModel):
    name: str
    rows: int
    cols: int


class FloorCreate(FloorBase):
    pass


class FloorRead(FloorBase):
    id: str

    class Config:
        orm_mode = True


class TableBase(BaseModel):
    name: str
    floor_id: str
    row: int
    col: int
    row_span: int = 1
    col_span: int = 2
    capacity: int = 4
    status: str = 'Available'
    discount: float = 0.0


class TableCreate(TableBase):
    pass


class TableUpdate(BaseModel):
    name: Optional[str] = None
    floor_id: Optional[str] = None
    row: Optional[int] = None
    col: Optional[int] = None
    row_span: Optional[int] = None
    col_span: Optional[int] = None
    capacity: Optional[int] = None
    status: Optional[str] = None
    discount: Optional[float] = None


class TableRead(TableBase):
    id: str

    class Config:
        orm_mode = True


class MenuItemBase(BaseModel):
    name: str
    category: str
    price: float


class MenuItemCreate(MenuItemBase):
    pass


class MenuItemRead(MenuItemBase):
    id: str
    created_at: datetime

    class Config:
        orm_mode = True


class OrderItemBase(BaseModel):
    table_id: str
    menu_item_id: Optional[str] = None
    name: str
    price: float
    qty: int = 1
    notes: Optional[str] = None


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemUpdate(BaseModel):
    qty: Optional[int] = None
    notes: Optional[str] = None


class OrderItemRead(OrderItemBase):
    id: int
    added_at: datetime

    class Config:
        orm_mode = True
