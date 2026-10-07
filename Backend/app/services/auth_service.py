from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import EmailAlreadyExists, InvalidCredentials
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.repositories import user_repository
from app.schemas.auth import LoginRequest, RegisterRequest


async def register(session: AsyncSession, data: RegisterRequest) -> User:
    existing = await user_repository.get_by_email(session, data.email)
    if existing:
        raise EmailAlreadyExists()

    return await user_repository.create(
        session,
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
    )


async def login(session: AsyncSession, data: LoginRequest) -> tuple[User, str]:
    user = await user_repository.get_by_email(session, data.email)
    if user is None or not verify_password(data.password, user.password_hash):
        raise InvalidCredentials()

    token = create_access_token(user.id)
    return user, token
