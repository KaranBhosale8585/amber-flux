import { QuoteStatusType } from '../db/schema';

export interface QuoteRequest {
  id: string;
  customer: string;
  project: string;
  status: QuoteStatusType;
  estimatedValue: number;
  createdDate: Date;
}

export interface AnalysisResult {
  id: string;
  quoteId: string;
  risk: string;
  confidence: number;
  missingItems: string[];
  analyzedAt: Date;
}

export interface SearchOptions {
  customer?: string;
  project?: string;
  limit?: number;
  offset?: number;
}

export interface CreateQuoteInput {
  customer: string;
  project: string;
  estimatedValue: number;
}

export interface CreateAnalysisInput {
  quoteId: string;
  risk: string;
  confidence: number;
  missingItems: string[];
}
