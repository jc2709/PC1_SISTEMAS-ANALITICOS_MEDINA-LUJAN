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

  it('crea una organización y un plan estratégico vinculados', async () => {
    render(<App />)

    await screen.findByRole('heading', { name: 'GESTIÓN Y CONTROL ESTRATÉGICO IA' })
    fireEvent.click(screen.getByRole('button', { name: 'Organización' }))
    await screen.findByRole('heading', { name: 'Organizaciones' })

    fireEvent.click(screen.getByRole('button', { name: 'Nueva organización' }))
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'AndesPack S.A.C.' } })
    fireEvent.change(screen.getByLabelText(/Sector/), { target: { value: 'Industria B2B' } })
    expect(screen.getByLabelText(/Nombre/)).toHaveValue('AndesPack S.A.C.')
    expect(screen.getByLabelText(/Sector/)).toHaveValue('Industria B2B')
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!)
    expect(await screen.findByText('Se creó AndesPack S.A.C.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Planeamiento' }))
    await screen.findByRole('heading', { name: 'Planes estratégicos' })
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo plan' }))
    fireEvent.change(screen.getByLabelText('Nombre del plan*'), { target: { value: 'Plan Estratégico 2027–2029' } })
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'ACTIVE' } })
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!)

    expect(await screen.findByText('Se creó Plan Estratégico 2027–2029')).toBeInTheDocument()
    expect(screen.getByText('Activo')).toBeInTheDocument()
    expect(screen.getAllByText('AndesPack S.A.C.')).toHaveLength(2)
  })
})
