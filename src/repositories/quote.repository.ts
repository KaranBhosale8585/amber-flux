import { db } from '../db';
import { quoteRequests, QuoteStatusType } from '../db/schema';
import { eq, like, or } from 'drizzle-orm';
import { QuoteRequest, CreateQuoteInput, SearchOptions } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class QuoteRepository {
  async create(input: CreateQuoteInput): Promise<QuoteRequest> {
    const id = uuidv4();
    const newQuote = {
      id,
      customer: input.customer,
      project: input.project,
      estimatedValue: input.estimatedValue,
      status: 'New' as QuoteStatusType,
    };

    const [inserted] = await db.insert(quoteRequests).values(newQuote).returning();
    
    if (!inserted) {
      throw new Error('Failed to create quote');
    }

    return {
      ...inserted,
      createdDate: inserted.createdDate,
    };
  }

  async findById(id: string): Promise<QuoteRequest | null> {
    const [quote] = await db.select().from(quoteRequests).where(eq(quoteRequests.id, id));
    if (!quote) return null;
    return {
      ...quote,
      createdDate: quote.createdDate,
    };
  }

  async findAll(limit = 10, offset = 0): Promise<QuoteRequest[]> {
    const results = await db
      .select()
      .from(quoteRequests)
      .limit(limit)
      .offset(offset);

    return results.map(quote => ({
      ...quote,
      createdDate: quote.createdDate,
    }));
  }

  async updateStatus(id: string, status: QuoteStatusType): Promise<QuoteRequest | null> {
    const [updated] = await db
      .update(quoteRequests)
      .set({ status })
      .where(eq(quoteRequests.id, id))
      .returning();

    if (!updated) return null;
    return {
      ...updated,
      createdDate: updated.createdDate,
    };
  }

  async search(options: SearchOptions): Promise<QuoteRequest[]> {
    const { customer, project, limit = 10, offset = 0 } = options;
    
    const conditions = [];
    if (customer) {
      conditions.push(like(quoteRequests.customer, `%${customer}%`));
    }
    if (project) {
      conditions.push(like(quoteRequests.project, `%${project}%`));
    }

    let query = db.select().from(quoteRequests);

    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : or(...conditions)) as any;
    }

    const results = await query.limit(limit).offset(offset);

    return results.map(quote => ({
      ...quote,
      createdDate: quote.createdDate,
    }));
  }
}
