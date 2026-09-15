import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import type { ControlWorkspace, ControlWorkspaceInput, Initiative, KPI, Organization, StrategicPlan, StrategicPlanning } from '../types/models'
import { computeKPIStatus, toControlWorkspaceInput } from './controlService'

export interface ImportError {
  sheet: string
  row: number
  column: string
  field: string
  reason: string
}

export interface ImportPreview {
  kpiUpdates: Array<{ id: string; changes: Partial<KPI> }>
  initiativeUpdates: Array<{ id: string; changes: Partial<Initiative> }>
  errors: ImportError[]
  processedRows: number
}

type CellValue = string | number | null | undefined

export async function parseImportWorkbook(buffer: ArrayBuffer, workspace: ControlWorkspace): Promise<ImportPreview> {
  if (buffer.byteLength > 5_000_000) throw new Error('El archivo supera el límite de 5 MB.')
  const sheets = readWorkbook(buffer)
  return validateImportSheets(sheets, workspace)
}

export function validateImportSheets(sheets: Record<string, Array<Record<string, CellValue>>>, workspace: ControlWorkspace): ImportPreview {
  const preview: ImportPreview = { kpiUpdates: [], initiativeUpdates: [], errors: [], processedRows: 0 }
  const kpiRows = sheets.KPI ?? []
  const initiativeRows = sheets.Iniciativas ?? []
  if (!sheets.KPI) preview.errors.push(error('KPI', 1, '—', 'Hoja', 'Falta la hoja KPI.'))
  if (!sheets.Iniciativas) preview.errors.push(error('Iniciativas', 1, '—', 'Hoja', 'Falta la hoja Iniciativas.'))

  kpiRows.forEach((row, index) => {
    preview.processedRows += 1
    const rowNumber = index + 2
    const name = text(row.Nombre)
    const kpi = workspace.kpis.find((item) => normalize(item.name) === normalize(name))
    if (!name) return preview.errors.push(error('KPI', rowNumber, 'A', 'Nombre', 'El nombre es obligatorio.'))
    if (!kpi) return preview.errors.push(error('KPI', rowNumber, 'A', 'Nombre', 'No coincide con un KPI del plan seleccionado.'))
    const changes: Partial<KPI> = {}
    for (const [column, field, key] of [['B', 'Real', 'actual'], ['C', 'Meta', 'target'], ['D', 'Trayectoria', 'trajectory'], ['E', 'Forecast', 'forecast']] as const) {
      const parsed = optionalNumber(row[field])
      if (parsed === 'invalid') preview.errors.push(error('KPI', rowNumber, column, field, 'Debe ser un número o quedar vacío.'))
      else changes[key] = parsed
    }
    const quality = text(row.Calidad).toUpperCase()
    if (quality) {
      const mapped = QUALITY_ALIASES[quality]
      if (!mapped) preview.errors.push(error('KPI', rowNumber, 'F', 'Calidad', 'Usa CERTIFIED, REVIEW o MISSING.'))
      else changes.dataQuality = mapped
    }
    preview.kpiUpdates.push({ id: kpi.id, changes })
  })

  initiativeRows.forEach((row, index) => {
    preview.processedRows += 1
    const rowNumber = index + 2
    const name = text(row.Nombre)
    const initiative = workspace.initiatives.find((item) => normalize(item.name) === normalize(name))
    if (!name) return preview.errors.push(error('Iniciativas', rowNumber, 'A', 'Nombre', 'El nombre es obligatorio.'))
    if (!initiative) return preview.errors.push(error('Iniciativas', rowNumber, 'A', 'Nombre', 'No coincide con una iniciativa del plan seleccionado.'))
    const changes: Partial<Initiative> = {}
    const progress = optionalNumber(row.Avance)
    if (progress === 'invalid' || progress === null || progress < 0 || progress > 100) preview.errors.push(error('Iniciativas', rowNumber, 'B', 'Avance', 'Debe estar entre 0 y 100.'))
    else changes.progress = progress
    const status = text(row.Estado).toUpperCase()
    if (status) {
      const mapped = STATUS_ALIASES[status]
      if (!mapped) preview.errors.push(error('Iniciativas', rowNumber, 'C', 'Estado', 'Usa PLANNED, IN_PROGRESS, BLOCKED, COMPLETED o CANCELLED.'))
      else changes.status = mapped
    }
    preview.initiativeUpdates.push({ id: initiative.id, changes })
  })
  return preview
}

