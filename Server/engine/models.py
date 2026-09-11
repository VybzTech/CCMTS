from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, DECIMAL, BigInteger, Text, JSON
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Courier(Base):
    __tablename__ = 'couriers'  # Matches Prisma @@map("couriers")
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(255))
    availability = Column(Boolean, default=True)
    active_tasks = Column(Integer, default=0)
    performance = Column(Integer, default=100)
    base_lga = Column(String(100)) # Enum mapped to String
    other_branches_lga = Column(JSON, default=[])


class Letter(Base):
    __tablename__ = 'letters' # Matches Prisma @@map("letters")

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    tracking_id = Column(String(255), unique=True)
    recipient_address = Column(String(255))
    lga_address = Column(String(100)) # Enum mapped to String
    priority = Column(String(50), default='Medium')
    status = Column(String(50), default='Pending Approval')
    liability_value = Column(DECIMAL(12, 2), default=0.00)
    liability_year = Column(String(255))
    
    courier_id = Column(BigInteger, ForeignKey('couriers.id'))
    assigned_at = Column(DateTime, nullable=True)