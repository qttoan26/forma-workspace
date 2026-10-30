# API authentication boundary

Forma's API authentication layer is intentionally identity-provider agnostic.

Protected routes receive an authenticated user derived from the JWT `sub` claim. The global authentication guard verifies issuer, audience, expiry, and signature before attaching that user to the request. Health routes are explicitly public so infrastructure probes do not require identity credentials.

Production supports either a remote HTTPS JWKS endpoint or an HS256 shared secret. Exactly one verifier must be configured. Local development may omit auth configuration and uses a stable development user id instead.

Authorization currently enforces project ownership in the task repository. This is deliberately below the controller boundary so alternate transports or future controllers cannot bypass owner isolation. Shared workspaces should extend this boundary with membership and roles rather than weakening owner checks.
