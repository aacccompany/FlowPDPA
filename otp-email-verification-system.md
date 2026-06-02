# FlowPDPA — OTP Email Verification System

**Feature:** Email-based OTP verification during registration  
**Tech Stack:** FastAPI + AWS SES + PostgreSQL  
**Security:** Rate limiting, OTP expiration, resend limits

---

## 📋 System Overview

### Registration Flow with OTP
```
┌─────────────────────────────────────────────────────────────────────────┐
│                    OTP VERIFICATION FLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. REGISTER FORM                                                    │
│     ┌─────────────────────────────────────────────────────────────────┐ │
│     │ User fills: name, email, password, phone, company          │ │ │
│     │ POST /auth/register/initiate                                 │ │ │
│     └─────────────────────────────────────────────────────────────────┘ │
│                              │                                          │
│                              ▼                                          │
│     ┌─────────────────────────────────────────────────────────────────┐ │
│     │ BACKEND: Create pending user record                          │ │
│     │ • Generate 6-digit OTP                                        │ │
│     │ • Hash OTP and store in database                             │ │
│     │ • Set user status = 'pending'                                │ │
│     │ • Send OTP email via AWS SES                                 │ │
│     └─────────────────────────────────────────────────────────────────┘ │
│                              │                                          │
│                              ▼                                          │
│  2. SHOW OTP FORM                                                   │
│     ┌─────────────────────────────────────────────────────────────────┐ │
│     │ Frontend shows: "Enter 6-digit code sent to your email"      │ │
│     │ • OTP input field (6 digits)                                  │ │
│     │ • "Verify" button                                              │ │
│     │ • "Resend OTP" link (disabled for 60s)                      │ │
│     │ • Timer showing OTP expiry (5 minutes)                       │ │
│     └─────────────────────────────────────────────────────────────────┘ │
│                              │                                          │
│                              ▼                                          │
│  3. VERIFY OTP                                                       │
│     ┌─────────────────────────────────────────────────────────────────┐ │
│     │ POST /auth/register/verify                                    │ │
│     │ Request: { email, otp }                                      │ │
│     └─────────────────────────────────────────────────────────────────┘ │
│                              │                                          │
│                              ▼                                          │
│     ┌─────────────────────────────────────────────────────────────────┐ │
│     │ BACKEND: Verify OTP                                          │ │
│     │ • Find pending user by email                                 │ │
│     │ • Compare hashed OTPs                                         │ │
│     │ • Check OTP not expired (< 5 minutes)                         │ │
│     │ • If valid: Update user status = 'active'                   │ │
│     │ • Generate JWT token                                         │ │
│     │ • Return user + token                                         │ │
│     └─────────────────────────────────────────────────────────────────┘ │
│                              │                                          │
│                              ▼                                          │
│  4. SUCCESS → AUTO LOGIN                                            │
│     ┌─────────────────────────────────────────────────────────────────┐ │
│     │ Frontend: Auto-redirect to Dashboard                         │ │
│     │ • Show success message: "Email verified successfully!"         │ │
│     │ • Store JWT token in localStorage                            │ │
│     │ • Redirect to /dashboard                                     │ │
│     └─────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  5. RESEND OTP (Optional)                                           │
│     ┌─────────────────────────────────────────────────────────────────┐ │
│     │ POST /auth/register/resend-otp                                │ │
│     │ Request: { email }                                           │ │
│     │ • Check rate limit (max 3 resends per registration)           │ │
│     │ • Generate new OTP                                            │ │
│     │ • Update database                                             │ │
│     │ • Send new OTP email                                         │ │
│     │ • Return: { success: true, canResendIn: 60 }               │ │
│     └─────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema Updates

### Add OTP Fields to Merchants Table
```sql
-- Add OTP-related columns to merchants table
ALTER TABLE merchants 
ADD COLUMN otp_hash VARCHAR(255),
ADD COLUMN otp_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN otp_attempts INTEGER DEFAULT 0,
ADD COLUMN otp_resend_count INTEGER DEFAULT 0,
ADD COLUMN otp_last_sent_at TIMESTAMP WITH TIME ZONE;

-- Create index for OTP lookups
CREATE INDEX idx_merchants_otp_expires ON merchants(otp_expires_at) 
WHERE otp_expires_at IS NOT NULL;
```

### Updated Merchant Model
```python
# app/models/merchant.py (add to existing Merchant class)
class Merchant(Base):
    # ... existing fields ...
    
    # OTP fields
    otp_hash = Column(String(255))  # Hashed OTP
    otp_expires_at = Column(DateTime(timezone=True))  # OTP expiration
    otp_attempts = Column(Integer, default=0)  # Failed OTP attempts
    otp_resend_count = Column(Integer, default=0)  # Resend count
    otp_last_sent_at = Column(DateTime(timezone=True))  # Last OTP sent time
