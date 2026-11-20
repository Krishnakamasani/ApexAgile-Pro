from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/v1/users", tags=["Users & Team"])

@router.get("", response_model=List[UserResponse], summary="List all team members")
def list_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add new team member",
    dependencies=[Depends(get_current_user)]
)
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        name=user_in.name.strip(),
        email=user_in.email.strip().lower(),
        role=user_in.role,
        avatar_color=user_in.avatar_color or "#4F46E5"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
