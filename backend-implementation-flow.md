# FlowPDPA — Backend Implementation Guide

**Target Audience:** Backend Developers & AI Agents  
**Goal:** Build complete backend API to match existing frontend  
**Estimated Time:** 2-3 weeks for full implementation

---

## 📋 Implementation Overview

This guide provides a **step-by-step implementation plan** to build the FlowPDPA backend system that perfectly matches the existing frontend codebase.

### Architecture Stack
```
Frontend: React/TypeScript (already built)
Backend: FastAPI (Python 3.11+)
Database: PostgreSQL 15+
AI Service: OpenAI GPT-4 or Anthropic Claude
Storage: AWS S3 + CloudFront
Payments: Stripe
Email: AWS SES
Integration: Odoo 19 (optional, for helpdesk + CRM)
```

### Key Principles
- **Frontend-First**: Match existing frontend exactly
- **API-First Design**: RESTful API following frontend expectations
- **Security First**: JWT auth, input validation, rate limiting
- **Scalable**: Handle 1000+ concurrent users
- **Observable**: Logging, metrics, error tracking

---

## 🚀 Phase 1: Foundation Setup (Days 1-2)

### Step 1.1: Project Structure
```bash
# Create FastAPI backend project
mkdir flowpdpa-backend && cd flowpdpa-backend

# Create Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Create directory structure
mkdir -p app/{api,core,models,schemas,services,utils}
mkdir -p app/db
mkdir -p tests/{unit,integration}
mkdir -p scripts

# Create requirements.txt
cat > requirements.txt << 'EOF'
# FastAPI and server
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3
pydantic-settings==2.1.0

# Database
sqlalchemy==2.0.25
asyncpg==0.29.0
alembic==1.13.1

# Authentication & Security
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6

# External Services
stripe==7.11.0
boto3==1.34.23
openai==1.10.0
anthropic==0.18.0

# Utilities
python-dotenv==1.0.0
httpx==0.26.0
pyhumps==1.6.1

# Development
pytest==7.4.3
pytest-asyncio==0.23.3
black==24.1.1
ruff==0.1.9
EOF

# Install dependencies
pip install -r requirements.txt
```

### Step 1.2: Project Configuration Files
```python
# pyproject.toml
[tool.black]
line-length = 100
target-version = ['py311']

[tool.ruff]
line-length = 100
select = ["E", "F", "I", "N", "W"]
ignore = ["E501"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

```python
# .env.example
# Application
APP_NAME=FlowPDPA
APP_ENV=development
DEBUG=True
API_HOST=0.0.0.0
API_PORT=8000

# Database
DATABASE_URL=postgresql+asyncpg://flowpdpa:password@localhost:5432/flowpdpa
DATABASE_ECHO=False

# Security
SECRET_KEY=your-super-secret-key-change-in-production-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# AI Services
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-your-anthropic-key

# Stripe Payments
STRIPE_API_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_FREE=price_free_id
STRIPE_PRICE_PREMIUM=price_premium_id

# AWS SES Email
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_SES_FROM_EMAIL=noreply@flowpdpa.co.th
AWS_SES_FROM_NAME=FlowPDPA

# CDN Storage
AWS_S3_BUCKET=flowpdpa-policies
AWS_S3_REGION=ap-southeast-1

# Odoo Integration (optional)
ODOO_URL=https://yourcompany.odoo.com
ODOO_DB=your_database
ODOO_API_KEY=your_api_key
ODOO_TEAM_ID=1
```

### Step 1.3: FastAPI Application Structure
```python
# app/__init__.py
# Empty init file for Python package

# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.api import auth, policies, profile, tickets, admin
from app.db.database import engine
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up FlowPDPA API...")
    yield
    # Shutdown
    logger.info("Shutting down FlowPDPA API...")
    await engine.dispose()

# Create FastAPI app
app = FastAPI(
    title="FlowPDPA API",
    description="Backend API for FlowPDPA - AI-powered PDPA policy generation",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": "2024-01-15T10:00:00Z"}

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(policies.router, prefix="/policies", tags=["Policies"])
app.include_router(profile.router, prefix="/profile", tags=["Profile"])
app.include_router(tickets.router, prefix="/tickets", tags=["Tickets"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG
    )
```

### Step 1.4: Database Schema Implementation
```sql
-- database/migrations/001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. merchants table
CREATE TYPE plan_type AS ENUM ('Free', 'Premium');
CREATE TYPE user_role AS ENUM ('merchant', 'admin');
CREATE TYPE account_status AS ENUM ('active', 'suspended', 'pending');

CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  plan plan_type NOT NULL DEFAULT 'Free',
  role user_role NOT NULL DEFAULT 'merchant',
  status account_status NOT NULL DEFAULT 'active',
  
  -- OAuth fields (future)
  provider VARCHAR(100),
  provider_id VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_merchants_email ON merchants(email);
CREATE INDEX idx_merchants_plan ON merchants(plan);
CREATE INDEX idx_merchants_status ON merchants(status);

-- 2. merchant_profiles table  
CREATE TABLE merchant_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  
  -- Contact info
  phone VARCHAR(50),
  mobile VARCHAR(50),
  website VARCHAR(255),
  function VARCHAR(100), -- Job position
  
  -- Company info
  company_name VARCHAR(255),
  vat VARCHAR(50),
  
  -- Address
  street VARCHAR(255),
  street2 VARCHAR(255),
  city VARCHAR(100),
  state_name VARCHAR(100),
  zip VARCHAR(20),
  country_name VARCHAR(100) DEFAULT 'ประเทศไทย',
  
  -- Preferences
  lang VARCHAR(10) DEFAULT 'th_TH',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_merchant_profiles_merchant_id ON merchant_profiles(merchant_id);

-- 3. policies table
CREATE TYPE policy_type_enum AS ENUM ('privacy', 'hr', 'cctv', 'recruitment', 'vendor', 'dpa');
CREATE TYPE policy_status_enum AS ENUM ('draft', 'active', 'archived');

CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  
  -- Policy info
  name VARCHAR(255) NOT NULL,
  type policy_type_enum NOT NULL DEFAULT 'privacy',
  status policy_status_enum NOT NULL DEFAULT 'active',
  slug VARCHAR(255) UNIQUE NOT NULL,
  
  -- Form data (JSONB)
  form_data JSONB NOT NULL,
  
  -- Generated content
  content_th TEXT,
  content_en TEXT,
  
  -- Share URL
  share_url VARCHAR(500),
  
  -- Download URLs
  download_url_pdf VARCHAR(500),
  download_url_docx VARCHAR(500),
  download_url_txt VARCHAR(500),
  html_embed_code TEXT,
  
  -- Metadata
  version INTEGER NOT NULL DEFAULT 1,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  viewed_count INTEGER DEFAULT 0
);

CREATE INDEX idx_policies_merchant_id ON policies(merchant_id);
CREATE INDEX idx_policies_slug ON policies(slug);
CREATE INDEX idx_policies_type ON policies(type);
CREATE INDEX idx_policies_status ON policies(status);

-- 4. policy_versions table
CREATE TABLE policy_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  
  -- Snapshot
  form_data JSONB NOT NULL,
  content_th TEXT,
  content_en TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES merchants(id)
);

