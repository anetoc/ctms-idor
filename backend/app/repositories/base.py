"""Base repository with generic CRUD operations."""

from typing import Any, Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import Base

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class BaseRepository(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """Generic repository for CRUD operations."""

    def __init__(self, model: type[ModelType]) -> None:
        self.model = model

    async def get_by_id(
        self,
        db: AsyncSession,
        id: UUID,
    ) -> ModelType | None:
        """Get a single record by ID."""
        result = await db.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()

    async def get_all(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> list[ModelType]:
        """Get all records with pagination."""
        result = await db.execute(
            select(self.model)
            .offset(skip)
            .limit(limit)
            .order_by(self.model.created_at.desc())
        )
        return list(result.scalars().all())

    async def count(
        self,
        db: AsyncSession,
        **filters: Any,
    ) -> int:
        """Count records with optional filters."""
        query = select(func.count()).select_from(self.model)

        for key, value in filters.items():
            if value is not None and hasattr(self.model, key):
                query = query.where(getattr(self.model, key) == value)

        result = await db.execute(query)
        return result.scalar() or 0

    async def create(
        self,
        db: AsyncSession,
        *,
        obj_in: CreateSchemaType,
        **extra_fields: Any,
    ) -> ModelType:
        """Create a new record."""
        obj_data = obj_in.model_dump()
        obj_data.update(extra_fields)
        db_obj = self.model(**obj_data)
        db.add(db_obj)
        await db.flush()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: ModelType,
        obj_in: UpdateSchemaType | dict[str, Any],
    ) -> ModelType:
        """Update an existing record."""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        await db.flush()
        await db.refresh(db_obj)
        return db_obj

    async def delete(
        self,
        db: AsyncSession,
        *,
        id: UUID,
    ) -> bool:
        """Delete a record by ID."""
        db_obj = await self.get_by_id(db, id)
        if db_obj:
            await db.delete(db_obj)
            await db.flush()
            return True
        return False

    async def exists(
        self,
        db: AsyncSession,
        id: UUID,
    ) -> bool:
        """Check if a record exists."""
        result = await db.execute(
            select(func.count()).select_from(self.model).where(self.model.id == id)
        )
        return (result.scalar() or 0) > 0
