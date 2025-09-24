// src/services/macros/engine.ts
// Macro Engine V0-V1: BMR → TDEE → kcal target → P/F/C/Fiber calculation

import { PolicyVersion } from './types';
import { ACTIVITY_FACTORS, GOAL_PROFILES, POLICY_DEFAULTS } from './config';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface UserProfile {
  sex: 'male' | 'female' | 'other';
  age_years: number;
  height: {
    value: number;
    unit: 'cm' | 'in';
  };
  weight: {
    value: number;
    unit: 'kg' | 'lb';
  };
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  unit_system_preference: 'metric' | 'imperial';
}

export type Goal = 'weight_loss' | 'maintenance' | 'muscle_gain' | 'body_recomposition';

export type Modifier = 'blood_sugar' | 'hormonal_support' | 'digestive_support';

export interface MacroTargets {
  kcal_target: number;
  protein_g: number;
  fat_g: number;
  carb_g: number;
  fiber_g: number;
  rationale: string[];
}

export interface CanonicalProfile {
  sex: 'male' | 'female' | 'other';
  age_years: number;
  height_cm: number;
  weight_kg: number;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  bmi: number;
}

// ============================================================================
// UNIT CONVERSION UTILITIES
// ============================================================================

function convertToCanonical(profile: UserProfile): CanonicalProfile {
  let height_cm = profile.height.value;
  if (profile.height.unit === 'in') {
    height_cm = profile.height.value * 2.54;
  }

  let weight_kg = profile.weight.value;
  if (profile.weight.unit === 'lb') {
    weight_kg = profile.weight.value * 0.45359237;
  }

  const bmi = weight_kg / Math.pow(height_cm / 100, 2);

  return {
    sex: profile.sex,
    age_years: profile.age_years,
    height_cm,
    weight_kg,
    activity_level: profile.activity_level,
    bmi
  };
}

// ============================================================================
// CORE CALCULATION FUNCTIONS
// ============================================================================

function calculateBMR(canonical: CanonicalProfile): number {
  const { sex, age_years, height_cm, weight_kg } = canonical;

  if (sex === 'male') {
    return 10 * weight_kg + 6.25 * height_cm - 5 * age_years + 5;
  } else if (sex === 'female') {
    return 10 * weight_kg + 6.25 * height_cm - 5 * age_years - 161;
  } else {
    // 'other' - use average of male/female constants
    const maleConstant = 5;
    const femaleConstant = -161;
    const avgConstant = (maleConstant + femaleConstant) / 2; // -78
    return 10 * weight_kg + 6.25 * height_cm - 5 * age_years + avgConstant;
  }
}

export function getActivityFactor(level: UserProfile['activity_level']): number {
  return ACTIVITY_FACTORS[level].factor;
}

function calculateTDEE(bmr: number, activityLevel: UserProfile['activity_level']): number {
  return bmr * getActivityFactor(activityLevel);
}

function calculateKcalTarget(
  tdee: number,
  goal: Goal,
  sex: 'male' | 'female' | 'other',
  rationale: string[]
): number {
  const goalProfile = GOAL_PROFILES[goal];

  switch (goalProfile.type) {
    case 'fixed_kcal_subtract': {
      const deficit = goalProfile.defaults[sex as 'male' | 'female'] || goalProfile.defaults.male;
      rationale.push(`Weight loss: ${deficit} kcal deficit for ${sex}`);
      return Math.round(tdee - deficit);
    }

    case 'percent_of_tdee': {
      const percent = goalProfile.default;
      const adjustment = tdee * percent;
      rationale.push(`${goal}: ${(percent * 100).toFixed(1)}% TDEE adjustment (${adjustment > 0 ? '+' : ''}${Math.round(adjustment)} kcal)`);
      return Math.round(tdee + adjustment);
    }

    case 'cyclic': {
      // For body recomposition, use training day as default
      const percent = goalProfile.training_days.default;
      const adjustment = tdee * percent;
      rationale.push(`Body recomposition (training day default): ${(percent * 100).toFixed(1)}% TDEE adjustment`);
      return Math.round(tdee + adjustment);
    }

    default:
      rationale.push(`Unknown goal type, using maintenance`);
      return Math.round(tdee);
  }
}

