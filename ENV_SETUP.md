# Environment Configuration Setup

## Overview
This project uses Vite's environment variable system to manage different environments (development, production).

## Environment Files

### Development (`.env`)
- Used during local development
- Contains development-specific configurations
- Automatically loaded by Vite

### Production (`.env.production`)
- Used when building for production
- Copied to the Docker image
- Contains production-specific configurations

### Development (`.env.development`)
- Alternative development environment
- Can be used for different development setups

### Example (`.env.example`)
- Template for environment variables
- Should be copied to create actual `.env` files
- Documents available environment variables

## Environment Variables

### `VITE_API_BASE_URL`
- **Purpose**: Base URL for API requests
- **Development**: `http://localhost:8000/v1`
- **Production**: `https://your-api-domain.com/v1`
- **Usage**: Automatically available in your code via `import.meta.env.VITE_API_BASE_URL`

## Setting Up

### For Development
1. Create a `.env` file (if not exists):
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` with your local development settings
3. Run the development server:
   ```bash
   npm run dev
   ```

### For Production
1. Create `.env.production` with production settings
2. Build the application:
   ```bash
   npm run build
   ```

### Docker Deployment
The Dockerfile automatically copies `.env.production` to the build context for production deployment.

## Best Practices

1. **Never commit real secrets**: All `.env` files are already in `.gitignore`
2. **Use descriptive variable names**: Clear names make the code more maintainable
3. **Document required variables**: Use `.env.example` as a reference
4. **Validate environment variables**: Consider using a validation library for production
5. **Use default values**: Provide sensible defaults where possible

## API Integration

The project includes a centralized API service (`src/services/api.ts`) that:
- Automatically uses the correct base URL from environment variables
- Handles authentication tokens
- Provides consistent error handling
- Includes loading states and timeouts

Example usage:
```typescript
import api from '@/services/api'

// API calls automatically use VITE_API_BASE_URL
const response = await api.auth.login({ email, password })
```