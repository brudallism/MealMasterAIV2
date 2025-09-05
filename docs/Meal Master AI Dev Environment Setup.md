# Development Environment Setup Guide
*Day 1 Coding Readiness - Complete Setup Instructions - Version 1.0*

## 📋 Dependencies & References
**Referenced from other documents:**
- 📎 **Reference**: Technical Architecture Decisions > Final technology stack
- 📎 **Reference**: V0.1 MVP Definition > Exact scope and requirements
- 📎 **Reference**: Data Architecture > V0.1 core schemas

**Purpose**: Zero-to-coding setup guide for immediate V0.1 development start

---

## 🎯 Setup Philosophy

### **Day 1 Coding Goal**
By the end of this setup process, you should be able to:
- Run the Meal Master AI app on your device via Expo Go
- Make changes to code and see them immediately
- Connect to Supabase database and insert test data
- Make OpenAI API calls and see responses
- Navigate between all 3 V0.1 screens

### **Setup Priority Order**
1. **Core Development Tools** - Essential for any React Native development
2. **Expo Project Creation** - Get the app running immediately
3. **Supabase Configuration** - Database and real-time functionality
4. **AI Integration Setup** - OpenAI SDK and API keys
5. **External API Setup** - Spoonacular and USDA integration
6. **Development Workflow** - Testing, debugging, and deployment prep

---

## 🛠️ Core Development Tools Setup

### **1. Node.js and Package Manager**
```bash
# Install Node.js 18+ (required for Expo)
# Download from https://nodejs.org/ or use nvm

# Verify installation
node --version  # Should be 18.0.0 or higher
npm --version   # Should be 9.0.0 or higher

# Install Yarn (optional but recommended for faster installs)
npm install -g yarn
yarn --version
```

### **2. Expo CLI and Development Tools**
```bash
# Install Expo CLI globally
npm install -g @expo/cli
npm install -g eas-cli

# Verify installation
expo --version
eas --version

# Install Expo Go app on your phone
# iOS: App Store "Expo Go"
# Android: Google Play "Expo Go"
```

### **3. Code Editor Setup (VS Code)**
```bash
# Install VS Code extensions for optimal React Native development
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-json
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-eslint
code --install-extension expo.vscode-expo-tools
```

**VS Code Settings Configuration**:
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "typescriptreact",
    "javascript": "javascriptreact"
  }
}
```

---

## 📱 Expo Project Creation

### **1. Create Meal Master AI Project**
```bash
# Create new Expo project with TypeScript
npx create-expo-app MealMasterAI --template blank-typescript

# Navigate to project directory
cd MealMasterAI

# Install essential dependencies
npx expo install expo-router expo-constants expo-secure-store
npx expo install react-native-reanimated react-native-gesture-handler
npx expo install @react-navigation/native @react-navigation/bottom-tabs
npx expo install react-native-gifted-chat
npx expo install react-native-svg expo-haptics

# Install state management and API libraries
yarn add zustand
yarn add @tanstack/react-query
yarn add openai

# Install development dependencies
yarn add -D @types/react @types/react-native
yarn add -D eslint @typescript-eslint/eslint-plugin
yarn add -D prettier eslint-config-prettier
```

### **2. Project Structure Setup**
```bash
# Create organized folder structure
mkdir -p src/{components,screens,stores,services,types,utils}
mkdir -p src/components/{atoms,molecules,organisms}
mkdir -p src/services/{ai,api,database}

# Project structure should look like:
# src/
# ├── components/
# │   ├── atoms/        # Basic UI components
# │   ├── molecules/    # Composed components
# │   └── organisms/    # Complex components
# ├── screens/          # Screen components
# ├── stores/           # Zustand stores
# ├── services/         # API and external service integrations
# ├── types/            # TypeScript type definitions
# └── utils/            # Helper functions
```

### **3. Basic App Configuration**
```json
// app.json
{
  "expo": {
    "name": "Meal Master AI",
    "slug": "meal-master-ai",
    "version": "0.1.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.mealmaster.ai"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.mealmaster.ai"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store"
    ]
  }
}
```

### **4. TypeScript Configuration**
```json
// tsconfig.json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/screens/*": ["src/screens/*"],
      "@/stores/*": ["src/stores/*"],
      "@/services/*": ["src/services/*"],
      "@/types/*": ["src/types/*"],
      "@/utils/*": ["src/utils/*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts"
  ]
}
```

### **5. Environment Variables Setup**
```bash
# Create environment configuration
touch .env.local
touch .env.example

