import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../App'

describe('App', () => {
  it('muestra el dashboard inicial y permite configurar la navegación', async () => {
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'GESTIÓN Y CONTROL ESTRATÉGICO IA' })).toBeInTheDocument()
    expect(screen.getAllByText('IA: No configurada')).toHaveLength(2)
    expect(screen.getByText('Organizaciones')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Simulación' }))
    expect(screen.getByRole('status')).toHaveTextContent('Simulación está planificada para una fase posterior')

    fireEvent.click(screen.getByRole('button', { name: 'Configuración' }))
    const compactSwitch = screen.getByRole('switch', { name: 'Navegación compacta' })
    fireEvent.click(compactSwitch)
    await waitFor(() => expect(compactSwitch).toHaveAttribute('aria-checked', 'true'))
  })
})
