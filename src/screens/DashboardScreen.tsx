// src/screens/DashboardScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useMealStore } from '@/stores/meal-store';
import { useUserStore } from '@/stores/user-store';
import { useAIStore } from '@/stores/ai-store';
import MacroRing from '@/components/atoms/MacroRing';
import MealCard from '@/components/molecules/MealCard';
import Button from '@/components/atoms/Button';

export default function DashboardScreen() {
  const { todaysMeals, dailyTotals, isLoading } = useMealStore();
  const { goals } = useUserStore();
  const { isProcessing, currentSystem, lastResponse } = useAIStore();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Today's Progress</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
        </View>

        <View style={styles.macroSection}>
          <Text style={styles.sectionTitle}>Daily Macros</Text>
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
              unit="g"
            />
            <MacroRing
              label="Carbs"
              current={dailyTotals.carbs}
              goal={goals.carb_goal}
              color="#45B7D1"
              unit="g"
            />
            <MacroRing
              label="Fat"
              current={dailyTotals.fat}
              goal={goals.fat_goal}
              color="#F9CA24"
              unit="g"
            />
          </View>
        </View>

        <View style={styles.mealsSection}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          {todaysMeals.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No meals logged yet today</Text>
              <Text style={styles.emptySubtext}>Use the AI Coach to log your first meal!</Text>
            </View>
          ) : (
            todaysMeals.map((meal) => (
              <MealCard 
                key={meal.id} 
                meal={meal} 
                variant="default"
                onPress={() => console.log('Meal card pressed:', meal.id)}
              />
            ))
          )}
        </View>

        <View style={styles.testSection}>
          <Button
            title="Test All Stores (Check Console)"
            onPress={() => console.log('Full State Test:', { 
              meals: { todaysMeals, dailyTotals, isLoading },
              ai: { isProcessing, currentSystem, lastResponse },
              goals
            })}
            variant="secondary"
            size="small"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#888',
  },
  macroSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  macroRings: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
  },
  testSection: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
  },
});