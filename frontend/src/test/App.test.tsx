import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../App'

describe('App', () => {
  it('muestra el dashboard inicial y comunica los módulos futuros', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'GESTIÓN Y CONTROL ESTRATÉGICO IA' })).toBeInTheDocument()
    expect(screen.getAllByText('IA: No configurada')).toHaveLength(2)
    expect(screen.getByText('Organizaciones')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Simulación' }))
    expect(screen.getByRole('status')).toHaveTextContent('Simulación está planificada para una fase posterior')
  })
})