# Add to .gitignore
echo ".env.local" >> .gitignore
```

```bash
# .env.example (template for others)
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key
EXPO_PUBLIC_SPOONACULAR_API_KEY=your_spoonacular_api_key
EXPO_PUBLIC_USDA_API_KEY=your_usda_api_key
```

### **6. Test Initial Setup**
```bash
# Start development server
npx expo start

# Should see QR code in terminal
# Scan with Expo Go app on your phone
# Should see default Expo app running
```

---

## 🗄️ Supabase Configuration

### **1. Create Supabase Project**
```bash
# Go to https://supabase.com
# Create new project: "MealMasterAI"
# Choose region closest to you
# Generate strong password and save it securely
```

### **2. Install Supabase Client**
```bash
# Install Supabase JavaScript client
yarn add @supabase/supabase-js

# Install optional Supabase CLI for local development
npm install -g supabase
```

### **3. Database Schema Setup**
**Navigate to Supabase Dashboard > SQL Editor and run:**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscription_status VARCHAR(50) DEFAULT 'free',
  onboarding_completed BOOLEAN DEFAULT false
);

-- Create user_preferences table
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  daily_calorie_goal INTEGER DEFAULT 2000,
  protein_goal INTEGER DEFAULT 150,
  carb_goal INTEGER DEFAULT 200,
  fat_goal INTEGER DEFAULT 65,
  dietary_restrictions TEXT[] DEFAULT '{}',
  activity_level VARCHAR(20) DEFAULT 'moderate',
  primary_goal VARCHAR(30) DEFAULT 'maintain',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create foods_master table
CREATE TABLE public.foods_master (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spoonacular_id VARCHAR(50),
  usda_id VARCHAR(50),
  food_name VARCHAR(255) NOT NULL,
  brand_name VARCHAR(255),
  food_category VARCHAR(100),
  calories_per_100g DECIMAL(8,2),
  protein_per_100g DECIMAL(8,2),
  carbs_per_100g DECIMAL(8,2),
  fat_per_100g DECIMAL(8,2),
  fiber_per_100g DECIMAL(8,2),
  common_portion_name VARCHAR(100),
  common_portion_grams DECIMAL(8,2),
  allergens TEXT[] DEFAULT '{}',
  data_source VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_meals table
CREATE TABLE public.daily_meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  food_id UUID REFERENCES public.foods_master(id),
  meal_type VARCHAR(20) NOT NULL,
  quantity_grams DECIMAL(8,2) NOT NULL,
  calories DECIMAL(8,2) NOT NULL,
  protein DECIMAL(8,2) NOT NULL,
  carbs DECIMAL(8,2) NOT NULL,
  fat DECIMAL(8,2) NOT NULL,
  meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ai_confidence DECIMAL(3,2) DEFAULT 1.00,
  user_confirmed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_conversations table
CREATE TABLE public.user_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  is_user_message BOOLEAN NOT NULL,
  ai_system_source VARCHAR(50),
  conversation_session_id UUID,
  intent_detected VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_requests_log table
CREATE TABLE public.ai_requests_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  ai_system VARCHAR(50) NOT NULL,
  request_type VARCHAR(50) NOT NULL,
  response_time_ms INTEGER NOT NULL,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_daily_meals_user_date ON daily_meals(user_id, meal_date);
CREATE INDEX idx_user_conversations_user_id ON user_conversations(user_id);
CREATE INDEX idx_foods_master_name ON foods_master USING GIN(to_tsvector('english', food_name));

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own data" ON public.users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can view own preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own meals" ON public.daily_meals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own conversations" ON public.user_conversations FOR ALL USING (auth.uid() = user_id);

-- Allow read access to foods_master for all authenticated users
CREATE POLICY "Authenticated users can read foods" ON public.foods_master FOR SELECT USING (auth.role() = 'authenticated');
```