export function applyImportPreview(workspace: ControlWorkspace, preview: ImportPreview): ControlWorkspaceInput {
  if (preview.errors.length > 0) throw new Error('Corrige los errores antes de guardar la importación.')
  const kpiChanges = new Map(preview.kpiUpdates.map((item) => [item.id, item.changes]))
  const initiativeChanges = new Map(preview.initiativeUpdates.map((item) => [item.id, item.changes]))
  return {
    ...toControlWorkspaceInput(workspace),
    kpis: workspace.kpis.map((item) => ({ ...item, ...kpiChanges.get(item.id) })),
    initiatives: workspace.initiatives.map((item) => ({ ...item, ...initiativeChanges.get(item.id) })),
  }
}

export function downloadImportTemplate(workspace: ControlWorkspace, plan: StrategicPlan) {
  const sheets = {
    KPI: [['Nombre', 'Real', 'Meta', 'Trayectoria', 'Forecast', 'Calidad'], ...workspace.kpis.map((kpi) => [kpi.name, kpi.actual, kpi.target, kpi.trajectory, kpi.forecast, kpi.dataQuality])],
    Iniciativas: [['Nombre', 'Avance', 'Estado'], ...workspace.initiatives.map((item) => [item.name, item.progress, item.status])],
    Instrucciones: [['PLANTILLA DE ACTUALIZACIÓN'], ['No cambies los nombres de KPI o iniciativas.'], ['Calidad KPI: CERTIFIED, REVIEW o MISSING.'], ['Estado: PLANNED, IN_PROGRESS, BLOCKED, COMPLETED o CANCELLED.'], ['La aplicación validará cada fila antes de guardar.']],
  }
  downloadBytes(buildXlsx(sheets), `${safeName(plan.name)}-plantilla.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
}

export function exportPlanExcel(organization: Organization, plan: StrategicPlan, planning: StrategicPlanning | undefined, workspace: ControlWorkspace) {
  const sheets: Record<string, CellValue[][]> = {
    Resumen: [['Organización', organization.name], ['Sector', organization.sector], ['Plan', plan.name], ['Periodo', `${plan.startYear}-${plan.endYear}`], ['Estado', plan.status], ['Mandato', planning?.mandate ?? ''], ['Reto', planning?.strategicChallenge ?? '']],
    Objetivos: [['Perspectiva', 'Objetivo', 'Descripción', 'Responsable', 'Prioridad'], ...workspace.objectives.map((item) => [item.perspective, item.name, item.description, item.owner, item.priority])],
    KPI: [['Nombre', 'Objetivo', 'Unidad', 'Real', 'Meta', 'Trayectoria', 'Forecast', 'Calidad', 'Estado'], ...workspace.kpis.map((item) => [item.name, workspace.objectives.find((objective) => objective.id === item.objectiveId)?.name ?? '', item.unit, item.actual, item.target, item.trajectory, item.forecast, item.dataQuality, computeKPIStatus(item)])],
    Iniciativas: [['Nombre', 'Objetivo', 'Responsable', 'Inicio', 'Fin', 'Presupuesto', 'Beneficio', 'Avance', 'Estado', 'Riesgo'], ...workspace.initiatives.map((item) => [item.name, workspace.objectives.find((objective) => objective.id === item.objectiveId)?.name ?? '', item.owner, item.startDate, item.endDate, item.budget, item.expectedBenefit, item.progress, item.status, item.risk])],
    Simulaciones: [['Periodo', 'Escenario', 'Ventas', 'EBIT', 'NOPAT', 'ROIC', 'EVA', 'OTIF', 'WAPE', 'OEE'], ...workspace.simulations.map((item) => [item.period, item.scenario, item.inputs.sales, item.inputs.ebit, item.outputs.nopat, item.outputs.roic, item.outputs.eva, item.inputs.otif, item.inputs.wape, item.inputs.oee])],
  }
  downloadBytes(buildXlsx(sheets), `${safeName(plan.name)}-reporte.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
}

export function exportPlanPowerPoint(organization: Organization, plan: StrategicPlan, workspace: ControlWorkspace) {
  const latest = latestSimulation(workspace)
  const approvedNarrative = (workspace.executiveNarratives ?? []).find((item) => item.status === 'APPROVED')
  const slides = [
    { title: plan.name, lines: [organization.name, `${plan.startYear}–${plan.endYear}`, 'Gestión y Control Estratégico IA'] },
    { title: 'Dashboard ejecutivo', lines: latest ? [`Ventas: S/ ${formatNumber(latest.inputs.sales)}`, `EBIT: S/ ${formatNumber(latest.inputs.ebit)}`, `ROIC: ${formatNumber(latest.outputs.roic)}%`, `EVA: S/ ${formatNumber(latest.outputs.eva)}`, `OTIF: ${formatNumber(latest.inputs.otif)}% · OEE: ${formatNumber(latest.inputs.oee)}%`] : ['Sin simulaciones registradas.'] },
    { title: 'Objetivos y KPI', lines: workspace.kpis.slice(0, 8).map((kpi) => `${kpi.name}: real ${formatValue(kpi.actual, kpi.unit)} · meta ${formatValue(kpi.target, kpi.unit)} · ${computeKPIStatus(kpi)}`) },
    { title: 'Ejecución', lines: workspace.initiatives.slice(0, 8).map((item) => `${item.name}: ${item.progress}% · ${item.status}`) },
    { title: 'Narrativa ejecutiva aprobada', lines: approvedNarrative ? [`DATO: ${approvedNarrative.finalContent.data}`, `INFERENCIA: ${approvedNarrative.finalContent.inference}`, `PRONÓSTICO: ${approvedNarrative.finalContent.forecast}`, `RECOMENDACIÓN: ${approvedNarrative.finalContent.recommendation}`] : ['No hay una narrativa de IA aprobada para este plan.'] },
  ]
  downloadBytes(buildPptx(slides), `${safeName(plan.name)}-presentacion.pptx`, 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
}

export async function exportPlanPdf(organization: Organization, plan: StrategicPlan, workspace: ControlWorkspace) {
  const { jsPDF } = await import('jspdf')
  const document = new jsPDF({ unit: 'mm', format: 'a4' })
  const latest = latestSimulation(workspace)
  document.setFont('helvetica', 'bold'); document.setFontSize(18); document.text('Gestión y Control Estratégico IA', 18, 20)
  document.setFontSize(14); document.text(plan.name, 18, 31)
  document.setFont('helvetica', 'normal'); document.setFontSize(10); document.text(`${organization.name} · ${plan.startYear}-${plan.endYear}`, 18, 39)
  let y = 52
  const section = (title: string, lines: string[]) => {
    if (y > 255) { document.addPage(); y = 20 }
    document.setFont('helvetica', 'bold'); document.setFontSize(12); document.text(title, 18, y); y += 7
    document.setFont('helvetica', 'normal'); document.setFontSize(9)
    for (const line of lines) { const wrapped = document.splitTextToSize(line, 174) as string[]; document.text(wrapped, 18, y); y += wrapped.length * 5 + 2; if (y > 275) { document.addPage(); y = 20 } }
    y += 4
  }
  section('Resumen financiero', latest ? [`Escenario ${latest.scenario} ${latest.period}: ventas S/ ${formatNumber(latest.inputs.sales)}, EBIT S/ ${formatNumber(latest.inputs.ebit)}, ROIC ${formatNumber(latest.outputs.roic)}% y EVA S/ ${formatNumber(latest.outputs.eva)}.`] : ['Sin simulaciones registradas.'])
  section('Balanced Scorecard', workspace.kpis.map((kpi) => `${kpi.name}: real ${formatValue(kpi.actual, kpi.unit)}, meta ${formatValue(kpi.target, kpi.unit)}, estado ${computeKPIStatus(kpi)}.`))
  section('Iniciativas', workspace.initiatives.map((item) => `${item.name}: ${item.progress}% de avance, estado ${item.status}, responsable ${item.owner || 'sin asignar'}.`))
  const narrative = (workspace.executiveNarratives ?? []).find((item) => item.status === 'APPROVED')
  if (narrative) section('Narrativa ejecutiva aprobada', [`DATO: ${narrative.finalContent.data}`, `INFERENCIA: ${narrative.finalContent.inference}`, `PRONÓSTICO: ${narrative.finalContent.forecast}`, `RECOMENDACIÓN: ${narrative.finalContent.recommendation}`])
  document.save(`${safeName(plan.name)}-reporte.pdf`)
}

function readWorkbook(buffer: ArrayBuffer) {
  const files = unzipSync(new Uint8Array(buffer))
  const workbookXml = decodeRequired(files, 'xl/workbook.xml')
  const relationshipsXml = decodeRequired(files, 'xl/_rels/workbook.xml.rels')
  const workbook = new DOMParser().parseFromString(workbookXml, 'application/xml')
  const relationships = new DOMParser().parseFromString(relationshipsXml, 'application/xml')
  const targets = new Map(Array.from(relationships.getElementsByTagName('Relationship')).map((item) => [item.getAttribute('Id') ?? '', item.getAttribute('Target') ?? '']))
  const sharedStrings = files['xl/sharedStrings.xml'] ? Array.from(new DOMParser().parseFromString(strFromU8(files['xl/sharedStrings.xml']), 'application/xml').getElementsByTagName('si')).map((item) => item.textContent ?? '') : []
  const result: Record<string, Array<Record<string, CellValue>>> = {}
  for (const sheet of Array.from(workbook.getElementsByTagName('sheet'))) {
    const name = sheet.getAttribute('name') ?? ''
    const relationshipId = sheet.getAttribute('r:id') ?? ''
    const target = targets.get(relationshipId)
    if (!name || !target) continue
    const path = target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`
    const worksheetXml = decodeRequired(files, path)
    result[name] = readWorksheet(worksheetXml, sharedStrings)
  }
  return result
}

function readWorksheet(xml: string, sharedStrings: string[]) {
  const document = new DOMParser().parseFromString(xml, 'application/xml')
  const rows = Array.from(document.getElementsByTagName('row'))
  const grid = rows.map((row) => {
    const values: CellValue[] = []
    for (const cell of Array.from(row.getElementsByTagName('c'))) {
      const reference = cell.getAttribute('r') ?? 'A1'
      const column = columnNumber(reference.replace(/[0-9]/g, ''))
      const type = cell.getAttribute('t')
      const raw = cell.getElementsByTagName('v')[0]?.textContent ?? ''
      values[column] = type === 'inlineStr' ? cell.getElementsByTagName('t')[0]?.textContent ?? '' : type === 's' ? sharedStrings[Number(raw)] ?? '' : raw === '' ? '' : Number(raw)
    }
    return values
  })
  const headers = (grid[0] ?? []).map((value) => text(value))
  return grid.slice(1).filter((row) => row.some((value) => value !== '' && value !== undefined)).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])))
}

export function buildXlsx(sheets: Record<string, CellValue[][]>) {
  const entries = Object.entries(sheets).slice(0, 12)
  const files: Record<string, Uint8Array> = {
    '[Content_Types].xml': xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${entries.map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`),
    '_rels/.rels': xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    'xl/workbook.xml': xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${entries.map(([name], index) => `<sheet name="${escapeXml(name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join('')}</sheets></workbook>`),
    'xl/_rels/workbook.xml.rels': xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${entries.map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join('')}<Relationship Id="rId${entries.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),
    'xl/styles.xml': xml('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Aptos"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Aptos"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0B1D33"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs></styleSheet>'),
  }
  entries.forEach(([, rows], index) => { files[`xl/worksheets/sheet${index + 1}.xml`] = xml(worksheetXml(rows)) })
  return zipSync(files, { level: 6 })
}

function worksheetXml(rows: CellValue[][]) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.map((row, rowIndex) => `<row r="${rowIndex + 1}">${row.map((value, columnIndex) => cellXml(value, columnIndex, rowIndex)).join('')}</row>`).join('')}</sheetData><cols><col min="1" max="20" width="22" customWidth="1"/></cols></worksheet>`
}

function cellXml(value: CellValue, columnIndex: number, rowIndex: number) {
  const reference = `${columnName(columnIndex)}${rowIndex + 1}`
  const style = rowIndex === 0 ? ' s="1"' : ''
  return typeof value === 'number' && Number.isFinite(value) ? `<c r="${reference}"${style}><v>${value}</v></c>` : `<c r="${reference}" t="inlineStr"${style}><is><t xml:space="preserve">${escapeXml(value == null ? '' : String(value))}</t></is></c>`
}

export function buildPptx(slides: Array<{ title: string; lines: string[] }>) {
  const now = new Date().toISOString()
  const overrides = slides.map((_, index) => `<Override PartName="/ppt/slides/slide${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('')
  const files: Record<string, Uint8Array> = {
    '[Content_Types].xml': xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>${overrides}</Types>`),
    '_rels/.rels': xml('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>'),
    'docProps/core.xml': xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Gestión y Control Estratégico IA</dc:title><dc:creator>Gestión y Control Estratégico IA</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created></cp:coreProperties>`),
    'docProps/app.xml': xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Gestión y Control Estratégico IA</Application><Slides>${slides.length}</Slides></Properties>`),
    'ppt/presentation.xml': xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${slides.map((_, index) => `<p:sldId id="${256 + index}" r:id="rId${index + 2}"/>`).join('')}</p:sldIdLst><p:sldSz cx="12192000" cy="6858000" type="screen16x9"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`),
    'ppt/_rels/presentation.xml.rels': xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>${slides.map((_, index) => `<Relationship Id="rId${index + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${index + 1}.xml"/>`).join('')}</Relationships>`),
    'ppt/slideMasters/slideMaster1.xml': xml('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:sldLayoutIdLst><p:sldLayoutId id="1" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>'),
    'ppt/slideMasters/_rels/slideMaster1.xml.rels': xml('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>'),
    'ppt/slideLayouts/slideLayout1.xml': xml('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld></p:sldLayout>'),
    'ppt/slideLayouts/_rels/slideLayout1.xml.rels': xml('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>'),
    'ppt/theme/theme1.xml': xml('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="GCEIA"><a:themeElements><a:clrScheme name="GCEIA"><a:dk1><a:srgbClr val="071426"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="0B1D33"/></a:dk2><a:lt2><a:srgbClr val="F4F7FA"/></a:lt2><a:accent1><a:srgbClr val="23C8C8"/></a:accent1><a:accent2><a:srgbClr val="2563EB"/></a:accent2><a:accent3><a:srgbClr val="10B981"/></a:accent3><a:accent4><a:srgbClr val="F59E0B"/></a:accent4><a:accent5><a:srgbClr val="8B5CF6"/></a:accent5><a:accent6><a:srgbClr val="EF4444"/></a:accent6><a:hlink><a:srgbClr val="2563EB"/></a:hlink><a:folHlink><a:srgbClr val="7C3AED"/></a:folHlink></a:clrScheme><a:fontScheme name="Aptos"><a:majorFont><a:latin typeface="Aptos Display"/></a:majorFont><a:minorFont><a:latin typeface="Aptos"/></a:minorFont></a:fontScheme><a:fmtScheme name="GCEIA"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>'),
  }
  slides.forEach((slide, index) => {
    files[`ppt/slides/slide${index + 1}.xml`] = xml(slideXml(slide.title, slide.lines))
    files[`ppt/slides/_rels/slide${index + 1}.xml.rels`] = xml('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>')
  })
  return zipSync(files, { level: 6 })
}

function slideXml(title: string, lines: string[]) {
  const body = lines.length ? lines : ['Sin datos disponibles.']
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="F4F7FA"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${textShape(2, 'Título', title, 610000, 430000, 10900000, 900000, 2600, true, '0B1D33')}${textShape(3, 'Contenido', body.map((line) => `• ${line}`).join('\n'), 760000, 1550000, 10600000, 4300000, 1500, false, '334155')}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`
}

