import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  integer,
  boolean,
  uuid,
  real,
  unique
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description"),
  type: varchar("type").notNull(), // 'audio', 'video', 'live_recording'
  status: varchar("status").notNull().default("processing"), // 'processing', 'completed', 'failed'
  language: varchar("language").notNull().default("en-us"),
  originalFileName: varchar("original_file_name"),
  filePath: varchar("file_path"),
  duration: real("duration"), // in seconds
  transcription: text("transcription"),
  srtContent: text("srt_content"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transcription segments table
export const transcriptionSegments = pgTable("transcription_segments", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  startTime: real("start_time").notNull(),
  endTime: real("end_time").notNull(),
  text: text("text").notNull(),
  confidence: real("confidence"),
  speakerId: varchar("speaker_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transcript annotations table
export const transcriptAnnotations = pgTable("transcript_annotations", {
  id: uuid("id").primaryKey().defaultRandom(),
  segmentId: uuid("segment_id").notNull(),
  userId: varchar("user_id").notNull(),
  type: varchar("type", { enum: ["comment", "note", "correction", "highlight"] }).notNull(),
  content: text("content").notNull(),
  position: integer("position"), // Character position within segment for precise annotation
  resolved: boolean("resolved").default(false),
  parentId: uuid("parent_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Annotation reactions table for likes, approvals, etc.
export const annotationReactions = pgTable("annotation_reactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  annotationId: uuid("annotation_id").notNull().references(() => transcriptAnnotations.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { enum: ["like", "approve", "disagree"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Project collaborators table
export const projectCollaborators = pgTable("project_collaborators", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { enum: ["owner", "editor", "viewer", "reviewer"] }).notNull(),
  permissions: jsonb("permissions"), // Custom permissions object
  invitedBy: varchar("invited_by").references(() => users.id),
  invitedAt: timestamp("invited_at").defaultNow(),
  joinedAt: timestamp("joined_at"),
  status: varchar("status", { enum: ["pending", "active", "suspended"] }).default("pending"),
}, (table) => ({
  uniqueProjectUser: unique().on(table.projectId, table.userId),
}));

// Language models table
export const languageModels = pgTable("language_models", {
  id: varchar("id").primaryKey(), // e.g., 'en-us-small'
  language: varchar("language").notNull(),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // 'small', 'large', 'dynamic'
  size: varchar("size").notNull(), // e.g., '40MB'
  wer: real("wer"), // Word Error Rate
  downloadUrl: varchar("download_url").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// User settings table
export const userSettings = pgTable("user_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  defaultLanguage: varchar("default_language").default("en-us"),
  autoSave: boolean("auto_save").default(true),
  videoQuality: varchar("video_quality").default("1080p"),
  srtFormat: varchar("srt_format").default("srt"),
  localProcessing: boolean("local_processing").default(true),
  analyticsSharing: boolean("analytics_sharing").default(false),
  hasCompletedOnboarding: boolean("has_completed_onboarding").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  plan: varchar("plan", { enum: ["free", "pro"] }).default("free"),
  status: varchar("status", { enum: ["active", "canceled", "past_due", "incomplete"] }).default("active"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  stripePriceId: varchar("stripe_price_id"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTranscriptionSegmentSchema = createInsertSchema(transcriptionSegments).omit({
  id: true,
  createdAt: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTranscriptAnnotationSchema = createInsertSchema(transcriptAnnotations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnnotationReactionSchema = createInsertSchema(annotationReactions).omit({
  id: true,
  createdAt: true,
});

export const insertProjectCollaboratorSchema = createInsertSchema(projectCollaborators).omit({
  id: true,
  invitedAt: true,
  joinedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertTranscriptionSegment = z.infer<typeof insertTranscriptionSegmentSchema>;
export type TranscriptionSegment = typeof transcriptionSegments.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type LanguageModel = typeof languageModels.$inferSelect;
