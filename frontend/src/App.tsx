import { useState } from 'react'
import { AppShell } from './layouts/AppShell'
import { HomePage } from './pages/HomePage'

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
  const [activeItem, setActiveItem] = useState<NavigationItem>('Inicio')

  return (
    <AppShell activeItem={activeItem} onNavigate={setActiveItem}>
      <HomePage selectedSection={activeItem} />
    </AppShell>
  )
}

export default App
