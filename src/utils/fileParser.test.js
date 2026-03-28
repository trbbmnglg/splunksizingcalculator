import { describe, it, expect } from 'vitest';
import { parseFileEvents } from './fileParser';

describe('parseFileEvents', () => {
  it('counts JSON array elements', () => {
    expect(parseFileEvents('[{"a":1},{"b":2},{"c":3}]')).toBe(3);
  });

  it('returns 1 for a JSON object (not array)', () => {
    expect(parseFileEvents('{"key":"value"}')).toBe(1);
  });

  it('counts non-empty lines for plain text', () => {
    expect(parseFileEvents('line1\nline2\n\nline3\n')).toBe(3);
  });

  it('returns 1 for a single line', () => {
    expect(parseFileEvents('hello world')).toBe(1);
  });

  it('returns 1 for empty content', () => {
    expect(parseFileEvents('')).toBe(1);
  });
});