### **4. Supabase Client Configuration**
```typescript
// src/services/database/supabase.ts
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});
```

### **5. Test Database Connection**
```typescript
// Create test file: src/utils/testSupabase.ts
import { supabase } from '@/services/database/supabase';

export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('foods_master')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    console.log('Supabase connection successful!');
    return true;
  } catch (error) {
    console.error('Supabase test failed:', error);
    return false;
  }
}
```

---

## 🤖 AI Integration Setup

### **1. OpenAI API Key Setup**
```bash
# Get API key from https://platform.openai.com/api-keys
# Add to .env.local
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-openai-api-key-here
```

### **2. OpenAI Client Configuration**
```typescript
// src/services/ai/openai-client.ts
import OpenAI from 'openai';
import Constants from 'expo-constants';

class OpenAIClient {
  private client: OpenAI;
  
  constructor() {
    const apiKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }
    
    this.client = new OpenAI({
      apiKey,
    });
  }
  
  async chat(messages: OpenAI.Chat.ChatCompletionMessageParam[], model: string = 'gpt-4o-mini') {
    try {
      const response = await this.client.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });
      
      return {
        success: true,
        data: response.choices[0]?.message?.content || '',
        usage: response.usage,
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const openAIClient = new OpenAIClient();
```

### **3. AI System Base Classes**
```typescript
// src/services/ai/base-ai-system.ts
import { openAIClient } from './openai-client';

export abstract class BaseAISystem {
  protected systemName: string;
  
  constructor(systemName: string) {
    this.systemName = systemName;
  }
  
  protected async callAI(prompt: string, systemPrompt?: string, model: string = 'gpt-4o-mini') {
    const messages = [
      ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
      { role: 'user' as const, content: prompt }
    ];
    
    const startTime = Date.now();
    const result = await openAIClient.chat(messages, model);
    const responseTime = Date.now() - startTime;
    
    // Log AI request for monitoring
    this.logAIRequest(prompt, result, responseTime);
    
    return result;
  }
  
  private async logAIRequest(prompt: string, result: any, responseTime: number) {
    // Implementation will connect to ai_requests_log table
    console.log(`[${this.systemName}] Response time: ${responseTime}ms, Success: ${result.success}`);
  }
}
```

### **4. Test AI Integration**
```typescript
// src/utils/testAI.ts
import { openAIClient } from '@/services/ai/openai-client';

export async function testOpenAIConnection() {
  try {
    const result = await openAIClient.chat([
      { role: 'user', content: 'Say "AI connection successful!" if you can read this.' }
    ]);
    
    if (result.success) {
      console.log('OpenAI response:', result.data);
      return true;
    } else {
      console.error('OpenAI error:', result.error);
      return false;
    }
  } catch (error) {
    console.error('OpenAI test failed:', error);
    return false;
  }
}
```

---

## 🍽️ External API Setup

### **1. Spoonacular API Configuration**
```bash
# Get free API key from https://spoonacular.com/food-api
# Free tier: 150 requests/day
# Add to .env.local
EXPO_PUBLIC_SPOONACULAR_API_KEY=your-spoonacular-api-key
```

