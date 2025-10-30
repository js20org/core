# Security & Prod checklist
$$ meta:title JS20 - Security & Prod checklist
$$ meta:description Learn about security in JS20 and how to prepare your app for production.

## Secure by default
Under the hood, JS20 applies a lot of security features automatically:
- Global rate limiter
- Stricter rate limiter for Auth endpoints
- Security headers (CSP, hsts, etc)
- Enforcing CORS is set up
- Remove x-powered-by header
- No caching for logged in API calls
- Protection against SQL injections
- Default error handlers
- Limits on request body size
- Cookie expiry, SameSite=lax, httpOnly & enforcing 12 digit secret
- etc.

## Prepare your app for production
When you are ready to deploy your app to production, make sure to:
- **isProduction** flag is set to **true** in the main config 
- Use **HTTPS**
- Setup **Authenticator** with all required options (secret, baseURL, cookie domain, etc)
- Setup **allowedOrigins** in the server config to restrict CORS

## Configure Authenticator
For production, provide the following options:
- **secret**: A strong secret of at least 12 characters
- **baseURL**: The base URL of your production app, used for redirecting users after login
- **cookie domain**: The domain that owns the authentication cookie
- **cookie path**: The path for the authentication cookie

$$ import src/core/types.ts#authConfig

You can add it like this:
$$ import ./src/examples/raw/auth-config.ts

## Setting allowedOrigins (CORS)

JS20 allows you to pass along **allowedOrigins** in the **server** config of the app. By default, if no origins are provided, it will allow all origins with __access-control-allow-origin: \*__. This feature is not available in production mode, instead you must provide a list of allowed origins.

$$ import ./src/examples/raw/cors.ts

## Custom rate limits
You can set your own rate limits. This is the default:
$$ import src/core/utils/config.ts#DefaultConfig

To customize, you can pass along a **rateLimit** object in the **server** config of the app.

$$ import ./src/examples/raw/rate-limit.ts
