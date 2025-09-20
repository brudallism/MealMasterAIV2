# Source Sans Pro Font Implementation

## Setup Complete ✅

The Source Sans Pro font implementation is ready! Here's what has been configured:

### 1. Project Structure Created
- `assets/fonts/` directory created
- `react-native.config.js` configured for font linking
- Theme updated with Source Sans Pro font families

### 2. Theme Configuration Updated
The `src/utils/theme.ts` file now includes:
```typescript
fontFamily: {
  primary: 'SourceSansPro-Regular',
  medium: 'SourceSansPro-SemiBold',
  bold: 'SourceSansPro-Bold',
  system: 'System', // Fallback to system font
}
```

### 3. Common Styles Updated
All text styles now include appropriate font families:
- Titles use `typography.fontFamily.bold`
- Headers use `typography.fontFamily.medium`
- Body text uses `typography.fontFamily.primary`

## Required Action: Download Font Files

**You need to manually download the Source Sans Pro TTF files:**

1. Go to [Google Fonts - Source Sans Pro](https://fonts.google.com/specimen/Source+Sans+Pro)
2. Click "Download family"
3. Extract these 3 TTF files to `assets/fonts/`:
   - `SourceSansPro-Regular.ttf`
   - `SourceSansPro-SemiBold.ttf`
   - `SourceSansPro-Bold.ttf`

## Final Steps After Adding Font Files

Once you've added the font files, run these commands:

```bash
# Link fonts to iOS/Android (React Native 0.69+)
npx react-native-asset

# Clean and rebuild
npm start -- --reset-cache

# For iOS (if using simulator)
npx react-native run-ios

# For Android
npx react-native run-android
```

## Usage in Components

Use the typography object from theme:
```typescript
import { typography } from '@/utils/theme';

const styles = StyleSheet.create({
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
  },
  body: {
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.base,
  }
});
```

## Fallback Behavior

If Source Sans Pro fonts aren't found, the app will gracefully fall back to the system font (San Francisco on iOS, Roboto on Android).