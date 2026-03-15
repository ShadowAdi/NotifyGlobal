import { pgTable, uuid, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (synced with Supabase Auth)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Projects table (workspaces for organizing contacts and templates)
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Contacts table (recipients with language preferences)
export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  language: text('language').notNull().default('en'), // ISO language code (en, es, fr, hi, etc.)
  tags: jsonb('tags'), // Array of tags for filtering (e.g., ['premium', 'active', 'beta-tester'])
  discordUsername: text('discord_username'),
  metadata: jsonb('metadata'), // Additional custom fields from CSV/JSON
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Templates table (email templates with variables)
export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  subject: text('subject').notNull(), // Email subject line with variables
  body: text('body').notNull(), // Email body with {{variables}}
  variables: jsonb('variables'), // Array of variable names used in template
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Events table (trigger definitions)
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  eventName: text('event_name').notNull(), // e.g., "user_signup", "payment_received"
  eventId: text('event_id').notNull().unique(), // e.g., "evt_abc123" - used in API calls
  templateId: uuid('template_id').references(() => templates.id, { onDelete: 'restrict' }), // Optional — use template OR inline subject+message
  subject: text('subject'), // Inline subject (used when no template)
  message: text('message'), // Inline body (used when no template)
  channel: text('channel').notNull().default('email'), // email, discord, slack
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// API Keys table (for authentication)
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  key: text('key').notNull().unique(), // The actual API key (hashed)
  name: text('name').notNull(), // Friendly name for the key
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Campaigns table (bulk sends to all contacts)
export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  templateId: uuid('template_id').references(() => templates.id, { onDelete: 'restrict' }), // Optional - can provide message directly
  name: text('name').notNull(),
  subject: text('subject'), // Optional - only needed if no template, otherwise uses template subject
  message: text('message'), // Optional message body if no template
  channel: text('channel').notNull().default('email'), // email, sms, discord, slack
  filterType: text('filter_type').notNull().default('manual'), // manual, all, language, tags
  filterLanguage: text('filter_language'), // Language code if filterType is 'language'
  filterTags: jsonb('filter_tags'), // Array of tags if filterType is 'tags'
  contactIds: jsonb('contact_ids'), // Resolved contact IDs (for manual or after filtering)
  status: text('status').notNull().default('draft'), // draft, sending, completed, failed
  totalContacts: text('total_contacts'), // Number as text to avoid integer overflow
  sentCount: text('sent_count').default('0'),
  failedCount: text('failed_count').default('0'),
  scheduledAt: timestamp('scheduled_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Send Logs table (individual message delivery records)
export const sendLogs = pgTable('send_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  contactId: uuid('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'set null' }),
  campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  channel: text('channel').notNull().default('email'), // email, discord, slack
  status: text('status').notNull().default('pending'), // pending, sent, failed, bounced
  translatedLanguage: text('translated_language'), // Language the message was translated to
  subject: text('subject'), // Actual subject sent (after translation)
  body: text('body'), // Actual body sent (after translation)
  errorMessage: text('error_message'),
  externalId: text('external_id'), // ID from email provider (Resend, etc.)
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  apiKeys: many(apiKeys),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  contacts: many(contacts),
  templates: many(templates),
  events: many(events),
  apiKeys: many(apiKeys),
  campaigns: many(campaigns),
  sendLogs: many(sendLogs),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  project: one(projects, {
    fields: [contacts.projectId],
    references: [projects.id],
  }),
  sendLogs: many(sendLogs),
}));

export const templatesRelations = relations(templates, ({ one, many }) => ({
  project: one(projects, {
    fields: [templates.projectId],
    references: [projects.id],
  }),
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  project: one(projects, {
    fields: [events.projectId],
    references: [projects.id],
  }),
  template: one(templates, {
    fields: [events.templateId],
    references: [templates.id],
  }),
  sendLogs: many(sendLogs),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [apiKeys.projectId],
    references: [projects.id],
  }),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  project: one(projects, {
    fields: [campaigns.projectId],
    references: [projects.id],
  }),
  template: one(templates, {
    fields: [campaigns.templateId],
    references: [templates.id],
  }),
  sendLogs: many(sendLogs),
}));

export const sendLogsRelations = relations(sendLogs, ({ one }) => ({
  project: one(projects, {
    fields: [sendLogs.projectId],
    references: [projects.id],
  }),
  contact: one(contacts, {
    fields: [sendLogs.contactId],
    references: [contacts.id],
  }),
  event: one(events, {
    fields: [sendLogs.eventId],
    references: [events.id],
  }),
  campaign: one(campaigns, {
    fields: [sendLogs.campaignId],
    references: [campaigns.id],
  }),
}));