```

---

## 📧 OTP Email Templates

### Thai Email Template
```python
OTP_EMAIL_TEMPLATE_TH = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: 'Sarabun', sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #059669 0%, #047857 100%); border-radius: 8px 8px 0 0; }}
        .logo {{ font-size: 28px; font-weight: bold; color: white; margin-bottom: 10px; }}
        .tagline {{ font-size: 14px; color: rgba(255,255,255,0.9); }}
        .content {{ background: #f8fafc; padding: 40px 30px; border-radius: 0 0 8px 8px; }}
        .otp-box {{ background: white; padding: 25px; text-align: center; border-radius: 8px; margin: 25px 0; border: 2px dashed #059669; }}
        .otp-code {{ font-size: 36px; font-weight: bold; color: #059669; letter-spacing: 8px; font-family: 'Courier New', monospace; }}
        .expiry {{ font-size: 13px; color: #dc2626; margin-top: 15px; }}
        .info {{ font-size: 14px; color: #666; line-height: 1.8; }}
        .warning {{ background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }}
        .button {{ display: inline-block; padding: 15px 30px; background: #059669; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }}
        .footer {{ text-align: center; margin-top: 30px; font-size: 12px; color: #9ca3af; }}
        .security {{ background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #22c55e; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔐 FlowPDPA</div>
            <div class="tagline">สร้างนโยบายคุ้มครองข้อมูลส่วนบุคคลอัตโนมัติ</div>
        </div>
        
        <div class="content">
            <h2 style="color: #1e293b; margin: 0 0 20px 0;">ยืนยันอีเมลของคุณ</h2>
            
            <p class="info">
                สวัสดีคุณ{user_name},
            </p>
            
            <p class="info">
                ขอบคุณสมัครใช้งาน FlowPDPA รหัสยืนยันอีเมลของคุณคือ:
            </p>
            
            <div class="otp-box">
                <div class="otp-code">{otp_code}</div>
                <div class="expiry">⏰ รหัสนี้จะหมดอายุภายใน 5 นาที</div>
            </div>
            
            <p class="info">
                กรุณากรอกรหัสนี้ในหน้าสมัครสมาชิกเพื่อยืนยันอีเมลของคุณ
            </p>
            
            <div class="security">
                🛡️ <strong>ความปลอดภัย:</strong> หากคุณไม่ได้ทำการสมัครสมาชิก 
                กรุณาละเว้นอีเมลฉบับนี้และไม่ต้องดำเนินการใดๆ
            </div>
            
            <div class="warning">
                ⚠️ <strong>หมายเหตุ:</strong> อย่าแชร์รหัสยืนยันนี้ให้ใคร เพื่อป้องกันการถูกหลอกลวง
            </div>
            
            <p class="info" style="margin: 30px 0 10px 0;">
                หากคุณมีข้อสงสัยหรือต้องการความช่วยเหลือ ติดต่อเรา:
            </p>
            
            <p class="info">
                📧 support@flowpdpa.co.th<br>
                🌐 flowpdpa.co.th
            </p>
        </div>
        
        <div class="footer">
            <p>© 2024 FlowPDPA. All rights reserved.</p>
            <p>อีเมลฉบับนี้เป็นอีเมลอัตโนมัติ กรุณาอย่าตอบกลับ</p>
            <p>เวอร์ชัน: 1.0.0 | ส่งเมื่อ: {sent_date}</p>
        </div>
    </div>
</body>
</html>
"""
```

---

## 🚀 FastAPI Implementation

### Step 1: OTP Service
```python
# app/services/otp_service.py
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.models.merchant import Merchant, AccountStatus
from app.services.email_service import SESEmailService
from app.core.config import settings

class OTPService:
    OTP_LENGTH = 6
    OTP_EXPIRY_MINUTES = 5
    MAX_ATTEMPTS = 3
    MAX_RESEND = 3
    RESEND_COOLDOWN_SECONDS = 60
    
    @staticmethod
    def generate_otp() -> str:
        """Generate 6-digit OTP"""
        return secrets.token_hex(3)[:6].upper()
    
    @staticmethod
    def hash_otp(otp: str) -> str:
        """Hash OTP for secure storage"""
        return hashlib.sha256(otp.encode()).hexdigest()
    
    @staticmethod
    def verify_otp(otp: str, otp_hash: str) -> bool:
        """Verify OTP against hash"""
        otp_hash_input = hashlib.sha256(otp.encode()).hexdigest()
        return secrets.compare_digest(otp_hash_input, otp_hash)
    
    async def create_otp_registration(
        self, 
        db: AsyncSession, 
        email: str, 
        user_data: Dict
    ) -> Dict:
        """Create pending user and send OTP"""
        
        # Check if user already exists and is active
        existing_user = await db.execute(
            select(Merchant).where(
                Merchant.email == email,
                Merchant.deleted_at.is_(None)
            )
        )
        existing = existing_user.scalar_one_or_none()
        
        if existing and existing.status == AccountStatus.ACTIVE:
            raise ValueError("EMAIL_ALREADY_EXISTS")
        
        # Generate OTP
        otp = self.generate_otp()
        otp_hash = self.hash_otp(otp)
        expires_at = datetime.utcnow() + timedelta(minutes=self.OTP_EXPIRY_MINUTES)
        
        if existing and existing.status == AccountStatus.PENDING:
            # Update existing pending user
            await db.execute(
                update(Merchant)
                .where(Merchant.email == email)
                .values(
                    password_hash=user_data['password_hash'],
                    name=user_data['name'],
                    otp_hash=otp_hash,
                    otp_expires_at=expires_at,
                    otp_attempts=0,
                    updated_at=datetime.utcnow()
                )
            )
        else:
            # Create new pending user
            merchant = Merchant(
                email=email,
                password_hash=user_data['password_hash'],
                name=user_data['name'],
                plan='Free',
                status=AccountStatus.PENDING,
                otp_hash=otp_hash,
                otp_expires_at=expires_at
            )
            db.add(merchant)
        
        await db.commit()
        
        # Send OTP email
        email_service = SESEmailService()
        email_result = await email_service.send_otp_email(
            to_email=email,
            user_name=user_data['name'],
            otp_code=otp
        )
        
        if not email_result.get('success'):
            raise ValueError("FAILED_TO_SEND_EMAIL")
        
        return {
            "success": True,
            "message": "ส่งรหัสยืนยันไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบอีเมล",
            "expiresIn": self.OTP_EXPIRY_MINUTES * 60,
            "canResendIn": self.RESEND_COOLDOWN_SECONDS
        }
    
    async def verify_otp(
        self, 
        db: AsyncSession, 
        email: str, 
        otp: str
    ) -> Dict:
        """Verify OTP and activate user"""
        
        # Find pending user
        result = await db.execute(
            select(Merchant).where(
                Merchant.email == email,
                Merchant.status == AccountStatus.PENDING
            )
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise ValueError("INVALID_EMAIL")
        
        # Check OTP expiration
        if user.otp_expires_at < datetime.utcnow():
            raise ValueError("OTP_EXPIRED")
        
        # Check attempts limit
        if user.otp_attempts >= self.MAX_ATTEMPTS:
            raise ValueError("MAX_ATTEMPTS_EXCEEDED")
        
        # Increment attempts (will rollback if verification succeeds)
        user.otp_attempts += 1
        
        # Verify OTP
        if not self.verify_otp(otp, user.otp_hash):
            await db.commit()
            remaining_attempts = self.MAX_ATTEMPTS - user.otp_attempts
            raise ValueError(f"INVALID_OTP_REMAINING: {remaining_attempts}")
        
        # Activate user
        user.status = AccountStatus.ACTIVE
        user.otp_hash = None
        user.otp_expires_at = None
        user.otp_attempts = 0
        user.otp_resend_count = 0
        user.last_login_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(user)
        
        # Create profile if needed
        from app.models.merchant import MerchantProfile
        existing_profile = await db.execute(
            select(MerchantProfile).where(MerchantProfile.merchant_id == user.id)
        )
        if not existing_profile.scalar_one_or_none():
            profile = MerchantProfile(merchant_id=user.id)
            db.add(profile)
            await db.commit()
        
        return {
            "success": True,
            "message": "ยืนยันอีเมลสำเร็จ!",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
                "plan": user.plan.value,
                "createdAt": user.created_at.isoformat()
            }
        }
    
    async def resend_otp(
        self, 
        db: AsyncSession, 
        email: str
    ) -> Dict:
        """Resend OTP to user"""
        
        # Find pending user
        result = await db.execute(
            select(Merchant).where(
                Merchant.email == email,
                Merchant.status == AccountStatus.PENDING
            )
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise ValueError("INVALID_EMAIL")
        
        # Check resend limits
        if user.otp_resend_count >= self.MAX_RESEND:
            raise ValueError("MAX_RESEND_EXCEEDED")
        
        # Check cooldown
        if user.otp_last_sent_at:
            time_since_last_send = (datetime.utcnow() - user.otp_last_sent_at).total_seconds()
            if time_since_last_send < self.RESEND_COOLDOWN_SECONDS:
                cooldown_remaining = int(self.RESEND_COOLDOWN_SECONDS - time_since_last_send)
                raise ValueError(f"RESEND_COOLDOWN: {cooldown_remaining}")
        
        # Generate new OTP
        otp = self.generate_otp()
        otp_hash = self.hash_otp(otp)
        expires_at = datetime.utcnow() + timedelta(minutes=self.OTP_EXPIRY_MINUTES)
        
        # Update user
        user.otp_hash = otp_hash
        user.otp_expires_at = expires_at
        user.otp_resend_count += 1
        user.otp_last_sent_at = datetime.utcnow()
        user.otp_attempts = 0
        
        await db.commit()
        
        # Send OTP email
        email_service = SESEmailService()
        email_result = await email_service.send_otp_email(
            to_email=email,
            user_name=user.name,
            otp_code=otp
        )
        
        if not email_result.get('success'):
            raise ValueError("FAILED_TO_SEND_EMAIL")
        
        return {
            "success": True,
            "message": "ส่งรหัสยืนยันใหม่แล้ว กรุณาตรวจสอบอีเมล",
            "expiresIn": self.OTP_EXPIRY_MINUTES * 60,
            "remainingResends": self.MAX_RESEND - user.otp_resend_count
        }
```

### Step 2: Email Service Updates
```python
# app/services/email_service.py (add to existing SESEmailService)

async def send_otp_email(
    self,
    to_email: str,
    user_name: str,
    otp_code: str
) -> Dict[str, Any]:
    """Send OTP verification email"""
    
    subject = "ยืนยันอีเมล FlowPDPA ของคุณ"
    
    # Load Thai OTP template
    html_body = OTP_EMAIL_TEMPLATE_TH.format(
        user_name=user_name,
        otp_code=otp_code,
        sent_date=datetime.now().strftime('%Y-%m-%d %H:%M')
    )
    
    text_body = f"""
สวัสดีคุณ{user_name},

ขอบคุณสมัครใช้งาน FlowPDPA

รหัสยืนยันอีเมลของคุณคือ: {otp_code}

รหัสนี้จะหมดอายุภายใน 5 นาที

หากคุณไม่ได้ทำการสมัคร กรุณาละเว้นอีเมลฉบับนี้
"""
    
    return await self.send_email(
        to_addresses=[to_email],
        subject=subject,
        html_body=html_body,
        text_body=text_body
    )
```

### Step 3: OTP API Routes
```python
# app/api/otp.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr, Field

from app.db.database import get_db
from app.services.otp_service import OTPService
from app.services.auth_service import AuthService

router = APIRouter()

class InitiateRegistrationRequest(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=6)
    phone: str = None
    company: str = None

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)

class ResendOTPRequest(BaseModel):
    email: EmailStr

@router.post("/register/initiate")
async def initiate_registration(
    user_data: InitiateRegistrationRequest,
    db: AsyncSession = Depends(get_db)
):
    """Initiate registration with OTP email verification"""
    try:
        otp_service = OTPService()
        
        # Hash password
        password_hash = AuthService.get_password_hash(user_data.password)
        
        result = await otp_service.create_otp_registration(
            db=db,
            email=user_data.email,
            user_data={
                'name': user_data.name,
                'password_hash': password_hash,
                'phone': user_data.phone,
                'company': user_data.company
            }
        )
        
        return result
        
    except ValueError as e:
        if str(e) == "EMAIL_ALREADY_EXISTS":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "EMAIL_ALREADY_EXISTS",
                    "message": "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น"
                }
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/register/verify")
async def verify_otp(
    request: VerifyOTPRequest,
    db: AsyncSession = Depends(get_db)
):
    """Verify OTP and complete registration"""
    try:
        otp_service = OTPService()
        
        result = await otp_service.verify_otp(
            db=db,
            email=request.email,
            otp=request.otp
        )
        
        # Generate JWT token for auto-login
        access_token = AuthService.create_access_token(
            data={
                "sub": result['user']['email'], 
                "role": "merchant", 
                "plan": result['user']['plan']
            }
        )
        
        result['token'] = access_token
        
        return result
        
    except ValueError as e:
        error_message = str(e)
        
        if error_message == "INVALID_EMAIL":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "INVALID_EMAIL",
                    "message": "ไม่พบอีเมลที่รอการยืนยัน กรุณาลงทะเบียนใหม่"
                }
            )
        elif error_message == "OTP_EXPIRED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "OTP_EXPIRED",
                    "message": "รหัสยืนยันหมดอายุแล้ว กรุณาขอรหัสใหม่"
                }
            )
        elif "MAX_ATTEMPTS_EXCEEDED" in error_message:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "code": "MAX_ATTEMPTS_EXCEEDED",
                    "message": "กรอกรหัสผิดพลาดเกิน 3 ครั้ง กรุณาลงทะเบียนใหม่"
                }
            )
        elif "INVALID_OTP" in error_message:
            remaining = error_message.split(": ")[1]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_OTP",
                    "message": f"รหัสยืนยันไม่ถูกต้อง กรุณาลองใหม่ (คงเหลือ {remaining} ครั้ง)"
                }
            )
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VERIFICATION_FAILED", "message": error_message}
        )

@router.post("/register/resend-otp")
async def resend_otp(
    request: ResendOTPRequest,
    db: AsyncSession = Depends(get_db)
):
    """Resend OTP to pending user"""
    try:
        otp_service = OTPService()
        
        result = await otp_service.resend_otp(
            db=db,
            email=request.email
        )
        
        return result
        
    except ValueError as e:
        error_message = str(e)
        
        if error_message == "INVALID_EMAIL":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "INVALID_EMAIL",
                    "message": "ไม่พบอีเมลที่รอการยืนยัน"
                }
            )
        elif error_message == "MAX_RESEND_EXCEEDED":
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "code": "MAX_RESEND_EXCEEDED",
                    "message": "กรุณาขอรหัสใหม่ในภายหลัง (ส่งเกินกำหนัด)"
                }
            )
        elif "RESEND_COOLDOWN" in error_message:
            cooldown = int(error_message.split(": ")[1])
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "code": "RESEND_COOLDOWN",
                    "message": f"กรุณารอ {cooldown} วินาทีก่อนขอรหัสใหม่",
                    "canResendIn": cooldown
                }
            )
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "RESEND_FAILED", "message": error_message}
        )
```

### Step 4: Update Main Router
```python
# app/main.py (add OTP routes)
from app.api.otp import router as otp_router

app.include_router(otp_router, prefix="/auth", tags=["OTP"])
```

---

## 🎨 Frontend Implementation

### React OTP Verification Component
```typescript
// src/pages/Register.tsx (complete OTP version)
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Mail, ArrowRight, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

interface InitiateData {
  name: string
  email: string
  password: string
  confirm: string
  phone?: string
  company?: string
}

export default function Register() {
  const navigate = useNavigate()
  
  // Step 1: Registration form
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form state
  const [formData, setFormData] = useState<InitiateData>({
    name: '',
    email: '',
    password: '',
    confirm: '',
    phone: '',
    company: ''
  })
  
  // OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [email, setEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [expiryCountdown, setExpiryCountdown] = useState(300) // 5 minutes
  
  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!formData.name.trim()) { setError('กรุณาระบุชื่อ'); return }
    if (formData.password.length < 6) { setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return }
    if (formData.password !== formData.confirm) { setError('รหัสผ่านไม่ตรงกัน'); return }
    
    setLoading(true)
    try {
      const response = await fetch('https://api.flowpdpa.co.th/v1/auth/register/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          company: formData.company
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setEmail(formData.email)
        setStep('verify')
        setExpiryCountdown(data.data.expiresIn)
        startResendCooldown(data.data.canResendIn)
      } else {
        setError(data.error?.message || 'เกิดข้อผิดพลาด')
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดกรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }
  
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const otpValue = otp.join('')
    if (otpValue.length !== 6) {
      setError('กรุณากรอกรหัสยืนยัน 6 หลัก')
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch('https://api.flowpdpa.co.th/v1/auth/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpValue })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Auto-login
        localStorage.setItem('flowpdpa_auth', JSON.stringify({
          email: data.data.user.email,
          name: data.data.user.name,
          plan: data.data.user.plan
        }))
        localStorage.setItem('flowpdpa_auth', JSON.stringify({
          ...JSON.parse(localStorage.getItem('flowpdpa_auth')!),
          token: data.data.token
        }))
        
        navigate('/dashboard')
      } else {
        setError(data.error?.message || 'รหัสยืนยันไม่ถูกต้อง')
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดกรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }
  
  const handleResend = async () => {
    setResendLoading(true)
    setError('')
    try {
      const response = await fetch('https://api.flowpdpa.co.th/v1/auth/register/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setExpiryCountdown(data.data.expiresIn)
        startResendCooldown(data.data.canResendIn || 60)
      } else {
        setError(data.error?.message || 'เกิดข้อผิดพลาด')
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดกรุณาลองใหม่')
    } finally {
      setResendLoading(false)
    }
  }
  
  const startResendCooldown = (seconds: number) => {
    setResendCooldown(seconds)
    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }
  
  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)
      
      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement
        nextInput?.focus()
      }
    }
  }
  
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement
      prevInput?.focus()
    }
  }
  
  // Countdown timer
  useEffect(() => {
    if (step === 'verify' && expiryCountdown > 0) {
      const timer = setInterval(() => {
        setExpiryCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [step, expiryCountdown])
  
  const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none transition-colors bg-white"
  const inputStyle = { backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = 'var(--green)')
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--navy)' }}>
      
      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Top bar */}
      <div className="relative z-10 px-6 py-5 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-0.5">
          <span className="font-black text-xl tracking-tight text-white">Flow</span>
          <span className="font-black text-xl tracking-tight" style={{ color: 'var(--green)' }}>PDPA</span>
        </Link>
        <Link to="/support" className="text-xs font-medium transition-colors" style={{ color: '#475569' }}>
          ต้องการความช่วยเหลือ?
        </Link>
      </div>

      {/* Main Card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          
          {step === 'form' ? (
            <div className="rounded-2xl p-8 sm:p-10" style={{
              backgroundColor: '#0f1f38',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 32px 64px -12px rgba(0,0,0,0.5)',
            }}>
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: 'rgba(5,150,105,0.15)' }}>
                <UserPlus className="w-6 h-6" style={{ color: 'var(--green)' }} />
              </div>

              <h1 className="text-2xl font-black text-white mb-1">สมัครสมาชิก</h1>
              <p className="text-sm mb-6" style={{ color: '#64748b' }}>
                กรอกข้อมูลและรับรหัสยืนยันทางอีเมล
              </p>

              <form onSubmit={handleInitiate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>
                    ชื่อ-นามสกุล <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text" required placeholder="ชื่อ นามสกุล"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className={inputClass} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>
                    อีเมล <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email" required placeholder="email@company.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className={inputClass} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>
                      รหัสผ่าน <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="password" required placeholder="•••••••••"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      className={inputClass} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>
                      ยืนยันรหัส <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="password" required placeholder="•••••••••"
                      value={formData.confirm}
                      onChange={e => setFormData({...formData, confirm: e.target.value})}
                      className={inputClass} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>
                      เบอร์โทรศัพท์
                    </label>
                    <input
                      type="tel" placeholder="08x-xxx-xxxx"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className={inputClass} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>
                      บริษัท / องค์กร
                    </label>
                    <input
                      type="text" placeholder="ชื่อบริษัท..."
                      value={formData.company}
                      onChange={e => setFormData({...formData, company: e.target.value})}
                      className={inputClass} style={inputStyle} onFocus={onFocus} onBlur={onBlur}
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-xs px-4 py-3 rounded-lg" style={{
                    backgroundColor: 'rgba(239,68,68,0.1)',
                    color: '#f87171',
                    border: '1px solid rgba(239,68,68,0.2)'
                  }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-green w-full py-3 text-sm mt-2" style={{
                  borderRadius: '8px',
                  opacity: loading ? 0.7 : 1
                }}>
                  {loading ? 'กำลังส่ง...' : 'ส่งรหัสยืนยัน'}
                </button>

                <p className="text-xs text-center" style={{ color: '#334155' }}>
                  การสมัครสมาชิกถือว่าคุณยอมรับ{' '}
                  <Link to="/terms" className="underline" style={{ color: '#475569' }}>เงื่อนไข</Link>
                  {' '}และ{' '}
                  <Link to="/privacy-policy" className="underline" style={{ color: '#475569' }}>นโยบายความเป็นส่วนตัว</Link>
                </p>
              </form>

              <div className="flex items-center gap-3 my-6">
                <span className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
                <span className="text-xs" style={{ color: '#334155' }}>มีบัญชีแล้ว?</span>
                <span className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
              </div>

              <Link to="/login" className="block w-full py-3 text-sm font-semibold text-center rounded-lg transition-colors" style={{
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#94a3b8'
              }}>
                เข้าสู่ระบบ
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl p-8 sm:p-10" style={{
              backgroundColor: '#0f1f38',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 32px 64px -12px rgba(0,0,0,0.5)',
            }}>
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: 'rgba(5,150,105,0.15)' }}>
                <Mail className="w-6 h-6" style={{ color: 'var(--green)' }} />
              </div>

              <h1 className="text-2xl font-black text-white mb-1">ยืนยันอีเมล</h1>
              <p className="text-sm mb-6" style={{ color: '#64748b' }}>
                กรอกรหัสยืนยัน 6 หลักที่ส่งไปยัง {email}
              </p>

              {/* OTP Input */}
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="flex justify-center gap-2 mb-4">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 border-gray-300 focus:border-green-500 focus:outline-none transition-colors"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        color: 'white',
                        borderColor: digit ? 'var(--green)' : 'rgba(255,255,255,0.2)'
                      }}
                    />
                  ))}
                </div>

                {/* Timer */}
                {expiryCountdown > 0 ? (
                  <div className="text-center mb-4">
                    <span className="text-xs" style={{ color: '#9ca3af' }}>
                      ⏰ หมดอายุใน {Math.floor(expiryCountdown / 60)}:{(expiryCountdown % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                ) : (
                  <div className="text-center mb-4">
                    <span className="text-xs text-red-400">⏰ รหัสหมดอายุแล้ว</span>
                  </div>
                )}

                {error && (
                  <div className="text-xs px-4 py-3 rounded-lg text-center" style={{
                    backgroundColor: 'rgba(239,68,68,0.1)',
                    color: '#f87171',
                    border: '1px solid rgba(239,68,68,0.2)'
                  }}>
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading || otp.join('').length !== 6 || expiryCountdown === 0}
                    className="flex-1 btn-green py-3 text-sm font-bold"
                    style={{ borderRadius: '8px', opacity: (loading || otp.join('').length !== 6 || expiryCountdown === 0) ? 0.5 : 1 }}
                  >
                    {loading ? 'กำลังยืนยัน...' : 'ยืนยัน'}
                  </button>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading || resendCooldown > 0}
                    className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg transition-colors"
                    style={{
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: resendCooldown > 0 ? '#64748b' : '#94a3b8',
                      opacity: (resendLoading || resendCooldown > 0) ? 0.5 : 1
                    }}
                  >
                    <RefreshCw className={`w-4 h-4 ${resendLoading ? 'animate-spin' : ''}`} />
                    {resendCooldown > 0 ? `${resendCooldown}s` : 'ส่งใหม่'}
                  </button>
                </div>

                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => setStep('form')}
                    className="text-xs underline" style={{ color: '#64748b' }}
                  >
                    ← กลับไปกรอกข้อมูล
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

---

## 🔒 Security Features

### Rate Limiting
```python
# app/api/dependencies/rate_limit.py
from fastapi import HTTPException, status
from functools import wraps
from datetime import datetime, timedelta
from typing import Dict

class RateLimiter:
    def __init__(self):
        self.requests: Dict[str, list] = {}
    
    def check_rate_limit(self, key: str, max_requests: int, window_minutes: int = 1):
        """Check if rate limit is exceeded"""
        now = datetime.utcnow()
        window_start = now - timedelta(minutes=window_minutes)
        
        if key not in self.requests:
            self.requests[key] = []
        
        # Remove old requests outside window
        self.requests[key] = [
            req_time for req_time in self.requests[key]
            if req_time > window_start
        ]
        
        if len(self.requests[key]) >= max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later."
            )
        
        self.requests[key].append(now)

# Apply to OTP endpoints
@router.post("/register/initiate")
@rate_limit(max_requests=3, window_minutes=5)
async def initiate_registration(...):
    ...
```

### Fraud Prevention
- **Email verification required** before account activation
- **OTP expiration** (5 minutes) prevents abuse
- **Max attempts** (3 tries) prevents brute force
- **Resend limits** (3 times) prevents spam
- **Rate limiting** (3 per 5 minutes) per IP/email
- **OTP hashing** prevents database compromise
- **Cooldown periods** prevent rapid fire requests

---

## 📊 Monitoring & Analytics

### Track Metrics
```python
# Track these metrics for monitoring:
- OTP generation rate
- OTP verification success rate
- OTP expiration rate
- Average verification time
- Resend OTP frequency
- Failed OTP attempts
- Rate limit triggers
- Email delivery success rate
```

---

## 🧪 Testing OTP System

### Test Cases
```python
# tests/test_otp.py
@pytest.mark.asyncio
async def test_complete_otp_flow(client: AsyncClient):
    # Step 1: Initiate registration
    response = await client.post("/auth/register/initiate", json={
        "name": "OTP User",
        "email": "otp@example.com",
        "password": "password123"
    })
    assert response.status_code == 200
    assert "expiresIn" in response.json()["data"]
    
    # Step 2: Verify with wrong OTP
    response = await client.post("/auth/register/verify", json={
        "email": "otp@example.com",
        "otp": "000000"
    })
    assert response.status_code == 400
    assert "INVALID_OTP" in response.json()["detail"]["code"]
    
    # Step 3: Verify with correct OTP (get from database or mock)
    # In real test, you'd mock the email service to capture the OTP
    response = await client.post("/auth/register/verify", json={
        "email": "otp@example.com",
        "otp": "CORRECT_OTP"
    })
    assert response.status_code == 200
    assert "token" in response.json()["data"]

@pytest.mark.asyncio
async def test_resend_cooldown(client: AsyncClient):
    # Test resend cooldown
    await client.post("/auth/register/initiate", json={
        "name": "Resend User",
        "email": "resend@example.com",
        "password": "password123"
    })
    
    # Immediate resend should fail
    response = await client.post("/auth/register/resend-otp", json={
        "email": "resend@example.com"
    })
    assert response.status_code == 429
    assert "RESEND_COOLDOWN" in response.json()["detail"]["code"]
```

---

## 📋 Implementation Checklist

### Backend Tasks
- [ ] Add OTP fields to merchants table
- [ ] Implement OTPService with generate/hash/verify
- [ ] Add AWS SES OTP email template
- [ ] Create `/auth/register/initiate` endpoint
- [ ] Create `/auth/register/verify` endpoint  
- [ ] Create `/auth/register/resend-otp` endpoint
- [ ] Add rate limiting middleware
- [ ] Add OTP expiration cleanup job
- [ ] Update login to check account status

### Frontend Tasks
- [ ] Update Register.tsx with OTP flow
- [ ] Add OTP input component (6 digits)
- [ ] Implement countdown timer
- [ ] Add resend button with cooldown
- [ ] Handle auto-login after verification
- [ ] Add proper error messages
- [ ] Test with actual API

### Testing Tasks
- [ ] Unit tests for OTP generation/hashing
- [ ] Integration tests for complete flow
- [ ] Test rate limiting
- [ ] Test resend functionality
- [ ] Test OTP expiration
- [ ] Test max attempts
- [ ] Mock AWS SES for testing

---

## 🚀 Deployment Notes

### Environment Variables Required
```
# OTP Configuration
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=3
OTP_MAX_RESEND=3
OTP_RESEND_COOLDOWN_SECONDS=60
OTP_RATE_LIMIT_REQUESTS=3
OTP_RATE_LIMIT_WINDOW_MINUTES=5
```

### Monitoring Setup
```bash
# Add to your monitoring:
- OTP generation success/failure rate
- Email delivery success rate
- Average verification time
- Rate limit trigger rate
- Account conversion rate (initiated → verified)
```

---

## ✅ Success Criteria

**OTP System is successful when:**
- ✅ Users cannot login without email verification
- ✅ OTP emails are delivered within 10 seconds
- ✅ OTP verification works within 5 minutes
- ✅ Resend functionality respects cooldown
- ✅ Rate limiting prevents abuse
- ✅ Failed attempts are tracked and limited
- ✅ Frontend provides good user experience
- ✅ System handles edge cases gracefully

---

## 🎯 User Experience Flow

```
User Flow:
1. Fill registration form → Click "Send OTP"
2. See "Check your email" page
3. Receive 6-digit code via email
4. Enter code in 6 input boxes
5. Click "Verify" → Auto-redirect to Dashboard
6. If code expires → Click "Resend" (after 60s)
7. If code wrong → Try again (max 3 attempts)
8. Success → Logged in and ready to use!
```

This provides a **secure, user-friendly** email verification system that prevents fake accounts while maintaining good UX! 🎯