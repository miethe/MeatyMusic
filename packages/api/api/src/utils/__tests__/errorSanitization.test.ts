/**
 * @fileoverview Tests for error message sanitization utilities
 */

import { sanitizeErrorMessage, sanitizeObjectProperties } from '../errorSanitization';

describe('errorSanitization', () => {
  describe('sanitizeErrorMessage', () => {
    it('should return string messages as-is', () => {
      expect(sanitizeErrorMessage('Simple error message')).toBe('Simple error message');
      expect(sanitizeErrorMessage('')).toBe('An error occurred');
      expect(sanitizeErrorMessage('   ')).toBe('An error occurred');
    });

    it('should handle null and undefined', () => {
      expect(sanitizeErrorMessage(null)).toBe('An error occurred');
      expect(sanitizeErrorMessage(undefined)).toBe('An error occurred');
      expect(sanitizeErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
    });

    it('should convert numbers and booleans to strings', () => {
      expect(sanitizeErrorMessage(42)).toBe('42');
      expect(sanitizeErrorMessage(0)).toBe('0');
      expect(sanitizeErrorMessage(true)).toBe('true');
      expect(sanitizeErrorMessage(false)).toBe('false');
    });

    it('should handle Error objects properly', () => {
      const error = new Error('Test error message');
      expect(sanitizeErrorMessage(error)).toBe('Test error message');

      const errorWithEmptyMessage = new Error('');
      expect(sanitizeErrorMessage(errorWithEmptyMessage)).toBe('Error');

      const customError = new TypeError('Type error occurred');
      expect(sanitizeErrorMessage(customError)).toBe('Type error occurred');
    });

    it('should serialize plain objects to JSON', () => {
      const obj = { message: 'Error occurred', code: 'TEST_ERROR' };
      expect(sanitizeErrorMessage(obj)).toBe('{"message":"Error occurred","code":"TEST_ERROR"}');

      const nestedObj = { error: { details: 'Something went wrong' } };
      expect(sanitizeErrorMessage(nestedObj)).toBe('{"error":{"details":"Something went wrong"}}');
    });

    it('should handle arrays properly', () => {
      const simpleArray = ['Error 1', 'Error 2'];
      expect(sanitizeErrorMessage(simpleArray)).toBe('Multiple errors: Error 1, Error 2');

      const emptyArray: string[] = [];
      expect(sanitizeErrorMessage(emptyArray)).toBe('An error occurred');

      const mixedArray = ['String error', { code: 'OBJ_ERROR' }, null];
      expect(sanitizeErrorMessage(mixedArray)).toBe('Multiple errors: String error, {"code":"OBJ_ERROR"}, Unknown error');
    });

    it('should handle empty objects gracefully', () => {
      const emptyObj = {};
      expect(sanitizeErrorMessage(emptyObj)).toBe('An error occurred');
    });

    it('should handle objects that fail JSON.stringify', () => {
      // Create circular reference
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;

      const result = sanitizeErrorMessage(circularObj);
      expect(result).toBe('An error occurred'); // Fallback due to circular reference
    });

    it('should handle objects with custom toString', () => {
      const customObj = {
        toString: () => 'Custom toString result'
      };

      // Should fall back to default message since JSON.stringify returns {}
      expect(sanitizeErrorMessage(customObj)).toBe('An error occurred');
    });

    it('should handle objects with constructor names', () => {
      class CustomError {
        constructor(public message: string) {}
      }

      const customError = new CustomError('test message');
      // Should try JSON.stringify first, then fall back
      const result = sanitizeErrorMessage(customError);
      expect(result).toContain('test message'); // Should contain the message in some form
    });

    it('should use custom fallback messages', () => {
      expect(sanitizeErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
      expect(sanitizeErrorMessage({}, 'Object error')).toBe('Object error');
      expect(sanitizeErrorMessage(undefined, 'Nothing here')).toBe('Nothing here');
    });

    it('should handle functions and symbols', () => {
      const func = () => 'test';
      expect(sanitizeErrorMessage(func)).toBe('() => \'test\''); // Functions get stringified

      const sym = Symbol('test');
      expect(sanitizeErrorMessage(sym)).toBe('Symbol(test)');
    });

    it('should handle edge cases that cause [object Object]', () => {
      // These are the specific cases that were causing the original issue
      const problematicObjects = [
        { toString: null }, // Object with broken toString
        Object.create(null), // Object without prototype
        new Date(), // Should serialize to JSON string
        /test-regex/, // Regex object
      ];

      problematicObjects.forEach(obj => {
        const result = sanitizeErrorMessage(obj);
        expect(result).not.toBe('[object Object]');
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  describe('sanitizeObjectProperties', () => {
    it('should sanitize object properties', () => {
      const obj = {
        stringProp: 'Normal string',
        objectProp: { nested: 'value' },
        nullProp: null,
        numberProp: 42
      };

      const result = sanitizeObjectProperties(obj);

      expect(result.stringProp).toBe('Normal string');
      expect(result.objectProp).toBe('{"nested":"value"}');
      expect(result.nullProp).toBe('[object]');
      expect(result.numberProp).toBe('42');
    });

    it('should handle empty objects', () => {
      const result = sanitizeObjectProperties({});
      expect(result).toEqual({});
    });

    it('should preserve string values unchanged', () => {
      const obj = {
        message: 'Error message',
        description: 'Error description',
        hint: ''
      };

      const result = sanitizeObjectProperties(obj);

      expect(result.message).toBe('Error message');
      expect(result.description).toBe('Error description');
      expect(result.hint).toBe('');
    });
  });
});
