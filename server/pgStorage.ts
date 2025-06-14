import { db } from './db';
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
import type { IStorage } from "./storage";

export class PostgreSQLStorage implements IStorage {
  constructor() {
    this.initializeLanguageModels();
  }

  private async initializeLanguageModels() {
    try {
      const existing = await db.select().from(languageModels).limit(1);
      if (existing.length === 0) {
        const models = [
          {
            id: "en-us-small",
            name: "English (US)",
            type: "small",
            language: "en-us",
            size: "50MB",
            downloadUrl: "https://alphacephei.com/vosk/models/vosk-model-en-us-0.22.zip",
            isDefault: true
          },
          {
            id: "en-gb-small",
            name: "English (UK)",
            type: "small", 
            language: "en-gb",
            size: "52MB",
            downloadUrl: "https://alphacephei.com/vosk/models/vosk-model-en-gb-0.15.zip",
            isDefault: false
          },
          {
            id: "es-es-small",
            name: "Spanish (Spain)",
            type: "small",
            language: "es-es", 
            size: "55MB",
            downloadUrl: "https://alphacephei.com/vosk/models/vosk-model-es-0.42.zip",
            isDefault: false
          },
          {
            id: "fr-fr-small",
            name: "French (France)",
            type: "small",
            language: "fr-fr",
            size: "58MB", 
            downloadUrl: "https://alphacephei.com/vosk/models/vosk-model-fr-0.22.zip",
            isDefault: false
          },
          {
            id: "de-de-small",
            name: "German (Germany)",
            type: "small",
            language: "de-de",
            size: "60MB",
            downloadUrl: "https://alphacephei.com/vosk/models/vosk-model-de-0.21.zip",
            isDefault: false
          }
        ];

        await db.insert(languageModels).values(models);
      }
    } catch (error) {
      console.error("Error initializing language models:", error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = await this.getUser(userData.id);
    
    if (existing) {
      const [updated] = await db
        .update(users)
        .set({ ...userData, updatedAt: new Date() })
        .where(eq(users.id, userData.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(users)
        .values({ ...userData, createdAt: new Date(), updatedAt: new Date() })
        .returning();
      return created;
    }
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));
  }

  async getProject(id: string, userId: string): Promise<Project | undefined> {
    const result = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .limit(1);
    return result[0];
  }

  async createProject(projectData: InsertProject): Promise<Project> {
    const [created] = await db
      .insert(projects)
      .values({ ...projectData, createdAt: new Date(), updatedAt: new Date() })
      .returning();
    return created;
  }

  async updateProject(id: string, userId: string, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .returning();
    return updated;
  }

  async deleteProject(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)));
    return result.rowCount > 0;
  }

  async getTranscriptionSegments(projectId: string): Promise<TranscriptionSegment[]> {
    return await db
      .select()
      .from(transcriptionSegments)
      .where(eq(transcriptionSegments.projectId, projectId))
      .orderBy(transcriptionSegments.startTime);
  }

  async createTranscriptionSegment(segmentData: InsertTranscriptionSegment): Promise<TranscriptionSegment> {
    const [created] = await db
      .insert(transcriptionSegments)
      .values(segmentData)
      .returning();
    return created;
  }

  async updateTranscriptionSegment(id: string, updates: Partial<InsertTranscriptionSegment>): Promise<TranscriptionSegment | undefined> {
    const [updated] = await db
      .update(transcriptionSegments)
      .set(updates)
      .where(eq(transcriptionSegments.id, id))
      .returning();
    return updated;
  }

  async deleteTranscriptionSegment(id: string): Promise<boolean> {
    const result = await db
      .delete(transcriptionSegments)
      .where(eq(transcriptionSegments.id, id));
    return result.rowCount > 0;
  }

  async getLanguageModels(): Promise<LanguageModel[]> {
    return await db.select().from(languageModels);
  }

  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const result = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);
    return result[0];
  }

  async upsertUserSettings(settingsData: InsertUserSettings): Promise<UserSettings> {
    const existing = await this.getUserSettings(settingsData.userId);
    
    if (existing) {
      const [updated] = await db
        .update(userSettings)
        .set({ ...settingsData, updatedAt: new Date() })
        .where(eq(userSettings.userId, settingsData.userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userSettings)
        .values({ ...settingsData, createdAt: new Date(), updatedAt: new Date() })
        .returning();
      return created;
    }
  }

  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    const result = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);
    return result[0];
  }

  async createSubscription(subscriptionData: InsertSubscription): Promise<Subscription> {
    const [created] = await db
      .insert(subscriptions)
      .values({ ...subscriptionData, createdAt: new Date(), updatedAt: new Date() })
      .returning();
    return created;
  }

  async updateSubscription(id: string, updates: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [updated] = await db
      .update(subscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return updated;
  }

  async updateSubscriptionByStripeId(stripeSubscriptionId: string, updates: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [updated] = await db
      .update(subscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .returning();
    return updated;
  }
}