import { describe, expect, it } from 'vitest'

import { validateWebRuntimeConfiguration } from './runtime-config'

const productionEnvironment = {
  VITE_DEPLOYMENT_MODE: 'production',
  VITE_API_BASE_URL: 'https://api.example.test',
  VITE_OIDC_AUTHORIZATION_ENDPOINT: 'https://issuer.example.test/authorize',
  VITE_OIDC_TOKEN_ENDPOINT: 'https://issuer.example.test/token',
  VITE_OIDC_CLIENT_ID: 'forma-web',
  VITE_OIDC_REDIRECT_URI: 'https://app.example.test/auth/callback',
}

describe('web runtime configuration', () => {
  it('accepts a complete production OIDC configuration', () => {
    expect(() =>
      validateWebRuntimeConfiguration(productionEnvironment),
    ).not.toThrow()
  })

  it('skips real-auth requirements for the explicit demo build', () => {
    expect(() =>
      validateWebRuntimeConfiguration({
        VITE_DEPLOYMENT_MODE: 'production',
        VITE_DEMO_MODE: 'true',
      }),
    ).not.toThrow()
  })

  it('does not require production auth configuration for ordinary build/test mode', () => {
    expect(() => validateWebRuntimeConfiguration({})).not.toThrow()
  })

  it('fails fast when required production auth settings are missing', () => {
    expect(() =>
      validateWebRuntimeConfiguration({
        ...productionEnvironment,
        VITE_OIDC_CLIENT_ID: ' ',
      }),
    ).toThrow('VITE_OIDC_CLIENT_ID is required for production authentication')
  })

  it('rejects insecure production endpoints', () => {
    expect(() =>
      validateWebRuntimeConfiguration({
        ...productionEnvironment,
        VITE_API_BASE_URL: 'http://api.example.test',
      }),
    ).toThrow('VITE_API_BASE_URL must use HTTPS in production')
  })

  it('rejects malformed production URLs', () => {
    expect(() =>
      validateWebRuntimeConfiguration({
        ...productionEnvironment,
        VITE_OIDC_TOKEN_ENDPOINT: 'not-a-url',
      }),
    ).toThrow('VITE_OIDC_TOKEN_ENDPOINT must be a valid URL')
  })
})
