# Micronutrient Engine Policy Documentation (V2.0)

## Overview

The micronutrient engine implements science-based RDA (Recommended Dietary Allowance), AI (Adequate Intake), and UL (Tolerable Upper Intake Level) targets using the US DRI 2019-2020 guidelines. This comprehensive system now covers **40+ essential nutrients** across all tracked macronutrients, minerals, vitamins, and specialized compounds.

## Version Information

- **Policy Version**: 2.0.0
- **Engine Version**: V2.0 - Comprehensive Coverage
- **Data Sources**:
  - US DRI 2019-2020 (IOM/NASEM)
  - NIH Office of Dietary Supplements Fact Sheets
  - Dietary Guidelines for Americans 2020-2025
- **Nutrient Coverage**: 40+ nutrients (expanded from 13)
- **Last Updated**: 2025-09-24

## Core Principles

### 1. Demographics-First Approach
- All targets are based on **sex** and **life_stage** combinations
- Life stages: 19-30, 31-50, 51-70, 71+ years
- Sex categories: male, female, other (averaged values)
- Age auto-derives life_stage if not explicitly provided

### 2. Energy-Scaled Nutrients
- **Fiber**: 14g per 1000 kcal, minimum 18g total
- **Added Sugars**: ≤10% of total calories (limit, not target)

### 3. Goal-Based Overlays
Applied based on primary goal selection:

#### Weight Loss
- **Fiber highlighting**: Enhanced focus on satiety and glycemic control

#### Muscle Gain
- **B-complex highlighting**: B12 (1178) and Folate (1177) for energy metabolism support

#### Maintenance & Body Recomposition
- No overlays applied (uses base RDA/AI values)

### 4. Modifier Overlays
Applied based on health/lifestyle modifiers:

#### Blood Sugar Management
- **Added sugars limit**: Enforced at ≤10% kcal via formula
- **Fiber minimum**: Maintains high fiber enforcement
- **UX hint**: Even carb distribution across meals

#### Hormonal Support
- **Demographic targeting**: Uses appropriate life stage RDAs without modifications
- **Macro dependency**: Ensures fat ≥25-30% kcal (handled in macro engine)

#### Digestive Support
- **Fiber highlighting**: Coaching-based titration approach

## Calculation Pipeline

### Step 1: Base RDA Lookup
```typescript
lookupBaseRow(sex: 'male' | 'female' | 'other', life_stage: string)
```
- Retrieves RDA/AI/UL values by demographic
- Handles "other" sex with averaged male/female values where available

### Step 2: Energy Scaling
- **Fiber target**: `max(14 * (kcal_target/1000), 18)` rounded to whole grams
- Applied regardless of base RDA table values

### Step 3: Primary Goal Overlays
- Applied based on goal type selection
- Adds highlight flags and rationale entries
- Supports both individual nutrients and nutrient groups

### Step 4: Modifier Overlays
- Applied for each active modifier
- Can modify limits, enforce minimums, or add highlights
- Multiple modifiers combine additively

### Step 5: Safety Pass
- **UL Clamping**: Targets exceeding UL are clamped to UL value
  - **Special Case**: Magnesium UL (350mg) applies only to supplements, not dietary intake
  - Food-based magnesium RDA (400mg) can exceed supplement UL safely
- **Trans Fat Enforcement**: Target and limit both set to 0g (minimize intake)
- **Rationale logging**: All adjustments recorded with source attribution

### Step 6: Minimize Flags
Applied to nutrients that should be minimized for cardiovascular health:
- **Trans fatty acids (1257)** - HIGH priority (target/limit = 0g)
- **Sodium (1093)** - HIGH priority (CDRR limit = 2300mg)
- **Added sugars (1235)** - HIGH priority (≤10% kcal limit)
- **Saturated fat (1258)** - MEDIUM priority
- **Cholesterol (1253)** - MEDIUM priority

## Output Format

Each nutrient returns as `MicronutrientRow`:

```typescript
{
  id: number;           // USDA nutrient ID
  name: string;         // Nutrient name
  unit: string;         // 'g' | 'mg' | 'µg' | 'kcal' | 'IU'
  target: number | null;  // RDA/AI target (rounded to whole units)
  min: number | null;     // Not used in V0-V1
  max: number | null;     // UL value (rounded to whole units)
  limit: number | null;   // Upper limit for minimization nutrients
  flags: {
    minimize: boolean;    // Should be minimized
    highlight: boolean;   // Should be emphasized in UI
  };
  rationale: string[];    // Explanation of all applied adjustments
}
```

## Recomputation Policy

