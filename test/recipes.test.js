import { describe, it, expect } from 'vitest';
import {
  PIZZA_RECIPES,
  calculateDough,
  calculateSauce,
  calculateToppings,
  getBakingInfo,
  round1,
  fToC,
} from '../recipes.js';

// ── Helper: find ingredient by name ──
function findIngredient(arr, name) {
  return arr.find((d) => d.ingredient.toLowerCase().includes(name.toLowerCase()));
}

// ══════════════════════════════════════════════════════
// round1 / fToC utilities
// ══════════════════════════════════════════════════════

describe('round1', () => {
  it('rounds to one decimal place', () => {
    expect(round1(3.14159)).toBe(3.1);
    expect(round1(2.75)).toBe(2.8);
    expect(round1(10)).toBe(10);
    expect(round1(0)).toBe(0);
  });
});

describe('fToC', () => {
  it('converts Fahrenheit to Celsius', () => {
    expect(fToC(32)).toBe(0);
    expect(fToC(212)).toBe(100);
    expect(fToC(450)).toBe(232);
  });
});

// ══════════════════════════════════════════════════════
// Recipe math — calculateDough
// ══════════════════════════════════════════════════════

describe('calculateDough', () => {
  // ── Neapolitan 12″ × 1 ──
  describe('Neapolitan 12″ × 1', () => {
    const recipe = PIZZA_RECIPES.neapolitan;
    const dough = calculateDough(recipe, 1, '12');

    it('returns an array of ingredients', () => {
      expect(Array.isArray(dough)).toBe(true);
      expect(dough.length).toBeGreaterThanOrEqual(3);
    });

    it('flour is the base ingredient at 100%', () => {
      const flour = findIngredient(dough, 'flour');
      expect(flour).toBeDefined();
      expect(flour.pct).toBe(100);
    });

    it('water percentage matches recipe hydration', () => {
      const water = findIngredient(dough, 'water');
      expect(water).toBeDefined();
      expect(water.pct).toBe(round1(recipe.hydration * 100));
    });

    it('salt percentage matches recipe', () => {
      const salt = findIngredient(dough, 'salt');
      expect(salt).toBeDefined();
      expect(salt.pct).toBe(round1(recipe.saltPct * 100));
    });

    it('total weight approximately equals doughWeight', () => {
      const total = dough.reduce((sum, d) => sum + d.amount, 0);
      // Allow small rounding tolerance
      expect(total).toBeGreaterThan(recipe.sizes['12'].doughWeight * 0.95);
      expect(total).toBeLessThan(recipe.sizes['12'].doughWeight * 1.05);
    });

    it('Neapolitan has no oil (oilPct is 0)', () => {
      const oil = findIngredient(dough, 'oil');
      expect(oil).toBeUndefined();
    });
  });

  // ── New York 14″ × 2 ──
  describe('New York 14″ × 2', () => {
    const recipe = PIZZA_RECIPES['new-york'];
    const dough = calculateDough(recipe, 2, '14');

    it('total weight approximately equals 2× doughWeight', () => {
      const total = dough.reduce((sum, d) => sum + d.amount, 0);
      const expected = recipe.sizes['14'].doughWeight * 2;
      expect(total).toBeGreaterThan(expected * 0.95);
      expect(total).toBeLessThan(expected * 1.05);
    });

    it('includes oil (NY has oil)', () => {
      const oil = findIngredient(dough, 'oil');
      expect(oil).toBeDefined();
      expect(oil.amount).toBeGreaterThan(0);
    });

    it('includes sugar (NY has sugar)', () => {
      const sugar = findIngredient(dough, 'sugar');
      expect(sugar).toBeDefined();
      expect(sugar.amount).toBeGreaterThan(0);
    });
  });

  // ── Grandma quarter-sheet × 1 ──
  describe('Grandma quarter-sheet × 1', () => {
    const recipe = PIZZA_RECIPES.grandma;
    const dough = calculateDough(recipe, 1, 'quarter');

    it('total weight approximately equals quarter-sheet doughWeight', () => {
      const total = dough.reduce((sum, d) => sum + d.amount, 0);
      const expected = recipe.sizes.quarter.doughWeight;
      expect(total).toBeGreaterThan(expected * 0.95);
      expect(total).toBeLessThan(expected * 1.05);
    });

    it('includes oil (Grandma has high oil)', () => {
      const oil = findIngredient(dough, 'oil');
      expect(oil).toBeDefined();
      expect(oil.pct).toBe(round1(recipe.oilPct * 100));
    });
  });

  // ── Edge case: 0 pizzas ──
  describe('0 pizzas', () => {
    const recipe = PIZZA_RECIPES.neapolitan;
    const dough = calculateDough(recipe, 0, '12');

    it('returns array (not error)', () => {
      expect(Array.isArray(dough)).toBe(true);
      expect(dough.length).toBeGreaterThanOrEqual(3);
    });

    it('all amounts are 0, not NaN', () => {
      for (const d of dough) {
        expect(d.amount).toBe(0);
        expect(Number.isNaN(d.amount)).toBe(false);
      }
    });

    it('percentages are still valid numbers', () => {
      for (const d of dough) {
        expect(Number.isNaN(d.pct)).toBe(false);
      }
    });
  });
});