```typescript
// src/services/api/spoonacular-client.ts
import Constants from 'expo-constants';

class SpoonacularClient {
  private apiKey: string;
  private baseUrl = 'https://api.spoonacular.com';
  private requestCount = 0;
  private dailyLimit = 150;
  
  constructor() {
    const apiKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SPOONACULAR_API_KEY;
    if (!apiKey) {
      throw new Error('Spoonacular API key not found');
    }
    this.apiKey = apiKey;
  }
  
  async searchIngredients(query: string) {
    if (this.requestCount >= this.dailyLimit) {
      throw new Error('Spoonacular daily limit reached');
    }
    
    try {
      const response = await fetch(
        `${this.baseUrl}/food/ingredients/search?query=${encodeURIComponent(query)}&number=10&apiKey=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`Spoonacular API error: ${response.status}`);
      }
      
      this.requestCount++;
      return await response.json();
    } catch (error) {
      console.error('Spoonacular API error:', error);
      throw error;
    }
  }
  
  async getIngredientInfo(id: number) {
    if (this.requestCount >= this.dailyLimit) {
      throw new Error('Spoonacular daily limit reached');
    }
    
    try {
      const response = await fetch(
        `${this.baseUrl}/food/ingredients/${id}/information?apiKey=${this.apiKey}&amount=100&unit=grams`
      );
      
      if (!response.ok) {
        throw new Error(`Spoonacular API error: ${response.status}`);
      }
      
      this.requestCount++;
      return await response.json();
    } catch (error) {
      console.error('Spoonacular ingredient info error:', error);
      throw error;
    }
  }
}

export const spoonacularClient = new SpoonacularClient();
```

### **2. USDA API Configuration**
```bash
# Get free API key from https://fdc.nal.usda.gov/api-key-signup.html
# Add to .env.local
EXPO_PUBLIC_USDA_API_KEY=your-usda-api-key
```

```typescript
// src/services/api/usda-client.ts
import Constants from 'expo-constants';

class USDAClient {
  private apiKey: string;
  private baseUrl = 'https://api.nal.usda.gov/fdc/v1';
  
  constructor() {
    const apiKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_USDA_API_KEY;
    if (!apiKey) {
      throw new Error('USDA API key not found');
    }
    this.apiKey = apiKey;
  }
  
  async searchFoods(query: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/foods/search?query=${encodeURIComponent(query)}&pageSize=10&api_key=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('USDA API error:', error);
      throw error;
    }
  }
}

export const usdaClient = new USDAClient();
```

---

## 🏪 State Management Setup

### **1. Zustand Store Configuration**
```typescript
// src/stores/ai-store.ts
import { create } from 'zustand';

interface AIState {
  isProcessing: boolean;
  currentSystem: string | null;
  error: string | null;
  lastResponse: string | null;
  
  setProcessing: (system: string) => void;
  setComplete: (response?: string) => void;
  setError: (error: string) => void;
  clearError: () => void;
}

export const useAIStore = create<AIState>((set) => ({
  isProcessing: false,
  currentSystem: null,
  error: null,
  lastResponse: null,
  
  setProcessing: (system: string) => set({
    isProcessing: true,
    currentSystem: system,
    error: null
  }),
  
  setComplete: (response?: string) => set({
    isProcessing: false,
    currentSystem: null,
    lastResponse: response || null
  }),
  
  setError: (error: string) => set({
    isProcessing: false,
    currentSystem: null,
    error
  }),
  
  clearError: () => set({ error: null })
}));
```

```typescript
// src/stores/meal-store.ts
import { create } from 'zustand';

interface Meal {
  id: string;
  food_name: string;
  meal_type: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged_at: string;
}

interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealState {
  todaysMeals: Meal[];
  dailyTotals: DailyTotals;
  isLoading: boolean;
  
  addMeal: (meal: Meal) => void;
  updateMeal: (mealId: string, updates: Partial<Meal>) => void;
  setMeals: (meals: Meal[]) => void;
  calculateTotals: () => void;
  setLoading: (loading: boolean) => void;
}