CREATE INDEX idx_policy_versions_policy_id ON policy_versions(policy_id);
CREATE UNIQUE INDEX idx_policy_versions_policy_version ON policy_versions(policy_id, version);

-- 5. tickets table
CREATE TYPE ticket_status_enum AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE ticket_type_enum AS ENUM ('technical', 'billing', 'feature', 'other', 'legal');
CREATE TYPE ticket_priority_enum AS ENUM ('low', 'normal', 'high', 'urgent');

CREATE TABLE tickets (
  id VARCHAR(50) PRIMARY KEY,
  merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL,
  
  -- Customer info (allow guest tickets)
  partner_name VARCHAR(255) NOT NULL,
  partner_email VARCHAR(255) NOT NULL,
  partner_phone VARCHAR(50),
  partner_company_name VARCHAR(255),
  
  -- Ticket info
  name VARCHAR(500) NOT NULL, -- Subject/title
  type ticket_type_enum NOT NULL DEFAULT 'other',
  priority ticket_priority_enum NOT NULL DEFAULT 'normal',
  status ticket_status_enum NOT NULL DEFAULT 'open',
  description TEXT NOT NULL,
  
  -- Odoo integration
  ticket_type_id INTEGER,
  tag_ids TEXT[], -- Array of tag strings
  odoo_ticket_id INTEGER,
  
  -- Resolution
  resolution TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tickets_merchant_id ON tickets(merchant_id);
CREATE INDEX idx_tickets_partner_email ON tickets(partner_email);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_type ON tickets(type);

-- Remaining tables (subscriptions, payments, error_logs, audit_logs) 
-- would follow similar patterns based on api-spec-database-schema.md
```

---

## 🔐 Phase 2: Authentication System (Days 3-4)

### Step 2.1: Configuration & Settings
```python
# app/core/config.py
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "FlowPDPA"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    
    # Database
    DATABASE_URL: str
    DATABASE_ECHO: bool = False
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    CORS_ORIGINS: List[str] = ["http://localhost:5173"]
    
    # AI Services
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    
    # Stripe
    STRIPE_API_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRICE_FREE: str = ""
    STRIPE_PRICE_PREMIUM: str = ""
    
    # AWS SES
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_SES_FROM_EMAIL: str = "noreply@flowpdpa.co.th"
    AWS_SES_FROM_NAME: str = "FlowPDPA"
    
    # AWS S3
    AWS_S3_BUCKET: str = "flowpdpa-policies"
    AWS_S3_REGION: str = "ap-southeast-1"
    
    # Odoo
    ODOO_URL: str = ""
    ODOO_DB: str = ""
    ODOO_API_KEY: str = ""
    ODOO_TEAM_ID: int = 1
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

### Step 2.2: Database Models (SQLAlchemy)
```python
# app/db/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DATABASE_ECHO,
    future=True
)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

```python
# app/models/merchant.py
from sqlalchemy import Column, String, Boolean, DateTime, Enum, Integer, Text, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.db.database import Base

class PlanType(str, enum.Enum):
    FREE = "Free"
    PREMIUM = "Premium"

class UserRole(str, enum.Enum):
    MERCHANT = "merchant"
    ADMIN = "admin"

class AccountStatus(str, enum.Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    PENDING = "pending"

class Merchant(Base):
    __tablename__ = "merchants"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    plan = Column(Enum(PlanType), nullable=False, default=PlanType.FREE, index=True)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.MERCHANT)
    status = Column(Enum(AccountStatus), nullable=False, default=AccountStatus.ACTIVE, index=True)
    
    # OAuth fields
    provider = Column(String(100))
    provider_id = Column(String(255))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login_at = Column(DateTime(timezone=True))
    deleted_at = Column(DateTime(timezone=True))
    
    # Relationships
    profile = relationship("MerchantProfile", back_populates="merchant", uselist=False)
    policies = relationship("Policy", back_populates="merchant")

class MerchantProfile(Base):
    __tablename__ = "merchant_profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id", ondelete="CASCADE"), unique=True)
    
    # Contact info
    phone = Column(String(50))
    mobile = Column(String(50))
    website = Column(String(255))
    function = Column(String(100))  # Job position
    
    # Company info
    company_name = Column(String(255))
    vat = Column(String(50))
    
    # Address
    street = Column(String(255))
    street2 = Column(String(255))
    city = Column(String(100))
    state_name = Column(String(100))
    zip = Column(String(20))
    country_name = Column(String(100), default="ประเทศไทย")
    
    # Preferences
    lang = Column(String(10), default="th_TH")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    merchant = relationship("Merchant", back_populates="profile")