// Calculate Ideal Body Weight using Devine formula
function calculateIdealBodyWeight(height_cm: number, sex: 'male' | 'female' | 'other'): number {
  const height_inches = height_cm / 2.54;
  const inches_over_60 = height_inches - 60;

  if (sex === 'male') {
    return 50 + 2.3 * inches_over_60;
  } else if (sex === 'female') {
    return 45.5 + 2.3 * inches_over_60;
  } else {
    // Use average for 'other'
    return ((50 + 2.3 * inches_over_60) + (45.5 + 2.3 * inches_over_60)) / 2;
  }
}

// Calculate adjusted body weight for high BMI protein calculations
function getAdjustedBodyWeight(canonical: CanonicalProfile, rationale: string[]): number {
  if (canonical.bmi < 30) {
    return canonical.weight_kg;
  }

  const ibw = calculateIdealBodyWeight(canonical.height_cm, canonical.sex);
  const adjustedBW = ibw + 0.4 * (canonical.weight_kg - ibw);

  rationale.push(`High BMI (${canonical.bmi.toFixed(1)}): using adjusted BW (${adjustedBW.toFixed(1)}kg) for protein calculation`);
  return adjustedBW;
}

export function getProteinRangeForGoal(goal: Goal, bmi: number): [number, number] {
  if (goal === 'weight_loss' || bmi < 25) {
    return [1.8, 2.4]; // cutting_range for weight loss or lean individuals
  }
  return [1.4, 2.0]; // default_range for maintenance/muscle gain
}

function calculateProteinTarget(
  canonical: CanonicalProfile,
  goal: Goal,
  rationale: string[]
): number {
  const adjustedWeight = getAdjustedBodyWeight(canonical, rationale);
  const [minProtein, maxProtein] = getProteinRangeForGoal(goal, canonical.bmi);

  // Use middle of range as default
  const proteinPerKg = (minProtein + maxProtein) / 2;
  const proteinGrams = adjustedWeight * proteinPerKg;

  rationale.push(`Protein: ${proteinPerKg.toFixed(1)}g/kg × ${adjustedWeight.toFixed(1)}kg = ${proteinGrams.toFixed(1)}g`);

  return Math.round(proteinGrams);
}

function calculateFatTarget(
  kcalTarget: number,
  goal: Goal,
  rationale: string[]
): { fat_g: number; fat_kcal: number } {
  // Use cutting range for weight loss, default range otherwise
  const fatPercent = goal === 'weight_loss' ? 0.25 : 0.275; // middle of respective ranges

  const fatKcal = kcalTarget * fatPercent;
  const fatGrams = fatKcal / 9;

  rationale.push(`Fat: ${(fatPercent * 100).toFixed(1)}% of ${kcalTarget} kcal = ${fatKcal.toFixed(0)} kcal (${fatGrams.toFixed(1)}g)`);

  return {
    fat_g: Math.round(fatGrams),
    fat_kcal: fatKcal
  };
}

export function resolveConflicts(
  proteinG: number,
  fatPercent: number,
  kcalTarget: number,
  goal: Goal,
  rationale: string[]
): { protein_g: number; fat_g: number; carb_g: number; fat_kcal: number } {
  const proteinKcal = proteinG * 4;
  let fatKcal = kcalTarget * fatPercent;
  let fatG = Math.round(fatKcal / 9);
  let carbKcal = kcalTarget - (proteinKcal + fatKcal);

  // Conflict resolution as per spec
  if (carbKcal < 0) {
    rationale.push(`Conflict: Negative carb kcal (${carbKcal.toFixed(0)}), reducing fat to lower bound`);

    // Reduce fat to lower bound
    const lowerFatPercent = goal === 'weight_loss' ? 0.20 : 0.20;
    fatKcal = kcalTarget * lowerFatPercent;
    fatG = Math.round(fatKcal / 9);
    carbKcal = kcalTarget - (proteinKcal + fatKcal);

    if (carbKcal < 0) {
      rationale.push(`Still negative carbs (${carbKcal.toFixed(0)}), reducing protein to lower bound`);

      // Reduce protein to goal's lower bound
      const [minProtein] = getProteinRangeForGoal(goal, 25); // Use standard BMI for range
      // Use a reasonable reduced protein target based on kcal constraints
      const maxProteinKcal = kcalTarget * 0.4; // Max 40% from protein in crisis
      const minProteinG = Math.min(proteinG * 0.8, Math.round(maxProteinKcal / 4));
      const minProteinKcal = minProteinG * 4;

      carbKcal = kcalTarget - (minProteinKcal + fatKcal);

      if (carbKcal < 0) {
        rationale.push(`HARD WARNING: Still negative carbs after all reductions, clamping carbs to 0`);
        carbKcal = 0;
      }

      return {
        protein_g: minProteinG,
        fat_g: fatG,
        carb_g: Math.round(carbKcal / 4),
        fat_kcal: fatKcal
      };
    }
  }

  return {
    protein_g: proteinG,
    fat_g: fatG,
    carb_g: Math.round(carbKcal / 4),
    fat_kcal: fatKcal
  };
}

