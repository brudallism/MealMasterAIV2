# MealMasterAI v2 — **Settings › Diet & Allergies** Screen (v1) — Implementation Spec

> Single-profile, **single-diet** or **no diet**; allergies are strict (never relaxed); “common excludes” chips + custom search with typeahead; overrides permitted for non-allergy conflicts and auto-add recipe to **Favorites**. Built for React Native (Expo) + Zustand + React Query.

---

## 🎯 Objectives
- Let a user **set & edit**: one diet preset (or none), allergies (intolerances), exclusions (common + custom), cuisines, and time constraints.
- **Translate** preferences → Spoonacular query params **safely**.
- Ensure UX for **zero-results relaxation** and **one-time overrides** (non-allergy) + **auto-favorite**.
- Keep code **type-safe, testable, and extensible**.

---

## 🧭 Scope (v1)
- **Diet**: single select (or none). Suggested: Vegan, Vegetarian, Pescatarian, Ketogenic, Paleo, Primal, Low FODMAP, Whole30.
- **Gluten-free**: handled as **intolerance preset** + seed excludes.
- **Allergies (intolerances)**: Spoonacular-supported values; strict.
- **Exclusions**: 20 common chips + **custom** via autocomplete (with synonym expansion at call-time).
- **Cuisines**: include/exclude arrays.
- **Constraints**: `maxReadyTime`, optional `maxIngredients`.

Out of scope v1: multi-profile, i18n (English only), normalized DB schema (using JSON blob v1), meal-plan generator (optional v1.1).

---

## 📁 File layout & touched modules
```
src/
  screens/
    settings/
      DietAllergiesScreen.tsx            # NEW - this screen (can be nested in SettingsScreen)
  components/
    preferences/
      DietPicker.tsx                     # NEW - single-select list
      AllergiesPicker.tsx                # NEW - chip group
      ExcludeChips.tsx                   # NEW - 20-chip toggles
      CustomExcludeSearch.tsx            # NEW - autocomplete input
      CuisinePicker.tsx                  # NEW - include/exclude multi-select
      TimeConstraints.tsx                # NEW - maxReadyTime (+optional maxIngredients)
  stores/
    user-store.ts                        # EXTEND - add prefs slice actions as spec’d
    overrides-store.ts                   # NEW - per-session recipe overrides
    favorites-store.ts                   # EXISTS - used when user overrides
  services/
    api/
      spoonacular-client.ts              # EXTEND - searchRecipes, getRecipeInfo, autocompleteIngredients
    preferences/
      translate-to-spoonacular.ts        # NEW - translator (prefs → params)
      presets.ts                         # NEW - diet implied excludes, GF/FODMAP presets, synonym map
  types/
    dietary.ts                           # NEW - core types
  utils/
    debounce.ts                          # NEW - tiny debounce (optional)
```

> If Settings is a single screen, mount `DietAllergiesScreen` as a sub-section or tab in `SettingsScreen.tsx`.

---

## 🧩 Core Types (drop-in)
```ts
// src/types/dietary.ts
export type DietType =
  | "vegan" | "vegetarian" | "pescatarian"
  | "ketogenic" | "paleo" | "primal"
  | "low-fodmap" | "whole30" | "none";

export type Intolerance =
  | "dairy" | "egg" | "gluten" | "grain" | "peanut" | "seafood"
  | "sesame" | "shellfish" | "soy" | "sulfite" | "tree nut" | "wheat";

export interface DietaryPreferences {
  version: 1;
  diet: DietType;
  allergies: Intolerance[]; // strict
  excludeIngredients: string[]; // soft
  includeIngredients: string[]; // optional likes
  cuisines: { include: string[]; exclude: string[] };
  maxReadyTime?: number;
  maxIngredients?: number;
  calorieWindow?: { min?: number; max?: number };
  presets: { glutenFree: boolean; lowFodmapStrict: boolean };
  dietImpliedExclusions: string[]; // auto-managed, user-editable
  updatedAt: string; // ISO
}
```

---

