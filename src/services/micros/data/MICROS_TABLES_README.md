# Micronutrient Data Tables Documentation (V2.0)

## Overview

This directory contains comprehensive data tables for **40+ essential nutrients** that drive the micronutrient calculation engine. All data is sourced from authoritative references and follows USDA FoodData Central nutrient ID standards.

### Authoritative Sources
- **US DRI 2019-2020** (IOM/NASEM) - Primary RDA/AI/UL values
- **NIH Office of Dietary Supplements** - Nutrient fact sheets and citations
- **Dietary Guidelines for Americans 2020-2025** - Policy recommendations
- **USDA FoodData Central** - Nutrient ID standardization

## Table Descriptions

### `rda_table.json` (V2.0)
**Comprehensive RDA/AI/UL lookup table**

Contains demographic-specific recommendations for **40+ essential nutrients** across all tracked categories.

#### Complete Nutrient Coverage

##### Macronutrients (5 nutrients)
| ID | Name | Unit | Notes |
|---|---|---|---|
| 208 | Calories | kcal | Calculated by macro engine |
| 203 | Protein | g | Calculated by macro engine |
| 205 | Carbohydrates | g | Calculated by macro engine |
| 204 | Total Fat | g | Calculated by macro engine |
| 291 | Fiber | g | Energy-scaled: 14g/1000kcal, min 18g |

##### Minerals (15 nutrients)
| ID | Name | Unit | Special Notes |
|---|---|---|---|
| 1087 | Calcium | mg | Increases to 1200mg at 71+ years |
| 1090 | Magnesium | mg | UL (350mg) applies to supplements only |
| 1089 | Iron | mg | Major sex differences (18mg F vs 8mg M) |
| 1092 | Potassium | mg | AI value, no UL established |
| 1093 | Sodium | mg | CDRR limit (2300mg), minimize flag |
| 1091 | Phosphorus | mg | RDA values |
| 1095 | Zinc | mg | Sex-specific differences |
| 1098 | Copper | mg | UL established |
| 1101 | Manganese | mg | AI values |
| 1103 | Selenium | mg | UL established |
| 1096 | Chromium | mg | AI values |
| 1102 | Molybdenum | mg | RDA and UL values |
| 1100 | Iodine | mg | RDA and UL values |
| 1099 | Fluoride | mg | AI values |
| 1253 | Cholesterol | mg | Minimize flag, no RDA |

##### Vitamins (17 nutrients)
| ID | Name | Unit | Special Notes |
|---|---|---|---|
| 1106 | Vitamin A (RAE) | µg | UL applies to preformed vitamin A only |
| 1114 | Vitamin D | µg | Increases to 20µg at 71+ years |
| 1109 | Vitamin E | mg | UL for synthetic form only |
| 1185 | Vitamin K | µg | AI values, no UL established |
| 1165 | Thiamin (B1) | mg | RDA values |
| 1166 | Riboflavin (B2) | mg | RDA values |
| 1167 | Niacin (B3) | mg | UL for supplemental form |
| 1170 | Pantothenic Acid (B5) | mg | AI values |
| 1175 | Vitamin B6 | mg | Increases with age |
| 1176 | Biotin (B7) | mg | AI values |
| 1177 | Folate | µg | UL for synthetic folic acid only |
| 1178 | Vitamin B12 | µg | Absorption issues in elderly |
| 1162 | Vitamin C | mg | Sex-specific differences |
| 1180 | Choline | mg | AI values |
| 1181 | Betaine | mg | No DRI established |

##### Fatty Acids & Amino Acids (8 nutrients)
| ID | Name | Unit | Notes |
|---|---|---|---|
| 1258 | Saturated Fat | g | Minimize flag, no RDA |
| 1257 | Trans Fat | g | Target/limit = 0g, minimize flag |
| 1235 | Added Sugars | g | Limit ≤10% kcal, minimize flag |
| 1404 | Alpha-linolenic Acid | g | AI values |
| 1269 | Linoleic Acid | g | AI values |
| 1210 | Tryptophan | mg | RDA values |
| 1211 | Threonine | mg | RDA values |
| 1212 | Methionine | mg | RDA values |

#### Demographics Covered
- **Life Stages**: 19-30, 31-50, 51-70, 71+ years
- **Sex Categories**: male, female, other
- **"Other" Values**: Averaged from male/female where different