```

### Step 2.3: Pydantic Schemas
```python
# app/schemas/auth.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserRegister(UserBase):
    password: str = Field(..., min_length=6)
    phone: Optional[str] = None
    company: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    plan: str
    phone: Optional[str] = ""
    company: Optional[str] = ""
    created_at: datetime
    
    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    success: bool
    data: dict

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
```

### Step 2.4: Authentication Service
```python
# app/services/auth_service.py
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.merchant import Merchant, MerchantProfile, PlanType
from app.schemas.auth import UserRegister, UserLogin, UserResponse
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> dict:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            return payload
        except JWTError:
            raise ValueError("INVALID_TOKEN")
    
    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[Merchant]:
        result = await db.execute(
            select(Merchant).where(Merchant.email == email, Merchant.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[dict]:
        # Demo user check
        if email == "demo@flowpdpa.co.th" and password == "demo1234":
            return {
                "id": "demo-user-id",
                "email": "demo@flowpdpa.co.th",
                "name": "Demo User",
                "plan": PlanType.PREMIUM.value,
                "phone": "02-xxx-xxxx",
                "company": "Demo Company"
            }
        
        user = await AuthService.get_user_by_email(db, email)
        if not user:
            return None
        
        if not AuthService.verify_password(password, user.password_hash):
            return None
        
        # Update last login
        user.last_login_at = datetime.utcnow()
        await db.commit()
        
        return {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "plan": user.plan.value,
            "phone": user.profile.phone if user.profile else "",
            "company": user.profile.company_name if user.profile else ""
        }
    
    @staticmethod
    async def create_user(db: AsyncSession, user_data: UserRegister) -> Merchant:
        # Check if user exists
        existing_user = await AuthService.get_user_by_email(db, user_data.email)
        if existing_user:
            raise ValueError("EMAIL_ALREADY_EXISTS")
        
        # Create merchant
        merchant = Merchant(
            email=user_data.email,
            password_hash=AuthService.get_password_hash(user_data.password),
            name=user_data.name,
            plan=PlanType.FREE
        )
        
        db.add(merchant)
        await db.flush()  # Get the ID
        
        # Create profile
        profile = MerchantProfile(
            merchant_id=merchant.id,
            phone=user_data.phone or "",
            company_name=user_data.company or ""
        )
        
        db.add(profile)
        await db.commit()
        await db.refresh(merchant)
        
        return merchant
```

### Step 2.5: FastAPI Dependencies & Routes
```python
# app/api/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.services.auth_service import AuthService
from app.models.merchant import Merchant, PlanType

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Get current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = AuthService.verify_token(credentials.credentials)
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except ValueError:
        raise credentials_exception
    
    # For demo user
    if email == "demo@flowpdpa.co.th":
        return {
            "id": "demo-user-id",
            "email": "demo@flowpdpa.co.th",
            "name": "Demo User",
            "plan": PlanType.PREMIUM.value
        }
    
    user = await AuthService.get_user_by_email(db, email)
    if user is None:
        raise credentials_exception
    
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "plan": user.plan.value
    }

def require_plan(required_plan: PlanType):
    """Dependency to require specific plan"""
    async def plan_checker(current_user: dict = Depends(get_current_user)):
        if required_plan == PlanType.PREMIUM and current_user["plan"] != PlanType.PREMIUM.value:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail={
                    "code": "PREMIUM_FEATURE",
                    "message": "ภาษาอังกฤษและฟีเจอร์ขั้นสูงต้องใช้แผน Premium"
                }
            )
        return current_user
    return plan_checker
```

```python
# app/api/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.auth import UserRegister, UserLogin, AuthResponse
from app.services.auth_service import AuthService
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/register", response_model=AuthResponse)
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register new user"""
    try:
        merchant = await AuthService.create_user(db, user_data)
        
        access_token = AuthService.create_access_token(
            data={"sub": merchant.email, "role": "merchant", "plan": merchant.plan.value}
        )
        
        return {
            "success": True,
            "data": {
                "user": {
                    "id": str(merchant.id),
                    "email": merchant.email,
                    "name": merchant.name,
                    "plan": merchant.plan.value,
                    "phone": user_data.phone or "",
                    "company": user_data.company or "",
                    "createdAt": merchant.created_at
                },
                "token": access_token
            }
        }
    except ValueError as e:
        if str(e) == "EMAIL_ALREADY_EXISTS":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "EMAIL_EXISTS", "message": "อีเมลนี้ถูกใช้งานแล้ว"}
            )
        raise

@router.post("/login", response_model=AuthResponse)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login user"""
    user = await AuthService.authenticate_user(db, credentials.email, credentials.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "INVALID_CREDENTIALS",
                "message": "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
            }
        )
    
    access_token = AuthService.create_access_token(
        data={"sub": user["email"], "role": "merchant", "plan": user["plan"]}
    )
    
    return {
        "success": True,
        "data": {
            "user": user,
            "token": access_token
        }
    }

@router.get("/verify", response_model=AuthResponse)
async def verify_token(current_user: dict = Depends(get_current_user)):
    """Verify JWT token and return user info"""
    return {
        "success": True,
        "data": {
            "valid": True,
            "user": current_user
        }
    }
```

---

## 💳 Phase 3: Stripe Payment Integration (Days 5-7)

### Step 3.1: Stripe Service Setup
```python
# app/services/stripe_service.py
import stripe
from typing import Dict, Any
from app.core.config import settings

stripe.api_key = settings.STRIPE_API_KEY

