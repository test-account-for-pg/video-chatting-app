import { 
  ISignalingService, 
  IPeerConnectionService, 
  IMediaService, 
  IMatchingService 
} from '../types';
import { FirebaseSignalingService } from './FirebaseSignalingService';
import { WebRTCPeerConnectionService } from './WebRTCPeerConnectionService';
import { MediaService } from './MediaService';
import { MatchingService } from './MatchingService';

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
    // Register services as singletons
    this.services.set('signaling', new FirebaseSignalingService());
    this.services.set('peerConnection', new WebRTCPeerConnectionService());
    this.services.set('media', new MediaService());
    this.services.set('matching', new MatchingService());
  }

  getSignalingService(): ISignalingService {
    return this.services.get('signaling');
  }

  getPeerConnectionService(): IPeerConnectionService {
    return this.services.get('peerConnection');
  }

  getMediaService(): IMediaService {
    return this.services.get('media');
  }

  getMatchingService(): IMatchingService {
    return this.services.get('matching');
  }

  // Method to replace services (useful for testing or different implementations)
  registerService<T>(name: string, service: T): void {
    this.services.set(name, service);
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
