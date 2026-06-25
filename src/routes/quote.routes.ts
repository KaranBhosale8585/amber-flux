import { Router } from 'express';
import { QuoteController } from '../controllers/quote.controller';
import { QuoteService } from '../services/quote.service';
import { QuoteRepository } from '../repositories/quote.repository';
import { AnalysisRepository } from '../repositories/analysis.repository';
import { validateRequest } from '../middleware/validation.middleware';
import { createQuoteSchema, updateStatusSchema, getQuotesQuerySchema } from '../validations/quote.validation';

const router = Router();

// Instantiate dependencies for the layered architecture
const quoteRepository = new QuoteRepository();
const analysisRepository = new AnalysisRepository();
const quoteService = new QuoteService(quoteRepository, analysisRepository);
const quoteController = new QuoteController(quoteService);

// Bind routes to controllers with validation middleware
router.post(
  '/',
  validateRequest(createQuoteSchema, 'body'),
  quoteController.createQuote
);

router.get(
  '/',
  validateRequest(getQuotesQuerySchema, 'query'),
  quoteController.getQuotes
);

router.get(
  '/:id',
  quoteController.getQuoteById
);

router.patch(
  '/:id/status',
  validateRequest(updateStatusSchema, 'body'),
  quoteController.updateQuoteStatus
);

router.post(
  '/:id/analyze',
  quoteController.analyzeQuote
);

export default router;
export { quoteService }; // Export service for testing purposes
