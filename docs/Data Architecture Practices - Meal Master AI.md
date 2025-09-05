# Data Architecture & Best Practices
*Foundation Schemas and Integration Patterns - Version 1.0*

## 📋 Dependencies & References
**Required by other documents:**
- Document 1 (Core Food Tracking V0.1) references core schemas
- Document 3 (Intelligent Adaptation V0.2) references behavioral tables
- Document 4 (Personal Nutrition Coach V0.3+) references advanced schemas
- All Individual AI System Implementation Guides reference relevant tables

**External Dependencies:**
- Supabase PostgreSQL database
- Spoonacular API for nutrition data
- USDA FoodData Central API for fallback nutrition data
- External health APIs (Apple Health, Google Fit) for V0.2+

---

## 🔍 Quick Find Index
**V0.1 Core Schemas**: users, user_preferences, foods_master, daily_meals, user_conversations
**V0.2 Behavioral Data**: behavior_patterns, psychological_profile, contextual_eating_data
**V0.3 Advanced Features**: meal_plans, recipes, health_integration_data, coaching_interactions
**API Integration Patterns**: Caching strategies, rate limiting, fallback mechanisms
**Performance Optimization**: Indexing, partitioning, real-time subscriptions

---

## 🎯 Data Architecture Philosophy

### **Scalable Foundation Principles**
- **Progressive Enhancement**: Each version adds tables without breaking existing ones
- **API-First Design**: All data accessible via standardized API patterns
- **Real-time Ready**: Built for live updates and collaborative features
- **Privacy by Design**: PHI data encrypted, audit trails comprehensive
- **Cost Optimization**: Efficient queries, intelligent caching, minimal API calls

### **Data Ownership Model**
- **User Data**: Users own all personal information, meals, preferences
- **AI System Data**: System performance and interaction logs for improvement
- **Nutrition Data**: Cached public data (USDA, Spoonacular) with proper attribution
- **Analytics Data**: Aggregated, anonymized insights for product improvement

---

## 🗄️ Database Schemas by Version

### **V0.1 Core Data Needs**

#### **User Management Tables**

**users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  encrypted_password VARCHAR(255), -- if using email/password auth
  auth_provider VARCHAR(50) DEFAULT 'supabase', -- 'supabase', 'google', 'apple'
  external_auth_id VARCHAR(255), -- provider-specific user ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscription_status VARCHAR(50) DEFAULT 'free', -- 'free', 'premium', 'trial'
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  onboarding_completed BOOLEAN DEFAULT false,
  privacy_consent BOOLEAN DEFAULT false,
  marketing_consent BOOLEAN DEFAULT false,
  data_export_requested_at TIMESTAMP WITH TIME ZONE, -- GDPR compliance
  account_deleted_at TIMESTAMP WITH TIME ZONE -- soft delete
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_provider_external_id ON users(auth_provider, external_auth_id);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);
CREATE INDEX idx_users_last_active ON users(last_active_at);
```

**user_preferences**
```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Macro Goals
  daily_calorie_goal INTEGER DEFAULT 2000 CHECK (daily_calorie_goal > 0),
  protein_goal INTEGER DEFAULT 150 CHECK (protein_goal >= 0),
  carb_goal INTEGER DEFAULT 200 CHECK (carb_goal >= 0),
  fat_goal INTEGER DEFAULT 65 CHECK (fat_goal >= 0),
  fiber_goal INTEGER DEFAULT 25 CHECK (fiber_goal >= 0),
  
  -- User Profile
  age INTEGER CHECK (age > 0 AND age < 150),
  gender VARCHAR(20), -- 'male', 'female', 'non-binary', 'prefer-not-to-say'
  height_cm DECIMAL(5,2) CHECK (height_cm > 0),
  current_weight_kg DECIMAL(5,2) CHECK (current_weight_kg > 0),
  target_weight_kg DECIMAL(5,2) CHECK (target_weight_kg > 0),
  
  -- Lifestyle
  activity_level VARCHAR(20) DEFAULT 'moderate', -- 'sedentary', 'light', 'moderate', 'active', 'very_active'
  primary_goal VARCHAR(30) DEFAULT 'maintain', -- 'lose_weight', 'gain_weight', 'maintain', 'build_muscle', 'improve_health'
  
  -- Dietary Restrictions
  dietary_restrictions TEXT[] DEFAULT '{}', -- ['gluten_free', 'dairy_free', 'vegetarian', 'vegan', 'keto', 'paleo']
  food_allergies TEXT[] DEFAULT '{}', -- ['nuts', 'shellfish', 'eggs', 'soy']
  disliked_foods TEXT[] DEFAULT '{}', -- User-specified foods to avoid
  
  -- Preferences
  preferred_cuisines TEXT[] DEFAULT '{}', -- ['italian', 'mexican', 'asian', 'mediterranean']
  cooking_skill_level VARCHAR(20) DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
  meal_prep_time_available INTEGER DEFAULT 30, -- minutes per day
  budget_tier VARCHAR(20) DEFAULT 'moderate', -- 'budget', 'moderate', 'premium'
  
  -- App Preferences
  units_system VARCHAR(10) DEFAULT 'imperial', -- 'metric', 'imperial'
  timezone VARCHAR(50) DEFAULT 'UTC',
  notification_preferences JSONB DEFAULT '{"meal_reminders": true, "goal_progress": true, "weekly_summary": true}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_primary_goal ON user_preferences(primary_goal);
