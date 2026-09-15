import { useCallback, useEffect, useRef, useState } from 'react'
import { buildOrganization, buildPlan } from '../services/workspaceService'
import { buildStrategicPlanning, validateStrategicPlanning } from '../services/planningService'
import { buildControlWorkspace } from '../services/controlService'
import { createStorageProvider } from '../storage/createStorageProvider'
import { InMemoryStorageProvider } from '../storage/InMemoryStorageProvider'
import type { StorageMode, StorageProvider } from '../storage/StorageProvider'
import type { AIInteraction, ControlWorkspace, ControlWorkspaceInput, Organization, OrganizationInput, StrategicPlan, StrategicPlanInput, StrategicPlanning, StrategicPlanningInput } from '../types/models'

interface WorkspaceState {
  isLoading: boolean
  mode: StorageMode
  organizations: Organization[]
  plans: StrategicPlan[]
  aiInteractions: AIInteraction[]
  strategicPlannings: StrategicPlanning[]
  controlWorkspaces: ControlWorkspace[]
  warning: string | null
}

export function useStrategicWorkspace() {
  const providerRef = useRef<StorageProvider | null>(null)
  const [state, setState] = useState<WorkspaceState>({
    isLoading: true,
    mode: typeof indexedDB === 'undefined' ? 'memory' : 'indexed-db',
    organizations: [],
    plans: [],
    aiInteractions: [],
    strategicPlannings: [],
    controlWorkspaces: [],
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
      const [organizations, plans, aiInteractions, strategicPlannings, controlWorkspaces] = await Promise.all([
        provider.getOrganizations(),
        provider.getPlans(),
        provider.getAIInteractions(),
        provider.getStrategicPlannings(),
        provider.getControlWorkspaces(),
      ])
      if (!isActive) return
      setState({
        isLoading: false,
        mode: provider.mode,
        organizations,
        plans,
        aiInteractions,
        strategicPlannings,
        controlWorkspaces,
        warning: provider.mode === 'memory' ? 'Las organizaciones, planes y su contenido estratégico se conservarán solo durante esta sesión.' : null,
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
      aiInteractions: current.aiInteractions.filter((interaction) => interaction.organizationId !== id),
      strategicPlannings: current.strategicPlannings.filter((planning) => planning.organizationId !== id),
      controlWorkspaces: current.controlWorkspaces.filter((workspace) => workspace.organizationId !== id),
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
    setState((current) => ({
      ...current,
      plans: current.plans.filter((plan) => plan.id !== id),
      aiInteractions: current.aiInteractions.filter((interaction) => interaction.planId !== id),
      strategicPlannings: current.strategicPlannings.filter((planning) => planning.planId !== id),
      controlWorkspaces: current.controlWorkspaces.filter((workspace) => workspace.planId !== id),
    }))
  }, [])

  const saveAIInteraction = useCallback(async (interaction: AIInteraction) => {
    await providerRef.current?.saveAIInteraction(interaction)
    setState((current) => ({
      ...current,
      aiInteractions: current.aiInteractions.some((item) => item.id === interaction.id)
        ? current.aiInteractions.map((item) => item.id === interaction.id ? interaction : item)
        : [interaction, ...current.aiInteractions],
    }))
    return interaction
  }, [])

  const saveStrategicPlanning = useCallback(async (input: StrategicPlanningInput, existing?: StrategicPlanning) => {
    const errors = validateStrategicPlanning(input)
    if (Object.keys(errors).length > 0) throw new Error(Object.values(errors)[0])
    const planning = buildStrategicPlanning(input, existing)
    await providerRef.current?.saveStrategicPlanning(planning)
    setState((current) => ({
      ...current,
      strategicPlannings: current.strategicPlannings.some((item) => item.id === planning.id)
        ? current.strategicPlannings.map((item) => item.id === planning.id ? planning : item)
        : [...current.strategicPlannings, planning],
    }))
    return planning
  }, [])

  const saveControlWorkspace = useCallback(async (input: ControlWorkspaceInput, existing?: ControlWorkspace) => {
    const workspace = buildControlWorkspace(input, existing)
    await providerRef.current?.saveControlWorkspace(workspace)
    setState((current) => ({
      ...current,
      controlWorkspaces: current.controlWorkspaces.some((item) => item.id === workspace.id)
        ? current.controlWorkspaces.map((item) => item.id === workspace.id ? workspace : item)
        : [...current.controlWorkspaces, workspace],
    }))
    return workspace
  }, [])

  return { ...state, deleteOrganization, deletePlan, saveAIInteraction, saveControlWorkspace, saveOrganization, savePlan, saveStrategicPlanning }
}
