const { app, BrowserWindow } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

const APP_TITLE = 'Gestión y Control Estratégico IA'
let mainWindow = null
const smokeTestArgument = process.argv.find((argument) => argument.startsWith('--smoke-test='))
const smokeTestOutput = smokeTestArgument?.slice('--smoke-test='.length)

if (smokeTestOutput) {
  app.setPath('userData', path.join(path.dirname(smokeTestOutput), '.smoke-user-data'))
}

function finishSmokeTest(result) {
  if (!smokeTestOutput) return
  fs.writeFileSync(smokeTestOutput, JSON.stringify(result, null, 2), 'utf8')
  app.quit()
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: APP_TITLE,
    width: 1366,
    height: 820,
    minWidth: 1024,
    minHeight: 640,
    show: !smokeTestOutput,
    autoHideMenuBar: true,
    backgroundColor: '#f4f7fa',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  const window = mainWindow

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  window.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file:')) event.preventDefault()
  })
  window.webContents.once('did-finish-load', async () => {
    if (!smokeTestOutput) return

    try {
      const result = await window.webContents.executeJavaScript(`(async () => {
        const indexedDbReady = await new Promise((resolve) => {
          const request = indexedDB.open('gceia-exe-smoke-test', 1)
          request.onupgradeneeded = () => request.result.createObjectStore('health')
          request.onerror = () => resolve(false)
          request.onsuccess = () => {
            request.result.close()
            resolve(true)
          }
        })
        const bodyText = await new Promise((resolve) => {
          const deadline = Date.now() + 5000
          const checkContent = () => {
            const text = document.body.innerText.replace(/\\s+/g, ' ')
            if (text.includes('Datos locales:') || Date.now() >= deadline) resolve(text)
            else setTimeout(checkContent, 100)
          }
          checkContent()
        })
        return {
          title: document.title,
          hasHeading: bodyText.includes('GESTIÓN Y CONTROL ESTRATÉGICO IA'),
          hasLocalStorageStatus: bodyText.includes('Datos locales: Listos'),
          indexedDbReady,
        }
      })()`)
      finishSmokeTest({ ok: Object.values(result).every(Boolean), ...result })
    } catch (error) {
      finishSmokeTest({ ok: false, error: String(error) })
    }
  })

  window.webContents.once('did-fail-load', (_event, code, description) => {
    finishSmokeTest({ ok: false, error: `Carga fallida (${code}): ${description}` })
  })
  window.once('closed', () => {
    mainWindow = null
  })

  void window.loadFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html')).catch((error) => {
    finishSmokeTest({ ok: false, error: String(error) })
  })
}

app.setAppUserModelId('pe.edu.gceia.app')
app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
