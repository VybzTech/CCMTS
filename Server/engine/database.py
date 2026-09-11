from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from config import DB_URL

engine = create_engine(DB_URL, pool_size=10, max_overflow=20)
Session = sessionmaker(bind=engine)

def get_session():
    return Session()