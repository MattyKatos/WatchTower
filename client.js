const { app, BrowserWindow } = require('electron');
const { io } = require('socket.io-client');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

let windows = {};

// Connect to the server using Socket.IO
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to server');
  // Identify as an Electron client with hostname
  socket.emit('identify', {
    type: 'electron',
    hostname: os.hostname()
  });
});

socket.on('command', (data) => {
  const { action, payload } = data;

  if (action === 'open-window') {
    createWindow(payload.url);
  } else if (action === 'close-window') {
    closeWindow(payload.windowId);
  } else if (action === 'navigate-window') {
    navigateWindow(payload.windowId, payload.url);
  } else if (action === 'capture-preview') {
    captureWindowPreview(payload.windowId);
  }
});

// Create a new Electron window
function createWindow(url) {
  const windowId = uuidv4();
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
  });

  win.loadURL(url || 'about:blank');
  windows[windowId] = win;

  // Track URL changes
  win.webContents.on('did-navigate', (event, url) => {
    // Notify server about URL change
    socket.emit('url-changed', { windowId, url });
    // Capture new preview after navigation
    captureWindowPreview(windowId);
  });

  win.webContents.on('did-navigate-in-page', (event, url) => {
    // Also track SPA navigation and hash changes
    socket.emit('url-changed', { windowId, url });
    // Capture new preview after in-page navigation
    captureWindowPreview(windowId);
  });

  win.on('closed', () => {
    delete windows[windowId];
    // Notify server about window closure
    socket.emit('window-closed', { windowId });
  });

  // Notify the server about the new window
  socket.emit('window-created', { windowId, url: url || 'about:blank' });
  
  // Capture initial preview after a short delay to allow page load
  setTimeout(() => captureWindowPreview(windowId), 1000);
}

// Capture and send window preview
async function captureWindowPreview(windowId) {
  const win = windows[windowId];
  if (!win) return;

  try {
    // Capture the page content
    const image = await win.webContents.capturePage();
    // Convert to PNG buffer and get as base64
    const pngBuffer = await image.resize({ width: 320 }).toPNG();
    const base64Image = pngBuffer.toString('base64');
    
    // Send preview to server
    socket.emit('window-preview', {
      windowId,
      preview: base64Image
    });
  } catch (error) {
    console.error('Failed to capture preview:', error);
  }
}

// Close a specific window
function closeWindow(windowId) {
  if (windows[windowId]) {
    windows[windowId].close();
  }
}

// Navigate a specific window to a new URL
function navigateWindow(windowId, url) {
  if (windows[windowId]) {
    windows[windowId].loadURL(url);
    // URL change will be caught by did-navigate event
  }
}

// When app is ready, just connect to server - don't create any initial windows
app.whenReady().then(() => {
  // We're ready but don't create any windows by default
  console.log('Electron client ready');
});

// Prevent the app from quitting when all windows are closed
app.on('window-all-closed', () => {
  // Do nothing - keep the app running
});

// Handle activate event (macOS)
app.on('activate', () => {
  // Do nothing - windows should only be created via commands
});