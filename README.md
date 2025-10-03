# Stranger Video Chat Demo

A simple 1:1 stranger video chat application built with React, TypeScript, WebRTC, and Firebase. This demo showcases a clean, modular architecture with dependency injection for easy service swapping.

## Features

- 🎥 Real-time video and audio communication using WebRTC
- 🔄 Random stranger matching with waiting pool
- 🎛️ Audio/video controls (mute, camera toggle)
- 📱 Responsive design for desktop and mobile
- 🏗️ Clean architecture with dependency injection
- 🔧 Easy service swapping (Firebase → WebSocket, etc.)

## Architecture

### Core Components

1. **Firebase Service** (`FirebaseService`)
   - Low-level wrapper for Firebase Realtime Database
   - Manages user waiting pool
   - Handles WebRTC signaling (offers, answers, ICE candidates)
   - Session data management and cleanup

2. **Matching Service** (`MatchingService`)
   - Uses FirebaseService for user pairing
   - Implements stranger matching logic
   - Assigns caller/callee roles
   - Session lifecycle management

3. **WebRTC Service** (`WebRTCService`)
   - Uses FirebaseService for signaling
   - WebRTC peer connection management
   - STUN/TURN server configuration
   - Connection state handling

4. **Media Service** (`MediaService`)
   - Camera and microphone access
   - Stream management and controls
   - Device switching capabilities

5. **Video Chat Service** (`VideoChatService`)
   - High-level orchestration service
   - Coordinates all other services
   - Manages application state

6. **Dependency Injection Container** (`ServiceContainer`)
   - Service registration and retrieval
   - Easy service swapping for testing/different implementations

### Key Interfaces

All services implement clean interfaces, making them easily swappable:

- `IMediaService` - Media handling abstraction
- `IMatchingService` - User matching abstraction
- `IWebRTCService` - WebRTC abstraction

## Setup Instructions

### Prerequisites

- Node.js 16+ and npm
- Firebase project (for signaling)

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Realtime Database
3. Update `src/services/firebase-config.ts` with your Firebase configuration:

```typescript
const firebaseConfig = {
  apiKey: 'your-api-key',
  authDomain: 'your-project.firebaseapp.com',
  databaseURL: 'https://your-project-default-rtdb.firebaseio.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project.appspot.com',
  messagingSenderId: 'your-sender-id',
  appId: 'your-app-id',
};
```

### 3. Run the Application

```bash
npm start
```

The application will open at `http://localhost:3000`.

## Usage

1. **Allow Camera/Microphone Access**: When prompted, allow browser access to your camera and microphone
2. **Find a Stranger**: Click "Find Stranger" to join the waiting pool
3. **Wait for Match**: The system will automatically pair you with another user
4. **Start Chatting**: Once connected, you can toggle audio/video and chat
5. **End Session**: Click "End Call" to disconnect and return to the waiting pool

## Project Structure

```
src/
├── components/          # React UI components
│   ├── VideoChat.tsx   # Main chat interface
│   ├── VideoPlayer.tsx # Video display component
│   ├── ControlPanel.tsx # Audio/video controls
│   └── StatusIndicator.tsx # Connection status
├── hooks/              # Custom React hooks
│   └── useVideoChat.ts # Main video chat logic
├── services/           # Business logic services
│   ├── ServiceContainer.ts # DI container
│   ├── FirebaseService.ts # Firebase Realtime DB wrapper
│   ├── WebRTCService.ts # WebRTC peer connection management
│   ├── MatchingService.ts # User matching logic
│   ├── MediaService.ts # Media device management
│   ├── VideoChatService.ts # High-level orchestration
│   └── firebase-config.ts # Firebase configuration
├── types/              # TypeScript interfaces
│   └── index.ts
└── App.tsx            # Main application component
```

## Key Design Principles

### Single Responsibility Principle

Each service has a single, well-defined responsibility:

- Firebase service only handles database operations
- Media service only handles media
- WebRTC service only handles peer connections
- Matching service only handles user pairing

### Dependency Injection

Services are injected through a container, making them:

- Easily testable
- Swappable for different implementations
- Loosely coupled

### Interface Segregation

Clean interfaces allow for:

- Easy mocking in tests
- Service swapping without code changes
- Clear contracts between components

## Customization

### Adding New Database Service

1. Implement a new service that handles database operations
2. Update `FirebaseService` or create a new service
3. Register in `ServiceContainer`:

```typescript
this.services.set('database', new YourDatabaseService());
```

### Adding TURN Servers

Update `WebRTCService.ts`:

```typescript
private turnServers: RTCIceServer[] = [
  {
    urls: 'turn:your-turn-server.com:3478',
    username: 'user',
    credential: 'pass'
  }
];
```

## Browser Support

- Chrome 56+
- Firefox 52+
- Safari 11+
- Edge 79+

## Security Considerations

This is a demo application. For production use, consider:

- User authentication and authorization
- Rate limiting and abuse prevention
- Content moderation
- Secure TURN server configuration
- HTTPS enforcement
- Input validation and sanitization

## Troubleshooting

### Camera/Microphone Not Working

- Ensure HTTPS (required for getUserMedia)
- Check browser permissions
- Verify device availability

### Connection Issues

- Check firewall settings
- Verify STUN/TURN server accessibility
- Check browser WebRTC support

### Firebase Issues

- Verify Firebase configuration
- Check Realtime Database rules
- Ensure proper authentication (if enabled)
