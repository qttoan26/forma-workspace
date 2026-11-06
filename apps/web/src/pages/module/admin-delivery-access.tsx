import { useState, type FormEvent } from 'react'
import { z } from 'zod'

import {
  getApiBaseUrl,
  getApiAuthorizationHeader,
  handleApiUnauthorizedResponse,
} from '@/shared/api/api-auth'
import { isDemoMode } from '@/shared/auth/auth-session'

import './admin-delivery-access.css'

const accessSchema = z.object({
  deliveryRead: z.boolean(),
  revision: z.int().nonnegative(),
})

export function AdminDeliveryAccess() {
  const baseUrl = getApiBaseUrl()
  const [access, setAccess] = useState<
    (z.infer<typeof accessSchema> & { url: string }) | null
  >(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function request(
    url: string,
    change?: { deliveryRead: boolean; expectedRevision: number },
  ) {
    setBusy(true)
    setError('')
    try {
      const authorization = await getApiAuthorizationHeader()
      if (!authorization) {
        setAccess(null)
        setError('Sign in to manage delivery access.')
        return
      }
      const response = await fetch(url, {
        headers: change
          ? { ...authorization, 'Content-Type': 'application/json' }
          : authorization,
        method: change ? 'PUT' : 'GET',
        body: change ? JSON.stringify(change) : null,
      })
      if (!response.ok) {
        handleApiUnauthorizedResponse(response)
        setAccess(null)
        setError(
          response.status === 409
            ? 'Access changed since you looked it up. Look it up again before saving.'
            : response.status === 404
              ? 'This organization is unavailable for your account and audience.'
              : 'Delivery access is unavailable. Look it up again to confirm its current state.',
        )
        return
      }
      setAccess({ ...accessSchema.parse(await response.json()), url })
    } catch {
      setAccess(null)
      setError(
        'Delivery access is unavailable. Look it up again to confirm its current state.',
      )
    } finally {
      setBusy(false)
    }
  }

  function lookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const value = (field: string) => {
      const entry = form.get(field)
      return typeof entry === 'string' ? entry.trim() : ''
    }
    const workspace = value('workspace')
    const organization = value('organization')
    const account = value('account')
    const audience = value('audience')
    setAccess(null)
    if (
      [workspace, organization, account].some(
        (id) => !id || id === '.' || id === '..',
      ) ||
      (audience !== 'customer' && audience !== 'vendor')
    ) {
      setError('Enter a valid workspace, organization and account ID.')
      return
    }
    void request(
      `${baseUrl}/api/admin/workspaces/${encodeURIComponent(workspace)}/organizations/${encodeURIComponent(organization)}/${audience}/memberships/${encodeURIComponent(account)}/delivery-access`,
    )
  }

  return (
    <section
      className="module-state-card admin-delivery-access"
      aria-labelledby="delivery-access-title"
    >
      <h2 id="delivery-access-title">Delivery milestone access</h2>
      <p>
        Look up an account in a specific workspace, organization and audience
        before changing its delivery-read permission.
      </p>
      {isDemoMode() || !baseUrl ? (
        <p>
          Access management is available in a connected workspace with a
          configured API and organization administrator.
        </p>
      ) : (
        <form
          onSubmit={lookup}
          onChange={() => {
            setAccess(null)
            setError('')
          }}
        >
          <fieldset disabled={busy}>
            <legend>Membership scope</legend>
            <div className="admin-access-fields">
              <label>
                Workspace ID
                <input name="workspace" required />
              </label>
              <label>
                Organization ID
                <input name="organization" required />
              </label>
              <label>
                Audience
                <select name="audience">
                  <option value="customer">Customer</option>
                  <option value="vendor">Vendor</option>
                </select>
              </label>
              <label>
                Account ID
                <input name="account" required />
              </label>
            </div>
            <div className="admin-access-actions">
              <button className="module-primary-action" type="submit">
                Look up access
              </button>
              {access ? (
                <button
                  className="module-primary-action"
                  type="button"
                  onClick={() =>
                    void request(access.url, {
                      deliveryRead: !access.deliveryRead,
                      expectedRevision: access.revision,
                    })
                  }
                >
                  {access.deliveryRead ? 'Revoke access' : 'Grant access'}
                </button>
              ) : null}
            </div>
          </fieldset>
          {error ? <p role="alert">{error}</p> : null}
          <p role="status">
            {busy
              ? 'Checking delivery access…'
              : access
                ? `Delivery access is ${access.deliveryRead ? 'granted' : 'off'}.`
                : ''}
          </p>
        </form>
      )}
    </section>
  )
}