class StripeService:
    @staticmethod
    async def create_checkout_session(
        user_id: str,
        user_email: str,
        plan_type: str
    ) -> Dict[str, Any]:
        """Create Stripe checkout session for plan upgrade"""
        
        price_id = settings.STRIPE_PRICE_PREMIUM if plan_type == "Premium" else settings.STRIPE_PRICE_FREE
        
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='payment',
            success_url=f'{settings.CORS_ORIGINS[0]}/dashboard?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{settings.CORS_ORIGINS[0]}/dashboard?cancelled=true',
            customer_email=user_email,
            metadata={
                'user_id': user_id,
                'plan_type': plan_type
            }
        )
        
        return {
            "checkout_url": session.url,
            "session_id": session.id
        }
    
    @staticmethod
    async def handle_webhook_event(payload: bytes, sig_header: str) -> Dict[str, Any]:
        """Handle Stripe webhook events"""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            raise ValueError("Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            raise ValueError("Invalid signature")
        
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            customer_email = session.get('customer_details', {}).get('email')
            metadata = session.get('metadata', {})
            
            return {
                "event_type": "payment_completed",
                "user_id": metadata.get('user_id'),
                "plan_type": metadata.get('plan_type'),
                "customer_email": customer_email,
                "amount_total": session.get('amount_total')
            }
        
        return {"event_type": event['type']}
```

### Step 3.2: Payment Routes
```python
# app/api/payments.py
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict

from app.db.database import get_db
from app.services.stripe_service import StripeService
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/create-checkout-session")
async def create_checkout_session(
    plan_type: str,
    current_user: Dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create Stripe checkout session for plan upgrade"""
    if plan_type not in ["Free", "Premium"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan type"
        )
    
    stripe_service = StripeService()
    checkout_data = await stripe_service.create_checkout_session(
        user_id=current_user["id"],
        user_email=current_user["email"],
        plan_type=plan_type
    )
    
    return {
        "success": True,
        "data": checkout_data
    }

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    stripe_service = StripeService()
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event_data = await stripe_service.handle_webhook_event(payload, sig_header)
        
        if event_data["event_type"] == "payment_completed":
            # Update user plan in database
            await update_user_plan(
                user_id=event_data["user_id"],
                new_plan=event_data["plan_type"]
            )
        
        return {"success": True}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

async def update_user_plan(user_id: str, new_plan: str):
    """Update user plan after successful payment"""
    from app.db.database import AsyncSessionLocal
    from app.models.merchant import Merchant, PlanType
    from sqlalchemy import select, update
    
    async with AsyncSessionLocal() as db:
        query = (
            update(Merchant)
            .where(Merchant.id == user_id)
            .values(plan=PlanType.PREMIUM if new_plan == "Premium" else PlanType.FREE)
        )
        await db.execute(query)
        await db.commit()
```

---

## 📧 Phase 4: AWS SES Email Service (Days 8-9)

### Step 4.1: AWS SES Service Setup
```python
# app/services/email_service.py
import boto3
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List
import os

from app.core.config import settings

class SESEmailService:
    def __init__(self):
        self.client = boto3.client(
            'ses',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
    
    async def send_email(
        self,
        to_addresses: List[str],
        subject: str,
        html_body: str,
        text_body: str = None
    ) -> Dict[str, Any]:
        """Send email via AWS SES"""
        
        # Create MIME message
        msg = MIMEMultipart('alternative')
        msg['From'] = f"{settings.AWS_SES_FROM_NAME} <{settings.AWS_SES_FROM_EMAIL}>"
        msg['To'] = ', '.join(to_addresses)
        msg['Subject'] = subject
        
        # Add HTML body
        html_part = MIMEText(html_body, 'html')
        msg.attach(html_part)
        
        # Add text body if provided
        if text_body:
            text_part = MIMEText(text_body, 'plain')
            msg.attach(text_part)
        
        try:
            response = self.client.send_raw_email(
                Source=settings.AWS_SES_FROM_EMAIL,
                Destinations={'ToAddresses': to_addresses},
                RawMessage={'Data': msg.as_string()}
            )
            
            return {
                "success": True,
                "message_id": response['MessageId'],
                "response": response
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def send_forgot_password_email(
        self,
        to_email: str,
        user_name: str,
        reset_link: str
    ) -> Dict[str, Any]:
        """Send password reset email"""
        
        subject = "รีเซ็ตรหัสผ่าน FlowPDPA ของคุณ"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: 'Sarabun', sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ text-align: center; padding: 20px 0; }}
                .logo {{ font-size: 24px; font-weight: bold; color: #059669; }}
                .content {{ background: #f8fafc; padding: 30px; border-radius: 8px; }}
                .button {{ display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 30px; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">FlowPDPA</div>
                </div>
                <div class="content">
                    <h2>สวัสดีคุณ{user_name},</h2>
                    <p>เราได้รับคำขอให้รีเซ็ตรหัสผ่านสำหรับบัญชี FlowPDPA ของคุณ</p>
                    
                    <p>หากคุณไม่ได้ทำการขอรีเซ็ตรหัสผ่าน กรุณาละเว้นอีเมลฉบับนี้</p>
                    
                    <a href="{reset_link}" class="button">รีเซ็ตรหัสผ่าน</a>
                    
                    <p>ลิงก์นี้จะหมดอายุภายใน 1 ชั่วโมง</p>
                </div>
                <div class="footer">
                    <p>© 2024 FlowPDPA. All rights reserved.</p>
                    <p>อีเมลฉบับนี้เป็นอีเมลอัตโนมัติ กรุณาอย่าตอบกลับ</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        สวัสดีคุณ{user_name},
        
        เราได้รับคำขอให้รีเซ็ตรหัสผ่านสำหรับบัญชี FlowPDPA ของคุณ
        
        หากคุณไม่ได้ทำการขอรีเซ็ตรหัสผ่าน กรุณาละเว้นอีเมลฉบับนี้
        
        คลิกลิงก์ด้านล่างเพื่อรีเซ็ตรหัสผ่าน:
        {reset_link}
        
        ลิงก์นี้จะหมดอายุภายใน 1 ชั่วโมง
        """
        
        return await self.send_email(
            to_addresses=[to_email],
            subject=subject,
            html_body=html_body,
            text_body=text_body
        )
```

### Step 4.2: Forgot Password Routes
```python
# app/api/password.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import secrets
import hashlib
from datetime import datetime, timedelta

from app.db.database import get_db
from app.services.email_service import SESEmailService
from app.services.auth_service import AuthService
from app.models.merchant import Merchant

router = APIRouter()

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """Send password reset email via AWS SES"""
    
    user = await AuthService.get_user_by_email(db, request.email)
    if not user:
        # Don't reveal whether email exists
        return {"success": True, "message": "If email exists, reset link will be sent"}
    
    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(reset_token.encode()).hexdigest()
    
    # Store token with expiration (in a real app, store in database)
    expiry = datetime.utcnow() + timedelta(hours=1)
    
    # Create reset link
    reset_link = f"{settings.CORS_ORIGINS[0]}/reset-password?token={reset_token}"
    
    # Send email
    email_service = SESEmailService()
    email_result = await email_service.send_forgot_password_email(
        to_email=user.email,
        user_name=user.name,
        reset_link=reset_link
    )
    
    if email_result.get("success"):
        return {
            "success": True,
            "message": "ระบบได้ส่งอีเมลรีเซ็ตรหัสผ่านแล้ว กรุณาตรวจสอบอีเมลของคุณ"
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send reset email"
        )

@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """Reset password using token from email"""
    
    # Verify token (in a real app, check database)
    try:
        token_hash = hashlib.sha256(request.token.encode()).hexdigest()
        # Here you would verify the token exists in database and is not expired
        # For demo, we'll skip this verification
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # In a real implementation, get user email from token and update password
    # For now, return success
    return {
        "success": True,
        "message": "รหัสผ่านถูกรีเซ็ตเรียบร้อยแล้ว"
    }
```

---

## 🎯 Phase 5: Policy Generation System (Days 10-15)

### Step 5.1: Policy Generation Models & Schemas
```python
# app/schemas/policy.py
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal

class PolicyGenerateRequest(BaseModel):
    policyType: Literal['privacy', 'hr', 'cctv', 'recruitment', 'vendor', 'dpa']
    agreedToTerms: bool
    
    # Business Info
    websiteName: str = Field(..., min_length=2)
    websiteUrl: str = Field(..., regex=r'^https?://')
    businessType: str
    contactEmail: EmailStr
    contactPhone: Optional[str] = None
    address: Optional[str] = None
    
    # Data Types
    dataTypes: List[str] = Field(..., min_items=1)
    hasCookies: str = Field(..., regex=r'^(ใช่|ไม่ใช่)$')
    hasUserAccounts: str = Field(..., regex=r'^(ใช่|ไม่ใช่)$')
    
    # Purposes & Third Parties
    purposes: List[str] = Field(..., min_items=1)
    thirdParties: List[str]
    
    # Settings
    language: Literal['th', 'en', 'both'] = 'th'
    exportFormat: List[str] = Field(default=['PDF'])
    dpoEmail: Optional[EmailStr] = None
    retentionPeriod: str

class PolicyResponse(BaseModel):
    policyId: str
    slug: str
    shareUrl: str
    name: str
    type: str
    status: str
    content: dict
    downloads: dict
    createdAt: str
```

### Step 5.2: AI Policy Generation Service
```python
# app/services/policy_generator_service.py
import openai
import anthropic
import re
from typing import Dict, Optional
import uuid

from app.core.config import settings

class PolicyGeneratorService:
    def __init__(self):
        self.openai_client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.anthropic_client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    
    async def generate_policy(
        self,
        form_data: Dict,
        user_plan: str,
        merchant_id: str
    ) -> Dict:
        """Generate policy using AI"""
        
        # Check plan permissions
        language = form_data.get('language', 'th')
        if language in ['en', 'both'] and user_plan != 'Premium':
            raise ValueError('PREMIUM_FEATURE')
        
        # Load template
        template = await self._load_template(form_data['policyType'], 'th')
        
        # Build AI prompt
        prompt = self._build_ai_prompt(template, form_data, user_plan)
        
        # Generate Thai content
        thai_content = await self._call_ai_service(prompt)
        
        # Generate English content if needed
        english_content = None
        if language in ['both', 'en']:
            template_en = await self._load_template(form_data['policyType'], 'en')
            prompt_en = self._build_ai_prompt(template_en, form_data, user_plan)
            english_content = await self._call_ai_service(prompt_en)
        
        # Generate slug
        slug = self._generate_slug(form_data['websiteUrl'], form_data['policyType'])
        
        # Generate download URLs
        downloads = await self._generate_download_files(slug)
        
        return {
            'policyId': str(uuid.uuid4()),
            'slug': slug,
            'shareUrl': f'https://flowpdpa.co.th/p/{slug}',
            'name': self._get_policy_name(form_data['policyType']),
            'type': form_data['policyType'],
            'status': 'active',
            'content': {
                'th': thai_content,
                'en': english_content
            },
            'downloads': downloads,
            'createdAt': '2024-01-15T10:00:00Z'
        }
    
    async def _load_template(self, policy_type: str, language: str) -> str:
        """Load policy template from database or files"""
        # In production, load from database or file system
        return self._get_template_content(policy_type, language)
    
    def _build_ai_prompt(self, template: str, form_data: Dict, plan: str) -> str:
        """Build AI prompt for policy generation"""
        
        return f"""
You are a legal document assistant specializing in Thai PDPA compliance.
Your task is to customize the following legal template based on client information.

BASE TEMPLATE:
{template}

CLIENT INFORMATION:
- Company: {form_data['websiteName']}
- Website: {form_data['websiteUrl']}
- Business Type: {form_data['businessType']}
- Contact Email: {form_data['contactEmail']}
- Contact Phone: {form_data.get('contactPhone', 'N/A')}
- Address: {form_data.get('address', 'N/A')}

DATA COLLECTED:
{chr(10).join([f"- {dt}" for dt in form_data['dataTypes']])}

HAS COOKIES: {form_data['hasCookies']}
HAS USER ACCOUNTS: {form_data['hasUserAccounts']}

PURPOSES:
{chr(10).join([f"- {p}" for p in form_data['purposes']])}

THIRD PARTIES:
{chr(10).join([f"- {tp}" for tp in form_data.get('thirdParties', [])])}

DPO EMAIL: {form_data.get('dpoEmail') or form_data['contactEmail']}
RETENTION PERIOD: {form_data['retentionPeriod']}

USER PLAN: {plan}

INSTRUCTIONS:
1. Replace all placeholders with actual client data
2. Include conditional sections based on client data
3. Keep all legal wording EXACTLY as in the template
4. Ensure PDPA Thailand compliance
5. If Premium plan, include additional GDPR references
6. Return only the completed policy text

Generate the complete customized policy now:
"""
    
    async def _call_ai_service(self, prompt: str) -> str:
        """Call AI service (OpenAI or Anthropic)"""
        try:
            # Try OpenAI first
            response = await self.openai_client.chat.completions.create(
                model='gpt-4-turbo',
                messages=[{'role': 'user', 'content': prompt}],
                temperature=0.3,
                max_tokens=4000
            )
            return response.choices[0].message.content or ''
        except Exception as e:
            # Fallback to Anthropic
            try:
                response = await self.anthropic_client.messages.create(
                    model='claude-3-5-sonnet-20241022',
                    max_tokens=4000,
                    messages=[{'role': 'user', 'content': prompt}]
                )
                if response.content[0].type == 'text':
                    return response.content[0].text
                return ''
            except Exception:
                raise ValueError('AI_SERVICE_UNAVAILABLE')
    
    def _generate_slug(self, website_url: str, policy_type: str) -> str:
        """Generate URL-friendly slug"""
        domain = re.sub(r'https?://', '', website_url).replace('/', '')
        slug = f"{domain}-{policy_type}".lower()
        slug = re.sub(r'[^a-z0-9-]', '-', slug)
        return slug
    
    async def _generate_download_files(self, slug: str) -> Dict:
        """Generate download file URLs"""
        # In production, generate actual PDF/Word files and upload to S3
        policy_id = uuid.uuid4().hex[:8]
        
        return {
            'pdf': f'https://cdn.flowpdpa.co.th/policies/{policy_id}.pdf',
            'docx': f'https://cdn.flowpdpa.co.th/policies/{policy_id}.docx',
            'txt': f'https://cdn.flowpdpa.co.th/policies/{policy_id}.txt',
            'html': f'<script src="https://flowpdpa.co.th/embed/{policy_id}"></script>'
        }
    
    def _get_policy_name(self, policy_type: str) -> str:
        """Get human-readable policy name"""
        names = {
            'privacy': 'Privacy + Cookies Policy',
            'hr': 'HR Privacy Policy',
            'cctv': 'CCTV Policy',
            'recruitment': 'Recruitment Privacy Policy',
            'vendor': 'Vendor Privacy Policy',
            'dpa': 'Data Processing Agreement'
        }
        return names.get(policy_type, 'Policy')
    
    def _get_template_content(self, policy_type: str, language: str) -> str:
        """Get template content (placeholder for implementation)"""
        return f"POLICY TEMPLATE for {policy_type} in {language}"
```

### Step 5.3: Policy Routes
```python
# app/api/policies.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.policy import PolicyGenerateRequest, PolicyResponse
from app.services.policy_generator_service import PolicyGeneratorService
from app.api.deps import get_current_user, require_plan
from app.models.merchant import PlanType

router = APIRouter()

@router.post("/generate")
async def generate_policy(
    form_data: PolicyGenerateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate AI-powered policy"""
    try:
        policy_service = PolicyGeneratorService()
        
        policy = await policy_service.generate_policy(
            form_data=form_data.dict(),
            user_plan=current_user['plan'],
            merchant_id=current_user['id']
        )
        
        return {
            "success": True,
            "data": policy
        }
        
    except ValueError as e:
        if str(e) == 'PREMIUM_FEATURE':
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail={
                    "code": "PREMIUM_FEATURE",
                    "message": "ภาษาอังกฤษและฟีเจอร์ขั้นสูงต้องใช้แผน Premium"
                }
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/")
async def get_user_policies(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all policies for current user"""
    # Implementation would query database for user's policies
    return {
        "success": True,
        "data": {
            "policies": [],
            "total": 0
        }
    }

@router.get("/public/{slug}")
async def get_public_policy(slug: str, db: AsyncSession = Depends(get_db)):
    """Get public policy by slug (no auth required)"""
    # Implementation would query database for public policy
    return {
        "success": True,
        "data": {
            "policy": {
                "name": "Privacy + Cookies Policy",
                "type": "privacy",
                "content": {
                    "th": "Full policy text...",
                    "en": "Full policy text..."
                },
                "company": {
                    "name": "Example Company",
                    "url": "https://example.com",
                    "email": "contact@example.com"
                },
                "generatedAt": "2024-01-15T10:00:00Z"
            }
        }
    }
```

---

## 🎫 Phase 4: Helpdesk/Ticket System (Days 11-13)

### Step 4.1: Ticket Service Implementation
```typescript
// src/services/ticket.service.ts
import { pool } from '../config/database';

interface TicketPayload {
  partner_name: string;
  partner_email: string;
  partner_phone?: string;
  partner_company_name?: string;
  name: string; // Subject
  ticket_type_id?: number | null;
  ticket_type_label?: string;
  priority: 'normal' | 'low' | 'high' | 'urgent';
  tag_ids?: string[];
  description: string;
}

export class TicketService {
  async submitTicket(payload: TicketPayload): Promise<any> {
    const ticketId = `TKT-${Date.now().toString(36).toUpperCase()}`;
    
    const result = await pool.query(
      `INSERT INTO tickets 
       (id, partner_name, partner_email, partner_phone, partner_company_name, 
        name, priority, tag_ids, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        ticketId,
        payload.partner_name,
        payload.partner_email,
        payload.partner_phone || '',
        payload.partner_company_name || '',
        payload.name,
        payload.priority,
        payload.tag_ids || [],
        payload.description
      ]
    );
    
    // Sync with Odoo if configured
    if (process.env.ODOO_URL) {
      await this.syncToOdoo(result.rows[0]);
    }
    
    return {
      ticketId,
      status: 'open',
      createdAt: result.rows[0].created_at
    };
  }

  async getTicket(ticketId: string): Promise<any> {
    const result = await pool.query(
      'SELECT * FROM tickets WHERE id = $1',
      [ticketId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('TICKET_NOT_FOUND');
    }
    
    return result.rows[0];
  }

  private async syncToOdoo(ticket: any): Promise<void> {
    // Odoo integration implementation
    // Use existing Odoo helpdesk.ticket creation
  }
}
```

---

## 📊 Phase 5: Profile & User Management (Days 14-15)

### Step 5.1: Profile Service
```typescript
// src/services/profile.service.ts
import { pool } from '../config/database';

interface ProfileData {
  name: string;
  function?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  company_name?: string;
  vat?: string;
  street?: string;
  street2?: string;
  city?: string;
  state_name?: string;
  zip?: string;
  country_name?: string;
  lang?: string;
}

export class ProfileService {
  async getProfile(userId: string): Promise<any> {
    const result = await pool.query(
      `SELECT m.id, m.name, m.email, m.plan, m.created_at,
              mp.function, mp.phone, mp.mobile, mp.website,
              mp.company_name, mp.vat,
              mp.street, mp.street2, mp.city, mp.state_name, mp.zip, mp.country_name,
              mp.lang
       FROM merchants m
       LEFT JOIN merchant_profiles mp ON m.id = mp.merchant_id
       WHERE m.id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('USER_NOT_FOUND');
    }
    
    return this.formatProfile(result.rows[0]);
  }

  async updateProfile(userId: string, data: ProfileData): Promise<any> {
    // Update merchant
    await pool.query(
      'UPDATE merchants SET name = $1, updated_at = NOW() WHERE id = $2',
      [data.name, userId]
    );
    
    // Update profile
    await pool.query(
      `UPDATE merchant_profiles 
       SET function = $1, phone = $2, mobile = $3, website = $4,
           company_name = $5, vat = $6, street = $7, street2 = $8,
           city = $9, state_name = $10, zip = $11, country_name = $12,
           lang = $13, updated_at = NOW()
       WHERE merchant_id = $14`,
      [
        data.function || '', data.phone || '', data.mobile || '', data.website || '',
        data.company_name || '', data.vat || '', data.street || '', data.street2 || '',
        data.city || '', data.state_name || '', data.zip || '', data.country_name || 'ประเทศไทย',
        data.lang || 'th_TH', userId
      ]
    );
    
    return this.getProfile(userId);
  }

  private formatProfile(row: any): any {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      plan: row.plan,
      function: row.function || '',
      phone: row.phone || '',
      mobile: row.mobile || '',
      website: row.website || '',
      company_name: row.company_name || '',
      vat: row.vat || '',
      address: {
        street: row.street || '',
        street2: row.street2 || '',
        city: row.city || '',
        state: row.state_name || '',
        zip: row.zip || '',
        country: row.country_name || 'ประเทศไทย'
      },
      lang: row.lang || 'th_TH',
      createdAt: row.created_at
    };
  }
}
```

---

## 🚀 Phase 6: API Routes & Express Setup (Days 16-17)

### Step 6.1: Main Express Application
```typescript
// src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.routes';
import { policyRouter } from './routes/policy.routes';
import { profileRouter } from './routes/profile.routes';
import { ticketRouter } from './routes/ticket.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/auth', authRouter);
app.use('/policies', policyRouter);
app.use('/profile', profileRouter);
app.use('/tickets', ticketRouter);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Internal server error'
    }
  });
});

