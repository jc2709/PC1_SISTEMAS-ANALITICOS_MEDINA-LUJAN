import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App'

describe('App', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('muestra el dashboard inicial y permite configurar la navegación', async () => {
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'GESTIÓN Y CONTROL ESTRATÉGICO IA' })).toBeInTheDocument()
    expect(screen.getAllByText('IA: No configurada')).toHaveLength(2)
    expect(screen.getByText('Organizaciones')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Simulación' }))
    expect(screen.getByRole('status')).toHaveTextContent('Simulación está planificada para una fase posterior')

    fireEvent.click(screen.getByRole('button', { name: 'IA' }))
    expect(screen.getByRole('heading', { name: 'Copiloto IA' })).toBeInTheDocument()
    expect(screen.getByText('Primero registra una organización y un plan estratégico.')).toBeInTheDocument()

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

  it('genera una propuesta estructurada y conserva la decisión humana', async () => {
    const analysis = { executiveSummary: 'AndesPack cuenta con una base industrial que debe proteger.', strengths: ['Oferta B2B'], risks: ['Concentración comercial'], priorities: ['Diversificar clientes'], confidence: 0.84 }
    vi.stubGlobal('fetch', vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'POST') return new Response(JSON.stringify({ analysis, model: 'gemini-2.5-flash' }), { status: 200 })
      return new Response(JSON.stringify({ status: 'ready', model: 'gemini-2.5-flash' }), { status: 200 })
    }))
    render(<App />)

    await screen.findByRole('heading', { name: 'GESTIÓN Y CONTROL ESTRATÉGICO IA' })
    fireEvent.click(screen.getByRole('button', { name: 'Organización' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Nueva organización' }))
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'AndesPack S.A.C.' } })
    fireEvent.change(screen.getByLabelText(/Sector/), { target: { value: 'Industria' } })
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!)
    await screen.findByText('Se creó AndesPack S.A.C.')

    fireEvent.click(screen.getByRole('button', { name: 'Planeamiento' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Nuevo plan' }))
    fireEvent.change(screen.getByLabelText('Nombre del plan*'), { target: { value: 'Plan Estratégico 2027' } })
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!)
    await screen.findByText('Se creó Plan Estratégico 2027')

    fireEvent.click(screen.getByRole('button', { name: 'Configuración' }))
    fireEvent.change(await screen.findByLabelText('URL del backend'), { target: { value: 'https://example.vercel.app' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar URL' }))
    await screen.findByText('Configuración guardada')

    fireEvent.click(screen.getByRole('button', { name: 'IA' }))
    const generateButton = await screen.findByRole('button', { name: 'Generar propuesta con Gemini' })
    await waitFor(() => expect(generateButton).toBeEnabled())
    fireEvent.click(generateButton)

    expect(await screen.findByText(analysis.executiveSummary)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }))
    expect(await screen.findByText('La propuesta fue aprobada por el usuario.')).toBeInTheDocument()
    expect(screen.getAllByText('Aprobada').length).toBeGreaterThan(0)
  })
})