function textShape(id: number, name: string, value: string, x: number, y: number, cx: number, cy: number, size: number, bold: boolean, color: string) {
  const paragraphs = value.split('\n').map((line) => `<a:p><a:r><a:rPr lang="es-PE" sz="${size}"${bold ? ' b="1"' : ''}><a:solidFill><a:srgbClr val="${color}"/></a:solidFill></a:rPr><a:t>${escapeXml(line)}</a:t></a:r><a:endParaRPr lang="es-PE" sz="${size}"/></a:p>`).join('')
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${name}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr wrap="square"/><a:lstStyle/>${paragraphs}</p:txBody></p:sp>`
}

function downloadBytes(bytes: Uint8Array, name: string, type: string) {
  const blob = new Blob([bytes as BlobPart], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}

function decodeRequired(files: Record<string, Uint8Array>, path: string) { const value = files[path]; if (!value) throw new Error(`El archivo Excel no contiene ${path}.`); return strFromU8(value) }
function xml(value: string) { return strToU8(value) }
function escapeXml(value: string) { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;') }
function columnName(index: number) { let value = index + 1; let result = ''; while (value > 0) { const remainder = (value - 1) % 26; result = String.fromCharCode(65 + remainder) + result; value = Math.floor((value - 1) / 26) } return result }
function columnNumber(name: string) { let value = 0; for (const character of name) value = value * 26 + character.charCodeAt(0) - 64; return Math.max(0, value - 1) }
function text(value: CellValue) { return value == null ? '' : String(value).trim() }
function normalize(value: string) { return value.trim().toLocaleLowerCase('es-PE') }
function optionalNumber(value: CellValue): number | null | 'invalid' { if (value === '' || value === null || value === undefined) return null; const parsed = typeof value === 'number' ? value : Number(String(value).replace(',', '.')); return Number.isFinite(parsed) ? parsed : 'invalid' }
function error(sheet: string, row: number, column: string, field: string, reason: string): ImportError { return { sheet, row, column, field, reason } }
function safeName(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'reporte' }
function latestSimulation(workspace: ControlWorkspace) { return [...workspace.simulations].sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0] }
function formatNumber(value: number) { return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 }).format(value) }
function formatValue(value: number | null, unit: string) { return value === null ? 'sin datos' : `${formatNumber(value)} ${unit}`.trim() }

const QUALITY_ALIASES: Record<string, KPI['dataQuality']> = { CERTIFIED: 'CERTIFIED', CERTIFICADA: 'CERTIFIED', REVIEW: 'REVIEW', REVISIÓN: 'REVIEW', REVISION: 'REVIEW', MISSING: 'MISSING', FALTANTE: 'MISSING' }
const STATUS_ALIASES: Record<string, Initiative['status']> = { PLANNED: 'PLANNED', PLANIFICADA: 'PLANNED', IN_PROGRESS: 'IN_PROGRESS', 'EN EJECUCIÓN': 'IN_PROGRESS', 'EN EJECUCION': 'IN_PROGRESS', BLOCKED: 'BLOCKED', BLOQUEADA: 'BLOCKED', COMPLETED: 'COMPLETED', COMPLETADA: 'COMPLETED', CANCELLED: 'CANCELLED', CANCELADA: 'CANCELLED' }
