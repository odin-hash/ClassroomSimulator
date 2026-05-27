import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Path to the database file (load from environment variable for hosting, or fallback to local SQLite)
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    DATABASE_URL = DATABASE_URL.strip().strip("'\"")
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./classroom.db"

# Adjust connection settings based on the database driver
if not (DATABASE_URL.startswith("sqlite") or DATABASE_URL.startswith("postgres") or DATABASE_URL.startswith("postgresql")):
    print(f"[DB] WARNING: Invalid DATABASE_URL format. Falling back to local SQLite database.")
    DATABASE_URL = "sqlite:///./classroom.db"

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # Some platforms (like Render/Heroku) output 'postgres://', but SQLAlchemy requires 'postgresql://'
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    try:
        # Create Postgres engine and test connection immediately
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            pass
        print("[DB] Successfully connected to PostgreSQL database.")
    except Exception as pg_err:
        print(f"[DB] ERROR: Could not connect to PostgreSQL: {pg_err}")
        print("[DB] Falling back to local SQLite database.")
        DATABASE_URL = "sqlite:///./classroom.db"
        engine = create_engine(
            DATABASE_URL, connect_args={"check_same_thread": False}
        )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get db session in API endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
