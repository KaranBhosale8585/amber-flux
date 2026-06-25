import { QuoteService } from '../src/services/quote.service';
import { QuoteRepository } from '../src/repositories/quote.repository';
import { AnalysisRepository } from '../src/repositories/analysis.repository';
import { NotFoundError, FastAPIUnavailableError, FastAPIInvalidResponseError } from '../src/utils/errors';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('QuoteService Unit Tests', () => {
  let quoteService: QuoteService;
  let mockQuoteRepo: jest.Mocked<QuoteRepository>;
  let mockAnalysisRepo: jest.Mocked<AnalysisRepository>;

  const sampleQuote = {
    id: 'quote-uuid-123',
    customer: 'Globex Corp',
    project: 'Bio-dome Construction',
    status: 'New' as const,
    estimatedValue: 500000,
    createdDate: new Date('2026-06-25T12:00:00Z'),
  };

  const sampleAnalysis = {
    id: 'analysis-uuid-456',
    quoteId: 'quote-uuid-123',
    risk: 'Low',
    confidence: 95,
    missingItems: [],
    analyzedAt: new Date('2026-06-25T12:05:00Z'),
  };

  beforeEach(() => {
    mockQuoteRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      updateStatus: jest.fn(),
      search: jest.fn(),
    } as unknown as jest.Mocked<QuoteRepository>;

    mockAnalysisRepo = {
      create: jest.fn(),
      findByQuoteId: jest.fn(),
    } as unknown as jest.Mocked<AnalysisRepository>;

    quoteService = new QuoteService(mockQuoteRepo, mockAnalysisRepo);
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('createQuote', () => {
    it('should call repository.create and return the result', async () => {
      const input = { customer: 'Globex Corp', project: 'Bio-dome Construction', estimatedValue: 500000 };
      mockQuoteRepo.create.mockResolvedValue(sampleQuote);

      const result = await quoteService.createQuote(input);

      expect(mockQuoteRepo.create).toHaveBeenCalledWith(input);
      expect(result).toEqual(sampleQuote);
    });
  });

  describe('getQuoteWithAnalysis', () => {
    it('should throw NotFoundError if the quote does not exist', async () => {
      mockQuoteRepo.findById.mockResolvedValue(null);

      await expect(quoteService.getQuoteWithAnalysis('non-existent')).rejects.toThrow(NotFoundError);
      expect(mockQuoteRepo.findById).toHaveBeenCalledWith('non-existent');
    });

    it('should return quote and its analysis (if exists)', async () => {
      mockQuoteRepo.findById.mockResolvedValue(sampleQuote);
      mockAnalysisRepo.findByQuoteId.mockResolvedValue(sampleAnalysis);

      const result = await quoteService.getQuoteWithAnalysis('quote-uuid-123');

      expect(mockQuoteRepo.findById).toHaveBeenCalledWith('quote-uuid-123');
      expect(mockAnalysisRepo.findByQuoteId).toHaveBeenCalledWith('quote-uuid-123');
      expect(result).toEqual({ quote: sampleQuote, analysis: sampleAnalysis });
    });

    it('should return quote and null analysis if no analysis has been run', async () => {
      mockQuoteRepo.findById.mockResolvedValue(sampleQuote);
      mockAnalysisRepo.findByQuoteId.mockResolvedValue(null);

      const result = await quoteService.getQuoteWithAnalysis('quote-uuid-123');

      expect(result).toEqual({ quote: sampleQuote, analysis: null });
    });
  });

  describe('getQuotes', () => {
    it('should call search when customer or project is provided', async () => {
      mockQuoteRepo.search.mockResolvedValue([sampleQuote]);
      const options = { customer: 'Globex', limit: 10, offset: 0 };

      const result = await quoteService.getQuotes(options);

      expect(mockQuoteRepo.search).toHaveBeenCalledWith(options);
      expect(mockQuoteRepo.findAll).not.toHaveBeenCalled();
      expect(result).toEqual([sampleQuote]);
    });

    it('should call findAll when no search parameters are specified', async () => {
      mockQuoteRepo.findAll.mockResolvedValue([sampleQuote]);
      const options = { limit: 5, offset: 10 };

      const result = await quoteService.getQuotes(options);

      expect(mockQuoteRepo.findAll).toHaveBeenCalledWith(5, 10);
      expect(mockQuoteRepo.search).not.toHaveBeenCalled();
      expect(result).toEqual([sampleQuote]);
    });
  });

  describe('updateQuoteStatus', () => {
    it('should call updateStatus and return updated quote request', async () => {
      const updatedQuote = { ...sampleQuote, status: 'In Review' as const };
      mockQuoteRepo.updateStatus.mockResolvedValue(updatedQuote);

      const result = await quoteService.updateQuoteStatus('quote-uuid-123', 'In Review');

      expect(mockQuoteRepo.updateStatus).toHaveBeenCalledWith('quote-uuid-123', 'In Review');
      expect(result).toEqual(updatedQuote);
    });

    it('should throw NotFoundError if the quote status update fails (quote not found)', async () => {
      mockQuoteRepo.updateStatus.mockResolvedValue(null);

      await expect(quoteService.updateQuoteStatus('non-existent', 'Completed')).rejects.toThrow(NotFoundError);
    });
  });

  describe('analyzeQuote', () => {
    it('should return existing analysis without invoking FastAPI if already analyzed', async () => {
      mockQuoteRepo.findById.mockResolvedValue(sampleQuote);
      mockAnalysisRepo.findByQuoteId.mockResolvedValue(sampleAnalysis);

      const result = await quoteService.analyzeQuote('quote-uuid-123');

      expect(mockAnalysisRepo.findByQuoteId).toHaveBeenCalledWith('quote-uuid-123');
      expect(mockedAxios.post).not.toHaveBeenCalled();
      expect(mockAnalysisRepo.create).not.toHaveBeenCalled();
      expect(result).toEqual({ quote: sampleQuote, analysis: sampleAnalysis });
    });

    it('should call FastAPI, save the result, and return combined output when service is active', async () => {
      mockQuoteRepo.findById.mockResolvedValue(sampleQuote);
      mockAnalysisRepo.findByQuoteId.mockResolvedValue(null);
      
      const apiResponse = {
        risk: 'High',
        confidence: 88,
        missing_items: ['Soil testing report'],
      };
      
      mockedAxios.post.mockResolvedValue({ data: apiResponse });
      mockAnalysisRepo.create.mockResolvedValue(sampleAnalysis);

      const result = await quoteService.analyzeQuote('quote-uuid-123');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/analyze'),
        { quote_id: 'quote-uuid-123' },
        expect.any(Object)
      );
      expect(mockAnalysisRepo.create).toHaveBeenCalledWith({
        quoteId: 'quote-uuid-123',
        risk: 'High',
        confidence: 88,
        missingItems: ['Soil testing report'],
      });
      expect(result).toEqual({ quote: sampleQuote, analysis: sampleAnalysis });
    });

    it('should fall back to mock response on network error when forceLive is false', async () => {
      mockQuoteRepo.findById.mockResolvedValue(sampleQuote);
      mockAnalysisRepo.findByQuoteId.mockResolvedValue(null);
      
      mockedAxios.post.mockRejectedValue(new Error('Connection refused'));
      mockAnalysisRepo.create.mockResolvedValue(sampleAnalysis);

      const result = await quoteService.analyzeQuote('quote-uuid-123', false);

      expect(mockAnalysisRepo.create).toHaveBeenCalledWith({
        quoteId: 'quote-uuid-123',
        risk: 'Medium',
        confidence: 91,
        missingItems: ['Structural drawings', 'Load requirements'],
      });
      expect(result).toEqual({ quote: sampleQuote, analysis: sampleAnalysis });
    });

    it('should throw FastAPIUnavailableError on network error when forceLive is true', async () => {
      mockQuoteRepo.findById.mockResolvedValue(sampleQuote);
      mockAnalysisRepo.findByQuoteId.mockResolvedValue(null);
      
      mockedAxios.post.mockRejectedValue(new Error('Connection timed out'));

      await expect(quoteService.analyzeQuote('quote-uuid-123', true)).rejects.toThrow(FastAPIUnavailableError);
      expect(mockAnalysisRepo.create).not.toHaveBeenCalled();
    });

    it('should throw FastAPIInvalidResponseError if FastAPI returns invalid schema', async () => {
      mockQuoteRepo.findById.mockResolvedValue(sampleQuote);
      mockAnalysisRepo.findByQuoteId.mockResolvedValue(null);
      
      const corruptedResponse = {
        corrupted: 'data',
      };
      
      mockedAxios.post.mockResolvedValue({ data: corruptedResponse });

      await expect(quoteService.analyzeQuote('quote-uuid-123', false)).rejects.toThrow(FastAPIInvalidResponseError);
      expect(mockAnalysisRepo.create).not.toHaveBeenCalled();
    });
  });
});
