// src/stores/user-store.ts
import { create } from 'zustand';
import { computeMacros, type Goal, type UserProfile, type MacroTargets } from '../services/macros/engine';

// Privacy consent types
export interface PrivacyConsents {
  dataCollection: boolean;
  analytics: boolean;
  crashReporting: boolean;
  aiProcessing: boolean;
  marketing?: boolean;
  consentDate: number;
  version: string;
}

// V0.1 Core User Data Types
interface UserGoals {
  daily_calorie_goal: number;
  protein_goal: number;
  carb_goal: number;
  fat_goal: number;
  fiber_goal: number;

  // Macro engine integration
  goal_type?: Goal; // 'weight_loss' | 'maintenance' | 'muscle_gain' | 'body_recomposition'
  macro_engine_version?: string; // Policy version used for calculation
  last_calculated?: string; // ISO timestamp of last macro calculation
  calculation_rationale?: string[]; // Debug rationale from macro engine

  // V0.2+ Advanced Goals (Expansion Hooks)
  weight_goal?: number;
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  dietary_restrictions?: string[];
  health_conditions?: string[];
}

interface User {
  id: string;
  email: string;
  name: string;
  onboarding_completed: boolean;

  // V0.2+ Enhanced Profile (Expansion Hooks)
  age?: number;
  height?: number; // cm
  weight?: number; // kg
  sex?: 'male' | 'female' | 'other'; // Updated to match macro engine
  gender?: 'male' | 'female' | 'other'; // Deprecated, use sex
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  timezone?: string;
  preferred_units?: 'metric' | 'imperial';

  // V0.3+ Advanced Features
  subscription_status?: 'free' | 'premium' | 'enterprise';
  coaching_preferences?: any;
  health_integrations?: string[]; // 'apple_health', 'google_fit', etc.
}

// V0.2+ AI Personalization Types (Future)
interface UserPersonalization {
  communication_style: 'casual' | 'professional' | 'encouraging' | 'direct';
  ai_personality_preferences: string[];
  learning_adaptations: Record<string, any>;
  behavioral_patterns: Record<string, any>;
}

// V0.2+ Context & Session Management (Future)
interface UserSession {
  loginTime: number;
  lastActivity: number;
  currentStreak: number;
  sessionGoals: string[];
  contextualData: Record<string, any>; // Location, time-based preferences, etc.
}

// Onboarding State Management
interface OnboardingState {
  phase: 'profile' | 'goals' | 'preferences' | 'tutorial' | 'completed';
  step: number;
  collectedData: {
    age?: number;
    gender?: 'male' | 'female' | 'other';
    height_cm?: number;
    weight_kg?: number;
    activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
    primary_goal?: 'lose' | 'maintain' | 'bulk';
    dietary_preferences?: string[];
    allergens?: string[];
    restrictions?: string[];
  };
  calculatedGoals?: UserGoals;
  selectedGoalOption?: 'recommended' | 'conservative' | 'aggressive';
}

interface UserState {
  // V0.1 Core State
  user: User | null;
  goals: UserGoals;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // V0.2+ Enhanced State (Expansion Hooks)
  personalization: UserPersonalization;
  session: UserSession | null;
  preferences: Record<string, any> & {
    aiChatEnabled?: boolean;
  };
  achievements: string[];
  onboardingState: OnboardingState;
  
  // AI Features State
  aiChatEnabled: boolean;
  aiSuggestionsEnabled: boolean;
  dataPrivacyMode: boolean;
  completedMilestones: string[];
  userEngagement: number;
  isConnected: boolean;

  // Privacy Consent State
  privacyConsents: PrivacyConsents | null;
  needsPrivacyConsent: boolean;
  
  // V0.1 Core Actions
  setUser: (user: User | null) => void;
  setGoals: (goals: UserGoals) => void;
  updateGoal: (key: keyof UserGoals, value: number) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  completeOnboarding: () => void;
  
  // Macro Engine Actions
  calculateMacros: (goalType: Goal, force?: boolean) => Promise<void>;
  setGoalType: (goalType: Goal) => Promise<void>;
  needsMacroRecalculation: () => boolean;
  getMacroCalculationStatus: () => {
    hasValidCalculation: boolean;
    lastCalculated?: string;
    engineVersion?: string;
    rationale?: string[];
  };

  // V0.2+ Enhanced Actions (Future Implementation Hooks)
  updatePersonalization: (updates: Partial<UserPersonalization>) => void;
  startSession: () => void;
  updateSessionActivity: () => void;
  endSession: () => void;
  setPreference: (key: string, value: any) => void;
  addAchievement: (achievement: string) => void;
  updateProfile: (updates: Partial<User>) => void;
  
