// src/services/macros/config.ts
// Configuration data for macro engine

import { ActivityLevelInfo, GoalProfile, PolicyDefaults } from './types';

export const ACTIVITY_FACTORS: Record<string, ActivityLevelInfo> = {
  sedentary: {
    factor: 1.2,
    summary: "Little or no exercise; desk-based; <5k steps/day."
  },
  light: {
    factor: 1.375,
    summary: "Light exercise 1–3 days/week OR 5–7k steps/day; short sessions."
  },
  moderate: {
    factor: 1.55,
    summary: "Moderate exercise 3–5 days/week OR 7–10k steps/day; ~30–60 min moderate/day."
  },
  active: {
    factor: 1.725,
    summary: "Hard exercise 6–7 days/week OR 10–14k steps/day; ~60 min vigorous most days."
  },
  very_active: {
    factor: 1.9,
    summary: "5+ hrs strenuous/week + high steps; ≈60 min intense or 120 min moderate activity daily."
  }
};

export const GOAL_PROFILES: Record<string, GoalProfile> = {
  weight_loss: {
    type: 'fixed_kcal_subtract',
    range_kcal: [300, 500],
    defaults: {
      female: 300,
      male: 400
    },
    notes: "For high BMI, bias toward upper end (e.g., 400–500) if safe; clamp to [300,500]."
  },
  maintenance: {
    type: 'percent_of_tdee',
    range: [-0.05, 0.05],
    default: 0.0
  },
  muscle_gain: {
    type: 'percent_of_tdee',
    range: [0.05, 0.15],
    default: 0.07
  },
  body_recomposition: {
    type: 'cyclic',
    training_days: {
      percent_of_tdee: [0.0, 0.05],
      default: 0.02
    },
    rest_days: {
      percent_of_tdee: [-0.15, -0.10],
      default: -0.12
    }
  }
};

export const POLICY_DEFAULTS: PolicyDefaults = {
  policy_version: '1.0.0',
  rounding: {
    grams: 'nearest_int',
    mg: 'nearest_int',
    kcal: 'nearest_int'
  },
  sex_other_policy: 'sex-neutral or user-chosen baseline'
};