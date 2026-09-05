from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, Integer, String, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

from app.core.config import settings


connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, future=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    pass


class ProcessedContract(Base):
    __tablename__ = "ai_processed_contracts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    job_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    source_filename: Mapped[str | None] = mapped_column(String(512), nullable=True)
    document_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def save_processed_contract(job_id: str, source_filename: str | None, document: dict[str, Any]) -> int:
    with SessionLocal() as session:
        existing = session.query(ProcessedContract).filter_by(job_id=job_id).one_or_none()
        if existing:
            existing.document_json = document
            existing.source_filename = source_filename
            session.commit()
            session.refresh(existing)
            return existing.id

        row = ProcessedContract(
            job_id=job_id,
            source_filename=source_filename,
            document_json=document,
        )
        session.add(row)
        session.commit()
        session.refresh(row)
        return row.id
