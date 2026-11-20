import hashlib
import hmac
import secrets
import time
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.auth_session import AuthSession
from app.models.user import User


_HASH_ALGORITHM = "pbkdf2_sha256"
_HASH_ITERATIONS = 310_000
_SESSION_LIFETIME_SECONDS = 7 * 24 * 60 * 60
_bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    password_hash = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), bytes.fromhex(salt), _HASH_ITERATIONS
    ).hex()
    return f"{_HASH_ALGORITHM}${_HASH_ITERATIONS}${salt}${password_hash}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iterations, salt, expected_hash = stored_hash.split("$", 3)
        if algorithm != _HASH_ALGORITHM:
            return False
        actual_hash = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), bytes.fromhex(salt), int(iterations)
        ).hex()
        return hmac.compare_digest(actual_hash, expected_hash)
    except (AttributeError, TypeError, ValueError):
        return False


def create_access_token(db: Session, user: User) -> str:
    token = secrets.token_urlsafe(32)
    db.add(AuthSession(
        token_hash=hashlib.sha256(token.encode("utf-8")).hexdigest(),
        user_id=user.id,
        expires_at=int(time.time()) + _SESSION_LIFETIME_SECONDS
    ))
    db.commit()
    return token


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
    db: Session = Depends(get_db)
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign in to continue.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token_hash = hashlib.sha256(credentials.credentials.encode("utf-8")).hexdigest()
    session = db.query(AuthSession).filter(AuthSession.token_hash == token_hash).first()
    if session is None or session.expires_at <= int(time.time()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user = db.query(User).filter(User.id == session.user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session is no longer valid. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return user