CREATE INDEX idx_user_preferences_dietary_restrictions ON user_preferences USING GIN(dietary_restrictions);
```

#### **Food & Nutrition Tables**

**foods_master**
```sql
CREATE TABLE foods_master (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- External IDs
  spoonacular_id VARCHAR(50),
  usda_id VARCHAR(50),
  barcode VARCHAR(50), -- UPC/EAN for packaged products
  
  -- Basic Info
  food_name VARCHAR(255) NOT NULL,
  brand_name VARCHAR(255),
  food_category VARCHAR(100), -- 'protein', 'vegetable', 'grain', 'fruit', 'dairy', 'fat', 'beverage', 'snack'
  food_subcategory VARCHAR(100), -- 'poultry', 'leafy_green', 'whole_grain', etc.
  
  -- Nutrition per 100g (standardized)
  calories_per_100g DECIMAL(8,2) CHECK (calories_per_100g >= 0),
  protein_per_100g DECIMAL(8,2) CHECK (protein_per_100g >= 0),
  carbs_per_100g DECIMAL(8,2) CHECK (carbs_per_100g >= 0),
  fat_per_100g DECIMAL(8,2) CHECK (fat_per_100g >= 0),
  fiber_per_100g DECIMAL(8,2) CHECK (fiber_per_100g >= 0),
  sugar_per_100g DECIMAL(8,2) CHECK (sugar_per_100g >= 0),
  sodium_per_100g DECIMAL(8,2) CHECK (sodium_per_100g >= 0), -- mg
  
  -- Micronutrients (optional, for advanced features)
  vitamin_c_per_100g DECIMAL(8,2),
  iron_per_100g DECIMAL(8,2),
  calcium_per_100g DECIMAL(8,2),
  
  -- Common Portions
  common_portion_name VARCHAR(100), -- "1 cup", "1 medium", "3 oz", "1 slice"
  common_portion_grams DECIMAL(8,2),
  common_portion_2_name VARCHAR(100), -- Alternative portion
  common_portion_2_grams DECIMAL(8,2),
  
  -- Metadata
  allergens TEXT[] DEFAULT '{}', -- ['dairy', 'gluten', 'nuts', 'eggs', 'soy', 'shellfish']
  preparation_methods TEXT[] DEFAULT '{}', -- ['raw', 'grilled', 'baked', 'fried', 'steamed']
  is_organic BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false, -- manually verified nutrition data
  
  -- Data Source Tracking
  data_source VARCHAR(50) NOT NULL, -- 'spoonacular', 'usda', 'user_submitted', 'manual'
  data_quality_score DECIMAL(3,2) DEFAULT 0.80, -- 0.00 to 1.00
  last_verified_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_spoonacular_id UNIQUE(spoonacular_id),
  CONSTRAINT unique_usda_id UNIQUE(usda_id),
  CONSTRAINT unique_barcode UNIQUE(barcode)
);

-- Indexes for fast lookups
CREATE INDEX idx_foods_master_food_name ON foods_master USING GIN(to_tsvector('english', food_name));
CREATE INDEX idx_foods_master_brand_name ON foods_master(brand_name);
CREATE INDEX idx_foods_master_food_category ON foods_master(food_category);
CREATE INDEX idx_foods_master_spoonacular_id ON foods_master(spoonacular_id);
CREATE INDEX idx_foods_master_usda_id ON foods_master(usda_id);
CREATE INDEX idx_foods_master_barcode ON foods_master(barcode);
CREATE INDEX idx_foods_master_allergens ON foods_master USING GIN(allergens);
CREATE INDEX idx_foods_master_data_source ON foods_master(data_source);
```

**daily_meals**
```sql
CREATE TABLE daily_meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods_master(id),
  
  -- Meal Details
  meal_type VARCHAR(20) NOT NULL, -- 'breakfast', 'lunch', 'dinner', 'snack'
  quantity_grams DECIMAL(8,2) NOT NULL CHECK (quantity_grams > 0),
  
  -- Calculated Nutrition (denormalized for performance)
  calories DECIMAL(8,2) NOT NULL CHECK (calories >= 0),
  protein DECIMAL(8,2) NOT NULL CHECK (protein >= 0),
  carbs DECIMAL(8,2) NOT NULL CHECK (carbs >= 0),
  fat DECIMAL(8,2) NOT NULL CHECK (fat >= 0),
  fiber DECIMAL(8,2) DEFAULT 0 CHECK (fiber >= 0),
  sodium DECIMAL(8,2) DEFAULT 0 CHECK (sodium >= 0),
  
  -- Context & Metadata
  meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  eating_location VARCHAR(50), -- 'home', 'restaurant', 'work', 'social_event'
  eating_context VARCHAR(50), -- 'planned', 'spontaneous', 'social', 'stress_eating', 'celebration'
  
  -- AI System Data
  ai_confidence DECIMAL(3,2) DEFAULT 1.00 CHECK (ai_confidence >= 0 AND ai_confidence <= 1), -- 0.00 to 1.00
  food_recognition_method VARCHAR(30), -- 'text_description', 'photo', 'barcode', 'manual_entry'
  estimated_details TEXT[], -- ['portion_size', 'preparation_method', 'food_type']
  
  -- User Interaction
  user_confirmed BOOLEAN DEFAULT false,
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5), -- 1-5 satisfaction rating
  notes TEXT, -- User notes about the meal
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance (meals are frequently queried by user and date)
CREATE INDEX idx_daily_meals_user_id ON daily_meals(user_id);
CREATE INDEX idx_daily_meals_meal_date ON daily_meals(meal_date);
CREATE INDEX idx_daily_meals_user_date ON daily_meals(user_id, meal_date);
CREATE INDEX idx_daily_meals_user_date_type ON daily_meals(user_id, meal_date, meal_type);
CREATE INDEX idx_daily_meals_logged_at ON daily_meals(logged_at);
CREATE INDEX idx_daily_meals_food_id ON daily_meals(food_id);

