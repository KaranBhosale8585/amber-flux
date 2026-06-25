import { db } from '../db';
import { analysisResults } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AnalysisResult, CreateAnalysisInput } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class AnalysisRepository {
  async create(input: CreateAnalysisInput): Promise<AnalysisResult> {
    const id = uuidv4();
    const newAnalysis = {
      id,
      quoteId: input.quoteId,
      risk: input.risk,
      confidence: input.confidence,
      missingItems: input.missingItems,
    };

    const [inserted] = await db.insert(analysisResults).values(newAnalysis).returning();

    if (!inserted) {
      throw new Error('Failed to save analysis result');
    }

    return {
      ...inserted,
      analyzedAt: inserted.analyzedAt,
    };
  }

  async findByQuoteId(quoteId: string): Promise<AnalysisResult | null> {
    const [result] = await db
      .select()
      .from(analysisResults)
      .where(eq(analysisResults.quoteId, quoteId));
      
    if (!result) return null;
    
    return {
      ...result,
      analyzedAt: result.analyzedAt,
    };
  }
}
