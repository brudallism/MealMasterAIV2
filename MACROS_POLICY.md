# Macro Engine Policy Documentation

## Policy Version: 1.0.0

This document defines the policy knobs, provenance, and defaults for the Meal Master macro calculation engine.

## Provenance and References

The macro calculation engine follows established nutritional science guidelines:

- **BMR Calculation**: Mifflin-St Jeor equation (most accurate for diverse populations)
- **Activity Factors**: Based on ACSM (American College of Sports Medicine) guidelines
- **Protein Requirements**: ISSN (International Society of Sports Nutrition) position stands
- **Fat Requirements**: DRI (Dietary Reference Intakes) recommendations
- **Fiber Requirements**: Energy-scaled approach based on DRI recommendations (14g per 1000 kcal)

## Activity Level Definitions

### Sedentary (1.2x)
- Little or no exercise
- Desk-based work
- <5,000 steps/day
- Minimal physical activity beyond activities of daily living

### Light (1.375x)
- Light exercise 1–3 days/week
- OR 5,000–7,000 steps/day
- Short exercise sessions (15-30 minutes)
- Occasional recreational activities

### Moderate (1.55x)
- Moderate exercise 3–5 days/week
- OR 7,000–10,000 steps/day
- 30–60 minutes moderate activity most days
- Regular recreational sports or gym attendance

### Active (1.725x)
- Hard exercise 6–7 days/week
- OR 10,000–14,000 steps/day
- ~60 minutes vigorous activity most days
- Structured training programs

### Very Active (1.9x)
- 5+ hours strenuous exercise/week
- High daily step count (≥14,000 steps)
- ~60 minutes intense OR 120 minutes moderate activity daily
- Athletic training or very physically demanding job

## Goal Profiles

### Weight Loss
- **Method**: Fixed calorie subtraction
- **Female Default**: -300 kcal/day (~0.6 lb/week loss)
- **Male Default**: -400 kcal/day (~0.8 lb/week loss)
- **Range**: 300-500 kcal deficit
- **Notes**: Conservative approach prioritizing sustainability over speed

### Maintenance
- **Method**: Percentage of TDEE
- **Default**: 0% adjustment (exact TDEE)
- **Range**: ±5% to account for metabolic variability
- **Notes**: Allows for natural weight fluctuations

### Muscle Gain
- **Method**: Percentage of TDEE
- **Default**: +7% (~100-200 kcal surplus)
- **Range**: 5-15% above TDEE
- **Notes**: Lean gains approach minimizing fat accumulation

### Body Recomposition (V1)
- **Method**: Cyclic approach
- **Training Days**: +2% TDEE (slight surplus)
- **Rest Days**: -12% TDEE (moderate deficit)
- **Notes**: Nutrient timing strategy for simultaneous fat loss and muscle gain

## Macro Distribution Policies

### Protein
- **Default Range**: 1.4-2.0g/kg body weight
- **Weight Loss Range**: 1.8-2.4g/kg body weight
- **High BMI Adjustment**: Uses adjusted body weight when BMI ≥30
  - Adjusted BW = IBW + 0.4 × (Actual BW - IBW)
  - Prevents excessive protein targets for obese individuals
- **Maximum**: 3.1g/kg (very lean, advanced athletes only)

### Fat
- **Default Range**: 20-35% of total calories
- **Weight Loss Range**: 20-30% of total calories
- **Minimum**: Never below 20% to ensure hormone production
- **Notes**: Higher end for hormone optimization, lower end for weight loss

### Carbohydrates
- **Calculation**: Remaining calories after protein and fat allocation
- **Minimum**: 0g (ketogenic diets supported)
- **Conflict Resolution**: Automatic adjustment when macros exceed calorie target

### Fiber
- **Formula**: max(14 × (kcal_target/1000), 18)
- **Minimum**: 18g/day (basic digestive health)
- **Energy Scaled**: 14g per 1000 kcal consumed
- **Maximum**: No upper limit enforced

## Rounding and Precision

- **Calories**: Nearest integer
- **Macros (g)**: Nearest integer
- **Micronutrients (mg)**: Nearest integer
- **Internal Calculations**: Full precision maintained until final output

## Sex-Specific Policies

### Male/Female
- Uses sex-specific BMR constants
- Sex-specific weight loss deficit defaults
- Sex-specific ideal body weight calculations

### Other/Non-Binary
- **BMR**: Uses average of male/female constants (-78 instead of +5/-161)
- **Weight Loss**: Uses male default (400 kcal deficit)
- **IBW**: Uses average of male/female formulas
- **Notes**: Conservative approach pending more research

## Conflict Resolution

When macro allocations exceed calorie target:

1. **First**: Reduce fat percentage to lower bound (20%)
2. **Second**: Reduce protein to 80% of original or maximum 40% of calories
3. **Last Resort**: Set carbohydrates to 0g and flag warning

## Unit System Support

- **Internal Storage**: Metric (kg, cm)
- **Input Support**: Both metric and imperial
- **Automatic Conversion**: lb→kg (×0.45359237), in→cm (×2.54)
- **User Display**: Respects user preference

## Recomputation Rules

- **Triggers**: Profile changes, goal changes, policy version updates
- **Frequency**: On-demand only (no automatic recalculation)
- **Caching**: Results cached until trigger conditions met
- **Persistence**: Computed targets stored in user settings

## Safety Guards

- **Minimum Calories**:
  - Female: 1000 kcal (after deficit application)
  - Male: 1200 kcal (after deficit application)
- **Maximum Deficit**: 500 kcal/day
- **Protein Maximum**: 3.1g/kg body weight
- **Fat Minimum**: 20% of calories

## Policy Versioning

Current version tracks:
- Formula changes
- Default value updates
- Safety guard modifications
- New goal type additions

Version format: MAJOR.MINOR.PATCH
- MAJOR: Breaking changes to calculation logic
- MINOR: New features or goal types
- PATCH: Bug fixes or minor adjustments