import {
  users,
  projects,
  transcriptionSegments,
  languageModels,
  userSettings,
  subscriptions,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type TranscriptionSegment,
  type InsertTranscriptionSegment,
  type LanguageModel,
  type UserSettings,
  type InsertUserSettings,
  type Subscription,
  type InsertSubscription,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Project operations
  getUserProjects(userId: string): Promise<Project[]>;
  getProject(id: string, userId: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, userId: string, updates: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string, userId: string): Promise<boolean>;
  
  // Transcription segment operations
  getTranscriptionSegments(projectId: string): Promise<TranscriptionSegment[]>;
  createTranscriptionSegment(segment: InsertTranscriptionSegment): Promise<TranscriptionSegment>;
  updateTranscriptionSegment(id: string, updates: Partial<InsertTranscriptionSegment>): Promise<TranscriptionSegment | undefined>;
  deleteTranscriptionSegment(id: string): Promise<boolean>;
  
  // Language model operations
  getLanguageModels(): Promise<LanguageModel[]>;
  
  // User settings operations
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  upsertUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  
  // Subscription operations
  getUserSubscription(userId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, updates: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  updateSubscriptionByStripeId(stripeSubscriptionId: string, updates: Partial<InsertSubscription>): Promise<Subscription | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private projects: Map<string, Project>;
  private transcriptionSegments: Map<string, TranscriptionSegment>;
  private userSettings: Map<string, UserSettings>;
  private subscriptions: Map<string, Subscription>;
  private languageModels: LanguageModel[];

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.transcriptionSegments = new Map();
    this.userSettings = new Map();
    this.subscriptions = new Map();
    this.initializeLanguageModels();
  }

  private initializeLanguageModels() {
    this.languageModels = [
      {
        id: 'en-us-small',
        language: 'English (US)',
        name: 'vosk-model-small-en-us-0.15',
        type: 'small',
        size: '40MB',
        wer: 9.85,
        downloadUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip',
        isDefault: true,
        createdAt: new Date(),
      },
      {
        id: 'en-us-large',
        language: 'English (US)',
        name: 'vosk-model-en-us-0.22',
        type: 'large',
        size: '1.8GB',
        wer: 5.69,
        downloadUrl: 'https://alphacephei.com/vosk/models/vosk-model-en-us-0.22.zip',
        isDefault: false,
        createdAt: new Date(),
      },
      {
        id: 'fr-small',
        language: 'French',
        name: 'vosk-model-small-fr-0.22',
        type: 'small',
        size: '41MB',
        wer: 23.95,
        downloadUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-fr-0.22.zip',
        isDefault: false,
        createdAt: new Date(),
      },
      {
        id: 'de-small',
        language: 'German',
        name: 'vosk-model-small-de-0.15',
        type: 'small',
        size: '45MB',
        wer: 13.75,
        downloadUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-de-0.15.zip',
        isDefault: false,
        createdAt: new Date(),
      },
      {
        id: 'es-small',
        language: 'Spanish',
        name: 'vosk-model-small-es-0.42',
        type: 'small',
        size: '39MB',
        wer: 16.02,
        downloadUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-es-0.42.zip',
        isDefault: false,
        createdAt: new Date(),
      },
    ];
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id);
    const user: User = {
      ...userData,
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(userData.id, user);
    return user;
  }

  // Project operations
  async getUserProjects(userId: string): Promise<Project[]> {
    return Array.from(this.projects.values())
      .filter(project => project.userId === userId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getProject(id: string, userId: string): Promise<Project | undefined> {
    const project = this.projects.get(id);
    return project && project.userId === userId ? project : undefined;
  }

  async createProject(projectData: InsertProject): Promise<Project> {
    const id = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const project: Project = {
      id,
      ...projectData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, userId: string, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project || project.userId !== userId) {
      return undefined;
    }

    const updatedProject = {
      ...project,
      ...updates,
      updatedAt: new Date(),
    };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: string, userId: string): Promise<boolean> {
    const project = this.projects.get(id);
    if (!project || project.userId !== userId) {
      return false;
    }

    // Delete associated transcription segments
    for (const [segmentId, segment] of this.transcriptionSegments.entries()) {
      if (segment.projectId === id) {
        this.transcriptionSegments.delete(segmentId);
      }
    }

    this.projects.delete(id);
    return true;
  }

  // Transcription segment operations
  async getTranscriptionSegments(projectId: string): Promise<TranscriptionSegment[]> {
    return Array.from(this.transcriptionSegments.values())
      .filter(segment => segment.projectId === projectId)
      .sort((a, b) => a.startTime - b.startTime);
  }

  async createTranscriptionSegment(segmentData: InsertTranscriptionSegment): Promise<TranscriptionSegment> {
    const id = `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const segment: TranscriptionSegment = {
      id,
      ...segmentData,
      createdAt: new Date(),
    };
    this.transcriptionSegments.set(id, segment);
    return segment;
  }

  async updateTranscriptionSegment(id: string, updates: Partial<InsertTranscriptionSegment>): Promise<TranscriptionSegment | undefined> {
    const segment = this.transcriptionSegments.get(id);
    if (!segment) {
      return undefined;
    }

    const updatedSegment = {
      ...segment,
      ...updates,
    };
    this.transcriptionSegments.set(id, updatedSegment);
    return updatedSegment;
  }

  async deleteTranscriptionSegment(id: string): Promise<boolean> {
    return this.transcriptionSegments.delete(id);
  }

  // Language model operations
  async getLanguageModels(): Promise<LanguageModel[]> {
    return this.languageModels;
  }

  // User settings operations
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    return this.userSettings.get(userId);
  }

  async upsertUserSettings(settingsData: InsertUserSettings): Promise<UserSettings> {
    const existingSettings = this.userSettings.get(settingsData.userId);
    const id = existingSettings?.id || `settings_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const settings: UserSettings = {
      id,
      userId: settingsData.userId,
      defaultLanguage: settingsData.defaultLanguage ?? "en-us",
      autoSave: settingsData.autoSave ?? true,
      videoQuality: settingsData.videoQuality ?? "1080p",
      srtFormat: settingsData.srtFormat ?? "srt",
      localProcessing: settingsData.localProcessing ?? true,
      analyticsSharing: settingsData.analyticsSharing ?? false,
      hasCompletedOnboarding: settingsData.hasCompletedOnboarding ?? false,
      createdAt: existingSettings?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    
    this.userSettings.set(settingsData.userId, settings);
    return settings;
  }

  // Subscription operations
  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values()).find(s => s.userId === userId);
  }

  async createSubscription(subscriptionData: InsertSubscription): Promise<Subscription> {
    const subscription: Subscription = {
      id: crypto.randomUUID(),
      userId: subscriptionData.userId,
      plan: subscriptionData.plan ?? "free",
      status: subscriptionData.status ?? "active",
      stripeCustomerId: subscriptionData.stripeCustomerId ?? null,
      stripeSubscriptionId: subscriptionData.stripeSubscriptionId ?? null,
      stripePriceId: subscriptionData.stripePriceId ?? null,
      currentPeriodStart: subscriptionData.currentPeriodStart ?? null,
      currentPeriodEnd: subscriptionData.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.subscriptions.set(subscription.id, subscription);
    return subscription;
  }

  async updateSubscription(id: string, updates: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const subscription = this.subscriptions.get(id);
    if (!subscription) return undefined;

    const updatedSubscription: Subscription = {
      ...subscription,
      ...updates,
      updatedAt: new Date(),
    };

    this.subscriptions.set(id, updatedSubscription);
    return updatedSubscription;
  }

  async updateSubscriptionByStripeId(stripeSubscriptionId: string, updates: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const subscription = Array.from(this.subscriptions.values()).find(s => s.stripeSubscriptionId === stripeSubscriptionId);
    if (!subscription) return undefined;

    return this.updateSubscription(subscription.id, updates);
  }
}

import { PostgreSQLStorage } from './pgStorage';

export const storage = new PostgreSQLStorage();
