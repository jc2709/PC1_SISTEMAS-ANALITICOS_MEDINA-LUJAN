import { LoadingScreen } from './components/LoadingScreen'
import { useAppPreferences } from './hooks/useAppPreferences'
import { useAIGateway } from './hooks/useAIGateway'
import { useStrategicWorkspace } from './hooks/useStrategicWorkspace'
import { AppShell } from './layouts/AppShell'
import { HomePage } from './pages/HomePage'
import { AIPage } from './pages/AIPage'
import { OrganizationsPage } from './pages/OrganizationsPage'
import { PlansPage } from './pages/PlansPage'
import { SettingsPage } from './pages/SettingsPage'

export type NavigationItem =
  | 'Inicio'
  | 'Organización'
  | 'Planeamiento'
  | 'Balanced Scorecard'
  | 'Simulación'
  | 'Dashboard'
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
        <PlansPage isLoading={workspace.isLoading} mode={workspace.mode} onDelete={workspace.deletePlan} onRequestOrganization={() => void setLastSection('Organización')} onSave={workspace.savePlan} organizations={workspace.organizations} plans={workspace.plans} warning={workspace.warning} />
      ) : activeItem === 'IA' ? (
        <AIPage apiBaseUrl={preferences.aiApiBaseUrl} connection={ai.connection} interactions={workspace.aiInteractions} onAnalyze={ai.analyze} onConfigure={() => void setLastSection('Configuración')} onRefresh={ai.refresh} onSaveInteraction={workspace.saveAIInteraction} organizations={workspace.organizations} plans={workspace.plans} />
      ) : activeItem === 'Configuración' ? (
        <SettingsPage aiApiBaseUrl={preferences.aiApiBaseUrl} compactSidebar={preferences.compactSidebar} onAiApiBaseUrlChange={setAiApiBaseUrl} onCompactSidebarChange={setCompactSidebar} storageMode={mode} />
      ) : (
        <HomePage aiStatus={ai.connection.status} organizationCount={workspace.organizations.length} planCount={workspace.plans.filter((plan) => plan.status === 'ACTIVE').length} selectedSection={activeItem} storageMode={mode} />
      )}
    </AppShell>
  )
}

const navigationItems: NavigationItem[] = ['Inicio', 'Organización', 'Planeamiento', 'Balanced Scorecard', 'Simulación', 'Dashboard', 'IA', 'Configuración']

function isNavigationItem(value: string): value is NavigationItem {
  return navigationItems.includes(value as NavigationItem)
}

export default App
