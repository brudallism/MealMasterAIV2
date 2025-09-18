// src/stores/user-store.ts
import { create } from 'zustand';

// V0.1 Core User Data Types
interface UserGoals {
  daily_calorie_goal: number;
  protein_goal: number;
  carb_goal: number;
  fat_goal: number;
  
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
  gender?: 'male' | 'female' | 'other';
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
  
  // V0.1 Core Actions
  setUser: (user: User | null) => void;
  setGoals: (goals: UserGoals) => void;
  updateGoal: (key: keyof UserGoals, value: number) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  completeOnboarding: () => void;
  
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
  
  // V0.3+ Advanced Actions (Future)
  syncHealthData: (source: string, data: any) => void;
  updateSubscription: (status: User['subscription_status']) => void;
  exportUserData: () => Promise<any>;
  deleteUserData: () => Promise<void>;

  // Privacy Consent Functions
  needsPrivacyConsent: boolean;
  hasValidConsent: () => boolean;
  setPrivacyConsents: (consents: any) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  // V0.1 Core State
  user: null,
  goals: {
    daily_calorie_goal: 2000,
    protein_goal: 150,
    carb_goal: 200,
    fat_goal: 65
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
  
  updateProfile: (updates: Partial<User>) => set((state) => ({
    user: state.user ? { ...state.user, ...updates } : null
  })),
  
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
        daily_calorie_goal: 2000,
        protein_goal: 150,
        carb_goal: 200,
        fat_goal: 65
      }
    });
  },

  // Privacy Consent Implementation
  needsPrivacyConsent: false,

  hasValidConsent: () => {
    const state = get();
    const consents = state.preferences.privacyConsents;
    if (!consents || !consents.timestamp) return false;

    // Check if consent is less than 12 months old
    const consentDate = new Date(consents.timestamp);
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

    return consentDate > twelveMonthsAgo && consents.analytics === true;
  },

  setPrivacyConsents: (consents: any) => set((state) => ({
    preferences: {
      ...state.preferences,
      privacyConsents: {
        ...consents,
        timestamp: new Date().toISOString()
      }
    },
    needsPrivacyConsent: false
  }))
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