export const useMealStore = create<MealState>((set, get) => ({
  todaysMeals: [],
  dailyTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  isLoading: false,
  
  addMeal: (meal: Meal) => set((state) => {
    const newMeals = [...state.todaysMeals, meal];
    const newTotals = calculateDailyTotals(newMeals);
    return {
      todaysMeals: newMeals,
      dailyTotals: newTotals
    };
  }),
  
  updateMeal: (mealId: string, updates: Partial<Meal>) => set((state) => {
    const newMeals = state.todaysMeals.map(meal =>
      meal.id === mealId ? { ...meal, ...updates } : meal
    );
    const newTotals = calculateDailyTotals(newMeals);
    return {
      todaysMeals: newMeals,
      dailyTotals: newTotals
    };
  }),
  
  setMeals: (meals: Meal[]) => set(() => {
    const newTotals = calculateDailyTotals(meals);
    return {
      todaysMeals: meals,
      dailyTotals: newTotals
    };
  }),
  
  calculateTotals: () => set((state) => ({
    dailyTotals: calculateDailyTotals(state.todaysMeals)
  })),
  
  setLoading: (loading: boolean) => set({ isLoading: loading })
}));

function calculateDailyTotals(meals: Meal[]): DailyTotals {
  return meals.reduce(
    (totals, meal) => ({
      calories: totals.calories + meal.calories,
      protein: totals.protein + meal.protein,
      carbs: totals.carbs + meal.carbs,
      fat: totals.fat + meal.fat
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}
```

```typescript
// src/stores/user-store.ts
import { create } from 'zustand';

interface UserGoals {
  daily_calorie_goal: number;
  protein_goal: number;
  carb_goal: number;
  fat_goal: number;
}

interface User {
  id: string;
  email: string;
  onboarding_completed: boolean;
}

interface UserState {
  user: User | null;
  goals: UserGoals;
  isAuthenticated: boolean;
  
  setUser: (user: User | null) => void;
  setGoals: (goals: UserGoals) => void;
  setAuthenticated: (authenticated: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  goals: {
    daily_calorie_goal: 2000,
    protein_goal: 150,
    carb_goal: 200,
    fat_goal: 65
  },
  isAuthenticated: false,
  
  setUser: (user: User | null) => set({ user }),
  setGoals: (goals: UserGoals) => set({ goals }),
  setAuthenticated: (authenticated: boolean) => set({ isAuthenticated: authenticated })
}));
```

---

## 📱 Basic UI Setup

### **1. Navigation Setup**
```typescript
// src/navigation/AppNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from '@/screens/DashboardScreen';
import ChatScreen from '@/screens/ChatScreen';
import PlansScreen from '@/screens/PlansScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Dashboard') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Chat') {
              iconName = focused ? 'chatbubble' : 'chatbubble-outline';
            } else if (route.name === 'Plans') {
              iconName = focused ? 'calendar' : 'calendar-outline';
            } else {
              iconName = 'help-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#4F46E5',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Chat" component={ChatScreen} />
        <Tab.Screen name="Plans" component={PlansScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

### **2. Basic Screen Templates**
```typescript
// src/screens/DashboardScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useMealStore } from '@/stores/meal-store';
import { useUserStore } from '@/stores/user-store';

export default function DashboardScreen() {
  const { todaysMeals, dailyTotals, isLoading } = useMealStore();
  const { goals } = useUserStore();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Progress</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.macroRings}>
        <MacroRing
          label="Calories"
          current={dailyTotals.calories}
          goal={goals.daily_calorie_goal}
          color="#FF6B6B"
        />
        <MacroRing
          label="Protein"
          current={dailyTotals.protein}
          goal={goals.protein_goal}
          color="#4ECDC4"
        />
        <MacroRing
          label="Carbs"
          current={dailyTotals.carbs}
          goal={goals.carb_goal}
          color="#45B7D1"
        />
        <MacroRing
          label="Fat"
          current={dailyTotals.fat}
          goal={goals.fat_goal}
          color="#F9CA24"
        />
      </View>

      <View style={styles.mealsSection}>
        <Text style={styles.sectionTitle}>Today's Meals</Text>
        {todaysMeals.length === 0 ? (
          <Text style={styles.emptyState}>No meals logged yet today</Text>
        ) : (
          todaysMeals.map((meal) => (
            <MealCard key={meal.id} meal={meal} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

// Placeholder components - will be implemented in Week 3
function MacroRing({ label, current, goal, color }: any) {
  const percentage = Math.min((current / goal) * 100, 100);
  
  return (
    <View style={styles.macroRing}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>{Math.round(current)}/{goal}</Text>
      <Text style={styles.macroPercent}>{Math.round(percentage)}%</Text>
    </View>
  );
}

function MealCard({ meal }: any) {
  return (
    <View style={styles.mealCard}>
      <Text style={styles.mealName}>{meal.food_name}</Text>
      <Text style={styles.mealMacros}>
        {Math.round(meal.calories)} cal • {Math.round(meal.protein)}g protein
      </Text>
      <Text style={styles.mealTime}>
        {new Date(meal.logged_at).toLocaleTimeString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  date: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  macroRings: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  macroRing: {
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  macroPercent: {
    fontSize: 12,
    color: '#4F46E5',
    marginTop: 2,
  },
  mealsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  emptyState: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 16,
    marginTop: 20,
  },
  mealCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  mealMacros: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  mealTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
```

```typescript
// src/screens/ChatScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { useAIStore } from '@/stores/ai-store';

export default function ChatScreen() {
  const [messages, setMessages] = useState<IMessage[]>([
    {
      _id: 1,
      text: 'Hello! I\'m your nutrition coach. Tell me what you ate and I\'ll help you track your macros!',
      createdAt: new Date(),
      user: {
        _id: 2,
        name: 'Meal Master AI',
        avatar: '🤖',
      },
    },
  ]);

  const { isProcessing, currentSystem } = useAIStore();

  const onSend = (newMessages: IMessage[] = []) => {
    setMessages(previousMessages => GiftedChat.append(previousMessages, newMessages));
    
    // TODO: Process user message with AI systems
    const userMessage = newMessages[0];
    processUserMessage(userMessage.text);
  };

  const processUserMessage = async (text: string) => {
    // Placeholder for AI processing - will be implemented in Week 2
    console.log('Processing user message:', text);
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse: IMessage = {
        _id: Math.round(Math.random() * 1000000),
        text: 'I received your message! AI processing will be implemented in Week 2.',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'Meal Master AI',
          avatar: '🤖',
        },
      };
      setMessages(previousMessages => GiftedChat.append(previousMessages, [aiResponse]));
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{
          _id: 1,
        }}
        showUserAvatar={false}
        isTyping={isProcessing}
        placeholder={isProcessing ? `AI is ${currentSystem}...` : "Tell me what you ate..."}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
});
```

```typescript
// src/screens/PlansScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function PlansScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🍽️ Meal Planning</Text>
        <Text style={styles.subtitle}>Coming Soon in V0.3!</Text>
        
        <Text style={styles.description}>
          We're working on intelligent meal planning features that will help you:
        </Text>
        
        <View style={styles.featureList}>
          <Text style={styles.feature}>• Generate personalized meal plans</Text>
          <Text style={styles.feature}>• Get recipe recommendations</Text>
          <Text style={styles.feature}>• Create automatic grocery lists</Text>
          <Text style={styles.feature}>• Plan for your macro goals</Text>
        </View>
        
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Get Notified When Ready</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: 60,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#4F46E5',
    fontWeight: '600',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  featureList: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  feature: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
    paddingLeft: 20,
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### **3. Update App.tsx**
```typescript
// App.tsx
import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return <AppNavigator />;
}
```

---

## 📁 Project File Structure Setup

### **V0.1 Optimized Architecture**
Create the following folder structure to ensure scalable, maintainable development:

```bash
# Create the complete project structure
mkdir -p src/{components,screens,services,stores,types,utils,navigation}
mkdir -p src/components/{atoms,molecules,organisms}
mkdir -p src/services/{ai,api,database}

# Your project structure should look like:
src/
├── components/
│   ├── atoms/           # Basic UI elements (Button, Input, MacroRing)
│   ├── molecules/       # Composed components (MealCard, ChatMessage)
│   └── organisms/       # Complex sections (MacroSection, ChatInterface)
├── screens/            # Screen components (Dashboard, Chat, Plans)
├── services/           # External integrations (AI, API, Database)
│   ├── ai/            # AI system implementations
│   ├── api/           # External API clients
│   └── database/      # Supabase integration
├── stores/            # Zustand state management
├── types/             # TypeScript definitions
├── utils/             # Helper functions and constants
└── navigation/        # Navigation configuration
```

### **Detailed File Structure with Purpose**

#### **Components Layer (Atomic Design)**
```typescript
// src/components/atoms/
Button.tsx              // Reusable button with brand styling
Input.tsx               // Text input with glass styling
MacroRing.tsx           // Circular progress ring for macros
ProgressBar.tsx         // Linear progress bar for calories
Chip.tsx                // Rounded chip for quick actions

// src/components/molecules/
MealCard.tsx            // Individual meal display card
ChatMessage.tsx         // Chat bubble component
QuickAction.tsx         // Quick action button with icon
MacroDisplay.tsx        // Macro value with label and target
LoadingSpinner.tsx      // AI processing indicator

// src/components/organisms/
MacroSection.tsx        // Complete macro rings + calorie bar
MealsList.tsx           // Today's meals list with empty state
ChatInterface.tsx       // Complete chat UI with input
DashboardHeader.tsx     // Header with greeting and profile
QuickActionsGrid.tsx    // Grid of quick action buttons
```

#### **Screens Layer (Navigation Destinations)**
```typescript
// src/screens/
DashboardScreen.tsx     // Main dashboard with macro tracking
ChatScreen.tsx          // AI conversation interface
PlansScreen.tsx         // Placeholder for V0.3 features
OnboardingScreen.tsx    // Goal setting (if needed for V0.1)
```

#### **Services Layer (External Integrations)**
```typescript
// src/services/ai/
AISystemManager.ts      // Orchestrates all AI systems
UserFacingAI.ts         // Conversational interface AI
FoodRecognitionAI.ts    // Food description to nutrition data
MacroCalculatorAI.ts    // Nutrition calculations and insights
DataValidationGateway.ts // Database write validation
ErrorHandlerSystem.ts   // Graceful failure management

// src/services/api/
spoonacular.ts          // Spoonacular API client
usda.ts                 // USDA FoodData Central client
nutritionCache.ts       // API response caching

// src/services/database/
supabase.ts             // Supabase client configuration
queries.ts              // Database query functions
realtime.ts             // Real-time subscription setup
```

#### **Stores Layer (State Management)**
```typescript
// src/stores/
aiStore.ts              // AI processing states and errors
mealStore.ts            // Daily meals and nutrition totals
userStore.ts            // User profile and goals
conversationStore.ts    // Chat history and context
```

#### **Types Layer (TypeScript Definitions)**
```typescript
// src/types/
meal.ts                 // Meal, DailyTotals, NutritionData types
user.ts                 // User, UserPreferences, Goals types
ai.ts                   // AIResponse, SystemStates types
api.ts                  // External API response types
navigation.ts           // Navigation stack types
```

#### **Utils Layer (Helper Functions)**
```typescript
// src/utils/
calculations.ts         // Macro calculations and conversions
formatting.ts           // Date, time, number formatting
constants.ts            // App constants and configuration
validation.ts           // Data validation helpers
theme.ts                // Brand colors and styling constants
```

#### **Navigation Layer**
```typescript
// src/navigation/
AppNavigator.tsx        // Bottom tab navigation setup
navigationTypes.ts      // Navigation parameter types
```

### **File Structure Benefits for V0.1**

**Immediate Development Benefits**:
- Clear separation between UI components and business logic
- Easy to find any piece of functionality
- TypeScript definitions prevent type errors
- Service layer abstracts API complexity

**Scalability for V0.2+**:
- New AI systems go in services/ai/
- New screens fit naturally in screens/
- Component library grows organically
- Store pattern scales to any state needs

**Maintenance Advantages**:
- Each file has single responsibility
- Easy to test individual components
- Refactoring is safer with clear boundaries
- New team members understand structure immediately

### **Setup Commands**
```bash
# Create the structure
mkdir -p src/{components/{atoms,molecules,organisms},screens,services/{ai,api,database},stores,types,utils,navigation}

# Create placeholder files to maintain structure
touch src/components/atoms/Button.tsx
touch src/components/molecules/MealCard.tsx
touch src/components/organisms/MacroSection.tsx
touch src/screens/DashboardScreen.tsx
touch src/services/ai/AISystemManager.ts
touch src/stores/aiStore.ts
touch src/types/meal.ts
touch src/utils/constants.ts
touch src/navigation/AppNavigator.tsx

# Verify structure
tree src/
```

---

## 🧪 Testing & Verification

### **1. Connection Test Script**
```typescript
// src/utils/setupTests.ts
import { testSupabaseConnection } from './testSupabase';
import { testOpenAIConnection } from './testAI';

export async function runSetupTests() {
  console.log('🧪 Running setup verification tests...\n');
  
  // Test Supabase connection
  console.log('📊 Testing Supabase connection...');
  const supabaseOk = await testSupabaseConnection();
  console.log(`Supabase: ${supabaseOk ? '✅ Connected' : '❌ Failed'}\n`);
  
  // Test OpenAI connection
  console.log('🤖 Testing OpenAI connection...');
  const openaiOk = await testOpenAIConnection();
  console.log(`OpenAI: ${openaiOk ? '✅ Connected' : '❌ Failed'}\n`);
  
  // Summary
  if (supabaseOk && openaiOk) {
    console.log('🎉 All connections successful! Ready to start development.');
  } else {
    console.log('⚠️ Some connections failed. Check your API keys and configuration.');
  }
  
  return { supabaseOk, openaiOk };
}
```

### **2. Add Test Button to Dashboard**
```typescript
// Add to DashboardScreen.tsx temporarily
import { runSetupTests } from '@/utils/setupTests';

// Add button in the header section
<TouchableOpacity 
  style={{ backgroundColor: '#4F46E5', padding: 8, borderRadius: 4, marginTop: 8 }}
  onPress={runSetupTests}
>
  <Text style={{ color: 'white', textAlign: 'center' }}>Test Connections</Text>
</TouchableOpacity>
```

---

## 🚀 Final Verification Checklist

### **Environment Setup Complete When:**
- [ ] Expo app runs on your device via QR code
- [ ] Can navigate between all 3 screens (Dashboard, Chat, Plans)
- [ ] Supabase connection test passes
- [ ] OpenAI connection test passes
- [ ] Can insert test data into Supabase tables
- [ ] Zustand stores work (can add/view test meals)
- [ ] TypeScript compilation has no errors
- [ ] Git repository initialized with proper .gitignore

### **Ready for Week 1 Development When:**
- [ ] All connection tests pass
- [ ] Basic UI components render correctly
- [ ] Can make changes and see them immediately in Expo Go
- [ ] API keys are secure and working
- [ ] Database schema is deployed and accessible
- [ ] Development workflow is smooth and fast

### **Final Setup Commands:**
```bash
# Initialize git repository
git init
git add .
git commit -m "Initial Meal Master AI V0.1 setup"

# Start development server
npx expo start

# Test on device
# Scan QR code with Expo Go app
# Verify all screens load and connection tests pass
```

---

## 🎯 Day 1 Success Criteria

**You're ready to start V0.1 development when you can:**

1. **Run the app**: Scan QR code, see all 3 screens working
2. **Test connections**: Supabase and OpenAI both respond successfully  
3. **Navigate smoothly**: Bottom tabs work, screens load quickly
4. **Make changes**: Edit code, see updates immediately
5. **View data**: Basic meal store functionality works

**If any of these fail, fix them before starting Week 1 development. A solid foundation prevents days of debugging later.**

This setup provides everything needed for immediate V0.1 development start with zero configuration delays on Day 1.