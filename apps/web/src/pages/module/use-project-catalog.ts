import { useEffect, useState } from 'react'
import {
  readLocalProjects,
  subscribeProjectCatalog,
  type ProjectCatalogScope,
} from '@/entities/project/lib/project-catalog'
import type { Project } from '@/entities/project/model/project'
import { isDemoMode, loadAuthSession } from '@/shared/auth/auth-session'
import { currentDemoMember } from '@/shared/demo/demo-members'
import { project, workspace } from '@/pages/project-board/project-board-data'

export function useProjectCatalog(accountId?: string) {
  const knownAccount =
    accountId ?? (isDemoMode() ? currentDemoMember.id : undefined)
  const [resolvedAccount, setResolvedAccount] = useState<string>()
  const [attempt, setAttempt] = useState(0)
  const account = knownAccount ?? resolvedAccount
  const [state, setState] = useState<{
    account: string | undefined
    projects: Project[]
    error: boolean
    loading: boolean
  }>({ account: undefined, projects: [project], error: false, loading: true })

  useEffect(() => {
    if (knownAccount) return
    let active = true
    void loadAuthSession()
      .then((session) => {
        if (!active) return
        if (session) setResolvedAccount(session.user.id)
        else
          setState({
            account: undefined,
            projects: [project],
            error: true,
            loading: false,
          })
      })
      .catch(() => {
        if (active)
          setState({
            account: undefined,
            projects: [project],
            error: true,
            loading: false,
          })
      })
    return () => {
      active = false
    }
  }, [knownAccount, attempt])

  useEffect(() => {
    if (!account) return
    const scope: ProjectCatalogScope = {
      accountId: account,
      workspaceId: workspace.id,
    }
    let active = true
    let revision = 0
    async function load() {
      const request = ++revision
      try {
        const custom = await readLocalProjects(scope)
        if (
          custom.some(
            (candidate) =>
              candidate.id === project.id || candidate.key === project.key,
          )
        )
          throw new Error('Project catalog conflicts with the sample project.')
        if (active && revision === request)
          setState({
            account,
            projects: [project, ...custom],
            error: false,
            loading: false,
          })
      } catch {
        if (active && revision === request)
          setState({
            account,
            projects: [project],
            error: true,
            loading: false,
          })
      }
    }
    void load()
    const unsubscribe = subscribeProjectCatalog(scope, () => {
      void load()
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [account, attempt])

  const current =
    state.account === account
      ? state
      : { projects: [project], error: false, loading: true }
  return {
    ...current,
    scope: account ? { accountId: account, workspaceId: workspace.id } : null,
    retry: () => setAttempt((value) => value + 1),
  }
}
