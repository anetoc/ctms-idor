"""Authentication service for CTMS IDOR."""

from datetime import datetime, timedelta, timezone
from uuid import UUID

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config.settings import settings
from app.models.user import UserRole
from app.schemas.user import Token, TokenData

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Service for authentication operations."""

    def __init__(
        self,
        secret_key: str = settings.JWT_SECRET_KEY,
        algorithm: str = settings.JWT_ALGORITHM,
        expire_minutes: int = settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
    ) -> None:
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.expire_minutes = expire_minutes

    def hash_password(self, password: str) -> str:
        """Hash a password using bcrypt."""
        return pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return pwd_context.verify(plain_password, hashed_password)

    def create_access_token(
        self,
        user_id: UUID,
        email: str,
        role: UserRole,
        expires_delta: timedelta | None = None,
    ) -> Token:
        """Create a JWT access token."""
        if expires_delta is None:
            expires_delta = timedelta(minutes=self.expire_minutes)

        expire = datetime.now(timezone.utc) + expires_delta
        to_encode = {
            "sub": str(user_id),
            "email": email,
            "role": role.value,
            "exp": expire,
            "iat": datetime.now(timezone.utc),
        }

        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)

        return Token(
            access_token=encoded_jwt,
            token_type="bearer",
            expires_in=int(expires_delta.total_seconds()),
        )

    def decode_token(self, token: str) -> TokenData | None:
        """Decode and validate a JWT token."""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            user_id: str | None = payload.get("sub")
            email: str | None = payload.get("email")
            role: str | None = payload.get("role")
            exp: int | None = payload.get("exp")

            if user_id is None or email is None or role is None or exp is None:
                return None

            return TokenData(
                user_id=UUID(user_id),
                email=email,
                role=UserRole(role),
                exp=datetime.fromtimestamp(exp, tz=timezone.utc),
            )
        except JWTError:
            return None

    def is_token_expired(self, token_data: TokenData) -> bool:
        """Check if a token has expired."""
        return datetime.now(timezone.utc) > token_data.exp


# Singleton instance
auth_service = AuthService()
