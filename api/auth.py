from datetime import datetime, timedelta
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
import jwt
import uuid

from api.schemas import RegisterRequest, Token, UserProfile

# JWT Configuration
SECRET_KEY = "super-secret-hackathon-key-do-not-use-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

# Workaround for passlib + bcrypt >= 4.0 compatibility issue
import bcrypt
if not hasattr(bcrypt, "__about__"):
    class _MockAbout:
        __version__ = bcrypt.__version__
    bcrypt.__about__ = _MockAbout()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

router = APIRouter(prefix="/auth", tags=["auth"])

# In-Memory Database (MVP)
USERS_DB: Dict[str, Dict[str, Any]] = {}
USERS_BY_EMAIL: Dict[str, str] = {}


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.InvalidTokenError:
        raise credentials_exception
        
    user = USERS_DB.get(user_id)
    if user is None:
        raise credentials_exception
    return user


@router.post("/register", response_model=Token)
async def register(req: RegisterRequest):
    if req.email in USERS_BY_EMAIL:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(req.password)

    user_record = {
        "id": user_id,
        "email": req.email,
        "name": req.name,
        "role": req.role,
        "hashed_password": hashed_password,
        "avatarUrl": f"https://api.dicebear.com/7.x/avataaars/svg?seed={req.name}",
    }

    USERS_DB[user_id] = user_record
    USERS_BY_EMAIL[req.email] = user_id

    access_token = create_access_token(data={"sub": user_id})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user_id = USERS_BY_EMAIL.get(form_data.username)  # username field is used for email
    if not user_id:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    user = USERS_DB.get(user_id)
    if not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    access_token = create_access_token(data={"sub": user_id})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserProfile)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "role": current_user["role"],
        "avatarUrl": current_user.get("avatarUrl"),
    }
