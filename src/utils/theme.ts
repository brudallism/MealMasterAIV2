// src/utils/theme.ts
// Meal Master AI Design System - Earth-Toned Brand

export const colors = {
  // Primary Brand Colors - Deep Forest Green
  primary: {
    50: '#F3F5F2',
    100: '#E6EBE2',
    200: '#CCD7C5',
    300: '#B3C3A8',
    400: '#99AF8B',
    500: '#213529', // Main brand color - Deep Forest
    600: '#1C2E23',
    700: '#17261D',
    800: '#121F17',
    900: '#0D1711',
  },

  // Secondary Color - Terracotta Clay
  secondary: {
    50: '#FDF6F4',
    100: '#FCEDE9',
    200: '#F8DBD3',
    300: '#F4C9BD',
    400: '#F0B7A7',
    500: '#B95D40', // Terracotta Clay
    600: '#A45539',
    700: '#8F4C32',
    800: '#7A442B',
    900: '#653B24',
  },

  // Supporting Colors
  supporting: {
    barkBrown: '#5C4033',     // Headers, sub-headers, icon outlines
    sageGreen: '#9CAF88',     // Calm accents, charts, hover borders
    goldenOchre: '#E1A948',   // Energy accent, nutrient highlights
    creamLinen: '#F3EFE9',    // Card backgrounds, floating elements
    warmBeige: '#E8DCCF',     // App background base
  },

  // Text Colors
  text: {
    primary: '#1A1410',       // Deep Brown (Almost Black) - primary text
    secondary: '#5C4033',     // Bark Brown - secondary text
    tertiary: '#9CAF88',      // Sage Green - subtle text
    inverse: '#F3EFE9',       // Cream Linen - text on dark backgrounds
  },

  // Background Colors
  background: {
    primary: '#E8DCCF',       // Warm Beige - main app background
    secondary: '#F3EFE9',     // Cream Linen - card backgrounds
    tertiary: '#FFFFFF',      // Pure white for input fields
    overlay: 'rgba(26, 20, 16, 0.5)', // Semi-transparent overlay
  },

  // Macro Ring Colors (from your specification)
  macros: {
    protein: '#213529',       // Deep Forest - Protein
    fiber: '#5C4033',         // Bark Brown - Fiber
    calories: '#9CAF88',      // Sage Green - Calories
    carbs: '#B95D40',         // Terracotta Clay - Carbs
    fats: '#E1A948',          // Golden Ochre - Fats
  },

  // Semantic Colors (earth-toned versions)
  success: {
    50: '#F1F5F0',
    100: '#E3EBE1',
    200: '#C7D7C3',
    300: '#ABC3A5',
    500: '#9CAF88',           // Sage Green for success
    600: '#8A9C78',
    700: '#788968',
    800: '#667658',
    900: '#546348',
  },

  warning: {
    50: '#FDF9F0',
    100: '#FBF3E1',
    200: '#F7E7C3',
    300: '#F3DBA5',
    500: '#E1A948',           // Golden Ochre for warnings
    600: '#CB9741',
    700: '#B5853A',
    800: '#9F7333',
    900: '#89612C',
  },

  error: {
    50: '#FDF5F3',
    100: '#FCEBE7',
    200: '#F8D7CF',
    300: '#F4C3B7',
    500: '#B95D40',           // Terracotta for errors
    600: '#A75539',
    700: '#954C32',
    800: '#83442B',
    900: '#713B24',
  },

  // Neutral Grays (warmer tones to match earth palette)
  gray: {
    50: '#F9F8F6',
    100: '#F3F1EE',
    200: '#E7E3DD',
    300: '#DBD5CC',
    400: '#B8B0A5',
    500: '#958B7E',
    600: '#766D62',
    700: '#5C544B',
    800: '#423C35',
    900: '#28241F',
  },

  // Meal Type Colors (earth-toned)
  mealTypes: {
    breakfast: '#E1A948',     // Golden Ochre - morning energy
    lunch: '#9CAF88',         // Sage Green - midday calm
    dinner: '#B95D40',        // Terracotta - evening warmth
    snack: '#5C4033',         // Bark Brown - grounding snacks
  },

  // Interactive States
  interactive: {
    hover: 'rgba(33, 53, 41, 0.2)',      // Deep Forest Green 20% opacity
    pressed: 'rgba(33, 53, 41, 0.4)',     // Deep Forest Green 40% opacity
    disabled: 0.5,                        // 50% opacity for disabled states
  },

  // Loading & Processing States
  loading: {
    spinner: '#213529',                   // Deep Forest Green
    background: '#E8DCCF',               // Warm Beige with pulse animation
    skeleton: '#F3EFE9',                 // Cream Linen with shimmer
  },

  // Calorie Target States (distinct from macro colors)
  calorieStatus: {
    withinRange: '#9CAF88',              // Sage Green (within ±100 calories)
    underTarget: '#D4A440',              // Darker Golden Ochre for low calories
    overTarget: '#C4523A',               // More vibrant/redder Terracotta for over target
  },

  // Notification & Alert Backgrounds
  notifications: {
    success: '#9CAF88',                  // Sage Green backgrounds
    warning: '#E1A948',                  // Golden Ochre backgrounds
    error: '#B95D40',                    // Terracotta Clay backgrounds
    info: '#F3EFE9',                     // Cream Linen with Deep Forest text
  },

  // Form & Input Colors
  forms: {
    validBorder: '#9CAF88',              // Sage Green for valid inputs
    invalidBorder: '#B95D40',            // Terracotta Clay for invalid inputs
    focusBorder: '#213529',              // Deep Forest Green for focus
    placeholder: 'rgba(92, 64, 51, 0.6)', // Bark Brown 60% opacity
  },

  // Legacy support for existing components
  theme: {
    teal: '#9CAF88',          // Map to Sage Green
    orange: '#E1A948',        // Map to Golden Ochre
    white: '#F3EFE9',         // Map to Cream Linen
  },
};

