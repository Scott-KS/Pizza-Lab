import { describe, it, expect, vi } from 'vitest';

// Mock nav.js to avoid DOM dependencies — only OVEN_TYPES is needed
vi.mock('../js/nav.js', () => ({
  OVEN_TYPES: {
    home: 'Home Oven',
    'wood-fired': 'Pizza Oven — Wood-Fired',
    gas: 'Pizza Oven — Gas',
    portable: 'Countertop — Portable',
    electric: 'Countertop — Electric',
  },
}));

const { FERMENT_METHODS, getAvailableFermentMethods, buildScheduleBackward, OVEN_PREHEAT_MINUTES } =
  await import('../scheduler-data.js');

// ══════════════════════════════════════════════════════
// FERMENT_METHODS data
// ══════════════════════════════════════════════════════

describe('FERMENT_METHODS', () => {
  it('has expected method IDs', () => {
    expect(FERMENT_METHODS['cold-72']).toBeDefined();
    expect(FERMENT_METHODS['cold-48']).toBeDefined();
    expect(FERMENT_METHODS['cold-24']).toBeDefined();
    expect(FERMENT_METHODS['same-day']).toBeDefined();
  });

  it('cold-72 requires 76+ hours', () => {
    expect(FERMENT_METHODS['cold-72'].minHoursNeeded).toBe(76);
    expect(FERMENT_METHODS['cold-72'].isColdFerment).toBe(true);
  });

  it('same-day has 0 min hours', () => {
    expect(FERMENT_METHODS['same-day'].minHoursNeeded).toBe(0);
    expect(FERMENT_METHODS['same-day'].isColdFerment).toBe(false);
  });
});

// ══════════════════════════════════════════════════════
// getAvailableFermentMethods
// ══════════════════════════════════════════════════════

describe('getAvailableFermentMethods', () => {
  it('returns only same-day when < 28 hours available', () => {
    const methods = getAvailableFermentMethods(10, 'neapolitan');
    expect(methods.length).toBe(1);
    expect(methods[0].id).toBe('same-day');
  });

  it('includes cold-24 when 28+ hours available', () => {
    const methods = getAvailableFermentMethods(30, 'neapolitan');
    const ids = methods.map((m) => m.id);
    expect(ids).toContain('cold-24');
    expect(ids).toContain('same-day');
  });

  it('includes cold-48 when 52+ hours available', () => {
    const methods = getAvailableFermentMethods(55, 'neapolitan');
    const ids = methods.map((m) => m.id);
    expect(ids).toContain('cold-48');
    expect(ids).toContain('cold-24');
  });

  it('includes all methods when 76+ hours available', () => {
    const methods = getAvailableFermentMethods(80, 'neapolitan');
    const ids = methods.map((m) => m.id);
    expect(ids).toContain('cold-72');
    expect(ids).toContain('cold-48');
    expect(ids).toContain('cold-24');
    expect(ids).toContain('same-day');
  });
});

// ══════════════════════════════════════════════════════
// buildScheduleBackward — fermentation timing
// ══════════════════════════════════════════════════════

describe('buildScheduleBackward', () => {
  // Set eat time far in the future to ensure validity
  const futureEat = new Date(Date.now() + 100 * 60 * 60 * 1000); // +100 hours

  describe('same-day schedule', () => {
    const method = FERMENT_METHODS['same-day'];
    const result = buildScheduleBackward(futureEat, 'home', method, 2, 250, 'neapolitan');

    it('returns a valid schedule', () => {
      expect(result.isValid).toBe(true);
      expect(result.steps).toBeDefined();
      expect(Array.isArray(result.steps)).toBe(true);
      expect(result.steps.length).toBeGreaterThan(0);
    });

    it('steps are in chronological order', () => {
      for (let i = 1; i < result.steps.length; i++) {
        expect(result.steps[i].dateTime.getTime()).toBeGreaterThanOrEqual(
          result.steps[i - 1].dateTime.getTime()
        );
      }
    });

    it('last step is at or near eat time', () => {
      const lastStep = result.steps[result.steps.length - 1];
      const diffMinutes = Math.abs(lastStep.dateTime - futureEat) / 60000;
      expect(diffMinutes).toBeLessThanOrEqual(5);
    });

    it('first step (mix) is before eat time', () => {
      expect(result.mixTime.getTime()).toBeLessThan(futureEat.getTime());
    });

    it('each step has required fields', () => {
      for (const step of result.steps) {
        expect(step.label).toBeDefined();
        expect(step.dateTime).toBeInstanceOf(Date);
        expect(typeof step.instruction).toBe('string');
        expect(typeof step.checked).toBe('boolean');
      }
    });
  });

  describe('cold-ferment schedule (24h)', () => {
    const method = FERMENT_METHODS['cold-24'];
    const result = buildScheduleBackward(futureEat, 'home', method, 1, 250, 'neapolitan');

    it('returns a valid schedule', () => {
      expect(result.isValid).toBe(true);
    });

    it('mix time is at least 24 hours before eat time', () => {
      const hoursBeforeEat = (futureEat - result.mixTime) / 3600000;
      expect(hoursBeforeEat).toBeGreaterThanOrEqual(24);
    });

    it('includes a cold-ferment step', () => {
      const coldStep = result.steps.find(
        (s) => s.label.toLowerCase().includes('cold') || s.label.toLowerCase().includes('fridge')
      );
      expect(coldStep).toBeDefined();
    });

    it('steps span more than 24 hours', () => {
      const firstTime = result.steps[0].dateTime.getTime();
      const lastTime = result.steps[result.steps.length - 1].dateTime.getTime();
      const spanHours = (lastTime - firstTime) / 3600000;
      expect(spanHours).toBeGreaterThanOrEqual(24);
    });
  });

  describe('schedule with insufficient time', () => {
    const nearEat = new Date(Date.now() + 30 * 60 * 1000); // 30 min from now
    const method = FERMENT_METHODS['same-day'];
    const result = buildScheduleBackward(nearEat, 'home', method, 1, 250, 'neapolitan');

    it('marks schedule as invalid', () => {
      expect(result.isValid).toBe(false);
    });

    it('provides a validation message', () => {
      expect(result.validationMsg).toBeDefined();
      expect(result.validationMsg.length).toBeGreaterThan(0);
    });
  });

  describe('preheat time varies by oven type', () => {
    const method = FERMENT_METHODS['same-day'];
    const homeResult = buildScheduleBackward(futureEat, 'home', method, 1, 250, 'neapolitan');
    const woodResult = buildScheduleBackward(futureEat, 'wood-fired', method, 1, 250, 'neapolitan');

    it('wood-fired has a longer lead time than home oven', () => {
      // Wood-fired preheat is 90 min, home is 45 min
      expect(OVEN_PREHEAT_MINUTES['wood-fired']).toBeGreaterThan(OVEN_PREHEAT_MINUTES.home);
      // So wood-fired mix time should be earlier (or same with longer preheat step)
      expect(homeResult.mixTime.getTime()).toBeGreaterThanOrEqual(woodResult.mixTime.getTime());
    });
  });
});
