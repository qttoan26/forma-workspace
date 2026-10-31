# Production authentication deployment contract

The frontend authentication preflight is intentionally enabled by deployment intent, not by Vite's production build mode. Browser smoke tests and other CI jobs also use optimized builds, so `import.meta.env.PROD` alone cannot distinguish a real deployment from validation infrastructure.

For a real authenticated frontend deployment, set:

```text
VITE_DEPLOYMENT_MODE=production
VITE_API_BASE_URL=https://api.example.com
VITE_OIDC_AUTHORIZATION_ENDPOINT=https://identity.example.com/authorize
VITE_OIDC_TOKEN_ENDPOINT=https://identity.example.com/token
VITE_OIDC_CLIENT_ID=forma-web
VITE_OIDC_REDIRECT_URI=https://app.example.com/auth/callback
VITE_OIDC_SCOPE=openid profile email
```

When `VITE_DEPLOYMENT_MODE=production`, startup validates the required API and OIDC settings before initializing the authentication lifecycle. API, authorization, token, and callback URLs must use HTTPS. This keeps a misconfigured deployment from presenting a login UI that can never complete authentication.

`VITE_DEMO_MODE=true` is reserved for the static GitHub Pages demo and bypasses real-auth requirements. It must not be enabled for an authenticated production deployment.

The API remains provider-neutral. A hosted identity provider should issue access tokens with the configured `AUTH_ISSUER` and `AUTH_AUDIENCE`; the API should verify them through `AUTH_JWKS_URL`. Production JWKS endpoints must use HTTPS.

Deployment platforms should treat these frontend values as public build configuration, not secrets. Client secrets must never be embedded in the SPA. The browser uses OAuth 2.0 / OIDC Authorization Code with PKCE and therefore requires only a public client identifier.