// ══════════════════════════════════════════════════════
// Dough scaling — 1× vs 4×
// ══════════════════════════════════════════════════════

describe('dough scaling', () => {
  const recipe = PIZZA_RECIPES.neapolitan;
  const dough1 = calculateDough(recipe, 1, '12');
  const dough4 = calculateDough(recipe, 4, '12');

  it('4 pizzas produces exactly 4× the ingredient weights', () => {
    for (let i = 0; i < dough1.length; i++) {
      const single = dough1[i].amount;
      const quad = dough4[i].amount;
      // Rounding can cause ±1g difference at most
      expect(Math.abs(quad - single * 4)).toBeLessThanOrEqual(1);
    }
  });

  it('baker percentages remain the same regardless of scale', () => {
    for (let i = 0; i < dough1.length; i++) {
      expect(dough1[i].pct).toBe(dough4[i].pct);
    }
  });

  it('ingredient order is the same', () => {
    for (let i = 0; i < dough1.length; i++) {
      expect(dough1[i].ingredient).toBe(dough4[i].ingredient);
    }
  });
});

// ══════════════════════════════════════════════════════
// Sauce & toppings
// ══════════════════════════════════════════════════════

describe('calculateSauce', () => {
  it('returns ingredients for round pizza', () => {
    const sauce = calculateSauce(PIZZA_RECIPES.neapolitan, 1, '12');
    expect(Array.isArray(sauce)).toBe(true);
    expect(sauce.length).toBeGreaterThan(0);
    for (const s of sauce) {
      expect(s.ingredient).toBeDefined();
      expect(typeof s.amount).toBe('number');
      expect(Number.isNaN(s.amount)).toBe(false);
    }
  });

  it('returns ingredients for sheet pizza', () => {
    const sauce = calculateSauce(PIZZA_RECIPES.grandma, 1, 'quarter');
    expect(Array.isArray(sauce)).toBe(true);
    for (const s of sauce) {
      expect(s.amount).toBeGreaterThan(0);
    }
  });
});

describe('calculateToppings', () => {
  it('returns ingredients for round pizza', () => {
    const toppings = calculateToppings(PIZZA_RECIPES['new-york'], 2, '14');
    expect(Array.isArray(toppings)).toBe(true);
    for (const t of toppings) {
      expect(typeof t.amount).toBe('number');
      expect(Number.isNaN(t.amount)).toBe(false);
    }
  });
});

// ══════════════════════════════════════════════════════
// getBakingInfo
// ══════════════════════════════════════════════════════

describe('getBakingInfo', () => {
  const recipe = PIZZA_RECIPES.neapolitan;

  it('returns optimal at high temp', () => {
    const info = getBakingInfo(recipe, 900);
    expect(info.tempCategory).toBe('optimal');
    expect(info.bakeTime).toBe(recipe.bakeTime.hot);
  });

  it('returns moderate at medium temp', () => {
    const info = getBakingInfo(recipe, 750);
    expect(info.tempCategory).toBe('moderate');
    expect(info.bakeTime).toBe(recipe.bakeTime.medium);
  });

  it('returns low at low temp', () => {
    const info = getBakingInfo(recipe, 500);
    expect(info.tempCategory).toBe('low');
    expect(info.bakeTime).toBe(recipe.bakeTime.low);
  });

  it('recommendedTemp is clamped to idealTemp.max', () => {
    const info = getBakingInfo(recipe, 1200);
    expect(info.recommendedTemp).toBe(recipe.idealTemp.max);
  });
});
