const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

const isDev = !app.isPackaged;
const backendPort = process.env.PORT ? Number(process.env.PORT) : 5001;
const backendUrl = `http://127.0.0.1:${backendPort}`;

let backendProcess = null;

function backendEntryPath() {
  if (isDev) return path.resolve(__dirname, '..', '..', 'Rosemary-POS---Backend', 'app.js');
  return path.join(process.resourcesPath, 'backend', 'app.js');
}

function backendWorkingDir() {
  if (isDev) return path.resolve(__dirname, '..', '..', 'Rosemary-POS---Backend');
  return path.join(process.resourcesPath, 'backend');
}

function startBackend() {
  const entry = backendEntryPath();
  const cwd = backendWorkingDir();

  // Ensure the backend picks up a user-specific DB path when launched from Electron
  const userDb = path.join(app.getPath('userData'), 'pos.db');
  const env = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: '1',
    PORT: String(backendPort),
    SQLITE_PATH: process.env.SQLITE_PATH || userDb,
    POS_APP_FOLDER: process.env.POS_APP_FOLDER || 'p3l-pos',
  };

  backendProcess = spawn(process.execPath, [entry], {
    cwd,
    env,
    stdio: 'inherit',
  });

  backendProcess.on('exit', (code) => {
    console.log(`Backend exited with code ${code}`);
  });
}

async function waitForBackend(timeoutMs = 30000) {
  const started = Date.now();
  // Use node-fetch if available, otherwise plain http request
  const fetch = global.fetch || ((url) => import('node-fetch').then(m => m.default(url)));
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(`${backendUrl}/api/health`);
      if (res && res.ok) return true;
    } catch (e) {
      // keep waiting
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    backgroundColor: '#0f172a',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL('http://127.0.0.1:8080');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(async () => {
  startBackend();

  const ready = await waitForBackend();
  if (!ready) console.error('Backend did not become ready in time');

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (backendProcess && !backendProcess.killed) backendProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});
