import { strFromU8, unzipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import { applyImportPreview, buildPptx, buildXlsx, validateImportSheets } from '../services/reportService'
import type { ControlWorkspace } from '../types/models'

const workspace: ControlWorkspace = {
  id: 'control-1', organizationId: 'org-1', planId: 'plan-1', relationships: [], scheduleApproved: true, simulations: [], executiveNarratives: [], createdAt: '2026-01-01', updatedAt: '2026-01-01',
  objectives: [{ id: 'objective-1', name: 'Servicio confiable', description: '', perspective: 'CUSTOMER', owner: '', priority: 'HIGH' }],
  kpis: [{ id: 'kpi-1', objectiveId: 'objective-1', name: 'OTIF', description: '', purpose: '', formula: '', unit: '%', direction: 'HIGHER_IS_BETTER', source: '', frequency: 'Mensual', baseline: 90, target: 96, trajectory: 93, actual: 91, forecast: 95, responsible: '', deviationAction: '', dataQuality: 'REVIEW', risk: '' }],
  initiatives: [{ id: 'initiative-1', name: 'Torre de control', description: '', objectiveId: 'objective-1', kpiId: 'kpi-1', owner: '', startDate: '2027-01-01', endDate: '2027-12-31', budget: 1, expectedBenefit: 2, risk: '', status: 'PLANNED', progress: 10, dependencies: [] }],
}

describe('reportService', () => {
  it('valida y aplica una importación sin guardar parcialmente', () => {
    const preview = validateImportSheets({
      KPI: [{ Nombre: 'OTIF', Real: 94, Meta: 97, Trayectoria: 95, Forecast: 96, Calidad: 'CERTIFIED' }],
      Iniciativas: [{ Nombre: 'Torre de control', Avance: 45, Estado: 'IN_PROGRESS' }],
    }, workspace)
    expect(preview.errors).toEqual([])
    const result = applyImportPreview(workspace, preview)
    expect(result.kpis[0]).toMatchObject({ actual: 94, target: 97, dataQuality: 'CERTIFIED' })
    expect(result.initiatives[0]).toMatchObject({ progress: 45, status: 'IN_PROGRESS' })
  })

  it('informa hoja, fila, columna, campo y motivo para datos inválidos', () => {
    const preview = validateImportSheets({ KPI: [{ Nombre: 'Desconocido', Real: 'x' }], Iniciativas: [{ Nombre: 'Torre de control', Avance: 120, Estado: 'otro' }] }, workspace)
    expect(preview.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ sheet: 'KPI', row: 2, column: 'A', field: 'Nombre' }),
      expect.objectContaining({ sheet: 'Iniciativas', row: 2, column: 'B', field: 'Avance' }),
      expect.objectContaining({ sheet: 'Iniciativas', row: 2, column: 'C', field: 'Estado' }),
    ]))
    expect(() => applyImportPreview(workspace, preview)).toThrow('Corrige los errores')
  })

  it('genera paquetes OOXML mínimos para Excel y PowerPoint', () => {
    const xlsx = unzipSync(buildXlsx({ KPI: [['Nombre', 'Real'], ['OTIF & OEE < 95%', 91]] }))
    expect(strFromU8(xlsx['xl/workbook.xml'])).toContain('sheet name="KPI"')
    expect(xlsx['xl/worksheets/sheet1.xml']).toBeDefined()
    const worksheet = strFromU8(xlsx['xl/worksheets/sheet1.xml'])
    expect(worksheet.indexOf('<cols>')).toBeLessThan(worksheet.indexOf('<sheetData>'))
    expect(worksheet).toContain('OTIF &amp; OEE &lt; 95%')
    expect(new DOMParser().parseFromString(worksheet, 'application/xml').querySelector('parsererror')).toBeNull()
    const pptx = unzipSync(buildPptx([{ title: 'Resumen', lines: ['EVA positivo'] }]))
    expect(strFromU8(pptx['ppt/presentation.xml'])).toContain('p:sldId')
    expect(strFromU8(pptx['ppt/slides/slide1.xml'])).toContain('EVA positivo')
    expect(strFromU8(pptx['ppt/slideMasters/slideMaster1.xml'])).toContain('<p:clrMap')
    const theme = strFromU8(pptx['ppt/theme/theme1.xml'])
    expect(theme.match(/<a:effectStyle>/g)).toHaveLength(3)
    expect(new DOMParser().parseFromString(theme, 'application/xml').querySelector('parsererror')).toBeNull()
  })
})
