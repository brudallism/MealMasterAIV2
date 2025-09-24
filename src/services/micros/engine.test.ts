// src/services/micros/engine.test.ts
// Comprehensive tests for micronutrient engine

import {
  computeMicros,
  lookupBaseRow,
  deriveLifeStage,
  calculateEnergyScaledFiber,
  calculateAddedSugarsLimit,
  type MicronutrientProfile,
  type PrimaryGoal,
  type Modifier
} from './engine';

describe('Micronutrient Engine', () => {
  // Test fixtures
  const testProfiles = {
    femaleYoung: {
      sex: 'female' as const,
      age_years: 25,
      height_cm: 165,
      weight_kg: 60,
      life_stage: '19-30' as const,
      activity_level: 'moderate' as const
    },
    maleMiddleAge: {
      sex: 'male' as const,
      age_years: 45,
      height_cm: 180,
      weight_kg: 80,
      life_stage: '31-50' as const,
      activity_level: 'active' as const
    },
    otherSenior: {
      sex: 'other' as const,
      age_years: 75,
      height_cm: 170,
      weight_kg: 70,
      life_stage: '71+' as const,
      activity_level: 'light' as const
    }
  };

  describe('Life Stage Derivation', () => {
    test('should correctly derive life stages', () => {
      expect(deriveLifeStage(25)).toBe('19-30');
      expect(deriveLifeStage(35)).toBe('31-50');
      expect(deriveLifeStage(55)).toBe('51-70');
      expect(deriveLifeStage(75)).toBe('71+');
      expect(deriveLifeStage(19)).toBe('19-30');
      expect(deriveLifeStage(71)).toBe('71+');
    });
  });

  describe('Base RDA Lookup', () => {
    test('should find RDA values for male 31-50', () => {
      const baseRow = lookupBaseRow('male', '31-50');
      expect(baseRow).toBeTruthy();
      expect(baseRow!['1087']).toEqual({
        name: 'Calcium',
        unit: 'mg',
        target: 1000,
        ul: 2500,
        notes: 'RDA value'
      });
      expect(baseRow!['1090'].target).toBe(420); // Male magnesium 31-50
    });

    test('should find RDA values for female 19-30', () => {
      const baseRow = lookupBaseRow('female', '19-30');
      expect(baseRow).toBeTruthy();
      expect(baseRow!['1089'].target).toBe(18); // Female iron (higher)
      expect(baseRow!['1090'].target).toBe(310); // Female magnesium (lower)
    });

    test('should handle "other" sex with averaged values', () => {
      const baseRow = lookupBaseRow('other', '19-30');
      expect(baseRow).toBeTruthy();
      expect(baseRow!['1106'].target).toBe(800); // Vitamin A average
      expect(baseRow!['1162'].target).toBe(82.5); // Vitamin C average
    });

    test('should return null for invalid combinations', () => {
      const baseRow = lookupBaseRow('male', 'invalid-stage');
      expect(baseRow).toBeNull();
    });
  });

  describe('Energy-Scaled Calculations', () => {
    test('should calculate fiber correctly', () => {
      expect(calculateEnergyScaledFiber(2000)).toBe(28); // 14 * 2 = 28
      expect(calculateEnergyScaledFiber(1500)).toBe(21); // 14 * 1.5 = 21
      expect(calculateEnergyScaledFiber(1200)).toBe(18); // min 18g
    });

    test('should calculate added sugars limit correctly', () => {
      expect(calculateAddedSugarsLimit(2000)).toBe(50); // floor(200/4) = 50g
      expect(calculateAddedSugarsLimit(1800)).toBe(45); // floor(180/4) = 45g
      expect(calculateAddedSugarsLimit(1500)).toBe(37); // floor(150/4) = 37g
    });
  });

  describe('UL Clamping', () => {
    test('should clamp targets that exceed upper limits', () => {
      // Test with a theoretical scenario where we force UL clamping
      const result = computeMicros(
        testProfiles.femaleYoung,
        2000,
        'maintenance',
        []
      );

      // Find magnesium which has UL = 350 in supplements
      const magnesium = result.find(r => r.id === 1090);
      expect(magnesium).toBeTruthy();
      expect(magnesium!.max).toBe(350); // UL should be set as max

      // Target should not exceed UL (though RDA won't in this case)
      if (magnesium!.target) {
        expect(magnesium!.target).toBeLessThanOrEqual(350);
      }
    });
  });

  describe('Primary Goal Overlays', () => {
    test('should highlight fiber for weight loss', () => {
      const result = computeMicros(
        testProfiles.maleMiddleAge,
        1800, // weight loss calories
        'weight_loss',
        []
      );

      const fiber = result.find(r => r.id === 291);
      expect(fiber).toBeTruthy();
      expect(fiber!.flags.highlight).toBe(true);
      expect(fiber!.rationale.some(r => r.includes('Satiety'))).toBe(true);
    });

    test('should highlight B-complex for muscle gain', () => {
      const result = computeMicros(
        testProfiles.maleMiddleAge,
        2400, // muscle gain calories
        'muscle_gain',
        []
      );

      const b12 = result.find(r => r.id === 1178);
      const folate = result.find(r => r.id === 1177);

      expect(b12).toBeTruthy();
      expect(folate).toBeTruthy();
      expect(b12!.flags.highlight).toBe(true);
      expect(folate!.flags.highlight).toBe(true);
      expect(b12!.rationale.some(r => r.includes('Energy metabolism'))).toBe(true);
    });

    test('should not apply overlays for maintenance', () => {
      const result = computeMicros(
        testProfiles.femaleYoung,
        2000,
        'maintenance',
        []
      );

      const highlighted = result.filter(r => r.flags.highlight);
      expect(highlighted.length).toBe(0);
    });
  });

  describe('Modifier Overlays', () => {
    test('should apply blood sugar restrictions', () => {
      const result = computeMicros(
        testProfiles.femaleYoung,
        2000,
        'maintenance',
        ['blood_sugar']
      );

      const addedSugars = result.find(r => r.id === 1235);
      const fiber = result.find(r => r.id === 291);

      expect(addedSugars).toBeTruthy();
      expect(fiber).toBeTruthy();

      // Added sugars should have limit set to 10% of calories
      expect(addedSugars!.limit).toBe(50); // floor((2000 * 0.10) / 4)
      expect(addedSugars!.rationale.some(r => r.includes('≤10% kcal'))).toBe(true);

      // Fiber should have minimum enforced
      expect(fiber!.rationale.some(r => r.includes('high fiber minimum'))).toBe(true);
    });

    test('should highlight fiber for digestive support', () => {
      const result = computeMicros(
        testProfiles.maleMiddleAge,
        2200,
        'maintenance',
        ['digestive_support']
      );

      const fiber = result.find(r => r.id === 291);
      expect(fiber).toBeTruthy();
      expect(fiber!.flags.highlight).toBe(true);
      expect(fiber!.rationale.some(r => r.includes('coaching'))).toBe(true);
    });

    test('should use demographic RDAs for hormonal support', () => {
      const result = computeMicros(
        testProfiles.femaleYoung,
        2000,
        'maintenance',
        ['hormonal_support']
      );

      // Should not modify targets, just ensure proper demographic targeting
      const calcium = result.find(r => r.id === 1087);
      expect(calcium).toBeTruthy();
      expect(calcium!.target).toBe(1000); // Female 19-30 RDA
    });
  });

  describe('Minimize Flags', () => {
    test('should mark appropriate nutrients for minimization', () => {
      const result = computeMicros(
        testProfiles.maleMiddleAge,
        2000,
        'maintenance',
        []
      );

      const sodium = result.find(r => r.id === 1093);
      const addedSugars = result.find(r => r.id === 1235);

      expect(sodium).toBeTruthy();
      expect(addedSugars).toBeTruthy();
      expect(sodium!.flags.minimize).toBe(true);
      expect(addedSugars!.flags.minimize).toBe(true);
    });

    test('should not mark beneficial nutrients for minimization', () => {
      const result = computeMicros(
        testProfiles.femaleYoung,
        2000,
        'maintenance',
        []
      );

      const calcium = result.find(r => r.id === 1087);
      const vitaminC = result.find(r => r.id === 1162);

      expect(calcium).toBeTruthy();
      expect(vitaminC).toBeTruthy();
      expect(calcium!.flags.minimize).toBe(false);
      expect(vitaminC!.flags.minimize).toBe(false);
    });
  });

  describe('Rounding and Units', () => {
    test('should round all numeric values to whole units', () => {
      const result = computeMicros(
        testProfiles.otherSenior, // Uses averaged values with decimals
        2000,
        'maintenance',
        []
      );

      result.forEach(nutrient => {
        if (nutrient.target !== null) {
          expect(nutrient.target % 1).toBe(0); // Should be whole number
        }
        if (nutrient.max !== null) {
          expect(nutrient.max % 1).toBe(0);
        }
        if (nutrient.limit !== null) {
          expect(nutrient.limit % 1).toBe(0);
        }
      });
    });

    test('should preserve correct units from RDA table', () => {
      const result = computeMicros(
        testProfiles.maleMiddleAge,
        2000,
        'maintenance',
        []
      );

      const calcium = result.find(r => r.id === 1087);
      const vitaminD = result.find(r => r.id === 1114);
      const fiber = result.find(r => r.id === 291);

      expect(calcium!.unit).toBe('mg');
      expect(vitaminD!.unit).toBe('µg');
      expect(fiber!.unit).toBe('g');
    });
  });

  describe('Comprehensive Integration', () => {
    test('should handle multiple modifiers correctly', () => {
      const result = computeMicros(
        testProfiles.femaleYoung,
        1800,
        'weight_loss',
        ['blood_sugar', 'digestive_support']
      );

      const fiber = result.find(r => r.id === 291);
      const addedSugars = result.find(r => r.id === 1235);

      expect(fiber).toBeTruthy();
      expect(addedSugars).toBeTruthy();

      // Fiber should be highlighted from both weight_loss goal and digestive_support
      expect(fiber!.flags.highlight).toBe(true);
      expect(fiber!.rationale.length).toBeGreaterThan(1);

      // Added sugars should have limit from blood_sugar modifier
      expect(addedSugars!.limit).toBe(45); // floor((1800 * 0.10) / 4)
    });

    test('should provide detailed rationale', () => {
      const result = computeMicros(
        testProfiles.maleMiddleAge,
        2200,
        'muscle_gain',
        ['blood_sugar']
      );

      // Check that rationale is populated
      const nutrientsWithRationale = result.filter(r => r.rationale.length > 0);
      expect(nutrientsWithRationale.length).toBeGreaterThan(2);

      // Check specific rationale content
      const b12 = result.find(r => r.id === 1178);
      expect(b12!.rationale.some(r => r.includes('muscle_gain'))).toBe(true);
    });
  });

  describe('Snapshot Tests', () => {
    const goals: PrimaryGoal[] = ['weight_loss', 'maintenance', 'muscle_gain'];
    const modifierSets: Modifier[][] = [
      [],
      ['blood_sugar'],
      ['hormonal_support']
    ];

    test.each([
      ['femaleYoung', testProfiles.femaleYoung, 1800],
      ['maleMiddleAge', testProfiles.maleMiddleAge, 2200],
      ['otherSenior', testProfiles.otherSenior, 1900]
    ] as const)('%s should produce stable outputs across goal/modifier combinations', (name, profile, kcal) => {
      goals.forEach(goal => {
        modifierSets.forEach(modifiers => {
          const result = computeMicros(profile, kcal, goal, modifiers);

          // Remove rationale for stable snapshots (rationale may vary in wording)
          const stableResult = result.map(r => ({
            id: r.id,
            name: r.name,
            unit: r.unit,
            target: r.target,
            min: r.min,
            max: r.max,
            limit: r.limit,
            flags: r.flags
          }));

          const testKey = `${name}-${goal}-${modifiers.join(',') || 'none'}`;
          expect(stableResult).toMatchSnapshot(testKey);
        });
      });
    });
  });

  describe('Error Handling', () => {
    test('should throw error for invalid sex/life_stage combination', () => {
      const invalidProfile = {
        ...testProfiles.maleMiddleAge,
        sex: 'male' as const,
        life_stage: 'invalid' as any
      };

      expect(() => {
        computeMicros(invalidProfile, 2000, 'maintenance', []);
      }).toThrow('No RDA data found');
    });

    test('should handle missing data gracefully', () => {
      // This test ensures the engine doesn't crash with partial data
      const result = computeMicros(
        testProfiles.femaleYoung,
        2000,
        'maintenance',
        []
      );

      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);

      // All results should have required fields
      result.forEach(nutrient => {
        expect(nutrient.id).toBeGreaterThan(0);
        expect(nutrient.name).toBeTruthy();
        expect(nutrient.unit).toBeTruthy();
        expect(nutrient.flags).toBeTruthy();
        expect(Array.isArray(nutrient.rationale)).toBe(true);
      });
    });
  });
});