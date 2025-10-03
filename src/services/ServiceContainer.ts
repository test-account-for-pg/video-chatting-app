import { IMediaService, IMatchingService, IWebRTCService } from '../types';
import { MediaService } from './MediaService';
import { MatchingService } from './MatchingService';
import { WebRTCService } from './WebRTCService';
import { VideoChatService } from './VideoChatService';
import { FirebaseService } from './FirebaseService';

export class ServiceContainer {
  private static instance: ServiceContainer;
  private services: Map<string, any> = new Map();

  private constructor() {
    this.initializeServices();
  }

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  private initializeServices(): void {
    // Create core services
    const mediaService = new MediaService();
    const firebaseService = new FirebaseService();
    const matchingService = new MatchingService(firebaseService);
    const webRTCService = new WebRTCService(firebaseService);

    // Create VideoChatService with dependency injection
    const videoChatService = new VideoChatService(
      mediaService,
      matchingService,
      webRTCService
    );

    // Register services
    this.services.set('media', mediaService);
    this.services.set('firebase', firebaseService);
    this.services.set('matching', matchingService);
    this.services.set('webRTC', webRTCService);
    this.services.set('videoChat', videoChatService);
  }

  getMediaService(): IMediaService {
    return this.services.get('media');
  }

  getMatchingService(): IMatchingService {
    return this.services.get('matching');
  }

  getWebRTCService(): IWebRTCService {
    return this.services.get('webRTC');
  }

  getVideoChatService(): VideoChatService {
    return this.services.get('videoChat');
  }

  getFirebaseService(): FirebaseService {
    return this.services.get('firebase');
  }

  // Method to get any service by name
  getService<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' not found`);
    }
    return service;
  }

  // Method to check if a service exists
  hasService(name: string): boolean {
    return this.services.has(name);
  }

  // Method to get all registered service names
  getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }

  // Method to clear all services (useful for testing)
  clearServices(): void {
    this.services.clear();
    this.initializeServices();
  }
}

// Export a singleton instance
export const serviceContainer = ServiceContainer.getInstance();
