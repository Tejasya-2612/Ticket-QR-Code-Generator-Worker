import { describe, expect, it } from 'vitest';
import { sanitizeText } from './sanitize.js';

describe('sanitizeText', () => {
  it('strips markup and trims user input', () => {
    expect(sanitizeText('  <script>alert("xss")</script> hello  ')).toBe('alert("xss") hello');
  });
});