The micronutrient engine should only recalculate when:
1. **Profile changes**: age, sex, height, weight, activity level
2. **Goal changes**: primary goal or modifier selection
3. **Policy updates**: engine version or data table updates

UI renders and navigation should NOT trigger recalculation.

## Nutrient Coverage (V2.0)

### Complete Macronutrient Profile
- **Energy**: Calories (208) - calculated by macro engine
- **Protein**: Total (203) - calculated by macro engine
- **Carbohydrates**: Total (205), Fiber (291), Added Sugars (1235)
- **Fats**: Total (204), Saturated (1258), Trans (1257)

### Essential Minerals (15 nutrients)
- **Major minerals**: Calcium (1087), Magnesium (1090), Potassium (1092), Sodium (1093), Phosphorus (1091)
- **Trace elements**: Iron (1089), Zinc (1095), Copper (1098), Manganese (1101), Selenium (1103)
- **Additional**: Chromium (1096), Molybdenum (1102), Iodine (1100), Fluoride (1099)
- **Cholesterol**: (1253) - minimize flag applied

### Vitamins (17 nutrients)
- **Fat-soluble**: A (1106), D (1114), E (1109), K (1185)
- **B-complex**: B1/Thiamin (1165), B2/Riboflavin (1166), B3/Niacin (1167), B5/Pantothenic Acid (1170), B6/Pyridoxine (1175), B7/Biotin (1176), B9/Folate (1177), B12/Cobalamin (1178)
- **Other**: Vitamin C (1162), Choline (1180), Betaine (1181)

### Special Compounds (5 nutrients)
- **Amino Acids**: Tryptophan (1210), Threonine (1211), Methionine (1212)
- **Fatty Acids**: Alpha-linolenic Acid (1404), Linoleic Acid (1269)

## Data Integrity

### Validation Requirements
- All nutrient IDs match USDA FoodData Central standards
- UL values enforced as safety limits (except magnesium supplements-only UL)
- Comprehensive validation test suite (21 tests) validates against published RDA values
- Rationale entries required for all non-standard adjustments

### Error Handling
- Missing demographic data throws descriptive errors
- Malformed data tables fail gracefully with console warnings
- Invalid nutrient IDs skip processing without crashing

## Integration Notes

### UI Integration
- Highlight flags indicate UI emphasis (bold, colors, coaching prompts)
- Minimize flags indicate "red zone" nutrients to track/limit
- Rationale arrays provide user-facing explanations

### Data Flow
1. User profile + goals → `computeMicros()`
2. Engine calculation → `MicronutrientRow[]`
3. UI consumption → Dashboard/MealBasket/FoodDetail display

### Performance Considerations
- Engine calculations are synchronous and fast (<10ms typical)
- Data tables loaded once on import, cached in memory
- Rationale generation adds minimal overhead

## Version 2.0 Improvements

### Major Enhancements
- **Expanded Coverage**: From 13 to 40+ essential nutrients
- **Complete Macros Integration**: All macro engine nutrients included
- **Comprehensive Validation**: 21-test suite against published values
- **Improved UL Handling**: Magnesium supplement-only UL exception
- **Enhanced Documentation**: Authoritative source citations
- **Bug Fixes**: Trans fat target (0g), fiber energy scaling, nutrient ID consistency

## Future Considerations (V3+)

Planned enhancements for future versions:
- Min/max ranges instead of single targets
- Pregnancy/lactation life stages
- Custom UL overrides for medical conditions
- Time-of-day dependent recommendations
- Bioavailability adjustments
- Interaction warnings (e.g., calcium-iron absorption)

## Testing Requirements

### Comprehensive Test Coverage (V2.0)
- **Validation Suite**: 21 tests validating against published RDA/AI/UL values
- **Engine Tests**: 58 tests covering all functionality
- **Demographic Coverage**: All sex × life stage combinations (12 total)
- **Energy Scaling**: Fiber (14g/1000kcal) and added sugars (≤10% kcal) formulas
- **Overlay Application**: Goal-based and modifier overlays
- **UL Clamping**: Safety limits with magnesium special case handling
- **Rounding**: All values rounded to whole units
- **Error Handling**: Missing data and edge case scenarios
- **Snapshot Regression**: Stable output verification across 36 scenarios

### Test Files
- `engine.test.ts`: Core engine functionality and regressions
- `validation.test.ts`: RDA/AI/UL values against authoritative sources

### Quality Gates
✅ All 21 validation tests pass
✅ All 58 engine tests pass
✅ Values rounded to whole units
✅ UL clamping works correctly (magnesium exception handled)
✅ Trans fat target fixed (0g, not null)
✅ No regressions in Food Detail/Dashboard rendering