app.listen(PORT, () => {
  console.log(`FlowPDPA API server running on port ${PORT}`);
});
```

### Step 6.2: Route Implementations
```typescript
// src/routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const controller = new AuthController();

router.post('/register', (req, res) => controller.register(req, res));
router.post('/login', (req, res) => controller.login(req, res));
router.get('/verify', controller.authenticate.bind(controller), (req, res) => controller.verify(req, res));

export { router as authRouter };

// src/routes/policy.routes.ts
import { Router } from 'express';
import { PolicyController } from '../controllers/policy.controller';
import { authenticate, requirePlan } from '../middleware/auth.middleware';

const router = Router();
const controller = new PolicyController();

router.post('/generate', authenticate, (req, res) => controller.generatePolicy(req, res));
router.get('/', authenticate, (req, res) => controller.getUserPolicies(req, res));
router.get('/public/:slug', (req, res) => controller.getPublicPolicy(req, res));

export { router as policyRouter };
```

---

## 🚀 Phase 6: Docker & Deployment (Days 16-18)

### Step 6.1: FastAPI Docker Setup
```dockerfile
# Dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Step 6.2: Docker Compose Configuration
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: flowpdpa-postgres
    environment:
      POSTGRES_DB: flowpdpa
      POSTGRES_USER: flowpdpa
      POSTGRES_PASSWORD: secure_password_change_in_production
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U flowpdpa"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: .
    container_name: flowpdpa-backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://flowpdpa:secure_password_change_in_production@postgres:5432/flowpdpa
      - SECRET_KEY=your-production-secret-key-min-32-characters
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - STRIPE_API_KEY=${STRIPE_API_KEY}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    container_name: flowpdpa-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

