-- Create a separate cache table alongside your existing foods_master
-- This preserves your food database while adding cache functionality

CREATE TABLE public.food_recognition_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  food_key TEXT UNIQUE NOT NULL,
  calories DECIMAL(8,2) NOT NULL,
  protein DECIMAL(8,2) NOT NULL,
  carbs DECIMAL(8,2) NOT NULL,
  fat DECIMAL(8,2) NOT NULL,
  fiber DECIMAL(8,2) DEFAULT 0,
  sugar DECIMAL(8,2) DEFAULT 0,
  sodium DECIMAL(8,2) DEFAULT 0,
  data_source TEXT NOT NULL CHECK (data_source IN ('spoonacular', 'usda', 'gpt_generated')),
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for fast cache lookups
CREATE INDEX idx_food_recognition_cache_food_key ON public.food_recognition_cache(food_key);
CREATE INDEX idx_food_recognition_cache_last_used ON public.food_recognition_cache(last_used);

-- Optional: Add RLS policies if needed
-- ALTER TABLE public.food_recognition_cache ENABLE ROW LEVEL SECURITY;