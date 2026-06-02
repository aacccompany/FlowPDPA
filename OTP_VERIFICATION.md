# OTP Email Verification Flow

## Overview
The Register component includes a two-step email verification process to ensure user security and verify email addresses.

## Flow Structure

### Step 1: Registration Form
- User fills in registration details (name, email, phone, company)
- Password validation (minimum 6 characters)
- Form validation on submission

### Step 2: OTP Verification
- After successful form submission, user is presented with OTP input
- 6-digit code is sent to the provided email (simulated for demo)
- User has 5 minutes to enter the OTP
- Countdown timer shows remaining time

### Step 3: Success
- After successful verification, user is automatically logged in
- Redirected to dashboard
- Success animation shows completion

## Features

### OTP Input UI
- Large, easy-to-read input fields
- Visual numbering (1, 2, 3) above empty fields for guidance
- Auto-focus to next field on input
- Backspace navigation to previous field
- Only numeric input allowed
- Visual feedback when fields are filled

### Timer Functionality
- 5-minute expiry countdown
- Visual timer with color coding:
  - Blue: Time remaining
  - Red: Time expired
- Resend button with cooldown period (60 seconds)
- Resend resets the 5-minute timer

### Error Handling
- Form validation errors
- Invalid OTP error
- Network error handling
- Timeout error handling

## Demo Mode

In development mode:
- Use OTP code: `123456`
- No actual email is sent
- All data is stored in localStorage

## API Integration Points

When connecting to a real backend:

### 1. Initiate Registration
```typescript
// Call this after form submission
const response = await api.auth.register.initiate({
  name: formData.name,
  email: formData.email,
  password: formData.password,
  phone: formData.phone,
  company: formData.company
})
```

### 2. Verify OTP
```typescript
// Call this when user submits OTP
const response = await api.auth.register.verify({
  email: formData.email,
  otp: otpValue
})
```

### 3. Resend OTP
```typescript
// Call this when user clicks resend
const response = await api.auth.register.resendOtp({
  email: formData.email
})
```

## Customization

### Timer Duration
Update `expiryCountdown` state in handleInitiate:
```typescript
setExpiryCountdown(300) // 5 minutes in seconds
```

### Resend Cooldown
Update the seconds in startResendCooldown:
```typescript
startResendCooldown(60) // 60 seconds cooldown
```

### Demo OTP
Change the verification code in handleVerify:
```typescript
if (regData && otpValue === '123456') {
  // Success
}
```

## Storage

The following data is stored in localStorage:
- `flowpdpa_reg_${email}`: Registration data (name, password)
- `flowpdpa_auth`: Authentication token and user data
- `flowpdpa_profile_${email}`: User profile data

## Security Notes

- In production, always use HTTPS
- Implement proper rate limiting
- Use JWT tokens for authentication
- Hash passwords before storing
- Implement proper session management
- Add CSRF protection