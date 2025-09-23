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