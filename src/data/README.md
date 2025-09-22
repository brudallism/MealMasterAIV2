# Mock Data System

This directory contains the centralized mock data system for testing and development.

## Files
- `mock-data.ts` - Contains realistic USDA food data and 4-day meal mock data

## Features
- **Real USDA nutrition data** - All nutrition values (macros + micronutrients) are based on actual USDA food database entries
- **4-day meal simulation** - Provides meal data for day before yesterday, yesterday, today, and tomorrow (dynamically calculated relative to current date)
- **Realistic micronutrient tracking** - Accurate micronutrient values that correspond to the mock meals
- **Easy removal** - Can be disabled for production by setting `ENABLE_MOCK_DATA = false`

## Mock Data Includes
- **Day before yesterday**: Partial day (breakfast only)
- **Yesterday**: Complete day (breakfast, lunch, dinner)
- **Today**: Partial day (breakfast only)
- **Tomorrow**: Empty day

## Foods Used (with real USDA IDs)
- Oatmeal (USDA 20033)
- Banana (USDA 09040)
- Chicken Breast (USDA 05062)
- Brown Rice (USDA 20037)
- Broccoli (USDA 11090)
- Salmon (USDA 15076)
- Sweet Potato (USDA 11507)
- Almonds (USDA 12061)
- Greek Yogurt (USDA 01256)

## User Profile
- **Calories**: 2400
- **Protein**: 180g
- **Carbs**: 180g
- **Fat**: 85g
- **Fiber**: 65g

## Removing for Production

To disable mock data for production:

1. Set `ENABLE_MOCK_DATA = false` in `mock-data.ts`
2. Or remove the mock data initialization calls from `App.tsx`
3. Or delete this entire `src/data/` directory

The app will continue to work normally without any mock data.