### Step 6.3: Nginx Configuration
```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream fastapi {
        server backend:8000;
    }

    server {
        listen 80;
        server_name api.flowpdpa.co.th;

        client_max_body_size 10M;

        location / {
            proxy_pass http://fastapi;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /health {
            proxy_pass http://fastapi/health;
            access_log off;
        }
    }

    # HTTPS configuration (uncomment when SSL certificates are available)
    # server {
    #     listen 443 ssl http2;
    #     server_name api.flowpdpa.co.th;
    #
    #     ssl_certificate /etc/nginx/ssl/cert.pem;
    #     ssl_certificate_key /etc/nginx/ssl/key.pem;
    #
    #     location / {
    #         proxy_pass http://fastapi;
    #         proxy_set_header Host $host;
    #         proxy_set_header X-Real-IP $remote_addr;
    #         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    #         proxy_set_header X-Forwarded-Proto $scheme;
    #     }
    # }
}
```

---

## 🧪 Phase 7: Testing & Quality Assurance (Days 19-21)

### Step 7.1: Testing Setup
```python
# tests/conftest.py
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.database import Base, get_db

# Test database
TEST_DATABASE_URL = "postgresql+asyncpg://test:test@localhost:5432/flowpdpa_test"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestingSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

@pytest.fixture(scope="function")
async def db_session():
    """Create a new database session for each test"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with TestingSessionLocal() as session:
        yield session
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def client(db_session):
    """Create test client with database override"""
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()
```