## 🧠 Presets & Synonyms (seed data)
```ts
// src/services/preferences/presets.ts
export const DIET_EXCLUDES: Record<string, string[]> = {
  "vegan": ["gelatin","whey","casein","lactose","egg","meat","fish","shellfish","honey"],
  "vegetarian": ["gelatin","meat","fish","shellfish"],
  "pescatarian": ["beef","pork","chicken","lamb"],
  "ketogenic": ["sugar","corn syrup","wheat flour","white rice","maple syrup"],
  "paleo": ["legumes","peanuts","beans","grains","wheat","rice","dairy"],
  "primal": ["legumes","peanuts","beans","grains","wheat","rice"],
  "low-fodmap": [], // rely on diet param + optional strict preset
  "whole30": ["added sugar","alcohol","grains","legumes","dairy"],
  "none": []
};

export const GLUTEN_FREE_EXCLUDES = ["barley","rye","farro","spelt"];
export const FODMAP_STRICT_EXCLUDES = ["onion","garlic","wheat flour","honey","agave","apples","pears","cauliflower","kidney beans"];

export const EXCLUDE_SYNONYMS: Record<string, string[]> = {
  "cilantro": ["coriander leaf"],
  "scallion": ["green onion","spring onion"],
  "chickpea": ["garbanzo"],
  "bell pepper": ["capsicum"],
  "zucchini": ["courgette"]
};

export const COMMON_EXCLUDES_20 = [
  "onion","garlic","cilantro","mushrooms","olives","capers",
  "bell pepper","tomato","eggplant","zucchini","celery","cucumber",
  "broccoli","cauliflower","brussels sprouts","spinach","kale",
  "avocado","coconut","blue cheese"
];
```

---

## 🧱 User Store slice (summary)
Use Zustands actions per prior spec. Key actions:
- `setDiet(diet)`
- `toggleAllergy(intolerance)`
- `addExclude(x) / removeExclude(x)`
- `setGlutenFree(on)` ⇒ also seed `GLUTEN_FREE_EXCLUDES` into excludes (editable)
- `setLowFodmapStrict(on)` ⇒ also seed `FODMAP_STRICT_EXCLUDES`
- `setMaxReadyTime(m)`
- `setCuisines(include, exclude)`

Persist via your existing mechanism (SecureStore mirror optional in v1). Supabase holds a **jsonb** `user_preferences.dietary` with `version:1`.

---

## 🔁 Translator (prefs → Spoonacular)
```ts
// src/services/preferences/translate-to-spoonacular.ts
import { DietaryPreferences } from "@/types/dietary";
import { DIET_EXCLUDES, EXCLUDE_SYNONYMS, GLUTEN_FREE_EXCLUDES, FODMAP_STRICT_EXCLUDES } from "./presets";

export interface SpoonacularQuery {
  diet?: string;
  intolerances?: string;
  includeIngredients?: string;
  excludeIngredients?: string;
  cuisine?: string;
  type?: string;
  maxReadyTime?: number;
  minCalories?: number; maxCalories?: number;
  minProtein?: number; maxProtein?: number;
  minCarbs?: number;   maxCarbs?: number;
  number: number; offset: number; addRecipeInformation: true;
}

const norm = (arr?: string[]) => [...new Set((arr||[]).map(s=>s.trim().toLowerCase()).filter(Boolean))];

export function buildSpoonacularQuery(prefs: DietaryPreferences, opts: { number?: number; offset?: number } = {}): SpoonacularQuery {
  const number = opts.number ?? 30, offset = opts.offset ?? 0;
  const diet = prefs.diet !== "none" ? prefs.diet.replace("-", " ") : undefined;
  const intolerances = prefs.allergies.length ? prefs.allergies.join(",") : undefined;

  let excludes = new Set<string>(norm(prefs.excludeIngredients));
  DIET_EXCLUDES[prefs.diet].forEach(e=>excludes.add(e.toLowerCase()));
  if (prefs.presets.glutenFree) GLUTEN_FREE_EXCLUDES.forEach(e=>excludes.add(e));
  if (prefs.presets.lowFodmapStrict) FODMAP_STRICT_EXCLUDES.forEach(e=>excludes.add(e));
  [...excludes].forEach(x => (EXCLUDE_SYNONYMS[x]?.forEach(s=>excludes.add(s))));

  const cuisineInc = norm(prefs.cuisines.include);

  return {
    diet,
    intolerances,
    excludeIngredients: [...excludes].join(",") || undefined,
    includeIngredients: norm(prefs.includeIngredients).join(",") || undefined,
    cuisine: cuisineInc.join(",") || undefined,
    maxReadyTime: prefs.maxReadyTime || undefined,
    ...(prefs.calorieWindow?.min ? { minCalories: prefs.calorieWindow.min } : {}),
    ...(prefs.calorieWindow?.max ? { maxCalories: prefs.calorieWindow.max } : {}),
    number, offset, addRecipeInformation: true
  };
}
```

