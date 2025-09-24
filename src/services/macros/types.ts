// src/services/macros/types.ts
// Type definitions for macro engine

export type PolicyVersion = string;

export interface ActivityLevelInfo {
  factor: number;
  summary: string;
}

export interface GoalProfileFixedSubtract {
  type: 'fixed_kcal_subtract';
  range_kcal: [number, number];
  defaults: {
    female: number;
    male: number;
  };
  notes: string;
}

export interface GoalProfilePercent {
  type: 'percent_of_tdee';
  range: [number, number];
  default: number;
}

export interface GoalProfileCyclic {
  type: 'cyclic';
  training_days: {
    percent_of_tdee: [number, number];
    default: number;
  };
  rest_days: {
    percent_of_tdee: [number, number];
    default: number;
  };
}

export type GoalProfile = GoalProfileFixedSubtract | GoalProfilePercent | GoalProfileCyclic;

export interface PolicyDefaults {
  policy_version: PolicyVersion;
  rounding: {
    grams: 'nearest_int';
    mg: 'nearest_int';
    kcal: 'nearest_int';
  };
  sex_other_policy: string;
}