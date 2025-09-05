# Brand Design System - Meal Master AI V0.1
*Complete Visual Identity & Component Specifications - Version 1.0*

## 📋 Dependencies & References
**Referenced by other documents:**
- Technical Architecture Decisions > UI component architecture
- V0.1 MVP Definition > UI screens and component requirements
- Development Environment Setup > Component structure and implementation

**Purpose**: Comprehensive design system for consistent V0.1 implementation

---

## 🎨 Brand Foundation

### **Color Palette**
```javascript
// Primary Brand Colors
const BRAND_COLORS = {
  // Core palette
  cream: "#F4EDE4",     // App background, subtle accents
  teal: "#264653",      // Primary text, headers, navigation active
  orange: "#E76F51",    // CTA buttons, accent actions, links
  mustard: "#F4A261",   // Warning states, high values, attention
  sage: "#9BBF9B",      // Success states, positive feedback, progress
  
  // Functional colors
  white: "#FFFFFF",     // Card backgrounds, surface colors
  black: "#000000",     // High contrast text, icons
  gray: "#8E8E93",      // Secondary text, placeholders
  darkGray: "#6D6D6D",  // Tertiary text, disabled states
  lightGray: "#F2F2F7", // Subtle borders, dividers
  
  // Semantic colors (derived from brand palette)
  success: "#9BBF9B",   // sage - completed actions, positive feedback
  warning: "#F4A261",   // mustard - caution, over-target states
  error: "#E76F51",     // orange variant - errors, critical states
  info: "#264653",      // teal - informational content
}
```

### **Color Usage Guidelines**

**Primary Actions:**
- **Buttons**: Orange background with white text
- **Links**: Orange text on cream background
- **Active states**: Teal background with white text

**Status Indicators:**
- **Success**: Sage (meal logged, goal achieved)
- **Warning**: Mustard (approaching limit, requires attention)
- **Error**: Orange (failed action, validation error)
- **Neutral**: Teal (informational, default state)

