from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User, PasswordResetToken
from ..schemas.user import UserCreate, UserResponse, UserLogin, Token, ForgotPasswordRequest, ResetPasswordRequest
from ..utils.auth import get_password_hash, verify_password, create_access_token, get_current_user
from ..services.email_service import send_password_reset_email
import secrets
import hashlib
from datetime import datetime, timezone, timedelta
from ..config import settings

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

from sqlalchemy.exc import IntegrityError, OperationalError

@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        db_user = db.query(User).filter(User.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=409, detail="An account with this email already exists.")
        
        hashed_password = get_password_hash(user.password)
        new_user = User(
            name=user.name,
            email=user.email,
            password_hash=hashed_password
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    except OperationalError:
        db.rollback()
        raise HTTPException(status_code=503, detail="The registration service is temporarily unavailable. Please try again.")
    except Exception as e:
        db.rollback()
        print(f"Unexpected registration error: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred during registration.")

@router.post("/login", response_model=Token)
def login_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_credentials.email).first()
    
    if not user:
        raise HTTPException(status_code=403, detail="Invalid Credentials")
        
    if not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(status_code=403, detail="Invalid Credentials")
        
    access_token = create_access_token(data={"sub": user.email})
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    
    if user:
        # Generate secure random token
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        
        # Dynamic expiry
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)
        
        reset_token = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at
        )
        db.add(reset_token)
        
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"
        try:
            send_password_reset_email(user.email, reset_link)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"[EMAIL] Failed to send password reset email for {user.email}")
            raise HTTPException(status_code=500, detail="Unable to send the reset email right now. Please try again later.")
        
    return {"detail": "If an account with that email exists, we've sent instructions to reset your password."}

@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(request.token.encode()).hexdigest()
    
    # Find active token
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.used_at == None
    ).first()
    
    if not reset_token:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
        
    # Check expiry
    now = datetime.now(timezone.utc)
    token_expires = reset_token.expires_at
    if token_expires.tzinfo is None:
        token_expires = token_expires.replace(tzinfo=timezone.utc)
        
    if now > token_expires:
        raise HTTPException(status_code=400, detail="Token has expired")
        
    user = db.query(User).filter(User.id == reset_token.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Reset password
    user.password_hash = get_password_hash(request.password)
    reset_token.used_at = now
    
    db.commit()
    
    return {"detail": "Password reset successfully."}
