import { useCallback, useEffect, useRef, useState } from 'react'
import { buildOrganization, buildPlan } from '../services/workspaceService'
import { createStorageProvider } from '../storage/createStorageProvider'
import { InMemoryStorageProvider } from '../storage/InMemoryStorageProvider'
import type { StorageMode, StorageProvider } from '../storage/StorageProvider'
import type { Organization, OrganizationInput, StrategicPlan, StrategicPlanInput } from '../types/models'

interface WorkspaceState {
  isLoading: boolean
  mode: StorageMode
  organizations: Organization[]
  plans: StrategicPlan[]
  warning: string | null
}

export function useStrategicWorkspace() {
  const providerRef = useRef<StorageProvider | null>(null)
  const [state, setState] = useState<WorkspaceState>({
    isLoading: true,
    mode: typeof indexedDB === 'undefined' ? 'memory' : 'indexed-db',
    organizations: [],
    plans: [],
    warning: null,
  })

  useEffect(() => {
    let isActive = true

    async function loadWorkspace() {
      let provider: StorageProvider = createStorageProvider()
      try {
        await provider.initialize()
      } catch {
        provider = new InMemoryStorageProvider()
        await provider.initialize()
      }

      providerRef.current = provider
      const [organizations, plans] = await Promise.all([provider.getOrganizations(), provider.getPlans()])
      if (!isActive) return
      setState({
        isLoading: false,
        mode: provider.mode,
        organizations,
        plans,
        warning: provider.mode === 'memory' ? 'Las organizaciones y planes se conservarán solo durante esta sesión.' : null,
      })
    }

    void loadWorkspace().catch(() => {
      if (!isActive) return
      setState((current) => ({ ...current, isLoading: false, warning: 'No se pudieron cargar las organizaciones y planes.' }))
    })
    return () => { isActive = false }
  }, [])

  const saveOrganization = useCallback(async (input: OrganizationInput, existing?: Organization) => {
    const organization = buildOrganization(input, existing)
    await providerRef.current?.saveOrganization(organization)
    setState((current) => ({
      ...current,
      organizations: existing
        ? current.organizations.map((item) => item.id === organization.id ? organization : item)
        : [...current.organizations, organization],
    }))
    return organization
  }, [])

  const deleteOrganization = useCallback(async (id: Organization['id']) => {
    await providerRef.current?.deleteOrganization(id)
    setState((current) => ({
      ...current,
      organizations: current.organizations.filter((organization) => organization.id !== id),
      plans: current.plans.filter((plan) => plan.organizationId !== id),
    }))
  }, [])

  const savePlan = useCallback(async (input: StrategicPlanInput, existing?: StrategicPlan) => {
    const plan = buildPlan(input, existing)
    await providerRef.current?.savePlan(plan)
    setState((current) => ({
      ...current,
      plans: existing
        ? current.plans.map((item) => item.id === plan.id ? plan : item)
        : [...current.plans, plan],
    }))
    return plan
  }, [])

  const deletePlan = useCallback(async (id: StrategicPlan['id']) => {
    await providerRef.current?.deletePlan(id)
    setState((current) => ({ ...current, plans: current.plans.filter((plan) => plan.id !== id) }))
  }, [])

  return { ...state, deleteOrganization, deletePlan, saveOrganization, savePlan }
}