### Step 7.2: Authentication Tests
```python
# tests/test_auth.py
import pytest
from tests.conftest import client

class TestAuthentication:
    @pytest.mark.asyncio
    async def test_register_new_user(self, client: AsyncClient):
        """Test user registration"""
        response = await client.post(
            "/auth/register",
            json={
                "name": "Test User",
                "email": "test@example.com",
                "password": "password123",
                "phone": "0812345678",
                "company": "Test Company"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["user"]["plan"] == "Free"
        assert "token" in data["data"]
        assert data["data"]["user"]["email"] == "test@example.com"

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client: AsyncClient):
        """Test duplicate email registration"""
        user_data = {
            "name": "Test User",
            "email": "duplicate@example.com",
            "password": "password123"
        }
        
        # First registration
        await client.post("/auth/register", json=user_data)
        
        # Duplicate registration
        response = await client.post("/auth/register", json=user_data)
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data

    @pytest.mark.asyncio
    async def test_login_valid_credentials(self, client: AsyncClient):
        """Test successful login"""
        # Register user first
        await client.post(
            "/auth/register",
            json={
                "name": "Login User",
                "email": "login@example.com",
                "password": "password123"
            }
        )
        
        # Login
        response = await client.post(
            "/auth/login",
            json={
                "email": "login@example.com",
                "password": "password123"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "token" in data["data"]
        assert data["data"]["user"]["email"] == "login@example.com"

    @pytest.mark.asyncio
    async def test_login_invalid_credentials(self, client: AsyncClient):
        """Test login with invalid credentials"""
        response = await client.post(
            "/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "wrongpassword"
            }
        )
        
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

    @pytest.mark.asyncio
    async def test_demo_user_login(self, client: AsyncClient):
        """Test demo user login"""
        response = await client.post(
            "/auth/login",
            json={
                "email": "demo@flowpdpa.co.th",
                "password": "demo1234"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["user"]["plan"] == "Premium"
        assert data["data"]["user"]["email"] == "demo@flowpdpa.co.th"
```

