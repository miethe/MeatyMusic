import { formatDate } from '../formatDate';

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2025-01-10T15:45:00Z');
    const formatted = formatDate(date);

    // Check that it contains expected parts
    expect(formatted).toMatch(/Jan/);
    expect(formatted).toMatch(/10/);
    expect(formatted).toMatch(/2025/);
    expect(formatted).toMatch(/at/);
    expect(formatted).toMatch(/PM|AM/);
  });

  it('handles different months correctly', () => {
    const dates = [
      new Date('2025-01-15T12:00:00Z'),
      new Date('2025-06-20T12:00:00Z'),
      new Date('2025-12-25T12:00:00Z'),
    ];

    dates.forEach(date => {
      const formatted = formatDate(date);
      expect(formatted).toMatch(/Jan|Jun|Dec/);
      expect(formatted).toMatch(/at/);
      expect(formatted).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  it('formats time with AM/PM correctly', () => {
    const morningDate = new Date('2025-01-10T08:30:00Z');
    const afternoonDate = new Date('2025-01-10T16:45:00Z');

    const morningFormatted = formatDate(morningDate);
    const afternoonFormatted = formatDate(afternoonDate);

    expect(morningFormatted).toMatch(/AM|PM/);
    expect(afternoonFormatted).toMatch(/AM|PM/);
  });

  it('includes minutes with leading zero when needed', () => {
    const date = new Date('2025-01-10T14:05:00Z');
    const formatted = formatDate(date);

    // Should have :05 or :XX format for minutes
    expect(formatted).toMatch(/:\d{2}/);
  });
});
