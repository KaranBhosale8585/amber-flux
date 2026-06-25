import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Status values: 'New', 'In Review', 'Needs Info', 'Completed'
export const QuoteStatus = {
  NEW: 'New',
  IN_REVIEW: 'In Review',
  NEEDS_INFO: 'Needs Info',
  COMPLETED: 'Completed',
} as const;

export type QuoteStatusType = typeof QuoteStatus[keyof typeof QuoteStatus];

export const quoteRequests = sqliteTable('quote_requests', {
  id: text('id').primaryKey(),
  customer: text('customer').notNull(),
  project: text('project').notNull(),
  status: text('status').$type<QuoteStatusType>().notNull().default('New'),
  estimatedValue: real('estimated_value').notNull(),
  createdDate: integer('created_date', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});

export const analysisResults = sqliteTable('analysis_results', {
  id: text('id').primaryKey(),
  quoteId: text('quote_id')
    .notNull()
    .references(() => quoteRequests.id, { onDelete: 'cascade' }),
  risk: text('risk').notNull(), // e.g. "Low", "Medium", "High"
  confidence: real('confidence').notNull(),
  missingItems: text('missing_items', { mode: 'json' }).$type<string[]>().notNull(),
  analyzedAt: integer('analyzed_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
});
