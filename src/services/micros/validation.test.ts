// src/services/micros/validation.test.ts
// Validation tests against published RDA/AI/UL values from authoritative sources

import { computeMicros, type MicronutrientProfile, type PrimaryGoal, type Modifier } from './engine';

describe('RDA Table Validation Against Published Sources', () => {
  // Test profiles representing key demographics
  const testProfiles = {
    malePrimeAge: {
      sex: 'male' as const,
      age_years: 25,
      height_cm: 178,
      weight_kg: 75,
      life_stage: '19-30' as const,
      activity_level: 'moderate' as const
    },
    femaleReproductiveAge: {
      sex: 'female' as const,
      age_years: 30,
      height_cm: 165,
      weight_kg: 65,
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
    seniorFemale: {
      sex: 'female' as const,
      age_years: 75,
      height_cm: 160,
      weight_kg: 60,
      life_stage: '71+' as const,
      activity_level: 'light' as const
    }
  };

  describe('Key Minerals - IOM DRI 2019-2020', () => {
    test('Calcium RDA values match published standards', () => {
      // Source: IOM. Dietary Reference Intakes for Calcium, Phosphorus, Magnesium, Vitamin D, and Fluoride (1997)
      const malePrime = computeMicros(testProfiles.malePrimeAge, 2000, 'maintenance', []);
      const femalePrime = computeMicros(testProfiles.femaleReproductiveAge, 2000, 'maintenance', []);
      const seniorFemale = computeMicros(testProfiles.seniorFemale, 1800, 'maintenance', []);

      const maleCalcium = malePrime.find(n => n.id === 1087);
      const femaleCalcium = femalePrime.find(n => n.id === 1087);
      const seniorCalcium = seniorFemale.find(n => n.id === 1087);

      // Validate RDA targets
      expect(maleCalcium!.target).toBe(1000); // Male 19-30: 1000mg
      expect(femaleCalcium!.target).toBe(1000); // Female 19-30: 1000mg
      expect(seniorCalcium!.target).toBe(1200); // Female 71+: 1200mg

      // Validate UL values
      expect(maleCalcium!.max).toBe(2500); // UL 19-50: 2500mg
      expect(seniorCalcium!.max).toBe(2000); // UL 71+: 2000mg
    });

    test('Iron RDA values reflect sex-specific needs', () => {
      // Source: IOM. Dietary Reference Intakes for Vitamin A, Vitamin K, Arsenic, Boron, Chromium, Copper, Iodine, Iron, Manganese, Molybdenum, Nickel, Silicon, Vanadium, and Zinc (2001)
      const malePrime = computeMicros(testProfiles.malePrimeAge, 2000, 'maintenance', []);
      const femalePrime = computeMicros(testProfiles.femaleReproductiveAge, 2000, 'maintenance', []);
      const seniorFemale = computeMicros(testProfiles.seniorFemale, 1800, 'maintenance', []);

      const maleIron = malePrime.find(n => n.id === 1089);
      const femaleIron = femalePrime.find(n => n.id === 1089);
      const seniorIron = seniorFemale.find(n => n.id === 1089);

      // Validate sex-specific differences
      expect(maleIron!.target).toBe(8); // Male adult: 8mg
      expect(femaleIron!.target).toBe(18); // Female reproductive age: 18mg (menstruation)
      expect(seniorIron!.target).toBe(8); // Female post-menopausal: 8mg

      // UL consistent across demographics
      expect(maleIron!.max).toBe(45);
      expect(femaleIron!.max).toBe(45);
      expect(seniorIron!.max).toBe(45);
    });

    test('Magnesium RDA shows age and sex variations', () => {
      const malePrime = computeMicros(testProfiles.malePrimeAge, 2000, 'maintenance', []);
      const maleMiddleAge = computeMicros(testProfiles.maleMiddleAge, 2200, 'maintenance', []);
      const femalePrime = computeMicros(testProfiles.femaleReproductiveAge, 2000, 'maintenance', []);

      const malePrimeMg = malePrime.find(n => n.id === 1090);
      const maleMiddleMg = maleMiddleAge.find(n => n.id === 1090);
      const femaleMg = femalePrime.find(n => n.id === 1090);

      console.log('DEBUG - malePrimeMg:', JSON.stringify(malePrimeMg, null, 2));

      // Validate age-related increases for males
      expect(malePrimeMg!.target).toBe(400); // Male 19-30: 400mg
      expect(maleMiddleMg!.target).toBe(420); // Male 31-50: 420mg

      // Validate sex differences
      expect(femaleMg!.target).toBe(310); // Female 19-30: 310mg

      // UL is same for supplements only
      expect(malePrimeMg!.max).toBe(350);
      expect(femaleMg!.max).toBe(350);
    });

    test('Potassium AI values are appropriate', () => {
      const malePrime = computeMicros(testProfiles.malePrimeAge, 2000, 'maintenance', []);
      const femalePrime = computeMicros(testProfiles.femaleReproductiveAge, 2000, 'maintenance', []);

      const malePotassium = malePrime.find(n => n.id === 1092);
      const femalePotassium = femalePrime.find(n => n.id === 1092);

      // AI values by sex
      expect(malePotassium!.target).toBe(3400); // Male: 3400mg
      expect(femalePotassium!.target).toBe(2600); // Female: 2600mg

      // No UL established
      expect(malePotassium!.max).toBeNull();
      expect(femalePotassium!.max).toBeNull();
    });
  });

  describe('Key Vitamins - IOM DRI Series', () => {
    test('Vitamin C RDA shows sex differences', () => {
      // Source: IOM. Dietary Reference Intakes for Vitamin C, Vitamin E, Selenium, and Carotenoids (2000)
      const malePrime = computeMicros(testProfiles.malePrimeAge, 2000, 'maintenance', []);
      const femalePrime = computeMicros(testProfiles.femaleReproductiveAge, 2000, 'maintenance', []);

      const maleVitC = malePrime.find(n => n.id === 1162);
      const femaleVitC = femalePrime.find(n => n.id === 1162);

      expect(maleVitC!.target).toBe(90); // Male: 90mg
      expect(femaleVitC!.target).toBe(75); // Female: 75mg

      // Same UL
      expect(maleVitC!.max).toBe(2000);
      expect(femaleVitC!.max).toBe(2000);
    });

    test('Vitamin D RDA increases with age', () => {
      const malePrime = computeMicros(testProfiles.malePrimeAge, 2000, 'maintenance', []);
      const seniorFemale = computeMicros(testProfiles.seniorFemale, 1800, 'maintenance', []);

      const primeVitD = malePrime.find(n => n.id === 1114);
      const seniorVitD = seniorFemale.find(n => n.id === 1114);

      expect(primeVitD!.target).toBe(15); // Adult 19-70: 15µg
      expect(seniorVitD!.target).toBe(20); // Adult 71+: 20µg

      // Same UL
      expect(primeVitD!.max).toBe(100);
      expect(seniorVitD!.max).toBe(100);
    });

    test('Folate RDA and UL are consistent', () => {
      const malePrime = computeMicros(testProfiles.malePrimeAge, 2000, 'maintenance', []);
      const femalePrime = computeMicros(testProfiles.femaleReproductiveAge, 2000, 'maintenance', []);

      const maleFolate = malePrime.find(n => n.id === 1177);
      const femaleFolate = femalePrime.find(n => n.id === 1177);

      // Same RDA for adults
      expect(maleFolate!.target).toBe(400); // 400µg DFE
      expect(femaleFolate!.target).toBe(400);

      // UL applies to synthetic folic acid
      expect(maleFolate!.max).toBe(1000);
      expect(femaleFolate!.max).toBe(1000);
    });

    test('B-vitamin RDAs show sex variations', () => {
      const malePrime = computeMicros(testProfiles.malePrimeAge, 2000, 'maintenance', []);
      const femalePrime = computeMicros(testProfiles.femaleReproductiveAge, 2000, 'maintenance', []);

      // Niacin
      const maleNiacin = malePrime.find(n => n.id === 1167);
      const femaleNiacin = femalePrime.find(n => n.id === 1167);

      expect(maleNiacin!.target).toBe(16); // Male: 16mg
      expect(femaleNiacin!.target).toBe(14); // Female: 14mg

      // Same UL for nicotinic acid form
      expect(maleNiacin!.max).toBe(35);
      expect(femaleNiacin!.max).toBe(35);
    });
  });

  describe('Energy-Scaled Nutrients', () => {
    test('Fiber scaling follows 14g/1000kcal rule', () => {
      const lowCalorie = computeMicros(testProfiles.femaleReproductiveAge, 1500, 'maintenance', []);
      const moderateCalorie = computeMicros(testProfiles.malePrimeAge, 2000, 'maintenance', []);
      const highCalorie = computeMicros(testProfiles.maleMiddleAge, 2500, 'maintenance', []);

      const lowFiber = lowCalorie.find(n => n.id === 291);
      const moderateFiber = moderateCalorie.find(n => n.id === 291);
      const highFiber = highCalorie.find(n => n.id === 291);

      // Should scale with calories: 14g per 1000kcal, minimum 18g
      expect(lowFiber!.target).toBe(21); // 14 * (1500/1000) = 21g
      expect(moderateFiber!.target).toBe(28); // 14 * (2000/1000) = 28g
      expect(highFiber!.target).toBe(35); // 14 * (2500/1000) = 35g
    });

    test('Added sugars limit follows ≤10% kcal rule with blood sugar modifier', () => {
      const malePrime = computeMicros(testProfiles.malePrimeAge, 2000, 'maintenance', ['blood_sugar']);
      const maleMiddle = computeMicros(testProfiles.maleMiddleAge, 2200, 'maintenance', ['blood_sugar']);

      const sugarsPrime = malePrime.find(n => n.id === 1235);
      const sugarsMiddle = maleMiddle.find(n => n.id === 1235);

      // Should be ≤10% kcal: floor((kcal * 0.10) / 4) grams
      expect(sugarsPrime!.limit).toBe(50); // floor((2000 * 0.10) / 4) = 50g
      expect(sugarsMiddle!.limit).toBe(55); // floor((2200 * 0.10) / 4) = 55g
    });
  });

  describe('Safety Limits and Minimize Flags', () => {
    test('Minimize flags applied to cardiovascular risk nutrients', () => {
      const result = computeMicros(testProfiles.malePrimeAge, 2000, 'maintenance', []);

      const sodium = result.find(n => n.id === 1093);
      const addedSugars = result.find(n => n.id === 1235);
      const transFat = result.find(n => n.id === 1257);

      expect(sodium!.flags.minimize).toBe(true);
      expect(addedSugars!.flags.minimize).toBe(true);
      expect(transFat!.flags.minimize).toBe(true);

      // Trans fat should have zero target
      expect(transFat!.target).toBe(0);
      expect(transFat!.limit).toBe(0);
    });

    test('UL clamping prevents excessive targets', () => {
      // Test that targets don't exceed UL values
      const result = computeMicros(testProfiles.malePrimeAge, 2000, 'maintenance', []);

      result.forEach(nutrient => {
        if (nutrient.target && nutrient.max) {
          // Special case: Magnesium UL (350mg) applies only to supplements, not dietary intake
          if (nutrient.id === 1090) {
            // Magnesium RDA (400mg) can exceed supplement UL (350mg) for food sources
            expect(nutrient.target).toBe(400); // Verify correct RDA
            expect(nutrient.max).toBe(350); // Verify UL is preserved as max
          } else {
            expect(nutrient.target).toBeLessThanOrEqual(nutrient.max);
          }
        }
      });
    });

    test('Chronic Disease Risk Reduction values for sodium', () => {
      const result = computeMicros(testProfiles.malePrimeAge, 2000, 'maintenance', []);
      const sodium = result.find(n => n.id === 1093);

      // AI = 1500mg, CDRR = 2300mg
      expect(sodium!.target).toBe(1500); // AI value
      expect(sodium!.limit).toBe(2300); // CDRR limit
    });
  });

  describe('Age-Related Changes', () => {
    test('Vitamin B6 RDA increases with age', () => {
      const malePrime = computeMicros(testProfiles.malePrimeAge, 2000, 'maintenance', []);
      const maleMiddle = computeMicros(testProfiles.maleMiddleAge, 2200, 'maintenance', []);
      const seniorFemale = computeMicros(testProfiles.seniorFemale, 1800, 'maintenance', []);

      const primeB6 = malePrime.find(n => n.id === 1175);
      const middleB6 = maleMiddle.find(n => n.id === 1175);
      const seniorB6 = seniorFemale.find(n => n.id === 1175);

      expect(primeB6!.target).toBe(1); // 19-50: 1.3mg (rounded to 1)
      expect(middleB6!.target).toBe(1); // 31-50: 1.3mg (rounded to 1)
      expect(seniorB6!.target).toBe(2); // 51+: 1.7mg (rounded to 2)
    });

    test('Chromium AI decreases with age', () => {
      const malePrime = computeMicros(testProfiles.malePrimeAge, 2000, 'maintenance', []);
      const seniorFemale = computeMicros(testProfiles.seniorFemale, 1800, 'maintenance', []);

      const primeCr = malePrime.find(n => n.id === 1096);
      const seniorCr = seniorFemale.find(n => n.id === 1096);

      expect(primeCr!.target).toBe(35); // Male 19-50: 35µg
      expect(seniorCr!.target).toBe(20); // Female 51+: 20µg
    });
  });

  describe('Goal-Based Modifications', () => {
    test('Weight loss goal highlights fiber appropriately', () => {
      const weightLoss = computeMicros(testProfiles.femaleReproductiveAge, 1600, 'weight_loss', []);
      const maintenance = computeMicros(testProfiles.femaleReproductiveAge, 1900, 'maintenance', []);

      const wlFiber = weightLoss.find(n => n.id === 291);
      const maintFiber = maintenance.find(n => n.id === 291);

      expect(wlFiber!.flags.highlight).toBe(true);
      expect(maintFiber!.flags.highlight).toBe(false);

      // Rationale should mention satiety
      expect(wlFiber!.rationale.some(r => r.includes('Satiety'))).toBe(true);
    });

    test('Muscle gain goal highlights B-complex vitamins', () => {
      const muscleGain = computeMicros(testProfiles.malePrimeAge, 2400, 'muscle_gain', []);

      const b12 = muscleGain.find(n => n.id === 1178);
      const folate = muscleGain.find(n => n.id === 1177);

      expect(b12!.flags.highlight).toBe(true);
      expect(folate!.flags.highlight).toBe(true);

      // Rationale should mention energy metabolism
      expect(b12!.rationale.some(r => r.includes('Energy metabolism'))).toBe(true);
    });
  });

  describe('Data Integrity', () => {
    test('All nutrients have proper units', () => {
      const result = computeMicros(testProfiles.malePrimeAge, 2000, 'maintenance', []);

      result.forEach(nutrient => {
        expect(['g', 'mg', 'µg', 'kcal']).toContain(nutrient.unit);
        expect(nutrient.name).toBeTruthy();
        expect(nutrient.id).toBeGreaterThan(0);
      });
    });

    test('Rationale entries are informative', () => {
      const result = computeMicros(testProfiles.malePrimeAge, 2000, 'weight_loss', ['blood_sugar']);

      // Nutrients with overlays should have rationale
      const fiber = result.find(n => n.id === 291);
      const addedSugars = result.find(n => n.id === 1235);

      expect(fiber!.rationale.length).toBeGreaterThan(0);
      expect(addedSugars!.rationale.length).toBeGreaterThan(0);

      // Should include source attribution
      expect(fiber!.rationale.some(r => r.includes('weight_loss'))).toBe(true);
      expect(addedSugars!.rationale.some(r => r.includes('blood_sugar'))).toBe(true);
    });

    test('Comprehensive nutrient coverage matches tracked nutrients', () => {
      const result = computeMicros(testProfiles.malePrimeAge, 2000, 'maintenance', []);

      // Should have all tracked nutrients from spoonacular mapper
      const expectedNutrients = [
        208, 203, 204, 205, 291, 269, // Macros
        606, 1257, 1235, 601, // Fats/limits
        1093, 1092, 1087, 1091, 1090, 1089, 1095, // Major minerals
        1098, 1101, 1103, 1096, 1102, 1100, // Trace minerals
        1106, 1162, 1114, 1109, 1185, // Fat-soluble vitamins
        1165, 1166, 1167, 1175, 1177, 1178, 1170, 1176, 1194, // B-vitamins
        645, 646, 851, 855, // Fatty acids
        1057, 221 // Other
      ];

      const resultIds = result.map(n => n.id).sort((a, b) => a - b);
      const expectedIds = expectedNutrients.sort((a, b) => a - b);

      expect(resultIds).toEqual(expectedIds);
    });
  });
});