  // Onboarding helpers
  needsOnboarding: () => boolean;
  dismissOnboarding: () => void;
  startOnboarding: () => void;
  updateOnboardingData: (data: Partial<OnboardingState['collectedData']>) => void;
  updateOnboardingGoals: (goals: UserGoals) => void;
  updateOnboardingGoalSelection: (selection: 'recommended' | 'conservative' | 'aggressive') => void;
  advanceOnboardingStep: () => void;
  completeOnboardingPhase: (nextPhase: OnboardingState['phase']) => void;
  
  // AI Features Actions
  updateAISettings: (settings: {
    aiChatEnabled?: boolean;
    aiSuggestionsEnabled?: boolean;
    dataPrivacyMode?: boolean;
  }) => void;
  updateMilestone: (milestone: string) => void;
  incrementUserEngagement: () => void;
  setConnected: (connected: boolean) => void;

  // Privacy Consent Actions
  setPrivacyConsents: (consents: PrivacyConsents) => void;
  hasValidConsent: () => boolean;
  
  // V0.3+ Advanced Actions (Future)
  syncHealthData: (source: string, data: any) => void;
  updateSubscription: (status: User['subscription_status']) => void;
  exportUserData: () => Promise<any>;
  deleteUserData: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  // V0.1 Core State
  user: null,
  goals: {
    daily_calorie_goal: 2400,
    protein_goal: 180,
    carb_goal: 180,
    fat_goal: 85,
    fiber_goal: 65
  },
  isAuthenticated: false,
  isLoading: false,
  
  // V0.2+ Enhanced State (Initialize with Defaults)
  personalization: {
    communication_style: 'encouraging',
    ai_personality_preferences: [],
    learning_adaptations: {},
    behavioral_patterns: {}
  },
  session: null,
  preferences: {
    notifications_enabled: true,
    dark_mode: false,
    metric_units: true,
    language: 'en',
    onboarding_dismissed: false,
    aiChatEnabled: false
  },
  achievements: [],
  onboardingState: {
    phase: 'profile',
    step: 1,
    collectedData: {},
    calculatedGoals: undefined,
    selectedGoalOption: undefined
  },
  
  // AI Features State (Initialize)
  aiChatEnabled: false,
  aiSuggestionsEnabled: true,
  dataPrivacyMode: false,
  completedMilestones: [],
  userEngagement: 0,
  isConnected: true,

  // Privacy Consent State (Initialize)
  privacyConsents: null,
  needsPrivacyConsent: true, // Default to true for new users
  
  // V0.1 Core Actions
  setUser: (user: User | null) => set({ user }),
  
  setGoals: (goals: UserGoals) => set({ goals }),
  
  updateGoal: (key: keyof UserGoals, value: number) => set((state) => ({
    goals: {
      ...state.goals,
      [key]: value
    }
  })),
  
  setAuthenticated: (authenticated: boolean) => set({ 
    isAuthenticated: authenticated,
    // Initialize session on login
    session: authenticated ? {
      loginTime: Date.now(),
      lastActivity: Date.now(),
      currentStreak: 0,
      sessionGoals: [],
      contextualData: {}
    } : null
  }),
  
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  
  completeOnboarding: () => set((state) => ({
    user: state.user ? { ...state.user, onboarding_completed: true } : null
  })),
  
  // V0.2+ Enhanced Actions (Future Implementation)
  updatePersonalization: (updates: Partial<UserPersonalization>) => set((state) => ({
    personalization: {
      ...state.personalization,
      ...updates
    }
  })),
  