---

## 🌐 Spoonacular client additions
```ts
// src/services/api/spoonacular-client.ts
import { buildSpoonacularQuery } from "@/services/preferences/translate-to-spoonacular";

const BASE = "https://api.spoonacular.com";
const keyParam = () => `apiKey=${process.env.EXPO_PUBLIC_SPOONACULAR_KEY}`;

export async function searchRecipes(prefs, opts={ number:30, offset:0 }) {
  const q = buildSpoonacularQuery(prefs, opts);
  const params = new URLSearchParams(Object.entries(q).reduce((acc,[k,v])=>{ if(v==null||v==="") return acc; acc[k]=String(v); return acc; }, {} as Record<string,string>));
  const url = `${BASE}/recipes/complexSearch?${params.toString()}&${keyParam()}`;
  const res = await fetch(url); if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getRecipeInfo(id: number) {
  const url = `${BASE}/recipes/${id}/information?includeNutrition=true&${keyParam()}`;
  const res = await fetch(url); if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function autocompleteIngredients(query: string) {
  const url = `${BASE}/food/ingredients/autocomplete?query=${encodeURIComponent(query)}&number=8&${keyParam()}`;
  const res = await fetch(url); if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const items = await res.json(); // [{ name, id, ... }]
  return items.map((i:any)=> String(i.name || "").toLowerCase()).filter(Boolean);
}
```

---

## 🖥️ UI: Diet & Allergies Screen (structure)
**Sections (in order):**
1) **Diet** (single select): radio list (or segmented buttons) → `setDiet`.
2) **Allergies**: chips for each Spoonacular intolerance → `toggleAllergy`.
3) **Gluten-Free preset**: toggle → `setGlutenFree(true/false)`.
4) **Low-FODMAP strict** (optional) toggle → `setLowFodmapStrict(true/false)`.
5) **Exclusions**:
   - **Common (20 chips)** → `addExclude/removeExclude`.
   - **Custom** with autocomplete → calls `autocompleteIngredients()`; on select, `addExclude(name)`.
6) **Cuisines**: include & exclude pickers (multi-select chips) → `setCuisines(inc, exc)`.
7) **Time**: `maxReadyTime` slider or steppers → `setMaxReadyTime(m)`.
8) **Save** button (optional if auto-save) + **Reset** link (resets to defaults).

**Accessibility:**
- Provide `accessibilityRole`, `aria-labels`, and clear focus states.
- Chips should be toggleable via keyboard/switch access.

---

## 🧭 Zero-results relaxation (invoked from results screen)
Order: `time → cuisine → non-allergy excludes → calories → diet`. Allergies never relax.
- Present as a modal with quick-action chips (e.g., `+15 min`, `Any cuisine`, `Ignore “mushrooms” once`, `Widen calories ±15%`, `Ignore diet once (keeps allergies)`).
- If user chooses to ignore a **non-allergy** exclusion “once”, treat it like a temporary **search-only** relaxation (does not change stored prefs).

---

