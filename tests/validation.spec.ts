import { createQuoteSchema, updateStatusSchema } from '../src/validations/quote.validation';

describe('Validation Schemas Unit Tests', () => {
  describe('createQuoteSchema', () => {
    it('should validate a valid quote input successfully', () => {
      const validData = {
        customer: 'Wayne Enterprises',
        project: 'Subterranean Lab Renovation',
        estimatedValue: 450000.75,
      };
      
      const result = createQuoteSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.customer).toBe(validData.customer);
        expect(result.data.project).toBe(validData.project);
        expect(result.data.estimatedValue).toBe(validData.estimatedValue);
      }
    });

    it('should fail validation when customer name is missing', () => {
      const invalidData = {
        project: 'Subterranean Lab Renovation',
        estimatedValue: 450000.75,
      };

      const result = createQuoteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMsg = result.error.errors[0].message;
        expect(errorMsg).toBe('Customer name is required');
      }
    });

    it('should fail validation when customer name is empty', () => {
      const invalidData = {
        customer: '',
        project: 'Subterranean Lab Renovation',
        estimatedValue: 450000.75,
      };

      const result = createQuoteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMsg = result.error.errors[0].message;
        expect(errorMsg).toBe('Customer name cannot be empty');
      }
    });

    it('should fail validation when project name is missing', () => {
      const invalidData = {
        customer: 'Wayne Enterprises',
        estimatedValue: 450000.75,
      };

      const result = createQuoteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMsg = result.error.errors[0].message;
        expect(errorMsg).toBe('Project name is required');
      }
    });

    it('should fail validation when estimatedValue is negative', () => {
      const invalidData = {
        customer: 'Wayne Enterprises',
        project: 'Subterranean Lab Renovation',
        estimatedValue: -1,
      };

      const result = createQuoteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMsg = result.error.errors[0].message;
        expect(errorMsg).toBe('Estimated value must be greater than or equal to 0');
      }
    });

    it('should fail validation when estimatedValue is not a number', () => {
      const invalidData = {
        customer: 'Wayne Enterprises',
        project: 'Subterranean Lab Renovation',
        estimatedValue: 'one hundred thousand',
      };

      const result = createQuoteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMsg = result.error.errors[0].message;
        expect(errorMsg).toBe('Estimated value must be a number');
      }
    });
  });

  describe('updateStatusSchema', () => {
    it.each(['New', 'In Review', 'Needs Info', 'Completed'])(
      'should validate correct status "%s" successfully',
      (status) => {
        const result = updateStatusSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    );

    it('should fail validation for incorrect status values', () => {
      const result = updateStatusSchema.safeParse({ status: 'InvalidStatus' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMsg = result.error.errors[0].message;
        expect(errorMsg).toContain('Invalid status. Allowed values: New, In Review, Needs Info, Completed');
      }
    });
  });
});
