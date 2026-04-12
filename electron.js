const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');

let mainWindow;
let mongoProcess;
let backendProcess;

// Get paths relative to app root
const appPath = app.getAppPath();
const dataPath = path.join(appPath, 'data', 'db');
const backendPath = path.join(appPath, 'backend');
const mongodbPath = path.join(appPath, 'mongodb', 'bin', 'mongod.exe');

// Ensure data directory exists
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

// Start MongoDB from bundled version or system PATH
function startMongoDB() {
  return new Promise((resolve, reject) => {
    try {
      console.log('🚀 Starting MongoDB...');
      
      // Check if bundled mongod exists
      const useBundled = fs.existsSync(mongodbPath);
      const mongodPath = useBundled ? mongodbPath : 'mongod'; // Fallback to system PATH

      if (useBundled) {
        console.log('✅ Using bundled MongoDB at:', mongodbPath);
      } else {
        console.log('📍 Using MongoDB from system PATH');
      }

      const mongoArgs = [
        '--dbpath', dataPath,
        '--port', '27017',
        '--quiet',
        '--noauth'
      ];

      mongoProcess = spawn(mongodPath, mongoArgs, {
        detached: false,
        stdio: ['ignore', 'ignore', 'pipe'],
        windowsHide: true
      });

      let mongoError = '';
      mongoProcess.stderr?.on('data', (data) => {
        mongoError += data.toString();
      });

      mongoProcess.on('error', (err) => {
        console.error('❌ MongoDB Error:', err);
        if (!useBundled) {
          dialog.showErrorBox(
            'MongoDB Not Found',
            'MongoDB is not installed on your system.\n\n' +
            'Please download and install mongod from:\n' +
            'https://www.mongodb.com/try/download/community\n\n' +
            'Make sure to add MongoDB to PATH during installation.'
          );
        }
        reject(err);
      });

      // Allow MongoDB to start
      setTimeout(() => {
        if (mongoProcess && !mongoProcess.killed) {
          console.log('✅ MongoDB started successfully');
          resolve();
        } else {
          reject(new Error('MongoDB process exited unexpectedly'));
        }
      }, 2000);

    } catch (err) {
      console.error('❌ Failed to start MongoDB:', err);
      reject(err);
    }
  });
}

// Start Backend Server
function startBackend() {
  return new Promise((resolve, reject) => {
    try {
      console.log('🚀 Starting Backend Server...');
      
      // Set environment
      const env = Object.assign({}, process.env, {
        MONGODB_URI: 'mongodb://127.0.0.1:27017/swamy_envelope',
        NODE_ENV: isDev ? 'development' : 'production',
        PORT: '5000'
      });

      // Start backend server
      backendProcess = spawn('npm', ['run', 'start'], {
        cwd: backendPath,
        detached: false,
        stdio: ['ignore', 'ignore', 'pipe'],
        windowsHide: true,
        env: env
      });

      let backendError = '';
      backendProcess.stderr?.on('data', (data) => {
        backendError += data.toString();
      });

      backendProcess.on('error', (err) => {
        console.error('❌ Backend Error:', err);
        reject(err);
      });

      // Wait for backend to start
      setTimeout(() => {
        console.log('✅ Backend server started successfully');
        resolve();
      }, 3000);

    } catch (err) {
      console.error('❌ Failed to start Backend:', err);
      reject(err);
    }
  });
}

// Create Application Window
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  // Load the app
  if (isDev) {
    // Development: Load from Vite dev server
    mainWindow.loadURL('http://localhost:5173').catch(err => {
      console.error('Failed to load dev server:', err);
      mainWindow.loadFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
    });
    mainWindow.webContents.openDevTools();
  } else {
    // Production: Load from built files
    mainWindow.loadFile(path.join(__dirname, 'frontend', 'dist', 'index.html')).catch(err => {
      console.error('Failed to load app:', err);
      dialog.showErrorBox('Error', 'Failed to load application');
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create menu
  createMenu();
}

// Create Application Menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Swamy Envelope',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Swamy Envelope',
              message: 'Swamy Envelope - Smart Inventory & Billing System',
              detail: 'Version 1.0.0\n\nA professional desktop application for inventory and billing management with complete offline support.'
            });
          }
        },
        {
          label: 'Documentation',
          click: () => {
            require('electron').shell.openExternal('https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-windows/');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC Handlers
ipcMain.handle('get-version', () => app.getVersion());
ipcMain.handle('get-app-path', () => app.getAppPath());
ipcMain.handle('get-is-dev', () => isDev);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  if (mainWindow) {
    dialog.showErrorBox('Error', 'An unexpected error occurred:\n' + err.message);
  }
});

// App startup
app.on('ready', async () => {
  try {
    console.log('🔧 Initializing Swamy Envelope Desktop Application...');
    console.log('📍 App Path:', appPath);
    console.log('📊 Database Path:', dataPath);

    // Start MongoDB
    await startMongoDB();

    // Start Backend
    await startBackend();

    // Create window
    await createWindow();

    console.log('✅ Application Started Successfully!');
    console.log('🌐 Frontend: http://localhost:5173 (dev) or built HTML (production)');
    console.log('🔌 Backend API: http://localhost:5000');
    console.log('💾 Database: mongodb://127.0.0.1:27017/swamy_envelope');

  } catch (err) {
    console.error('❌ Startup Error:', err);
    dialog.showErrorBox('Startup Error', 'Failed to start the application:\n' + err.message);
    app.quit();
  }
});

// Window management
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Cleanup on quit
app.on('quit', () => {
  console.log('🛑 Shutting down services...');

  // Stop MongoDB
  if (mongoProcess && !mongoProcess.killed) {
    try {
      mongoProcess.kill();
      console.log('✅ MongoDB stopped');
    } catch (err) {
      console.error('Error stopping MongoDB:', err);
    }
  }

  // Stop Backend
  if (backendProcess && !backendProcess.killed) {
    try {
      backendProcess.kill();
      console.log('✅ Backend stopped');
    } catch (err) {
      console.error('Error stopping Backend:', err);
    }
  }
});

