import { Request, Response, NextFunction } from 'express';
import { QuoteService } from '../services/quote.service';
import { QuoteStatusType } from '../db/schema';

export class QuoteController {
  constructor(private quoteService: QuoteService) {}

  createQuote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const quote = await this.quoteService.createQuote(req.body);
      res.status(201).json(quote);
    } catch (error) {
      next(error);
    }
  };

  getQuotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // req.query is validated and parsed by Zod middleware
      const { customer, project, page, limit } = req.query as any;
      const offset = (page - 1) * limit;

      const quotes = await this.quoteService.getQuotes({
        customer,
        project,
        limit,
        offset,
      });

      res.status(200).json(quotes);
    } catch (error) {
      next(error);
    }
  };

  getQuoteById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.quoteService.getQuoteWithAnalysis(id);
      
      // Direct return of `{ quote: {}, analysis: {} }` as requested
      res.status(200).json({
        quote: result.quote,
        analysis: result.analysis,
      });
    } catch (error) {
      next(error);
    }
  };

  updateQuoteStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await this.quoteService.updateQuoteStatus(id, status as QuoteStatusType);
      
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  };

  analyzeQuote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const forceLive = req.query.forceLive === 'true' || req.headers['x-force-live'] === 'true';
      const result = await this.quoteService.analyzeQuote(id, forceLive);
      
      // Return combined response of `{ quote: {}, analysis: {} }`
      res.status(200).json({
        quote: result.quote,
        analysis: result.analysis,
      });
    } catch (error) {
      next(error);
    }
  };
}
