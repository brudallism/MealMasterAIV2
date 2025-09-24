// src/services/macros/__tests__/integration.test.ts
// Integration test for macro engine with user store

import { create } from 'zustand';
import { computeMacros } from '../engine';
import type { UserProfile, Goal } from '../engine';

describe('Macro Engine Integration', () => {
  test('should demonstrate end-to-end macro calculation', async () => {
    // Simulate a complete user profile from the Settings screen
    const profile: UserProfile = {
      sex: 'female',
      age_years: 28,
      height: { value: 165, unit: 'cm' },
      weight: { value: 60, unit: 'kg' },
      activity_level: 'moderate',
      unit_system_preference: 'metric'
    };

    const goal: Goal = 'weight_loss';

    // Calculate macros using the engine
    const result = computeMacros(profile, goal);

    // Verify calculation results
    expect(result.kcal_target).toBeGreaterThan(1400);
    expect(result.kcal_target).toBeLessThan(2000);
    expect(result.protein_g).toBeGreaterThan(100);
    expect(result.fat_g).toBeGreaterThan(30);
    expect(result.carb_g).toBeGreaterThan(50);
    expect(result.fiber_g).toBeGreaterThanOrEqual(18);

    // Verify rationale is detailed
    expect(result.rationale.length).toBeGreaterThan(5);
    expect(result.rationale.some(r => r.includes('BMR'))).toBe(true);
    expect(result.rationale.some(r => r.includes('TDEE'))).toBe(true);
    expect(result.rationale.some(r => r.includes('deficit'))).toBe(true);

    console.log('✅ Integration test results:', {
      calories: result.kcal_target,
      protein: `${result.protein_g}g`,
      fat: `${result.fat_g}g`,
      carbs: `${result.carb_g}g`,
      fiber: `${result.fiber_g}g`
    });

    console.log('📝 Calculation rationale:');
    result.rationale.forEach((reason, i) => {
      console.log(`   ${i + 1}. ${reason}`);
    });
  });

  test('should handle different goal types correctly', () => {
    const profile: UserProfile = {
      sex: 'male',
      age_years: 30,
      height: { value: 180, unit: 'cm' },
      weight: { value: 75, unit: 'kg' },
      activity_level: 'active',
      unit_system_preference: 'metric'
    };

    const maintenanceResult = computeMacros(profile, 'maintenance');
    const muscleGainResult = computeMacros(profile, 'muscle_gain');
    const weightLossResult = computeMacros(profile, 'weight_loss');

    // Verify goal-specific behavior
    expect(muscleGainResult.kcal_target).toBeGreaterThan(maintenanceResult.kcal_target);
    expect(weightLossResult.kcal_target).toBeLessThan(maintenanceResult.kcal_target);

    // Weight loss should have higher or equal protein (due to higher protein/kg rate)
    expect(weightLossResult.protein_g).toBeGreaterThanOrEqual(maintenanceResult.protein_g);

    console.log('🎯 Goal comparison:', {
      maintenance: maintenanceResult.kcal_target,
      muscle_gain: muscleGainResult.kcal_target,
      weight_loss: weightLossResult.kcal_target
    });
  });

  test('should work with imperial units', () => {
    const imperialProfile: UserProfile = {
      sex: 'female',
      age_years: 25,
      height: { value: 65, unit: 'in' }, // 5'5"
      weight: { value: 140, unit: 'lb' },
      activity_level: 'moderate',
      unit_system_preference: 'imperial'
    };

    const result = computeMacros(imperialProfile, 'maintenance');

    expect(result.kcal_target).toBeGreaterThan(1600);
    expect(result.kcal_target).toBeLessThan(2200);
    expect(result.rationale.some(r => r.includes('63.5kg'))).toBe(true); // Converted weight
    expect(result.rationale.some(r => r.includes('165cm'))).toBe(true); // Converted height

    console.log('🇺🇸 Imperial unit test:', {
      input: '140 lbs, 65 inches',
      calories: result.kcal_target,
      rationale_sample: result.rationale[0]
    });
  });
});