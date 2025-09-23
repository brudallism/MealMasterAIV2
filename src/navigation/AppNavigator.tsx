// src/navigation/AppNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles, colors, spacing } from '@/utils/theme';

import DashboardScreen from '@/screens/DashboardScreen';
import PlansScreen from '@/screens/PlansScreen';
import SearchScreen from '@/screens/SearchScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import MicronutrientSelectionScreen from '@/screens/MicronutrientSelectionScreen';
import { DietAllergiesScreen } from '@/screens/DietAllergiesScreen';
import RecipeDetailScreen from '@/screens/RecipeDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tab Navigator component
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Plans') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: commonStyles.activeTabIcon.color,
        tabBarInactiveTintColor: commonStyles.inactiveTabIcon.color,
        tabBarStyle: {
          ...commonStyles.tabBar,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ tabBarLabel: 'Search' }}
      />
      <Tab.Screen
        name="Plans"
        component={PlansScreen}
        options={{ tabBarLabel: 'Meal Plans' }}
      />
    </Tab.Navigator>
  );
}

// Root Stack Navigator
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Main App (Tabs) */}
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
        />

        {/* Settings Stack */}
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            headerShown: true,
            title: 'Settings',
            headerStyle: {
              backgroundColor: '#FFFFFF',
            },
            headerTintColor: '#111827',
            headerTitleStyle: {
              fontWeight: '600',
            },
          }}
        />

        <Stack.Screen
          name="MicronutrientSelection"
          component={MicronutrientSelectionScreen}
          options={{
            headerShown: false, // MicronutrientSelectionScreen has its own header
          }}
        />

        <Stack.Screen
          name="DietAllergies"
          component={DietAllergiesScreen}
          options={{
            headerShown: false, // DietAllergiesScreen has its own header
          }}
        />

        <Stack.Screen
          name="RecipeDetail"
          component={RecipeDetailScreen}
          options={{
            headerShown: false, // RecipeDetailScreen has its own header
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}