-- Partitioning for scale (optional, implement when needed)
-- Partition by meal_date for better performance with large datasets
```

#### **AI System Coordination Tables**

**user_conversations**
```sql
CREATE TABLE user_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Message Content
  message_text TEXT NOT NULL,
  is_user_message BOOLEAN NOT NULL, -- true for user, false for AI
  message_type VARCHAR(30) DEFAULT 'general', -- 'food_logging', 'goal_question', 'general', 'crisis_intervention'
  
  -- AI System Metadata
  ai_system_source VARCHAR(50), -- 'user_facing', 'food_recognition', 'crisis_intervention'
  ai_model_used VARCHAR(50), -- 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'
  processing_time_ms INTEGER,
  
  -- Conversation Context
  conversation_session_id UUID, -- Group related messages in a conversation
  conversation_context JSONB, -- Store conversation state data
  parent_message_id UUID REFERENCES user_conversations(id), -- For threaded conversations
  
  -- Content Analysis
  intent_detected VARCHAR(50), -- 'log_food', 'ask_progress', 'request_help', 'crisis'
  entities_extracted JSONB, -- Structured data extracted from message
  sentiment_score DECIMAL(3,2), -- -1.00 to 1.00 (negative to positive)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_conversations_user_id ON user_conversations(user_id);
CREATE INDEX idx_user_conversations_session_id ON user_conversations(conversation_session_id);
CREATE INDEX idx_user_conversations_created_at ON user_conversations(created_at);
CREATE INDEX idx_user_conversations_user_created ON user_conversations(user_id, created_at);
CREATE INDEX idx_user_conversations_message_type ON user_conversations(message_type);
CREATE INDEX idx_user_conversations_intent ON user_conversations(intent_detected);

-- Automatic cleanup of old conversations (90 days retention)
CREATE OR REPLACE FUNCTION cleanup_old_conversations()
RETURNS void AS $$
BEGIN
  DELETE FROM user_conversations 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
```

**ai_requests_log**
```sql
CREATE TABLE ai_requests_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Request Details
  ai_system VARCHAR(50) NOT NULL, -- 'user_facing', 'food_recognition', 'macro_calculator'
  request_type VARCHAR(50) NOT NULL, -- 'food_recognition', 'macro_calculation', 'conversation'
  ai_model_used VARCHAR(50) NOT NULL, -- 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'
  
  -- Performance Metrics
  response_time_ms INTEGER NOT NULL CHECK (response_time_ms >= 0),
  tokens_used INTEGER CHECK (tokens_used >= 0),
  api_cost_usd DECIMAL(10,6) CHECK (api_cost_usd >= 0),
  
  -- Success/Failure Tracking
  success BOOLEAN DEFAULT true,
  error_type VARCHAR(50), -- 'timeout', 'rate_limit', 'invalid_response', 'api_error'
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Request Context
  input_data_hash VARCHAR(64), -- SHA-256 hash of input for caching
  output_data_size INTEGER, -- Size of response for monitoring
  cache_hit BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for monitoring and analytics
CREATE INDEX idx_ai_requests_log_user_id ON ai_requests_log(user_id);
CREATE INDEX idx_ai_requests_log_ai_system ON ai_requests_log(ai_system);
CREATE INDEX idx_ai_requests_log_created_at ON ai_requests_log(created_at);
CREATE INDEX idx_ai_requests_log_success ON ai_requests_log(success);
CREATE INDEX idx_ai_requests_log_error_type ON ai_requests_log(error_type);
CREATE INDEX idx_ai_requests_log_input_hash ON ai_requests_log(input_data_hash);

