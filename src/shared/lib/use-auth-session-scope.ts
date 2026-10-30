import { useSyncExternalStore } from 'react'

import {
  getFrontendAuthStorageScope,
  subscribeFrontendAuthSession,
} from './auth-session'

export function useFrontendAuthStorageScope() {
  return useSyncExternalStore(
    subscribeFrontendAuthSession,
    getFrontendAuthStorageScope,
    getFrontendAuthStorageScope,
  )
}
