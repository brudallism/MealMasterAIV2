// src/services/micros/engine.ts
// Micronutrient Engine V0-V1: RDA-based targets with goal and modifier overlays

import rdaTableData from './data/rda_table.json';
import overlaysData from './data/overlays.json';
import minimizeData from './data/minimize.json';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface MicronutrientProfile {
  sex: 'male' | 'female' | 'other';
  age_years: number;
  height_cm: number;
  weight_kg: number;
  life_stage: '19-30' | '31-50' | '51-70' | '71+';
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

export type PrimaryGoal = 'weight_loss' | 'maintenance' | 'muscle_gain' | 'body_recomposition';
export type Modifier = 'blood_sugar' | 'hormonal_support' | 'digestive_support';

export interface MicronutrientRow {
  id: number; // USDA nutrient ID
  name: string;
  unit: 'g' | 'mg' | 'µg' | 'kcal' | 'IU';
  target: number | null;
  min: number | null;
  max: number | null;
  limit: number | null;
  flags: {
    minimize: boolean;
    highlight: boolean;
  };
  rationale: string[];
}

export interface RDATableRow {
  sex: string;
  life_stage: string;
  values: Record<string, {
    name: string;
    unit: string;
    target?: number | null;
    ul?: number | null;
    limit?: number | null;
    notes?: string;
  }>;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function deriveLifeStage(age: number): '19-30' | '31-50' | '51-70' | '71+' {
  if (age >= 71) return '71+';
  if (age >= 51) return '51-70';
  if (age >= 31) return '31-50';
  return '19-30';
}

function roundToWholeUnits(value: number | null): number | null {
  if (value === null) return null;
  return Math.round(value);
}

// LLM_TASK: Review data loading and ensure proper error handling for malformed tables
function loadRDATable(): RDATableRow[] {
  try {
    return rdaTableData.data as RDATableRow[];
  } catch (error) {
    console.error('Failed to load RDA table:', error);
    throw new Error('RDA table data corrupted or unavailable');
  }
}

function loadMinimizeFlags(): Set<number> {
  try {
    return new Set(minimizeData.minimize_flags.map(item => item.id));
  } catch (error) {
    console.error('Failed to load minimize flags:', error);
    return new Set();
  }
}

// ============================================================================
// CORE CALCULATION FUNCTIONS
// ============================================================================

// LLM_TASK: Verify base lookup handles all edge cases including sex "other"
export function lookupBaseRow(sex: 'male' | 'female' | 'other', life_stage: string): Record<string, any> | null {
  const rdaTable = loadRDATable();

  // Try exact match first
  let row = rdaTable.find(r => r.sex === sex && r.life_stage === life_stage);

  // For "other" sex, use conservative approach with averaged values where available
  if (!row && sex === 'other') {
    row = rdaTable.find(r => r.sex === 'other' && r.life_stage === life_stage);
  }

  return row?.values || null;
}

function calculateEnergyScaledFiber(kcal_target: number): number {
  // Fiber target = max(14 * (kcal_target/1000), 18) rounded to whole grams
  const energyScaled = 14 * (kcal_target / 1000);
  return Math.round(Math.max(energyScaled, 18));
}

function calculateAddedSugarsLimit(kcal_target: number): number {
  // Added sugars limit = floor((kcal_target * 0.10) / 4) grams
  return Math.floor((kcal_target * 0.10) / 4);
}

// LLM_TASK: Test overlay application with multiple modifier combinations
function applyOverlays(
  baseRows: Record<string, any>,
  kcal_target: number,
  primary_goal: PrimaryGoal,
  modifiers: Modifier[],
  rationale: Record<string, string[]>
): Record<string, any> {
  const result = { ...baseRows };

  // Apply primary goal overlays
  const goalOverlays = overlaysData.primary_goal[primary_goal] || [];
  for (const overlay of goalOverlays) {
    // Handle individual nutrient highlighting
    if ('id' in overlay && overlay.id && result[overlay.id.toString()]) {
      if (overlay.action === 'highlight') {
        if (!rationale[overlay.id.toString()]) {
          rationale[overlay.id.toString()] = [];
        }
        rationale[overlay.id.toString()].push(`${primary_goal}: ${overlay.reason}`);
      }
    }

    // Handle B-complex group highlighting for muscle gain
    if ('group' in overlay && overlay.group === 'B_complex' && 'nutrients' in overlay && overlay.nutrients) {
      for (const nutrientId of overlay.nutrients) {
        if (result[nutrientId.toString()]) {
          if (!rationale[nutrientId.toString()]) {
            rationale[nutrientId.toString()] = [];
          }
          rationale[nutrientId.toString()].push(`${primary_goal}: ${overlay.reason}`);
        }
      }
    }
  }

  // Apply modifier overlays
  for (const modifier of modifiers) {
    const modifierOverlays = overlaysData.modifiers[modifier] || [];

    for (const overlay of modifierOverlays) {
      if ('id' in overlay && overlay.id) {
        const nutrientKey = overlay.id.toString();
        if (result[nutrientKey]) {
          if (!rationale[nutrientKey]) {
            rationale[nutrientKey] = [];
          }

          // Special handling for added sugars limit calculation
          if (overlay.id === 1235 && 'set_limit_formula' in overlay && overlay.set_limit_formula) {
            const calculatedLimit = calculateAddedSugarsLimit(kcal_target);
            result[nutrientKey] = {
              ...result[nutrientKey],
              limit: calculatedLimit
            };
            rationale[nutrientKey].push(`${modifier}: ${overlay.reason} (${calculatedLimit}g)`);
          }

          // Handle fiber minimum enforcement
          if (overlay.id === 291 && 'enforce_min' in overlay && overlay.enforce_min) {
            rationale[nutrientKey].push(`${modifier}: ${overlay.reason}`);
          }

          // Handle highlight actions
          if ('action' in overlay && overlay.action === 'highlight') {
            rationale[nutrientKey].push(`${modifier}: ${overlay.reason}`);
          }
        }
      }
    }
  }

  return result;
}

// LLM_TASK: Verify UL clamping logic and ensure rationale is properly recorded
function applySafetyAndFlags(
  processedRows: Record<string, any>,
  rationale: Record<string, string[]>
): MicronutrientRow[] {
  const minimizeFlags = loadMinimizeFlags();
  const results: MicronutrientRow[] = [];

  for (const [idStr, nutrientData] of Object.entries(processedRows)) {
    const id = parseInt(idStr);
    const isMinimize = minimizeFlags.has(id);

    // Initialize rationale array if not exists
    if (!rationale[idStr]) {
      rationale[idStr] = [];
    }

    let target = nutrientData.target !== undefined ? nutrientData.target : null;
    let limit = nutrientData.limit !== undefined ? nutrientData.limit : null;
    const ul = nutrientData.ul || null;

    // Apply UL clamping if target exceeds upper limit
    // Special handling: Magnesium UL (350mg) applies only to supplements, not dietary intake
    if (target && ul && target > ul && id !== 1090) {
      target = ul;
      rationale[idStr].push(`ul_clamp: Target clamped to UL (${ul}${nutrientData.unit})`);
    }

    // Special case: Fiber is energy-scaled, already set by main function
    // (Don't override the energy-scaled target)

    // Determine highlight flag from rationale content
    const isHighlight = rationale[idStr].some(r =>
      r.includes('Satiety') ||
      r.includes('Energy metabolism') ||
      r.includes('coaching') ||
      r.includes('highlight')
    );

    results.push({
      id,
      name: nutrientData.name,
      unit: nutrientData.unit,
      target: roundToWholeUnits(target),
      min: null, // V0-V1 doesn't use min ranges
      max: roundToWholeUnits(ul),
      limit: roundToWholeUnits(limit),
      flags: {
        minimize: isMinimize,
        highlight: isHighlight
      },
      rationale: [...rationale[idStr]]
    });
  }

  return results;
}

// ============================================================================
// MAIN ENGINE FUNCTION
// ============================================================================

// LLM_TASK: Ensure recompute policy alignment - only recalc on Settings/policy changes
export function computeMicros(
  profile: MicronutrientProfile,
  kcal_target: number,
  primary_goal: PrimaryGoal,
  modifiers: Modifier[] = [],
  policy_version = '1.0.0'
): MicronutrientRow[] {

  // Derive life stage if not provided
  const life_stage = profile.life_stage || deriveLifeStage(profile.age_years);

  console.group('🧪 Micronutrient Calculation');
  console.log('Profile:', {
    sex: profile.sex,
    age: profile.age_years,
    life_stage,
    kcal_target,
    primary_goal,
    modifiers
  });

  // Step 1: Base lookup (RDA/AI/UL by sex + life_stage)
  const baseValues = lookupBaseRow(profile.sex, life_stage);
  if (!baseValues) {
    throw new Error(`No RDA data found for ${profile.sex}, ${life_stage}`);
  }

  console.log('Base RDA lookup completed:', Object.keys(baseValues).length, 'nutrients');

  // Step 2: Energy scaled calculations (fiber)
  const fiberTarget = calculateEnergyScaledFiber(kcal_target);
  if (baseValues['291']) {
    baseValues['291'].target = fiberTarget;
  }

  console.log('Energy scaling applied: Fiber target =', fiberTarget, 'g');

  // Step 3 & 4: Apply overlays (primary goal + modifiers)
  const rationale: Record<string, string[]> = {};
  const processedValues = applyOverlays(baseValues, kcal_target, primary_goal, modifiers, rationale);

  console.log('Overlays applied:', {
    primary_goal_overlays: overlaysData.primary_goal[primary_goal]?.length || 0,
    modifier_overlays: modifiers.length
  });

  // Step 5: Safety pass (UL clamp, rationale)
  // Step 6: Apply minimize flags
  const finalRows = applySafetyAndFlags(processedValues, rationale);

  console.log('Safety and flags applied:', {
    total_nutrients: finalRows.length,
    minimize_count: finalRows.filter(r => r.flags.minimize).length,
    highlight_count: finalRows.filter(r => r.flags.highlight).length
  });

  // Log detailed rationale for debugging
  finalRows.forEach(row => {
    if (row.rationale.length > 0) {
      console.log(`${row.name} (${row.id}):`, row.rationale);
    }
  });

  console.groupEnd();

  return finalRows;
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export { deriveLifeStage, calculateEnergyScaledFiber, calculateAddedSugarsLimit };