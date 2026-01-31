"""Authentication routes for CTMS IDOR."""

from datetime import timedelta

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import ActiveUser, CurrentUser, DbSession
from app.config.settings import settings
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserLogin, UserResponse
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: DbSession,
) -> Token:
    """
    Authenticate user and return JWT token.

    - **email**: User email address
    - **password**: User password
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify password
    if not auth_service.verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled",
        )

    # Create access token
    return auth_service.create_access_token(
        user_id=user.id,
        email=user.email,
        role=user.role,
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    current_user: ActiveUser,
) -> Token:
    """
    Refresh the access token for the current user.

    Requires valid authentication.
    """
    return auth_service.create_access_token(
        user_id=current_user.id,
        email=current_user.email,
        role=current_user.role,
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: CurrentUser,
) -> User:
    """
    Get information about the current authenticated user.

    Returns user profile without password.
    """
    return current_user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_in: UserCreate,
    db: DbSession,
) -> User:
    """
    Register a new user (development only).

    In production, user creation should be admin-only.

    - **email**: Unique email address
    - **name**: Full name
    - **password**: Password (min 8 characters)
    - **role**: User role (defaults to readonly)
    """
    if not settings.is_development:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Public registration is disabled",
        )

    # Check if email already exists
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create user
    user = User(
        email=user_in.email,
        name=user_in.name,
        password_hash=auth_service.hash_password(user_in.password),
        role=user_in.role,
        is_active=True,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    return user
