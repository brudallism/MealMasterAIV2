// src/screens/PlansScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MealPlanCard from '@/components/molecules/MealPlanCard';
import Button from '@/components/atoms/Button';

// Sample meal plans data
const sampleMealPlans = [
  {
    id: '1',
    name: 'High Protein Strength',
    description: 'Perfect for muscle building and strength training with 150g+ protein daily',
    totalCalories: 2200,
    totalProtein: 165,
    totalCarbs: 180,
    totalFat: 85,
    meals: {
      breakfast: [
        { id: '1', name: 'Greek Yogurt Bowl', emoji: '🥣', calories: 320, protein: 25, carbs: 35, fat: 8, portion: '1 cup' },
        { id: '2', name: 'Berries & Nuts', emoji: '🫐', calories: 150, protein: 4, carbs: 20, fat: 8, portion: '1/2 cup mix' },
      ],
      lunch: [
        { id: '3', name: 'Grilled Chicken', emoji: '🐔', calories: 400, protein: 45, carbs: 0, fat: 12, portion: '150g' },
        { id: '4', name: 'Quinoa Salad', emoji: '🥗', calories: 280, protein: 12, carbs: 45, fat: 8, portion: '1 cup' },
      ],
      dinner: [
        { id: '5', name: 'Salmon Fillet', emoji: '🐟', calories: 350, protein: 40, carbs: 0, fat: 20, portion: '140g' },
        { id: '6', name: 'Sweet Potato', emoji: '🍠', calories: 180, protein: 4, carbs: 40, fat: 0, portion: '1 medium' },
      ],
      snacks: [
        { id: '7', name: 'Protein Shake', emoji: '🥤', calories: 280, protein: 35, carbs: 20, fat: 6, portion: '1 scoop + milk' },
      ],
    },
    tags: ['High Protein', 'Muscle Building', 'Strength Training'],
    difficulty: 'Medium' as const,
    prepTime: '45 min/day',
  },
  {
    id: '2',
    name: 'Balanced Wellness',
    description: 'Well-rounded nutrition for general health and wellness',
    totalCalories: 1800,
    totalProtein: 120,
    totalCarbs: 200,
    totalFat: 65,
    meals: {
      breakfast: [
        { id: '8', name: 'Oatmeal Bowl', emoji: '🥣', calories: 300, protein: 12, carbs: 55, fat: 6, portion: '1 cup' },
        { id: '9', name: 'Fresh Fruit', emoji: '🍌', calories: 100, protein: 1, carbs: 25, fat: 0, portion: '1 medium' },
      ],
      lunch: [
        { id: '10', name: 'Turkey Wrap', emoji: '🌯', calories: 420, protein: 28, carbs: 45, fat: 18, portion: '1 large wrap' },
        { id: '11', name: 'Mixed Vegetables', emoji: '🥬', calories: 80, protein: 3, carbs: 15, fat: 1, portion: '1 cup' },
      ],
      dinner: [
        { id: '12', name: 'Lean Beef', emoji: '🥩', calories: 300, protein: 35, carbs: 0, fat: 15, portion: '120g' },
        { id: '13', name: 'Brown Rice', emoji: '🍚', calories: 220, protein: 5, carbs: 45, fat: 2, portion: '1 cup' },
      ],
      snacks: [
        { id: '14', name: 'Almonds', emoji: '🥜', calories: 160, protein: 6, carbs: 6, fat: 14, portion: '1 oz' },
        { id: '15', name: 'Apple', emoji: '🍎', calories: 80, protein: 0, carbs: 20, fat: 0, portion: '1 medium' },
      ],
    },
    tags: ['Balanced', 'Wellness', 'General Health'],
    difficulty: 'Easy' as const,
    prepTime: '30 min/day',
  },
];

export default function PlansScreen() {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filters = [
    { id: 'all', name: 'All Plans', icon: '🍽️' },
    { id: 'protein', name: 'High Protein', icon: '💪' },
    { id: 'balanced', name: 'Balanced', icon: '⚖️' },
    { id: 'weight-loss', name: 'Weight Loss', icon: '📉' },
  ];

  const handleSelectPlan = (plan: any) => {
    Alert.alert(
      'Use Meal Plan',
      `Would you like to start using "${plan.name}" for your meal planning?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Use Plan',
          onPress: () => {
            Alert.alert('Success', 'Meal plan activated! Your dashboard will now show progress toward this plan.');
          },
        },
      ]
    );
  };

  const handlePreviewPlan = (plan: any) => {
    Alert.alert(
      'Meal Plan Preview',
      `${plan.name}\n\nDaily Totals:\n• ${plan.totalCalories} calories\n• ${plan.totalProtein}g protein\n• ${plan.totalCarbs}g carbs\n• ${plan.totalFat}g fat\n\nThis is a preview - full meal details coming soon!`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Meal Plans</Text>
        <Text style={styles.subtitle}>Choose a plan that fits your goals</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContainer}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterButton,
              selectedFilter === filter.id && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Text style={styles.filterEmoji}>{filter.icon}</Text>
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter.id && styles.filterTextActive,
              ]}
            >
              {filter.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {sampleMealPlans.map((plan) => (
          <MealPlanCard
            key={plan.id}
            plan={plan}
            onSelect={handleSelectPlan}
            onPreview={handlePreviewPlan}
          />
        ))}

        <View style={styles.createPlanSection}>
          <View style={styles.createPlanCard}>
            <Ionicons name="add-circle-outline" size={48} color="#4F46E5" />
            <Text style={styles.createPlanTitle}>Create Custom Plan</Text>
            <Text style={styles.createPlanDescription}>
              Build your own meal plan with personalized goals and preferences
            </Text>
            <Button
              title="Coming Soon"
              onPress={() => Alert.alert('Coming Soon', 'Custom meal plan creation will be available in a future update!')}
              variant="secondary"
              size="small"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  filtersScroll: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#4F46E5',
  },
  filterEmoji: {
    fontSize: 16,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  createPlanSection: {
    marginVertical: 20,
  },
  createPlanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  createPlanTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  createPlanDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  // Remove unused styles
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  featureText: {
    fontSize: 15,
    color: '#555',
    flex: 1,
    lineHeight: 20,
  },
});