-- Partitioning by date for performance
CREATE TABLE ai_requests_log_y2024m01 PARTITION OF ai_requests_log
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
-- Add more partitions as needed
```

---

### **V0.2 Behavioral Data Expansion**

#### **Behavioral & Psychology Tables**

**behavior_patterns**
```sql
CREATE TABLE behavior_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Pattern Identification
  pattern_type VARCHAR(50) NOT NULL, -- 'eating_trigger', 'success_factor', 'failure_point', 'habit_streak'
  pattern_name VARCHAR(100), -- 'stress_eating_afternoon', 'successful_meal_prep_sunday'
  pattern_description TEXT,
  
  -- Pattern Context
  trigger_context JSONB, -- {time_of_day, location, emotional_state, social_situation}
  behavior_response TEXT, -- What the user did in response to trigger
  outcome_rating INTEGER CHECK (outcome_rating >= 1 AND outcome_rating <= 5), -- User satisfaction with outcome
  
  -- Pattern Strength
  occurrence_count INTEGER DEFAULT 1 CHECK (occurrence_count > 0),
  success_rate DECIMAL(3,2) DEFAULT 0.00 CHECK (success_rate >= 0 AND success_rate <= 1),
  last_occurrence_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  first_identified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- AI Analysis
  confidence_score DECIMAL(3,2) DEFAULT 0.80 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  pattern_strength VARCHAR(20) DEFAULT 'emerging', -- 'emerging', 'developing', 'established', 'strong'
  intervention_suggested TEXT, -- AI recommendation to modify pattern
  intervention_tried BOOLEAN DEFAULT false,
  intervention_success_rate DECIMAL(3,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_behavior_patterns_user_id ON behavior_patterns(user_id);
CREATE INDEX idx_behavior_patterns_pattern_type ON behavior_patterns(pattern_type);
CREATE INDEX idx_behavior_patterns_last_occurrence ON behavior_patterns(last_occurrence_at);
CREATE INDEX idx_behavior_patterns_success_rate ON behavior_patterns(success_rate);
```

**psychological_profile**
```sql
CREATE TABLE psychological_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Motivation & Communication Style
  motivation_type VARCHAR(30), -- 'achievement', 'affiliation', 'autonomy', 'mastery'
  communication_preference VARCHAR(30), -- 'supportive', 'direct', 'analytical', 'visual'
  learning_style VARCHAR(30), -- 'visual', 'auditory', 'kinesthetic', 'reading'
  feedback_preference VARCHAR(30), -- 'immediate', 'weekly_summary', 'milestone_based'
  
  -- Stress & Coping
  stress_response_pattern VARCHAR(30), -- 'emotional_eating', 'appetite_loss', 'comfort_seeking', 'routine_disruption'
  coping_mechanisms TEXT[], -- ['exercise', 'social_support', 'planning', 'mindfulness']
  stress_triggers TEXT[], -- ['work_deadline', 'social_events', 'family_conflict', 'health_concerns']
  
  -- Goal-Setting Psychology
  goal_setting_style VARCHAR(30), -- 'aggressive', 'moderate', 'conservative', 'flexible'
  perfectionism_tendency DECIMAL(3,2) DEFAULT 0.50, -- 0.00 to 1.00 scale
  all_or_nothing_thinking DECIMAL(3,2) DEFAULT 0.50, -- 0.00 to 1.00 scale
  progress_celebration_preference VARCHAR(30), -- 'private', 'social', 'milestone_focused', 'daily_wins'
  
  -- Relationship with Food
  food_relationship_type VARCHAR(30), -- 'fuel_focused', 'pleasure_seeking', 'comfort_oriented', 'social_centered'
  eating_disorder_risk_flags TEXT[], -- ['binge_eating', 'restrictive', 'compensatory_behavior']
  body_image_concerns DECIMAL(3,2) DEFAULT 0.50, -- 0.00 to 1.00 scale
  
  -- AI Learning Data
  profile_confidence DECIMAL(3,2) DEFAULT 0.30, -- How confident AI is in this profile
  last_updated_by VARCHAR(50), -- 'behavioral_psychology_ai', 'user_survey', 'interaction_analysis'
  adaptation_needed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_psychological_profile_user_id ON psychological_profile(user_id);
CREATE INDEX idx_psychological_profile_motivation_type ON psychological_profile(motivation_type);
CREATE INDEX idx_psychological_profile_communication_pref ON psychological_profile(communication_preference);
```

**contextual_eating_data**
```sql
CREATE TABLE contextual_eating_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  meal_id UUID REFERENCES daily_meals(id) ON DELETE CASCADE,
  
  -- Temporal Context
  time_of_day VARCHAR(20), -- 'early_morning', 'morning', 'midday', 'afternoon', 'evening', 'late_night'
  day_of_week VARCHAR(10),
  meal_timing_vs_planned INTEGER, -- minutes early/late compared to planned
  
  -- Location & Environment
  eating_location VARCHAR(50), -- 'home_kitchen', 'home_couch', 'restaurant', 'work_desk', 'car', 'social_event'
  environmental_factors TEXT[], -- ['tv_on', 'alone', 'rushed', 'relaxed', 'noisy', 'quiet']
  
  -- Social Context
  eating_companions VARCHAR(50), -- 'alone', 'family', 'friends', 'colleagues', 'strangers'
  social_pressure_level DECIMAL(3,2), -- 0.00 to 1.00 (none to high)
  meal_decision_maker VARCHAR(30), -- 'user', 'companion', 'restaurant', 'convenience'
  
  -- Emotional State
  hunger_level INTEGER CHECK (hunger_level >= 1 AND hunger_level <= 10), -- 1 = not hungry, 10 = very hungry
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
  mood_before_eating VARCHAR(30), -- 'happy', 'sad', 'anxious', 'neutral', 'excited', 'frustrated'
  mood_after_eating VARCHAR(30),
  eating_speed VARCHAR(20), -- 'very_slow', 'slow', 'normal', 'fast', 'very_fast'
  mindfulness_level INTEGER CHECK (mindfulness_level >= 1 AND mindfulness_level <= 10), -- How present/aware during eating
  
  -- Physiological Context
  energy_level_before INTEGER CHECK (energy_level_before >= 1 AND energy_level_before <= 10),
  energy_level_after INTEGER CHECK (energy_level_after >= 1 AND energy_level_after <= 10),
  sleep_quality_last_night INTEGER CHECK (sleep_quality_last_night >= 1 AND sleep_quality_last_night <= 10),
  hours_since_last_meal DECIMAL(4,2),
  
  -- Decision-Making Context
  meal_planning_level VARCHAR(30), -- 'well_planned', 'somewhat_planned', 'spontaneous', 'emergency'
  food_availability VARCHAR(30), -- 'many_options', 'some_options', 'limited_options', 'no_choice'
  time_pressure_level DECIMAL(3,2), -- 0.00 to 1.00
  budget_consideration VARCHAR(30), -- 'not_considered', 'minor_factor', 'major_factor', 'primary_driver'
  
  -- Post-Meal Reflection
  satisfaction_level INTEGER CHECK (satisfaction_level >= 1 AND satisfaction_level <= 10),
  regret_level INTEGER CHECK (regret_level >= 1 AND regret_level <= 10),
  physical_comfort INTEGER CHECK (physical_comfort >= 1 AND physical_comfort <= 10), -- How the food made them feel physically
  alignment_with_goals INTEGER CHECK (alignment_with_goals >= 1 AND alignment_with_goals <= 10),
  
  -- AI Analysis
  eating_pattern_category VARCHAR(50), -- 'emotional_eating', 'stress_eating', 'social_eating', 'mindful_eating', 'habitual_eating'
  intervention_opportunity BOOLEAN DEFAULT false,
  context_risk_factors TEXT[], -- Factors that led to poor choices
  context_success_factors TEXT[], -- Factors that led to good choices
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_contextual_eating_user_id ON contextual_eating_data(user_id);
CREATE INDEX idx_contextual_eating_meal_id ON contextual_eating_data(meal_id);
CREATE INDEX idx_contextual_eating_pattern_category ON contextual_eating_data(eating_pattern_category);
CREATE INDEX idx_contextual_eating_time_of_day ON contextual_eating_data(time_of_day);
CREATE INDEX idx_contextual_eating_location ON contextual_eating_data(eating_location);
```

---

### **V0.3+ Advanced Features Data**

#### **Meal Planning & Recipe Tables**

**meal_plans**
```sql
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Plan Details
  plan_name VARCHAR(100), -- "Week of Jan 15", "Keto Week 1", "Meal Prep Sunday"
  plan_type VARCHAR(30) DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly', 'custom'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Plan Status
  plan_status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'active', 'completed', 'abandoned'
  completion_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  
  -- AI Generation Data
  generated_by VARCHAR(50), -- 'meal_planner_ai', 'user_created', 'template'
  generation_prompt TEXT, -- User's request that generated this plan
  ai_confidence DECIMAL(3,2) DEFAULT 0.80,
  customizations_made INTEGER DEFAULT 0, -- How many changes user made to AI suggestions
  
  -- Plan Goals & Constraints
  target_calories_per_day INTEGER,
  target_protein_per_day INTEGER,
  target_carbs_per_day INTEGER,
  target_fat_per_day INTEGER,
  dietary_restrictions_applied TEXT[],
  budget_target DECIMAL(8,2), -- Target cost per day
  prep_time_limit INTEGER, -- Maximum minutes per day for prep
  
  -- Success Tracking
  user_satisfaction_rating INTEGER CHECK (user_satisfaction_rating >= 1 AND user_satisfaction_rating <= 5),
  adherence_score DECIMAL(3,2), -- How well user followed the plan
  cost_actual DECIMAL(8,2), -- Actual cost if tracked
  prep_time_actual INTEGER, -- Actual prep time if tracked
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX idx_meal_plans_start_date ON meal_plans(start_date);
CREATE INDEX idx_meal_plans_plan_status ON meal_plans(plan_status);
CREATE INDEX idx_meal_plans_user_status ON meal_plans(user_id, plan_status);
```

**recipes**
```sql
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Recipe Basic Info
  recipe_name VARCHAR(255) NOT NULL,
  recipe_description TEXT,
  cuisine_type VARCHAR(50), -- 'italian', 'mexican', 'asian', 'mediterranean'
  recipe_category VARCHAR(50), -- 'breakfast', 'lunch', 'dinner', 'snack', 'dessert'
  difficulty_level VARCHAR(20), -- 'beginner', 'intermediate', 'advanced'
  
  -- External Sources
  spoonacular_recipe_id VARCHAR(50),
  external_url VARCHAR(500),
  recipe_source VARCHAR(100), -- 'spoonacular', 'user_created', 'imported'
  
  -- Preparation Details
  prep_time_minutes INTEGER CHECK (prep_time_minutes >= 0),
  cook_time_minutes INTEGER CHECK (cook_time_minutes >= 0),
  total_time_minutes INTEGER CHECK (total_time_minutes >= 0),
  servings INTEGER DEFAULT 1 CHECK (servings > 0),
  
  -- Nutrition per serving
  calories_per_serving DECIMAL(8,2),
  protein_per_serving DECIMAL(8,2),
  carbs_per_serving DECIMAL(8,2),
  fat_per_serving DECIMAL(8,2),
  fiber_per_serving DECIMAL(8,2),
  
  -- Recipe Content
  ingredients JSONB NOT NULL, -- [{"ingredient_id": "uuid", "quantity": 200, "unit": "grams", "notes": "diced"}]
  instructions JSONB NOT NULL, -- [{"step": 1, "instruction": "Heat oil in pan", "duration_minutes": 2}]
  equipment_needed TEXT[], -- ['oven', 'blender', 'grill', 'slow_cooker']
  
  -- Recipe Metadata
  dietary_tags TEXT[], -- ['vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'keto', 'paleo']
  allergen_warnings TEXT[], -- ['contains_nuts', 'contains_dairy', 'contains_gluten']
  skill_requirements TEXT[], -- ['knife_skills', 'timing_critical', 'temperature_sensitive']
  
  -- User Interaction Data
  times_cooked INTEGER DEFAULT 0,
  average_user_rating DECIMAL(3,2),
  last_cooked_at TIMESTAMP WITH TIME ZONE,
  
  -- Cost & Availability
  estimated_cost_per_serving DECIMAL(6,2),
  seasonal_availability JSONB, -- {"spring": true, "summer": true, "fall": false, "winter": false}
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_spoonacular_recipe_id UNIQUE(spoonacular_recipe_id)
);

-- Indexes
CREATE INDEX idx_recipes_recipe_name ON recipes USING GIN(to_tsvector('english', recipe_name));
CREATE INDEX idx_recipes_cuisine_type ON recipes(cuisine_type);
CREATE INDEX idx_recipes_recipe_category ON recipes(recipe_category);
CREATE INDEX idx_recipes_difficulty_level ON recipes(difficulty_level);
CREATE INDEX idx_recipes_total_time ON recipes(total_time_minutes);
CREATE INDEX idx_recipes_dietary_tags ON recipes USING GIN(dietary_tags);
CREATE INDEX idx_recipes_spoonacular_id ON recipes(spoonacular_recipe_id);
```

#### **Health Integration Tables**

**health_integration_data**
```sql
CREATE TABLE health_integration_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Data Source
  integration_source VARCHAR(50) NOT NULL, -- 'apple_health', 'google_fit', 'fitbit', 'manual_entry'
  external_id VARCHAR(255), -- ID from external system
  data_type VARCHAR(50) NOT NULL, -- 'steps', 'heart_rate', 'sleep', 'weight', 'blood_glucose'
  
  -- Data Values
  numeric_value DECIMAL(12,4), -- Primary numeric value
  text_value VARCHAR(255), -- For non-numeric data
  unit_of_measurement VARCHAR(20), -- 'steps', 'bpm', 'hours', 'kg', 'mg/dL'
  
  -- Temporal Data
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL, -- When the measurement was taken
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- When we imported it
  date_only DATE, -- For daily aggregates
  
  -- Data Quality
  confidence_score DECIMAL(3,2) DEFAULT 1.00, -- How reliable this data is
  is_manually_entered BOOLEAN DEFAULT false,
  is_estimated BOOLEAN DEFAULT false,
  
  -- Context
  context_data JSONB, -- Additional context like sleep stage, activity type, etc.
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for time-series data
CREATE INDEX idx_health_integration_user_id ON health_integration_data(user_id);
CREATE INDEX idx_health_integration_data_type ON health_integration_data(data_type);
CREATE INDEX idx_health_integration_recorded_at ON health_integration_data(recorded_at);
CREATE INDEX idx_health_integration_user_type_date ON health_integration_data(user_id, data_type, recorded_at);
CREATE INDEX idx_health_integration_date_only ON health_integration_data(date_only);

-- Partitioning for scale
CREATE TABLE health_integration_data_y2024m01 PARTITION OF health_integration_data
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

**coaching_interactions**
```sql
CREATE TABLE coaching_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Interaction Details
  interaction_type VARCHAR(50) NOT NULL, -- 'check_in', 'goal_adjustment', 'crisis_intervention', 'celebration', 'course_correction'
  interaction_trigger VARCHAR(50), -- 'scheduled', 'user_initiated', 'ai_detected_need', 'milestone_reached'
  ai_system_source VARCHAR(50), -- 'compliance_coaching_ai', 'crisis_intervention_ai', 'behavioral_psychology_ai'
  
  -- Content
  coaching_message TEXT NOT NULL,
  user_response TEXT,
  user_response_sentiment DECIMAL(3,2), -- -1.00 to 1.00
  
  -- Coaching Strategy
  coaching_approach VARCHAR(50), -- 'motivational', 'educational', 'supportive', 'directive', 'collaborative'
  personalization_factors TEXT[], -- ['high_stress_day', 'approaching_milestone', 'past_pattern_triggered']
  intervention_type VARCHAR(50), -- 'preventive', 'corrective', 'supportive', 'celebratory'
  
  -- Effectiveness Tracking
  user_engagement_level INTEGER CHECK (user_engagement_level >= 1 AND user_engagement_level <= 5),
  perceived_helpfulness INTEGER CHECK (perceived_helpfulness >= 1 AND perceived_helpfulness <= 5),
  behavioral_change_observed BOOLEAN DEFAULT false,
  follow_up_needed BOOLEAN DEFAULT false,
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  follow_up_scheduled_for TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_coaching_interactions_user_id ON coaching_interactions(user_id);
CREATE INDEX idx_coaching_interactions_type ON coaching_interactions(interaction_type);
CREATE INDEX idx_coaching_interactions_scheduled_for ON coaching_interactions(scheduled_for);
CREATE INDEX idx_coaching_interactions_completed_at ON coaching_interactions(completed_at);
```

---

## 🔌 API Integration Patterns

### **External API Management Strategy**

#### **Spoonacular API Integration (Primary Nutrition Source)**
```sql
-- Cache table for Spoonacular responses
CREATE TABLE spoonacular_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spoonacular_id VARCHAR(50) UNIQUE NOT NULL,
  endpoint_type VARCHAR(50) NOT NULL, -- 'ingredient_info', 'recipe_details', 'nutrition_analysis'
  request_hash VARCHAR(64) NOT NULL, -- SHA-256 of request parameters
  response_data JSONB NOT NULL,
  cache_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  hit_count INTEGER DEFAULT 1,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_spoonacular_cache_id ON spoonacular_cache(spoonacular_id);
CREATE INDEX idx_spoonacular_cache_hash ON spoonacular_cache(request_hash);
CREATE INDEX idx_spoonacular_cache_expires ON spoonacular_cache(cache_expires_at);
```

**Rate Limiting Strategy**:
- **Free Tier**: 150 requests/day - Use aggressive caching
- **Paid Tier**: 1500 requests/day - Cache for 7 days, refresh popular items
- **Fallback**: USDA data when rate limits exceeded

#### **USDA FoodData Central Integration (Fallback Source)**
```sql
-- Cache table for USDA responses
CREATE TABLE usda_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usda_fdc_id VARCHAR(50) UNIQUE NOT NULL,
  food_data JSONB NOT NULL,
  nutrient_data JSONB NOT NULL,
  cache_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  data_version VARCHAR(20), -- Track USDA data version updates
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_usda_cache_fdc_id ON usda_cache(usda_fdc_id);
CREATE INDEX idx_usda_cache_expires ON usda_cache(cache_expires_at);
```

**Data Update Strategy**:
- **USDA Data**: Government data changes infrequently - cache for 30 days
- **Barcode Lookups**: Product data can change - cache for 7 days
- **Batch Updates**: Weekly sync of popular foods to ensure accuracy

#### **Health API Integration Patterns**
```javascript
// Example: Apple Health integration pattern
const healthIntegration = {
  dataTypes: [
    'steps', 'active_calories', 'heart_rate', 'sleep_analysis',
    'body_weight', 'body_fat_percentage', 'blood_glucose'
  ],
  syncFrequency: 'hourly', // For active users
  batchSize: 1000, // Records per sync
  retentionPeriod: '2_years', // How long to keep historical data
  
  conflictResolution: {
    'duplicate_timestamps': 'use_highest_confidence',
    'conflicting_values': 'user_preference_source',
    'missing_data': 'interpolate_if_reasonable'
  }
}
```

---

## 🚀 Performance Optimization Strategies

### **Database Performance Best Practices**

#### **Indexing Strategy**
```sql
-- Composite indexes for common query patterns
CREATE INDEX idx_daily_meals_user_date_type ON daily_meals(user_id, meal_date, meal_type);
CREATE INDEX idx_conversations_user_session ON user_conversations(user_id, conversation_session_id, created_at);

-- Partial indexes for active data
CREATE INDEX idx_active_meal_plans ON meal_plans(user_id, start_date) 
WHERE plan_status IN ('draft', 'active');

-- GIN indexes for array and JSONB columns
CREATE INDEX idx_foods_dietary_restrictions ON foods_master USING GIN(allergens);
CREATE INDEX idx_user_preferences_restrictions ON user_preferences USING GIN(dietary_restrictions);
```

#### **Partitioning Strategy**
```sql
-- Partition large tables by date for better performance
-- Example: ai_requests_log partitioned by month
CREATE TABLE ai_requests_log_y2024m01 PARTITION OF ai_requests_log
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Automatic partition creation function
CREATE OR REPLACE FUNCTION create_monthly_partition(table_name text, start_date date)
RETURNS void AS $
DECLARE
  partition_name text;
  end_date date;
BEGIN
  partition_name := table_name || '_y' || EXTRACT(year FROM start_date) || 'm' || LPAD(EXTRACT(month FROM start_date)::text, 2, '0');
  end_date := start_date + interval '1 month';
  
  EXECUTE format('CREATE TABLE %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
                 partition_name, table_name, start_date, end_date);
END;
$ LANGUAGE plpgsql;
```

### **Caching Strategies**

#### **Application-Level Caching**
```javascript
// Redis caching patterns for AI responses
const cacheConfig = {
  // Short-term cache for AI responses
  ai_responses: {
    ttl: 300, // 5 minutes
    maxSize: 10000
  },
  
  // Medium-term cache for nutrition data
  nutrition_data: {
    ttl: 3600, // 1 hour
    maxSize: 50000
  },
  
  // Long-term cache for user preferences
  user_preferences: {
    ttl: 86400, // 24 hours
    maxSize: 100000
  }
}
```

#### **Database Query Optimization**
```sql
-- Materialized views for complex aggregations
CREATE MATERIALIZED VIEW user_daily_nutrition_summary AS
SELECT 
  user_id,
  meal_date,
  SUM(calories) as total_calories,
  SUM(protein) as total_protein,
  SUM(carbs) as total_carbs,
  SUM(fat) as total_fat,
  COUNT(*) as meals_logged
FROM daily_meals 
GROUP BY user_id, meal_date;

-- Refresh strategy
CREATE INDEX idx_user_daily_nutrition_user_date ON user_daily_nutrition_summary(user_id, meal_date);

-- Automatic refresh function
CREATE OR REPLACE FUNCTION refresh_daily_nutrition_summary()
RETURNS void AS $
BEGIN
  REFRESH MATERIALIZED VIEW user_daily_nutrition_summary;
END;
$ LANGUAGE plpgsql;
```

---

## 🔒 Security & Privacy Implementation

### **Data Encryption Standards**
```sql
-- Enable row-level security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_conversations ENABLE ROW LEVEL SECURITY;

-- Policies for user data access
CREATE POLICY user_data_access ON user_preferences 
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY meal_data_access ON daily_meals 
FOR ALL USING (auth.uid() = user_id);

-- Encryption for sensitive fields
-- Use Supabase's built-in encryption or application-level encryption
-- for fields like: notes, conversation_context, health_integration_data
```

### **GDPR Compliance Features**
```sql
-- Data export function for GDPR requests
CREATE OR REPLACE FUNCTION export_user_data(target_user_id UUID)
RETURNS JSONB AS $
DECLARE
  user_data JSONB;
BEGIN
  SELECT jsonb_build_object(
    'user_profile', (SELECT row_to_json(u) FROM users u WHERE u.id = target_user_id),
    'preferences', (SELECT row_to_json(up) FROM user_preferences up WHERE up.user_id = target_user_id),
    'meals', (SELECT jsonb_agg(row_to_json(dm)) FROM daily_meals dm WHERE dm.user_id = target_user_id),
    'conversations', (SELECT jsonb_agg(row_to_json(uc)) FROM user_conversations uc WHERE uc.user_id = target_user_id),
    'export_timestamp', NOW()
  ) INTO user_data;
  
  RETURN user_data;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Data deletion function for GDPR requests
CREATE OR REPLACE FUNCTION anonymize_user_data(target_user_id UUID)
RETURNS void AS $
BEGIN
  -- Soft delete user record
  UPDATE users SET 
    email = 'deleted_' || id::text || '@anonymized.local',
    account_deleted_at = NOW()
  WHERE id = target_user_id;
  
  -- Anonymize conversations but keep AI training data
  UPDATE user_conversations SET
    message_text = '[DELETED]'
  WHERE user_id = target_user_id AND is_user_message = true;
  
  -- Keep aggregated nutrition data for AI improvement but remove personal identifiers
  -- Implementation depends on specific requirements
END;
$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📊 Analytics & Monitoring Tables

### **System Health Monitoring**
```sql
CREATE TABLE system_health_monitor (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- System Component
  component_name VARCHAR(50) NOT NULL, -- 'user_facing_ai', 'food_recognition_ai', 'database', 'api_gateway'
  health_status VARCHAR(20) NOT NULL, -- 'healthy', 'degraded', 'failing', 'offline'
  
  -- Metrics
  response_time_ms INTEGER,
  error_rate DECIMAL(5,4), -- 0.0000 to 1.0000
  throughput_per_minute INTEGER,
  resource_usage JSONB, -- {cpu: 45, memory: 67, disk: 23} - percentages
  
  -- Alert Information
  alert_level VARCHAR(20), -- 'info', 'warning', 'error', 'critical'
  alert_message TEXT,
  resolution_required BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for monitoring queries
CREATE INDEX idx_system_health_component ON system_health_monitor(component_name);
CREATE INDEX idx_system_health_status ON system_health_monitor(health_status);
CREATE INDEX idx_system_health_created_at ON system_health_monitor(created_at);
```

### **Business Intelligence Tables**
```sql
CREATE TABLE usage_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Temporal Aggregation
  period_type VARCHAR(20) NOT NULL, -- 'hourly', 'daily', 'weekly', 'monthly'
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Usage Metrics
  active_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  meals_logged INTEGER DEFAULT 0,
  ai_interactions INTEGER DEFAULT 0,
  feature_usage JSONB, -- {"food_recognition": 1250, "meal_planning": 340, "crisis_intervention": 15}
  
  -- Performance Metrics
  avg_response_time_ms INTEGER,
  system_uptime_percentage DECIMAL(5,2),
  api_cost_usd DECIMAL(10,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX idx_usage_analytics_period ON usage_analytics(period_type, period_start);
CREATE INDEX idx_usage_analytics_created_at ON usage_analytics(created_at);
```

---

## 🔄 Data Migration & Version Control

### **Schema Version Management**
```sql
CREATE TABLE schema_migrations (
  version VARCHAR(20) PRIMARY KEY,
  description TEXT NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  rollback_sql TEXT
);

-- Track current schema version
INSERT INTO schema_migrations (version, description) VALUES 
('v0.1.0', 'Initial core food tracking tables'),
('v0.2.0', 'Added behavioral psychology and context tables'),
('v0.3.0', 'Added meal planning and health integration tables');
```

### **Data Backup & Recovery Strategy**
```sql
-- Automated backup verification
CREATE OR REPLACE FUNCTION verify_backup_integrity()
RETURNS TABLE(table_name text, record_count bigint, last_backup timestamp with time zone) AS $
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename as table_name,
    n_tup_ins + n_tup_upd as record_count,
    NOW() as last_backup
  FROM pg_stat_user_tables 
  WHERE schemaname = 'public';
END;
$ LANGUAGE plpgsql;
```

---

## 🎯 Implementation Checklist by Version

### **V0.1 Implementation Priority**
- [ ] Set up Supabase project with core tables
- [ ] Implement user authentication and basic RLS policies
- [ ] Create foods_master table with USDA/Spoonacular integration
- [ ] Set up daily_meals table with proper indexing
- [ ] Implement basic caching for nutrition API responses
- [ ] Create user_conversations table for chat history
- [ ] Set up ai_requests_log for monitoring

### **V0.2 Implementation Priority**
- [ ] Add behavior_patterns and psychological_profile tables
- [ ] Implement contextual_eating_data collection
- [ ] Create materialized views for performance
- [ ] Set up automated data cleanup procedures
- [ ] Implement GDPR compliance functions
- [ ] Add health_integration_data table structure

### **V0.3+ Implementation Priority**
- [ ] Create meal_plans and recipes tables
- [ ] Implement coaching_interactions tracking
- [ ] Set up partitioning for large tables
- [ ] Create comprehensive analytics tables
- [ ] Implement automated backup verification
- [ ] Set up real-time data synchronization

---

*This data architecture provides a scalable foundation that grows with each version while maintaining performance, security, and compliance standards.* VARCHAR(30), -- 'achievement', 'affiliation', 'autonomy', 'mastery'
  communication_preference VARCHAR(30), -- 'supportive', 'direct', 'analytical', 'visual'
  learning_style VARCHAR(30), -- 'visual', 'auditory', 'kinesthetic', 'reading'
  feedback_preference VARCHAR(30), -- 'immediate', 'weekly_summary', 'milestone_based'
  
  -- Stress & Coping
  stress_response_pattern VARCHAR(30), -- 'emotional_eating', 'appetite_loss', 'comfort_seeking', 'routine_disruption'
  coping_mechanisms TEXT[], -- ['exercise', 'social_support', 'planning', 'mindfulness']
  stress_triggers TEXT[], -- ['work_deadline', 'social_events', 'family_conflict', 'health_concerns']
  
  -- Goal-Setting Psychology
  goal_setting_style VARCHAR(30), -- 'aggressive', 'moderate', 'conservative', 'flexible'
  perfectionism_tendency DECIMAL(3,2) DEFAULT 0.50, -- 0.00 to 1.00 scale
  all_or_nothing_thinking DECIMAL(3,2)