## ✅ Overrides → Favorites (non-allergy only)
- If a recipe conflicts with **diet** or **exclusions** (not allergies), show a confirm dialog: “This conflicts with your settings. Continue anyway?”
- On confirm: add recipe ID to `overrides-store` and **add to Favorites**.
- Do **not** modify global preferences.

---

## 🔑 Query keys & caching
Use stable, normalized fingerprints for React Query keys and for any local cache.
- Key parts: `diet, intolerances, excludeIngredients, includeIngredients, cuisines.include, maxReadyTime, calorieWindow, number, offset` (arrays: lowercase, trim, sort).
- TTL: 24h; stale-while-revalidate.

---

## 🧪 Test Plan (minimum v1)
**Unit (translator):**
- Vegan diet sets `diet=vegan`; gluten-free preset sets `intolerances=gluten,wheat`.
- Low-FODMAP diet emits `diet=low fodmap`; strict toggle adds FODMAP excludes.
- Custom exclude “cilantro” expands synonyms (`coriander leaf`).
- Excludes de-dupe + normalized casing.

**Component:**
- Toggling chips mutates store; Save persists.
- Autocomplete shows 0–8 results; selecting adds to chips list.

**Integration:**
- searchRecipes called with expected params for at least 3 fixtures (diet-only, diet+GF, none+allergies+custom-excludes).
- Zero-results modal proposes correct next steps.
- Override adds to Favorites and does not change store prefs.

---

## 📊 Analytics & Debug (optional v1.1)
- Log events: `prefs_changed`, `search_executed`, `zero_results`, `relaxation_step`, `override_used`.
- Add a small debug panel to view the exact computed Spoonacular params.

---

## 🔐 Privacy & Safety
- Allergies are strict and never relaxed.
- Store only what’s needed; no PII in prefs object.
- Option to **export/reset** preferences.

---

## 🧱 Feature flag (optional)
- Gate screen behind `features.dietarySettings` so it can be toggled per build/channel.

---

## 🔁 Agent Collaboration Protocol (LLM Coding Agent)
**Operating mode:** incremental, test-first, feedback-loop driven.

**1) Working cadence**
- Break work into **subtasks** (types → store → translator → client → UI pieces → wiring → tests).
- After each subtask: **open a PR**, run tests, and request feedback.

**2) Commit style**
- Use **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `chore:`, `test:`.
- Small, atomic commits. Aim for ≤150 lines per commit where reasonable.

**3) Branching**
- Feature branch: `feature/settings-diet-allergies-v1`.
- PRs titled with scope + subtask (e.g., `feat(settings): diet picker`).

**4) Testing**
- Add unit tests for the translator and any helpers.
- Add component tests for pickers and custom autocomplete.
- Ensure an end-to-end smoke path: set prefs → search.

**5) Code review checklist**
- Types strict (no `any` unless justified).
- UI accessible and performant (no heavy renders per keystroke; debounce autocomplete 250–400ms).
- State updates immutable; arrays normalized (lowercase, trimmed, unique).
- Errors handled (network, empty results) with user-friendly copy.

**6) Feedback loops**
- After each PR, post a **diff summary** and a **test run** screenshot/output.
- Ask 1–2 **explicit questions** if anything is ambiguous (don’t guess silently).

**7) Release & rollback**
- Ship behind a feature flag in staging; add a rollback note.
- Tag release `v0.1.0-dietary-settings`.

**8) Documentation**
- Update this spec **inline** (CHANGELOG at bottom) as decisions change.

---

## 🔧 Acceptance Criteria (v1)
- User can select **one diet** or **none**.
- Allergies saved and passed as `intolerances`.
- Exclusions: can toggle 20 common chips and add custom excludes via autocomplete.
- Preferences persist and rehydrate properly.
- `searchRecipes` includes correct params derived from current prefs.
- Zero-results modal proposes relaxation in the specified order; allergies are never relaxed.
- Override flow permits non-allergy conflicts **and** auto-adds to Favorites.
- Translator unit tests pass for key scenarios.

---

## 📌 CHANGELOG
- v1: Initial spec for Settings › Diet & Allergies screen.

