# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm start` or `yarn start` - Start Expo development server
- `npm run android` or `yarn android` - Start on Android device/emulator
- `npm run ios` or `yarn ios` - Start on iOS simulator
- `npm run web` or `yarn web` - Start web version

### Code Quality
The project uses TypeScript with strict mode enabled. ESLint and Prettier are configured but commands are not defined in package.json - check if they need to be added.

## Architecture Overview

### Technology Stack
- **Framework**: React Native with Expo (~53.0.22)
- **Navigation**: Expo Router with React Navigation bottom tabs
- **State Management**: Zustand for global state
- **Data Fetching**: TanStack React Query
- **Chat Interface**: React Native Gifted Chat
- **AI Integration**: OpenAI SDK
- **Secure Storage**: Expo Secure Store
- **Language**: TypeScript with strict mode

### Project Structure
```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components
├── services/       # API services and integrations
├── stores/         # Zustand stores
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

### Path Aliases
TypeScript is configured with path aliases:
- `@/*` → `src/*`
- `@/components/*` → `src/components/*`
- `@/screens/*` → `src/screens/*`
- `@/stores/*` → `src/stores/*`
- `@/services/*` → `src/services/*`
- `@/types/*` → `src/types/*`
- `@/utils/*` → `src/utils/*`

### AI System Architecture
This is an AI-powered meal tracking application following a multi-agent AI architecture. Key principles from the technical documentation:

- **Defensive-First Design**: 90% prevention, 10% instruction
- **Structured AI Communication**: Binary rules over subjective guidelines
- **Context-Aware Systems**: State management for AI operations
- **Direct OpenAI Integration**: Full control over AI behavior and costs

### Current Status
The codebase appears to be in initial setup phase:
- Basic Expo app structure is present
- Dependencies for AI integration, state management, and UI are configured
- Source directory structure exists but appears empty
- Comprehensive technical documentation exists in `docs/` folder

### Documentation
Extensive project documentation is available in the `docs/` directory, including:
- AI System Design Technical Architecture
- Core Food Tracking specifications
- Data Architecture best practices
- Development environment setup guides
- Brand design system

## Platform Configuration
- **iOS Bundle ID**: com.mealmaster.ai
- **Android Package**: com.mealmaster.ai
- **Expo Plugins**: expo-router, expo-secure-store