### Step 7.3: Policy Generation Tests
```python
# tests/test_policies.py
import pytest
from tests.conftest import client

class TestPolicyGeneration:
    @pytest.mark.asyncio
    async def test_generate_policy_free_plan_thai_only(self, client: AsyncClient):
        """Test policy generation with Free plan (Thai only)"""
        # Register and login user
        register_response = await client.post(
            "/auth/register",
            json={
                "name": "Policy User",
                "email": "policy@example.com",
                "password": "password123"
            }
        )
        token = register_response.json()["data"]["token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        
        policy_data = {
            "policyType": "privacy",
            "agreedToTerms": True,
            "websiteName": "Test Website",
            "websiteUrl": "https://testwebsite.com",
            "businessType": "ร้านค้าออนไลน์ (E-Commerce)",
            "contactEmail": "contact@testwebsite.com",
            "dataTypes": ["name", "email", "phone"],
            "hasCookies": "ใช่",
            "hasUserAccounts": "ไม่ใช่",
            "purposes": ["service", "order"],
            "thirdParties": [],
            "language": "th",
            "retentionPeriod": "2 ปี"
        }
        
        response = await client.post(
            "/policies/generate",
            json=policy_data,
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "policyId" in data["data"]
        assert data["data"]["type"] == "privacy"

    @pytest.mark.asyncio
    async def test_generate_policy_premium_required(self, client: AsyncClient):
        """Test that English policy requires Premium plan"""
        # Register Free plan user
        register_response = await client.post(
            "/auth/register",
            json={
                "name": "Free User",
                "email": "freeuser@example.com",
                "password": "password123"
            }
        )
        token = register_response.json()["data"]["token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Try to generate English policy with Free plan
        policy_data = {
            "policyType": "privacy",
            "agreedToTerms": True,
            "websiteName": "Test Site",
            "websiteUrl": "https://testsite.com",
            "businessType": "SME / วิสาหกิจขนาดกลางและเล็ก",
            "contactEmail": "info@testsite.com",
            "dataTypes": ["name", "email"],
            "hasCookies": "ไม่ใช่",
            "hasUserAccounts": "ไม่ใช่",
            "purposes": ["service"],
            "thirdParties": [],
            "language": "en",  # English requires Premium
            "retentionPeriod": "1 ปี"
        }
        
        response = await client.post(
            "/policies/generate",
            json=policy_data,
            headers=headers
        )
        
        assert response.status_code == 402
        data = response.json()
        assert data["detail"]["code"] == "PREMIUM_FEATURE"
```

### Step 7.4: Run Tests
```bash
# Run all tests
pytest tests/ -v

# Run specific test file
pytest tests/test_auth.py -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html

# Run specific test
pytest tests/test_auth.py::TestAuthentication::test_register_new_user -v
```

---

## 📅 Implementation Timeline (FastAPI Version)

### Week 1: Foundation & Authentication
- Days 1-2: Project setup, FastAPI configuration, database schema
- Days 3-4: Authentication system, JWT tokens, user management
- Days 5-7: Stripe payment integration

### Week 2: Core Services
- Days 8-9: AWS SES email service, password reset
- Days 10-12: Policy generation system, AI integration
- Days 13-15: Helpdesk/ticket system

### Week 3: Polish & Deploy
- Days 16-18: Docker setup, API routes, testing
- Days 19-21: Integration testing, bug fixes, deployment

---

## 🎯 Success Criteria (FastAPI Version)

✅ **All frontend API calls work perfectly**  
✅ **Authentication matches frontend expectations**  
✅ **Stripe payment integration works**  
✅ **AWS SES email sending works**  
✅ **Policy generation produces valid Thai policies**  
✅ **Database schema matches API specification**  
✅ **Docker deployment ready**  
✅ **All tests passing**

---

## 🚀 Quick Start Commands

```bash
# 1. Clone and setup
git clone <repo>
cd flowpdpa-backend
python -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 4. Run database migrations
# (Implement Alembic migrations)

# 5. Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 6. Run tests
pytest tests/ -v

# 7. Docker deployment
docker-compose up -d

# 8. Check health
curl http://localhost:8000/health
```

---

## 📅 Implementation Timeline

### Week 1: Foundation
- Days 1-2: Project setup, database schema
- Days 3-4: Authentication system
- Days 5-7: Basic API structure

### Week 2: Core Features  
- Days 8-10: Policy generation system
- Days 11-13: Helpdesk/ticket system
- Days 14-15: User profile management

### Week 3: Polish & Deploy
- Days 16-17: Routes, middleware, validation
- Days 18-19: Testing, bug fixes
- Days 20-21: Deployment, documentation

---

## 🎯 Success Criteria

✅ **All frontend API calls work perfectly**  
✅ **Authentication matches frontend expectations**  
✅ **Policy generation produces valid Thai policies**  
✅ **Database schema matches API specification**  
✅ **Odoo integration works when configured**  
✅ **Security best practices implemented**  
✅ **Deployment ready for production**

---

## 🚀 Next Steps

1. **Start with Phase 1** - Set up project structure
2. **Implement database** - Run migrations
3. **Build authentication** - Test with frontend login
4. **Add policy generation** - Integrate AI service
5. **Deploy & test** - Connect with existing frontend

Follow this guide systematically and you'll have a production-ready backend that perfectly matches your FlowPDPA frontend! 🎯