**Macro Visualization:**
- **Protein**: Teal (#264653) - primary macronutrient
- **Carbs**: Orange (#E76F51) - energy source
- **Fat**: Mustard (#F4A261) - essential nutrient
- **Calories**: Sage (#9BBF9B) - overall progress

---

## 📝 Typography System

### **Font Stack**
```javascript
// React Native font configuration
const TYPOGRAPHY = {
  fontFamily: {
    system: 'System', // iOS/Android system fonts
    // Fallbacks: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto
  },
  
  fontSize: {
    // Display sizes
    largeTitle: 34,    // Screen titles, major headers
    title1: 28,        // Section headers
    title2: 22,        // Subsection headers
    title3: 20,        // Card titles
    
    // Content sizes
    headline: 17,      // Emphasized body text
    body: 17,          // Regular body text
    callout: 16,       // Secondary content
    subhead: 15,       // Supporting text
    
    // Small sizes
    footnote: 13,      // Fine print, metadata
    caption1: 12,      // Micro labels
    caption2: 11,      // Smallest readable text
  },
  
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  lineHeight: {
    tight: 1.2,       // Headers and titles
    normal: 1.4,      // Body text
    relaxed: 1.6,     // Reading-heavy content
  }
}
```

### **Typography Usage**

**Screen Headers:**
```typescript
// Good morning! - Dashboard
fontSize: 34, fontWeight: 'bold', color: teal

// Today's Progress - Section headers  
fontSize: 22, fontWeight: 'bold', color: teal

// Quick Actions - Subsection headers
fontSize: 20, fontWeight: 'semibold', color: teal
```

**Body Content:**
```typescript
// Meal descriptions, user messages
fontSize: 17, fontWeight: 'regular', color: black

// Supporting text, timestamps
fontSize: 15, fontWeight: 'regular', color: gray

// Labels and metadata  
fontSize: 13, fontWeight: 'medium', color: gray
```

---

## 📐 Spacing & Layout System

### **Spacing Scale**
```javascript
const SPACING = {
  // Base unit: 8px for consistent rhythm
  xs: 4,    // Tight spacing within components
  sm: 8,    // Small gaps, component padding
  md: 16,   // Standard padding, margins
  lg: 24,   // Section spacing
  xl: 32,   // Major layout separations
  xxl: 40,  // Screen-level spacing
}
```

### **Layout Guidelines**

**Screen Padding:**
- **Horizontal**: 16px (md) on all screens
- **Vertical**: 20px between major sections
- **Safe Areas**: Respect notch and home indicator

**Component Spacing:**
- **Card Internal Padding**: 16px (md) for content cards
- **Button Padding**: 12px vertical, 24px horizontal
- **List Item Spacing**: 8px (sm) between items
- **Section Gaps**: 24px (lg) between different content areas

**Responsive Considerations:**
- **Minimum Touch Target**: 44px height for interactive elements
- **Text Line Height**: 1.4x font size for readability
- **Visual Breathing Room**: 8px minimum around text elements

---

## 🔄 Border Radius System

### **Radius Scale**
```javascript
const BORDER_RADIUS = {
  none: 0,
  sm: 4,     // Small buttons, inputs
  md: 8,     // Medium buttons, small cards
  lg: 12,    // Standard cards, major components
  xl: 16,    // Large cards, modal containers
  xxl: 20,   // Major interface elements
  full: 9999, // Pills, chips, circular elements
}
```

### **Usage Patterns**
- **Cards**: 16px (xl) for all content cards
- **Buttons**: 12px (lg) for standard buttons
- **Input Fields**: 16px (xl) for glass input styling
- **Chips/Pills**: 9999px (full) for rounded pill shape
- **Macro Rings**: Full circle (50% border radius)

---

## 🌟 Shadow & Elevation System

### **Shadow Definitions**
```javascript
const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  soft: {
    shadowColor: '#000000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
}
```

### **Elevation Usage**
- **Cards**: Soft shadow for content cards
- **Buttons**: Subtle shadow for interactive elements
- **Modals**: Medium shadow for overlays
- **Navigation**: No shadow for bottom tab bar

---

## 🧩 Component Specifications

### **MacroRing Component**
```typescript
interface MacroRingProps {
  label: string;          // "Protein", "Carbs", "Fat"
  current: number;        // Current value in grams
  target: number;         // Target value in grams  
  color: string;          // Brand color (teal, orange, mustard)
  size?: number;          // Default: 80px
}

// Styling specifications
const MacroRingStyles = {
  container: {
    alignItems: 'center',
    width: 80,
  },
  ring: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: lightGray, // Background ring
    justifyContent: 'center',
    alignItems: 'center',
  },
  progress: {
    // SVG circle overlay with brand color
    // strokeDasharray calculated from percentage
  },
  value: {
    fontSize: 17,
    fontWeight: 'bold',
    color: teal,
  },
  label: {
    fontSize: 15,
    fontWeight: 'semibold', 
    color: teal,
    marginTop: 8,
  },
  target: {
    fontSize: 12,
    color: gray,
  }
}
```

### **MealCard Component**
```typescript
interface MealCardProps {
  meal: {
    food_name: string;
    meal_type: string;
    calories: number;
    logged_at: string;
    ai_confidence?: number;
  };
  onPress?: () => void;
}

// Styling specifications
const MealCardStyles = {
  container: {
    backgroundColor: white,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.soft,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'semibold',
    color: teal,
  },
  subtitle: {
    fontSize: 13,
    color: gray,
    marginTop: 2,
  },
  calories: {
    fontSize: 16,
    fontWeight: 'semibold',
    color: sage,
  },
  confidenceBadge: {
    backgroundColor: mustard + '20', // 20% opacity
    borderColor: mustard,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  }
}
```

### **GlassInput Component** 
```typescript
interface GlassInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onSend?: () => void;
  disabled?: boolean;
}

// Styling specifications
const GlassInputStyles = {
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    // Backdrop blur effect (platform-specific implementation)
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: teal,
    paddingRight: 12,
  },
  sendButton: {
    backgroundColor: orange,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendButtonText: {
    color: white,
    fontSize: 16,
    fontWeight: 'semibold',
  }
}
```

### **Chip Component**
```typescript
interface ChipProps {
  label: string;
  onPress?: () => void;
  variant?: 'default' | 'selected';
}

// Styling specifications
const ChipStyles = {
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selected: {
    backgroundColor: teal,
    borderColor: teal,
  },
  text: {
    fontSize: 14,
    color: teal,
    fontWeight: 'medium',
  },
  selectedText: {
    color: white,
  }
}
```

### **Button Component**
```typescript
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

// Styling specifications
const ButtonStyles = {
  primary: {
    backgroundColor: orange,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    ...SHADOWS.subtle,
  },
  secondary: {
    backgroundColor: white,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: lightGray,
    ...SHADOWS.subtle,
  },
  ghost: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  primaryText: {
    color: white,
    fontSize: 16,
    fontWeight: 'semibold',
    textAlign: 'center',
  },
  secondaryText: {
    color: teal,
    fontSize: 16,
    fontWeight: 'semibold', 
    textAlign: 'center',
  }
}
```

---

## 🔄 Animation & Interaction

### **Transition Standards**
```javascript
const ANIMATIONS = {
  // Duration standards
  fast: 200,     // Quick feedback (button press)
  normal: 300,   // Standard transitions (screen changes)
  slow: 500,     // Emphasis animations (success states)
  
  // Easing functions
  easeOut: 'ease-out',        // UI element exits
  easeIn: 'ease-in',          // UI element entrances  
  easeInOut: 'ease-in-out',   // Smooth bidirectional
  
  // Common animations
  fadeIn: {
    opacity: [0, 1],
    duration: 300,
    easing: 'ease-out',
  },
  slideUp: {
    transform: [{ translateY: 20 }, { translateY: 0 }],
    opacity: [0, 1],
    duration: 300,
    easing: 'ease-out',
  },
  scaleIn: {
    transform: [{ scale: 0.95 }, { scale: 1 }],
    duration: 200,
    easing: 'ease-out',
  }
}
```

### **Interaction States**
```javascript
const INTERACTION_STATES = {
  // Button states
  buttonPress: {
    scale: 0.98,
    duration: 100,
  },
  
  // Loading states
  pulse: {
    opacity: [1, 0.6, 1],
    duration: 1500,
    repeat: -1,
  },
  
  // Success feedback
  checkmark: {
    scale: [0, 1.2, 1],
    duration: 400,
    easing: 'ease-out',
  }
}
```

---

## 📱 Platform-Specific Considerations

### **iOS Adaptations**
- Use system font weights (San Francisco)
- Respect safe area insets for notched devices
- Follow iOS navigation patterns for tab bar
- Use native haptic feedback for interactions

### **Android Adaptations**  
- Use system font (Roboto) with appropriate weights
- Implement material design elevation properly
- Respect Android navigation gestures
- Use platform-appropriate status bar styling

### **Accessibility Standards**
- Minimum 44px touch targets for all interactive elements
- Text contrast ratio 4.5:1 minimum (WCAG AA)
- Support for screen readers with semantic labels
- Respect user's preferred text size settings
- Focus indicators for keyboard navigation

---

## 🎯 Implementation Checklist

### **Colors**
- [ ] Define brand color constants in theme file
- [ ] Create semantic color mapping (success, warning, error)
- [ ] Test color contrast ratios for accessibility
- [ ] Implement dark mode variants (if planned for V0.2+)

### **Typography**
- [ ] Set up font family with system fallbacks
- [ ] Define font scale with consistent line heights
- [ ] Test typography across different screen sizes
- [ ] Ensure readability on brand background colors

### **Components**
- [ ] Build atomic design component library
- [ ] Implement consistent shadow/elevation system
- [ ] Create reusable animation helpers
- [ ] Test components across iOS and Android

### **Layout**
- [ ] Establish spacing constants and usage patterns
- [ ] Implement responsive layout helpers
- [ ] Test safe area handling on various devices
- [ ] Ensure touch targets meet accessibility standards

---

*This design system provides the complete visual foundation for implementing Meal Master AI V0.1 with consistent, scalable, and accessible user interface components.*