  startSession: () => {
    const now = Date.now();
    set({
      session: {
        loginTime: now,
        lastActivity: now,
        currentStreak: 0,
        sessionGoals: [],
        contextualData: {
          startTime: now,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      }
    });
  },
  
  updateSessionActivity: () => set((state) => ({
    session: state.session ? {
      ...state.session,
      lastActivity: Date.now()
    } : null
  })),
  
  endSession: () => {
    const session = get().session;
    if (session) {
      // Could log session data here for analytics
      console.log(`Session ended. Duration: ${Date.now() - session.loginTime}ms`);
    }
    set({ session: null });
  },
  
  setPreference: (key: string, value: any) => set((state) => ({
    preferences: {
      ...state.preferences,
      [key]: value
    }
  })),
  
  addAchievement: (achievement: string) => set((state) => ({
    achievements: [...state.achievements, achievement]
  })),
  
  updateProfile: (updates: Partial<User>) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null
    }));
    // Trigger macro recalculation if profile changes affect calculations
    const affectedFields = ['age', 'height', 'weight', 'sex', 'preferred_units'];
    if (Object.keys(updates).some(key => affectedFields.includes(key))) {
      const state = get();
      if (state.goals.goal_type && state.needsMacroRecalculation()) {
        console.log('Profile change detected, triggering macro recalculation');
        state.calculateMacros(state.goals.goal_type, true);
      }
    }
  },

  // Macro Engine Implementation
  calculateMacros: async (goalType: Goal, force = false) => {
    const state = get();

    // Check if recalculation is needed
    if (!force && !state.needsMacroRecalculation()) {
      console.log('Macro calculation skipped - no changes detected');
      return;
    }

    const user = state.user;
    if (!user || !user.age || !user.height || !user.weight || !user.sex) {
      console.warn('Cannot calculate macros - missing required profile data');
      return;
    }

    try {
      // Convert user data to macro engine profile format
      const profile: UserProfile = {
        sex: user.sex,
        age_years: user.age,
        height: {
          value: user.height,
          unit: 'cm' // Internal storage is always cm
        },
        weight: {
          value: user.weight,
          unit: 'kg' // Internal storage is always kg
        },
        activity_level: user.activity_level || 'moderate',
        unit_system_preference: user.preferred_units || 'metric'
      };

      console.log('Computing macros with profile:', {
        sex: profile.sex,
        age: profile.age_years,
        weight: `${profile.weight.value}${profile.weight.unit}`,
        height: `${profile.height.value}${profile.height.unit}`,
        activity: profile.activity_level,
        goal: goalType
      });

      const macroTargets = computeMacros(profile, goalType);

      // Log rationale for debugging
      console.group('🎯 Macro Calculation Results');
      console.log('Targets:', {
        calories: macroTargets.kcal_target,
        protein: `${macroTargets.protein_g}g`,
        carbs: `${macroTargets.carb_g}g`,
        fat: `${macroTargets.fat_g}g`,
        fiber: `${macroTargets.fiber_g}g`
      });
      console.log('Rationale:');
      macroTargets.rationale.forEach((reason, index) => {
        console.log(`  ${index + 1}. ${reason}`);
      });
      console.groupEnd();

      // Update goals with calculated values
      set((state) => ({
        goals: {
          ...state.goals,
          daily_calorie_goal: macroTargets.kcal_target,
          protein_goal: macroTargets.protein_g,
          carb_goal: macroTargets.carb_g,
          fat_goal: macroTargets.fat_g,
          fiber_goal: macroTargets.fiber_g,
          goal_type: goalType,
          macro_engine_version: '1.0.0', // From POLICY_DEFAULTS
          last_calculated: new Date().toISOString(),
          calculation_rationale: macroTargets.rationale
        }
      }));

    } catch (error) {
      console.error('Failed to calculate macros:', error);
    }
  },

  setGoalType: async (goalType: Goal) => {
    set((state) => ({
      goals: {
        ...state.goals,
        goal_type: goalType
      }
    }));
    // Recalculate macros with new goal type
    await get().calculateMacros(goalType, true);
  },

  needsMacroRecalculation: () => {
    const state = get();
    const goals = state.goals;

    // Need recalculation if:
    // 1. Never calculated before
    if (!goals.last_calculated || !goals.macro_engine_version) {
      return true;
    }

    // 2. Policy version changed
    const currentPolicyVersion = '1.0.0'; // From POLICY_DEFAULTS
    if (goals.macro_engine_version !== currentPolicyVersion) {
      return true;
    }

    // 3. Calculated more than 24 hours ago (safety check)
    const lastCalculated = new Date(goals.last_calculated);
    const now = new Date();
    const hoursAgo = (now.getTime() - lastCalculated.getTime()) / (1000 * 60 * 60);
    if (hoursAgo > 24) {
      return true;
    }

    return false;
  },

  getMacroCalculationStatus: () => {
    const state = get();
    const goals = state.goals;

    return {
      hasValidCalculation: !state.needsMacroRecalculation(),
      lastCalculated: goals.last_calculated,
      engineVersion: goals.macro_engine_version,
      rationale: goals.calculation_rationale
    };
  },
  
  // Onboarding helpers
  needsOnboarding: () => {
    const state = get();
    // User needs onboarding if:
    // 1. They haven't dismissed it AND
    // 2. They don't have a complete profile (age, weight, height) OR haven't completed onboarding
    return !state.preferences.onboarding_dismissed && 
           (!state.user?.onboarding_completed || 
            !state.user?.age || 
            !state.user?.weight || 
            !state.user?.height);
  },
  
  dismissOnboarding: () => set((state) => ({
    preferences: {
      ...state.preferences,
      onboarding_dismissed: true
    }
  })),
  
  startOnboarding: () => set({
    onboardingState: {
      phase: 'profile',
      step: 1,
      collectedData: {},
      calculatedGoals: undefined,
      selectedGoalOption: undefined
    }
  }),
  
  updateOnboardingData: (data: Partial<OnboardingState['collectedData']>) => set((state) => ({
    onboardingState: {
      ...state.onboardingState,
      collectedData: {
        ...state.onboardingState.collectedData,
        ...data
      }
    }
  })),
  
  advanceOnboardingStep: () => set((state) => ({
    onboardingState: {
      ...state.onboardingState,
      step: state.onboardingState.step + 1
    }
  })),
  
  completeOnboardingPhase: (nextPhase: OnboardingState['phase']) => set((state) => ({
    onboardingState: {
      ...state.onboardingState,
      phase: nextPhase,
      step: 1
    }
  })),
  
  updateOnboardingGoals: (goals: UserGoals) => set((state) => ({
    onboardingState: {
      ...state.onboardingState,
      calculatedGoals: goals
    }
  })),
  
  updateOnboardingGoalSelection: (selection: 'recommended' | 'conservative' | 'aggressive') => set((state) => ({
    onboardingState: {
      ...state.onboardingState,
      selectedGoalOption: selection
    }
  })),
  
  // AI Features Actions Implementation
  updateAISettings: (settings: {
    aiChatEnabled?: boolean;
    aiSuggestionsEnabled?: boolean;
    dataPrivacyMode?: boolean;
  }) => set((state) => ({
    aiChatEnabled: settings.aiChatEnabled ?? state.aiChatEnabled,
    aiSuggestionsEnabled: settings.aiSuggestionsEnabled ?? state.aiSuggestionsEnabled,
    dataPrivacyMode: settings.dataPrivacyMode ?? state.dataPrivacyMode,
    preferences: {
      ...state.preferences,
      aiChatEnabled: settings.aiChatEnabled ?? state.preferences.aiChatEnabled
    }
  })),
  
  updateMilestone: (milestone: string) => set((state) => ({
    completedMilestones: state.completedMilestones.includes(milestone) 
      ? state.completedMilestones 
      : [...state.completedMilestones, milestone]
  })),
  
  incrementUserEngagement: () => set((state) => ({
    userEngagement: state.userEngagement + 1
  })),
  
  setConnected: (connected: boolean) => set({ isConnected: connected }),

  // Privacy Consent Actions Implementation
  setPrivacyConsents: (consents: PrivacyConsents) => set({
    privacyConsents: consents,
    needsPrivacyConsent: false
  }),

  hasValidConsent: () => {
    const state = get();
    if (!state.privacyConsents) return false;

    // Check if consent is still valid (12 months)
    const twelveMonthsAgo = Date.now() - (12 * 30 * 24 * 60 * 60 * 1000);
    return state.privacyConsents.consentDate > twelveMonthsAgo;
  },
  
  // V0.3+ Advanced Actions (Future Stubs)
  syncHealthData: async (source: string, data: any) => {
    // Future: Integrate with health APIs
    console.log(`Health data sync from ${source}:`, data);
  },
  
  updateSubscription: (status: User['subscription_status']) => set((state) => ({
    user: state.user ? { ...state.user, subscription_status: status } : null
  })),
  
  exportUserData: async () => {
    const state = get();
    return {
      user: state.user,
      goals: state.goals,
      preferences: state.preferences,
      achievements: state.achievements,
      exportDate: new Date().toISOString()
    };
  },
  
  deleteUserData: async () => {
    // Future: Implement GDPR-compliant data deletion
    set({
      user: null,
      isAuthenticated: false,
      session: null,
      achievements: [],
      preferences: {},
      goals: {
        daily_calorie_goal: 2400,
        protein_goal: 180,
        carb_goal: 180,
        fat_goal: 85,
        fiber_goal: 65
      }
    });
  }
}));

// V0.1 Helper: Simple user management (maintains current API)
export const useSimpleUser = () => {
  const store = useUserStore();
  
  return {
    user: store.user,
    goals: store.goals,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    setUser: store.setUser,
    setGoals: store.setGoals,
    updateGoal: store.updateGoal,
    setAuthenticated: store.setAuthenticated,
    completeOnboarding: store.completeOnboarding
  };
};

// V0.2+ Helper: Enhanced user features (Future)
export const useUserPersonalization = () => {
  const store = useUserStore();
  
  return {
    personalization: store.personalization,
    preferences: store.preferences,
    achievements: store.achievements,
    updatePersonalization: store.updatePersonalization,
    setPreference: store.setPreference,
    addAchievement: store.addAchievement
  };
};

// V0.2+ Helper: Session management (Future)
export const useUserSession = () => {
  const store = useUserStore();
  
  return {
    session: store.session,
    startSession: store.startSession,
    updateSessionActivity: store.updateSessionActivity,
    endSession: store.endSession
  };
};