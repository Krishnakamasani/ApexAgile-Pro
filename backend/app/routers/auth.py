import hashlib
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from app.database import get_db
from app.models.auth_session import AuthSession
from app.models.user import User
from app.schemas.user import UserResponse
from app.services.auth_service import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password
)

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])
_bearer_scheme = HTTPBearer()

class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=1, max_length=128)

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=8, max_length=128)
    role: str = Field(default="DEVELOPER")

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

@router.post("/login", response_model=AuthResponse, summary="Log in as a team member or demo user")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token = create_access_token(db, user)
    return AuthResponse(access_token=token, user=user)

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED, summary="Register a new team member")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    email_clean = req.email.strip().lower()
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    colors = ["#6366F1", "#EC4899", "#10B981", "#F59E0B", "#8B5CF6", "#06B6D4", "#3B82F6"]
    color = colors[db.query(User).count() % len(colors)]

    user = User(
        name=req.name.strip(),
        email=email_clean,
        password_hash=hash_password(req.password),
        role=req.role,
        avatar_color=color
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(db, user)
    return AuthResponse(access_token=token, user=user)

@router.get("/me", response_model=UserResponse, summary="Get current logged in user")
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, summary="Revoke the current session")
def logout(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    token_hash = hashlib.sha256(credentials.credentials.encode("utf-8")).hexdigest()
    db.query(AuthSession).filter(
        AuthSession.token_hash == token_hash,
        AuthSession.user_id == current_user.id
    ).delete(synchronize_session=False)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
