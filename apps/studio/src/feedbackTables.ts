import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import type { FeedbackContext, FeedbackSnapshot } from '@tastir/schema';

export const feedbackReports = pgTable(
  'feedback_reports',
  {
    id: text('id').primaryKey(),
    created: timestamp('created', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated: timestamp('updated', { withTimezone: true })
      .notNull()
      .defaultNow(),
    category: text('category').notNull(),
    message: text('message').notNull(),
    context: jsonb('context').$type<FeedbackContext>().notNull(),
    snapshot: jsonb('snapshot').$type<FeedbackSnapshot>(),
    imageKey: text('image_key'),
    imageBytes: integer('image_bytes').notNull().default(0),
    payloadBytes: integer('payload_bytes').notNull().default(0),
    status: text('status').notNull().default('new'),
    moderation: text('moderation').notNull().default('inbox'),
    priority: text('priority').notNull().default('normal'),
    group: text('issue_group').notNull().default(''),
    version: integer('version').notNull().default(1),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
    evidenceExpires: timestamp('evidence_expires', {
      withTimezone: true,
    }).notNull(),
  },
  (t) => [
    index('feedback_inbox').on(t.moderation, t.status, t.created),
    index('feedback_pattern').on(sql`(${t.context}->>'pattern')`, t.created),
    index('feedback_group').on(t.group),
    index('feedback_expiry').on(t.expires),
    index('feedback_evidence_expiry').on(t.evidenceExpires),
  ],
);

export const feedbackContacts = pgTable('feedback_contacts', {
  report: text('report')
    .primaryKey()
    .references(() => feedbackReports.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
});
export const feedbackEvents = pgTable('feedback_events', {
  id: text('id').primaryKey(),
  report: text('report').references(() => feedbackReports.id, {
    onDelete: 'cascade',
  }),
  author: text('author').notNull(),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  kind: text('kind').notNull(),
  detail: jsonb('detail').$type<Record<string, unknown>>().notNull(),
});
export const feedbackCounters = pgTable('feedback_counters', {
  key: text('key').primaryKey(),
  value: integer('value').notNull(),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
});
export const feedbackReceipts = pgTable('feedback_receipts', {
  id: text('id').primaryKey(),
  secret: text('secret').notNull(),
  content: text('content').notNull(),
  report: text('report').notNull(),
  state: text('state').notNull(),
  imageKey: text('image_key'),
  bytes: integer('bytes').notNull().default(0),
  quotas: jsonb('quotas')
    .$type<{ key: string; amount: number }[]>()
    .notNull()
    .default([]),
  lease: timestamp('lease', { withTimezone: true }).notNull(),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
});
export const feedbackSettings = pgTable('feedback_settings', {
  id: text('id').primaryKey(),
  paused: integer('paused').notNull().default(0),
  attachmentsPaused: integer('attachments_paused').notNull().default(0),
  cleanupAt: timestamp('cleanup_at', { withTimezone: true }),
});
