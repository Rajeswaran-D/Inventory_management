const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const os = require('os');
const path = require('path');
const fs = require('fs');

// Tell backend it is running inside Electron (skips dotenv, uses direct env vars)
process.env.IS_ELECTRON = 'true';
process.env.NODE_ENV = 'production';
process.env.PORT = '5000';

let mainWindow = null;
let splashWindow = null;
let backendServer = null;

// ─── IPC Handlers for Print and PDF ─────────────────────────────────────────

// Print: generate a temp PDF and open it in the system's default PDF viewer.
// The user sees the invoice with a real preview and can print from their PDF reader.
// This avoids the blank Windows native print dialog that webContents.print() produces.
ipcMain.handle('print-invoice-via-pdf', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
  try {
    const data = await win.webContents.printToPDF({
      margins: { marginType: 'none' },
      pageSize: 'A4',
      printBackground: true,
      landscape: false,
    });
    const tempPath = path.join(os.tmpdir(), `invoice_print_${Date.now()}.pdf`);
    await fs.promises.writeFile(tempPath, data);
    // open in default PDF viewer (Adobe, Edge, Foxit, etc.)
    await shell.openPath(tempPath);
    return { success: true };
  } catch (err) {
    console.error('[Electron] Print-via-PDF error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('save-invoice-pdf', async (event, filename) => {
  const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
  const { filePath } = await dialog.showSaveDialog(win, {
    title: 'Save Invoice PDF',
    defaultPath: filename || 'invoice.pdf',
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
  });

  if (!filePath) {
    return { success: false, cancelled: true };
  }

  try {
    const data = await win.webContents.printToPDF({
      margins: { marginType: 'none' },
      pageSize: 'A4',
      printBackground: true,
      landscape: false
    });
    await fs.promises.writeFile(filePath, data);
    return { success: true, filePath };
  } catch (err) {
    console.error('[Electron] PDF Save error:', err);
    return { success: false, error: err.message };
  }
});

// ─── Splash Screen ──────────────────────────────────────────────────────────
function createSplash() {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: { nodeIntegration: false },
  });

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body {
          width:480px; height:300px;
          background: linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4338ca 100%);
          border-radius:16px;
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
          color:#fff;
          -webkit-app-region: drag;
        }
        .logo { font-size:52px; margin-bottom:16px; }
        h1 { font-size:22px; font-weight:700; margin-bottom:6px; }
        p  { font-size:13px; color:rgba(255,255,255,0.6); margin-bottom:32px; }
        .bar-wrap { width:260px; height:4px; background:rgba(255,255,255,0.15); border-radius:4px; overflow:hidden; }
        .bar { height:4px; background:linear-gradient(90deg,#818cf8,#c7d2fe); border-radius:4px; animation:load 2s ease-in-out infinite; }
        @keyframes load { 0%{width:0%} 60%{width:80%} 100%{width:100%} }
        .status { font-size:11px; color:rgba(255,255,255,0.4); margin-top:10px; }
      </style>
    </head>
    <body>
      <div class="logo">📦</div>
      <h1>Inventory &amp; Billing OS</h1>
      <p>Smart Inventory Management System</p>
      <div class="bar-wrap"><div class="bar"></div></div>
      <div class="status">Starting backend services…</div>
    </body>
    </html>
  `)}`);
}

// ─── Main Window ─────────────────────────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    autoHideMenuBar: true,
    title: 'Inventory & Billing OS',
    backgroundColor: '#f8fafc',
  });

  mainWindow.loadURL('http://localhost:5000');

  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.destroy();
      splashWindow = null;
    }
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── App Bootstrap ────────────────────────────────────────────────────────────
async function startBackendAndApp() {
  try {
    // Store SQLite DB in AppData so it persists across app updates
    const userDataPath = app.getPath('userData');
    process.env.DATABASE_PATH = path.join(userDataPath, 'database.sqlite');

    // schema.sql is copied outside the asar via extraResources when packaged, otherwise read from backend directory
    process.env.SCHEMA_PATH = app.isPackaged
      ? path.join(process.resourcesPath, 'schema.sql')
      : path.join(__dirname, 'backend', 'schema.sql');

    console.log('[Electron] DB path:', process.env.DATABASE_PATH);
    console.log('[Electron] Schema path:', process.env.SCHEMA_PATH);

    const { startServer } = require('./backend/server.js');
    backendServer = await startServer();
    console.log('[Electron] Backend started on port 5000.');

    createMainWindow();
  } catch (err) {
    console.error('[Electron] Fatal startup error:', err);
    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.destroy();
    dialog.showErrorBox(
      'Startup Failed',
      `The application could not start.\n\n${err.message}\n\nPlease contact support.`
    );
    app.quit();
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createSplash();
  setTimeout(startBackendAndApp, 300);
});

app.on('window-all-closed', () => {
  if (backendServer) {
    backendServer.close(() => console.log('[Electron] Express server closed.'));
  }
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