export const typography = {
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 36,
  },

  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Line Heights
  lineHeight: {
    tight: 16,
    normal: 20,
    relaxed: 24,
    loose: 28,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

export const borderRadius = {
  none: 0,
  sm: 4,
  base: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 50,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Common component styles with earth-toned theme
export const commonStyles = {
  // Card styles
  card: {
    backgroundColor: colors.background.secondary, // Cream Linen cards
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },

  section: {
    backgroundColor: colors.background.secondary, // Cream Linen sections
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },

  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary, // Bark Brown headers
    marginBottom: spacing.base,
  },

  // Screen layouts
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background.primary, // Warm Beige background
  },

  screenHeader: {
    backgroundColor: colors.background.secondary, // Cream Linen header
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.supporting.sageGreen + '30', // 30% opacity
  },

  screenTitle: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary, // Deep Brown titles
    marginBottom: spacing.xs,
  },

  screenSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary, // Bark Brown subtitles
  },

  // Button styles for consistent theming
  primaryButton: {
    backgroundColor: colors.primary[500], // Deep Forest Green
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },

  secondaryButton: {
    backgroundColor: colors.secondary[500], // Terracotta Clay
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },

  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary[500], // Deep Forest Green border
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Text styles
  primaryButtonText: {
    color: colors.text.inverse, // Cream Linen on dark buttons
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },

  outlineButtonText: {
    color: colors.primary[500], // Deep Forest Green
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },

  // Input styles
  textInput: {
    backgroundColor: colors.background.tertiary, // Pure white inputs
    borderWidth: 1,
    borderColor: colors.supporting.sageGreen + '50', // 50% opacity Sage Green
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },

  // Navigation styles
  tabBar: {
    backgroundColor: colors.background.secondary, // Cream Linen
    borderTopWidth: 1,
    borderTopColor: colors.supporting.sageGreen + '30',
    paddingVertical: spacing.xs,
  },

  activeTabIcon: {
    color: colors.primary[500], // Deep Forest Green for active
  },

  inactiveTabIcon: {
    color: colors.supporting.barkBrown, // Bark Brown for inactive
  },
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  commonStyles,
};