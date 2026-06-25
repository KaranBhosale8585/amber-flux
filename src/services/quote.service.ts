import { QuoteRepository } from '../repositories/quote.repository';
import { AnalysisRepository } from '../repositories/analysis.repository';
import { QuoteRequest, AnalysisResult, SearchOptions, CreateQuoteInput } from '../types';
import { QuoteStatus, QuoteStatusType } from '../db/schema';
import { NotFoundError, FastAPIInvalidResponseError, FastAPIUnavailableError } from '../utils/errors';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export class QuoteService {
  constructor(
    private quoteRepository: QuoteRepository,
    private analysisRepository: AnalysisRepository
  ) {}

  async createQuote(input: CreateQuoteInput): Promise<QuoteRequest> {
    return this.quoteRepository.create(input);
  }

  async getQuoteWithAnalysis(id: string): Promise<{ quote: QuoteRequest; analysis: AnalysisResult | null }> {
    const quote = await this.quoteRepository.findById(id);
    if (!quote) {
      throw new NotFoundError(`Quote with ID ${id} not found`);
    }
    const analysis = await this.analysisRepository.findByQuoteId(id);
    return { quote, analysis };
  }

  async getQuotes(options: SearchOptions): Promise<QuoteRequest[]> {
    if (options.customer || options.project) {
      return this.quoteRepository.search(options);
    }
    return this.quoteRepository.findAll(options.limit, options.offset);
  }

  async updateQuoteStatus(id: string, status: QuoteStatusType): Promise<QuoteRequest> {
    // Verify status is valid (should be handled by validation middleware, but as defensive programming)
    const validStatuses: string[] = Object.values(QuoteStatus);
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const updated = await this.quoteRepository.updateStatus(id, status);
    if (!updated) {
      throw new NotFoundError(`Quote with ID ${id} not found`);
    }
    return updated;
  }

  async analyzeQuote(id: string, forceLive = false): Promise<{ quote: QuoteRequest; analysis: AnalysisResult }> {
    const quote = await this.quoteRepository.findById(id);
    if (!quote) {
      throw new NotFoundError(`Quote with ID ${id} not found`);
    }

    // If analysis already exists, return it
    const existingAnalysis = await this.analysisRepository.findByQuoteId(id);
    if (existingAnalysis) {
      return { quote, analysis: existingAnalysis };
    }

    let apiResponse: any;
    let callFailed = false;

    try {
      const response = await axios.post(
        `${FASTAPI_URL}/analyze`,
        { quote_id: id },
        { timeout: 3000, headers: { 'Content-Type': 'application/json' } }
      );

      // Verify the response is JSON and has structure
      if (!response.data || typeof response.data !== 'object') {
        throw new FastAPIInvalidResponseError('Response body is not a JSON object');
      }
      
      apiResponse = response.data;
    } catch (error: any) {
      callFailed = true;
      if (forceLive) {
        if (error instanceof FastAPIInvalidResponseError) {
          throw error;
        }
        throw new FastAPIUnavailableError(
          `FastAPI service connection failed: ${error.message || 'Unknown error'}`
        );
      }
      
      console.warn(`FastAPI service unavailable at ${FASTAPI_URL}/analyze. Falling back to mock response.`);
      // Mock response
      apiResponse = {
        risk: 'Medium',
        missing_items: ['Structural drawings', 'Load requirements'],
        confidence: 91,
      };
    }

    // If call succeeded, validate response structure to handle "Invalid JSON from FastAPI"
    if (!callFailed) {
      const hasRisk = typeof apiResponse.risk === 'string';
      const hasConfidence = typeof apiResponse.confidence === 'number';
      const hasMissingItems = Array.isArray(apiResponse.missing_items);

      if (!hasRisk || !hasConfidence || !hasMissingItems) {
        throw new FastAPIInvalidResponseError(
          `Invalid JSON structure from FastAPI: risk (string), confidence (number), and missing_items (array) are required. Received: ${JSON.stringify(apiResponse)}`
        );
      }
    }

    const risk = apiResponse.risk;
    const confidence = apiResponse.confidence;
    const missingItems = apiResponse.missing_items;

    const analysis = await this.analysisRepository.create({
      quoteId: id,
      risk,
      confidence,
      missingItems,
    });

    return { quote, analysis };
  }
}
