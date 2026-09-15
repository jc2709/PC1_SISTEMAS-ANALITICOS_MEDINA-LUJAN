import { describe, expect, it } from 'vitest'
import {
  computeFinancialOutputs,
  computeKPIStatus,
  createEmptyControlWorkspace,
  createInitiative,
  createKPI,
  createStrategicObjective,
  deleteObjectiveFromWorkspace,
  getScenarioInputs,
  isInitiativeDelayed,
} from '../services/controlService'

describe('controlService', () => {
  it('calcula NOPAT, ROIC y EVA con las fórmulas financieras', () => {
    expect(computeFinancialOutputs({ sales: 1000, ebit: 200, taxRate: 30, wacc: 10, investedCapital: 1000, otif: 90, wape: 10, oee: 80 }))
      .toEqual({ nopat: 140, roic: 14, eva: 40 })
  })

  it('calcula semáforos y usa gris cuando faltan datos', () => {
    const kpi = createKPI('objective-1')
    expect(computeKPIStatus(kpi)).toBe('GRAY')
    Object.assign(kpi, { actual: 92, target: 100, dataQuality: 'CERTIFIED' as const })
    expect(computeKPIStatus(kpi)).toBe('AMBER')
    kpi.actual = 80
    expect(computeKPIStatus(kpi)).toBe('RED')
    kpi.actual = 105
    expect(computeKPIStatus(kpi)).toBe('GREEN')
  })

  it('genera escenarios determinísticos y conserva el caso base', () => {
    const base = { sales: 1000, ebit: 100, taxRate: 30, wacc: 10, investedCapital: 800, otif: 90, wape: 12, oee: 75 }
    expect(getScenarioInputs('BASE', base)).toEqual(base)
    expect(getScenarioInputs('EXPANSION', base).sales).toBe(1150)
    expect(getScenarioInputs('PROTECTION', base).sales).toBe(920)
  })

  it('elimina en cascada las relaciones, KPI e iniciativas de un objetivo', () => {
    const workspace = createEmptyControlWorkspace('org-1', 'plan-1')
    const objective = createStrategicObjective()
    objective.name = 'Crecer rentablemente'
    const kpi = createKPI(objective.id)
    kpi.name = 'ROIC'
    const initiative = createInitiative(objective.id)
    initiative.name = 'Optimizar capital'
    workspace.objectives = [objective]
    workspace.kpis = [kpi]
    workspace.initiatives = [initiative]

    const result = deleteObjectiveFromWorkspace(workspace, objective.id)
    expect(result.objectives).toEqual([])
    expect(result.kpis).toEqual([])
    expect(result.initiatives).toEqual([])
  })

  it('detecta retrasos solo en iniciativas abiertas', () => {
    const initiative = createInitiative('objective-1')
    initiative.endDate = '2025-01-01'
    expect(isInitiativeDelayed(initiative, new Date('2026-01-01'))).toBe(true)
    initiative.status = 'COMPLETED'
    expect(isInitiativeDelayed(initiative, new Date('2026-01-01'))).toBe(false)
  })
})
