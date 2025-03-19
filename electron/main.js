const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, '../resources/icon.png') // App icon
  });

  // For development with Vite
  const isDev = process.env.ELECTRON_START_URL || process.env.NODE_ENV === 'development';
  const startUrl = isDev 
    ? 'http://localhost:5173'  
    : `file://${path.join(__dirname, '../dist/index.html')}`;
  
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  
  console.log('Loading URL:', startUrl);
  mainWindow.loadURL(startUrl);

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create window when Electron is ready
app.whenReady().then(createWindow);

// Quit when all windows are closed except on macOS
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

// Handle focus-window message from renderer
ipcMain.on('focus-window', () => {
  if (mainWindow) {
    // Restore if minimized
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    
    // Show if hidden
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
    
    // Focus the window
    mainWindow.focus();
    
    // Platform-specific attention-grabbing
    if (process.platform === 'win32') { // Windows
      mainWindow.flashFrame(true);
      
      // Stop flashing after window is focused or after 5 seconds
      setTimeout(() => {
        if (!mainWindow.isFocused()) {
          mainWindow.flashFrame(false);
        }
      }, 5000);
    } else if (process.platform === 'darwin') { // macOS
      app.dock.bounce('critical');
    }
  }
}); 
