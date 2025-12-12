# Frontend Production Environment Variables

Create a `.env.production` file in the inventory_module root directory:

```env
# API Base URL - Your production backend URL
VITE_API_BASE_URL=https://api.your-production-domain.com/api/v1

# Application Configuration
VITE_APP_NAME=Inventory Management System
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false
```

## Building for Production:

```bash
# Build with production environment
npm run build:prod

# The build output will be in the `dist` folder
# Deploy the contents of `dist` to your web server
```

## Environment Variable Usage:

- `VITE_API_BASE_URL`: Base URL for all API calls
- Variables prefixed with `VITE_` are exposed to the frontend code
- Never expose sensitive data (API keys, secrets) in frontend environment variables

