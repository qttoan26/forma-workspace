import { RouterProvider } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import { useFrontendAuthStorageScope } from '@/shared/lib/use-auth-session-scope'

import { router } from './router'

export function App() {
  const authScope = useFrontendAuthStorageScope()
  const [readyScope, setReadyScope] = useState(authScope)
  const refreshId = useRef(0)

  useEffect(() => {
    if (authScope === readyScope) return

    const id = ++refreshId.current
    void router.invalidate().finally(() => {
      if (refreshId.current === id) setReadyScope(authScope)
    })
  }, [authScope, readyScope])

  if (authScope !== readyScope) {
    return <div role="status">Switching account…</div>
  }

  return <RouterProvider key={authScope} router={router} />
}
