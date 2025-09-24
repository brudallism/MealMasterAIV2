# Macro Engine Technical Notes

## Overview

This document provides technical details about the macro calculation engine implementation, including formulas, conflict resolution logic, and rationale examples.

## Core Calculation Flow

```
User Profile Input → Unit Conversion → BMR → TDEE → Goal Adjustment → Macro Allocation → Conflict Resolution → Output
```

## Formulas

### BMR (Mifflin-St Jeor Equation)

**Male:**
```
BMR = 10 × weight_kg + 6.25 × height_cm - 5 × age_years + 5
```

**Female:**
```
BMR = 10 × weight_kg + 6.25 × height_cm - 5 × age_years - 161
```

**Other/Non-Binary:**
```
BMR = 10 × weight_kg + 6.25 × height_cm - 5 × age_years - 78
```
*Note: -78 is the average of male (+5) and female (-161) constants*

### TDEE (Total Daily Energy Expenditure)

```
TDEE = BMR × Activity_Factor
```

Activity factors:
- Sedentary: 1.2
- Light: 1.375
- Moderate: 1.55
- Active: 1.725
- Very Active: 1.9

### Calorie Target Calculation

**Weight Loss:**
```
Target = TDEE - Deficit
where Deficit = 300 (female) or 400 (male) kcal
```

**Maintenance:**
```
Target = TDEE × (1 + 0.0) = TDEE
```

**Muscle Gain:**
```
Target = TDEE × (1 + 0.07) = TDEE + 7%
```

**Body Recomposition:**
```
Training Days: Target = TDEE × (1 + 0.02) = TDEE + 2%
Rest Days: Target = TDEE × (1 - 0.12) = TDEE - 12%
```

### Protein Calculation

**Adjusted Body Weight (for BMI ≥ 30):**
```
IBW_male = 50 + 2.3 × (height_inches - 60)
IBW_female = 45.5 + 2.3 × (height_inches - 60)
IBW_other = (IBW_male + IBW_female) / 2

Adjusted_BW = IBW + 0.4 × (Actual_BW - IBW)
```

**Protein Target:**
```
Protein_g = Body_Weight × Protein_Rate
where Protein_Rate = 1.4-2.0g/kg (default) or 1.8-2.4g/kg (cutting)
```

### Fat Calculation

```
Fat_kcal = Calorie_Target × Fat_Percentage
Fat_g = Fat_kcal / 9

where Fat_Percentage = 0.275 (default) or 0.25 (weight loss)
```

### Carbohydrate Calculation

```
Protein_kcal = Protein_g × 4
Fat_kcal = Fat_g × 9
Carb_kcal = Calorie_Target - (Protein_kcal + Fat_kcal)
Carb_g = Carb_kcal / 4
```

### Fiber Calculation

```
Fiber_g = max(14 × (Calorie_Target / 1000), 18)
```

## Conflict Resolution Logic

When `Carb_kcal < 0` (protein + fat exceed calorie target):

### Step 1: Reduce Fat
```python
if carb_kcal < 0:
    fat_percent_min = 0.20  # Minimum 20% fat
    fat_kcal = calorie_target × fat_percent_min
    fat_g = fat_kcal / 9
    carb_kcal = calorie_target - (protein_kcal + fat_kcal)
```

### Step 2: Reduce Protein (if still negative)
```python
if carb_kcal < 0:
    max_protein_kcal = calorie_target × 0.4  # Max 40% from protein
    min_protein_g = min(original_protein_g × 0.8, max_protein_kcal / 4)
    protein_kcal = min_protein_g × 4
    carb_kcal = calorie_target - (protein_kcal + fat_kcal)
```

### Step 3: Emergency Clamp
```python
if carb_kcal < 0:
    carb_g = 0
    # Log warning about impossible macro distribution
```

## Unit Conversion

### Weight Conversion
```
kg = lb × 0.45359237
```

### Height Conversion
```
cm = inches × 2.54
```

### BMI Calculation
```
BMI = weight_kg / (height_m²)
where height_m = height_cm / 100
```

## Example Rationale Output

### Female, 30yo, 165cm, 60kg, Moderate Activity, Weight Loss

```
Input Processing:
- Canonical profile: 60.0kg, 165cm, BMI 22.0

BMR Calculation:
- BMR (Mifflin-St Jeor): 1320 kcal/day

TDEE Calculation:
- TDEE (moderate): 2046 kcal/day

Goal Adjustment:
- Weight loss: 300 kcal deficit for female
- Target: 1746 kcal/day

Protein Allocation:
- Weight loss range: 1.8-2.4g/kg
- Using middle range: 2.1g/kg
- Protein: 2.1g/kg × 60.0kg = 126g (504 kcal)

Fat Allocation:
- Weight loss fat %: 25%
- Fat: 25% of 1746 kcal = 437 kcal (49g)

Carbohydrate Allocation:
- Remaining: 1746 - 504 - 437 = 805 kcal
- Carbs: 805 kcal / 4 = 201g

Fiber Calculation:
- Fiber: max(14 × 1.746, 18) = max(24.4, 18) = 24g

Final Validation:
- Total: 504 + 437 + 805 = 1746 kcal ✓
- Distribution: 29% protein, 25% fat, 46% carbs
```

## Common Edge Cases

### High BMI Example
```
Male, 40yo, 175cm, 120kg (BMI 39.2)

Without Adjustment:
- Protein: 2.1g/kg × 120kg = 252g (1008 kcal) - Excessive!

With Adjustment:
- IBW: 50 + 2.3 × (69 - 60) = 70.7kg
- Adjusted BW: 70.7 + 0.4 × (120 - 70.7) = 90.4kg
- Protein: 2.1g/kg × 90.4kg = 190g (760 kcal) - Reasonable
```

### Extreme Conflict Example
```
Very high protein request with very low calories:
- Target: 1000 kcal
- Requested Protein: 300g (1200 kcal)

Resolution:
1. Fat to minimum: 1000 × 0.20 = 200 kcal
2. Protein reduction: max(1000 × 0.40 / 4) = 100g
3. Final: 100g protein, 22g fat, 95g carbs
```

### Sex "Other" Example
```
Other, 25yo, 170cm, 70kg

BMR Calculation:
- Male formula: 10×70 + 6.25×170 - 5×25 + 5 = 1642.5
- Female formula: 10×70 + 6.25×170 - 5×25 - 161 = 1476.5
- Average constant: (5 + (-161))/2 = -78
- Other formula: 10×70 + 6.25×170 - 5×25 - 78 = 1559.5
```

## Performance Considerations

- All calculations use integer arithmetic where possible
- BMR/TDEE calculations cached until profile changes
- Unit conversions performed once at input
- Conflict resolution short-circuits when possible

## Validation Checks

### Input Validation
- Age: 13-120 years
- Weight: 30-500 kg (66-1100 lbs)
- Height: 100-250 cm (39-98 inches)
- Activity level: Valid enum value

### Output Validation
- Calories: > 800 kcal/day
- Protein: 0.5-4.0 g/kg
- Fat: 10-60% of calories
- Carbs: ≥ 0g
- Fiber: ≥ 10g

### Safety Warnings
- Calorie target below 1000 (female) or 1200 (male)
- Protein above 3.0g/kg
- Fat below 15% of calories
- Impossible macro distribution (sum > target)