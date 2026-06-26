from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import engine
from .models import Floor, MenuItem, OrderItem, Table


def create_initial_data() -> None:
    with Session(engine) as session:
        if session.execute(select(MenuItem)).scalars().first() is not None:
            return

        floor = Floor(name='Main Floor', rows=6, cols=10)
        session.add(floor)
        session.commit()
        session.refresh(floor)

        menu_items = [
            MenuItem(name='Cafe Latte', category='Beverage', price=5.5),
            MenuItem(name='Espresso', category='Beverage', price=4.0),
            MenuItem(name='Cheesecake', category='Dessert', price=6.0),
        ]
        session.add_all(menu_items)
        session.commit()
        for item in menu_items:
            session.refresh(item)

        table1 = Table(
            name='T1',
            floor_id=floor.id,
            row=0,
            col=0,
            row_span=1,
            col_span=2,
            capacity=4,
            status='Available',
            discount=0.0,
        )
        table2 = Table(
            name='T2',
            floor_id=floor.id,
            row=2,
            col=3,
            row_span=1,
            col_span=2,
            capacity=4,
            status='Reserved',
            discount=0.0,
        )
        session.add_all([table1, table2])
        session.commit()
        session.refresh(table1)
        session.refresh(table2)

        order = OrderItem(
            table_id=table2.id,
            menu_item_id=menu_items[0].id,
            name=menu_items[0].name,
            price=menu_items[0].price,
            qty=1,
            notes='',
        )
        session.add(order)
        session.commit()
