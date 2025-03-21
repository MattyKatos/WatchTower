const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 5e6 // 5MB max buffer size for previews
});

const clients = new Map(); // Store connected Electron clients and their windows
const webClients = new Set(); // Store web interface clients

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Socket.IO connection handling
io.on('connection', (socket) => {
  // Wait for client to identify itself
  socket.on('identify', (data) => {
    if (typeof data === 'object' && data.type === 'electron') {
      console.log(`Electron client connected: ${socket.id} (${data.hostname})`);
      clients.set(socket.id, { 
        socket, 
        windows: {},
        hostname: data.hostname 
      });
      // Notify web clients about new Electron client
      io.to('web').emit('clients-updated', getClientsData());
    } else if (data === 'web') {
      console.log(`Web client connected: ${socket.id}`);
      webClients.add(socket.id);
      socket.join('web');
      // Send current state to new web client
      socket.emit('clients-updated', getClientsData());
    }
  });

  // Handle window creation from Electron clients
  socket.on('window-created', (data) => {
    const { windowId, url } = data;
    const client = clients.get(socket.id);
    if (client) {
      client.windows[windowId] = { url };
      // Only notify web clients about updates
      io.to('web').emit('clients-updated', getClientsData());
    }
  });

  // Handle window previews from Electron clients
  socket.on('window-preview', (data) => {
    const { windowId, preview } = data;
    const client = clients.get(socket.id);
    if (client && client.windows[windowId]) {
      client.windows[windowId].preview = preview;
      // Send preview update to web clients
      io.to('web').emit('window-preview-updated', {
        clientId: socket.id,
        windowId,
        preview
      });
    }
  });

  // Handle URL changes from Electron clients
  socket.on('url-changed', (data) => {
    const { windowId, url } = data;
    const client = clients.get(socket.id);
    if (client && client.windows[windowId]) {
      client.windows[windowId].url = url;
      // Only notify web clients about updates
      io.to('web').emit('clients-updated', getClientsData());
    }
  });

  // Handle window closure from Electron clients
  socket.on('window-closed', (data) => {
    const { windowId } = data;
    const client = clients.get(socket.id);
    if (client && client.windows[windowId]) {
      delete client.windows[windowId];
      // Only notify web clients about updates
      io.to('web').emit('clients-updated', getClientsData());
    }
  });

  // Handle commands from web interface
  socket.on('command', (data) => {
    const { targetClientId, action, payload } = data;
    const targetClient = clients.get(targetClientId);
    if (targetClient) {
      targetClient.socket.emit('command', { action, payload });
    }
  });

  // Handle client disconnection
  socket.on('disconnect', () => {
    if (clients.has(socket.id)) {
      const client = clients.get(socket.id);
      console.log(`Electron client disconnected: ${socket.id} (${client.hostname})`);
      clients.delete(socket.id);
      // Only notify web clients about updates
      io.to('web').emit('clients-updated', getClientsData());
    } else if (webClients.has(socket.id)) {
      console.log(`Web client disconnected: ${socket.id}`);
      webClients.delete(socket.id);
    }
  });
});

// Helper function to get data about Electron clients and their windows
function getClientsData() {
  const data = {};
  clients.forEach((client, clientId) => {
    data[clientId] = {
      hostname: client.hostname,
      windows: Object.fromEntries(
        Object.entries(client.windows).map(([windowId, window]) => [
          windowId,
          {
            url: window.url,
            preview: window.preview
          }
        ])
      )
    };
  });
  return data;
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});