#### Special Cases
- **Fiber**: Always null in table, calculated as 14g/1000kcal
- **Added Sugars**: Only limit values, calculated as ≤10% kcal
- **Sodium**: Uses CDRR (2300mg) as limit, not RDA
- **71+ Age Group**: Higher calcium (1200mg) and vitamin D (20µg)

### `overlays.json`
**Goal and modifier-based adjustments**

#### Primary Goal Overlays
- **weight_loss**: Highlights fiber for satiety
- **muscle_gain**: Highlights B-complex vitamins (B12, Folate)
- **maintenance**: No overlays applied
- **body_recomposition**: No overlays applied

#### Modifier Overlays
- **blood_sugar**: Sets added sugars limit, enforces fiber minimum
- **hormonal_support**: Uses demographic RDAs without modifications
- **digestive_support**: Highlights fiber for coaching

#### Overlay Types
1. **Individual nutrient** (`id` field): Targets specific nutrients
2. **Nutrient groups** (`group` + `nutrients` fields): Applies to multiple nutrients
3. **Formula-based** (`set_limit_formula`): Dynamic calculation
4. **Action-based** (`action: "highlight"`): UI emphasis

### `minimize.json`
**Nutrients to minimize for optimal health**

Lists 5 nutrients that should be limited:

| Priority | ID | Nutrient | Reason |
|---|---|---|---|
| HIGH | 1257 | Trans Fatty Acids | Cardiovascular disease risk |
| HIGH | 1093 | Sodium | Chronic disease risk reduction |
| HIGH | 1235 | Added Sugars | Metabolic health |
| MEDIUM | 1258 | Saturated Fat | Cardiovascular health |
| MEDIUM | 1253 | Cholesterol | Cardiovascular health |

## Data Validation Rules

### Required Fields
- All nutrients must have valid USDA ID numbers
- Names must match FoodData Central naming conventions
- Units must be from approved list: 'g', 'mg', 'µg', 'kcal', 'IU'

### Value Constraints
- `target`: Positive numbers only, null for calculated values
- `ul`: Positive numbers or null if no UL established
- `limit`: For nutrients to minimize (sodium, added sugars)
- `notes`: Human-readable explanations for special cases

### Demographic Coverage
- All sex/life_stage combinations must be covered
- Missing combinations will throw runtime errors
- "Other" sex requires averaged values where sex differences exist

## Usage in Engine

### Loading Process
```typescript
import rdaTableData from './rda_table.json';
import overlaysData from './overlays.json';
import minimizeData from './minimize.json';
```

### Lookup Logic
1. **Base lookup**: Find row by sex + life_stage
2. **Overlay application**: Apply goal and modifier adjustments
3. **Safety pass**: Enforce UL limits and minimize flags

### Error Handling
- Missing demographic data: Throws descriptive error
- Malformed JSON: Console warning, continues with defaults
- Invalid IDs: Skipped without crashing

## Maintenance Guidelines

### Adding New Nutrients
1. Assign valid USDA FoodData Central ID
2. Add to all demographic combinations in `rda_table.json`
3. Consider minimize flag in `minimize.json`
4. Update engine interfaces if needed

### Updating Values
1. Source changes from official DRI updates only
2. Update `meta.last_updated` field
3. Increment `meta.version` for breaking changes
4. Update corresponding tests

### Validation Checklist
- [ ] All USDA IDs valid and current
- [ ] No missing demographic combinations
- [ ] Units consistent across life stages
- [ ] UL values match official sources
- [ ] Notes explain any deviations from standard

## Quality Assurance

### Data Sources
- **Primary**: US DRI 2019-2020 (IOM/NASEM)
- **Secondary**: USDA FoodData Central for ID validation
- **Tertiary**: AHA/ACC Guidelines for minimize flags

### Verification Steps
1. Cross-reference all values with official DRI tables
2. Validate USDA IDs against current FoodData Central
3. Ensure demographic coverage completeness
4. Test engine with all combinations

### Update Schedule
- **Annual review**: Check for DRI updates
- **Quarterly**: USDA ID validation
- **As-needed**: Bug fixes or data corrections

## Integration Notes

### File Dependencies
- Engine imports all three JSON files directly
- No external API calls required
- All data bundled with application

### Performance Impact
- Tables loaded once on module import
- Total size: ~45KB compressed (expanded from ~15KB)
- Lookup operations: O(1) hash table access
- 40+ nutrients vs original 13 nutrients
- No performance degradation despite 3x data increase

### Backward Compatibility
- Schema changes require engine version increment
- New nutrients can be added without breaking changes
- Deprecated nutrients should be marked, not removed