function calculateFiberTarget(kcalTarget: number): number {
  // Energy scaled rule: max(14 * (kcal_target/1000), 18)
  const energyScaled = 14 * (kcalTarget / 1000);
  const fiberTarget = Math.max(energyScaled, 18);
  return Math.round(fiberTarget);
}

// ============================================================================
// MAIN ENGINE FUNCTION
// ============================================================================

export function computeMacros(
  profile: UserProfile,
  goal: Goal,
  modifiers: Modifier[] = [],
  policyVersion: PolicyVersion = POLICY_DEFAULTS.policy_version
): MacroTargets {
  const rationale: string[] = [];

  // LLM_TASK: Review canonical conversion for edge cases
  const canonical = convertToCanonical(profile);
  rationale.push(`Canonical profile: ${canonical.weight_kg.toFixed(1)}kg, ${canonical.height_cm.toFixed(0)}cm, BMI ${canonical.bmi.toFixed(1)}`);

  // LLM_TASK: Verify BMR calculations match reference values
  const bmr = calculateBMR(canonical);
  rationale.push(`BMR (Mifflin-St Jeor): ${Math.round(bmr)} kcal/day`);

  const tdee = calculateTDEE(bmr, canonical.activity_level);
  rationale.push(`TDEE (${canonical.activity_level}): ${Math.round(tdee)} kcal/day`);

  const kcalTarget = calculateKcalTarget(tdee, goal, canonical.sex, rationale);

  const proteinG = calculateProteinTarget(canonical, goal, rationale);

  const fatResult = calculateFatTarget(kcalTarget, goal, rationale);

  // LLM_TASK: Test conflict resolution with edge case inputs
  const resolvedMacros = resolveConflicts(
    proteinG,
    goal === 'weight_loss' ? 0.25 : 0.275,
    kcalTarget,
    goal,
    rationale
  );

  const fiberG = calculateFiberTarget(kcalTarget);
  rationale.push(`Fiber: max(14 × ${(kcalTarget/1000).toFixed(1)}, 18) = ${fiberG}g`);

  // LLM_TASK: Validate final macro distribution adds up correctly
  const finalProteinKcal = resolvedMacros.protein_g * 4;
  const finalFatKcal = resolvedMacros.fat_g * 9;
  const finalCarbKcal = resolvedMacros.carb_g * 4;
  const totalKcal = finalProteinKcal + finalFatKcal + finalCarbKcal;

  rationale.push(`Final distribution: P${resolvedMacros.protein_g}g (${finalProteinKcal}kcal) + F${resolvedMacros.fat_g}g (${finalFatKcal}kcal) + C${resolvedMacros.carb_g}g (${finalCarbKcal}kcal) = ${totalKcal}kcal`);

  if (Math.abs(totalKcal - kcalTarget) > 10) {
    rationale.push(`WARNING: Total kcal (${totalKcal}) differs from target (${kcalTarget}) by ${Math.abs(totalKcal - kcalTarget)}kcal`);
  }

  return {
    kcal_target: kcalTarget,
    protein_g: resolvedMacros.protein_g,
    fat_g: resolvedMacros.fat_g,
    carb_g: resolvedMacros.carb_g,
    fiber_g: fiberG,
    rationale
  };
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export { ACTIVITY_FACTORS, GOAL_PROFILES, POLICY_DEFAULTS } from './config';
export type { PolicyVersion } from './types';