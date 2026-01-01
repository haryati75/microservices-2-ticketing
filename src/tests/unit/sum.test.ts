import { sum } from '../../sum.js';

describe('Sample Test - sum', () => {
  it('should return the sum of two numbers', () => {
    expect(sum(2, 3)).toBe(5);
  });
});
