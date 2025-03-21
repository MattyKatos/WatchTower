# WatchTower

WatchTower is an Electron-based remote window management application that allows you to control and monitor browser windows across multiple machines through a web interface.

## Features

- 🖥️ Remote window management across multiple machines
- 🌐 Create, navigate, and close browser windows remotely
- 🔍 Live window previews with manual refresh
- 🏷️ Hostname-based client identification
- 🔝 Always-on-top window behavior
- 📱 Responsive web control interface
- 🔄 Real-time URL tracking and updates

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/MattyKatos/WatchTower
cd WatchTower
```

2. Install dependencies:
```bash
npm install
```

## Usage

1. Start the server:
```bash
npm run server
```

2. Start the Electron client on each machine you want to control:
```bash
npm run client
```

3. Open the control panel in your web browser:
```
http://localhost:3000
```

## Architecture

- **Server (`server.js`)**: Express/Socket.IO server that manages client connections and window state
- **Client (`client.js`)**: Electron app that creates and manages browser windows
- **Web Interface (`public/index.html`)**: Control panel for managing windows across all connected clients

## Technical Stack

- **Backend**: Node.js with Express
- **Frontend**: Vanilla JavaScript with Socket.IO
- **Desktop Client**: Electron
- **Real-time Communication**: Socket.IO
- **UI Framework**: Custom CSS with modern design patterns

## Features in Detail

### Window Management
- Create new browser windows with custom URLs
- Navigate existing windows to new URLs
- Close windows remotely
- Automatic HTTPS URL formatting

### Window Previews
- Live preview of each window's content
- Manual refresh capability
- Preview resizing for optimal performance
- Loading state indication

### Client Management
- Automatic client discovery
- Hostname-based identification
- Connection status monitoring
- Multiple client support

### URL Handling
- Automatic HTTPS protocol addition
- Support for about:blank
- Real-time URL updates on navigation
- SPA (Single Page Application) navigation support

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- Real-time communication powered by [Socket.IO](https://socket.io/)
- Server powered by [Express](https://expressjs.com/)
