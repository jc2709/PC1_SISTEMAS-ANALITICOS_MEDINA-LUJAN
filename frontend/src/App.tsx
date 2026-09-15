import { LoadingScreen } from './components/LoadingScreen'
import { useAppPreferences } from './hooks/useAppPreferences'
import { useAIGateway } from './hooks/useAIGateway'
import { useStrategicWorkspace } from './hooks/useStrategicWorkspace'
import { AppShell } from './layouts/AppShell'
import { HomePage } from './pages/HomePage'
import { AIPage } from './pages/AIPage'
import { OrganizationsPage } from './pages/OrganizationsPage'
import { PlanningHubPage } from './pages/PlanningHubPage'
import { SettingsPage } from './pages/SettingsPage'
import { BSCPage } from './pages/BSCPage'
import { InitiativesPage } from './pages/InitiativesPage'
import { SimulationPage } from './pages/SimulationPage'
import { ExecutiveDashboardPage } from './pages/ExecutiveDashboardPage'
import { ReportsPage } from './pages/ReportsPage'

export type NavigationItem =
  | 'Inicio'
  | 'Organización'
  | 'Planeamiento'
  | 'Balanced Scorecard'
  | 'Iniciativas'
  | 'Simulación'
  | 'Dashboard'
  | 'Reportes'
  | 'IA'
  | 'Configuración'

function App() {
  const { isLoading, mode, preferences, setAiApiBaseUrl, setCompactSidebar, setLastSection, warning } = useAppPreferences()
  const workspace = useStrategicWorkspace()
  const ai = useAIGateway(preferences.aiApiBaseUrl)
  const activeItem = isNavigationItem(preferences.lastSection) ? preferences.lastSection : 'Inicio'

  const handleNavigate = (item: NavigationItem) => {
    void setLastSection(item)
  }

  if (isLoading) return <LoadingScreen />

  return (
    <AppShell activeItem={activeItem} aiStatus={ai.connection.status} compactSidebar={preferences.compactSidebar} onNavigate={handleNavigate}>
      {warning ? <div className="mx-auto mb-5 max-w-[1500px] rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">{warning}</div> : null}
      {activeItem === 'Organización' ? (
        <OrganizationsPage isLoading={workspace.isLoading} mode={workspace.mode} onDelete={workspace.deleteOrganization} onSave={workspace.saveOrganization} organizations={workspace.organizations} plans={workspace.plans} warning={workspace.warning} />
      ) : activeItem === 'Planeamiento' ? (
        <PlanningHubPage aiInteractions={workspace.aiInteractions} isLoading={workspace.isLoading} mode={workspace.mode} onDeletePlan={workspace.deletePlan} onRequestOrganization={() => void setLastSection('Organización')} onSavePlan={workspace.savePlan} onSavePlanning={workspace.saveStrategicPlanning} organizations={workspace.organizations} plans={workspace.plans} strategicPlannings={workspace.strategicPlannings} warning={workspace.warning} />
      ) : activeItem === 'IA' ? (
        <AIPage apiBaseUrl={preferences.aiApiBaseUrl} connection={ai.connection} interactions={workspace.aiInteractions} onAnalyze={ai.analyze} onConfigure={() => void setLastSection('Configuración')} onRefresh={ai.refresh} onSaveInteraction={workspace.saveAIInteraction} organizations={workspace.organizations} plans={workspace.plans} />
      ) : activeItem === 'Balanced Scorecard' ? (
        <BSCPage controlWorkspaces={workspace.controlWorkspaces} onSave={workspace.saveControlWorkspace} organizations={workspace.organizations} plans={workspace.plans} />
      ) : activeItem === 'Iniciativas' ? (
        <InitiativesPage controlWorkspaces={workspace.controlWorkspaces} onSave={workspace.saveControlWorkspace} organizations={workspace.organizations} plans={workspace.plans} />
      ) : activeItem === 'Simulación' ? (
        <SimulationPage controlWorkspaces={workspace.controlWorkspaces} onSave={workspace.saveControlWorkspace} organizations={workspace.organizations} plans={workspace.plans} />
      ) : activeItem === 'Dashboard' ? (
        <ExecutiveDashboardPage aiConnection={ai.connection} controlWorkspaces={workspace.controlWorkspaces} onExplain={ai.explainDashboard} onSave={workspace.saveControlWorkspace} organizations={workspace.organizations} plans={workspace.plans} />
      ) : activeItem === 'Reportes' ? (
        <ReportsPage controlWorkspaces={workspace.controlWorkspaces} onSave={workspace.saveControlWorkspace} organizations={workspace.organizations} plans={workspace.plans} strategicPlannings={workspace.strategicPlannings} />
      ) : activeItem === 'Configuración' ? (
        <SettingsPage aiApiBaseUrl={preferences.aiApiBaseUrl} compactSidebar={preferences.compactSidebar} onAiApiBaseUrlChange={setAiApiBaseUrl} onCompactSidebarChange={setCompactSidebar} storageMode={mode} />
      ) : (
        <HomePage aiStatus={ai.connection.status} initiativeCount={workspace.controlWorkspaces.reduce((total, item) => total + item.initiatives.length, 0)} kpiCount={workspace.controlWorkspaces.reduce((total, item) => total + item.kpis.length, 0)} objectiveCount={workspace.controlWorkspaces.reduce((total, item) => total + item.objectives.length, 0)} organizationCount={workspace.organizations.length} planCount={workspace.plans.filter((plan) => plan.status === 'ACTIVE').length} selectedSection={activeItem} storageMode={mode} />
      )}
    </AppShell>
  )
}

const navigationItems: NavigationItem[] = ['Inicio', 'Organización', 'Planeamiento', 'Balanced Scorecard', 'Iniciativas', 'Simulación', 'Dashboard', 'Reportes', 'IA', 'Configuración']

function isNavigationItem(value: string): value is NavigationItem {
  return navigationItems.includes(value as NavigationItem)
}

export default App
