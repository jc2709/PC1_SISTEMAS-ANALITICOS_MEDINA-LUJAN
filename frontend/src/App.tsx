import { LoadingScreen } from './components/LoadingScreen'
import { useAppPreferences } from './hooks/useAppPreferences'
import { AppShell } from './layouts/AppShell'
import { HomePage } from './pages/HomePage'
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
  const { isLoading, mode, preferences, setCompactSidebar, setLastSection, warning } = useAppPreferences()
  const activeItem = isNavigationItem(preferences.lastSection) ? preferences.lastSection : 'Inicio'

  const handleNavigate = (item: NavigationItem) => {
    void setLastSection(item)
  }

  if (isLoading) return <LoadingScreen />

  return (
    <AppShell activeItem={activeItem} compactSidebar={preferences.compactSidebar} onNavigate={handleNavigate}>
      {warning ? <div className="mx-auto mb-5 max-w-[1500px] rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">{warning}</div> : null}
      {activeItem === 'Configuración' ? (
        <SettingsPage compactSidebar={preferences.compactSidebar} onCompactSidebarChange={setCompactSidebar} storageMode={mode} />
      ) : (
        <HomePage selectedSection={activeItem} storageMode={mode} />
      )}
    </AppShell>
  )
}

const navigationItems: NavigationItem[] = ['Inicio', 'Organización', 'Planeamiento', 'Balanced Scorecard', 'Simulación', 'Dashboard', 'IA', 'Configuración']

function isNavigationItem(value: string): value is NavigationItem {
  return navigationItems.includes(value as NavigationItem)
}

export default App
