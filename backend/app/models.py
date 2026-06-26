from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import declarative_base, relationship
from uuid import uuid4

Base = declarative_base()


def new_uuid() -> str:
    return str(uuid4())


class Floor(Base):
    __tablename__ = 'floor'

    id = Column(String, primary_key=True, default=new_uuid)
    name = Column(String, nullable=False)
    rows = Column(Integer, nullable=False)
    cols = Column(Integer, nullable=False)

    tables = relationship('Table', back_populates='floor', cascade='all, delete-orphan')


class Table(Base):
    __tablename__ = 'table'

    id = Column(String, primary_key=True, default=new_uuid)
    floor_id = Column(String, ForeignKey('floor.id'), nullable=False)
    name = Column(String, nullable=False)
    row = Column(Integer, nullable=False)
    col = Column(Integer, nullable=False)
    row_span = Column(Integer, nullable=False, default=1)
    col_span = Column(Integer, nullable=False, default=2)
    capacity = Column(Integer, nullable=False, default=4)
    status = Column(String, nullable=False, default='Available')
    discount = Column(Float, nullable=False, default=0.0)

    floor = relationship('Floor', back_populates='tables')
    orders = relationship('OrderItem', back_populates='table', cascade='all, delete-orphan')


class MenuItem(Base):
    __tablename__ = 'menuitem'

    id = Column(String, primary_key=True, default=new_uuid)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    orders = relationship('OrderItem', back_populates='menu_item')


class OrderItem(Base):
    __tablename__ = 'orderitem'

    id = Column(Integer, primary_key=True, autoincrement=True)
    table_id = Column(String, ForeignKey('table.id'), nullable=False)
    menu_item_id = Column(String, ForeignKey('menuitem.id'), nullable=True)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    qty = Column(Integer, nullable=False, default=1)
    notes = Column(Text, nullable=True)
    added_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    table = relationship('Table', back_populates='orders')
    menu_item = relationship('MenuItem', back_populates='orders')
