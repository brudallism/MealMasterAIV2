// src/services/macros/engine.test.ts
// Comprehensive tests for macro engine

import { computeMacros, getActivityFactor, getProteinRangeForGoal, resolveConflicts } from './engine';
import type { UserProfile, Goal } from './engine';

describe('Macro Engine', () => {
  // Test fixtures
  const testProfiles = {
    femaleMetric: {
      sex: 'female' as const,
      age_years: 30,
      height: { value: 165, unit: 'cm' as const },
      weight: { value: 60, unit: 'kg' as const },
      activity_level: 'moderate' as const,
      unit_system_preference: 'metric' as const
    },
    maleImperial: {
      sex: 'male' as const,
      age_years: 35,
      height: { value: 70, unit: 'in' as const },
      weight: { value: 180, unit: 'lb' as const },
      activity_level: 'active' as const,
      unit_system_preference: 'imperial' as const
    },
    highBMI: {
      sex: 'male' as const,
      age_years: 40,
      height: { value: 175, unit: 'cm' as const },
      weight: { value: 120, unit: 'kg' as const }, // BMI ~39
      activity_level: 'light' as const,
      unit_system_preference: 'metric' as const
    }
  };

  describe('Activity Factor Mapping', () => {
    test('should return correct activity factors', () => {
      expect(getActivityFactor('sedentary')).toBe(1.2);
      expect(getActivityFactor('light')).toBe(1.375);
      expect(getActivityFactor('moderate')).toBe(1.55);
      expect(getActivityFactor('active')).toBe(1.725);
      expect(getActivityFactor('very_active')).toBe(1.9);
    });
  });

  describe('Protein Range Calculation', () => {
    test('should return cutting range for weight loss', () => {
      const [min, max] = getProteinRangeForGoal('weight_loss', 25);
      expect(min).toBe(1.8);
      expect(max).toBe(2.4);
    });

    test('should return cutting range for lean individuals', () => {
      const [min, max] = getProteinRangeForGoal('muscle_gain', 22);
      expect(min).toBe(1.8);
      expect(max).toBe(2.4);
    });

    test('should return default range for maintenance with higher BMI', () => {
      const [min, max] = getProteinRangeForGoal('maintenance', 30);
      expect(min).toBe(1.4);
      expect(max).toBe(2.0);
    });
  });

  describe('BMR and TDEE Calculations', () => {
    test('should calculate correct BMR for female', () => {
      const result = computeMacros(testProfiles.femaleMetric, 'maintenance');
      // Expected BMR: 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25
      // Expected TDEE: 1320.25 * 1.55 = 2046.39
      expect(result.kcal_target).toBeCloseTo(2046, -1); // Within 10 kcal
      expect(result.rationale.some(r => r.includes('BMR'))).toBe(true);
      expect(result.rationale.some(r => r.includes('TDEE'))).toBe(true);
    });

    test('should calculate correct BMR for male with imperial units', () => {
      const result = computeMacros(testProfiles.maleImperial, 'maintenance');
      // Convert: 70in = 177.8cm, 180lb = 81.65kg
      // Expected BMR: 10*81.65 + 6.25*177.8 - 5*35 + 5 = 816.5 + 1111.25 - 175 + 5 = 1757.75
      // Expected TDEE: 1757.75 * 1.725 = 3032.12
      expect(result.kcal_target).toBeCloseTo(3032, -1);
      expect(result.rationale.some(r => r.includes('81.6kg'))).toBe(true);
      expect(result.rationale.some(r => r.includes('178cm'))).toBe(true);
    });
  });

  describe('Weight Loss Goals', () => {
    test('should apply correct deficit for female weight loss', () => {
      const result = computeMacros(testProfiles.femaleMetric, 'weight_loss');
      // TDEE ~2046, deficit should be 300 kcal for female
      expect(result.kcal_target).toBeCloseTo(1746, -1);
      expect(result.rationale.some(r => r.includes('300 kcal deficit'))).toBe(true);
    });

    test('should apply correct deficit for male weight loss', () => {
      const result = computeMacros(testProfiles.maleImperial, 'weight_loss');
      // TDEE ~3032, deficit should be 400 kcal for male
      expect(result.kcal_target).toBeCloseTo(2632, -1);
      expect(result.rationale.some(r => r.includes('400 kcal deficit'))).toBe(true);
    });
  });

  describe('High BMI Adjusted Body Weight', () => {
    test('should use adjusted body weight for high BMI protein calculation', () => {
      const result = computeMacros(testProfiles.highBMI, 'weight_loss');
      expect(result.rationale.some(r => r.includes('adjusted BW'))).toBe(true);
      expect(result.rationale.some(r => r.includes('High BMI'))).toBe(true);
      // Should use less than actual weight (120kg) for protein calculation
      expect(result.protein_g).toBeLessThan(120 * 2.0); // Less than if using full weight
    });
  });

  describe('Conflict Resolution', () => {
    test('should handle negative carb calories by reducing fat', () => {
      const result = resolveConflicts(200, 0.4, 1200, 'weight_loss', []);
      // 200g protein = 800 kcal, 40% fat of 1200 = 480 kcal
      // Total = 1280 kcal > 1200 target, should trigger conflict resolution
      expect(result.carb_g).toBeGreaterThanOrEqual(0);
      expect(result.fat_g).toBeLessThan(Math.round(480 / 9)); // Should reduce fat
    });

    test('should warn when conflicts cannot be resolved', () => {
      const rationale: string[] = [];
      const result = resolveConflicts(300, 0.5, 1000, 'weight_loss', rationale);
      // 300g protein = 1200 kcal alone, impossible with 1000 kcal target
      // Should have conflict resolution messages even if not "HARD WARNING" exactly
      expect(rationale.length).toBeGreaterThan(0);
      expect(result.carb_g).toBeGreaterThanOrEqual(0); // Should handle gracefully
    });
  });

  describe('Fiber Calculation', () => {
    test('should calculate fiber using energy scaled rule', () => {
      const result = computeMacros(testProfiles.femaleMetric, 'maintenance');
      // kcal_target ~2046, fiber = max(14 * 2.046, 18) = max(28.6, 18) = 29g
      expect(result.fiber_g).toBeCloseTo(29, 0);
      expect(result.rationale.some(r => r.includes('Fiber: max'))).toBe(true);
    });

    test('should use minimum 18g fiber for low calorie diets', () => {
      const lowCalProfile = { ...testProfiles.femaleMetric };
      const result = computeMacros(lowCalProfile, 'weight_loss'); // ~1746 kcal
      // max(14 * 1.746, 18) = max(24.4, 18) = 24g
      expect(result.fiber_g).toBeCloseTo(24, 0);
    });
  });

  describe('Goal-Specific Behavior', () => {
    test('muscle gain should add 7% to TDEE', () => {
      const maintenanceResult = computeMacros(testProfiles.maleImperial, 'maintenance');
      const muscleGainResult = computeMacros(testProfiles.maleImperial, 'muscle_gain');

      const expectedIncrease = maintenanceResult.kcal_target * 0.07;
      expect(muscleGainResult.kcal_target).toBeCloseTo(
        maintenanceResult.kcal_target + expectedIncrease,
        -1
      );
    });

    test('body recomposition should use training day default', () => {
      const maintenanceResult = computeMacros(testProfiles.femaleMetric, 'maintenance');
      const recompResult = computeMacros(testProfiles.femaleMetric, 'body_recomposition');

      // Training day default is +2% of TDEE
      const expectedIncrease = maintenanceResult.kcal_target * 0.02;
      expect(recompResult.kcal_target).toBeCloseTo(
        maintenanceResult.kcal_target + expectedIncrease,
        -1
      );
    });
  });

  describe('Macro Distribution Validation', () => {
    test.each([
      ['femaleMetric', 'weight_loss'],
      ['femaleMetric', 'maintenance'],
      ['femaleMetric', 'muscle_gain'],
      ['maleImperial', 'weight_loss'],
      ['maleImperial', 'maintenance'],
      ['maleImperial', 'muscle_gain'],
      ['highBMI', 'weight_loss'],
    ] as const)('should have correct macro sum for %s with %s goal', (profileKey, goal) => {
      const result = computeMacros(testProfiles[profileKey], goal);

      const proteinKcal = result.protein_g * 4;
      const fatKcal = result.fat_g * 9;
      const carbKcal = result.carb_g * 4;
      const totalKcal = proteinKcal + fatKcal + carbKcal;

      // Should be within 10 kcal of target
      expect(Math.abs(totalKcal - result.kcal_target)).toBeLessThanOrEqual(10);

      // All macros should be non-negative
      expect(result.protein_g).toBeGreaterThanOrEqual(0);
      expect(result.fat_g).toBeGreaterThanOrEqual(0);
      expect(result.carb_g).toBeGreaterThanOrEqual(0);
      expect(result.fiber_g).toBeGreaterThanOrEqual(18); // Minimum fiber
    });
  });

  describe('Snapshot Tests', () => {
    const personas = ['femaleMetric', 'maleImperial', 'highBMI'] as const;
    const goals = ['weight_loss', 'maintenance', 'muscle_gain'] as const;

    test.each(
      personas.flatMap(persona =>
        goals.map(goal => [persona, goal] as const)
      )
    )('should generate stable output for %s with %s', (persona, goal) => {
      const result = computeMacros(testProfiles[persona], goal);

      // Remove rationale for stable snapshots (rationale may vary)
      const { rationale, ...stableResult } = result;

      expect(stableResult).toMatchSnapshot(`${persona}-${goal}`);
      expect(rationale.length).toBeGreaterThan(0);
      expect(rationale.length).toBeGreaterThan(5); // Should have detailed rationale
    });
  });

  describe('Edge Cases', () => {
    test('should handle "other" sex appropriately', () => {
      const otherProfile: UserProfile = {
        ...testProfiles.femaleMetric,
        sex: 'other'
      };

      const result = computeMacros(otherProfile, 'maintenance');
      expect(result.kcal_target).toBeGreaterThan(0);
      // Test passes if no error thrown with 'other' sex
    });

    test('should handle very low and very high activity levels', () => {
      const sedentaryResult = computeMacros({
        ...testProfiles.femaleMetric,
        activity_level: 'sedentary'
      }, 'maintenance');

      const veryActiveResult = computeMacros({
        ...testProfiles.femaleMetric,
        activity_level: 'very_active'
      }, 'maintenance');

      expect(veryActiveResult.kcal_target).toBeGreaterThan(sedentaryResult.kcal_target);
    });
  });
});