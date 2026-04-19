const { app, BrowserWindow } = require('electron');
const path = require('path');
// Flag used by server.js to natively intercept its static React route server mapping mode
process.env.IS_ELECTRON = 'true';
process.env.NODE_ENV = 'production';
process.env.PORT = '5000';

let mainWindow;
let backendServer;

async function startBackendAndApp() {
  try {
    // We override where SQLite creates our DB so we don't break AppData logic out of the compressed installer folder
    const userDataPath = app.getPath('userData');
    process.env.DATABASE_PATH = path.join(userDataPath, 'database.sqlite');
    console.log('[Electron] Initializing backend at path: ', process.env.DATABASE_PATH);

    // Boot our Node/Express Backend internally without a child process!
    const { startServer } = require('./backend/server.js');
    backendServer = await startServer();
    console.log('[Electron] Backend Express Server Initialized successfully (Port 5000).');

    createWindow();
  } catch (err) {
    console.error('[Electron] Failed to start backend processes:', err);
    // Add logic here to display error window instead if you wish!
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png')
  });

  // Because Express is locally hosting our frontend 'dist', load exactly like the browser would
  mainWindow.loadURL('http://localhost:5000');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// When App triggers
app.whenReady().then(startBackendAndApp);

// Standard Desktop App Close protocols
app.on('window-all-closed', () => {
  if (backendServer) {
    backendServer.close(() => console.log('[Electron] Node API server closed.'));
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
